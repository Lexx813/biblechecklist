/**
 * onboarding-emails Edge Function
 *
 * Called by pg_cron daily at 10:00 AM UTC.
 * Sends onboarding emails based on days since signup:
 *   welcome — day 1
 *   day3    — day 3 (reading habit tip)
 *   day7    — day 7 (premium upgrade nudge)
 *
 * Required secrets:
 *   RESEND_API_KEY            — from resend.com
 *   CRON_SECRET               — same value used in the pg_cron SQL call
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "NWT Progress <notifications@nwtprogress.com>";
const SITE = "https://nwtprogress.com";

// ── Email helpers ──────────────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0514;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0514;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14082a;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.2)">
        ${content}
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25)">
            NWT Progress · <a href="${SITE}/settings" style="color:rgba(139,92,246,0.6)">Manage email preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 36px;border-radius:999px">${text}</a>`;
}

function welcomeHtml(name: string) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#2e0b6e 0%,#5b21b6 55%,#7c3aed 100%);padding:36px 40px;text-align:center">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#fff">Welcome to NWT Progress! 👋</h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7)">Your Bible study journey starts here, ${name}.</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        You can now track your reading across all 66 books, take Bible knowledge quizzes, join the community blog and forum, and build a daily reading habit.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        ${[
          ["📖", "Reading Tracker", "Check off chapters across all 66 books"],
          ["🧠", "Bible Quiz", "1,000+ questions across 12 themes"],
          ["✍️", "Community", "Blog, forum, and study topics"],
          ["🔥", "Streaks", "Daily goals and reading heatmap"],
        ].map(([icon, title, desc]) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;height:40px;background:rgba(124,58,237,0.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:18px">${icon}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.5)">${desc}</p>
            </td>
          </tr></table>
        </td></tr>`).join("")}
      </table>
      <div style="text-align:center">${ctaButton("Start Exploring →", SITE)}</div>
    </td></tr>
  `);
}

function day3Html(name: string) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#1a0a2e 0%,#3b1f6e 100%);padding:36px 40px;text-align:center">
      <p style="margin:0 0 10px;font-size:28px">🔥</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">Keep the momentum going, ${name}!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6)">You've been with us for 3 days</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        Research shows that reading just <strong style="color:#c084fc">one chapter per day</strong> is enough to build a lasting habit. Here are three tips to help you stay consistent:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        ${[
          ["1", "Set a daily goal", "In your settings, set a chapter goal. Even 1 chapter/day adds up to finishing the Bible in under 4 years."],
          ["2", "Use the reading heatmap", "Visit your profile to see your activity heatmap — it's satisfying to fill in those squares."],
          ["3", "Try the quiz", "After reading a book, test yourself in the Quiz section. It reinforces what you've read."],
        ].map(([num, title, desc]) => `
        <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(124,58,237,0.2);border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#c084fc;flex-shrink:0">${num}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">${desc}</p>
            </td>
          </tr></table>
        </td></tr>`).join("")}
      </table>
      <div style="text-align:center">${ctaButton("Continue Reading →", SITE)}</div>
    </td></tr>
  `);
}

function day7Html(name: string) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#2e0b6e 0%,#5b21b6 55%,#7c3aed 100%);padding:36px 40px;text-align:center">
      <p style="margin:0 0 10px;font-size:28px">✨</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">One week in — go deeper</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7)">You've been studying for a full week, ${name}.</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        Ready to take your Bible study to the next level? Premium unlocks powerful tools designed specifically for serious students of the Word:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        ${[
          ["✨", "AI Study Companion", "Ask Claude anything about any verse, passage, or quiz question"],
          ["📅", "Reading Plans", "Structured multi-week plans through any book of the Bible"],
          ["📝", "Study Notes", "Rich-text notes tied to specific passages and chapters"],
          ["💬", "Direct Messages", "Private conversations with other members"],
          ["👥", "Study Groups", "Group chat and shared progress with your congregation"],
        ].map(([icon, title, desc]) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:38px;height:38px;background:rgba(124,58,237,0.15);border-radius:10px;text-align:center;vertical-align:middle;font-size:18px">${icon}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.5)">${desc}</p>
            </td>
          </tr></table>
        </td></tr>`).join("")}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;margin-bottom:24px">
        <tr><td style="padding:16px 20px;text-align:center">
          <p style="margin:0;font-size:28px;font-weight:900;color:#fff">$3 <span style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.55)">/ month</span></p>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.4)">7-day free trial · Cancel anytime</p>
        </td></tr>
      </table>
      <div style="text-align:center;margin-bottom:12px">${ctaButton("Start Free Trial →", `${SITE}/settings`)}</div>
      <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin:0">
        If the subscription is a financial hardship, <a href="mailto:luaq777@gmail.com" style="color:rgba(139,92,246,0.6)">reach out</a> — no one should be left out.
      </p>
    </td></tr>
  `);
}

function day14Html(name: string) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#1a0a2e 0%,#3b1f6e 100%);padding:36px 40px;text-align:center">
      <p style="margin:0 0 10px;font-size:28px">🌟</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">Two weeks of growth, ${name}!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6)">Here's what's happening in the community</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        You're part of a growing community of Bible students. Here are some ways to get more involved:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        ${[
          ["1", "Join the forum", "Ask questions, share insights, and learn from others studying the same books."],
          ["2", "Share your progress", "Use the Share button on your profile to show friends how far you've come."],
          ["3", "Invite a friend", "Know someone who'd benefit? Share your referral link and study together."],
        ].map(([num, title, desc]) => `
        <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(124,58,237,0.2);border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#c084fc">${num}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">${desc}</p>
            </td>
          </tr></table>
        </td></tr>`).join("")}
      </table>
      <div style="text-align:center">${ctaButton("Visit the Community →", `${SITE}`)}</div>
    </td></tr>
  `);
}

function day30Html(name: string) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#2e0b6e 0%,#5b21b6 55%,#7c3aed 100%);padding:36px 40px;text-align:center">
      <p style="margin:0 0 10px;font-size:28px">🎉</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">One month milestone!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7)">You've been with us for 30 days, ${name}.</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        Congratulations on a full month of Bible study! Whether you've been reading daily or catching up in bursts, every chapter counts.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        If you haven't tried Premium yet, now is a great time. Start with a <strong style="color:#c084fc">7-day free trial</strong> and see how structured reading plans and study notes can transform your study routine.
      </p>
      <div style="text-align:center;margin-bottom:16px">${ctaButton("Check Your Progress →", SITE)}</div>
    </td></tr>
  `);
}

function reEngagementHtml(name: string, daysAway: number) {
  return baseHtml(`
    <tr><td style="background:linear-gradient(135deg,#1a0a2e 0%,#3b1f6e 100%);padding:36px 40px;text-align:center">
      <p style="margin:0 0 10px;font-size:28px">📖</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">We miss you, ${name}!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6)">It's been ${daysAway} days since your last visit</p>
    </td></tr>
    <tr><td style="padding:32px 40px">
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        Your Bible reading progress is waiting for you. Even reading just one chapter today keeps your momentum going.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
        Here are some quick wins to get back on track:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        ${[
          ["📖", "Read one chapter", "Pick up right where you left off"],
          ["🧠", "Take a quiz", "Quick 10-question session to refresh your memory"],
          ["💬", "Check the forum", "See what others are discussing this week"],
        ].map(([icon, title, desc]) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:38px;height:38px;background:rgba(124,58,237,0.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:18px">${icon}</td>
            <td style="padding-left:14px;vertical-align:middle">
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.5)">${desc}</p>
            </td>
          </tr></table>
        </td></tr>`).join("")}
      </table>
      <div style="text-align:center">${ctaButton("Continue Reading →", SITE)}</div>
    </td></tr>
  `);
}

// ── Send via Resend ────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Resend error for ${to}:`, err);
  }
  return res.ok;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const results: Record<string, number> = { welcome: 0, day3: 0, day7: 0, day14: 0, day30: 0, reEngage7: 0, reEngage14: 0, errors: 0 };

  // Define onboarding cohorts
  const cohorts: Array<{ step: string; daysAgo: number; subject: string; buildHtml: (name: string) => string }> = [
    {
      step: "welcome",
      daysAgo: 1,
      subject: "Welcome to NWT Progress 👋",
      buildHtml: welcomeHtml,
    },
    {
      step: "day3",
      daysAgo: 3,
      subject: "Keep the momentum going 🔥",
      buildHtml: day3Html,
    },
    {
      step: "day7",
      daysAgo: 7,
      subject: "One week in — go deeper ✨",
      buildHtml: day7Html,
    },
    {
      step: "day14",
      daysAgo: 14,
      subject: "Two weeks of growth 🌟",
      buildHtml: day14Html,
    },
    {
      step: "day30",
      daysAgo: 30,
      subject: "One month milestone 🎉",
      buildHtml: day30Html,
    },
  ];

  for (const cohort of cohorts) {
    const windowStart = new Date(now.getTime() - (cohort.daysAgo + 1) * 86400_000).toISOString();
    const windowEnd   = new Date(now.getTime() - cohort.daysAgo * 86400_000).toISOString();

    // Find users created in this day window who haven't received this email yet
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, onboarding_emails_sent")
      .gte("created_at", windowStart)
      .lt("created_at", windowEnd)
      .not("onboarding_emails_sent", "cs", `{"${cohort.step}"}`);

    if (error) {
      console.error(`DB error for ${cohort.step}:`, error.message);
      results.errors++;
      continue;
    }

    for (const profile of profiles ?? []) {
      try {
        // Get the user's email from auth
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
        if (!authUser?.email) continue;

        const name = profile.display_name || authUser.email.split("@")[0];
        const sent = await sendEmail(authUser.email, cohort.subject, cohort.buildHtml(name));

        if (sent) {
          // Mark this email as sent
          await supabase
            .from("profiles")
            .update({
              onboarding_emails_sent: [...(profile.onboarding_emails_sent ?? []), cohort.step],
            })
            .eq("id", profile.id);

          results[cohort.step as keyof typeof results] = (results[cohort.step as keyof typeof results] as number) + 1;
        }
      } catch (err) {
        console.error(`Error processing user ${profile.id}:`, err);
        results.errors++;
      }
    }
  }

  // ── Re-engagement emails for inactive users ──────────────────────────────────
  const reEngageCohorts = [
    { step: "reEngage7", daysInactive: 7, subject: "We miss you! 📖" },
    { step: "reEngage14", daysInactive: 14, subject: "Your reading progress is waiting 📖" },
  ];

  for (const re of reEngageCohorts) {
    const cutoff = new Date(now.getTime() - re.daysInactive * 86400_000).toISOString();
    const { data: inactive, error: reErr } = await supabase
      .from("profiles")
      .select("id, display_name, onboarding_emails_sent, last_active_at")
      .lt("last_active_at", cutoff)
      .not("onboarding_emails_sent", "cs", `{"${re.step}"}`)
      .limit(50);

    if (reErr) {
      console.error(`DB error for ${re.step}:`, reErr.message);
      results.errors++;
      continue;
    }

    for (const profile of inactive ?? []) {
      try {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
        if (!authUser?.email) continue;

        const name = profile.display_name || authUser.email.split("@")[0];
        const sent = await sendEmail(authUser.email, re.subject, reEngagementHtml(name, re.daysInactive));

        if (sent) {
          await supabase
            .from("profiles")
            .update({
              onboarding_emails_sent: [...(profile.onboarding_emails_sent ?? []), re.step],
            })
            .eq("id", profile.id);
          results[re.step] = (results[re.step] ?? 0) + 1;
        }
      } catch (err) {
        console.error(`Re-engage error ${profile.id}:`, err);
        results.errors++;
      }
    }
  }

  console.log("Onboarding + re-engagement emails sent:", results);
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
