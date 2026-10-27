import type { MailMessage } from "../../lib/mailer";

/** HTML-escape text before putting it into an email body (never trust interpolated text). */
const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One email with a single button-style link, in plain text and simple HTML. */
function linkEmail(to: string, subject: string, intro: string, buttonText: string, link: string, note: string): MailMessage {
  const href = escapeHtml(link);
  return {
    to,
    subject,
    text: `${intro}\n\n${buttonText}: ${link}\n\n${note}\n`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;color:#111">
  <h1 style="font-size:22px">UrConnections</h1>
  <p>${escapeHtml(intro)}</p>
  <p><a href="${href}" style="display:inline-block;background:#0071e3;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${escapeHtml(buttonText)}</a></p>
  <p style="color:#666;font-size:13px">${escapeHtml(note)}</p>
  <p style="color:#999;font-size:12px">If the button doesn't work, copy this link:<br>${href}</p>
</div>`,
  };
}

export function verifyEmailMessage(to: string, link: string): MailMessage {
  return linkEmail(
    to,
    "Confirm your email address",
    "Welcome to UrConnections! Please confirm that this is your email address.",
    "Confirm my email",
    link,
    "This link works once and expires in 24 hours. If you didn't create an account, you can ignore this email.",
  );
}

export function resetPasswordMessage(to: string, link: string): MailMessage {
  return linkEmail(
    to,
    "Reset your password",
    "Someone (hopefully you) asked to reset the password for your UrConnections account.",
    "Choose a new password",
    link,
    "This link works once and expires in 1 hour. If you didn't ask for this, ignore this email: your password stays the same.",
  );
}
