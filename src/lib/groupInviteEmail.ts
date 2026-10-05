// Email sent to someone without an account who was invited to a group.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function buildGroupInviteEmail({ inviterName, groupName, joinUrl }: {
  inviterName: string | null;
  groupName: string;
  joinUrl: string;
}): { subject: string; html: string; text: string } {
  const who = inviterName?.trim() || "A friend";
  const subject = `${who} invited you to "${groupName}" on JW Study`;
  const text = [
    `${who} invited you to join the study group "${groupName}" on JW Study.`,
    "",
    `Join here: ${joinUrl}`,
    "",
    "JW Study is a free Bible reading companion. Create an account through the link above and you'll be added to the group.",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f3ff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1235">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:6px;padding:28px">
<tr><td>
<p style="margin:0 0 12px;font-size:18px;font-weight:700">${escapeHtml(who)} invited you to a study group</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5">Join <strong>${escapeHtml(groupName)}</strong> on JW Study to read and talk together.</p>
<a href="${escapeHtml(joinUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:6px">Join the group</a>
<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b5b8a">JW Study is a free Bible reading companion. Create an account through the button above and you'll be added to the group automatically.</p>
</td></tr></table></body></html>`;
  return { subject, html, text };
}
