// Saves the visitor's email + brand summary to your Google Sheet, and the
// sheet's Apps Script emails them their summary. The webhook URL is a secret
// kept in an env var (SHEETS_WEBHOOK_URL). On Vercel, set it in project settings.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, summary } = req.body || {};
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: "That email doesn't look right. Mind checking it?" });
  }

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ error: "Email isn't set up yet. Use Copy for now." });
  }

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: to.trim(),
        summary: summary || "",
        when: new Date().toISOString(),
      }),
    });
    // Apps Script returns HTTP 200 even when the script itself throws (it serves
    // an HTML error page), so a 200 status alone does NOT mean success. The
    // handler must return exactly {"ok":true}; anything else is a real failure.
    const body = await r.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch (_) { parsed = null; }
    if (!r.ok || !parsed || parsed.ok !== true) {
      throw new Error("webhook did not confirm success");
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Couldn't send it. Try again, or use Copy." });
  }
}
