import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, DropQuote,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, quoteCard,
} from "./lib/whisperKit.jsx";

// A little hand-drawn pencil, same doodle family as the shield
function DoodlePen({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 25 L22 8 c1-1.2 3-1.2 4 0 c1 1.2 1 2.8 0 4 L11 27 l-5.5 1.5 Z" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M20 10.5 L24 14.5" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function EditorWhisper() {
  const [draft, setDraft] = useState("");
  const [card, setCard] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [copied, setCopied] = useState(false);

  const { listening, voiceSupported, toggleMic, resetBase, setBase, stopIfListening } = useVoiceInput(draft, setDraft);

  async function edit() {
    if (!draft.trim()) return;
    stopIfListening();
    setLoading(true); setError(null); setResult(null); setReveal(0);

    const systemPrompt = `You are the editor behind Branding Inward's editing tool, working for people who find self-promotion physically uncomfortable, the shy, the introverted, the ones who write a post and then delete it because it didn't sound like them. The belief this tool is built on: you are an EDITOR, never a ghostwriter. You do not write over people, you edit their draft TOWARD them. Their draft is also your voice sample. Study how they naturally write: the words they reach for, their rhythm, where they sound like themselves and where they suddenly sound like an ad, or like AI, or like someone performing.

${PSYCH_LIBRARY}

THE EDITOR'S RULES:
1. Keep every line that already sounds like a person talking. Your job is the wobble, not the voice. If the draft is already good, say so and change almost nothing.
2. Never invent facts, feelings, numbers, or stories that are not in their draft. Nothing gets added that they did not give you.
3. Cut or soften the performing: hype words, fake urgency, humble-brags, hashtag piles, 'I'm so excited to announce'. Quiet and specific beats loud and general, and the research in your library says the audience agrees.
4. Keep their draft's length or make it shorter, never longer. Keep their formatting habits (their line breaks, their lowercase, their way of punctuating) unless a habit fights readability.
5. Write plainly. No em-dashes or en-dashes anywhere in the edited draft or your notes, use commas and periods. Never assume anyone's gender, use they and them.

If they included a voice card (notes about their own voice from another tool here), treat it as the author's brief: match the edit to it, and use its named patterns when explaining what you kept.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly, make sure every key is exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead. Use \\n for line breaks inside "edited":
{
  "edited": "the full edited draft, their words kept wherever they worked, the performing removed, same length or shorter",
  "kept": "what you kept of theirs and why, quoting 1 or 2 of their exact phrases in single quotes as the proof their voice was already there (max 2 sentences)",
  "nudged": "what you changed and why, plainly, so they learn their own tell (max 2 sentences)",
  "anyones": "any line of the original that could have been written by anyone, quoted in single quotes, with one plain sentence on what would make it only theirs. If nothing was generic, say that honestly (max 2 sentences)"
}`;

    const userPrompt = `My draft:
${draft.trim()}
${card.trim() ? `\nMy voice card, from the brand voice tool here:\n${card.trim()}\n` : ""}
Edit my draft toward me. Keep what already sounds like me, fix what doesn't, and tell me what you did.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed || !parsed.edited) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass.");
      setResult(parsed);
      track("editor_edited");
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setResult(null); setError(null); setReveal(0);
  }

  async function copyEdited() {
    if (!result?.edited) return;
    try { await navigator.clipboard.writeText(result.edited); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  const cards = result ? [
    { key: "kept", label: "What I kept of yours, and why", body: result.kept },
    { key: "nudged", label: "What I nudged, and why", body: result.nudged },
    { key: "anyones", label: "Lines that could be anyone's", body: result.anyones },
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

        {/* ── INTRO + INPUTS: one screen, low friction. The tool IS the thesis: editor, not ghostwriter. ── */}
        {!result && !loading && (
          <div className="mw-fade">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <DoodlePen size={30} />
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: 0 }}>The editor</p>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 22px", fontWeight: 350 }}>
              An editor.<br /><span style={{ fontStyle: "italic", color: ACCENT }}>Not a ghostwriter.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 16px" }}>
              You wrote the post. You reread it. Something's off, it sounds like an ad, or like AI,
              or like a version of you that performs. So you delete it, and the work goes unposted again.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 28px" }}>
              Paste the draft instead. This keeps every line that already sounds like you, fixes the ones
              that don't, and tells you what it changed and why. Nothing added, nothing invented,
              your words wherever they work.
            </p>

            <p style={{ ...miniLabel, marginBottom: 10 }}>Your draft</p>
            <textarea
              className="mw-area" value={draft} maxLength={2500}
              onChange={(e) => { setDraft(e.target.value); setBase(e.target.value); }}
              placeholder="Paste the post, caption, bio, or email you're not sure about"
              rows={7}
              style={{ width: "100%", fontSize: 18, fontFamily: SERIF, color: INK, padding: "18px 20px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "vertical", outline: "none", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />

            <div style={{ marginTop: 18 }}>
              {!showCard ? (
                <button className="mw-ghost" onClick={() => setShowCard(true)} style={{ ...ghostBtn, marginLeft: 0 }}>
                  I have a voice card, let me paste it
                </button>
              ) : (
                <div className="mw-fade">
                  <p style={{ ...miniLabel, marginBottom: 10 }}>Your voice card (optional)</p>
                  <textarea
                    className="mw-area" value={card} maxLength={2500}
                    onChange={(e) => setCard(e.target.value)}
                    placeholder="Paste the voice card you copied from the brand voice tool"
                    rows={4}
                    style={{ width: "100%", fontSize: 16, fontFamily: SERIF, color: INK, padding: "16px 18px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "vertical", outline: "none", lineHeight: 1.5 }}
                    onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
                  />
                </div>
              )}
              <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 10, fontFamily: SANS }}>
                No voice card yet? The <a href="#/shield" style={{ color: ACCENT }}>brand voice tool</a> makes
                you one in three minutes, and the edit gets a lot more you.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={() => { track("editor_started"); edit(); }} disabled={!draft.trim()} style={{ ...primaryBtn, opacity: draft.trim() ? 1 : 0.4, cursor: draft.trim() ? "pointer" : "not-allowed" }}>
                Edit it toward me
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
                  <MicIcon color={listening ? "#FFF" : ACCENT} />
                  {listening ? "Listening…" : "Speak the draft"}
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
            <p style={{ fontSize: 22, color: "#5C534B" }}>Reading it the way you wrote it…</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="mw-fade" style={{ paddingTop: 30 }}>
            <p style={{ fontSize: 21, color: ACCENT, lineHeight: 1.4 }}>{error}</p>
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              <button className="mw-btn" onClick={edit} style={primaryBtn}>Try again</button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Back to my draft</button>
            </div>
          </div>
        )}

        {/* RESULT — the edited draft first, then the editor's notes one at a time */}
        {result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Your draft, edited toward you</p>
            <div className="mw-deal" style={{ ...heroCard, marginTop: 8 }}>
              <DropQuote />
              <p style={{ fontSize: 20, lineHeight: 1.55, margin: 0, color: INK, position: "relative", whiteSpace: "pre-wrap" }}>{result.edited}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
              <button className="mw-btn" onClick={copyEdited} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                {copied ? "Copied ✓" : "Copy the edited draft"}
              </button>
            </div>

            <div style={{ marginTop: 30 }}>
              {cards.slice(0, reveal).map((c) => (
                <div key={c.key} className="mw-deal" style={plainCard}>
                  <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>{c.label}</p>
                  <p style={{ fontSize: 19, lineHeight: 1.42, margin: 0, color: INK, position: "relative" }}>{c.body}</p>
                </div>
              ))}
              {reveal < cards.length && (
                <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 10 }}>
                  {reveal === 0 ? "What did you change?" : "Show me the next note"}
                </button>
              )}
            </div>

            <div style={{ marginTop: 30, paddingTop: 20, borderTop: "1px solid #E5DDD1" }}>
              <button className="mw-ghost" onClick={restart} style={{ ...ghostBtn, marginLeft: 0 }}>Edit another draft</button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER — full-bleed ink teal, same promise as everywhere */}
      <footer style={{ background: INK_TEAL, marginTop: 80 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 40px" }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.55)", margin: "0 0 18px", fontFamily: SANS, maxWidth: 620 }}>
            Nothing you type here is saved, and I never see it. No cookies, no personal data, just anonymous counts of how many people use the tool.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            — <span style={{ color: "#F7D06B" }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
