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

// ── Device memory: localStorage only, never sent anywhere. This is the whole
//    retention model: the site remembers you ON YOUR DEVICE, or not at all. ──
const MEM_PREFIX = "inward.";
export function remember(key, value) {
  try { localStorage.setItem(MEM_PREFIX + key, JSON.stringify(value)); return true; } catch (_) { return false; }
}
export function recall(key) {
  try { const v = localStorage.getItem(MEM_PREFIX + key); return v ? JSON.parse(v) : null; } catch (_) { return null; }
}
export function forgetAll() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(MEM_PREFIX)).forEach((k) => localStorage.removeItem(k));
    return true;
  } catch (_) { return false; }
}

// ── The weekly quiet moves, by energy level. Deterministic rotation (week
//    number picks the move), no AI call, no backend, nothing tracked. ──
export const QUIET_MOVES = {
  low: [
    "Leave one specific, generous comment on another maker's post. That's the whole move, visibility through recognition, no post of your own required.",
    "Take one photo of your work mid-process. Post it with five words or fewer, or just save it for a week when you have more in the tank.",
    "Reread the last kind message someone sent about your work. Screenshot it into a folder called proof. That folder is marketing.",
    "Open your pinned post or bio, read it once, change one word if it needs it. A standing invitation only needs to exist, not be re-announced.",
  ],
  okay: [
    "Text one person who loves your work and ask for two sentences about it. Post their words as your caption this week, credited to them.",
    "Record a five minute voice memo about what you're making right now, like you're telling a friend. Pull one sentence out of it, that's your caption.",
    "Find one open call, directory, or features-wanted thread in your niche and submit to it. Being chosen beats self-promoting.",
    "Feature someone else's work this week, a shoutout or a tiny roundup. Curators get watched for months without ever selling themselves.",
  ],
  good: [
    "Write the honest story of one thing you made this week, three sentences, real details. Post it once, then you're done, no follow-up required.",
    "Batch three process photos in one sitting and schedule them across the next two weeks. Perform once, privately, be present for weeks.",
    "Send one short note to your list, or to the five people who'd want to know: what's new, one picture, no hype. Connection, not performance.",
    "Propose the buddy trade to one creator your size: you each say the honest thing about the OTHER's work. Praise costs a shy person nothing when it's aimed away from them.",
  ],
};

// ── The quiet channel library: her researched blueprint, for planning prompts.
//    Channels rated by performative cost, plus per-creator quiet stacks. ──
export const CHANNEL_LIBRARY = `THE QUIET CHANNEL LIBRARY (use to prescribe stacks; mention tool types generically, never brand names):
Channels by performative cost:
- EMAIL LIST (LOW): they write alone, when they have something to say, and automation sends it. Connection without performance. The single best quiet channel for drops, releases, and news.
- OWN SITE / WRITTEN CONTENT (LOW): a calm one-page home base plus occasional written pieces. People arrive by search and shares, not by the person being "on." Controlled, low-stimulus visibility.
- PINTEREST / SEARCH-DISCOVERY PLATFORMS (LOW-MEDIUM): discovery through search, not presence. Pins and visuals quietly compound over time. Design work, not face work.
- SCHEDULED SOCIAL (MEDIUM): batch-create in private, let a scheduler publish. Presence without being on daily. Personality lives in writing and images, not in live performance.
- LIVES, STORIES, DAILY VIDEO (HIGH): real-time performance. Deprioritize by default for this audience. Only ever optional, never the backbone of a plan.

Quiet stacks by creator type (adapt to their craft, keep it to 2-3 pieces):
- MAKER (jewelry, ceramics, art, food): one-page site with shop link and email signup + a drops email when new work exists + scheduled process photos or pins. No talking to camera anywhere in the stack.
- MUSICIAN: a home base with the music embedded + a release email list (dates, presaves, early merch) + ONE platform of short written notes about the songs, scheduled. Production and craft first, performance optional and only when ready.
- PERSONAL BRAND / SERVICE (coach, consultant, designer, tutor): simple site that says who they help + one written platform a few times a week + a small newsletter for the people who want depth. Testimonials and case studies do the talking.

RULES: every plan names what to deliberately IGNORE and says it's safe to ignore it, because a channel that costs more energy than it returns is a leak, not a strategy. The stack must fit inside the time they actually gave. One post a week on one channel, kept up for a year, beats everything they've been told.`;

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

