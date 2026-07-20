import { useState, useRef, useEffect } from "react";

// ── Shared design tokens, used by every whisper page ──
export const ACCENT = "#0F7C6C";      // teal, the primary
export const INK = "#2A2422";
export const CREAM = "#FBF7F0";
export const ACCENT_TINT = "#E8F4F2";
export const ACCENT_TINT_STRONG = "#DCEFEA";
export const ACCENT_RGB = "15,124,108";
export const INK_TEAL = "#0B3B34";    // deep teal for dark sections and the footer
export const CORAL = "#E76F51";       // warm secondary, the Kind Roast's color
export const CORAL_TINT = "#FBEAE3";
export const BUTTER = "#F7D06B";      // hand-drawn underline and highlight strokes

// ── Fonts (loaded via Google Fonts in index.html) ──
export const SERIF = "'Fraunces', 'Georgia', serif";
export const SANS = "'Inter', 'Helvetica Neue', sans-serif";

// ── The psychology library: real, cited principles every tool's prompt draws from.
//    This is the product's moat: outputs grounded in named science matched to the
//    user's own answers, never generic advice and NEVER invented studies. ──
export const PSYCH_LIBRARY = `THE PSYCHOLOGY LIBRARY (the ONLY science you may cite; never invent studies or numbers):
1. BRAGGING BACKFIRES (Carnegie Mellon study, 2015): people who self-promote are liked LESS and judged NO more competent, and they misjudge how their bragging lands on listeners. Use when: validating that their instinct against self-promotion is correct, dissolving shame.
2. THE 95-5 RULE (Ehrenberg-Bass Institute research): about 95% of your future buyers are not ready to buy today. A brand's real job is being remembered later, not converting now. Use when: they feel pressure to sell hard or post salesy content.
3. DISTINCTIVE ASSETS (researcher Jenni Romaniuk): small brands should not chase fame, they should pick a few unique repeatable things (a phrase, a color, a type of image) and never change them, so memory does the marketing. Use when: they ask how to be different. Different is a memory hook, not a louder claim.
4. MERE EXPOSURE (psychologist Robert Zajonc, 1968): simply showing up repeatedly makes people like and trust you more, no persuasion needed. A calm, regular rhythm beats bursts of loud effort. Use when: they worry they are not doing enough.
5. NEURAL COUPLING (Princeton neuroscientist Uri Hasson): when you tell a story, the listener's brain activity syncs with yours, and emotional detail is what makes memories stick. Origin stories and sensory specifics beat credentials and adjectives. Use when: shaping what they should actually say or post.
6. THE HANDMADE EFFECT (Journal of Marketing research): buyers pay more for handmade things because they feel "made with love," especially as gifts. Being one small maker is the premium, not the weakness. Use when: they feel too small or unprofessional.
7. SELF-CONGRUITY (psychologist Joseph Sirgy, 1982): people buy brands that match who THEY are or want to be. Your brand is a mirror for your customer, not a megaphone for you. Use when: reframing what the brand is about, away from self-exposure.

RULES FOR USING THE LIBRARY: the library is YOUR thinking, not their reading. NEVER name a principle, researcher, institution, study, year, or term in your output. Never write "neural coupling", "self-congruity", "mere exposure", "the 95-5 rule", "distinctive assets", "the handmade effect", or any phrase like "that's called X" or "researchers at Y". Instead, translate the mechanism into one plain human sentence, e.g. instead of "that's neural coupling" say "real details from your actual life are what people's minds hold onto", instead of "self-congruity" say "people buy things that let them be a little more of who they want to be". ONE exception: the phrase "researchers found" is allowed, at most once across your whole response, only for the finding that self-promoters are liked less, because there the proof itself is the comfort.

TONE: you are a warm therapist helping someone see their own brand clearly, not a lecturer. Reflect their own words back ("you said it yourself: ..."), notice patterns gently ("notice how your answers keep coming back to..."), never prescribe from authority. Match every insight to what THIS person actually said. If no principle fits naturally, say the plain truth without leaning on anything. Never fabricate research.`;

