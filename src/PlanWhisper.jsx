import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, GhostNumber, DropQuote,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, quoteCard, todayBox,
} from "./lib/whisperKit.jsx";

// A small hand-drawn compass, because this page is about finding YOUR route.
function DoodleCompass({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke={ACCENT} strokeWidth="2" fill="none" />
      <path d="M20.5 11.5 L18 18 L11.5 20.5 L14 14 Z" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="16" r="1.2" fill={ACCENT} />
    </svg>
  );
}

const QUESTIONS = [
  {
    id: "makes",
    label: "What do you make or do?",
    help: "Like you'd tell a friend, not a headline.",
    placeholder: "I make ceramic mugs, or I tutor kids in math, or I mix small-batch hot sauce",
  },
  {
    id: "social",
    label: "Be honest, how do you feel about posting on social media?",
    help: "There's no right answer. \"I'd rather do dishes forever\" is useful data.",
    placeholder: "I hate it, or I don't mind it but I never know what to say",
  },
  {
    id: "easy",
    label: "When has talking about your work ever felt easy? What was the setting?",
    help: "One-on-one, writing, a market stall, a group chat of strangers. Wherever it was.",
    placeholder: "Chatting at my craft fair table, or in a discord where nobody knows my face",
  },
  {
    id: "time",
    label: "How much time can you give this each week without starting to resent it?",
    help: "The real number. Resentment is what kills consistency, so we plan under it.",
    placeholder: "Maybe two hours on sunday, honestly",
  },
  {
    id: "peer",
    label: "Is there another small creator you admire, chat with, or quietly follow?",
    help: "Any size, any craft. \"Nobody yet\" is a fine answer too.",
    placeholder: "A candle maker I always comment back and forth with on instagram",
  },
  {
    id: "win",
    label: "Six months from now, what would make you say \"this is working\"?",
    help: "Your version of working, not the influencer version.",
    placeholder: "Steady orders every week without ever having to go viral",
  },
];

