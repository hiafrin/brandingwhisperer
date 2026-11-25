// Receives the three Sincerely Unsaid forms (guest request, letter, voice note),
// checks them, and hands each one to a Google Apps Script web app that stores
// it in a Google Sheet and emails it. The web app URL and its token are secrets
// kept in env vars (UNSAID_WEBHOOK_URL, UNSAID_WEBHOOK_TOKEN).
// Setup: scripts/sincerely-unsaid-webhook.gs

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KINDS = new Set(["guest", "letter", "voice"]);
const SIGNS = new Set(["full", "first", "anon"]);
const MAX_AUDIO_BASE64 = 4.1 * 1024 * 1024; // about 3 MB of audio; Vercel refuses bodies over 4.5 MB

// Basic rate limit: 5 submissions per 10 minutes per address. It lives in this
// function instance's memory, so it slows a burst rather than guaranteeing a cap.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const yes = (v) => v === "yes";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: a filled "website" field means a bot. Answer as if it worked.
  if (text(b.website, 200)) return res.status(200).json({ ok: true });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (tooMany(ip)) return res.status(429).json({ error: "Too many submissions. Try again in a few minutes." });

  const kind = text(b.kind, 10);
  if (!KINDS.has(kind)) return res.status(400).json({ error: "Unknown form." });

  const email = text(b.email, 200);
  if (!EMAIL.test(email)) return res.status(400).json({ error: "That email doesn't look right." });

  const sign = kind === "guest" ? "full" : text(b.sign, 10);
  if (!SIGNS.has(sign)) return res.status(400).json({ error: "Choose how to sign it." });
  const name = text(b.name, 200);
  if (sign !== "anon" && !name) return res.status(400).json({ error: "A name is needed unless you choose Anonymous." });

  const out = {
    token: process.env.UNSAID_WEBHOOK_TOKEN || "",
    kind,
    received_at: new Date().toISOString(), // the consent timestamp of record
    browser_time: text(b.consent_at, 40),
    sign,
    name,
    email,
  };

  if (kind === "guest") {
    out.link = text(b.link, 300);
    out.story = text(b.story, 20000);
    if (!out.story) return res.status(400).json({ error: "The story is missing." });
  }
  if (kind === "letter") {
    out.to = text(b.to, 200);
    out.letter = text(b.letter, 20000);
    out.consents = { read: yes(b.consent_read), own: yes(b.consent_own), trim: yes(b.consent_trim) };
    if (!out.to || !out.letter) return res.status(400).json({ error: "The letter is missing." });
    if (!out.consents.read || !out.consents.own) return res.status(400).json({ error: "Both permission boxes are needed." });
  }
  if (kind === "voice") {
    out.about = text(b.about, 300);
    out.consents = { play: yes(b.consent_play), own: yes(b.consent_own) };
    const audio = typeof b.audio_base64 === "string" ? b.audio_base64 : "";
    const type = text(b.audio_type, 100);
    const fileName = text(b.audio_name, 200).replace(/[^\w.\- ]+/g, "_");
    if (!out.about || !audio) return res.status(400).json({ error: "The voice note is missing." });
    if (audio.length > MAX_AUDIO_BASE64) return res.status(413).json({ error: "That recording is too large." });
    if (type ? !type.startsWith("audio/") : !/\.(m4a|mp3|wav|aac|ogg|oga|opus|amr|flac|caf)$/i.test(fileName)) {
      return res.status(400).json({ error: "That file is not audio." });
    }
    if (!out.consents.play || !out.consents.own) return res.status(400).json({ error: "Both permission boxes are needed." });
    out.audio_base64 = audio;
    out.audio_type = type || "application/octet-stream";
    out.audio_name = fileName || "voice-note";
  }

  const webhook = process.env.UNSAID_WEBHOOK_URL;
  if (!webhook) return res.status(500).json({ error: "The forms aren't set up yet." });

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out),
    });
    // Apps Script answers 200 even when the script throws, so only an explicit
    // {"ok":true} counts as stored and sent (same rule as api/email.js).
    let parsed = null;
    try { parsed = JSON.parse(await r.text()); } catch (_) {}
    if (!r.ok || !parsed || parsed.ok !== true) throw new Error("webhook did not confirm success");
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "Couldn't send it. Please try again." });
  }
}
