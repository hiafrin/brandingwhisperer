import React, { useState, useEffect, useRef } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, CORAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS,
  parseWhisperResponse, recall,
  GrainOverlay, ToolHero, WhatThisDoes, ToolsMenu, SiteFooter,
  primaryBtn, ghostBtn, miniLabel, plainCard,
} from "./lib/whisperKit.jsx";

// ── The AI Visibility Snapshot, the Branding Inward way. Outside the six-step
//    framework: the steps build the brand, this checks how findable it is and
//    then WRITES the words that fix it. The reframe the whole page stands on:
//    AI search can't hear volume, only clarity. The scan is LIVE: the AI runs
//    a few real web searches about the brand and reads their site if they gave
//    one, so the score is built from evidence, the receipts are shown, and the
//    kit is grounded in what actually exists. If the live scan fails, it falls
//    back to estimating from their answers and says so. No email gate. ──

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

// What the scan is doing takes 20 to 60 seconds and real progress isn't
// observable from here, so these rotate to carry the wait honestly.
const SCAN_LINES = [
  "Searching your name the way a stranger would.",
  "Checking who surfaces for your niche.",
  "Reading your site, if you shared one.",
  "Looking for third-party mentions.",
  "Scoring the five quiet signals.",
];

// Fallback rubric, used only when the live scan fails: the AI estimates from
// their answers alone, the way the tool worked before it could dig.
const ESTIMATE_LIBRARY = `THE FIVE QUIET SIGNALS (score each 0 to 20; note that not one requires performing, that framing matters to this person):
1. NAME CLARITY: can an engine tell them apart from everyone else with a similar name? A distinctive brand name scores high. A common personal name shared with anyone more visible scores low unless it's always paired with the craft. Judge from the name itself.
2. THE ANCHOR PAGE: one page they own that says plainly who they are, what they make, for whom, where. Judge from whether they gave a website.
3. SAME WORDS EVERYWHERE: identical bio wording across site, LinkedIn, Instagram, directories concentrates identity. You cannot verify this, so score it mid-range and say you couldn't check.
4. QUOTABLE ANSWERS: literal question-and-answer text engines can lift. You cannot verify this, so score it mid-range and say you couldn't check.
5. BEING CITED: third-party sources: directories, articles, podcasts, marketplaces. You cannot verify this, so score it mid-range and say you couldn't check.

SCORING RULES: be honest, not kind. Most small brands genuinely land between 20 and 55, and an inflated score helps nobody. The total is the sum of the five.`;

// Where each kit piece goes. Fixed and always true, so no AI is needed to say it.
const KIT_HOMES = {
  anchor: "Your About page, word for word. No About page yet? One plain page with just this on it counts.",
  bio: "Everywhere your name appears: site, LinkedIn, Instagram, directories. Identical, not just similar.",
  faqs: "A small FAQ block on your site, or three plain posts. Engines quote literal questions and answers.",
};