export default function PlanWhisper() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [copied, setCopied] = useState(false);
  const [askCopied, setAskCopied] = useState(false);

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

    const systemPrompt = `You are the planner behind Branding Inward's quieter plan tool. Your person finds self-promotion physically uncomfortable, and every marketing plan they've ever been handed assumes they'll perform on social media daily. When they can't keep that up, they decide THEY failed. They didn't, the plan did. You build the plan the other way around: from what they said they can actually stand doing, how they actually like talking to people, and the time they gave you. You never hand them a menu of options, you CHOOSE for them, one main path, because choosing is the exhausting part.

${PSYCH_LIBRARY}

THE PATH LIBRARY (pick exactly ONE main path, the best fit for their answers, never a menu):
- QUIET SOCIAL: for someone whose social answer is closer to "don't mind it" than "hate it." The work performs, not the person: process shots, the place, the materials, no face and no hype required. If you pick this, "plan" must include 3 concrete content ideas built from THEIR craft and THEIR words, things they could shoot or write this week, never generic prompts like "share your journey."
- THE LETTER: for writers, one-on-one people, and low-time people. A tiny email list and one short, honest letter a month, like a note to a friend who asked what's new. If you pick this, "plan" must include where the signup line lives, the plain sentence that invites people onto it, and what the first letter is about, drawn from their answers.
- THE ROOM: for people whose easy setting was in person. Markets, local gatherings, workshops, the places where their kind of person already stands around. If you pick this, "plan" must name the concrete kind of room for their craft and the smallest version of showing up to it.
- THE NICHE HALLS: for people who like the internet but hate broadcasting, the ones comfortable in comment sections and group chats. Reddit, Discord, and forums for their craft, where being generous and specific IS the marketing. Only name a specific community if you are certain it is real and active (like r/Pottery or r/somethingimade), otherwise tell them exactly what to search for. Helpfulness first, their own work mentioned only when asked or in the allowed flair.

Match the path to their social-media feeling, their easy setting, and their weekly time. The plan must fit INSIDE the time they gave, with room to spare.

THE BUDDY SYSTEM (always include, this is the move nobody puts in their plan): propose they pair up with ONE other small creator in similar shoes, someone at their size, in a craft near theirs, someone who also hates saying nice things about themselves. The trade: they each say the honest thing about the OTHER's work, testimonials, shoutouts, "you should see what they make." It works because praising someone else costs a shy person nothing, and praise is simply more believable when it comes from someone else's mouth, their own instinct already told them that. If they named a person in their answers, the buddy is that person, use the name. If they said nobody yet, tell them exactly where their buddy is standing, inside the path you chose.

VOICE: plain, warm, short sentences, the way a real person texts. Do not use em-dashes or en-dashes anywhere, use commas and periods instead. NEVER assume gender: use "they" and "them" for anyone, no matter how a name sounds. Ground what you say in the library with every name and term left out, and use "researchers found" at most once in the whole response.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly, every key exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead. Use \\n between the moves in "plan":
{
  "path": "the one path you chose and why it fits what they actually said, echoing their own words (max 2 sentences)",
  "plan": "3 small moves on that path for the next two weeks, separated by \\n, each starting with a verb, each concrete enough to do without thinking, each under an hour, built from their craft and answers",
  "buddy": "the buddy-up proposal, personalized: who (their named person if they gave one), where that person is if they didn't, and why trading honest praise works for someone who answered the way they did (max 3 sentences)",
  "ask": "the exact message they could send that person to propose it, 2 to 4 short sentences, plain, warm, no hype, easy to send as-is",
  "today": "one move under 15 minutes they can do today, the smallest first domino of the plan (max 2 sentences)"
}`;

    const userPrompt = `Here's what they told me:
1. What they make or do: ${finalAnswers.makes}
2. How they honestly feel about posting on social media: ${finalAnswers.social}
3. When talking about their work has felt easy: ${finalAnswers.easy}
4. Time they can give each week without resentment: ${finalAnswers.time}
5. Another small creator they admire or chat with: ${finalAnswers.peer}
6. What "working" looks like in six months: ${finalAnswers.win}

Choose their path, build the plan inside their real time, and make the buddy proposal. Their answers are also a voice sample, keep the plan sounding like something they'd actually do.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed || !parsed.path) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass.");
      setResult(parsed);
      track("plan_completed");
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep(-1); setAnswers({}); setDraft(""); resetBase();
    setResult(null); setError(null); setReveal(0);
  }

  function buildSummary() {
    if (!result) return "";
    let t = "MY QUIETER PLAN, from Branding Inward\n\n";
    if (result.path) t += `My path:\n${result.path}\n\n`;
    if (result.plan) t += `The next two weeks:\n${result.plan}\n\n`;
    if (result.buddy) t += `The buddy move:\n${result.buddy}\n\n`;
    if (result.ask) t += `The message to send:\n${result.ask}\n\n`;
    if (result.today) t += `My first move today:\n${result.today}\n`;
    return t.trim();
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  async function copyAsk() {
    if (!result?.ask) return;
    try { await navigator.clipboard.writeText(result.ask); setAskCopied(true); setTimeout(() => setAskCopied(false), 2000); }
    catch (_) { setAskCopied(false); }
  }

  const cards = result ? [
    { key: "plan", label: "The next two weeks, three moves, that's all", body: result.plan },
    { key: "buddy", label: "The buddy move, the one nobody puts in the plan", body: result.buddy, ask: result.ask },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
              Branding Inward
            </span>
          </a>
        </div>

        {/* ── INTRO: the plan built under your energy, not over it ── */}
        {step === -1 && (
          <div className="mw-fade">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <DoodleCompass size={30} />
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: 0 }}>The quieter plan</p>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 22px", fontWeight: 350 }}>
              A plan you won't dread.<br /><span style={{ fontStyle: "italic", color: ACCENT }}>Built from what you can actually stand.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 16px" }}>
              Every marketing plan you've been handed assumes you'll perform on social media every
              day. When you couldn't keep it up, it felt like you failed. You didn't. You were
              given an extrovert's plan, and you're not one.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 16px" }}>
              Six questions about what you make, what you can honestly bear, and the time you
              really have. Then one path, chosen for you. Maybe that's social media with content
              that's actually you. Maybe it's no social at all: a short letter people sign up for,
              real rooms, or the corners of the internet where your people already hang out.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: INK, fontWeight: 500, margin: "0 0 28px" }}>
              And one idea nobody puts in the plan: you don't have to grow alone. Two quiet
              creators can speak for each other when neither can speak for themselves.
            </p>
            <button className="mw-btn" onClick={() => { track("plan_started"); setStep(0); }} style={primaryBtn}>Find my plan (takes 3 minutes)</button>
            <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 16, fontFamily: SANS }}>
              No account. Nothing you type is saved. Ramble welcome, nobody's grading this.
            </p>
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
              ref={inputRef} className="mw-area" value={draft} maxLength={700}
              onChange={(e) => { setDraft(e.target.value); setBase(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(); } }}
              placeholder={q.placeholder} rows={3}
              style={{ width: "100%", fontSize: 19, fontFamily: SERIF, color: INK, padding: "18px 20px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "none", outline: "none", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={next} disabled={!draft.trim()} style={{ ...primaryBtn, opacity: draft.trim() ? 1 : 0.4, cursor: draft.trim() ? "pointer" : "not-allowed" }}>
                {step + 1 >= QUESTIONS.length ? "Build my plan" : "Next"}
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
                  <MicIcon color={listening ? "#FFF" : ACCENT} />
                  {listening ? "Listening…" : "Speak"}
                </button>
              )}
              <button className="mw-ghost" onClick={back} style={ghostBtn}>Back</button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === QUESTIONS.length && loading && (
          <div className="mw-fade" style={{ textAlign: "center", paddingTop: 70 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, animation: `pulse 1.2s ${i * 0.2}s infinite ease-in-out` }} />)}
            </div>
            <p style={{ fontSize: 22, color: "#5C534B" }}>Building a plan around you, not the algorithm…</p>
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

        {/* RESULT — the chosen path first, then the plan, then the buddy move */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Your plan, chosen for you</p>
            <div className="mw-deal" style={{ ...heroCard, marginTop: 8 }}>
              <DropQuote />
              <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>The path that fits you</p>
              <p style={{ fontSize: 24, lineHeight: 1.42, margin: 0, color: INK, position: "relative", fontWeight: 350 }}>{result.path}</p>
            </div>

            <div style={{ marginTop: 24 }}>
              {cards.slice(0, reveal).map((c) => (
                <div key={c.key} className="mw-deal" style={plainCard}>
                  <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>{c.label}</p>
                  <p style={{ fontSize: 19, lineHeight: 1.5, margin: c.ask ? "0 0 14px" : 0, color: INK, position: "relative", whiteSpace: "pre-wrap" }}>{c.body}</p>
                  {c.ask && (
                    <div style={{ ...quoteCard, margin: 0 }}>
                      <p style={{ ...miniLabel, marginBottom: 8 }}>The message, ready to send</p>
                      <p style={{ fontSize: 18, lineHeight: 1.5, fontStyle: "italic", margin: "0 0 14px", color: INK }}>"{c.ask}"</p>
                      <button className="mw-btn" onClick={copyAsk} style={{ ...primaryBtn, padding: "10px 18px", fontSize: 14 }}>
                        {askCopied ? "Copied ✓" : "Copy the message"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {reveal < cards.length && (
                <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 10 }}>
                  {reveal === 0 ? "Okay, what do I do?" : "There's one more thing"}
                </button>
              )}
            </div>

            {reveal >= cards.length && (
              <div className="mw-fade" style={{ marginTop: 26 }}>
                {result.today && (
                  <div style={todayBox}>
                    <p style={{ ...miniLabel, color: "#FFF", opacity: 0.85, marginBottom: 10 }}>Your first move, today</p>
                    <p style={{ fontSize: 20, lineHeight: 1.45, color: "#FFF", margin: 0 }}>{result.today}</p>
                  </div>
                )}
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                    {copied ? "Copied ✓" : "Copy everything"}
                  </button>
                  <button className="mw-ghost" onClick={restart} style={ghostBtn}>Start over</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER — full-bleed ink teal, same promise as everywhere */}
      <footer style={{ background: INK_TEAL, marginTop: 80 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px 40px" }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(251,247,240,.55)", margin: "0 0 18px", fontFamily: SANS, maxWidth: 620 }}>
            Nothing you type here is saved, and I never see it. No cookies, no personal data, just anonymous counts of how many people use the tool.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: CREAM, margin: 0 }}>
            — <span style={{ color: "#F7D06B" }}>S. Afrin</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
