import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, ACCENT_RGB, INK_TEAL, CORAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  remember, recall, forgetAll, QUIET_MOVES,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, UnderlineStroke, DoodleBubble, DoodleShield, GhostNumber, DropQuote, PageQuote,
  TOOLS, FrameworkStrip, FRAMEWORK, ToolsMenu,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, todayBox, bridgeBox, dayCard, dayBadge,
} from "./lib/whisperKit.jsx";

// ── The six questions — engineered to extract psychological raw material
//    (stories, sensory detail, identity, refusals, repeatable signatures),
//    because that's what the science says brands are actually made of. ──
const QUESTIONS = [
  {
    id: "business",
    label: "What are you building, in one plain sentence?",
    help: "A business, a product, or just your own name. \"I'm a freelance designer\" works too.",
    placeholder: "I make soy candles, or I'm building my name as a career coach",
  },
  {
    id: "origin",
    label: "Tell me about the moment this started. Where were you, what happened?",
    help: "The real scene, not the polished version. Brains remember stories, not summaries.",
    placeholder: "My kitchen at 2am making a candle that didn't give me a headache. Or the meeting where I explained the numbers and the whole room changed its mind.",
  },
  {
    id: "switch",
    label: "Think about the last person who actually bought from you or hired you. What was going on in their life that day?",
    help: "Not who they are. What was happening. Nobody buys without a reason that day.",
    placeholder: "A friend was moving and wanted a gift that wasn't off a list. Or a founder needed their pitch to make sense before a meeting in two days.",
  },
  {
    id: "referral",
    label: "What do people already come to you for? The advice they ask, or what they say when they recommend you.",
    help: "In their words, not yours. This is your brand as it exists today, whether you chose it or not.",
    placeholder: "Everyone asks me how to word hard emails, or: talk to this shop, the mugs feel made for you",
  },
  {
    id: "tradeoff",
    label: "What do you do that a competitor would call a waste of time or money?",
    help: "The inefficient thing you insist on is usually the strategy. Things you refuse to do count too.",
    placeholder: "I hand write a note in every order. Or I spend a whole day learning a client's business before I touch it.",
  },
  {
    id: "own",
    label: "When your name comes up and you're not in the room, what's the ONE thing you want people to think? And what could you repeat forever to plant it?",
    help: "A word to own, and a signature to keep it alive. Memory loves repetition.",
    placeholder: "Calm, and every candle named after a time of day. Or clarity, and every report that ends in one plain sentence.",
  },
];

// ── Other whispers, linked from the home page. Each new whisper just adds one entry here. ──
const MORE_WHISPERS = [
  {
    key: "shield",
    quote: "Posting feels like exposing myself, not my work.",
    href: "#/shield",
    event: "opened_shield",
    cta: "Hear the voice you already have →",
  },
  {
    key: "roast",
    quote: "I wrote the post. Then I deleted it, it didn't sound like me.",
    href: "#/roast",
    event: "opened_roast",
    cta: "Get roasted, gently →",
  },
  {
    key: "plan",
    quote: "I can't post every day. Honestly, I don't want to.",
    href: "#/plan",
    event: "opened_plan",
    cta: "Find the plan you won't dread →",
  },
  {
    key: "scan",
    quote: "I don't even know where I'm stuck, let alone where to start.",
    href: "#/scan",
    event: "opened_scan",
    cta: "Find your inward pattern, 8 taps →",
  },
];