// ── Global CSS shared by every page: animations, texture, calm guards ──
export const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes dealIn { from { opacity: 0; transform: translateY(18px) rotate(-1.2deg);} to { opacity: 1; transform: translateY(0) rotate(0);} }
  @keyframes pulse { 0%,100% { opacity:.35;} 50% { opacity:1;} }
  @keyframes ring { 0% { box-shadow:0 0 0 0 rgba(${ACCENT_RGB},.45);} 70% { box-shadow:0 0 0 16px rgba(${ACCENT_RGB},0);} 100% { box-shadow:0 0 0 0 rgba(${ACCENT_RGB},0);} }
  @keyframes kenburns { from { transform: scale(1);} to { transform: scale(1.08);} }
  .mw-fade { animation: fadeUp .5s ease both; }
  .mw-deal { animation: dealIn .6s cubic-bezier(.2,.7,.3,1) both; }
  .mw-kenburns { animation: kenburns 24s ease-in-out alternate infinite; }
  .mw-area::placeholder { color:#B9AFA2; font-style:italic; }
  .mw-btn:hover { transform: translateY(-1px); filter: brightness(1.05);}
  .mw-btn:active { transform: translateY(0);}
  .mw-ghost:hover { color:${ACCENT};}
  .mw-mic-live { animation: ring 1.6s infinite;}
  .mw-card-hover { transition: transform .25s ease, box-shadow .25s ease; }
  .mw-card-hover:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(11,59,52,.10); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    video { display: none !important; }
  }
`;

// ── Faint paper grain overlay (SVG turbulence as data URI, fixed, non-interactive) ──
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
export function GrainOverlay() {
  return <div aria-hidden="true" style={{ position: "fixed", inset: 0, backgroundImage: GRAIN_URI, opacity: 0.05, pointerEvents: "none", zIndex: 5 }} />;
}

// ── Hand-drawn butter underline stroke, drops under a key word ──
export function UnderlineStroke({ color = BUTTER, width = 220 }) {
  return (
    <svg aria-hidden="true" width={width} height="14" viewBox="0 0 220 14" fill="none" style={{ display: "block", marginTop: 2 }}>
      <path d="M4 9 C 50 3, 95 11, 140 6 S 200 8, 216 5" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

// ── Line-drawn doodles, one per whisper ──
export function DoodleBubble({ color = ACCENT, size = 44 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12 C8 8.7 10.7 6 14 6 h20 c3.3 0 6 2.7 6 6 v12 c0 3.3-2.7 6-6 6 H22 l-8 8 v-8 h0 c-3.3 0-6-2.7-6-6 Z" />
      <path d="M16 15 h16 M16 21 h10" strokeDasharray="0.1 5" />
    </svg>
  );
}
export function DoodleShield({ color = ACCENT, size = 44 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 5 l14 5 v12 c0 9.5-6 15.5-14 20 -8-4.5-14-10.5-14-20 V10 Z" />
      <path d="M17 23 l5 5 9-10" />
    </svg>
  );
}
export function DoodleFlame({ color = CORAL, size = 44 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 5 c2 7 10 10 10 19 a10 10 0 0 1-20 0 c0-5 3-8 5-11 1.5 2.5 3 3.5 5 4 -1-4-1-8 0-12 Z" />
      <path d="M24 41 c-1.5-1.8-1.5-4.2 0-6 1.5 1.8 1.5 4.2 0 6 Z" strokeWidth="1.8" />
    </svg>
  );
}

// ── JSON parsing: the model sometimes wraps output in fences or gets cut short ──
export function salvagePartialJson(str) {
  for (let end = str.length; end > 20; end--) {
    const slice = str.slice(0, end);
    const candidates = [slice + "}", slice + "]}", slice + '"}]}', slice + '"}', slice.replace(/,\s*$/, "") + "}", slice.replace(/,\s*$/, "") + "]}"];
    for (const c of candidates) {
      try { const o = JSON.parse(c); if (o && typeof o === "object") return o; } catch (_) {}
    }
  }
  return null;
}

// Last-resort field extraction: pull every "key": "string" and "key": [array]
// pair individually, so ONE malformed key can't take down the whole response.
function extractFields(str) {
  const out = {};
  // value runs to the next quote that is followed by , } or a newline+key — this
  // survives UNESCAPED inner quotes, which the model produces now and then
  const strPairs = str.matchAll(/"([A-Za-z0-9_]+)\s*"+\s*:\s*"([\s\S]*?)"(?=\s*(?:,\s*"|[,}\n]))/g);
  for (const m of strPairs) {
    if (m[1] in out) continue;
    try { out[m[1]] = JSON.parse(`"${m[2].replace(/\\?"/g, '\\"')}"`); } catch (_) { out[m[1]] = m[2]; }
  }
  const arrPairs = str.matchAll(/"([A-Za-z0-9_]+)\s*"+\s*:\s*(\[[^\]]*\])/g);
  for (const m of arrPairs) { try { out[m[1]] = JSON.parse(m[2]); } catch (_) {} }
  return Object.keys(out).length ? out : null;
}

