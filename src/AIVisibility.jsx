import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, CORAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS,
  parseWhisperResponse,
  GrainOverlay, ToolHero, WhatThisDoes, ToolsMenu, SiteFooter,
  primaryBtn, ghostBtn, miniLabel, plainCard,
} from "./lib/whisperKit.jsx";

// ── The AI Visibility Snapshot. Deliberately OUTSIDE the six-step framework:
//    the six steps build the brand, this scores how findable it currently is
//    to AI search. Self-reported answers + AI estimation, scored 0 to 100
//    across five things answer engines actually check. No live scan, and the
//    page says so plainly. No email gate: results just appear. ──

function DoodleGlass({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="13.5" cy="13.5" r="8.5" stroke={ACCENT} strokeWidth="2" fill="none" />
      <path d="M20 20 L27 27" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9.5 12.5 a4.5 4.5 0 0 1 3.5-3.4" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// The four bands. Reaching "Found" is rare and should feel earned.
const BANDS = [
  { min: 0, max: 25, name: "Unseen", read: "AI search has almost nothing to find you with", tint: "#F1EFE8", border: "#B4B2A9", ink: "#444441" },
  { min: 26, max: 50, name: "A faint trace", read: "Something's there, but engines can't hold onto it", tint: "#FBEAE3", border: "#F0997B", ink: "#993C1D" },
  { min: 51, max: 75, name: "Coming into view", read: "Findable on a good day, with real gaps left", tint: "#FAEEDA", border: "#EF9F27", ink: "#854F0B" },
  { min: 76, max: 100, name: "Found", read: "AI search can find you and describe you correctly", tint: "#E1F5EE", border: "#5DCAA5", ink: "#0F6E56" },
];
const bandFor = (score) => BANDS.find((b) => score >= b.min && score <= b.max) || BANDS[0];

// The five things answer engines actually check, 20 points each. The same
// library the fixes draw from, so the score and the advice always agree.
const AEO_LIBRARY = `THE FIVE DIMENSIONS (score each 0 to 20; the fixes must come from the same list, never invent tactics outside it):
1. NAME CLARITY: can an engine tell them apart from everyone else with a similar name? A distinctive brand name scores high. A common personal name shared with anyone more visible scores low unless it's always paired with the craft ("NAME, ceramicist in Austin"). Judge from the name itself.
2. THE ANCHOR PAGE: one page they own that says plainly who they are, what they make, for whom, where. Engines anchor identity to it; without it they stay silent or guess. Judge from their self-report.
3. SAME WORDS EVERYWHERE: engines cross-reference bios across site, LinkedIn, Instagram, directories. Identical wording everywhere concentrates identity; scattered wording fragments it. Judge from their self-report.
4. QUOTABLE ANSWERS: answer engines lift literal question-and-answer text. A page that asks and answers the questions customers actually ask is the page that gets quoted. Judge from their self-report.
5. BEING CITED: engines trust third-party sources: a directory, a local article, a podcast, a marketplace profile, a guest post. One citable mention outweighs a hundred of their own posts. Judge from their self-report.

SCORING RULES, so the number is fair and repeatable: for self-reported dimensions, "yes" lands 15 to 19 (20 only when their other answers make it clearly strong), "not sure" lands 7 to 11, "no" lands 2 to 6. Having a website nudges the anchor dimension up a few points even on "not sure". NAME CLARITY you judge yourself from the name: distinctive coined brand names land 15 to 19, moderately distinctive names 10 to 15, common personal names 4 to 10. The total is the sum of the five. Be honest, not kind: most small brands genuinely land between 20 and 55, and an inflated score helps nobody.`;

const TOGGLES = [
  { id: "anchor", label: "One page online says plainly who you are and what you do", help: "An About page on your site counts. So does a complete profile you control." },
  { id: "consistent", label: "Your bio reads the same everywhere it appears", help: "Site, LinkedIn, Instagram, directories. Same words, not just same vibe." },
  { id: "quotable", label: "Somewhere online, you answer the questions customers actually ask", help: "An FAQ, or posts that literally ask and answer them." },
  { id: "cited", label: "Someone else has published something about you", help: "A directory listing, an article, a podcast, a marketplace, a feature." },
];
const TOGGLE_OPTIONS = [
  { key: "yes", label: "Yes" },
  { key: "notsure", label: "Not sure" },
  { key: "no", label: "No" },
];

export default function AIVisibility() {
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [niche, setNiche] = useState("");
  const [work, setWork] = useState("");
  const [rival, setRival] = useState("");
  const [toggles, setToggles] = useState({});
  const [phase, setPhase] = useState("intro"); // intro | scoring | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const ready = name.trim().length > 1 && niche.trim().length > 2 && work.trim().length > 3 && TOGGLES.every((t) => toggles[t.id]);

  async function run() {
    if (!ready) return;
    setError(null); setResult(null);
    setPhase("scoring");
    const answers = TOGGLES.map((t) => `${t.label}: ${TOGGLE_OPTIONS.find((o) => o.key === toggles[t.id])?.label}`).join("\n");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are the strategist behind Branding Inward's AI visibility snapshot. Someone told you about their brand and answered four yes/no questions about their setup. You estimate how visible they currently are to AI search, score it honestly, and hand back a small tailored fix list. Your person likely finds self-promotion draining, so a low score must land as a clear starting point, never as a scolding. Never shame them for what they haven't done.

${AEO_LIBRARY}

HONESTY RULES: you have not visited their website or profiles, and you have not searched the web. Everything is estimated from their own answers plus your judgment of the name itself, nothing else. Never assert what their site currently contains beyond what they reported. Frame fixes as making sure something exists, never as claims about their current setup. If they named a competitor, one sentence on what likely makes that competitor easy for engines to find, as a model to learn from, never as a stick to beat them with.

VOICE: plain, warm, short sentences, like a real person texting. No hype. Do not use em-dashes or en-dashes anywhere, use commas and periods instead. Address the person directly as "you" everywhere, including every dimension note. "They" and "them" are only for third parties like the competitor, and NEVER assume anyone's gender. Every fix must be tailored to THIS brand's name and craft, using their own words for what they do, never generic advice.

Return ONLY JSON, no markdown:
{"score": <integer 0 to 100, the sum of the five dimension scores>,
 "dimensions": [exactly 5, in the library's order, each {"name": "short plain name for the dimension", "score": <integer 0 to 20>, "note": "one sentence, why this number, tied to their answers"}],
 "read": "2 or 3 sentences: the honest overall picture, warm, zero drama, in plain words",
 "rivalNote": "one sentence on the named competitor, or empty string if none was given",
 "fixes": [3 items, each {"title": "short imperative name", "why": "one sentence, why this matters for THEM specifically", "move": "one concrete physical first move, doable today, under 20 minutes, using their own name and craft"}],
 "today": "the single first move to do first, one sentence, the smallest one"}`,
          user: `Brand name: "${name.trim()}"
Website: ${site.trim() ? `"${site.trim()}" (self-reported, not visited)` : "none given"}
Niche: "${niche.trim()}"
What they do, in their words: "${work.trim()}"
Competitor or peer in their space: ${rival.trim() ? `"${rival.trim()}"` : "none given"}
Their four answers:
${answers}`,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "failed");
      const g = parseWhisperResponse(d);
      if (!g || typeof g.score !== "number" || !Array.isArray(g.dimensions) || !Array.isArray(g.fixes)) throw new Error("empty");
      g.score = Math.max(0, Math.min(100, Math.round(g.score)));
      setResult(g);
      setPhase("done");
      track("aivis_score_" + bandFor(g.score).name.toLowerCase().replace(/\s+/g, "-"));
    } catch (_) {
      setError("Couldn't finish the snapshot. Nothing was saved, give it another try in a moment.");
      setPhase("intro");
    }
  }

  async function copyAll() {
    if (!result) return;
    const band = bandFor(result.score);
    let t = `AI VISIBILITY SNAPSHOT: ${name.trim()}\n\nScore: ${result.score}/100, ${band.name}\n${result.read}\n\nTHE BREAKDOWN\n`;
    result.dimensions.forEach((d) => { t += `${d.name}: ${d.score}/20. ${d.note}\n`; });
    if (result.rivalNote) t += `\nOn ${rival.trim()}: ${result.rivalNote}\n`;
    t += `\nTHE FIX LIST\n`;
    result.fixes.forEach((f, i) => { t += `\n${i + 1}. ${f.title}\n${f.why}\nFirst move: ${f.move}\n`; });
    if (result.today) t += `\nStart here: ${result.today}\n`;
    t += `\nFrom brandinginward.com/ai-visibility`;
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (_) {}
  }

  function restart() {
    setPhase("intro"); setResult(null); setError(null);
  }

  const band = result ? bandFor(result.score) : null;
  const inputStyle = {
    width: "100%", fontSize: 18, fontFamily: SERIF, color: INK, padding: "14px 17px",
    borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", outline: "none",
  };
  const focusRing = { onFocus: (e) => (e.target.style.borderColor = ACCENT), onBlur: (e) => (e.target.style.borderColor = "#E5DDD1") };

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      {phase === "intro" && (
        <ToolHero
          label="The AI visibility snapshot"
          photo="/media/visibility-hero.jpg"
          Doodle={DoodleGlass}
          headline={<>Is AI search finding you,<br /><span style={{ fontStyle: "italic", color: BUTTER }}>or walking right past?</span></>}
          sub="People ask AI assistants for recommendations now, the way they used to ask a friend. Tell me about your brand and answer four quick questions, and I'll score how findable you currently are, out of 100, with the fixes that move it."
        />
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: phase === "intro" ? "40px 24px 40px" : "56px 24px 80px" }}>
        {phase !== "intro" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
                Branding Inward
              </span>
            </a>
          </div>
        )}

        {/* ── INTRO: the form ── */}
        {phase === "intro" && (
          <div className="mw-fade">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, background: ACCENT_TINT, border: "1px solid #DCEFEB", borderRadius: 12, padding: "11px 16px", fontFamily: SANS, fontSize: 14, marginBottom: 22 }}>
              <span style={{ background: INK_TEAL, color: "#FFF", borderRadius: 100, padding: "4px 11px", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", flexShrink: 0 }}>
                Outside the framework
              </span>
              <span style={{ color: "#5C534B" }}>The six steps build your brand. This scores how findable it currently is.</span>
            </div>

            <WhatThisDoes
              walkaway="A visibility score out of 100, the five-part breakdown behind it, and three tailored fixes."
              time="About two minutes"
              forwho="Anyone whose customers might ask an AI before they ask a friend."
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>Your brand name, or your own</p>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
                  placeholder="Cedar & Wick, or Sana Rahman" style={inputStyle} {...focusRing} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>Website, if you have one</p>
                <input value={site} maxLength={120} onChange={(e) => setSite(e.target.value)}
                  placeholder="cedarandwick.com (optional)" style={inputStyle} {...focusRing} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>Your niche or topic area</p>
                <input value={niche} maxLength={100} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Small-batch candles, or career coaching for nurses" style={inputStyle} {...focusRing} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>What you do, in your words</p>
                <input value={work} maxLength={160} onChange={(e) => setWork(e.target.value)}
                  placeholder="I pour soy candles in my garage in Portland and sell at two markets" style={inputStyle} {...focusRing} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>A competitor or peer in your space, if one comes to mind</p>
                <input value={rival} maxLength={80} onChange={(e) => setRival(e.target.value)}
                  placeholder="Optional. Someone customers might find instead of you." style={inputStyle} {...focusRing} />
              </div>
            </div>

            <p style={{ ...miniLabel, marginBottom: 4 }}>Four quick ones, honestly</p>
            <p style={{ fontSize: 14, color: "#857B70", margin: "0 0 14px", fontFamily: SANS, lineHeight: 1.5 }}>
              These are what answer engines actually check. "Not sure" is a completely fine answer.
            </p>
            {TOGGLES.map((t) => (
              <div key={t.id} style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                <p style={{ fontSize: 17, lineHeight: 1.45, margin: "0 0 4px", color: INK }}>{t.label}</p>
                <p style={{ fontSize: 13, color: "#9A8F82", fontFamily: SANS, margin: "0 0 12px", lineHeight: 1.5 }}>{t.help}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {TOGGLE_OPTIONS.map((o) => {
                    const on = toggles[t.id] === o.key;
                    return (
                      <button key={o.key} onClick={() => setToggles((s) => ({ ...s, [t.id]: o.key }))}
                        style={{ flex: 1, background: on ? ACCENT_TINT : "#FFF", color: on ? INK_TEAL : "#857B70", border: `2px solid ${on ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "9px 0", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, transition: "all .15s" }}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {error && <p style={{ fontFamily: SANS, fontSize: 15, color: CORAL, margin: "16px 0 0" }}>{error}</p>}

            <button className="mw-btn" onClick={() => { track("aivis_run"); run(); }} disabled={!ready}
              style={{ ...primaryBtn, marginTop: 22, opacity: ready ? 1 : 0.4, cursor: ready ? "pointer" : "not-allowed" }}>
              Score my visibility
            </button>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              Honest small print: this is scored from your own answers plus AI estimation. It is not a live scan
              of the web, so treat it as a starting point, not a technical audit. Results appear right here,
              no email, and nothing you type is saved.
            </p>
          </div>
        )}

        {/* ── SCORING ── */}
        {phase === "scoring" && (
          <div className="mw-fade" style={{ textAlign: "center", padding: "60px 0" }}>
            <DoodleGlass size={40} />
            <p style={{ fontSize: 22, margin: "18px 0 6px" }}>Scoring {name.trim()}.</p>
            <p style={{ fontFamily: SANS, fontSize: 15, color: "#857B70", margin: 0 }}>
              Five checks, the ones answer engines actually run.
            </p>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "done" && result && band && (
          <div className="mw-fade">
            {/* the score */}
            <div style={{ background: band.tint, border: `2px solid ${band.border}`, borderRadius: 20, padding: "30px 28px", marginBottom: 26, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={band.border} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 326.7} 326.7`} transform="rotate(-90 60 60)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, color: band.ink }}>{result.score}</span>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: band.ink, opacity: 0.75 }}>of 100</span>
                </div>
              </div>
              <div style={{ flex: "1 1 260px" }}>
                <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: band.ink, fontWeight: 700, margin: "0 0 6px" }}>
                  {band.name} · {band.read}
                </p>
                <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0, color: INK }}>{result.read}</p>
              </div>
            </div>

            {/* the breakdown */}
            <p style={{ ...miniLabel, marginBottom: 14 }}>The breakdown, five checks engines run</p>
            <div style={{ ...plainCard, marginBottom: 26 }}>
              {result.dimensions.slice(0, 5).map((d, i) => (
                <div key={i} style={{ padding: i ? "14px 0 0" : 0, marginTop: i ? 14 : 0, borderTop: i ? "1px solid #F1EDE4" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                    <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: INK }}>{d.name}</span>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: "#857B70", flexShrink: 0 }}>{Math.max(0, Math.min(20, Math.round(d.score)))}/20</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: "#F1EDE4", overflow: "hidden", marginBottom: 7 }}>
                    <div style={{ width: `${(Math.max(0, Math.min(20, d.score)) / 20) * 100}%`, height: "100%", borderRadius: 100, background: d.score >= 15 ? "#5DCAA5" : d.score >= 8 ? "#EF9F27" : "#F0997B" }} />
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, fontFamily: SANS, color: "#5C534B" }}>{d.note}</p>
                </div>
              ))}
            </div>

            {result.rivalNote && rival.trim() && (
              <div style={{ ...plainCard, borderLeft: `4px solid ${INK_TEAL}`, marginBottom: 26 }}>
                <p style={{ ...miniLabel, marginBottom: 6 }}>About {rival.trim()}</p>
                <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, color: INK }}>{result.rivalNote}</p>
              </div>
            )}

            {/* the fixes */}
            <p style={{ ...miniLabel, marginBottom: 4 }}>What moves the score, yours specifically</p>
            <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 18px", fontFamily: SANS, lineHeight: 1.5 }}>
              Three moves, each under twenty minutes. No posting schedule, no performing.
            </p>
            {result.fixes.slice(0, 4).map((f, i) => (
              <div key={i} style={{ ...plainCard, marginBottom: 14 }}>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: ".04em", textTransform: "uppercase", margin: "0 0 6px" }}>
                  {i + 1} · {f.title}
                </p>
                <p style={{ fontSize: 17, lineHeight: 1.55, margin: "0 0 10px", color: INK }}>{f.why}</p>
                <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, fontFamily: SANS, color: "#5C534B" }}>
                  <strong style={{ color: INK_TEAL, fontWeight: 600 }}>First move:</strong> {f.move}
                </p>
              </div>
            ))}

            {result.today && (
              <div style={{ background: INK_TEAL, borderRadius: 18, padding: "24px 26px", margin: "24px 0 0" }}>
                <p style={{ ...miniLabel, color: BUTTER, marginBottom: 8 }}>If you only do one thing</p>
                <p style={{ fontSize: 19, lineHeight: 1.55, color: "#FFF", margin: 0 }}>{result.today}</p>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #E5DDD1", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                {copied ? "Copied ✓" : "Copy everything"}
              </button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Score another brand</button>
            </div>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              Scored from your own answers and AI estimation, not a live scan of the web. A starting point,
              not a technical audit. Fixes take weeks to months to show up in AI answers, quiet consistency
              is exactly the game. Nothing you typed was saved.
            </p>

            <div style={{ marginTop: 34, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px" }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>
                Want the words to put on that anchor page?
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 12px", color: INK }}>
                The fix list tells you where to be. The six-step framework writes what you'll say there,
                starting with what you're really about.
              </p>
              <a href="/" style={{ fontFamily: SANS, fontSize: 15, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>
                See the six steps &rarr;
              </a>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
