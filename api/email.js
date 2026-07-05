// Saves the visitor's email + brand summary to your Google Sheet, and the
// sheet's Apps Script emails them their summary. The webhook URL is a secret
// kept in an env var (SHEETS_WEBHOOK_URL) — on Vercel, set it in project settings.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, summary } = req.body || {};
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: "That email doesn't look right — mind checking it?" });
  }

  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ error: "Email isn't set up yet — use Copy for now." });
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
    if (!r.ok) throw new Error();
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Couldn't send it — try again, or use Copy." });
  }
}
