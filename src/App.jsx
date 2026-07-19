import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, ACCENT_RGB, INK_TEAL, CORAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, UnderlineStroke, DoodleBubble, DoodleShield, GhostNumber, DropQuote,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, todayBox, bridgeBox, dayCard, dayBadge,
} from "./lib/whisperKit.jsx";

// ── The six questions — worded to fit anyone building a brand: a business OR a personal one ──
const QUESTIONS = [
  {
    id: "business",
    label: "What are you building, in one plain sentence?",
    help: "A business, a product, or just your own name. \"I'm a freelance designer\" works too.",
    placeholder: "I make soy candles, or I'm building my name as a career coach",
  },
  {
    id: "customer",
    label: "Picture one real person you want to reach. Who are they?",
    help: "A type of person, not \"everyone.\" The more specific, the better.",
    placeholder: "Women in their 30s into cozy self-care, or new managers who feel out of their depth",
  },
  {
    id: "different",
    label: "Why would someone choose you over the others out there?",
    help: "Even if it feels small. Your style, your story, your point of view, made by you.",
    placeholder: "Clean small-batch candles, or I've actually done the job I'm coaching on",
  },
  {
    id: "feeling",
    label: "When someone discovers you, what's the ONE thing you want them to feel?",
    help: "Pick a single feeling. This becomes the soul of your brand.",
    placeholder: "Calm, or \"finally, someone who gets it\"",
  },
  {
    id: "where",
    label: "Where do the people you want to reach already spend time?",
    help: "Online or in real life. Instagram, LinkedIn, Pinterest, a niche forum, local events...",
    placeholder: "Instagram and Pinterest, or LinkedIn and industry Slack groups",
  },
  {
    id: "goal",
    label: "What would make the next 3 months a win?",
    help: "Be honest about where you are. \"First 10 sales\" or \"500 real followers\" both count.",
    placeholder: "My first 30 sales, or known as a go-to voice in my niche",
  },
];

// ── Other whispers, linked from the home page. Each new whisper just adds one entry here. ──
const MORE_WHISPERS = [
  {
    key: "shield",
    quote: "Posting feels like exposing myself, not my work.",
    href: "#/shield",
    event: "opened_shield",
    cta: "Find a voice that sounds like you →",
  },
];

