// This runs on Vercel's servers, never in the browser — so the API keys stay
// secret. Gemini-first: every generation runs on the free Gemini tier when
// GEMINI_API_KEY is set, and Claude is only the silent emergency fallback
// (a Gemini error, timeout, or rate limit) so nothing dies mid-use. With the
// Gemini key present, normal traffic pulls nothing from Anthropic.

async function callGemini({ system, user, image }, key) {
  const parts = [];
  if (image && image.data && image.media_type) {
    parts.push({ inline_data: { mime_type: image.media_type, data: image.data } });
  }
  parts.push({ text: user });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts }],
          generationConfig: { maxOutputTokens: 2500, temperature: 0.6 },
        }),
        signal: ctrl.signal,
      }
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "gemini error");
    const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    if (!text.trim()) throw new Error("gemini empty");
    return text;
  } finally {
    clearTimeout(t);
  }
}

async function callClaude({ system, user, image }) {
  const content = image && image.data && image.media_type
    ? [
        { type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } },
        { type: "text", text: user },
      ]
    : user;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2500,
      // Skip extended thinking: these are fast, structured JSON responses,
      // and thinking tokens count against max_tokens (they starved the output).
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content }],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error?.message || "AI service error");
    err.status = response.status;
    throw err;
  }
  // Already in the content-blocks shape the client parses.
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // `image` is optional: { data: base64-without-prefix, media_type: "image/jpeg" }.
  const { system, user, image } = req.body || {};
  if (!system || !user) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const text = await callGemini({ system, user, image }, geminiKey);
      // Same envelope the client has always parsed.
      return res.status(200).json({ content: [{ type: "text", text }] });
    } catch (_) {
      // Fall through to Claude only when the free path actually failed.
    }
  }

  try {
    const data = await callClaude({ system, user, image });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Something went wrong reaching the AI." });
  }
}
