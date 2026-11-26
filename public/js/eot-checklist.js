/* End of tenancy checklist. Ticks and notes stay in this browser. No secrets. */
(function () {
  var KEY = 'sn-eot-checklist-v1';
  var root = document.getElementById('eot-checklist');
  if (!root) return;

  var total = root.querySelectorAll('input[data-kind="done"]').length;
  var progressText = document.getElementById('ec-progress-text');
  var progressBar = document.getElementById('ec-progress-bar');
  var form = document.getElementById('ec-form');
  var msg = document.getElementById('ec-form-msg');

  function readStore() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return { tasks: {}, notes: {} };
      return { tasks: data.tasks || {}, notes: data.notes || {} };
    } catch (e) {
      return { tasks: {}, notes: {} };
    }
  }

  function writeStore() {
    var tasks = {};
    root.querySelectorAll('.ec-task').forEach(function (row) {
      var id = row.getAttribute('data-task');
      if (!id) return;
      var state = {};
      row.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
        state[box.getAttribute('data-kind')] = box.checked;
      });
      tasks[id] = state;
    });
    var notes = {};
    root.querySelectorAll('textarea[data-room]').forEach(function (el) {
      notes[el.getAttribute('data-room')] = el.value;
    });
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, tasks: tasks, notes: notes })); } catch (e) {}
    return { tasks: tasks, notes: notes };
  }

  function paint() {
    var done = root.querySelectorAll('input[data-kind="done"]:checked').length;
    if (progressText) progressText.textContent = done + ' of ' + total + ' done';
    if (progressBar) {
      progressBar.style.width = (total ? Math.round((done / total) * 100) : 0) + '%';
      var bar = progressBar.parentNode;
      if (bar) bar.setAttribute('aria-valuenow', String(done));
    }
  }

  var saved = readStore();
  root.querySelectorAll('.ec-task').forEach(function (row) {
    var id = row.getAttribute('data-task');
    var state = saved.tasks[id] || {};
    row.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
      var kind = box.getAttribute('data-kind');
      box.checked = !!state[kind];
    });
  });
  root.querySelectorAll('textarea[data-room]').forEach(function (el) {
    var note = saved.notes[el.getAttribute('data-room')];
    if (typeof note === 'string') el.value = note;
  });
  paint();

  root.addEventListener('change', function (e) {
    if (e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches('textarea'))) {
      writeStore();
      paint();
    }
  });
  root.addEventListener('input', function (e) {
    if (e.target && e.target.matches('textarea')) writeStore();
  });

  var printBtn = document.getElementById('ec-print');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (msg) msg.textContent = '';
    if (!form.reportValidity()) return;
    var state = writeStore();
    var body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      postcode: form.postcode.value.trim(),
      marketing: !!form.marketing.checked,
      sms: !!form.sms.checked,
      company_website: form.company_website ? form.company_website.value : '',
      tasks: state.tasks,
      notes: state.notes
    };
    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    fetch('/api/checklist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (data) { return { status: res.status, data: data }; }).catch(function () {
        return { status: res.status, data: null };
      });
    }).then(function (result) {
      var data = result.data || {};
      if (result.status === 400) {
        if (msg) msg.textContent = data.error || 'Please check the form and try again.';
        return;
      }
      var text = data.message || 'Your ticks are saved on this device. The printable PDF is ready to download. Email and text delivery is not switched on yet.';
      if (msg) {
        msg.textContent = '';
        msg.appendChild(document.createTextNode(text + ' '));
        if (data.reportUrl) {
          var a = document.createElement('a');
          a.href = data.reportUrl;
          a.textContent = 'Open your private report';
          msg.appendChild(a);
        }
      }
    }).catch(function () {
      if (msg) msg.textContent = 'Your ticks are saved on this device. The printable PDF is ready to download. Email and text delivery is not switched on yet.';
    }).then(function () {
      if (button) button.disabled = false;
    });
  });
})();