export default function BrandingWhisperer() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0); // how many insight cards are shown — one at a time
  const [plan, setPlan] = useState(null);        // the 7-day plan, fetched on demand
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [dayReveal, setDayReveal] = useState(0); // how many days are shown — one at a time
  const [phase, setPhase] = useState("foundation"); // "foundation" | "plan"
  const [posts, setPosts] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // Build a plain-text version of everything so far
  function buildSummary() {
    if (!result) return "";
    let t = "MY BRAND, from Branding Inward\n\n";
    if (result.pain) t += `The real reason they'd choose me:\n${result.pain}\n\n`;
    if (result.reframe) t += `What I'm really about:\n${result.reframe}\n\n`;
    if (result.edge) t += `What makes me un-copyable:\n${result.edge}\n\n`;
    if (result.personality) t += `My brand's personality:\n${result.personality}\n\n`;
    if (result.against) t += `What I stand against:\n${result.against}\n\n`;
    if (posts?.posts?.length) {
      t += "POST IDEAS:\n";
      posts.posts.forEach((p, i) => { t += `${i + 1}. ${p.hook}${p.idea ? `: ${p.idea}` : ""}\n`; });
      t += "\n";
    }
    if (plan?.days?.length) {
      t += "MY 7-DAY PLAN:\n";
      plan.days.forEach((d) => { t += `Day ${d.day}: ${d.title}. ${d.action}\n`; });
    }
    return t.trim();
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  async function sendEmail() {
    if (!email.trim()) return;
    setEmailSending(true); setEmailError(null);
    try {
      const r = await fetch("/api/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim(), summary: buildSummary() }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Couldn't send it. Try again, or use Copy.");
      }
      setEmailSent(true);
    } catch (e) {
      setEmailError(e.message || "Couldn't send it. Try again, or use Copy.");
    } finally { setEmailSending(false); }
  }
  const inputRef = useRef(null);
  const { listening, voiceSupported, toggleMic, resetBase, setBase, stopIfListening } = useVoiceInput(draft, setDraft);

  useEffect(() => {
    if (step >= 0 && step < QUESTIONS.length && inputRef.current) inputRef.current.focus();
  }, [step]);

  const q = step >= 0 && step < QUESTIONS.length ? QUESTIONS[step] : null;

  function next() {
    if (!q || !draft.trim()) return;
    stopIfListening();
    const updated = { ...answers, [q.id]: draft.trim() };
    setAnswers(updated);
    setDraft(""); resetBase();
    if (step + 1 >= QUESTIONS.length) generate(updated);
    else setStep(step + 1);
  }

  function back() {
    stopIfListening();
    if (step > 0) { const id = QUESTIONS[step - 1].id; setDraft(answers[id] || ""); setBase(answers[id] || ""); setStep(step - 1); }
    else if (step === 0) setStep(-1);
  }

  async function generate(finalAnswers) {
    setStep(QUESTIONS.length);
    setLoading(true); setError(null); setResult(null); setReveal(0);

    // ── CALL 1: The brand foundation. Director-level depth, said simply. ──
    const systemPrompt = `You are a seasoned brand director giving advice to a nervous person building a brand, a small business OR a personal brand (freelancer, creator, coach, someone building their name). Treat them like a friend, not a client. Notice which kind they are and speak to their real situation. Go DEEP like a real director, but say everything simply. They're intimidated by marketing.

LANGUAGE: For a product business, "selling" is fine. For a PERSONAL brand, don't say "selling," say what they "offer," want to be "known for," or the value people come to them for.

YOUR THINKING:
1. PAIN & ASPIRATION: the ache the person they want to reach hasn't named yet, and the dream pulling them. Understand it before they've felt it. Find the real human moment.
2. THE REFRAME: what they're REALLY about, not surface features. A jolt: "oh, THAT'S what I'm really offering." Specific and surprising. This is the centerpiece.
3. WHAT'S UN-COPYABLE + the one person most drawn to them: same insight, two sides. For a personal brand it's usually their story or lived experience.
4. BRAND PERSONALITY: if this brand were a person, how do they talk and carry themselves? Give 3 vivid traits.
5. WHAT THEY STAND AGAINST: the thing in their world they push back on. Brands get sharp by having an enemy (a bad norm, a tired way of doing things).

VOICE: Direct but warm. Truth, then belief they can do it. No jargon. Short sentences. Write plainly, the way a real person texts. Do not use em-dashes or en-dashes anywhere; use commas and periods instead.

NEVER assume the gender of the people they want to reach. You cannot know it. Write about that person as "they" or "them", or as "your person" or "this reader". Never use he, she, him, her, his, or hers.

Depth means insight, not length. Be specific to THIS brand and the exact answers they gave. If a sentence could be copy-pasted onto a totally different business, it is too generic, rewrite it until it could only be about them. No field longer than 2 sentences.

Return ONLY valid JSON, no markdown, no preamble:
{
  "pain": "the real ache + aspiration as a vivid human moment (max 2 sentences)",
  "reframe": "'you're not just doing X, you're really offering Y', surprising and specific (max 2 sentences)",
  "edge": "what's un-copyable AND the one person most drawn to them, as one linked insight (max 2 sentences)",
  "personality": "3 vivid personality traits of the brand + how it talks (max 2 sentences)",
  "against": "the norm or tired way of doing things this brand pushes against (max 2 sentences)"
}`;

    const userPrompt = `Here's what I'm building, from a few quick questions:
- What I'm building: ${finalAnswers.business}
- The person I want to reach: ${finalAnswers.customer}
- Why someone would choose me: ${finalAnswers.different}
- The one feeling I want them to have: ${finalAnswers.feeling}
- Where those people spend time: ${finalAnswers.where}
- My 3-month win: ${finalAnswers.goal}

Give me my brand foundation. Find the pain, the reframe, what's un-copyable, my brand's personality, and what I stand against.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass.");
      parsed.pain = parsed.pain || ""; parsed.reframe = parsed.reframe || ""; parsed.edge = parsed.edge || "";
      parsed.personality = parsed.personality || ""; parsed.against = parsed.against || "";
      // stash the answers so the 7-day plan call can use them
      parsed._answers = finalAnswers;
      setResult(parsed);
      track("completed_questions"); // anonymous count only, no answers sent
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  // ── CALL 2: the 7-day plan, fetched only when they're ready for it ──
  // ── Post ideas: 5 in their voice, on their POV, refillable ──
  async function generatePosts() {
    setPostsLoading(true); setPostsError(null);
    const a = result?._answers || answers;
    const seed = Math.random().toString(36).slice(2, 7); // nudges fresh ideas each refill

    const sys = `You are a brand strategist handing a nervous beginner 5 posts they could actually publish this week. These are not marketing theory. They are real, specific posts someone with ZERO marketing background can make without help.

RULES for every idea:
- Root it in the SPECIFICS of this brand and their point of view. If the idea could belong to any business, it is too generic, throw it out and write a sharper one.
- Give it a real angle or tension: a belief to argue, a myth to bust, a behind-the-scenes truth, a mistake they made, a hot take, a before-and-after. Never "share your journey", "introduce yourself", or "explain what you do" filler.
- Make it do-able. Say in plain words what to actually post so a non-marketer knows exactly what to make. Start the idea by naming the format in everyday language (a short story, an honest confession, a quick list, a hot take, a screenshot with a caption, a myth you bust, a question you answer), then say what goes in it.
- It must sound like THEM, in their voice.

NEVER assume the gender of the people they reach. You cannot know it. Use "they", "them", "your person", or "this reader". Never use he, she, him, her, his, or hers.

Short. No jargon. Write plainly, the way a real person texts. Do not use em-dashes or en-dashes anywhere; use commas and periods instead.

Their brand:
- Really about: ${result?.reframe || ""}
- Un-copyable edge: ${result?.edge || ""}
- Personality/voice: ${result?.personality || ""}
- Stands against: ${result?.against || ""}

Return ONLY valid JSON, no markdown:
{ "posts": [ { "hook": "the scroll-stopping first line, in their voice (max 15 words)", "idea": "the format in plain words, then exactly what to post and its angle, so a non-marketer could make it today (one or two sentences)" } ] }
Give exactly 5. Make each genuinely different from the others. (variety seed: ${seed})`;

    const usr = `Reaching: ${a.customer}. On: ${a.where}. Give me 5 post ideas I could publish this week.`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!r.ok) throw new Error(`Error (${r.status}). Try again.`);
      const data = await r.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed?.posts) throw new Error("Cut short. Tap to try again.");
      parsed.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
      setPosts(parsed);
      track("generated_posts"); // anonymous count only
    } catch (e) {
      setPostsError(e.message || "Something went wrong. Try again.");
    } finally {
      setPostsLoading(false);
    }
  }

  async function generatePlan() {
    setPhase("plan");
    setPlanLoading(true); setPlanError(null); setPlan(null); setDayReveal(0);
    const a = result?._answers || answers;

    const sys = `You are a brand director building a gentle 7-day starter plan for a nervous beginner. CORE RULE: each day is ONE focused action that takes under 30 minutes. Never overwhelm. The days build on each other, foundation first, then visibility, escalating gently. Day 1 is tiny and confidence-building. By day 7 they've made their first real public move. Speak warmly and simply, no jargon. Write plainly, the way a real person texts. Do not use em-dashes or en-dashes anywhere; use commas and periods instead. NEVER assume the gender of the people they reach: use "they", "them", or "your person", never he, she, him, her, his, or hers.

The brand foundation you already established:
- What they're really about: ${result?.reframe || ""}
- Their edge: ${result?.edge || ""}
- Their personality: ${result?.personality || ""}

Return ONLY valid JSON, no markdown, no preamble:
{
  "days": [
    { "day": 1, "title": "short title (max 5 words)", "action": "the ONE thing to do, under 30 min, specific and doable (max 2 sentences)", "why": "one short encouraging line on why it matters" }
  ]
}
Give exactly 7 days. Keep every field short so all 7 fit.`;

    const usr = `My brand: ${a.business}. Who I'm reaching: ${a.customer}. Where they spend time: ${a.where}. My 3-month win: ${a.goal}.
Build my gentle 7-day plan, one small action per day.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!response.ok) throw new Error(`The service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed) throw new Error("The plan got cut short. Tap to try again.");
      parsed.days = Array.isArray(parsed.days) ? parsed.days : [];
      setPlan(parsed);
    } catch (e) {
      setPlanError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setPlanLoading(false);
    }
  }

  function restart() {
    setStep(-1); setAnswers({}); setDraft(""); resetBase();
    setResult(null); setError(null); setReveal(0);
    setPlan(null); setPlanError(null); setDayReveal(0); setPhase("foundation");
  }

  // The foundation cards, revealed one at a time so it never overwhelms
  const cards = result ? [
    { label: "The real reason they'd choose you", body: result.pain },
    { label: "Here's what you're really about", body: result.reframe, hero: true },
    { label: "What makes you un-copyable", body: result.edge },
    { label: "Your brand's personality", body: result.personality },
    { label: "What you stand against", body: result.against },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      {/* ── FULL-BLEED HERO with ambient video (landing only) ── */}
      {step === -1 && (
        <>
          <section style={{ position: "relative", overflow: "hidden", background: INK_TEAL, backgroundImage: "url(/media/hero-poster.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}>
            <video autoPlay muted loop playsInline poster="/media/hero-poster.jpg" aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
              <source src="/media/hero.mp4" type="video/mp4" />
            </video>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, rgba(11,59,52,.72) 0%, rgba(11,59,52,.55) 45%, rgba(11,59,52,.85) 100%)" }} />
            <div className="mw-fade" style={{ position: "relative", maxWidth: 920, margin: "0 auto", padding: "56px 24px 96px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
                <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>
                  Branding Inward
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(42px, 7vw, 72px)", lineHeight: 1.04, margin: "0 0 24px", fontWeight: 350, color: CREAM, letterSpacing: "-0.01em" }}>
                Six little questions.<br />
                <span style={{ fontStyle: "italic", fontWeight: 400, color: BUTTER }}>Then I'll tell you</span><br />
                what you're{" "}
                <span style={{ display: "inline-block" }}>
                  really about.
                  <UnderlineStroke width={230} />
                </span>
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.65, color: "rgba(251,247,240,.88)", maxWidth: 540, margin: "0 0 38px" }}>
                Building a business or building your own name. Either way, no marketing words needed.
                Answer one question at a time, type or talk, and you'll walk away knowing the real reason
                people will choose you, and the one small thing to do today.
              </p>
              <button className="mw-btn" onClick={() => { track("started"); setStep(0); }} style={{ ...primaryBtn, fontSize: 18, padding: "18px 38px" }}>Start (takes 3 minutes)</button>
              <p style={{ fontSize: 14, color: "rgba(251,247,240,.6)", marginTop: 18, fontFamily: SANS }}>
                No account. One question at a time, I promise.
              </p>
            </div>
          </section>

          {/* ── EDITORIAL BAND: photos + the belief line ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "72px 24px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22, alignItems: "center" }}>
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "3/4", boxShadow: "0 16px 40px rgba(11,59,52,.14)" }}>
                <img src="/media/pottery-hands.jpg" alt="Hands shaping clay on a pottery wheel" className="mw-kenburns" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: "12px 6px" }}>
                <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 14px" }}>For the quiet ones</p>
                <p style={{ fontSize: "clamp(24px, 3.4vw, 32px)", lineHeight: 1.25, margin: 0, fontWeight: 350 }}>
                  Most marketing advice was written for extroverts.<br />
                  <span style={{ fontStyle: "italic", color: ACCENT }}>This place isn't.</span>
                </p>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5C534B", margin: "16px 0 0", fontFamily: SANS }}>
                  Free little tools for makers, musicians, freelancers, and small businesses who love
                  the work and hate the performing. Promotion without performing, depth over reach.
                </p>
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "3/4", boxShadow: "0 16px 40px rgba(11,59,52,.14)" }}>
                <img src="/media/quiet-desk.jpg" alt="A quiet chair in morning light with coffee and a notebook" className="mw-kenburns" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animationDelay: "-12s" }} />
              </div>
            </div>
          </section>

          {/* ── MORE WHISPERS ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 72px" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 18px" }}>More tools</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {MORE_WHISPERS.map((w) => (
                <a key={w.key} href={w.href} onClick={() => track(w.event)} className="mw-card-hover" style={{ ...bridgeBox, display: "block", textDecoration: "none", color: INK, padding: "26px 26px" }}>
                  <DoodleShield />
                  <p style={{ fontSize: 19, lineHeight: 1.45, fontStyle: "italic", margin: "14px 0 14px" }}>"{w.quote}"</p>
                  <span style={{ color: ACCENT, fontWeight: 600, fontFamily: SANS, fontSize: 16 }}>{w.cta}</span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: step === -1 ? "0 24px" : "48px 24px 80px" }}>
        {step !== -1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
              Branding Inward
            </span>
          </div>
        )}

        {/* QUESTIONS */}
        {q && (
          <div className="mw-fade" key={q.id}>
            <div style={{ display: "flex", gap: 8, marginBottom: 30 }}>
              {QUESTIONS.map((_, i) => (
                <span key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? ACCENT : "#E5DDD1", transition: "background .3s" }} />
              ))}
            </div>
            <div style={{ position: "relative", paddingTop: 34 }}>
              <GhostNumber n={step + 1} />
              <p style={{ fontFamily: SANS, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, margin: "0 0 14px", position: "relative" }}>
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <h2 style={{ fontSize: 33, lineHeight: 1.18, margin: "0 0 10px", fontWeight: 400, position: "relative" }}>{q.label}</h2>
            </div>
            <p style={{ fontSize: 16, color: "#857B70", margin: "0 0 22px", fontFamily: SANS }}>{q.help}</p>
            <textarea
              ref={inputRef} className="mw-area" value={draft}
              onChange={(e) => { setDraft(e.target.value); setBase(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(); } }}
              placeholder={q.placeholder} rows={3}
              style={{ width: "100%", fontSize: 19, fontFamily: SERIF, color: INK, padding: "18px 20px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "none", outline: "none", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={next} disabled={!draft.trim()} style={{ ...primaryBtn, opacity: draft.trim() ? 1 : 0.4, cursor: draft.trim() ? "pointer" : "not-allowed" }}>
                {step + 1 >= QUESTIONS.length ? "Show me what I'm really about" : "Next"}
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
                  <MicIcon color={listening ? "#FFF" : ACCENT} />
                  {listening ? "Listening…" : "Speak"}
                </button>
              )}
              <button className="mw-ghost" onClick={back} style={ghostBtn}>Back</button>
            </div>
            {!voiceSupported && (
              <p style={{ fontSize: 13, color: "#B9AFA2", marginTop: 14, fontFamily: SANS }}>
                The “Speak” button turns on once this is on a live website.
              </p>
            )}
          </div>
        )}

        {/* LOADING */}
        {step === QUESTIONS.length && loading && (
          <div className="mw-fade" style={{ textAlign: "center", paddingTop: 70 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />)}
            </div>
            <p style={{ fontSize: 22, color: "#5C534B" }}>Thinking about what you're really about…</p>
          </div>
        )}

        {/* ERROR */}
        {step === QUESTIONS.length && error && !loading && (
          <div className="mw-fade" style={{ paddingTop: 30 }}>
            <p style={{ fontSize: 21, color: ACCENT, lineHeight: 1.4 }}>{error}</p>
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              <button className="mw-btn" onClick={() => generate(answers)} style={primaryBtn}>Try again</button>
              <button className="mw-ghost" onClick={restart} style={ghostBtn}>Start over</button>
            </div>
          </div>
        )}

        {/* RESULT — Phase 1: foundation cards one at a time, then Phase 2: the 7-day plan */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">

            {/* ---------- PHASE 1: FOUNDATION ---------- */}
            {phase === "foundation" && (
              <>
                <p style={miniLabel}>First, let's understand your brand</p>
                <div style={{ marginTop: 8 }}>
                  {cards.slice(0, reveal + 1).map((c, i) => (
                    <div key={i} className="mw-deal" style={c.hero ? heroCard : plainCard}>
                      {c.hero && <DropQuote />}
                      <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>{c.label}</p>
                      <p style={{ fontSize: c.hero ? 24 : 19, lineHeight: 1.42, margin: 0, color: INK, position: "relative", fontWeight: c.hero ? 350 : 400 }}>{c.body}</p>
                    </div>
                  ))}
                </div>

                {reveal < cards.length - 1 ? (
                  <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 26 }}>
                    Show me the next bit
                  </button>
                ) : (
                  <div className="mw-fade" style={{ marginTop: 30 }}>
                    <div style={bridgeBox}>
                      <p style={{ fontSize: 19, lineHeight: 1.5, margin: 0, color: INK }}>
                        That's your foundation. Stuck on what to actually post? I'll give you 5 ideas
                        in <strong>your</strong> voice. Refill anytime.
                      </p>
                    </div>

                    {!posts && !postsLoading && !postsError && (
                      <button className="mw-btn" onClick={generatePosts} style={{ ...primaryBtn, marginTop: 22 }}>
                        What should I post? →
                      </button>
                    )}

                    {postsLoading && (
                      <div style={{ display: "flex", gap: 8, marginTop: 24, alignItems: "center" }}>
                        {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />)}
                        <span style={{ fontSize: 16, color: "#857B70", marginLeft: 6 }}>Finding your angles…</span>
                      </div>
                    )}

                    {postsError && !postsLoading && (
                      <button className="mw-btn" onClick={generatePosts} style={{ ...primaryBtn, marginTop: 22 }}>Try again</button>
                    )}

                    {posts && !postsLoading && (
                      <div style={{ marginTop: 20 }}>
                        {posts.posts.map((p, i) => (
                          <div key={i} style={dayCard}>
                            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.35 }}>{p.hook}</p>
                            {p.idea && <p style={{ fontSize: 15, lineHeight: 1.5, color: "#857B70", margin: 0, fontFamily: SANS }}>{p.idea}</p>}
                          </div>
                        ))}
                        <button className="mw-btn" onClick={generatePosts} style={{ ...primaryBtn, marginTop: 12 }}>
                          Give me 5 more ↻
                        </button>

                        {/* These are the visitor's, free. Nudge them to save via Copy below. */}
                        <div style={{ ...bridgeBox, marginTop: 26 }}>
                          <p style={{ fontSize: 18, lineHeight: 1.5, margin: 0, color: INK }}>
                            These are yours, free. Don't lose them. Copy everything below to keep it.
                          </p>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1" }}>
                      <p style={{ ...miniLabel, marginBottom: 12 }}>Save this</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                          {copied ? "Copied ✓" : "Copy everything"}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1" }}>
                      <button className="mw-btn" onClick={generatePlan} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}` }}>
                        Or get my 7-day plan →
                      </button>
                      <div><button className="mw-ghost" onClick={restart} style={{ ...ghostBtn, marginLeft: 0, marginTop: 16 }}>Start over</button></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------- PHASE 2: THE 7-DAY PLAN ---------- */}
            {phase === "plan" && (
              <>
                <p style={miniLabel}>Your 7-day plan, one small step a day</p>

                {planLoading && (
                  <div style={{ textAlign: "center", paddingTop: 40 }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                      {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />)}
                    </div>
                    <p style={{ fontSize: 20, color: "#5C534B" }}>Mapping out your week, gently…</p>
                  </div>
                )}

                {planError && !planLoading && (
                  <div style={{ paddingTop: 10 }}>
                    <p style={{ fontSize: 20, color: ACCENT, lineHeight: 1.4 }}>{planError}</p>
                    <button className="mw-btn" onClick={generatePlan} style={{ ...primaryBtn, marginTop: 18 }}>Try again</button>
                  </div>
                )}

                {plan && !planLoading && (
                  <>
                    <div style={{ marginTop: 8 }}>
                      {plan.days.slice(0, dayReveal + 1).map((d, i) => (
                        <div key={i} className="mw-fade" style={dayCard}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <span style={dayBadge}>Day {d.day || i + 1}</span>
                            <span style={{ fontSize: 18, fontWeight: 700 }}>{d.title}</span>
                          </div>
                          <p style={{ fontSize: 17, lineHeight: 1.6, color: INK, margin: "0 0 8px" }}>{d.action}</p>
                          {d.why && <p style={{ fontSize: 14, lineHeight: 1.5, color: "#857B70", margin: 0, fontStyle: "italic", fontFamily: SANS }}>{d.why}</p>}
                        </div>
                      ))}
                    </div>

                    {dayReveal < plan.days.length - 1 ? (
                      <button className="mw-btn" onClick={() => setDayReveal(dayReveal + 1)} style={{ ...primaryBtn, marginTop: 22 }}>
                        {dayReveal === 0 ? "Next day →" : `Day ${dayReveal + 2} →`}
                      </button>
                    ) : (
                      <div className="mw-fade" style={{ marginTop: 26 }}>
                        <div style={todayBox}>
                          <p style={{ fontSize: 20, lineHeight: 1.45, color: "#FFF", margin: 0 }}>
                            That's your week. Don't think about day 7 yet. Just do Day 1. You've got this.
                          </p>
                        </div>
                        <button className="mw-btn" onClick={restart} style={{ ...primaryBtn, marginTop: 24 }}>Start over with a new idea</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* FOOTER — full-bleed ink teal, the human behind the whisperer */}
      <footer style={{ background: INK_TEAL, marginTop: step === -1 ? 0 : 80 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>
              Branding Inward
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(251,247,240,.75)", margin: "0 0 16px", fontFamily: SANS, maxWidth: 620 }}>
            This tool exists purely to help you. No catch, no fine print. I'm a brand marketer
            teaching myself AI, and as I get better at it, I want to build more things like
            this for people who don't come from a marketing background.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(251,247,240,.75)", margin: "0 0 16px", fontFamily: SANS, maxWidth: 620 }}>
            Ready to go deeper? Email me for a brand audit and one-on-one advice at{" "}
            <a href="mailto:thecuriousafrin@gmail.com?subject=Branding%20Inward" onClick={() => track("clicked_email")} style={{ color: BUTTER, textDecoration: "none", fontWeight: 600 }}>
              thecuriousafrin@gmail.com
            </a>.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.5)", margin: "0 0 22px", fontFamily: SANS, maxWidth: 620 }}>
            Nothing you type here is saved, and I never see it. No cookies, no personal data, just anonymous counts of how many people use the tool.
            Photos and film from Pexels artists, with thanks.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            — <span style={{ color: BUTTER }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
