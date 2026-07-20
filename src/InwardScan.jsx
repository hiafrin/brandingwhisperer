import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, GhostNumber, DropQuote, PageQuote,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard,
  remember,
} from "./lib/whisperKit.jsx";

// The Inward Pattern Scan: 8 taps, no typing, no AI call, nothing saved.
// It names a PRIMARY and SECONDARY visibility pattern, reads back the behaviors
// that give it away, tells them the channels people like them win on, and routes
// them through the tools in the right order. The routing is the product.

const QUESTIONS = [
  {
    label: "When it's time to promote your work, what actually happens?",
    help: "No wrong answer. This is about your pattern, not your effort.",
    options: [
      { text: "I push through, post a burst, then crash and go quiet", p: "pusher" },
      { text: "I quietly never do it, the work stays hidden", p: "hider" },
      { text: "I write the post, reread it, and delete it", p: "deleter" },
      { text: "I rewrite it ten times and never feel it's ready", p: "perfectionist" },
      { text: "I start five posts and finish none of them", p: "scatterer" },
    ],
  },
  {
    label: "If no one was watching and it truly couldn't fail, what would you make?",
    help: "The honest daydream, not the sensible answer.",
    options: [
      { text: "A quiet archive of my work, no captions, just the pieces", p: "hider" },
      { text: "One perfect, definitive thing I finally got exactly right", p: "perfectionist" },
      { text: "A dozen experiments in a dozen directions at once", p: "scatterer" },
      { text: "A big joyful flood of everything I've been sitting on", p: "pusher" },
      { text: "The honest things I usually write and then delete", p: "deleter" },
    ],
  },
  {
    label: "How do you feel about using AI for any of this?",
    help: "Be honest, it changes what I'd hand you.",
    options: [
      { text: "Relieved, it can do the part that drains me", p: "pusher" },
      { text: "Wary, I don't want to end up sounding not-me", p: "deleter" },
      { text: "Curious, but I'd second-guess everything it gave me", p: "perfectionist" },
      { text: "I'd generate a hundred things and use none of them", p: "scatterer" },
      { text: "I'd rather it help me stay quiet than get louder", p: "hider" },
    ],
  },
  {
    label: "What actually stops you, if you're being honest?",
    help: "The real one, underneath the practical excuses.",
    options: [
      { text: "Someone might judge me", p: "hider" },
      { text: "It never feels good enough to show", p: "perfectionist" },
      { text: "I run out of energy before I finish", p: "pusher" },
      { text: "It stops sounding like me the moment it's public", p: "deleter" },
      { text: "I can't pick which thing to focus on", p: "scatterer" },
    ],
  },
  {
    label: "Your drafts folder, or your notes app, honestly looks like...",
    help: "Nobody's looking but you.",
    options: [
      { text: "Empty, ideas never even make it to a draft", p: "hider" },
      { text: "Full of finished things that never went up", p: "deleter" },
      { text: "The same post, rewritten twenty times", p: "perfectionist" },
      { text: "Bursts of activity with long silent gaps", p: "pusher" },
      { text: "A hundred half-started, totally different things", p: "scatterer" },
    ],
  },
  {
    label: "Someone compliments your work out loud, in front of people. First instinct?",
    help: "The gut reaction, not the polite recovery.",
    options: [
      { text: "Change the subject as fast as I can", p: "hider" },
      { text: "Say it's nothing, brush it off", p: "deleter" },
      { text: "Point out what's still wrong with it", p: "perfectionist" },
      { text: "Ride the high and promise something bigger", p: "pusher" },
      { text: "Barely register it, I'm already onto the next thing", p: "scatterer" },
    ],
  },
  {
    label: "If you had an alias nobody could ever trace back to you, you'd...",
    help: "The mask question. What would you finally do?",
    options: [
      { text: "Finally post freely, it's me I've been hiding", p: "hider" },
      { text: "Say the honest things I delete under my own name", p: "deleter" },
      { text: "Still polish every single word", p: "perfectionist" },
      { text: "Post constantly for a week, then disappear", p: "pusher" },
      { text: "Run five accounts for five different ideas", p: "scatterer" },
    ],
  },
  {
    label: "Your energy comes back from...",
    help: "What actually refills you, not what you think should.",
    options: [
      { text: "Being alone with the work, nobody watching", p: "hider" },
      { text: "Finishing one thing, completely, at last", p: "perfectionist" },
      { text: "One good, deep, one-on-one conversation", p: "deleter" },
      { text: "A big win, even if I collapse right after", p: "pusher" },
      { text: "A fresh idea I haven't touched yet", p: "scatterer" },
    ],
  },
];