export function parseWhisperResponse(data) {
  const raw = (data.content || []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("").trim();
  if (!raw) return null;
  let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
  if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
  try { return JSON.parse(cleaned); } catch (_) {}
  // repair common model glitches (stray quotes/spaces in keys, missing colons, trailing commas), then retry
  const repaired = cleaned
    .replace(/"([A-Za-z0-9_]+)\s*"+\s*:/g, '"$1":')
    .replace(/([{,]\s*)"([A-Za-z0-9_]+)\s+"([^"])/g, '$1"$2": "$3')
    .replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(repaired); } catch (_) {}
  // last resort: combine backward-truncation salvage with per-field extraction,
  // so one mangled key mid-document can't drop everything after it. Per field,
  // keep whichever recovery found MORE (salvage can end a string early).
  const salvaged = salvagePartialJson(repaired) || {};
  const extracted = extractFields(repaired) || extractFields(cleaned) || {};
  const keys = new Set([...Object.keys(salvaged), ...Object.keys(extracted)]);
  if (!keys.size) return null;
  const merged = {};
  for (const k of keys) {
    const a = salvaged[k], b = extracted[k];
    if (a == null) merged[k] = b;
    else if (b == null) merged[k] = a;
    else if (typeof a === "string" && typeof b === "string") merged[k] = b.length > a.length ? b : a;
    else merged[k] = Array.isArray(a) && Array.isArray(b) && b.length > a.length ? b : a;
  }
  return merged;
}

// ── Voice input: browser SpeechRecognition, feature-detected with a text-only fallback ──
export function useVoiceInput(draft, setDraft) {
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const baseRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else intr += t;
      }
      if (fin) baseRef.current = (baseRef.current + " " + fin).trim();
      setDraft((baseRef.current + " " + intr).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch (_) {} };
  }, []);

  function toggleMic() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else { baseRef.current = draft; try { rec.start(); setListening(true); } catch (_) { setListening(false); } }
  }

  function resetBase() { baseRef.current = ""; }
  function setBase(v) { baseRef.current = v; }
  function stopIfListening() { if (listening && recognitionRef.current) { recognitionRef.current.stop(); setListening(false); } }

  return { listening, voiceSupported, toggleMic, resetBase, setBase, stopIfListening, baseRef };
}

export function MicIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

// ── Shared card/button style objects, same look on every whisper page ──
export const primaryBtn = { background: ACCENT, color: "#FFF", border: "none", borderRadius: 100, padding: "16px 32px", fontSize: 17, fontFamily: SANS, fontWeight: 600, cursor: "pointer", transition: "all .18s ease", boxShadow: "0 6px 18px rgba(15,124,108,.22)" };
export const ghostBtn = { background: "none", border: "none", color: "#9A8F82", fontSize: 16, cursor: "pointer", fontFamily: SANS, transition: "color .18s", marginLeft: "auto" };
export const miniLabel = { fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, margin: "0 0 10px", fontWeight: 600 };
export const plainCard = { background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px", marginBottom: 16, boxShadow: "0 8px 24px rgba(11,59,52,.05)" };
export const heroCard = { background: ACCENT_TINT, border: "1px solid #DCEFEA", borderLeft: `5px solid ${ACCENT}`, borderRadius: 16, padding: "28px 28px", marginBottom: 16, boxShadow: "0 10px 28px rgba(11,59,52,.08)", position: "relative", overflow: "hidden" };
export const quoteCard = { background: ACCENT_TINT, border: "1px solid #DCEFEA", borderRadius: 16, padding: "22px 24px", marginBottom: 16 };
export const todayBox = { background: INK_TEAL, borderRadius: 20, padding: "30px 32px", marginTop: 30, boxShadow: "0 14px 34px rgba(11,59,52,.25)" };
export const bridgeBox = { background: ACCENT_TINT, border: "1px solid #DCEFEA", borderRadius: 16, padding: "22px 24px" };
export const dayCard = { background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "20px 22px", marginBottom: 14, boxShadow: "0 8px 24px rgba(11,59,52,.05)" };
export const dayBadge = { flexShrink: 0, background: ACCENT_TINT_STRONG, color: ACCENT, borderRadius: 100, padding: "4px 12px", fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: ".04em" };

// ── Oversized ghost number behind question headings ──
export function GhostNumber({ n }) {
  return (
    <span aria-hidden="true" style={{ position: "absolute", top: -34, left: -8, fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 130, lineHeight: 1, color: `rgba(${ACCENT_RGB},0.09)`, userSelect: "none", zIndex: 0 }}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

// ── Oversized drop-cap quote mark for hero result cards ──
export function DropQuote({ color = ACCENT }) {
  return (
    <span aria-hidden="true" style={{ position: "absolute", top: -18, right: 14, fontFamily: SERIF, fontStyle: "italic", fontSize: 120, lineHeight: 1, color, opacity: 0.12, userSelect: "none" }}>
      "
    </span>
  );
}
