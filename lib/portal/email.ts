// Branded account emails. Email clients ignore stylesheets and modern layout, so
// this uses tables and inline styles on purpose.

export type AccountEmail =
  | { kind: "staff-invite"; invitedBy?: string }
  | { kind: "client-invite"; organization: string; organizationType: "company" | "operator"; role: "admin" | "member"; invitedBy?: string }
  | { kind: "reset" };

const INK = "#3f2c1f";
const MUTED = "#6f6252";
const BROWN = "#593825";
const GOLD = "#b88e48";
const LINE = "#e7e0d3";
const PAPER = "#f6f2ea";
const SANS = "Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const CONTACT = "info@seniorbydesign.com";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface Content {
  subject: string;
  preview: string;
  eyebrow: string;
  heading: string;
  intro: string;
  listTitle?: string;
  list?: string[];
  note?: string;
  button: string;
  expiry: string;
  ignore: string;
}

function content(email: AccountEmail): Content {
  const newAccount = "You'll add your name and position and choose a password. If you already have an account with this email, sign in first, then open this link again.";
  if (email.kind === "staff-invite")
    return {
      subject: "You're invited to the Senior By Design staff workspace",
      preview: "Your staff access to manage the Senior By Design website.",
      eyebrow: "SBD STAFF ACCESS",
      heading: "Welcome to the SBD staff workspace",
      intro: `${email.invitedBy || "An SBD administrator"} invited you to the workspace our team uses to keep the Senior By Design website current.`,
      listTitle: "With this access you can",
      list: [
        "Update portfolio, services and team profiles",
        "Publish journal stories and manage resources",
        "Manage brochures, brand media and email signatures",
      ],
      note: `This is an internal SBD staff account. Access to client projects in the client portal is granted separately by an administrator. ${newAccount}`,
      button: "Accept staff invitation",
      expiry: "This personal link works once and expires in 3 days.",
      ignore: "Not expecting this? You can ignore this email and no account will be created.",
    };
  if (email.kind === "client-invite") {
    const admin = email.role === "admin";
    return {
      subject: `You're invited to the Senior By Design client portal for ${email.organization}`,
      preview: `Follow your ${email.organization} projects with Senior By Design.`,
      eyebrow: "SBD CLIENT PORTAL",
      heading: "Your project portal is ready",
      intro: `${email.invitedBy || "Senior By Design"} invited you to the client portal for ${email.organization}. It's where you follow your senior living design projects with SBD, all in one place.`,
      listTitle: admin ? "As an account administrator you can" : "As a team member you can",
      list: admin
        ? [
            "Follow each project's progress and upcoming installations",
            "View current quotes, presentations and documents",
            email.organizationType === "company"
              ? "Approve quotes or request changes"
              : "Request changes to quotes, and approve them where SBD has authorized your organization",
            "Send payment, delivery and installation updates to SBD",
            "Invite your teammates and manage their access",
          ]
        : [
            "Follow each project's progress and upcoming installations",
            "View current quotes, presentations and documents",
          ],
      note: `You'll only see projects connected to ${email.organization}. ${newAccount}`,
      button: "Accept invitation",
      expiry: "This personal link works once and expires in 3 days. Please don't forward it.",
      ignore: "Not expecting this? You can ignore this email and no account will be created.",
    };
  }
  return {
    subject: "Reset your Senior By Design password",
    preview: "Use this link to choose a new password.",
    eyebrow: "ACCOUNT SECURITY",
    heading: "Reset your password",
    intro: "We received a request to reset the password for your Senior By Design account. Use the button below to choose a new one.",
    button: "Choose a new password",
    expiry: "This personal link works once and expires in 30 minutes.",
    ignore: "Didn't ask for this? You can ignore this email and your password won't change.",
  };
}

export function renderAccountEmail(email: AccountEmail, url: string, origin: string) {
  const c = content(email);
  const link = escapeHtml(url);
  const paragraph = (text: string, color = INK, size = 15) =>
    `<p style="margin:0 0 16px;font:${size}px/1.6 ${SANS};color:${color};">${escapeHtml(text)}</p>`;
  const list = c.list
    ? `<p style="margin:8px 0 8px;font:bold 14px/1.5 ${SANS};color:${INK};">${escapeHtml(c.listTitle!)}</p>
       <ul style="margin:0 0 18px;padding:0 0 0 20px;font:15px/1.7 ${SANS};color:${INK};">${c.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};"><tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:8px;">
    <tr><td align="center" style="padding:32px 32px 20px;border-bottom:3px solid ${GOLD};">
      <img src="${escapeHtml(origin)}/images/sbd-logo-no-tagline.png" width="82" height="100" alt="Senior By Design" style="display:block;border:0;">
    </td></tr>
    <tr><td style="padding:32px 32px 28px;">
      <p style="margin:0 0 8px;font:bold 11px/1.5 ${SANS};letter-spacing:1.6px;color:#8a6a34;">${escapeHtml(c.eyebrow)}</p>
      <h1 style="margin:0 0 16px;font:normal 28px/1.25 ${SERIF};color:${BROWN};">${escapeHtml(c.heading)}</h1>
      ${paragraph(c.intro)}
      ${list}
      ${c.note ? paragraph(c.note, MUTED, 14) : ""}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td align="center" bgcolor="${BROWN}" style="border-radius:6px;">
        <a href="${link}" style="display:inline-block;padding:14px 26px;font:bold 15px/1.2 ${SANS};color:#fff8eb;text-decoration:none;border-radius:6px;">${escapeHtml(c.button)}</a>
      </td></tr></table>
      ${paragraph(c.expiry, MUTED, 13)}
      <p style="margin:0 0 4px;font:13px/1.5 ${SANS};color:${MUTED};">Button not working? Copy this link into your browser:</p>
      <p style="margin:0 0 18px;font:12px/1.5 ${SANS};word-break:break-all;"><a href="${link}" style="color:#6e5128;">${link}</a></p>
      <p style="margin:0;padding-top:16px;border-top:1px solid ${LINE};font:13px/1.6 ${SANS};color:${MUTED};">${escapeHtml(c.ignore)} Questions? Write to <a href="mailto:${CONTACT}" style="color:#6e5128;">${CONTACT}</a>.</p>
    </td></tr>
  </table>
  <p style="margin:18px 0 0;font:12px/1.6 ${SANS};color:${MUTED};">Senior By Design &middot; Thoughtful spaces. Lasting partnerships.</p>
</td></tr></table>
</body></html>`;
  const text = [
    c.heading,
    "",
    c.intro,
    ...(c.list ? ["", `${c.listTitle}:`, ...c.list.map((item) => `- ${item}`)] : []),
    ...(c.note ? ["", c.note] : []),
    "",
    `${c.button}: ${url}`,
    "",
    c.expiry,
    c.ignore,
    `Questions? Write to ${CONTACT}.`,
    "",
    "Senior By Design",
  ].join("\n");
  return { subject: c.subject, html, text };
}