// The stuck-picker: name your blocker in one tap, get routed to the right tool
// with one first move. href null means "start the six questions right here."
const STUCK = [
  {
    key: "different",
    label: "I don't know what makes me different.",
    path: "Start with your foundation",
    href: null,
    why: "Six questions find the un-copyable thing hiding in your own story, not a claim you have to invent.",
    today: "Answer just one: where were you the moment this started?",
  },
  {
    key: "voice",
    label: "I sound unlike myself online.",
    path: "Hear your own voice",
    href: "#/shield",
    why: "Your voice already exists. The voice tool watches how you actually write, then hands it back, named.",
    today: "Paste three things you've written anywhere. Let it notice what you can't see.",
  },
  {
    key: "deleting",
    label: "I keep deleting everything.",
    path: "Rescue it, don't rewrite it",
    href: "#/roast",
    why: "You don't need a new draft. You need the one you deleted, edited toward you instead of away from you.",
    today: "Find the last thing you deleted. Paste it in before you reread it.",
  },
  {
    key: "exhausting",
    label: "Marketing is exhausting.",
    path: "Get a plan built under your energy",
    href: "#/plan",
    why: "You were handed an extrovert's plan. This one hides most of marketing and keeps only what fits your battery.",
    today: "Say how much time you can give without resenting it. The plan fits inside that.",
  },
  {
    key: "focus",
    label: "I don't know where to focus.",
    path: "Let one path get chosen for you",
    href: "#/plan",
    why: "Choosing is the exhausting part, so the plan picks one path, never a menu of twelve.",
    today: "Name what you make. One path comes back, with permission to ignore the rest.",
  },
  {
    key: "ideas",
    label: "I have too many ideas.",
    path: "Find the one word they all circle",
    href: null,
    why: "Too many ideas is a focus problem in disguise. Your foundation names the word to own, and the rest gets quieter.",
    today: "Answer just one: what do you want people to think when your name comes up?",
  },
];

// Pattern facts shared with the scan page: display name + where their path starts.
const PATTERN_HOME = {
  hider: { name: "The Hider", start: "#/shield", startName: "the voice tool" },
  pusher: { name: "The Pusher", start: "#/plan", startName: "the quieter plan" },
  deleter: { name: "The Deleter", start: "#/roast", startName: "the gentle roast" },
  perfectionist: { name: "The Perfectionist", start: "#/roast", startName: "the gentle roast" },
  scatterer: { name: "The Scatterer", start: "#/plan", startName: "the quieter plan" },
};

