/**
 * POST /api/translate
 * Body: { title: string, excerpt: string, content: string, targetLang: string }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 *
 * Claude outputs translations in a delimited format:
 *   ---TITLE---
 *   ---EXCERPT---
 *   ---CONTENT---
 */

// Switched off the Edge runtime so we can share the Node `@upstash/ratelimit`
// helper at src/lib/ratelimit.ts. Streaming still works on Node functions.
export const runtime = "nodejs";

import { rateLimit, rateLimitResponse } from "../../../src/lib/ratelimit";
import { withApiHandler } from "../../../src/lib/apiError";

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  tl: "Tagalog",
  fr: "French",
  de: "German",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ko: "Korean",
  yo: "Yoruba",
  sw: "Swahili",
  ha: "Hausa",
  ar: "Arabic",
};

// JW-correct terminology per language. The translator MUST use these forms
// when the source post discusses doctrinal concepts. Generic Christian
// equivalents (atonement, Eucharist, church, Lord-for-YHWH) are forbidden.
// Kept in this file so a doc-level update is self-contained and reviewable.
const JW_GLOSSARIES: Record<string, string> = {
  es:
    "Jehovah → Jehová · NWT → Traducción del Nuevo Mundo (TNM) · Hebrew Scriptures → Escrituras Hebreas · Christian Greek Scriptures → Escrituras Griegas Cristianas · God's Kingdom → Reino de Dios · ransom → rescate · Memorial → Conmemoración · congregation → congregación · Kingdom Hall → Salón del Reino · pure worship → adoración pura · holy spirit → espíritu santo (minúsculas, NO una persona) · anointed → ungidos · great crowd → gran muchedumbre · elders → ancianos · field service → servicio del campo · publishers → publicadores · pioneer → precursor · Revelation → Revelación (no Apocalipsis) · BC/AD → a.E.C./E.C. · NEVER 'Antiguo/Nuevo Testamento'.",
  pt:
    "Jehovah → Jeová · NWT → Tradução do Novo Mundo (TNM) · Hebrew Scriptures → Escrituras Hebraicas · Christian Greek Scriptures → Escrituras Gregas Cristãs · God's Kingdom → Reino de Deus · ransom → resgate · Memorial → Celebração · congregation → congregação · Kingdom Hall → Salão do Reino · pure worship → adoração pura · holy spirit → espírito santo (minúsculas, NÃO uma pessoa) · anointed → ungidos · great crowd → grande multidão · elders → anciãos · field service → serviço de campo · publishers → publicadores · pioneer → pioneiro · BC/AD → AEC/EC · NEVER 'Velho/Antigo/Novo Testamento'.",
  fr:
    "Jehovah → Jéhovah · NWT → Traduction du monde nouveau (TMN) · Hebrew Scriptures → Écritures hébraïques · Christian Greek Scriptures → Écritures grecques chrétiennes · God's Kingdom → Royaume de Dieu · ransom → rançon · Memorial → Mémorial · congregation → assemblée · Kingdom Hall → Salle du Royaume · pure worship → culte pur · holy spirit → esprit saint (minuscule, PAS une personne) · anointed → oints · great crowd → grande foule · elders → anciens · field service → ministère · publishers → proclamateurs · pioneer → pionnier · Revelation → Révélation · BC/AD → av. n. è./de n. è. · NEVER 'Ancien/Nouveau Testament'.",
  de:
    "Jehovah → Jehova · NWT → Neue-Welt-Übersetzung (NWÜ) · Hebrew Scriptures → Hebräische Schriften · Christian Greek Scriptures → Christlich-Griechische Schriften · God's Kingdom → Königreich Gottes · ransom → Loskaufsopfer · Memorial → Gedächtnismahl · congregation → Versammlung · Kingdom Hall → Königreichssaal · pure worship → reine Anbetung · holy spirit → heiliger Geist (klein, KEINE Person) · anointed → Gesalbte · great crowd → große Volksmenge · elders → Älteste · field service → Predigtdienst · publishers → Verkündiger · pioneer → Pionier · Revelation → Offenbarung · BC/AD → v. u. Z./u. Z. · NEVER 'Altes/Neues Testament'.",
  tl:
    "Jehovah → Jehova · NWT → Bagong Sanlibutang Salin · Hebrew Scriptures → Hebreong Kasulatan · Christian Greek Scriptures → Kristiyanong Griegong Kasulatan · God's Kingdom → Kaharian ng Diyos · ransom → pantubos · Memorial → Memoryal · congregation → kongregasyon · Kingdom Hall → Kingdom Hall · pure worship → dalisay na pagsamba · holy spirit → banal na espiritu (NOT a person) · anointed → pinahiran · great crowd → malaking pulutong · elders → mga elder · publishers → mga mamamahayag · pioneer → payunir · Revelation → Apocalipsis · BC/AD → B.C.E./C.E. · NEVER 'Lumang/Bagong Tipan'.",
  zh:
    "Jehovah → 耶和华 · NWT → 新世界译本 · Hebrew Scriptures → 希伯来语经卷 · Christian Greek Scriptures → 希腊语经卷 · God's Kingdom → 上帝的王国 · ransom → 赎价 · Memorial → 受难纪念 · congregation → 会众 · Kingdom Hall → 王国聚会所 · pure worship → 纯真崇拜 · holy spirit → 神圣力量 / 圣灵（活动力，非一位 person） · anointed → 受膏者 · great crowd → 大群人 · elders → 长老 · field service → 传道工作 · publishers → 传道员 · pioneer → 先驱 · Revelation → 启示录 · BC/AD → 公元前/公元 · NEVER '旧约/新约'.",
  ja:
    "Jehovah → エホバ · NWT → 新世界訳 · Hebrew Scriptures → ヘブライ語聖書 · Christian Greek Scriptures → ギリシャ語聖書 · God's Kingdom → 神の王国 · ransom → 贖い · Memorial → 記念式 · congregation → 会衆 · Kingdom Hall → 王国会館 · pure worship → 清い崇拝 · holy spirit → 聖霊（活動力、人ではない） · anointed → 油そそがれた者 · great crowd → 大群衆 · elders → 長老 · field service → 野外宣教 · publishers → 伝道者 · pioneer → 開拓者 · Revelation → 啓示 · BC/AD → 西暦前/西暦 · NEVER 旧約/新約.",
  ko:
    "Jehovah → 여호와 · NWT → 신세계역 · Hebrew Scriptures → 히브리어 성경 · Christian Greek Scriptures → 그리스어 성경 · God's Kingdom → 하느님의 왕국 · ransom → 대속물 · Memorial → 기념식 · congregation → 회중 · Kingdom Hall → 왕국회관 · pure worship → 순결한 숭배 · holy spirit → 성령 / 하느님의 활동력 (NOT 인격) · anointed → 기름부음받은 자 · great crowd → 큰 무리 · elders → 장로 · field service → 야외 봉사 · publishers → 전도인 · pioneer → 파이오니아 · Revelation → 계시록 · BC/AD → 기원전/기원 · NEVER 구약/신약.",
  yo:
    "Jehovah → Jèhófà · NWT → Ìwé Mímọ́ ní Ìtumọ̀ Ayé Tuntun · Hebrew Scriptures → Ìwé Mímọ́ Lédè Hébérù · Christian Greek Scriptures → Ìwé Mímọ́ Kristẹni Lédè Gíríìkì · God's Kingdom → Ìjọba Ọlọ́run · ransom → ìràpadà · Memorial → Ìrántí · congregation → ìjọ · Kingdom Hall → Gbọ̀ngàn Ìjọba · pure worship → ìjọsìn mímọ́ · holy spirit → ẹ̀mí mímọ́ / agbára iṣẹ́ Ọlọ́run (NOT a person) · anointed → ẹni àmì òróró · great crowd → ogunlọ́gọ̀ ńlá · elders → àwọn alàgbà · publishers → àwọn akéde · pioneer → aṣáájú-ọ̀nà · Revelation → Ìṣípayá · BC/AD → ṢK/SK · NEVER 'Májẹ̀mú Láéláé/Tuntun'.",
  sw:
    "Jehovah → Yehova · NWT → Tafsiri ya Ulimwengu Mpya · Hebrew Scriptures → Maandiko ya Kiebrania · Christian Greek Scriptures → Maandiko ya Kigiriki ya Kikristo · God's Kingdom → Ufalme wa Mungu · ransom → fidia · Memorial → Ukumbusho · congregation → kutaniko · Kingdom Hall → Jumba la Ufalme · pure worship → ibada safi · holy spirit → roho takatifu / nguvu ya utendaji ya Mungu (NOT a person) · anointed → watiwa-mafuta · great crowd → umati mkubwa · elders → wazee · field service → kazi ya kuhubiri · publishers → wahubiri · pioneer → painia · Revelation → Ufunuo · BC/AD → K.W.K./W.K. · NEVER 'Agano la Kale/Jipya'.",
  ha:
    "Jehovah → Jehobah · NWT → Fassarar Sabuwar Duniya · Hebrew Scriptures → Nassosin Ibrananci · Christian Greek Scriptures → Nassosin Helenanci na Kirista · God's Kingdom → Mulkin Allah · ransom → fansa · Memorial → Tunawa · congregation → ikilisiya · Kingdom Hall → Majami'ar Mulki · pure worship → bauta mai tsabta · holy spirit → ruhu mai tsarki / ƙarfin aiki na Allah (NOT a person) · anointed → shafaffu · great crowd → babban taro · elders → dattawa · publishers → masu shaida · pioneer → majagaba · Revelation → Ru'ya ta Yohanna · BC/AD → K.A.Z./A.Z. · NEVER 'Tsohon/Sabon Alkawari'.",
  ar:
    "Jehovah → يهوه · NWT → ترجمة العالم الجديد · Hebrew Scriptures → الأسفار العبرانية · Christian Greek Scriptures → الأسفار اليونانية المسيحية · God's Kingdom → ملكوت الله · ransom → الفدية · Memorial → الذكرى · congregation → الجماعة · Kingdom Hall → قاعة الملكوت · pure worship → العبادة النقية · holy spirit → الروح القدس / قوة الله العاملة (NOT شخص) · anointed → الممسوحون · great crowd → الجمع الكثير · elders → الشيوخ · field service → خدمة الحقل · publishers → الناشرون · pioneer → فاتح · Revelation → الرؤيا · BC/AD → ق.م./ب.م. · NEVER 'العهد القديم/الجديد'.",
};

