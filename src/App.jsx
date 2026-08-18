import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import { ph, phSetAudience } from "./lib/metrics.js";
import {
  ACCENT, INK, CREAM, ACCENT_RGB, INK_TEAL, BUTTER, ACCENT_TINT,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  remember, recall, forgetAll, QUIET_MOVES,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, UnderlineStroke, DoodleBubble, DoodleShield, GhostNumber, DropQuote, PageQuote,
  TOOLS, FrameworkStrip, FRAMEWORK, stepsDone, ToolsMenu, SiteFooter, ForgetButton, KeptNote, ToolHero, ToolIntro, StepLoader, PROMPT_QUALITY, tightenResult, SiteNav, primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, todayBox, bridgeBox, dayCard, dayBadge,
} from "./lib/whisperKit.jsx";

// ── The six questions — engineered to extract psychological raw material
//    (stories, sensory detail, identity, refusals, repeatable signatures),
//    because that's what the science says brands are actually made of. ──
const QUESTIONS = [
  {
    id: "business",
    label: "What are you building, in one plain sentence?",
    makerLabel: "What do you make, in one plain sentence?",
    help: "A business, a product, or just your own name. \"I'm a freelance designer\" works too.",
    placeholder: "I make soy candles, or I'm building my name as a career coach",
  },
  {
    id: "origin",
    label: "Tell me about the moment this started. Where were you, what happened?",
    makerLabel: "Tell me about the moment you started making this. Where were you, what happened?",
    help: "The real scene, not the polished version. Brains remember stories, not summaries.",
    placeholder: "My kitchen at 2am making a candle that didn't give me a headache. Or the meeting where I explained the numbers and the whole room changed its mind.",
  },
  {
    id: "switch",
    label: "Think about the last person who actually bought from you or hired you. What was going on in their life that day?",
    makerLabel: "Think about the last person who bought what you make. What was going on in their life that day?",
    help: "Not who they are. What was happening. Nobody buys without a reason that day.",
    placeholder: "A friend was moving and wanted a gift that wasn't off a list. Or a founder needed their pitch to make sense before a meeting in two days.",
  },
  {
    id: "referral",
    label: "What do people already come to you for? The advice they ask, or what they say when they recommend you.",
    makerLabel: "What do people already say about what you make? The compliments they repeat, or how they describe it to friends.",
    help: "In their words, not yours. This is your brand as it exists today, whether you chose it or not.",
    placeholder: "Everyone asks me how to word hard emails, or: talk to this shop, the mugs feel made for you",
  },
  {
    id: "tradeoff",
    label: "What do you do that a competitor would call a waste of time or money?",
    makerLabel: "What goes into making it that a competitor would call a waste of time or money?",
    help: "The inefficient thing you insist on is usually the strategy. Things you refuse to do count too.",
    placeholder: "I hand write a note in every order. Or I spend a whole day learning a client's business before I touch it.",
  },
  {
    id: "own",
    label: "When your name comes up and you're not in the room, what's the ONE thing you want people to think? And what could you repeat forever to plant it?",
    makerLabel: "When what you make comes up and you're not in the room, what's the ONE thing you want people to think? And what could you repeat forever to plant it?",
    help: "A word to own, and a signature to keep it alive. Memory loves repetition.",
    placeholder: "Calm, and every candle named after a time of day. Or clarity, and every report that ends in one plain sentence.",
  },
];