const TOOLS = {
  voice: { href: "#/shield", name: "Hear your voice", desc: "A quiet interview that observes the voice you already have and hands it back, named." },
  foundation: { href: "#/", name: "Define the brand", desc: "Six questions, then your foundation: what you're about, the moment you're for, the word to own." },
  roast: { href: "#/roast", name: "Rescue what you wrote", desc: "Paste your page or a deleted draft. It tells you what to keep, then what's worth a gentle fix." },
  plan: { href: "#/plan", name: "Get a plan that fits your energy", desc: "What to ignore, and a rhythm you can actually keep without crashing." },
};

const PATTERNS = {
  hider: {
    name: "The Hider",
    validate:
      "You built something good, then built a wall around it. Hiding protected you, nobody could judge what nobody saw. It worked too well, that's the only problem with it. Your instinct not to perform is right, researchers even back you on that. The advice you were handed was built for extroverts. The work was never the issue.",
    moments: { excited: "you make the thing, then quietly file it away", publish: "you find a reason not to", praise: "you change the subject" },
    succeed: { with: ["a quiet website or portfolio", "a small newsletter people opt into", "letting other people's words vouch for you"], without: "lives, stories, and daily posting" },
    path: ["voice", "foundation", "roast"],
    move: "Don't post anything. Text one person who loves your work and ask for two sentences about it. Their words go up first, credited to them.",
  },
  pusher: {
    name: "The Pusher",
    validate:
      "You can do visibility, you've proven it in every burst. You just pay for it in the crash after, and the silence that follows feels like failure, so the next burst has to be bigger. That's not a discipline problem, it's a pacing one. Your energy is a budget, and every plan you tried spent it like it was free.",
    moments: { excited: "you create a whole batch at once", publish: "you post all of it, then vanish", praise: "you promise even more than you can do" },
    succeed: { with: ["batching content in one sitting", "an email list you fill when the energy is there", "a scheduler that posts for you"], without: "daily posting and being on every single day" },
    path: ["plan", "foundation", "voice"],
    move: "Cancel one thing you planned to post this week. On purpose. A rhythm you can keep beats a burst you can't.",
  },
  deleter: {
    name: "The Deleter",
    validate:
      "You don't lack words, you have folders full of them. What you lack is a referee. You write something honest, a voice says it doesn't sound like you, and you believe it. Here's the thing, that voice has good taste. It's just never been given a job, so it rejects everything instead of fixing anything.",
    moments: { excited: "you write something real", publish: "you reread it and delete it", praise: "you minimize it" },
    succeed: { with: ["an editor in the loop before you post", "one pinned post you never have to redo", "referrals, where someone else does the talking"], without: "the blank-page feed and posting from scratch daily" },
    path: ["roast", "voice", "foundation"],
    move: "Find the last thing you wrote and didn't post. Paste it into the gentle roast before you reread it. Let it come back fixed, not deleted.",
  },
  perfectionist: {
    name: "The Perfectionist",
    validate:
      "Your high standards are real, and they're part of why your work is good. But somewhere the standard stopped being a tool and became a wall. Nothing ships because nothing is finished, and nothing is finished because finished feels like exposure. The work isn't the problem. The rule that it has to be flawless before anyone sees it, that's the problem.",
    moments: { excited: "you start polishing", publish: "you rewrite it one more time, and one more", praise: "you point out what's still wrong with it" },
    succeed: { with: ["evergreen pieces you make once and keep", "one deep portfolio or essay instead of many posts", "letting good and true be the bar, not flawless"], without: "high-frequency posting and chasing the feed" },
    path: ["roast", "foundation", "plan"],
    move: "Take the thing you've been polishing. Post the version you have right now, before you touch it again. Done and true beats perfect and hidden.",
  },
  scatterer: {
    name: "The Scatterer",
    validate:
      "You're not short on ideas, you're drowning in them, and that gift can feel like a curse. Every new direction is exciting, so you start five and finish none, and from the outside it looks like you never showed up. You don't need more ideas. You need one to be allowed to be the main thing for a while.",
    moments: { excited: "you start five new things", publish: "you're already onto the next idea", praise: "you barely register it, you've moved on" },
    succeed: { with: ["one channel and one repeated format", "a newsletter with the same shape each time", "one through-line to follow for a whole season"], without: "being everywhere and starting a new thing each week" },
    path: ["plan", "foundation", "voice"],
    move: "Pick the one idea you'd keep if you had to drop the rest. Just for this week, it's the only one. The others will wait, they always do.",
  },
};

