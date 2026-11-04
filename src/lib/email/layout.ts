import { SITE } from "../site";

/**
 * One accessible layout for every email: real text (no image-only content),
 * a plain-text twin, brand colours with AA contrast, no tracking pixels.
 */
export type Block =
  | { p: string }
  | { rows: [string, string][] }
  | { list: string[] }
  | { cta: { label: string; href: string } }
  | { note: string };

export type Rendered = { subject: string; html: string; text: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE.url}${path}`);

export function layout(o: { subject: string; preheader?: string; heading: string; blocks: Block[]; footer: string }): Rendered {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.subject)}</title></head>
<body style="margin:0;background:#f6fbfd;font-family:Arial,Helvetica,sans-serif;color:#0b2b3d">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(o.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6fbfd"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #cfe4ee;border-radius:12px">
<tr><td style="padding:20px 28px;border-bottom:3px solid #97BC3D"><span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;letter-spacing:1px;color:#0B4168">ROBOKALAM</span><br><span style="font-size:12px;color:#4a6a1a">literature of technologies</span></td></tr>
<tr><td style="padding:24px 28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0B4168">${esc(o.heading)}</h1>
${o.blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #cfe4ee;font-size:12px;line-height:1.5;color:#3d5a6c">${esc(o.footer)}<br>${esc(SITE.legalName)} · <a href="${abs("/child-safety")}" style="color:#075a80">Child safety</a> · <a href="${abs("/privacy")}" style="color:#075a80">Privacy</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [o.heading, "", ...o.blocks.map(blockText), "", "--", o.footer, SITE.legalName].join("\n");
  return { subject: o.subject, html, text };
}

function blockHtml(b: Block) {
  if ("p" in b) return `<p style="margin:0 0 14px;font-size:16px;line-height:1.55">${esc(b.p)}</p>`;
  if ("note" in b) return `<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#3d5a6c">${esc(b.note)}</p>`;
  if ("list" in b) return `<ul style="margin:0 0 14px;padding-left:20px;font-size:16px;line-height:1.55">${b.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
  if ("rows" in b) return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:15px;line-height:1.5">${b.rows.map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:#3d5a6c;vertical-align:top">${esc(k)}</td><td style="padding:2px 0;font-weight:bold">${esc(v)}</td></tr>`).join("")}</table>`;
  return `<p style="margin:8px 0 18px"><a href="${esc(abs(b.cta.href))}" style="display:inline-block;background:#0B4168;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${esc(b.cta.label)}</a></p>`;
}

function blockText(b: Block) {
  if ("p" in b) return b.p + "\n";
  if ("note" in b) return b.note + "\n";
  if ("list" in b) return b.list.map((l) => `- ${l}`).join("\n") + "\n";
  if ("rows" in b) return b.rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
  return `${b.cta.label}: ${abs(b.cta.href)}\n`;
}
