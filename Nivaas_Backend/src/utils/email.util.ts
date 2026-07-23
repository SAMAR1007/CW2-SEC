import nodemailer from 'nodemailer';
import { ApiError } from '../exceptions/api.error';

type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export const sendEmail = async ({ to, subject, text, html }: EmailPayload) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  const fromRaw = process.env.SMTP_FROM || user;
  const from = fromRaw && !String(fromRaw).includes('@') && user
    ? `${fromRaw} <${user}>`
    : fromRaw;

  if (!host || !port || !user || !pass || !from) {
    throw new ApiError('Email service not configured', 500);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    throw new ApiError(`Email delivery failed: ${message}`, 500);
  }
};
