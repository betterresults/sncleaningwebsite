/* Sends emails from the dashboard (invites for partners and sales reps).
   Uses the Google Workspace mailbox: SMTP_USER (e.g. info@sncleaningservices.co.uk)
   and SMTP_PASS (a Google app password), set in Netlify environment variables. */
const ready = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

async function send({ to, subject, text }) {
  if (!ready() || !to) return false;
  try {
    const nodemailer = require("nodemailer");
    const port = Number(process.env.SMTP_PORT || 465);
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await t.sendMail({ from: `"SN Cleaning Services" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`, to, subject, text });
    return true;
  } catch (e) {
    console.error("Email failed:", e.message);
    return false;
  }
}

module.exports = { ready, send };