// ── One gentle, short line per page. Literary and soft, never a hustle-quote,
//    because this audience recoils from "crush it" energy. Attributed. ──
export const QUOTES = {
  home: { q: "The only journey is the one within.", a: "Rainer Maria Rilke" },
  scan: { q: "Too many people overvalue what they are not and undervalue what they are.", a: "Malcolm Forbes" },
  // Widely quoted, but not found in Wilde's writing, so we attribute it honestly.
  voice: { q: "Be yourself; everyone else is already taken.", a: "Often attributed to Oscar Wilde" },
  roast: { q: "Perfectionism is the voice of the oppressor.", a: "Anne Lamott" },
  plan: { q: "Great things are done by a series of small things brought together.", a: "Vincent van Gogh" },
};
export function PageQuote({ id }) {
  const item = QUOTES[id];
  if (!item) return null;
  return (
    <div style={{ maxWidth: 600, margin: "64px auto 0", padding: "0 24px", textAlign: "center" }}>
      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 22, lineHeight: 1.45, color: INK, margin: "0 0 12px" }}>&ldquo;{item.q}&rdquo;</p>
      <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, margin: 0, fontWeight: 600 }}>{item.a}</p>
    </div>
  );
}

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

export function DoodleCompass({ color = ACCENT, size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="24" cy="24" r="17" />
      <path d="M31 17 L27 27 L17 31 L21 21 Z" />
      <circle cx="24" cy="24" r="1.6" fill={color} />
    </svg>
  );
}
export function DoodleScan({ color = ACCENT, size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="21" cy="21" r="13" />
      <path d="M30.5 30.5 L40 40" />
      <path d="M15 21 a6 6 0 0 1 6 -6" />
    </svg>
  );
}

// ── The tool registry: single source of truth for every page. Home cards, the
//    scan's routing, and the NextTools bridge all read from here, so a tool is
//    described in exactly one place. ──
export const TOOLS = {
  scan: { key: "scan", href: "#/scan", name: "The inward scan", pain: "I don't even know where I'm stuck, let alone where to start.", cta: "Find your pattern, 8 taps", accent: BUTTER, Doodle: DoodleScan },
  foundation: { key: "foundation", href: "#/", name: "The six questions", pain: "I don't know what actually makes me different.", cta: "Find what you're really about", accent: ACCENT, Doodle: DoodleBubble },
  voice: { key: "voice", href: "#/shield", name: "Your brand voice", pain: "Posting feels like exposing myself, not my work.", cta: "Hear the voice you already have", accent: ACCENT, Doodle: DoodleShield },
  roast: { key: "roast", href: "#/roast", name: "The gentle roast", pain: "I wrote the post. Then I deleted it, it didn't sound like me.", cta: "Get it read, kindly", accent: CORAL, Doodle: DoodleFlame },
  plan: { key: "plan", href: "#/plan", name: "The quieter plan", pain: "I can't post every day. Honestly, I don't want to.", cta: "Find the plan you won't dread", accent: ACCENT, Doodle: DoodleCompass },
};

// Which two siblings to show at the end of each tool, so no page is a dead end.
const NEXT = {
  scan: ["voice", "plan"],
  foundation: ["voice", "roast"],
  voice: ["roast", "plan"],
  roast: ["voice", "plan"],
  plan: ["voice", "roast"],
};