// The stuck-picker: name your blocker in one tap, get routed to the right tool
// with one first move. href null means "start the six questions right here."
const STUCK = [
  {
    key: "different",
    label: "I don't know what makes me different.",
    path: "Start with your foundation",
    href: "/foundation",
    why: "Six questions find the un-copyable thing hiding in your own story, not a claim you have to invent.",
    today: "Answer just one: where were you the moment this started?",
  },
  {
    key: "voice",
    label: "I sound unlike myself online.",
    path: "Hear your own voice",
    href: "/brand-voice",
    why: "Your voice already exists. The voice tool watches how you actually write, then hands it back, named.",
    today: "Paste three things you've written anywhere. Let it notice what you can't see.",
  },
  {
    key: "deleting",
    label: "I keep deleting everything.",
    path: "Rescue it, don't rewrite it",
    href: "/roast",
    why: "You don't need a new draft. You need the one you deleted, edited toward you instead of away from you.",
    today: "Find the last thing you deleted. Paste it in before you reread it.",
  },
  {
    key: "exhausting",
    label: "Marketing is exhausting.",
    path: "Get a plan built under your energy",
    href: "/plan",
    why: "You were handed a plan built for people who love promotion. This one hides most of marketing and keeps only what fits your battery.",
    today: "Say how much time you can give without resenting it. The plan fits inside that.",
  },
  {
    key: "focus",
    label: "I don't know where to focus.",
    path: "Let one path get chosen for you",
    href: "/plan",
    why: "Choosing is the exhausting part, so the plan picks one path, never a menu of twelve.",
    today: "Name what you make. One path comes back, with permission to ignore the rest.",
  },
  {
    key: "ideas",
    label: "I have too many ideas.",
    path: "Find the one word they all circle",
    href: "/foundation",
    why: "Too many ideas is a focus problem in disguise. Your foundation names the word to own, and the rest gets quieter.",
    today: "Answer just one: what do you want people to think when your name comes up?",
  },
];

// Pattern facts shared with the scan page: display name + where their path starts.
const PATTERN_HOME = {
  hider: { name: "The Hider", start: "/brand-voice", startName: "the voice tool" },
  pusher: { name: "The Pusher", start: "/plan", startName: "the quieter plan" },
  deleter: { name: "The Deleter", start: "/roast", startName: "the gentle roast" },
  perfectionist: { name: "The Perfectionist", start: "/roast", startName: "the gentle roast" },
  scatterer: { name: "The Scatterer", start: "/plan", startName: "the quieter plan" },
};

// Hidden while she can't promote a business at work; flip to bring it back.
const SHOW_TEAMS = false;

