import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, DropQuote,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, todayBox,
} from "./lib/whisperKit.jsx";

// A small hand-drawn candle flame, warm not menacing. Same doodle family as the shield.
function DoodleFlame({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4 C20 10 24 13 24 19 a8 8 0 0 1 -16 0 C8 13 12 10 16 4 Z" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M16 15 c2 2.4 3.4 3.8 3.4 6 a3.4 3.4 0 0 1 -6.8 0 c0-2.2 1.4-3.6 3.4-6 Z" stroke={ACCENT} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function RoastWhisper() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [copied, setCopied] = useState(false);

  const { listening, voiceSupported, toggleMic, setBase, stopIfListening } = useVoiceInput(text, setText);

  async function roast() {
    if (!text.trim()) return;
    stopIfListening();
    setLoading(true); setError(null); setResult(null); setReveal(0);

    const systemPrompt = `You are the friend behind Branding Inward's gentle roast: the one friend who loves someone's work and is finally allowed to read their captions out loud to them. Your audience is people who find self-promotion physically uncomfortable, so when they do post, they put on a costume: the ad voice, the excitement they don't feel, the hashtag pile, the apology for existing. What they paste is your ONLY material. They are not trying to be anyone else, and you never compare them to anyone. The whole trick of this roast: their own paste contains both the costume AND the real person, so you roast the costume by holding their own realest lines up next to it. They get roasted by what they already revealed, nothing more.

THE TONE: a gentle tease. Laughing WITH them, arm around the shoulder, never a real punch. Every tease lands on the performing, never on them, never on the work itself, never on skill, effort, or how much or little they post. No shame words (cringe, embarrassing, bad, fail, amateur) aimed at them. The roast should make them exhale, not wince.

${PSYCH_LIBRARY}

THE RULES THAT MATTER MOST:
1. Every tease quotes one of their actual performing lines in single quotes and sets one of their actual real lines against it, so the evidence does the roasting. Never quote words they did not write. Never invent a flaw to roast: if what they pasted has no costume in it, say that honestly, celebrate it, and skip the teasing entirely, an honest all-clear is a better product than a forced joke.
2. "tells" are THEIR patterns, found at least twice or clearly once in the paste, each given a short playful name they'd repeat to themselves later. Only name a tell you can quote.
3. "rescue" takes their single most costumed line and says the same thing the way THEY actually talk, built only from words and details that appear elsewhere in their paste. It should read like their gold lines, not like you.
4. Ground the "gold" in the library with every name and term left out: real, specific, sensory, story-shaped lines are what people's minds keep. You may use "researchers found" at most once in the whole response.

VOICE: plain, warm, short sentences, the way a real person texts. Do not use em-dashes or en-dashes anywhere, use commas and periods instead. NEVER assume gender: use "they" and "them" for anyone mentioned, no matter how a name sounds.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly, every key exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead. Use \\n between the teases in "roast" and between the tells in "tells_text":
{
  "roast": "3 or 4 gentle teases separated by \\n, each quoting one costume line and one real line of theirs. If there is no costume, one to two honest sentences saying so instead",
  "tells_text": "their 2 or 3 personal performing tells separated by \\n, each: a short playful name, a colon, the quoted evidence. Empty string if there are none",
  "gold": "their realest lines quoted back, and one plain sentence on why those are the ones people's minds will keep (max 3 sentences)",
  "rescue": "their most costumed line quoted, then: said your way, that's... followed by the same message rebuilt only from their own words elsewhere in the paste (max 3 sentences). Empty string if nothing needed rescuing",
  "today": "one small concrete move for today, under 15 minutes, built from their gold, not generic advice (max 2 sentences)"
}`;

    const userPrompt = `Here's what I already put out there, or almost did (bio, captions, drafts, in no particular order):

${text.trim()}

Roast me gently with my own words. Show me the costume, then show me the lines where I was already me.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed || !parsed.roast) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass.");
      setResult(parsed);
      track("roast_completed");
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setResult(null); setError(null); setReveal(0);
  }

  function buildSummary() {
    if (!result) return "";
    let t = "MY GENTLE ROAST, from Branding Inward\n\n";
    if (result.roast) t += `The roast:\n${result.roast}\n\n`;
    if (result.tells_text) t += `My performing tells (my self-check list):\n${result.tells_text}\n\n`;
    if (result.gold) t += `The gold, the lines that were already me:\n${result.gold}\n\n`;
    if (result.rescue) t += `One line, rescued:\n${result.rescue}\n\n`;
    if (result.today) t += `My first move:\n${result.today}\n`;
    return t.trim();
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  const cards = result ? [
    { key: "tells", label: "Your tells, keep this list", body: result.tells_text },
    { key: "gold", label: "The gold, where you were already you", body: result.gold },
    { key: "rescue", label: "One line, rescued", body: result.rescue },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
              Branding Inward
            </span>
          </a>
        </div>

        {/* ── INTRO + THE ONE BOX. Roasted by what you already revealed, nothing else. ── */}
        {!result && !loading && (
          <div className="mw-fade">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <DoodleFlame size={30} />
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: 0 }}>The gentle roast</p>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 22px", fontWeight: 350 }}>
              Get roasted.<br /><span style={{ fontStyle: "italic", color: ACCENT }}>Gently. By your own words.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 16px" }}>
              When posting feels like performing, a costume goes on: the ad voice, the excitement
              you don't actually feel, the hashtag pile, the little apology for taking up space.
              You can hear it's not you. That's exactly why posting feels bad.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 16px" }}>
              So paste it all in: your bio, your last few captions, the draft you never posted.
              This won't compare you to anyone, you're not trying to be anyone else. It reads only
              what you gave it, teases the costume, and holds up the lines where you were already you.
              Roasted by what you already revealed, nothing else.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: INK, fontWeight: 500, margin: "0 0 28px" }}>
              The roast aims at the costume. Never at you, and never at the work.
            </p>

            <p style={{ ...miniLabel, marginBottom: 10 }}>The evidence</p>
            <textarea
              className="mw-area" value={text} maxLength={3500}
              onChange={(e) => { setText(e.target.value); setBase(e.target.value); }}
              placeholder="Paste your bio, a few captions or posts, that draft you keep not posting. Any order, any mess."
              rows={9}
              style={{ width: "100%", fontSize: 18, fontFamily: SERIF, color: INK, padding: "18px 20px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "vertical", outline: "none", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={() => { track("roast_started"); roast(); }} disabled={!text.trim()} style={{ ...primaryBtn, opacity: text.trim() ? 1 : 0.4, cursor: text.trim() ? "pointer" : "not-allowed" }}>
                Roast me, gently
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
                  <MicIcon color={listening ? "#FFF" : ACCENT} />
                  {listening ? "Listening…" : "Speak"}
                </button>
              )}
            </div>
            <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 16, fontFamily: SANS }}>
              No account. Nothing you paste is saved, and I never see it.
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mw-fade" style={{ textAlign: "center", paddingTop: 70 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />)}
            </div>
            <p style={{ fontSize: 22, color: "#5C534B" }}>Reading it twice, once for the costume, once for you…</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="mw-fade" style={{ paddingTop: 30 }}>
            <p style={{ fontSize: 21, color: ACCENT, lineHeight: 1.4 }}>{error}</p>
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              <button className="mw-btn" onClick={roast} style={primaryBtn}>Try again</button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Back to the box</button>
            </div>
          </div>
        )}

        {/* RESULT — the roast first, then the notes one at a time, first move last */}
        {result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Your gentle roast</p>
            <div className="mw-deal" style={{ ...heroCard, marginTop: 8 }}>
              <DropQuote />
              <p style={{ fontSize: 21, lineHeight: 1.55, margin: 0, color: INK, position: "relative", whiteSpace: "pre-wrap", fontWeight: 350 }}>{result.roast}</p>
            </div>

            <div style={{ marginTop: 24 }}>
              {cards.slice(0, reveal).map((c) => (
                <div key={c.key} className="mw-deal" style={plainCard}>
                  <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>{c.label}</p>
                  <p style={{ fontSize: 19, lineHeight: 1.5, margin: 0, color: INK, position: "relative", whiteSpace: "pre-wrap" }}>{c.body}</p>
                </div>
              ))}
              {reveal < cards.length && (
                <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 10 }}>
                  {reveal === 0 ? "Okay, what are my tells?" : "Show me the next bit"}
                </button>
              )}
            </div>

            {reveal >= cards.length && (
              <div className="mw-fade" style={{ marginTop: 26 }}>
                {result.today && (
                  <div style={todayBox}>
                    <p style={{ ...miniLabel, color: "#FFF", opacity: 0.85, marginBottom: 10 }}>Your first move</p>
                    <p style={{ fontSize: 20, lineHeight: 1.45, color: "#FFF", margin: 0 }}>{result.today}</p>
                  </div>
                )}
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                    {copied ? "Copied ✓" : "Copy everything"}
                  </button>
                  <button className="mw-ghost" onClick={restart} style={ghostBtn}>Roast something else</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER — full-bleed ink teal, same promise as everywhere */}
      <footer style={{ background: INK_TEAL, marginTop: 80 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 40px" }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.55)", margin: "0 0 18px", fontFamily: SANS, maxWidth: 620 }}>
            Nothing you paste here is saved, and I never see it. No cookies, no personal data, just anonymous counts of how many people use the tool.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            — <span style={{ color: "#F7D06B" }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
