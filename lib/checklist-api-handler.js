/**
 * Optional save / report for the end of tenancy checklist.
 * Missing Blobs, SMTP, Dilvon or Supabase must not 500.
 * Live Dilvon sends run only when DILVON_SEND_ENABLED is true AND DILVON_DOMESTIC_API_KEY is set.
 * The key never leaves the server.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const checklist = require('../data/eot-checklist');
const mailer = require('./mailer');
const { SITE_URL } = require('./site-config');

const RETENTION_DAYS = 365;
const COMPANY_ID = '625a39b1-fe35-4f0d-8770-f2b3538023b9';
const SENDER_PROFILE_ID = 'adda94ca-9849-419c-aecb-fe1d742daa72';
const SENDER_NAME = 'SN Cleaning';
const COMPANY_MAILBOX = 'sales@sncleaningservices.co.uk';
const OFFICE = 'info@sncleaningservices.co.uk';
const BOOK = 'https://app.sncleaningservices.co.uk/book/sn-cleaning-services/end-of-tenancy-cleaning';
const EMAIL_SUBJECT = 'Your end of tenancy cleaning checklist report';
const ID_RE = /^[A-Za-z0-9_-]{8,40}$/;

const OFF_MESSAGE = 'Your ticks are saved on this device. The printable PDF is ready to download. Email and text delivery is not switched on yet.';

function json(code, obj, extraHeaders) {
  return {
    statusCode: code,
    headers: Object.assign({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    }, extraHeaders || {}),
    body: JSON.stringify(obj)
  };
}

function html(code, body) {
  return {
    statusCode: code,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow'
    },
    body
  };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendEnabled() {
  const flag = String(process.env.DILVON_SEND_ENABLED || '').trim().toLowerCase();
  return (flag === 'true' || flag === '1' || flag === 'yes') && !!process.env.DILVON_DOMESTIC_API_KEY;
}

function clean(v, n) {
  return String(v == null ? '' : v).trim().slice(0, n || 200);
}

function digits(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.indexOf('00') === 0) d = d.slice(2);
  if (d.indexOf('0') === 0) d = '44' + d.slice(1);
  return d;
}

function validEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validPostcode(postcode) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode);
}

function readBody(event) {
  let raw = event.body || '';
  if (event.isBase64Encoded) {
    try { raw = Buffer.from(raw, 'base64').toString('utf8'); } catch (e) { raw = ''; }
  }
  if (raw && raw.charAt(0) === '{') {
    try { return { data: JSON.parse(raw), json: true }; } catch (e) { /* form body below */ }
  }
  const params = new URLSearchParams(raw);
  if ([...params.keys()].length) {
    const on = (name) => {
      const v = params.get(name);
      return v === 'on' || v === 'yes' || v === 'true';
    };
    return {
      json: false,
      data: {
        name: params.get('name'),
        email: params.get('email'),
        phone: params.get('phone'),
        postcode: params.get('postcode'),
        marketing: on('marketing'),
        sms: on('sms'),
        company_website: params.get('company_website') || '',
        tasks: {},
        notes: {}
      }
    };
  }
  return { data: {}, json: true };
}

function respond(code, obj, asJson) {
  if (asJson !== false) return json(code, obj);
  const text = obj.message || obj.error || OFF_MESSAGE;
  const link = obj.reportUrl ? `<p><a href="${esc(obj.reportUrl)}">Open your private report</a></p>` : '';
  return html(code, `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Checklist</title></head><body><p>${esc(text)}</p>${link}<p><a href="/end-of-tenancy-cleaning-checklist/">Back to the checklist</a></p></body></html>`);
}

async function blobStore() {
  try {
    const { getStore } = require('@netlify/blobs');
    return getStore({ name: 'eot-checklists', consistency: 'strong' });
  } catch (e) {
    return null;
  }
}

