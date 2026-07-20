import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, CORAL, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, DropQuote, PageQuote, ToolHero, WhatThisDoes, NextTools, SuccessProof, ToolsMenu, TOOLS,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, todayBox,
} from "./lib/whisperKit.jsx";

// The four verdicts, each with its own calm color. Strong leads (confidence first).
const VERDICT_STYLE = {
  Strong: { tint: "#E1F5EE", border: "#5DCAA5", ink: "#0F6E56", tag: "Don't change this" },
  Intimidating: { tint: "#FAEEDA", border: "#EF9F27", ink: "#854F0B", tag: "Sounds more formal than you" },
  Confusing: { tint: "#FBEAE3", border: "#F0997B", ink: "#993C1D", tag: "A reader might not follow this" },
  Missing: { tint: "#F1EFE8", border: "#B4B2A9", ink: "#444441", tag: "Not here yet" },
};
const VERDICT_ORDER = ["Strong", "Intimidating", "Confusing", "Missing"];

// They pick how hard it lands. For RSD and HSP, self-chosen intensity IS the
// safety: control over the truth. Every level still aims at the work, never the
// person, and every level still leads with what to keep.
const LEVELS = [
  { key: "friend", label: "A friend", blurb: "Warm. Arm around the shoulder." },
  { key: "stranger", label: "A stranger online", blurb: "Blunt and honest, a little dry. No sugarcoating." },
  { key: "strategist", label: "A brutal strategist", blurb: "Sharp, professional, no softening. Aimed at the work, never you." },
];
const TONE_BY_LEVEL = {
  friend:
    "TONE: a warm therapist who happens to love branding. Lean toward their STRENGTHS. Notice what they are already good at that they cannot see in themselves, name it plainly and kindly, and show them one concrete way to let the world see that strength. Frame even the fixes as 'here is how to let more of the real you show', never as 'here is what's wrong'. The Strong verdicts should feel like being truly seen. They should leave feeling capable, not corrected.",
  stranger:
    "TONE: a sharp, honest stranger in a good subreddit, the commenter who actually helps because they refuse to flatter you. Blunt, dry, quick. Call the BS out directly: the corporate filler, the fake hype, the hedging, the apology for existing. If a line reads like AI or a fill-in-the-blank template wrote it, say so plainly. And call out the hiding: where they undersell themselves, shrink, or clearly do not believe in their own brand. Push on that, firmly, because if they will not back their own brand, nobody else will. Aim it all at the writing and the self-doubt underneath, never at them as a person.",
  strategist:
    "TONE: a cutthroat brand strategist running a real teardown, the kind a company pays thousands for. Ruthless clarity about positioning, differentiation, and audience. Name exactly where the brand is generic, undifferentiated, forgettable, or trying to be everything to everyone. Talk like a professional: the one-line promise, who it is for, what makes it un-copyable, where it blends into competitors. Blunt words about the WORK and the STRATEGY are fine and expected. No encouragement padding, no softening. This is analysis, not therapy.",
};

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
  const [level, setLevel] = useState("friend");

  const { listening, voiceSupported, toggleMic, setBase, stopIfListening } = useVoiceInput(text, setText);

  async function roast() {
    if (!text.trim()) return;
    stopIfListening();
    setLoading(true); setError(null); setResult(null); setReveal(0);

    const systemPrompt = `You are the editor behind Branding Inward's gentle roast: the one friend who loves someone's work, reads their captions closely, and tells them the truth kindly. Your audience finds self-promotion physically uncomfortable, so when they post they often put on a costume: the ad voice, the excitement they don't feel, the formal register that isn't them. What they paste is your ONLY material. You never compare them to anyone. You quote their own words as evidence for everything.

The single most important thing this tool does, that no other critique tool does: it tells them what NOT to change. People need confidence as much as correction. So you ALWAYS lead with what's already working and must be kept, in their own words, before any fix.

${TONE_BY_LEVEL[level]}

THE ONE RULE THAT HOLDS AT EVERY LEVEL, no matter how sharp the tone: aim every hard note at the WRITING and the strategy, never at them as a person, never at their worth, their taste, their skill, their effort, or how much they post. Blunt about the copy is fine at the sharper levels. Cruel about the human is never fine. No shame words aimed at the person (cringe, embarrassing, pathetic, amateur, hopeless). Your audience often lives with rejection sensitivity, so the sting always lands on the sentence, never on them. And always keep at least one Strong, the thing to not change, because confidence is what lets a sensitive person actually hear the rest.

${PSYCH_LIBRARY}

You return a list of VERDICTS. Each verdict has a "kind" from exactly these four:
- "Strong": a line of theirs that is already them and already works. Quote it. The note says, in plain warm words, do not touch this and why it lands (real, specific, sensory, story-shaped lines are what people remember, say that without any term or name). ALWAYS include at least one Strong, first. There is always something to keep.
- "Intimidating": a line that sounds more formal or performed than they actually are, or that reads like AI, a template, or a brand deck wrote it. Quote it, name plainly what it sounds like, then rewrite it the way THEY talk, using only words and details that appear elsewhere in their own paste.
- "Confusing": a line a reader might not follow, or might read the wrong way. Quote it, say plainly how it could be misread, and offer a clearer version in their voice.
- "Missing": something a reader needs that is not there yet, most often who this is for or what they actually make. No quote needed. Say it gently as an invitation, not a scolding.

RULES: Only include a verdict if it is genuinely true of their paste. Never invent a flaw. If the writing is already clean, it is completely fine to return only Strong verdicts, an honest all-clear beats a forced criticism. Never quote words they did not write. Order the verdicts Strong first, then Intimidating, Confusing, Missing.

VOICE: plain, warm, short sentences, the way a real person texts. Do not use em-dashes or en-dashes, use commas and periods. NEVER assume gender: use "they" and "them" for anyone, no matter how a name sounds, with zero exceptions.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly, every key exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead:
{
  "verdicts": [
    { "kind": "Strong", "line": "the exact line of theirs, quoted, or empty for Missing", "note": "the plain warm note: for Strong, why to keep it, for others, the fix in their voice (max 2 sentences)" }
  ],
  "today": "one small concrete move for today, under 15 minutes, built from a Strong line, not generic advice (max 2 sentences)"
}`;

    const userPrompt = `Here's what I already put out there, or almost did (bio, captions, drafts, in no particular order):

${text.trim()}

Read it closely. Tell me first what to keep and never change, then the few things worth a gentle fix, all in my own words.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed || !Array.isArray(parsed.verdicts) || !parsed.verdicts.length) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass.");
      // Strong always leads, then the gentle fixes, Missing last.
      parsed.verdicts.sort((a, b) => VERDICT_ORDER.indexOf(a.kind) - VERDICT_ORDER.indexOf(b.kind));
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
    (result.verdicts || []).forEach((v) => {
      const tag = VERDICT_STYLE[v.kind] ? VERDICT_STYLE[v.kind].tag : v.kind;
      t += `${v.kind.toUpperCase()} (${tag}):\n`;
      if (v.line) t += `"${v.line}"\n`;
      if (v.note) t += `${v.note}\n`;
      t += "\n";
    });
    if (result.today) t += `My first move:\n${result.today}\n`;
    return t.trim();
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  const verdicts = result && Array.isArray(result.verdicts) ? result.verdicts.filter((v) => VERDICT_STYLE[v.kind]) : [];
  const hero = verdicts[0];
  const rest = verdicts.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      {/* ── HERO (intro only): full-bleed photo band, own coral identity ── */}
      {!result && !loading && (
        <ToolHero
          label="The gentle roast"
          photo="/media/roast-hero.jpg"
          accent={CORAL}
          Doodle={TOOLS.roast.Doodle}
          headline={<>Get roasted.<br /><span style={{ fontStyle: "italic", color: "#F7D06B" }}>Your words. Your call on how hard.</span></>}
          sub="When posting feels like performing, a costume goes on: the ad voice, the excitement you don't feel, the little apology for existing. Paste what you wrote, and this reads only your words, tells you first what to keep, then the few lines worth a gentle fix."
        />
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: (result || loading) ? "56px 24px 80px" : "40px 24px 40px" }}>
        {(result || loading) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
                Branding Inward
              </span>
            </a>
          </div>
        )}

        {/* ── INTRO CONTENT: what it does, then the level + paste box ── */}
        {!result && !loading && (
          <div className="mw-fade">
            <WhatThisDoes
              walkaway="What to keep and never change, then the few lines worth a gentle fix, in your own voice."
              time="About two minutes"
              forwho="Anyone whose bio or captions stopped sounding like them."
            />
            <p style={{ fontSize: 18, lineHeight: 1.65, color: INK, fontWeight: 500, margin: "0 0 28px" }}>
              Confidence first. Most critique tools forget that the thing you most need to hear is
              which parts are already good.
            </p>

            <p style={{ ...miniLabel, marginBottom: 4 }}>How hard do you want it?</p>
            <p style={{ fontSize: 14, color: "#857B70", margin: "0 0 12px", fontFamily: SANS, lineHeight: 1.5 }}>
              You choose. Even the sharp one aims at the words, never at you. Start gentle, dial up whenever you want.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLevel(l.key)}
                  style={{ flex: "1 1 180px", textAlign: "left", background: level === l.key ? ACCENT_TINT : "#FFF", border: `2px solid ${level === l.key ? ACCENT : "#E5DDD1"}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: SERIF, transition: "all .18s" }}
                >
                  <span style={{ display: "block", fontSize: 17, color: INK, marginBottom: 3 }}>{l.label}</span>
                  <span style={{ display: "block", fontFamily: SANS, fontSize: 13, color: "#857B70", lineHeight: 1.4 }}>{l.blurb}</span>
                </button>
              ))}
            </div>

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
              <button className="mw-btn" onClick={() => { track("roast_" + level); roast(); }} disabled={!text.trim()} style={{ ...primaryBtn, opacity: text.trim() ? 1 : 0.4, cursor: text.trim() ? "pointer" : "not-allowed" }}>
                {level === "friend" ? "Roast me, gently" : level === "stranger" ? "Give it to me straight" : "Don't hold back"}
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

        {/* RESULT — Strong first (what to keep), then the gentle fixes one at a time */}
        {result && !loading && hero && (
          <div className="mw-fade">
            <p style={miniLabel}>Your gentle roast</p>
            <div className="mw-deal" style={{ ...heroCard, marginTop: 8, background: VERDICT_STYLE[hero.kind].tint, borderLeftColor: VERDICT_STYLE[hero.kind].border }}>
              <DropQuote color={VERDICT_STYLE[hero.kind].ink} />
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: VERDICT_STYLE[hero.kind].ink, fontWeight: 700, margin: "0 0 10px", position: "relative" }}>
                {hero.kind} · {VERDICT_STYLE[hero.kind].tag}
              </p>
              {hero.line && <p style={{ fontSize: 21, lineHeight: 1.5, margin: "0 0 12px", color: INK, fontStyle: "italic", position: "relative" }}>&ldquo;{hero.line}&rdquo;</p>}
              <p style={{ fontSize: 18, lineHeight: 1.55, margin: 0, color: INK, position: "relative", whiteSpace: "pre-wrap" }}>{hero.note}</p>
            </div>

            <div style={{ marginTop: 24 }}>
              {rest.slice(0, reveal).map((v, i) => (
                <div key={i} className="mw-deal" style={{ ...plainCard, background: VERDICT_STYLE[v.kind].tint, borderColor: VERDICT_STYLE[v.kind].border }}>
                  <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: VERDICT_STYLE[v.kind].ink, fontWeight: 700, margin: "0 0 8px" }}>
                    {v.kind} · {VERDICT_STYLE[v.kind].tag}
                  </p>
                  {v.line && <p style={{ fontSize: 18, lineHeight: 1.5, margin: "0 0 10px", color: INK, fontStyle: "italic" }}>&ldquo;{v.line}&rdquo;</p>}
                  <p style={{ fontSize: 17, lineHeight: 1.55, margin: 0, color: INK, whiteSpace: "pre-wrap" }}>{v.note}</p>
                </div>
              ))}
              {reveal < rest.length && (
                <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 10 }}>
                  {reveal === 0 ? "Okay, what's worth a gentle fix?" : "Show me the next one"}
                </button>
              )}
            </div>

            {reveal >= rest.length && (
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

      <SuccessProof
        eyebrow="People who kept the words that were theirs"
        headline={<>They faced the delete button too. <span style={{ fontStyle: "italic", color: CORAL }}>And kept going.</span></>}
        intro="None of them use this site. They just prove that the quiet, steady version of your own voice is enough to build on."
        quote={{ q: "Fall seven times, stand up eight.", a: "Japanese proverb" }}
      />
      <NextTools current="roast" />
      <PageQuote id="roast" />

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