export const POST = withApiHandler(async (req: Request) => {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id: userId } = (await userRes.json()) as { id: string };

  // ── Rate limit ────────────────────────────────────────────────────────────────
  const rl = await rateLimit("translate", userId);
  if (!rl.ok) return rateLimitResponse(rl);

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let title: string, excerpt: string, content: string, targetLang: string;
  try {
    const body = await req.json();
    title      = String(body.title      ?? "").slice(0, 300);
    excerpt    = String(body.excerpt    ?? "").slice(0, 600);
    content    = String(body.content    ?? "").slice(0, 20000);
    targetLang = String(body.targetLang ?? "").slice(0, 10);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!targetLang || !title) {
    return new Response("Missing title or targetLang", { status: 400 });
  }

  const langLabel = LANG_LABELS[targetLang] ?? targetLang;
  const glossary  = JW_GLOSSARIES[targetLang];

  // ── Call Claude with streaming ────────────────────────────────────────────────
  const userPrompt = [
    `Translate the following blog post into ${langLabel}.`,
    `Output ONLY the translation in this exact format — no preamble, no explanation:`,
    ``,
    `---TITLE---`,
    `[translated title]`,
    `---EXCERPT---`,
    `[translated excerpt]`,
    `---CONTENT---`,
    `[translated HTML content — preserve ALL HTML tags exactly]`,
    ``,
    `Title:`,
    title,
    ``,
    `Excerpt:`,
    excerpt,
    ``,
    `Content:`,
    content,
  ].join("\n");

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      system:
        "You are a JW-faithful translation assistant for the JW Study blog. " +
        "Translate accurately and naturally into the target language, preserving ALL HTML tags and structure exactly. " +
        "Output ONLY the requested ---TITLE--- / ---EXCERPT--- / ---CONTENT--- format. No preamble, no commentary.\n\n" +
        "JW TERMINOLOGY — MANDATORY: when the source post discusses doctrinal concepts, you MUST use the JW-correct target-language forms. " +
        "Never substitute generic Christian equivalents (atonement for ransom, Eucharist/Communion for Memorial, church for congregation, 'the Lord' as a YHWH stand-in, immortal-soul framing, trinitarian phrasing). " +
        "If a term has no direct local equivalent, transliterate (e.g. keep 'Jehovah' in the JW-target spelling) rather than substitute a different-meaning local word.\n\n" +
        (glossary
          ? `Target language: ${langLabel}. Glossary (apply consistently):\n${glossary}`
          : `Target language: ${langLabel}. (No JW glossary registered for this locale — preserve Jehovah's name, avoid generic Christian substitutes, and prefer transliteration when in doubt.)`),
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    console.error("[translate] Claude API error:", claudeRes.status, detail.slice(0, 200));
    return new Response("AI service temporarily unavailable", { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}, { route: "translate.POST", publicMessage: "Translation failed. Please try again." });