async function blobGet(key) {
  try {
    const store = await blobStore();
    if (!store) return null;
    return await store.get(key, { type: 'json' });
  } catch (e) {
    return null;
  }
}

async function blobSet(key, value) {
  try {
    const store = await blobStore();
    if (!store) return false;
    await store.setJSON(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

async function saveSupabase(row) {
  const key = process.env.SUPABASE_WEBSITE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || 'https://dkomihipebixlegygnoy.supabase.co';
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await sb.from('eot_checklists').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (e) {
    return false;
  }
}

async function loadRow(id) {
  if (!ID_RE.test(id)) return null;
  const fromBlob = await blobGet('row:' + id);
  if (fromBlob && fromBlob.id) return fromBlob;
  const key = process.env.SUPABASE_WEBSITE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || 'https://dkomihipebixlegygnoy.supabase.co';
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.from('eot_checklists').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function sanitiseTasks(input) {
  const tasks = {};
  const src = input && typeof input === 'object' ? input : {};
  Object.keys(src).forEach((id) => {
    if (!checklist.TASK_IDS.has(id)) return;
    const row = src[id] || {};
    tasks[id] = { done: !!row.done, checkin: !!row.checkin, photo: !!row.photo };
  });
  return tasks;
}

function sanitiseNotes(input) {
  const notes = {};
  const src = input && typeof input === 'object' ? input : {};
  Object.keys(src).forEach((key) => {
    if (!checklist.ROOM_KEYS.has(key)) return;
    notes[key] = clean(src[key], 2000);
  });
  return notes;
}

async function optedOut(phone) {
  const d = digits(phone);
  if (!d) return false;
  const list = await blobGet('sms-opt-outs');
  return Array.isArray(list) && list.indexOf(d) !== -1;
}

async function recordOptOut(phone) {
  const d = digits(phone);
  if (!d) return;
  const list = (await blobGet('sms-opt-outs')) || [];
  const next = Array.isArray(list) ? list.slice() : [];
  if (next.indexOf(d) === -1) next.push(d);
  await blobSet('sms-opt-outs', next);
}

async function dilvonTool(tool, args) {
  if (!sendEnabled()) return { ok: false, skipped: true };
  const key = process.env.DILVON_DOMESTIC_API_KEY;
  const url = process.env.DILVON_DOMESTIC_API_URL || 'https://auth.dilvon.com/functions/v1/domestic-tool';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + key,
      'x-dilvon-key': key
    },
    body: JSON.stringify({
      company_id: COMPANY_ID,
      sender: SENDER_NAME,
      mailbox: COMPANY_MAILBOX,
      tool,
      args
    })
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = null; }
  return { ok: res.ok, status: res.status, data };
}

function splitName(name) {
  const parts = clean(name, 80).split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
}

function reportUrl(id) {
  return SITE_URL + '/checklist/report/' + id + '/';
}

function emailBody(url) {
  const lines = [
    'Thank you. Your end of tenancy cleaning checklist is saved.',
    ''
  ];
  if (url) lines.push('Your private report: ' + url, '');
  lines.push(
    'The printable PDF: ' + SITE_URL + checklist.PDF_PATH,
    '',
    'If you would like us to do the clean: ' + BOOK,
    '',
    'We keep your details for 12 months, then delete them. To delete them sooner, or to opt out of emails or texts, email ' + OFFICE + '.'
  );
  return lines.join('\n');
}

async function deliver(row) {
  const result = { customer: false, sms: false, email: false, office: false, skipped: !sendEnabled() };
  if (!sendEnabled()) return result;
  const names = splitName(row.name);
  let customerId = null;
  try {
    const created = await dilvonTool('create_or_update_customer', {
      first_name: names.first_name,
      last_name: names.last_name,
      email: row.email,
      phone: row.phone || '',
      postcode: row.postcode,
      source: 'End of tenancy checklist',
      campaign: 'eot-checklist'
    });
    const data = created.data || {};
    customerId = data.customer_id || data.id || (data.customer && (data.customer.id || data.customer.customer_id)) || null;
    result.customer = !!created.ok;
    if (data.sms_opt_out || data.opted_out) await recordOptOut(row.phone);
  } catch (e) {
    result.customer = false;
  }

  if (row.sms && row.phone) {
    try {
      const stopped = await optedOut(row.phone);
      if (!stopped) {
        const sms = await dilvonTool('send_sms', {
          customer_id: customerId || undefined,
          to: row.phone,
          message: (row.report_url ? 'Your end of tenancy cleaning checklist: ' + row.report_url + ' ' : 'Your end of tenancy cleaning checklist is saved with SN Cleaning. ') + 'Reply STOP to opt out'
        });
        result.sms = !!sms.ok;
      }
    } catch (e) {
      result.sms = false;
    }
  }

  const body = emailBody(row.report_url);
  let emailed = false;
  try {
    const sent = await dilvonTool('send_email', {
      sender_profile_id: SENDER_PROFILE_ID,
      to: row.email,
      customer_id: customerId || undefined,
      subject: EMAIL_SUBJECT,
      body,
      include_signature: true
    });
    emailed = !!sent.ok;
  } catch (e) {
    emailed = false;
  }
  if (!emailed) {
    const pdf = path.join(__dirname, '../public/downloads/sn-cleaning-end-of-tenancy-checklist.pdf');
    const attachments = fs.existsSync(pdf) ? [{ filename: 'sn-cleaning-end-of-tenancy-checklist.pdf', path: pdf }] : undefined;
    emailed = await mailer.send({ to: row.email, subject: EMAIL_SUBJECT, text: body, replyTo: OFFICE, attachments });
  }
  result.email = !!emailed;

  const officeSubject = 'New end of tenancy checklist lead: ' + row.postcode;
  const officeText = [
    'Name: ' + row.name,
    'Email: ' + row.email,
    'Phone: ' + (row.phone || 'not given'),
    'Postcode: ' + row.postcode,
    'Marketing consent: ' + (row.marketing ? 'yes' : 'no'),
    'SMS consent: ' + (row.sms ? 'yes' : 'no'),
    row.report_url ? 'Report: ' + row.report_url : 'Report: not stored',
    row.marketing ? '' : 'Do not email a quote. The marketing box was left unticked.'
  ].filter(Boolean).join('\n');
  result.office = await mailer.send({ to: process.env.CONTACT_TO || OFFICE, subject: officeSubject, text: officeText, replyTo: row.email });
  return result;
}

function notFoundHtml() {
  return html(404, `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Report not found</title></head><body><p>We couldn't find that checklist report. The link may be wrong, or it may already have been deleted.</p><p><a href="/end-of-tenancy-cleaning-checklist/">Back to the checklist</a></p></body></html>`);
}

async function renderReport(id) {
  const row = await loadRow(id);
  if (!row) return notFoundHtml();
  const saved = row.created_at ? new Date(row.created_at) : new Date();
  const savedLabel = saved.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  try {
    const body = await ejs.renderFile(path.join(__dirname, '../views/eot-checklist-report.ejs'), {
      rooms: checklist.rooms,
      groupsOf: checklist.groupsOf,
      tasks: row.tasks || {},
      notes: row.notes || {},
      name: row.name || 'you',
      postcode: row.postcode || '',
      savedLabel,
      book: BOOK
    });
    return html(200, body);
  } catch (e) {
    return html(200, `<!DOCTYPE html><html lang="en-GB"><head><meta name="robots" content="noindex, nofollow"><title>Your checklist report</title></head><body><p>Your checklist was saved${row.postcode ? ' for ' + esc(row.postcode) : ''}.</p><p><a href="/end-of-tenancy-cleaning-checklist/">Back to the checklist</a></p></body></html>`);
  }
}

async function handler(event) {
  try {
    if (event && event.blobs) {
      try { require('@netlify/blobs').connectLambda(event); } catch (e) { /* local */ }
    }
    const q = event.queryStringParameters || {};
    if (q.report) return await renderReport(String(q.report));

    if ((event.httpMethod || 'GET').toUpperCase() === 'GET') {
      if (q.id) {
        const row = await loadRow(String(q.id));
        if (!row) return json(404, { ok: false, error: 'Report not found' });
        return json(200, { ok: true, id: row.id, reportUrl: reportUrl(row.id) });
      }
      return json(200, { ok: true, delivery: sendEnabled() ? 'ready' : 'off' });
    }

    if ((event.httpMethod || '').toUpperCase() !== 'POST') {
      return json(200, { ok: true, delivery: 'off', message: OFF_MESSAGE });
    }

    const parsed = readBody(event);
    const b = parsed.data || {};
    if (clean(b.company_website || b.website, 200)) {
      return respond(200, { ok: true, message: OFF_MESSAGE }, parsed.json);
    }

    const action = clean(b.action, 40);
    if (action === 'sms-stop' || /^stop$/i.test(clean(b.message, 20))) {
      await recordOptOut(b.phone || b.to || '');
      return respond(200, { ok: true, optedOut: true, message: 'We will not text this number again.' }, parsed.json);
    }

    const name = clean(b.name, 80);
    const email = clean(b.email, 200);
    const phone = clean(b.phone, 40);
    const postcode = clean(b.postcode, 12).toUpperCase();
    const marketing = b.marketing === true || b.marketing === 'yes' || b.marketing === 'on';
    const sms = b.sms === true || b.sms === 'yes' || b.sms === 'on';

    if (!name || !validEmail(email) || !validPostcode(postcode)) {
      return respond(400, { ok: false, error: 'Please add your name, a valid email and a full UK postcode.' }, parsed.json);
    }
    if (sms && digits(phone).length < 10) {
      return respond(400, { ok: false, error: 'Add a phone number if you would like the report by text.' }, parsed.json);
    }

    const now = new Date();
    const retain = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const id = crypto.randomBytes(9).toString('base64url');
    const tasks = sanitiseTasks(b.tasks);
    const notes = sanitiseNotes(b.notes);
    const row = {
      id,
      action: 'eot-checklist',
      created_at: now.toISOString(),
      retain_until: retain.toISOString(),
      name,
      email,
      phone,
      postcode,
      marketing: !!marketing,
      sms: !!sms,
      tasks,
      notes
    };

    const blobOk = await blobSet('row:' + id, row);
    const dbOk = await saveSupabase(row);
    if (blobOk || dbOk) row.report_url = reportUrl(id);

    let delivery = { skipped: true };
    if (sendEnabled()) {
      try { delivery = await deliver(row); } catch (e) { delivery = { skipped: false, email: false, sms: false }; }
    }

    let message = OFF_MESSAGE;
    if (sendEnabled() && delivery.email) {
      message = 'Your checklist is saved. We have emailed the private link' + (sms && delivery.sms ? ' and sent the text.' : '.');
    } else if (sendEnabled()) {
      message = 'Your checklist is saved on this device. We could not send the email just now. The printable PDF is ready to download.';
    }
    if (row.report_url && !sendEnabled()) {
      message = 'Your ticks are saved on this device, and a private link is ready below. The printable PDF is ready to download. Email and text delivery is not switched on yet, so we have not sent it.';
    }

    return respond(200, {
      ok: true,
      id: row.report_url ? id : undefined,
      reportUrl: row.report_url || null,
      delivery: sendEnabled() ? 'on' : 'off',
      emailed: !!delivery.email,
      message
    }, parsed.json);
  } catch (err) {
    console.error('checklist api:', err && err.message ? err.message : 'failed');
    return json(200, { ok: true, delivery: 'off', savedOnDevice: true, message: OFF_MESSAGE });
  }
}

module.exports = { handler, RETENTION_DAYS, sendEnabled, OFF_MESSAGE };