// Tie-break toward the gentler, more self-protective read.
const TIE_ORDER = ["hider", "deleter", "perfectionist", "scatterer", "pusher"];

export default function InwardScan() {
  const [step, setStep] = useState(-1);
  const [votes, setVotes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [kept, setKept] = useState(false);

  function start() {
    track("scan_started");
    setVotes([]);
    setStep(0);
  }

  function answer(p) {
    const v = [...votes, p];
    setVotes(v);
    if (step + 1 >= QUESTIONS.length) { setStep(QUESTIONS.length); track("scan_completed"); }
    else setStep(step + 1);
  }

  function back() {
    if (step > 0) { setVotes(votes.slice(0, -1)); setStep(step - 1); }
    else if (step === 0) setStep(-1);
  }

  function score(v) {
    const tally = { hider: 0, pusher: 0, deleter: 0, perfectionist: 0, scatterer: 0 };
    v.forEach((p) => { if (p in tally) tally[p] += 1; });
    const ranked = Object.keys(tally).sort((a, b) => {
      if (tally[b] !== tally[a]) return tally[b] - tally[a];
      return TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b);
    });
    const primary = ranked[0];
    const secondary = tally[ranked[1]] >= 2 ? ranked[1] : null; // only show a real second streak
    return { primary, secondary };
  }

  const done = step === QUESTIONS.length;
  const { primary, secondary } = done ? score(votes) : {};
  const pattern = primary ? PATTERNS[primary] : null;
  const sec = secondary ? PATTERNS[secondary] : null;

  function copyResult() {
    if (!pattern) return;
    let t = `MY VISIBILITY PATTERN, from Branding Inward\n\nPrimary: ${pattern.name}${sec ? `\nSecondary: ${sec.name}` : ""}\n\n${pattern.validate}\n\nWHAT GIVES IT AWAY:\nWhen I'm excited, ${pattern.moments.excited}.\nWhen it's time to publish, ${pattern.moments.publish}.\nWhen someone praises me, ${pattern.moments.praise}.\n\nPEOPLE LIKE ME SUCCEED WITH:\n${pattern.succeed.with.map((x) => "- " + x).join("\n")}\nNot: ${pattern.succeed.without}\n\nMY PATH, IN ORDER:\n`;
    pattern.path.forEach((k, i) => { t += `${i + 1}. ${TOOLS[k].name} (brandinginward.com/${TOOLS[k].href})\n`; });
    t += `\nMY FIRST MOVE:\n${pattern.move}`;
    navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  }

  const q = step >= 0 && step < QUESTIONS.length ? QUESTIONS[step] : null;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
              Branding Inward
            </span>
          </a>
        </div>

        {/* INTRO */}
        {step === -1 && (
          <div className="mw-fade">
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 14px" }}>The inward pattern scan</p>
            <h1 style={{ fontSize: "clamp(36px, 5.5vw, 50px)", lineHeight: 1.1, margin: "0 0 20px", fontWeight: 350 }}>
              Everyone gets stuck<br />
              <span style={{ fontStyle: "italic", color: ACCENT }}>in their own particular way.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", maxWidth: 520, margin: "0 0 12px" }}>
              Some people hide. Some burst and crash. Some write the post and delete it. Some polish
              it forever. Some have too many ideas to pick one. Eight quick taps, and you'll know your
              pattern, the behaviors that give it away, and which of these tools to use first.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#857B70", maxWidth: 520, margin: "0 0 32px", fontFamily: SANS }}>
              No typing, no right answers, nothing saved. It runs entirely on this page.
            </p>
            <button className="mw-btn" onClick={start} style={primaryBtn}>Find my pattern (8 taps)</button>
          </div>
        )}

        {/* QUESTIONS */}
        {q && (
          <div className="mw-fade" key={step}>
            <div style={{ display: "flex", gap: 6, marginBottom: 30 }}>
              {QUESTIONS.map((_, i) => (
                <span key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? ACCENT : "#E5DDD1", transition: "background .3s" }} />
              ))}
            </div>
            <div style={{ position: "relative", paddingTop: 34 }}>
              <GhostNumber n={step + 1} />
              <p style={{ fontFamily: SANS, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, margin: "0 0 14px", position: "relative" }}>
                {step + 1} of {QUESTIONS.length}
              </p>
              <h2 style={{ fontSize: 30, lineHeight: 1.2, margin: "0 0 8px", fontWeight: 400, position: "relative" }}>{q.label}</h2>
              <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 22px", fontFamily: SANS, position: "relative" }}>{q.help}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((o, i) => (
                <button
                  key={i}
                  className="mw-btn"
                  onClick={() => answer(o.p)}
                  style={{ textAlign: "left", background: "#FFF", color: INK, border: "2px solid #E5DDD1", borderRadius: 14, padding: "16px 20px", fontSize: 17, fontFamily: SERIF, cursor: "pointer", lineHeight: 1.45, transition: "all .18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5DDD1"; }}
                >
                  {o.text}
                </button>
              ))}
            </div>
            <button className="mw-ghost" onClick={back} style={{ ...ghostBtn, marginLeft: 0, marginTop: 20 }}>Back</button>
          </div>
        )}

        {/* RESULT */}
        {pattern && (
          <div className="mw-fade">
            <p style={miniLabel}>Your visibility pattern</p>

            <div className="mw-deal" style={heroCard}>
              <DropQuote />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, position: "relative" }}>
                <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#FFF", background: ACCENT, borderRadius: 100, padding: "5px 14px", fontWeight: 600 }}>Primary · {pattern.name}</span>
                {sec && <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: ACCENT, background: "#FFF", border: `1px solid ${ACCENT}`, borderRadius: 100, padding: "5px 14px", fontWeight: 600 }}>Secondary · {sec.name}</span>}
              </div>
              <p style={{ fontSize: 19, lineHeight: 1.55, margin: 0, color: INK, position: "relative" }}>{pattern.validate}</p>
            </div>

            <div className="mw-deal" style={{ ...plainCard, marginTop: 6 }}>
              <p style={{ ...miniLabel, marginBottom: 14 }}>What gives it away</p>
              {[["When you're excited,", pattern.moments.excited], ["When it's time to publish,", pattern.moments.publish], ["When someone praises you,", pattern.moments.praise]].map(([when, then], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: i ? "12px 0 0" : "0", borderTop: i ? "1px solid #EFE7DA" : "none", marginTop: i ? 12 : 0 }}>
                  <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 14, color: "#857B70", minWidth: 168 }}>{when}</span>
                  <span style={{ fontSize: 18, lineHeight: 1.4 }}>{then}.</span>
                </div>
              ))}
            </div>

            <div className="mw-deal" style={{ ...plainCard, background: ACCENT_TINT, border: "1px solid #DCEFEA" }}>
              <p style={{ ...miniLabel, marginBottom: 12 }}>People like you usually succeed with</p>
              <ul style={{ margin: "0 0 14px", padding: 0, listStyle: "none" }}>
                {pattern.succeed.with.map((x, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 18, lineHeight: 1.5, marginBottom: 6 }}>
                    <span style={{ color: ACCENT, flexShrink: 0 }}>&#10003;</span>{x}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 16, fontFamily: SANS, color: "#857B70", margin: 0 }}>
                Not <span style={{ textDecoration: "line-through" }}>{pattern.succeed.without}</span>. You have permission to skip it.
              </p>
            </div>

            <div className="mw-deal" style={{ ...plainCard }}>
              <p style={{ ...miniLabel, marginBottom: 14 }}>Your path, in this order</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pattern.path.map((k, i) => (
                  <a key={k} href={TOOLS[k].href} onClick={() => track("scan_routed")} className="mw-card-hover" style={{ display: "flex", gap: 14, alignItems: "flex-start", textDecoration: "none", color: INK, background: i === 0 ? ACCENT_TINT : "#FFF", border: `1px solid ${i === 0 ? "#DCEFEA" : "#EFE7DA"}`, borderRadius: 14, padding: "14px 16px" }}>
                    <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: i === 0 ? ACCENT : "#EFE7DA", color: i === 0 ? "#FFF" : "#857B70", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 14, fontWeight: 700 }}>{i + 1}</span>
                    <span>
                      <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600 }}>
                        {TOOLS[k].name}
                        {i === 0 && <span style={{ fontSize: 11, background: ACCENT, color: "#FFF", borderRadius: 100, padding: "3px 10px", marginLeft: 8, verticalAlign: "2px" }}>start here</span>}
                      </span>
                      <span style={{ display: "block", fontSize: 14, color: "#857B70", fontFamily: SANS, lineHeight: 1.5, marginTop: 3 }}>{TOOLS[k].desc}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="mw-deal" style={{ background: INK_TEAL, borderRadius: 20, padding: "26px 28px", marginTop: 6 }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#F7D06B", fontWeight: 600, margin: "0 0 8px" }}>Your first move, under 15 minutes</p>
              <p style={{ fontSize: 17, lineHeight: 1.55, color: CREAM, margin: 0 }}>{pattern.move}</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={copyResult} style={primaryBtn}>{copied ? "Copied" : "Copy my pattern"}</button>
              <a href={TOOLS[pattern.path[0]].href} style={{ color: ACCENT, fontWeight: 600, textDecoration: "none", fontFamily: SANS, fontSize: 16 }}>
                Start step 1 &rarr;
              </a>
              <button className="mw-ghost" onClick={() => { setStep(-1); setKept(false); }} style={ghostBtn}>Retake</button>
            </div>

            <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "16px 18px", marginTop: 20 }}>
              {!kept ? (
                <>
                  <button className="mw-btn" onClick={() => { if (remember("pattern", primary)) setKept(true); }} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}`, boxShadow: "none", padding: "12px 22px", fontSize: 15 }}>
                    Keep this on my device
                  </button>
                  <p style={{ fontSize: 13, color: "#9A8F82", margin: "10px 0 0", fontFamily: SANS, lineHeight: 1.55 }}>
                    Your pattern stays in this browser only. It never leaves your device, and the home page will greet you with your weekly move instead of starting from zero. Clear it anytime from the footer.
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 14, color: ACCENT, margin: 0, fontFamily: SANS, fontWeight: 600 }}>
                  Kept, on this device only. The home page will remember you now.
                </p>
              )}
            </div>

            <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 18, fontFamily: SANS, lineHeight: 1.6 }}>
              There are no bad patterns. Each one protected you from something real. The tools just meet yours where it is.
            </p>
          </div>
        )}

        <PageQuote id="scan" />
      </div>

      {/* FOOTER */}
      <footer style={{ background: INK_TEAL, marginTop: 40 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 40px" }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.55)", margin: "0 0 18px", fontFamily: SANS, maxWidth: 620 }}>
            The scan runs entirely in your browser. Nothing you tap is saved or sent anywhere, just an anonymous count of how many people finish.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            &mdash; <span style={{ color: "#F7D06B" }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
