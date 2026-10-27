import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  /** Plain-text version: what simple mail clients and screen readers show. */
  text: string;
  html: string;
}

/** Anything that can send an email. Routes depend on this, so tests can pass a fake. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/**
 * Sends mail over SMTP (the standard email delivery protocol).
 * In development SMTP_URL points at Mailpit, which keeps every message for you
 * to read at http://localhost:8025 instead of delivering it.
 */
export function createSmtpMailer(smtpUrl: string, from: string): Mailer {
  const transport = nodemailer.createTransport(smtpUrl);
  return {
    async send({ to, subject, text, html }) {
      await transport.sendMail({ from, to, subject, text, html });
    },
  };
}