export default function AIVisibility() {
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [niche, setNiche] = useState("");
  const [work, setWork] = useState("");
  const [rival, setRival] = useState("");
  const [phase, setPhase] = useState("intro"); // intro | scanning | done
  const [scanLine, setScanLine] = useState(0);
  const [result, setResult] = useState(null);
  const [estimated, setEstimated] = useState(false); // true when the fallback ran
  const [kit, setKit] = useState(null);
  const [kitState, setKitState] = useState("idle"); // idle | writing | done | error
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const lineTimer = useRef(null);

  const ready = name.trim().length > 1 && niche.trim().length > 2 && work.trim().length > 3;

  useEffect(() => {
    if (phase === "scanning") {
      lineTimer.current = setInterval(() => setScanLine((i) => (i + 1) % SCAN_LINES.length), 6000);
    }
    return () => clearInterval(lineTimer.current);
  }, [phase]);

  function brandFacts() {
    return `Brand name: "${name.trim()}"
Website: ${site.trim() ? `"${site.trim()}"` : "none given"}
Niche: "${niche.trim()}"
What they do, in their words: "${work.trim()}"`;
  }

  // What the six steps already saved on this device. The kit gets sharper the
  // more of the framework they've done, which is the whole point of the bridge.
  function deviceMemory() {
    const mem = {};
    const voice = recall("voice"); if (voice) mem.voice = voice;
    const sample = recall("voicesample"); if (sample) mem.sample = sample;
    const about = recall("reallyabout"); if (about) mem.reallyabout = about;
    const edge = recall("edge"); if (edge) mem.edge = edge;
    return mem;
  }

  // ── The live scan: the server runs real searches and reads their site. ──
  async function runScan() {
    const r = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), site: site.trim(), niche: niche.trim(), work: work.trim(), rival: rival.trim() }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "scan failed");
    const g = parseWhisperResponse(d);
    if (!g || typeof g.score !== "number" || !Array.isArray(g.dimensions)) throw new Error("empty");
    return g;
  }

  // ── The fallback: estimate from their answers alone, and say so. ──
  async function runEstimate() {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: `You are the strategist behind Branding Inward's AI visibility snapshot. The live scan wasn't available, so you estimate from their answers alone. A low score must land as a clear starting point, never a scolding.

${ESTIMATE_LIBRARY}

HONESTY RULES: you have not visited their website and you have not searched the web. Never assert what their site or profiles contain. Where you could not check, the note says so plainly.

VOICE: plain, warm, short sentences. Address the person directly as "you" everywhere; never assume anyone's gender. No em-dashes or en-dashes, use commas and periods.

Return ONLY JSON, no markdown:
{"score": <integer 0 to 100>,
 "dimensions": [exactly 5, in the signals' order, each {"name": "...", "score": <0 to 20>, "note": "one sentence"}],
 "read": "2 or 3 sentences, warm, honest",
 "gap": "one plain sentence naming the weakest signal",
 "rivalNote": ""}`,
        user: `${brandFacts()}
Competitor or peer: ${rival.trim() ? `"${rival.trim()}"` : "none given"}`,
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "failed");
    const g = parseWhisperResponse(d);
    if (!g || typeof g.score !== "number" || !Array.isArray(g.dimensions)) throw new Error("empty");
    return g;
  }

  async function run() {
    if (!ready) return;
    setError(null); setResult(null); setKit(null); setKitState("idle"); setEstimated(false); setScanLine(0);
    setPhase("scanning");
    try {
      let g;
      try {
        g = await runScan();
      } catch (_) {
        g = await runEstimate();
        setEstimated(true);
        track("aivis_fallback");
      }
      g.score = Math.max(0, Math.min(100, Math.round(g.score)));
      setResult(g);
      setPhase("done");
      track("aivis_score_" + bandFor(g.score).name.toLowerCase().replace(/\s+/g, "-"));
    } catch (_) {
      setError("Couldn't finish the snapshot. Nothing was saved, give it another try in a moment.");
      setPhase("intro");
    }
  }

  async function writeKit(current) {
    const r0 = current || result;
    setKitState("writing");
    const mem = deviceMemory();
    const memLines = Object.entries(mem).map(([k, v]) => `- ${k === "voice" ? "Their voice, named by the voice tool" : k === "sample" ? "A post written in their voice" : k === "reallyabout" ? "What they're really about, from the six questions" : "Their un-copyable edge"}: "${String(v).slice(0, 400)}"`).join("\n");
    const evidence = Array.isArray(r0?.found) && r0.found.length
      ? `\nWHAT THE LIVE SCAN OF THEIR PRESENCE FOUND (ground the kit in this, close these gaps):\n${r0.found.map((f) => `- ${f}`).join("\n")}`
      : "";
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are the strategist behind Branding Inward's AI visibility snapshot, writing part two: the findability kit. The diagnosis is done; now you WRITE the three artifacts that make a quiet brand legible to AI search, ready to paste. The person finds self-promotion draining, so everything must sound like a calm human describing real work, never like marketing.

HONESTY RULES, the most important thing: use ONLY the facts they gave you and the scan findings below. Never invent credentials, years of experience, awards, clients, numbers, places, or product names that do not appear in their words. If a detail wasn't given, write around it. Plain, specific, true.

VOICE: write in the first person, as them. Plain, warm, short sentences. No hype words (passionate, journey, elevate, unlock). Do not use em-dashes or en-dashes anywhere, use commas and periods instead. Never assume gender.${memLines ? `\n\nTHEIR OWN MATERIAL, saved on their device by the six-step framework, use it so the kit sounds like them and only them:\n${memLines}` : ""}${evidence}

Return ONLY JSON, no markdown:
{"anchor": "the About-page paragraph, 70 to 110 words, first person: who they are, what they make, for whom, where if given, and the one thing that makes it theirs. This is the page an engine will anchor their identity to, so every sentence is a plain fact.",
 "bio": "one sentence, under 25 words, name + craft + who it's for + place if given. The sentence they paste everywhere, identically.",
 "faqs": [3 items, each {"q": "a question their actual customers would type or ask, in plain words", "a": "2 or 3 sentences, first person, answering it honestly with only the facts given"}]}`,
          user: `${brandFacts()}
Their weakest signal, from the diagnosis: "${r0?.gap || "not known"}"`,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "failed");
      const g = parseWhisperResponse(d);
      if (!g || !g.anchor || !g.bio || !Array.isArray(g.faqs)) throw new Error("empty");
      setKit(g);
      setKitState("done");
      track("aivis_kit");
    } catch (_) {
      setKitState("error");
    }
  }

  // Kick the kit off as soon as the score lands.
  useEffect(() => {
    if (phase === "done" && result && kitState === "idle") writeKit(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, result]);

  async function copyPiece(key, text) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); } catch (_) {}
  }

  async function copyAll() {
    if (!result) return;
    const band = bandFor(result.score);
    let t = `AI VISIBILITY SNAPSHOT: ${name.trim()}\n\nScore: ${result.score}/100, ${band.name}\n${result.read}\n`;
    if (Array.isArray(result.found) && result.found.length) {
      t += `\nWHAT THE SCAN FOUND\n`;
      result.found.forEach((f) => { t += `- ${f}\n`; });
    }
    t += `\nTHE FIVE QUIET SIGNALS\n`;
    result.dimensions.forEach((d) => { t += `${d.name}: ${d.score}/20. ${d.note}\n`; });
    if (result.rivalNote && rival.trim()) t += `\nOn ${rival.trim()}: ${result.rivalNote}\n`;
    if (kit) {
      t += `\nTHE FINDABILITY KIT\n\nYour anchor paragraph (${KIT_HOMES.anchor})\n${kit.anchor}\n\nYour one bio sentence (${KIT_HOMES.bio})\n${kit.bio}\n\nYour three quotable answers (${KIT_HOMES.faqs})\n`;
      kit.faqs.forEach((f) => { t += `\nQ: ${f.q}\nA: ${f.a}\n`; });
    }
    t += `\nFrom brandinginward.com/ai-visibility`;
    try { await navigator.clipboard.writeText(t); setCopied("all"); setTimeout(() => setCopied(null), 2000); } catch (_) {}
  }

  function restart() {
    setPhase("intro"); setResult(null); setError(null); setKit(null); setKitState("idle"); setEstimated(false);
  }

  const band = result ? bandFor(result.score) : null;
  const inputStyle = {
    width: "100%", fontSize: 18, fontFamily: SERIF, color: INK, padding: "14px 17px",
    borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", outline: "none",
  };
  const focusRing = { onFocus: (e) => (e.target.style.borderColor = ACCENT), onBlur: (e) => (e.target.style.borderColor = "#E5DDD1") };
  const copyBtn = (key, text) => (
    <button className="mw-ghost" onClick={() => copyPiece(key, text)} style={{ ...ghostBtn, marginLeft: 0, padding: "8px 16px", fontSize: 13 }}>
      {copied === key ? "Copied ✓" : "Copy this"}
    </button>
  );

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
          headline={<>AI search can't hear volume.<br /><span style={{ fontStyle: "italic", color: BUTTER }}>Only clarity.</span></>}
          sub="People ask AI assistants for recommendations now, and the engines can't tell who's loudest, only who's clearest. Tell me about your brand and I'll actually go look: a few real searches, a read of your site, then your findability score and the words that raise it."
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
              <span style={{ color: "#5C534B" }}>The six steps build your brand. This checks how findable it is, and writes the words that fix it.</span>
            </div>

            <WhatThisDoes
              walkaway="A live scan of how findable you are, scored out of 100, and the kit that raises it: an anchor paragraph, one bio sentence, three quotable answers."
              time="Two to three minutes. The scan itself takes about a minute, it's really looking."
              forwho="Anyone whose customers might ask an AI before they ask a friend."
            />

            <p style={{ fontSize: 18, lineHeight: 1.65, color: INK, fontWeight: 500, margin: "0 0 28px" }}>
              The good news hiding in AI search: it rewards exactly the quiet things. One clear page.
              The same words everywhere. Honest answers to real questions. Not one of them requires performing.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>Your brand name, or your own</p>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
                  placeholder="Cedar & Wick, or Sana Rahman" style={inputStyle} {...focusRing} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ ...miniLabel, marginBottom: 8 }}>Website, if you have one</p>
                <input value={site} maxLength={120} onChange={(e) => setSite(e.target.value)}
                  placeholder="cedarandwick.com (optional, but then I can actually read it)" style={inputStyle} {...focusRing} />
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

            {error && <p style={{ fontFamily: SANS, fontSize: 15, color: CORAL, margin: "0 0 16px" }}>{error}</p>}

            <button className="mw-btn" onClick={() => { track("aivis_run"); run(); }} disabled={!ready}
              style={{ ...primaryBtn, opacity: ready ? 1 : 0.4, cursor: ready ? "pointer" : "not-allowed" }}>
              Run my scan
            </button>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              Honest small print: this runs a few real web searches about your name and reads your site if you
              share one. It's a snapshot, not a full technical audit, and the web is bigger than one scan.
              Results appear right here, no email, and nothing you type is saved. If you've done the six steps,
              the kit borrows the voice and story already saved on your device.
            </p>
          </div>
        )}

        {/* ── SCANNING ── */}
        {phase === "scanning" && (
          <div className="mw-fade" style={{ textAlign: "center", padding: "60px 0" }}>
            <DoodleGlass size={40} />
            <p style={{ fontSize: 22, margin: "18px 0 6px" }}>Scanning for {name.trim()}.</p>
            <p style={{ fontFamily: SANS, fontSize: 15, color: "#857B70", margin: "0 0 4px" }}>
              {SCAN_LINES[scanLine]}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#9A8F82", margin: 0 }}>
              This takes about a minute. It's really looking.
            </p>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "done" && result && band && (
          <div className="mw-fade">
            {estimated && (
              <p style={{ fontFamily: SANS, fontSize: 14, color: "#857B70", background: "#F1EFE8", border: "1px solid #E5DDD1", borderRadius: 10, padding: "10px 14px", margin: "0 0 18px", lineHeight: 1.5 }}>
                The live scan didn't finish this time, so this one is estimated from your answers alone.
                Run it again in a bit for the full version.
              </p>
            )}

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

            {/* the receipts */}
            {Array.isArray(result.found) && result.found.length > 0 && (
              <>
                <p style={{ ...miniLabel, marginBottom: 14 }}>What the scan actually found</p>
                <div style={{ ...plainCard, borderLeft: `4px solid ${INK_TEAL}`, marginBottom: 26 }}>
                  {result.found.slice(0, 5).map((f, i) => (
                    <p key={i} style={{ fontSize: 16, lineHeight: 1.6, margin: i ? "10px 0 0" : 0, color: INK }}>
                      <span style={{ color: ACCENT, fontWeight: 700, marginRight: 8 }}>·</span>{f}
                    </p>
                  ))}
                </div>
              </>
            )}

            {/* the breakdown */}
            <p style={{ ...miniLabel, marginBottom: 4 }}>The five quiet signals</p>
            <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 14px", fontFamily: SANS, lineHeight: 1.5 }}>
              Not one of these requires posting, performing, or showing your face.
            </p>
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

            {/* ── THE KIT: not advice, the actual words ── */}
            <div style={{ borderTop: `2px solid ${INK_TEAL}`, marginTop: 34, paddingTop: 28 }}>
              <p style={{ ...miniLabel, marginBottom: 4 }}>The findability kit</p>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: INK, fontWeight: 500, margin: "0 0 20px" }}>
                Most tools would hand you a to-do list here. This writes the words instead.
                {result.gap ? <span style={{ color: "#5C534B", fontWeight: 400 }}> Built to close your biggest gap: {result.gap.charAt(0).toLowerCase() + result.gap.slice(1)}</span> : ""}
              </p>

              {kitState === "writing" && (
                <div style={{ ...plainCard, textAlign: "center", padding: "36px 24px" }}>
                  <DoodleGlass size={32} />
                  <p style={{ fontSize: 18, margin: "12px 0 4px" }}>Writing your kit.</p>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: "#857B70", margin: 0 }}>
                    An anchor paragraph, one bio sentence, three quotable answers. In your words, only your facts.
                  </p>
                </div>
              )}

              {kitState === "error" && (
                <div style={{ ...plainCard, textAlign: "center", padding: "28px 24px" }}>
                  <p style={{ fontSize: 16, margin: "0 0 14px", fontFamily: SANS, color: "#5C534B" }}>The kit didn't come through. The score stands, try the kit again.</p>
                  <button className="mw-btn" onClick={() => writeKit()} style={{ ...primaryBtn, padding: "11px 20px", fontSize: 14 }}>Write my kit</button>
                </div>
              )}

              {kitState === "done" && kit && (
                <>
                  <div style={{ ...plainCard, marginBottom: 16 }}>
                    <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: ".04em", textTransform: "uppercase", margin: "0 0 4px" }}>1 · Your anchor paragraph</p>
                    <p style={{ fontSize: 13, color: "#9A8F82", fontFamily: SANS, margin: "0 0 12px", lineHeight: 1.5 }}>{KIT_HOMES.anchor}</p>
                    <p style={{ fontSize: 17, lineHeight: 1.65, margin: "0 0 14px", color: INK }}>{kit.anchor}</p>
                    {copyBtn("anchor", kit.anchor)}
                  </div>

                  <div style={{ ...plainCard, marginBottom: 16 }}>
                    <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: ".04em", textTransform: "uppercase", margin: "0 0 4px" }}>2 · Your one bio sentence</p>
                    <p style={{ fontSize: 13, color: "#9A8F82", fontFamily: SANS, margin: "0 0 12px", lineHeight: 1.5 }}>{KIT_HOMES.bio}</p>
                    <p style={{ fontSize: 19, lineHeight: 1.55, fontStyle: "italic", margin: "0 0 14px", color: INK }}>&ldquo;{kit.bio}&rdquo;</p>
                    {copyBtn("bio", kit.bio)}
                  </div>

                  <div style={{ ...plainCard, marginBottom: 16 }}>
                    <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: ".04em", textTransform: "uppercase", margin: "0 0 4px" }}>3 · Your three quotable answers</p>
                    <p style={{ fontSize: 13, color: "#9A8F82", fontFamily: SANS, margin: "0 0 14px", lineHeight: 1.5 }}>{KIT_HOMES.faqs}</p>
                    {kit.faqs.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ padding: i ? "12px 0 0" : 0, marginTop: i ? 12 : 0, borderTop: i ? "1px solid #F1EDE4" : "none" }}>
                        <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: INK }}>{f.q}</p>
                        <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, fontFamily: SANS, color: "#5C534B" }}>{f.a}</p>
                      </div>
                    ))}
                    <div style={{ marginTop: 14 }}>
                      {copyBtn("faqs", kit.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n"))}
                    </div>
                  </div>

                  <div style={{ background: INK_TEAL, borderRadius: 18, padding: "24px 26px", margin: "24px 0 0" }}>
                    <p style={{ ...miniLabel, color: BUTTER, marginBottom: 8 }}>If you only do one thing</p>
                    <p style={{ fontSize: 19, lineHeight: 1.55, color: "#FFF", margin: 0 }}>
                      Paste the anchor paragraph onto your About page today. That single page is what every
                      other signal hangs from.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #E5DDD1", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                {copied === "all" ? "Copied ✓" : "Copy everything"}
              </button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Scan another brand</button>
            </div>

            <p style={{ fontSize: 14, color: "#9A8F82", fontFamily: SANS, margin: "18px 0 0", lineHeight: 1.6 }}>
              {estimated
                ? "Estimated from your own answers this time, not a live scan. A starting point, not a technical audit."
                : "Built from a light live scan: a few real searches plus your site if you shared it. The web is bigger than one scan, so treat this as a snapshot, not a full technical audit."}
              {" "}Changes take weeks to months to show up in AI answers, quiet consistency is exactly the game.
              Nothing you typed was saved.
            </p>

            <div style={{ marginTop: 34, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px" }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>
                Want a sharper kit?
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 12px", color: INK }}>
                This kit was written from a scan and three minutes of answers. Do the six steps and it gets
                rebuilt from your named voice and your un-copyable story, saved on your device, so it could
                only ever be yours.
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
