import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, CORAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS,
  parseWhisperResponse,
  GrainOverlay, ToolHero, WhatThisDoes, ToolsMenu, SiteFooter,
  primaryBtn, ghostBtn, miniLabel, plainCard,
} from "./lib/whisperKit.jsx";

// ── The AI visibility check. Deliberately OUTSIDE the six-step framework:
//    the six steps build the brand, this one checks how the outside world's
//    machines currently see it. Two parts, one flow: a blind ask (what does
//    the AI actually say about this name, uncontaminated by what the user
//    tells us), then a diagnosis with a tailored fix list. ──

// A small hand-drawn looking glass, same doodle family as the other tools.
function DoodleGlass({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="13.5" cy="13.5" r="8.5" stroke={ACCENT} strokeWidth="2" fill="none" />
      <path d="M20 20 L27 27" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9.5 12.5 a4.5 4.5 0 0 1 3.5-3.4" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// The four honest outcomes. Most people land on "invisible", and the page
// treats that as the useful result, not a failure: a blank page is writable.
const VERDICT_STYLE = {
  invisible: { tint: "#F1EFE8", border: "#B4B2A9", ink: "#444441", tag: "A blank page", read: "The AI doesn't know you yet" },
  confused: { tint: "#FBEAE3", border: "#F0997B", ink: "#993C1D", tag: "Mistaken identity", read: "It's talking about someone else" },
  partial: { tint: "#FAEEDA", border: "#EF9F27", ink: "#854F0B", tag: "Half the story", read: "It knows something, but not your work" },
  seen: { tint: "#E1F5EE", border: "#5DCAA5", ink: "#0F6E56", tag: "Already visible", read: "It actually knows your work" },
};

// ── What actually gets a small brand cited by answer engines. The diagnosis
//    prompt tailors from this list; it never invents tactics outside it. ──
const AEO_LIBRARY = `THE VISIBILITY LIBRARY (the only fixes you may draw from; tailor them, never invent new ones):
1. THE CANONICAL ABOUT PAGE: answer engines anchor a person or small brand to one authoritative self-description: who you are, what you make, for whom, where, in plain declarative sentences on a page you own. No About page means no anchor, and the engine either stays silent or guesses.
2. SAME WORDS EVERYWHERE: engines cross-reference bios across a website, LinkedIn, Instagram, directories. When every profile describes the work in different words, the identity fragments and confidence drops. One bio sentence, pasted identically everywhere, is the fix.
3. FAQ-SHAPED CONTENT: answer engines lift literal question-and-answer text. A page that asks and answers the exact questions customers ask ("do you take custom orders?", "what does a brand strategist actually do?") is the page that gets quoted.
4. THE UNAMBIGUOUS NAME: when a name is shared with someone more visible, the engine defaults to the famous one. The fix is always pairing name + craft + place in one breath ("NAME, ceramicist in Austin") everywhere the name appears, until the pairing itself is the identity.
5. BE SOMEWHERE CITABLE: engines prefer third-party sources: a directory listing, a local article, a podcast transcript, a guest post, a marketplace profile. One citable mention somewhere an engine trusts outweighs a hundred of your own posts.`;

export default function AIVisibility() {
  const [name, setName] = useState("");
  const [work, setWork] = useState("");
  const [phase, setPhase] = useState("intro"); // intro | asking | reading | done
  const [blind, setBlind] = useState(null);    // what the AI said, verbatim
  const [diag, setDiag] = useState(null);      // verdict + fixes
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const ready = name.trim().length > 1 && work.trim().length > 3;

  async function ask() {
    if (!ready) return;
    setError(null); setBlind(null); setDiag(null);
    setPhase("asking");
    try {
      // ── Call 1, the blind ask. Only the name goes in, so the answer can't
      //    be contaminated by what they told us about themselves. ──
      const r1 = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are being asked what you know about a person or brand, the way any member of the public asking an AI assistant would be answered. Answer ONLY from your training knowledge. Be honest and plain. If you do not recognize the name, or only recognize other people who share it, say so directly, that is the most useful possible answer. Never guess, never flatter, never pad. Do not use em-dashes or en-dashes anywhere, use commas and periods instead.
Return ONLY JSON, no markdown: {"recognized": "yes" | "no" | "other-people", "answer": "2 to 5 plain sentences: exactly what you would tell a stranger who asked about this name. If you only know others with the same name, say who you would assume they meant."}`,
          user: `What do you know about "${name.trim()}"?`,
        }),
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error || "ask failed");
      const b = parseWhisperResponse(d1);
      if (!b || !b.answer) throw new Error("empty");
      setBlind(b);
      setPhase("reading");

      // ── Call 2, the diagnosis: the blind answer meets what they actually do. ──
      const r2 = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are the strategist behind Branding Inward's AI visibility check. Someone just saw, verbatim, what an AI assistant says about their name when a stranger asks. Your job: diagnose what happened, warmly and honestly, then give them a small tailored fix list. Your person likely finds self-promotion draining, so "the AI doesn't know you" must land as relief and a writable blank page, never as a failure or a scolding. Never shame them for what they haven't done.

${AEO_LIBRARY}

VOICE: plain, warm, short sentences, like a real person texting. No hype. Do not use em-dashes or en-dashes anywhere, use commas and periods instead. NEVER assume gender: use "they" and "them" for anyone mentioned. Every fix must be tailored to THIS person's name and craft, quoting their own words for what they do, never generic advice.

HONESTY RULE: you have not seen their website, profiles, or anything else about them beyond what is in this message. Never assert what their site or profiles currently contain or lack ("your site has no About page"). Frame every fix as making sure something exists or checking it ("make sure there is one page that says, in plain sentences, ..."), never as a claim about their current setup.

Return ONLY JSON, no markdown:
{"verdict": "invisible" | "confused" | "partial" | "seen",
 "read": "2 or 3 sentences: what just happened in the AI's answer, in plain words, matched against what they actually do. Warm, honest, zero drama.",
 "fixes": [3 items, each {"title": "short imperative name for the fix", "why": "one sentence, why this one matters for THEM specifically", "move": "one concrete physical first move, doable today, under 20 minutes, using their own name and craft"}],
 "today": "the single first move to do first, one sentence, the smallest one"}`,
          user: `The name: "${name.trim()}"
What they say they actually do: "${work.trim()}"
What the AI said when asked blind about the name (recognized: ${b.recognized}): "${b.answer}"`,
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error || "diagnosis failed");
      const g = parseWhisperResponse(d2);
      if (!g || !g.verdict || !Array.isArray(g.fixes)) throw new Error("empty");
      if (!VERDICT_STYLE[g.verdict]) g.verdict = "partial";
      setDiag(g);
      setPhase("done");
      track("aivis_" + g.verdict);
    } catch (_) {
      setError("Couldn't finish the check. Nothing was saved, give it another try in a moment.");
      setPhase("intro");
    }
  }

  async function copyAll() {
    if (!diag) return;
    let t = `WHAT AI SAYS ABOUT ${name.trim().toUpperCase()}\n\n${blind?.answer || ""}\n\nThe read: ${diag.read}\n\nTHE FIX LIST\n`;
    diag.fixes.forEach((f, i) => { t += `\n${i + 1}. ${f.title}\n${f.why}\nFirst move: ${f.move}\n`; });
    if (diag.today) t += `\nStart here: ${diag.today}\n`;
    t += `\nFrom brandinginward.com/ai-visibility`;
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (_) {}
  }

  function restart() {
    setPhase("intro"); setBlind(null); setDiag(null); setError(null);
  }

  const busy = phase === "asking" || phase === "reading";
  const v = diag ? VERDICT_STYLE[diag.verdict] : null;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      {phase === "intro" && (
        <ToolHero
          label="The AI visibility check"
          photo="/media/visibility-hero.jpg"
          Doodle={DoodleGlass}
          headline={<>What does AI<br /><span style={{ fontStyle: "italic", color: BUTTER }}>say about you?</span></>}
          sub="People now ask AI assistants for recommendations the way they used to ask a friend. Type your name, see exactly what one AI tells a stranger who asks about you, then get the short fix list for being found and described correctly."
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

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div className="mw-fade">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, background: ACCENT_TINT, border: "1px solid #DCEFEB", borderRadius: 12, padding: "11px 16px", fontFamily: SANS, fontSize: 14, marginBottom: 22 }}>
              <span style={{ background: INK_TEAL, color: "#FFF", borderRadius: 100, padding: "4px 11px", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", flexShrink: 0 }}>
                Outside the framework
              </span>
              <span style={{ color: "#5C534B" }}>The six steps build your brand. This checks how the machines currently see it.</span>
            </div>

            <WhatThisDoes
              walkaway="The AI's verbatim answer about your name, an honest read on it, and three tailored fixes."
              time="About two minutes"
              forwho="Anyone whose customers might ask an AI before they ask a friend."
            />

            <p style={{ ...miniLabel, marginBottom: 8 }}>Your name, or your brand's</p>
            <input
              value={name} maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sana Rahman, or Cedar & Wick Candles"
              style={{ width: "100%", fontSize: 19, fontFamily: SERIF, color: INK, padding: "15px 18px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", outline: "none", marginBottom: 20 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />

            <p style={{ ...miniLabel, marginBottom: 8 }}>What you actually do, one plain sentence</p>
            <input
              value={work} maxLength={160}
              onChange={(e) => setWork(e.target.value)}
              placeholder="I make small-batch soy candles in Portland"
              onKeyDown={(e) => { if (e.key === "Enter" && ready) { track("aivis_ask"); ask(); } }}
              style={{ width: "100%", fontSize: 19, fontFamily: SERIF, color: INK, padding: "15px 18px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", outline: "none", marginBottom: 6 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />
            <p style={{ fontSize: 13, color: "#9A8F82", fontFamily: SANS, margin: "0 0 22px", lineHeight: 1.5 }}>
              The AI is asked about your name first, cold, before it sees this. So its answer can't cheat.
            </p>

            {error && (
              <p style={{ fontFamily: SANS, fontSize: 15, color: CORAL, margin: "0 0 16px" }}>{error}</p>
            )}

            <button className="mw-btn" onClick={() => { track("aivis_ask"); ask(); }} disabled={!ready}
              style={{ ...primaryBtn, opacity: ready ? 1 : 0.4, cursor: ready ? "pointer" : "not-allowed" }}>
              Ask the AI about me
            </button>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              Honest small print: this reads what one AI model learned during its training. It is not a live web
              search, and other assistants may know more or less. One mirror, not the verdict. Nothing you type here is saved.
            </p>
          </div>
        )}

        {/* ── LOADING ── */}
        {busy && (
          <div className="mw-fade" style={{ textAlign: "center", padding: "60px 0" }}>
            <DoodleGlass size={40} />
            <p style={{ fontSize: 22, margin: "18px 0 6px" }}>
              {phase === "asking" ? "Asking the AI about you, cold." : "Reading its answer back."}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15, color: "#857B70", margin: 0 }}>
              {phase === "asking" ? `"What do you know about ${name.trim()}?"` : "Matching what it said against what you actually do."}
            </p>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "done" && diag && v && (
          <div className="mw-fade">
            <p style={{ ...miniLabel, marginBottom: 14 }}>What the AI said, word for word</p>
            <div style={{ ...plainCard, borderLeft: `4px solid ${INK_TEAL}`, marginBottom: 26 }}>
              <p style={{ fontSize: 19, lineHeight: 1.6, fontStyle: "italic", margin: 0, color: INK }}>
                &ldquo;{blind.answer}&rdquo;
              </p>
            </div>

            <div style={{ background: v.tint, border: `2px solid ${v.border}`, borderRadius: 18, padding: "24px 26px", marginBottom: 26 }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: v.ink, fontWeight: 700, margin: "0 0 6px" }}>
                {v.tag} · {v.read}
              </p>
              <p style={{ fontSize: 19, lineHeight: 1.6, margin: 0, color: INK }}>{diag.read}</p>
            </div>

            <p style={{ ...miniLabel, marginBottom: 4 }}>The fix list, yours specifically</p>
            <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 18px", fontFamily: SANS, lineHeight: 1.5 }}>
              Three moves, each under twenty minutes. No posting schedule, no performing.
            </p>
            {diag.fixes.slice(0, 4).map((f, i) => (
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

            {diag.today && (
              <div style={{ background: INK_TEAL, borderRadius: 18, padding: "24px 26px", margin: "24px 0 0" }}>
                <p style={{ ...miniLabel, color: BUTTER, marginBottom: 8 }}>If you only do one thing</p>
                <p style={{ fontSize: 19, lineHeight: 1.55, color: "#FFF", margin: 0 }}>{diag.today}</p>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #E5DDD1", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                {copied ? "Copied ✓" : "Copy everything"}
              </button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Check another name</button>
            </div>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              This reflects one model's training, not a live search. Fixes take weeks to months to show up in
              AI answers, quiet consistency is exactly the game. Nothing you typed here was saved.
            </p>

            <div style={{ marginTop: 34, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px" }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>
                Want the words to put on that About page?
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
