// This runs on Vercel's servers, never in the browser — so your API key stays secret.
// It receives the prompt from your app, calls Claude, and sends the answer back.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, user } = req.body || {};
  if (!system || !user) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // your secret key, stored safely on Vercel
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "AI service error" });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Something went wrong reaching the AI." });
  }
}
