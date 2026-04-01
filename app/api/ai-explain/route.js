export const runtime = "edge";

export async function POST(request) {
  let passage = "", question = "";
  try {
    const body = await request.json();
    passage  = String(body.passage  ?? "").slice(0, 600);
    question = String(body.question ?? "").slice(0, 300);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Add ANTHROPIC_API_KEY to your .env file" }, { status: 503 });
  }

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      stream: true,
      system:
        "You are a thoughtful Bible study companion. When given a scripture passage and a question, provide a clear, concise explanation (under 400 words) drawing from historical context, original language insights where helpful, and practical application. Be warm and accurate.",
      messages: [{ role: "user", content: `Scripture passage:\n"${passage}"\n\nQuestion: ${question}` }],
    }),
  });

  if (!claudeRes.ok) {
    return new Response("AI service error", { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
