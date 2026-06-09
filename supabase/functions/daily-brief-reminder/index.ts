/**
 * daily-brief-reminder Edge Function
 *
 * Runs once per day via Supabase cron (recommended: 14:00 UTC ≈ 9am EST / 8am CST / 9am Bogota).
 * Finds users who:
 *   1. Have at least one active push_subscription (opted into push)
 *   2. Have been active in the last 14 days (last_active_at)
 *   3. Have NOT dismissed today's brief (daily_briefs.dismissed_until in future)
 *
 * Inserts a `daily_brief` notification per candidate. The existing notifications
 * INSERT webhook fires the push automatically (send-push-notification fn).
 *
 * The brief itself is NOT generated here — it generates lazily on /api/daily-brief
 * when the user actually opens the app. This keeps cost bounded (no AI call for
 * users who never come back).
 *
 * Required secrets:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   CRON_SECRET               — shared secret to prevent unauthorized calls
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { safeEqual } from "../_shared/safeEqual.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Push reminder copy per UI language (profiles.preferred_language). Falls back
// to English for any code not listed.
const REMINDER_BODY: Record<string, string> = {
  en: "Your day with the Companion is ready. Open the app to see today's brief.",
  es: "Tu día con el Compañero está listo. Abre la app para ver el resumen de hoy.",
  pt: "Seu dia com o Companheiro está pronto. Abra o app para ver o resumo de hoje.",
  tl: "Handa na ang iyong araw kasama ang Kasama. Buksan ang app para makita ang buod ngayon.",
  fr: "Votre journée avec le Compagnon est prête. Ouvrez l'application pour voir le résumé du jour.",
  de: "Dein Tag mit dem Begleiter ist bereit. Öffne die App, um die heutige Übersicht zu sehen.",
  zh: "你与学习助手的一天已准备好。打开应用查看今天的简报。",
  ja: "コンパニオンと過ごす一日の準備ができました。アプリを開いて今日のブリーフをご覧ください。",
  ko: "컴패니언과 함께하는 하루가 준비되었습니다. 앱을 열어 오늘의 브리핑을 확인하세요.",
  yo: "Ọjọ́ rẹ pẹ̀lú Alábàákẹ́gbẹ́ ti ṣetán. Ṣí áàpù náà láti rí ìsọníṣókí òní.",
  sw: "Siku yako pamoja na Msaidizi iko tayari. Fungua programu kuona muhtasari wa leo.",
  ha: "Ranarka tare da Abokin Tafiya ya shirya. Buɗe manhajar don ganin taƙaitaccen rahoton yau.",
  ar: "يومك مع الرفيق جاهز. افتح التطبيق لرؤية موجز اليوم.",
};

function reminderBody(lang: string | null | undefined): string {
  const base = (lang ?? "en").toLowerCase().split("-")[0];
  return REMINDER_BODY[base] ?? REMINDER_BODY.en;
}

Deno.serve(async (req) => {
  // Fail closed — reject if env var missing
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return new Response("Misconfigured", { status: 503 });
  if (!safeEqual(req.headers.get("x-cron-secret"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00Z";

  // Step 1: distinct user_ids with at least one push subscription
  const { data: subRows, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id");
  if (subErr) {
    console.error("daily-brief-reminder: push_subscriptions error", subErr);
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500 });
  }
  const pushUserIds = Array.from(new Set((subRows ?? []).map((r: { user_id: string }) => r.user_id)));
  if (pushUserIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no push subscribers" }), { status: 200 });
  }

  // Step 2: filter to users active in the last 14 days
  const { data: activeProfiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, display_name, preferred_language")
    .in("id", pushUserIds)
    .gte("last_active_at", fourteenDaysAgo);
  if (profErr) {
    console.error("daily-brief-reminder: profiles error", profErr);
    return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
  }
  const activeIds = (activeProfiles ?? []).map((p: { id: string }) => p.id);
  // Map each user to their preferred language so the push is localized.
  const langById = new Map(
    (activeProfiles ?? []).map((p: { id: string; preferred_language?: string | null }) => [p.id, p.preferred_language ?? "en"]),
  );
  if (activeIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no active push subscribers" }), { status: 200 });
  }

  // Step 3: exclude users who dismissed today's brief
  const { data: dismissedRows } = await supabase
    .from("daily_briefs")
    .select("user_id, dismissed_until")
    .in("user_id", activeIds)
    .gte("dismissed_until", new Date().toISOString());
  const dismissedSet = new Set((dismissedRows ?? []).map((r: { user_id: string }) => r.user_id));

  // Step 4: exclude users who already received today's notification (idempotent)
  const { data: alreadySentRows } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "daily_brief")
    .gte("created_at", todayStart)
    .in("user_id", activeIds);
  const alreadySentSet = new Set((alreadySentRows ?? []).map((r: { user_id: string }) => r.user_id));

  const recipients = activeIds.filter((id: string) => !dismissedSet.has(id) && !alreadySentSet.has(id));
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "all dismissed or already notified" }), { status: 200 });
  }

  // Step 5: insert notifications — push + email webhooks fire automatically
  const notifications = recipients.map((id: string) => ({
    user_id: id,
    actor_id: id,
    type: "daily_brief",
    body_preview: reminderBody(langById.get(id)),
    link_hash: "ai",
    read: false,
  }));

  const { error: insErr } = await supabase.from("notifications").insert(notifications);
  if (insErr) {
    console.error("daily-brief-reminder: insert error", insErr);
    return new Response(JSON.stringify({ error: insErr.message }), { status: 500 });
  }

  console.log(`daily-brief-reminder: sent ${notifications.length} reminders`);
  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 });
});