// ── The "where to next" bridge, at the end of every tool page. ──
export function NextTools({ current }) {
  const pair = (NEXT[current] || ["voice", "plan"]).map((k) => TOOLS[k]).filter(Boolean);
  return (
    <section style={{ maxWidth: 920, margin: "56px auto 0", padding: "0 24px" }}>
      <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 4px" }}>Where to next</p>
      <p style={{ fontSize: 16, color: "#857B70", margin: "0 0 18px", fontFamily: SANS }}>These tools work together. Same voice, one small step at a time.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {pair.map((t) => (
          <a key={t.key} href={t.href} onClick={() => track("next_" + current + "_" + t.key)} className="mw-card-hover" style={{ display: "block", textDecoration: "none", color: INK, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
            <t.Doodle color={t.accent} />
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: t.accent === BUTTER ? "#854F0B" : t.accent, fontWeight: 700, margin: "12px 0 6px" }}>{t.name}</p>
            <p style={{ fontSize: 18, lineHeight: 1.4, fontStyle: "italic", margin: "0 0 12px" }}>&ldquo;{t.pain}&rdquo;</p>
            <span style={{ color: ACCENT, fontWeight: 600, fontFamily: SANS, fontSize: 15 }}>{t.cta} &rarr;</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Real, documented people who built brands without performing. NEVER
//    invented testimonials, and none of them use this site. Single source
//    of truth, shared by the home band and every tool page. ──
export const PROOF_PEOPLE = [
  { who: "Cal Newport", what: "Writer, professor", how: "Has never opened a single social media account. Built a huge readership through long-form writing and an email list, and sold millions of books.", href: "https://en.wikipedia.org/wiki/Cal_Newport" },
  { who: "Florian Gadsby", what: "Potter", how: "Grew to millions of followers on slow, quiet videos of his hands at the wheel, captions instead of hype, his face mostly out of shot. The work carries it.", href: "https://www.craftscouncil.org.uk/stories/a-potter-of-influence" },
  { who: "Burial", what: "Musician", how: "Refused even press photos and has never played a single live show. His second album is still called a landmark. The music did the talking.", href: "https://en.wikipedia.org/wiki/Burial_(musician)" },
];

// ── The proof band: same shape everywhere. Home passes its own copy; each
//    tool page passes a headline, intro, and a real motivational quote that
//    fits that tool, so every page reveals the mission, not just home. ──
export function SuccessProof({ id, eyebrow = "Quiet people who built it anyway", headline, intro, quote, people = PROOF_PEOPLE }) {
  return (
    <section id={id} style={{ maxWidth: 920, margin: "0 auto", padding: "72px 24px 8px" }}>
      <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>{eyebrow}</p>
      {headline && (
        <h2 style={{ fontSize: "clamp(26px, 3.6vw, 34px)", lineHeight: 1.2, margin: "0 0 8px", fontWeight: 350 }}>{headline}</h2>
      )}
      {intro && (
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#857B70", margin: "0 0 26px", fontFamily: SANS, maxWidth: 620 }}>{intro}</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {people.map((p, i) => (
          <div key={i} style={{ ...plainCard, marginBottom: 0, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 22, fontWeight: 400, margin: "0 0 2px" }}>{p.who}</p>
            <p style={{ fontFamily: SANS, fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 12px" }}>{p.what}</p>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: "#3D3630", margin: "0 0 14px" }}>{p.how}</p>
            <a href={p.href} style={{ fontFamily: SANS, fontSize: 13, color: "#9A8F82", textDecoration: "underline", marginTop: "auto" }}>Read their story &rarr;</a>
          </div>
        ))}
      </div>
      {quote && (
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, lineHeight: 1.45, color: INK, textAlign: "center", margin: "40px auto 0", maxWidth: 560 }}>
          &ldquo;{quote.q}&rdquo;
          <span style={{ display: "block", fontFamily: SANS, fontStyle: "normal", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginTop: 10 }}>{quote.a}</span>
        </p>
      )}
    </section>
  );
}

// ── Shared editorial hero band: full-bleed photo + dark wash + oversized doodle
//    + ghost label + big mixed-weight headline, so every tool page gets home's
//    richness instead of flat cream. prefers-reduced-motion kills the zoom. ──
export function ToolHero({ label, photo, accent = ACCENT, Doodle, headline, sub, children }) {
  const labelInk = accent === BUTTER ? "#F7D06B" : accent === CORAL ? "#F0997B" : "#9FE1CB";
  return (
    <section style={{ position: "relative", overflow: "hidden", background: INK_TEAL }}>
      {photo && (
        <img src={photo} alt="" aria-hidden="true" className="mw-kenburns"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, rgba(11,59,52,.82) 0%, rgba(11,59,52,.66) 45%, rgba(11,59,52,.9) 100%)" }} />
      <div className="mw-fade" style={{ position: "relative", maxWidth: 920, margin: "0 auto", padding: "48px 24px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: accent }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>Branding Inward</span>
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          {Doodle && <Doodle color={accent} size={40} />}
          <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: labelInk, fontWeight: 600, margin: 0 }}>{label}</p>
        </div>
        <h1 style={{ fontSize: "clamp(38px, 5.5vw, 56px)", lineHeight: 1.08, margin: "0 0 20px", fontWeight: 350, color: CREAM }}>{headline}</h1>
        {sub && <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(251,247,240,.85)", maxWidth: 560, margin: "0 0 28px" }}>{sub}</p>}
        {children}
      </div>
    </section>
  );
}

// ── Every tool says what it does before it asks for anything. ──
export function WhatThisDoes({ walkaway, time, forwho }) {
  const rows = [["You walk away with", walkaway], ["Time", time], ["Made for", forwho]].filter((r) => r[1]);
  return (
    <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "20px 24px", margin: "0 0 28px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
      <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 12px" }}>What this does for you</p>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: i ? "10px 0 0" : 0, borderTop: i ? "1px solid #F1EDE4" : "none", marginTop: i ? 10 : 0 }}>
          <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 13, color: "#9A8F82", minWidth: 128 }}>{k}</span>
          <span style={{ fontSize: 17, lineHeight: 1.45, color: INK }}>{v}</span>
        </div>
      ))}
    </div>
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
