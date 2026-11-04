import nodemailer from "nodemailer";

/**
 * Where email goes. SMTP works with Hostinger mail (smtp.hostinger.com, port
 * 465, SSL) or any SMTP provider. The test transport accepts everything and
 * sends nothing. With no transport set, emails wait in the outbox.
 */
export type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };
export type Transport = { name: string; send(m: Mail): Promise<{ id: string }> };

let cached: Transport | null | undefined;

export function transport(): Transport | null {
  if (cached !== undefined) return cached;
  const kind = (process.env.EMAIL_TRANSPORT ?? "").toLowerCase();
  if (kind === "test") {
    let n = 0;
    cached = { name: "test", send: async () => ({ id: `test-${Date.now()}-${++n}` }) };
  } else if (kind === "smtp" && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      pool: true, maxConnections: 2, connectionTimeout: 10_000, socketTimeout: 20_000,
    });
    const from = process.env.MAIL_FROM || `Robokalam <${process.env.SMTP_USER}>`;
    cached = {
      name: "smtp",
      send: async (m) => {
        const r = await t.sendMail({ from, to: m.to, subject: m.subject, html: m.html, text: m.text, replyTo: process.env.MAIL_REPLY_TO || undefined, headers: m.headers });
        return { id: String(r.messageId ?? "") };
      },
    };
  } else {
    cached = null;
  }
  return cached;
}

export const transportStatus = () => {
  const t = transport();
  return t ? { ok: true as const, name: t.name } : { ok: false as const, reason: "Email isn't configured yet (EMAIL_TRANSPORT=smtp and SMTP_* settings). Emails wait safely in the queue." };
};