export default function BrandingWhisperer() {
  const [step, setStep] = useState(-1);
  const [storedPattern, setStoredPattern] = useState(() => recall("pattern"));
  const [energy, setEnergy] = useState(null);
  const [stuck, setStuck] = useState(null);
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
    if (result.reframe) t += `What I'm really about:\n${result.reframe}\n\n`;
    if (result.moment) t += `The moment I'm for:\n${result.moment}\n\n`;
    if (result.mirror) t += `Who my customer gets to be:\n${result.mirror}\n\n`;
    if (result.edge) t += `What makes me un-copyable:\n${result.edge}\n\n`;
    if (result.against) t += `What I stand against:\n${result.against}\n\n`;
    if (result.gap) t += `The gap to close:\n${result.gap}\n\n`;
    if (result.personality) t += `My brand's personality:\n${result.personality}\n\n`;
    if (result.assets?.length) t += `My signature moves (repeat forever):\n${result.assets.join(", ")}\n\n`;
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

  // Auto-save the foundation result to THIS device (never sent) for the Inward Brief.
  useEffect(() => {
    if (!result) return;
    if (result.reframe) remember("reallyabout", result.reframe);
    if (result.edge) remember("edge", result.edge);
  }, [result]);

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

    // ── CALL 1: The brand foundation, grounded in the psychology library. ──
    const systemPrompt = `You are a warm, perceptive guide, half brand strategist, half therapist, helping a nervous person see the brand that already exists in their own answers. Treat them like a friend, not a client. They're intimidated by marketing, and most marketing advice was written for extroverts. Your craft: everything you say is quietly grounded in real psychology, but it reads like a gentle observation about them, never a lesson.

${PSYCH_LIBRARY}

LANGUAGE: For a product business, "selling" is fine. For a PERSONAL brand, don't say "selling," say what they "offer" or want to be "known for."

YOUR THINKING (each step is a real strategist's instrument, worn lightly):
1. THE REFRAME: from their origin story and their customer's switch moment, name the job people actually hire them for. Not the product, the change it makes in someone's day. A jolt: "oh, THAT'S what I'm really offering." This is the centerpiece.
2. THE MOMENT: from the switch-moment answer, name the exact life situation where their person suddenly needs them, so they know which moment their brand should live next to in people's memory. Brands are recalled by situations, not by ads.
3. THE MIRROR: from the referral sentence and the switch moment, name who their person GETS TO BE by choosing them. The referral words are the customer describing their own taste.
4. THE EDGE: what's un-copyable, hiding in the origin story's specifics plus the thing competitors would call wasteful. A chosen inefficiency is a moat, not a flaw.
5. WHAT THEY STAND AGAINST: sharpen their profitable waste into a stance against the industry norm it defies.
6. THE GAP: compare what people ALREADY come to them for with the one thing they WANT people to think. If they match, say so, that's rare and worth celebrating. If they differ, name the distance honestly and give ONE bridge move: how to use what they're already known for as the doorway to what they want to own. Never shame the gap, it's just the work, now visible.
7. BRAND PERSONALITY: 3 vivid traits + how it talks, drawn from how THEY wrote their answers.
8. SIGNATURE MOVES: frame these as the EVIDENCE they hand people on repeat. Claims are forgotten, evidence is remembered. From their one word and their repeatable thing, name the word they should own, plus 2 or 3 repeatable signatures that quietly prove it every time. Small brands win by unique-and-repeated, not famous.

EVERY field gets a matching "_why" line: ONE short sentence explaining why this works, drawn from the library but with the name left out (e.g. "Things made by one person's hands feel made with love, and people quietly pay more for that."). No terms, no researcher or institution names, never academic, never invented.

VOICE: Direct but warm. No jargon. Short sentences, the way a real person texts. Do not use em-dashes or en-dashes anywhere; use commas and periods instead.

NEVER assume anyone's gender, including people they name. Use "they" and "them" always, no matter how a name sounds.

Be specific to THIS brand. If a sentence could be copy-pasted onto a different business, rewrite it until it could only be about them. No field longer than 2 sentences.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly with no blank lines between fields, make sure every key is exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead:
{
  "reframe": "'you're not just doing X, you're really offering Y', the job people hire them for, surprising and specific (max 2 sentences)",
  "reframe_why": "one plain sentence on why this works, no terms or names",
  "moment": "the exact life situation where their person suddenly needs them, written as a scene ('it's the night before...'), so they know which moment to attach their brand to (max 2 sentences)",
  "moment_why": "one plain sentence on why owning a moment beats chasing attention, no terms or names",
  "mirror": "who their customer gets to be by choosing them, built from the referral sentence and switch moment (max 2 sentences)",
  "mirror_why": "one plain sentence on why this works, no terms or names",
  "edge": "the un-copyable thing, found in their origin story's specifics (max 2 sentences)",
  "edge_why": "one plain sentence on why this works, no terms or names",
  "against": "the norm or tired way of doing things this brand pushes against, built from their refusals (max 2 sentences)",
  "against_why": "one plain sentence on why this works, no terms or names",
  "gap": "the honest distance between what people already come to them for and the one thing they want owned, plus ONE bridge move. If they already match, say so plainly. (max 2 sentences)",
  "gap_why": "one plain sentence on why building from what you're already known for beats starting over, no terms or names",
  "personality": "3 vivid personality traits of the brand + how it talks (max 2 sentences)",
  "assets": ["first entry: 'The word to own: X' using their chosen word, then 1 or 2 signature moves to repeat forever, each a short concrete phrase drawn from their answers"],
  "assets_why": "one plain sentence on why repeating a few signatures works, no terms or names"
}`;

    const userPrompt = `Here's what I'm building, from a few quick questions:
- What I'm building: ${finalAnswers.business}
- The moment it started: ${finalAnswers.origin}
- What was happening in my last customer's life the day they bought: ${finalAnswers.switch}
- What people already come to me for (their words): ${finalAnswers.referral}
- What a competitor would call my waste of time or money: ${finalAnswers.tradeoff}
- What I want people to think when my name comes up, and the thing I'd repeat forever: ${finalAnswers.own}

Give me my brand foundation, grounded in the psychology.`;

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
      parsed.reframe = parsed.reframe || ""; parsed.moment = parsed.moment || ""; parsed.mirror = parsed.mirror || "";
      parsed.edge = parsed.edge || ""; parsed.personality = parsed.personality || ""; parsed.against = parsed.against || "";
      parsed.gap = parsed.gap || "";
      parsed.assets = Array.isArray(parsed.assets) ? parsed.assets : [];
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

    const usr = `The moment people need me: ${a.switch}. What people say when they recommend me: ${a.referral}. What a competitor would call my waste of time: ${a.tradeoff}. Give me 5 post ideas I could publish this week.`;

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

    const usr = `My brand: ${a.business}. The moment people need me: ${a.switch}. What people say when they recommend me: ${a.referral}. My signature moves to repeat: ${(result?.assets || []).join(", ")}.
Build my gentle 7-day plan, one small action per day. Weave my signature moves into the days so repetition starts now.`;

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
    { label: "Here's what you're really about", body: result.reframe, why: result.reframe_why, hero: true },
    { label: "The moment you're for", body: result.moment, why: result.moment_why },
    { label: "Who your customer gets to be", body: result.mirror, why: result.mirror_why },
    { label: "What makes you un-copyable", body: result.edge, why: result.edge_why },
    { label: "What you stand against", body: result.against, why: result.against_why },
    { label: "The gap to close", body: result.gap, why: result.gap_why },
    { label: "Your brand's personality", body: result.personality },
    { label: "Your signature moves, repeat these forever", body: result.assets?.length ? result.assets.join("  ·  ") : "", why: result.assets_why },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

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
                Get known.<br />
                <span style={{ display: "inline-block" }}>
                  <span style={{ fontStyle: "italic", fontWeight: 400, color: BUTTER }}>Without performing.</span>
                  <UnderlineStroke width={300} />
                </span>
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.65, color: "rgba(251,247,240,.88)", maxWidth: 540, margin: "0 0 38px" }}>
                For people who'd rather let the work talk. The way in is six small questions, no marketing
                words needed, and you'll walk away knowing the real reason people choose you.
              </p>
              <button className="mw-btn" onClick={() => { track("started"); setStep(0); }} style={{ ...primaryBtn, fontSize: 18, padding: "18px 38px" }}>Start (takes 3 minutes)</button>
              <p style={{ fontSize: 14, color: "rgba(251,247,240,.6)", marginTop: 18, fontFamily: SANS }}>
                No account. One question at a time, I promise.
              </p>
              <p style={{ fontSize: 15, marginTop: 10, fontFamily: SANS }}>
                <a href="#/scan" onClick={() => track("opened_scan")} style={{ color: "#F7D06B", textDecoration: "none", fontWeight: 600 }}>
                  Not sure where to start? Find your inward pattern, 8 taps →
                </a>
              </p>
            </div>
          </section>

          {/* ── WHO IT'S FOR: inclusive, by the feeling, never by a label. Lands the distinction fast. ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px 8px" }}>
            <div style={{ background: ACCENT_TINT, border: "1px solid #DCEFEA", borderRadius: 20, padding: "34px 34px 30px" }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 10px" }}>Who it's for</p>
              <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", lineHeight: 1.25, margin: "0 0 22px", fontWeight: 350 }}>
                This is for you if putting yourself out there <span style={{ fontStyle: "italic", color: ACCENT }}>feels like a cost.</span>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px 28px", marginBottom: 22 }}>
                {[
                  "Self-promotion makes you feel a little gross.",
                  "You'd rather be found than be seen.",
                  "You freeze when it's time to post.",
                  "You want to sound like yourself, not like everyone else.",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, color: ACCENT, fontWeight: 700, fontSize: 18, lineHeight: 1.4 }}>&#10003;</span>
                    <span style={{ fontSize: 17, lineHeight: 1.45, color: INK }}>{t}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#5C534B", margin: 0, fontFamily: SANS }}>
                You don't have to call yourself an introvert, or anything at all. Makers, coaches, writers, musicians, quiet experts, first-timers, seasoned pros. If being visible feels like a cost, you're in the right place.
              </p>
            </div>
          </section>

          {/* ── WELCOME BACK: only for visitors who chose to keep their pattern on this device ── */}
          {storedPattern && PATTERN_HOME[storedPattern] && (
            <section style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px 0" }}>
              <div style={{ background: ACCENT_TINT, border: "1px solid #DCEFEA", borderLeft: `5px solid ${ACCENT}`, borderRadius: "0 16px 16px 0", padding: "24px 26px" }}>
                <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 6px" }}>Welcome back</p>
                <p style={{ fontSize: 22, fontWeight: 350, margin: "0 0 14px" }}>
                  You're {PATTERN_HOME[storedPattern].name.replace("The", "a")}. How's the battery today?
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: energy ? 16 : 0 }}>
                  {[["low", "Running low"], ["okay", "Okay"], ["good", "Actually good"]].map(([k, label]) => (
                    <button key={k} className="mw-btn" onClick={() => setEnergy(k)}
                      style={{ background: energy === k ? ACCENT : "#FFF", color: energy === k ? "#FFF" : INK, border: `2px solid ${energy === k ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "9px 18px", fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .18s" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ margin: energy ? "16px 0 0" : "16px 0 0" }}>
                  <a href="#/brief" onClick={() => track("welcomeback_brief")} style={{ fontFamily: SANS, fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>See your Inward Brief so far &rarr;</a>
                </p>
                {energy && (
                  <div className="mw-fade">
                    <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 6px" }}>This week's one move</p>
                    <p style={{ fontSize: 18, lineHeight: 1.55, margin: "0 0 12px" }}>
                      {QUIET_MOVES[energy][(Math.floor(Date.now() / 604800000) + Object.keys(PATTERN_HOME).indexOf(storedPattern)) % QUIET_MOVES[energy].length]}
                    </p>
                    <p style={{ fontSize: 14, fontFamily: SANS, margin: 0 }}>
                      That's enough for this week. Want more anyway?{" "}
                      <a href={PATTERN_HOME[storedPattern].start} style={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}>
                        Continue with {PATTERN_HOME[storedPattern].startName} →
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

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
                  Free little tools for makers, musicians, coaches, consultants, writers, professors,
                  and quiet experts of every kind, anyone who loves the work and hates the performing.
                  Promotion without performing, depth over reach.
                </p>
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "3/4", boxShadow: "0 16px 40px rgba(11,59,52,.14)" }}>
                <img src="/media/quiet-desk.jpg" alt="A quiet chair in morning light with coffee and a notebook" className="mw-kenburns" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animationDelay: "-12s" }} />
              </div>
            </div>
          </section>

          {/* ── STUCK PICKER: name your blocker in one tap, get routed instantly ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "64px 24px 8px" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>The fast lane</p>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 34px)", lineHeight: 1.2, margin: "0 0 22px", fontWeight: 350 }}>
              Where do you <span style={{ fontStyle: "italic", color: ACCENT }}>get stuck?</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {STUCK.map((s) => (
                <button
                  key={s.key}
                  className="mw-btn"
                  onClick={() => { setStuck(s.key); track("stuck_" + s.key); }}
                  style={{ textAlign: "left", background: stuck === s.key ? ACCENT_TINT : "#FFF", color: INK, border: `2px solid ${stuck === s.key ? ACCENT : "#EFE7DA"}`, borderRadius: 14, padding: "16px 18px", fontSize: 18, fontFamily: SERIF, cursor: "pointer", lineHeight: 1.4, transition: "all .18s", display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${stuck === s.key ? ACCENT : "#CFC6B8"}`, background: stuck === s.key ? ACCENT : "transparent", transition: "all .18s" }} />
                  {s.label}
                </button>
              ))}
            </div>

            {stuck && (() => {
              const s = STUCK.find((x) => x.key === stuck);
              return (
                <div className="mw-fade" style={{ marginTop: 18, background: ACCENT_TINT, border: "1px solid #DCEFEA", borderLeft: `5px solid ${ACCENT}`, borderRadius: "0 16px 16px 0", padding: "24px 26px" }}>
                  <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>Here's your path</p>
                  <p style={{ fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>{s.path}</p>
                  <p style={{ fontSize: 16, lineHeight: 1.6, color: "#3D3630", margin: "0 0 18px", fontFamily: SANS }}>{s.why}</p>
                  <div style={{ background: INK_TEAL, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
                    <p style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#F7D06B", fontWeight: 600, margin: "0 0 5px" }}>Today</p>
                    <p style={{ fontSize: 16, lineHeight: 1.5, color: CREAM, margin: 0 }}>{s.today}</p>
                  </div>
                  {s.href ? (
                    <a href={s.href} className="mw-btn" style={{ ...primaryBtn, display: "inline-block", textDecoration: "none" }}>{s.path} →</a>
                  ) : (
                    <button className="mw-btn" onClick={() => { track("started"); setStep(0); window.scrollTo({ top: 0 }); }} style={primaryBtn}>{s.path} →</button>
                  )}
                </div>
              );
            })()}
          </section>

          {/* ── THE SCIENCE BAND: the research that vindicates quiet people. Static, cited, no AI. ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "64px 24px 8px" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>The science of quiet branding</p>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 34px)", lineHeight: 1.2, margin: "0 0 22px", fontWeight: 350 }}>
              Everything here is built on research, <span style={{ fontStyle: "italic", color: ACCENT }}>not vibes.</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {[
                {
                  myth: "“I should promote myself more.”",
                  fact: "In a 2015 Carnegie Mellon study, self-promoters were liked less and judged no more competent. Your instinct to not brag isn't a weakness. It's correct.",
                  source: "A Carnegie Mellon study, 2015",
                },
                {
                  myth: "“I need to be everywhere, loudly.”",
                  fact: "About 95% of your future buyers aren't ready to buy today. A brand's real job is being quietly remembered later, and simply showing up regularly builds trust on its own.",
                  source: "Decades of buyer-behavior research",
                },
                {
                  myth: "“Small and handmade looks amateur.”",
                  fact: "Buyers pay more for handmade because it feels made with love, especially as gifts. One person at a kitchen table is the premium, not the problem.",
                  source: "Consumer research on handmade goods",
                },
              ].map((c, i) => (
                <div key={i} style={{ ...plainCard, marginBottom: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: CORAL, fontWeight: 700, margin: 0 }}>The myth</p>
                  <p style={{ fontSize: 20, fontStyle: "italic", lineHeight: 1.35, margin: 0 }}>{c.myth}</p>
                  <p style={{ fontFamily: SANS, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, margin: "6px 0 0" }}>The research</p>
                  <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: "#3D3630" }}>{c.fact}</p>
                  <p style={{ fontFamily: SANS, fontSize: 12, color: "#9A8F82", margin: "auto 0 0", paddingTop: 6 }}>{c.source}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── THE INWARD FRAMEWORK: the ordered spine, so nothing reads as scattered ── */}
          <section style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 72px" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>The Inward Framework</p>
            <h2 style={{ fontSize: "clamp(26px, 3.6vw, 34px)", lineHeight: 1.2, margin: "0 0 10px", fontWeight: 350 }}>
              Five steps. <span style={{ fontStyle: "italic", color: ACCENT }}>One clear you at the end.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#857B70", margin: "0 0 28px", fontFamily: SANS, maxWidth: 600 }}>
              Not sure where you're stuck? Start with the Scan. Otherwise jump to any step. They build on each other, and everything you find collects into your Inward Brief.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FRAMEWORK.map((s) => {
                const isFoundation = s.key === "foundation";
                const inner = (
                  <>
                    <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: "50%", background: INK_TEAL, color: BUTTER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 20, fontWeight: 500 }}>{s.n}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 20, fontWeight: 400, color: INK, marginBottom: 2 }}>{s.name}</span>
                      <span style={{ display: "block", fontSize: 15, color: "#857B70", fontFamily: SANS }}>{s.blurb}</span>
                    </span>
                    <span style={{ color: ACCENT, fontWeight: 700, fontFamily: SANS, fontSize: 20, flexShrink: 0 }}>&rarr;</span>
                  </>
                );
                const cardStyle = { display: "flex", alignItems: "center", gap: 18, textAlign: "left", width: "100%", textDecoration: "none", color: INK, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "18px 22px", boxShadow: "0 8px 24px rgba(11,59,52,.05)", cursor: "pointer", fontFamily: SERIF };
                return isFoundation ? (
                  <button key={s.key} className="mw-card-hover" onClick={() => { track("started"); setStep(0); window.scrollTo({ top: 0 }); }} style={cardStyle}>{inner}</button>
                ) : (
                  <a key={s.key} href={s.href} onClick={() => track("opened_" + s.key)} className="mw-card-hover" style={cardStyle}>{inner}</a>
                );
              })}
            </div>
          </section>

          {/* ── WHY THIS EXISTS: short teaser, full story lives on #/about ── */}
          <section id="why" style={{ background: INK_TEAL }}>
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px" }}>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#F7D06B", fontWeight: 600, margin: "0 0 14px" }}>Why this exists</p>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", lineHeight: 1.15, margin: "0 0 18px", fontWeight: 350, color: CREAM }}>
                Digital media is a channel.<br /><span style={{ fontStyle: "italic", color: "#F7D06B" }}>Not a destination.</span>
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(251,247,240,.86)", margin: "0 0 22px", maxWidth: 560 }}>
                Built by a brand strategist, not a tech company. A decade of agency work, from before
                AI or social media existed, made free so it works for people who never came from marketing.
              </p>
              <a href="#/about" onClick={() => track("opened_about")} style={{ fontFamily: SANS, fontSize: 16, color: "#F7D06B", textDecoration: "none", fontWeight: 600 }}>
                Read my story &rarr;
              </a>
            </div>
          </section>

          {/* Success stories now live only on the Inward Scan, not on every page. */}
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
                      {c.why && (
                        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "12px 0 0", color: "#857B70", fontStyle: "italic", position: "relative", borderTop: "1px solid rgba(11,59,52,.08)", paddingTop: 10 }}>
                          <span style={{ fontFamily: SANS, fontStyle: "normal", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginRight: 8 }}>Why this works</span>
                          {c.why}
                        </p>
                      )}
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

        <PageQuote id="home" />
      </div>

      {/* Once the six questions are done, show where they are in the framework. */}
      {step === QUESTIONS.length && result && <FrameworkStrip current="foundation" />}

      {/* FOOTER — full-bleed ink teal, the human behind the whisperer */}
      <footer style={{ background: INK_TEAL, marginTop: step === -1 ? 40 : 80 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>
              Branding Inward
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(251,247,240,.75)", margin: "0 0 16px", fontFamily: SANS, maxWidth: 620 }}>
            Free tools, no catch. <a href="#/about" onClick={() => track("footer_about")} style={{ color: BUTTER, textDecoration: "none", fontWeight: 600 }}>Read my story</a>, say hi at{" "}
            <a href="mailto:thecuriousafrin@gmail.com?subject=Branding%20Inward" onClick={() => track("clicked_email")} style={{ color: BUTTER, textDecoration: "none", fontWeight: 600 }}>
              thecuriousafrin@gmail.com
            </a>, or find me on{" "}
            <a href="https://www.linkedin.com/in/sabihaafrin" target="_blank" rel="noopener noreferrer" onClick={() => track("footer_linkedin")} style={{ color: BUTTER, textDecoration: "none", fontWeight: 600 }}>
              LinkedIn
            </a>.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.5)", margin: "0 0 22px", fontFamily: SANS, maxWidth: 620 }}>
            What you build here is saved only on your device, in this browser, so your Inward Brief remembers you. I never see it. No cookies, no personal data, just anonymous counts of how many people use the tool.
            Photos and film from Pexels artists, with thanks.
            {" "}
            <button onClick={() => { forgetAll(); setStoredPattern(null); setEnergy(null); }} style={{ background: "none", border: "none", padding: 0, color: "rgba(251,247,240,.7)", textDecoration: "underline", cursor: "pointer", fontFamily: SANS, fontSize: 13 }}>
              Forget everything on this device
            </button>.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            — <span style={{ color: BUTTER }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