export default function BrandingWhisperer({ view = "home" }) {
  // The home (/) is the landing (step -1) with the Scan embedded; the six
  // questions live at /foundation (step 0+). Same engine, told apart by the
  // router's view prop.
  const [step, setStep] = useState(() => (view === "foundation" ? -2 : -1));
  const [storedPattern, setStoredPattern] = useState(() => recall("pattern"));
  const [doneSteps] = useState(stepsDone);


  // Teams waitlist band. Rides the same Apps Script as the brief email;
  // "TEAMS WAITLIST" as the summary is how it sorts in her sheet.
  const [teamEmail, setTeamEmail] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamSent, setTeamSent] = useState(false);
  const [teamErr, setTeamErr] = useState(null);
  async function joinWaitlist() {
    if (!teamEmail.trim()) return;
    setTeamBusy(true); setTeamErr(null);
    try {
      const r = await fetch("/api/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: teamEmail.trim(), summary: "TEAMS WAITLIST — " + teamEmail.trim() }),
      });
      if (!r.ok) throw new Error();
      setTeamSent(true); track("teams_waitlist");
    } catch (_) {
      setTeamErr("That didn't go through. Try once more, or write to safrin@brandinginward.com.");
    } finally { setTeamBusy(false); }
  }

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
  const [audience, setAudience] = useState(() => recall("audience") || null); // "self" | "maker"
  const [emerging, setEmerging] = useState(null);        // the partial insight after Q3
  const [emergingOpen, setEmergingOpen] = useState(false); // interstitial visible
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

  // Keep the view in sync with the route: /foundation shows the six questions,
  // the home shows the landing with the Scan embedded. The router remounts on
  // popstate too, but a view change without a remount still lands here.
  useEffect(() => {
    if (view === "foundation") setStep((s) => (s === -1 ? -2 : s));
    else setStep(-1);
  }, [view]);

  // Auto-save the foundation result to THIS device (never sent) for the Inward Brief.
  useEffect(() => {
    if (!result) return;
    if (result.reframe) remember("reallyabout", result.reframe);
    if (result.edge) remember("edge", result.edge);
  }, [result]);

  const q0 = step >= 0 && step < QUESTIONS.length ? QUESTIONS[step] : null;
  const q = q0 && audience === "maker" && q0.makerLabel ? { ...q0, label: q0.makerLabel } : q0;

  function next() {
    if (!q || !draft.trim()) return;
    stopIfListening();
    const updated = { ...answers, [q.id]: draft.trim() };
    setAnswers(updated);
    setDraft(""); resetBase();
    if (step + 1 >= QUESTIONS.length) generate(updated);
    else if (step === 2) { setEmergingOpen(true); fetchEmerging(); setStep(3); }
    else setStep(step + 1);
  }

  // ── Fix 3: value before the rest of the commitment. A tiny, cheap call that
  //    reflects what the first three answers already show. Fails silently:
  //    if it errors, the interstitial just doesn't render and Q4 shows. ──
  async function fetchEmerging() {
    if (emerging) return;
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are a warm brand strategist. Someone is three answers into six questions about their brand. In 2 or 3 short sentences, reflect what is ALREADY emerging from their answers: one concrete, specific observation that makes them feel seen, not advice, not a summary. Address them as "you". Plain warm words, no em-dashes or en-dashes, no marketing terms. Return ONLY the sentences, no JSON, no preamble.`,
          user: `They are branding ${audience === "maker" ? "something they make" : "themselves"}.
What they're building: "${answers.business || ""}"
The moment it started: "${answers.origin || ""}"
The last buyer's day: "${answers.switch || ""}"`,
        }),
      });
      const d = await r.json();
      const text = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      if (r.ok && text) setEmerging(text.slice(0, 600));
    } catch (_) {}
  }

  function back() {
    stopIfListening();
    if (step > 0) { const id = QUESTIONS[step - 1].id; setDraft(answers[id] || ""); setBase(answers[id] || ""); setStep(step - 1); }
    else if (step === 0) setStep(-1);
  }

  async function generate(finalAnswers) {
    setStep(QUESTIONS.length);
    // eslint-disable-next-line no-unused-expressions
    audience;
    setLoading(true); setError(null); setResult(null); setReveal(0);

    // ── CALL 1: The brand foundation, grounded in the psychology library. ──
    const systemPrompt = `You are a warm, perceptive guide, half brand strategist, half therapist, helping a nervous person see the brand that already exists in their own answers. Treat them like a friend, not a client. They're intimidated by marketing, and most marketing advice was written for people who find self-promotion easy. Your craft: everything you say is quietly grounded in real psychology, but it reads like a gentle observation about them, never a lesson.

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
}`
      + PROMPT_QUALITY;

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
      // Anti-generic second pass: silently trims any sentence that could
      // belong to someone else's result. Falls back to the original on failure.
      const tightened = await tightenResult(parsed, Object.values(finalAnswers).join("\n"), ["reframe", "moment", "mirror", "edge", "against", "gap"]);
      // stash the answers so the 7-day plan call can use them
      tightened._answers = finalAnswers;
      setResult(tightened);
      ph("step_completed", { step: "foundation" });
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

      {/* ── FULL-BLEED HERO with ambient video (landing only) ── */}
      {step === -1 && (
        <>
          <section style={{ position: "relative", overflow: "hidden", background: INK_TEAL, backgroundImage: "url(/media/hero-poster.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}>
            <video autoPlay muted loop playsInline poster="/media/hero-poster.jpg" aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
              <source src="/media/hero.mp4" type="video/mp4" />
            </video>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, rgba(11,59,52,.72) 0%, rgba(11,59,52,.55) 45%, rgba(11,59,52,.85) 100%)" }} />
            <div className="mw-fade" style={{ position: "relative", maxWidth: 920, margin: "0 auto", padding: "20px 24px 40px" }}>
              {/* Nav: the strongest startup signal on the page is a nav with "For teams". */}
              <div style={{ margin: "-20px -24px 14px" }}>
                <SiteNav tone="dark" onStart={() => { track("start_questions"); setStep(-2); window.scrollTo({ top: 0 }); }} />
              </div>
              <h1 style={{ fontSize: "clamp(34px, 5.6vw, 52px)", lineHeight: 1.05, margin: "0 0 14px", fontWeight: 350, color: CREAM, letterSpacing: "-0.01em" }}>
                Get found.<br />
                <span style={{ display: "inline-block" }}>
                  <span style={{ fontStyle: "italic", fontWeight: 400, color: BUTTER }}>Without performing.</span>
                  <UnderlineStroke width={280} />
                </span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(251,247,240,.9)", maxWidth: 540, margin: "0 0 18px" }}>
                Personal branding for people who are good at the work and bad at the announcing.
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 24px", fontFamily: SANS, fontSize: 13.5, color: "rgba(251,247,240,.75)" }}>
                <img src="/media/afrin-portrait.jpg" alt="Sabiha Afrin" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,247,240,.35)" }} />
                <span>Built by Sabiha Afrin, brand strategist. The questions are hers. The AI just makes them fast.</span>
              </p>
              <button className="mw-btn" onClick={() => { track("start_questions"); setStep(-2); window.scrollTo({ top: 0 }); }} style={{ ...primaryBtn, fontSize: 18, padding: "17px 36px" }}>Start the six questions</button>
              <p style={{ fontSize: 13.5, color: "rgba(251,247,240,.6)", marginTop: 14, fontFamily: SANS }}>
                Six questions, about ten minutes. You leave knowing what content to make, with a 7-day plan. No account, no email.
              </p>
            </div>
          </section>

          {/* ── WHO IT'S FOR: inclusive, by the feeling, never by a label. Lands the distinction fast. ── */}
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
                  <a href="/brief" onClick={() => track("welcomeback_brief")} style={{ fontFamily: SANS, fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>See your Inward Brief so far &rarr;</a>
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

          {/* The "for the quiet ones" editorial band was merged into the "Who it's for" section above. */}

          {/* ── 6. THE TOOLS: her order. The six questions live in the hero;
                this shelf is everything else, each tool standing alone. ── */}
          <section id="framework" style={{ maxWidth: 680, margin: "0 auto", padding: "52px 24px 8px", scrollMarginTop: 20 }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 20px" }}>The tools</p>
            <a href="/photo-to-posts" onClick={() => track("opened_photo")} className="mw-card-hover" style={{ display: "block", textDecoration: "none", color: CREAM, background: INK_TEAL, borderRadius: 16, padding: "20px 24px", marginBottom: 18 }}>
              <span style={{ display: "block", fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: BUTTER, fontWeight: 700, marginBottom: 6 }}>Have a photo of your work?</span>
              <span style={{ display: "block", fontSize: 20, fontWeight: 400, marginBottom: 4, lineHeight: 1.3 }}>Photo to Posts{doneSteps.includes("photo") ? " \u2713" : ""}</span>
              <span style={{ display: "block", fontSize: 14.5, fontFamily: SANS, color: "rgba(251,247,240,.85)", lineHeight: 1.55 }}>Upload one photo. The AI looks at it and writes three posts in your voice, ready to tweak and post. No face required.</span>
            </a>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A8F82", fontWeight: 700, margin: "22px 0 10px" }}>Go deeper into personal branding</p>
            {[
              { title: "The Inward Scan", body: "One minute, eight taps. It names the specific way you get stuck when it's time to be visible.", key: "scan", href: "/scan" },
              { title: "Brand Voice", body: "Your actual voice, written down, so everything you publish sounds like you instead of like everyone.", key: "voice", href: "/brand-voice" },
              { title: "The Gentle Roast", body: "Paste what you wrote. Hear what to keep, what sounds like a costume, and one small fix.", key: "roast", href: "/roast" },
              { title: "AI visibility check", body: "A live scan of where you actually show up, with the words that raise it.", key: "audit", href: "/ai-visibility" },
            ].map((c) => {
              const ok = doneSteps.includes(c.key);
              return (
                <a key={c.key} href={c.href} onClick={() => track("opened_" + c.key)} className="mw-card-hover" style={{ display: "block", textDecoration: "none", color: INK, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
                  <span style={{ fontFamily: SANS, fontSize: 16.5, fontWeight: 600 }}>{c.title}{ok ? " \u2713" : ""}</span>
                  <span style={{ display: "block", fontSize: 14.5, color: "#6B6157", fontFamily: SANS, lineHeight: 1.55, marginTop: 3 }}>{c.body}</span>
                </a>
              );
            })}
            <p style={{ fontSize: 15, color: "#6B6157", fontFamily: SANS, margin: "14px 0 0", lineHeight: 1.7 }}>
              Each one works on its own. Everything you make quietly collects into{" "}
              <a href="/brief" style={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}>your Inward Brief</a>, emailed to you as one page.
            </p>
          </section>

          {/* ── WHO THIS IS FOR: the photos are back, the words still carry it ── */}
          <section style={{ borderTop: "1px solid #EFE7DA", background: "#FBF8F0", margin: "44px 0 0", padding: "40px 0 44px" }}>
            <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 24px" }}>
              <div className="mw-who-grid" style={{ marginBottom: 28 }}>
                <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "1/1", boxShadow: "0 10px 26px rgba(11,59,52,.12)" }}>
                  <img loading="lazy" decoding="async" src="/media/pottery-hands.jpg" alt="Hands shaping clay on a pottery wheel" className="mw-kenburns" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "8px 6px" }}>
                  <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 12px" }}>Who it's for</p>
                  <p style={{ fontSize: "clamp(20px, 2.7vw, 25px)", lineHeight: 1.3, margin: 0, fontWeight: 350 }}>
                    Built for people whose credibility <span style={{ fontStyle: "italic", color: ACCENT }}>lives in their work.</span>
                  </p>
                </div>
                <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "1/1", boxShadow: "0 10px 26px rgba(11,59,52,.12)" }}>
                  <img loading="lazy" decoding="async" src="/media/writing-notebook.jpg" alt="A hand writing in a notebook by a window, coffee and glasses nearby" className="mw-kenburns" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animationDelay: "-12s" }} />
                </div>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "#443F39", margin: "0 0 24px", fontFamily: SANS, maxWidth: 680 }}>
                Professors, researchers, and PhD candidates. Clinicians and scientists. Engineers,
                designers, and independent consultants. Anyone who would rather be judged on what
                they made than on how loudly they said it.
              </p>
              <p style={{ fontSize: "clamp(18px, 2.4vw, 21px)", lineHeight: 1.5, color: INK, margin: 0, borderLeft: `3px solid ${BUTTER}`, paddingLeft: 18, maxWidth: 680 }}>
                People often tell me branding feels like it was written for extroverts. I disagree.
                Any good brand strategist knows great brands aren't built on volume.
                They're built on clarity, consistency, <span style={{ fontStyle: "italic", color: ACCENT }}>and the confidence to be unmistakably yourself.</span>
              </p>
            </div>
          </section>

          {/* ── 3. THE PROBLEM ── */}
          <section style={{ maxWidth: 680, margin: "0 auto", padding: "52px 24px 8px" }}>
            <p style={{ fontSize: "clamp(21px, 3vw, 26px)", lineHeight: 1.4, margin: "0 0 16px", fontWeight: 350, color: INK }}>
              You have the expertise. <span style={{ fontStyle: "italic", color: ACCENT }}>Someone with half of it has the audience.</span>
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "#443F39", margin: 0, fontFamily: SANS }}>
              That gap is not a talent problem. It is a specific way of getting stuck when you
              have to talk about your own work. There are five of them, and each one has a name.
            </p>
          </section>


          {/* ── 7. FOR DEPARTMENTS AND TEAMS: the waitlist. Hidden for now. ── */}
          {SHOW_TEAMS && (
          <section id="teams" style={{ background: INK_TEAL, margin: "52px 0 0", padding: "48px 0", scrollMarginTop: 20 }}>
            <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 27px)", lineHeight: 1.25, margin: "0 0 14px", fontWeight: 350, color: CREAM }}>
                Branding Inward <span style={{ fontStyle: "italic", color: BUTTER }}>for departments and teams</span>
              </h2>
              <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "rgba(251,247,240,.85)", margin: "0 0 10px", fontFamily: SANS }}>
                Most people who never post are not uninterested. They are stuck in a specific way,
                and every way of being stuck needs a different fix.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "rgba(251,247,240,.85)", margin: "0 0 22px", fontFamily: SANS }}>
                We are building a version that shows a whole team how each person is stuck, and what
                to do about each one. If that is a problem you have, leave your email and I will come find you.
              </p>
              {teamSent ? (
                <p style={{ fontFamily: SANS, fontSize: 16, color: BUTTER, margin: 0, fontWeight: 600 }}>You're on the list. I'll come find you.</p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); joinWaitlist(); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input aria-label="Your email" type="email" required value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)}
                    placeholder="you@university.edu"
                    style={{ flex: "1 1 220px", fontFamily: SANS, fontSize: 16, padding: "13px 16px", borderRadius: 12, border: "1px solid rgba(251,247,240,.35)", background: "rgba(251,247,240,.08)", color: CREAM, outline: "none" }} />
                  <button type="submit" className="mw-btn" disabled={teamBusy}
                    style={{ background: BUTTER, color: INK_TEAL, border: "none", borderRadius: 12, padding: "13px 22px", fontFamily: SANS, fontSize: 15.5, fontWeight: 700, cursor: "pointer", opacity: teamBusy ? 0.6 : 1 }}>
                    {teamBusy ? "Joining\u2026" : "Join the waitlist"}
                  </button>
                  {teamErr && <p style={{ width: "100%", fontFamily: SANS, fontSize: 14, color: "#F0997B", margin: "4px 0 0" }}>{teamErr}</p>}
                </form>
              )}
            </div>
          </section>
          )}

        </>
      )}

      {/* ── /foundation INTRO: a hero + what-this-does, so Step 2 matches the other tools ── */}
      {step === -2 && (
        <>
          <ToolHero
            label="What you're really about"
            photo="/media/quiet-desk.jpg"
            accent={ACCENT}
            Doodle={DoodleBubble}
            headline={<>Six small questions.<br /><span style={{ fontStyle: "italic", color: "#F7D06B" }}>One clear you at the end.</span></>}
            sub="No marketing words. Answer like you'd tell a friend, and you'll know the real reason people choose you."
          />
          <section className="mw-fade" style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px 8px" }}>
            <ToolIntro
              stepKey="foundation"
              walkaway="What you're really about, in your own words, plus the signature moves to repeat."
              time="About three minutes"
              madeFor="anyone who can't name what makes them different."
            />
            <p style={{ ...miniLabel, marginBottom: 10 }}>What are you branding?</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[["self", "Myself"], ["maker", "Something I make"]].map(([k, label]) => (
                <button key={k} className="mw-btn"
                  onClick={() => { setAudience(k); remember("audience", k); track("started"); ph("step_started", { step: "foundation", audience: k }); phSetAudience(k); setStep(0); }}
                  style={{ ...primaryBtn, fontSize: 17, padding: "16px 28px" }}>
                  {label} &rarr;
                </button>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: "#9A8F82", fontFamily: SANS, margin: "12px 0 0" }}>
              Same six questions either way, phrased for your path. About ten minutes, stop anytime.
            </p>
            <p style={{ fontSize: 14, color: "#9A8F82", margin: "16px 0 0", fontFamily: SANS }}>
              No account. One question at a time, and nothing leaves your device.
            </p>
          </section>

          {/* ── STUCK PICKER: a fallback, not a rival to this page's own CTA. It
                 sits after the six questions are offered, framed for the person
                 who isn't sure this is their step. ── */}
          <section style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 8px", borderTop: "1px solid #EFE7DA" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#9A8F82", fontWeight: 600, margin: "26px 0 8px" }}>Not sure this is your step?</p>
            <h2 style={{ fontSize: "clamp(20px, 2.8vw, 25px)", lineHeight: 1.25, margin: "0 0 8px", fontWeight: 350 }}>
              Tell me where you <span style={{ fontStyle: "italic", color: ACCENT }}>get stuck</span>, and I'll point you to the right one.
            </h2>
            <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 22px", fontFamily: SANS, maxWidth: 560 }}>
              Some of these lead back here. Some lead somewhere else entirely, and that's fine.
            </p>
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
                  {s.href && s.href !== "/foundation" ? (
                    <a href={s.href} className="mw-btn" style={{ ...primaryBtn, display: "inline-block", textDecoration: "none" }}>{s.path} →</a>
                  ) : (
                    <button className="mw-btn" onClick={() => { if (!audience) { setAudience("self"); remember("audience", "self"); } track("started"); ph("step_started", { step: "foundation" }); setStep(0); window.scrollTo({ top: 0 }); }} style={primaryBtn}>{s.path} →</button>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <button onClick={() => { track("stuck_see_all"); document.getElementById("framework")?.scrollIntoView({ behavior: "smooth" }); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 14, color: ACCENT, fontWeight: 600 }}>
                      Not quite it? See all five tools →
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>

        </>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: step < 0 ? "0 24px" : "48px 24px 80px" }}>
        {step >= 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
              Branding Inward
            </span>
          </div>
        )}

        {/* WHAT'S ALREADY EMERGING: the Fix-3 breather after question three. */}
        {q && emergingOpen && step === 3 && (
          <div className="mw-fade" style={{ marginBottom: 8 }}>
            <p style={{ ...miniLabel, marginBottom: 10 }}>Halfway checkpoint</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.2, margin: "0 0 16px", fontWeight: 350 }}>
              Here's what's <span style={{ fontStyle: "italic", color: ACCENT }}>already emerging.</span>
            </h2>
            {emerging ? (
              <div style={{ ...plainCard, borderLeft: `4px solid ${BUTTER}`, marginBottom: 18 }}>
                <p style={{ fontSize: 19, lineHeight: 1.6, margin: 0, color: INK }}>{emerging}</p>
              </div>
            ) : (
              <p style={{ fontSize: 16, color: "#857B70", fontFamily: SANS, margin: "0 0 18px" }}>Reading your first three answers&hellip;</p>
            )}
            <button className="mw-btn" onClick={() => setEmergingOpen(false)} style={primaryBtn}>
              Keep going, three questions left &rarr;
            </button>
            <p style={{ fontSize: 13.5, color: "#9A8F82", fontFamily: SANS, margin: "12px 0 0" }}>
              Or stop here. Your answers are saved on this device and will be waiting.
            </p>
          </div>
        )}

        {/* QUESTIONS */}
        {q && !(emergingOpen && step === 3) && (
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
            <textarea aria-label="Your answer"
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
                Speaking needs Chrome, Edge or Safari. Typing works everywhere.
              </p>
            )}
          </div>
        )}

        {/* LOADING */}
        {step === QUESTIONS.length && loading && (
          <StepLoader steps={["Reading what you wrote", "Finding what you're really about", "Checking it against the psychology", "Cutting anything generic", "Writing your result"]} />
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
                      <KeptNote section="Understand yourself" />
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

        {step !== -2 && <PageQuote id="home" />}
      </div>

      {/* The pathway shows on every screen of this step, not just at the end, so
          someone who lands here cold can see the whole journey. The home landing
          (step -1) has its own framework overview instead. */}
      {step !== -1 && <FrameworkStrip current="foundation" />}

      <SiteFooter />
    </div>
  );
}
