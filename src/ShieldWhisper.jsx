import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, ACCENT_RGB, INK_TEAL,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse,
  useVoiceInput, MicIcon,
  GrainOverlay, DoodleShield, GhostNumber, DropQuote, PageQuote, WhatThisDoes, NextTools, SuccessProof,
  primaryBtn, ghostBtn, miniLabel, plainCard, heroCard, quoteCard, todayBox,
} from "./lib/whisperKit.jsx";

const QUESTIONS = [
  {
    id: "makes",
    label: "What do you make or do?",
    help: "Like you'd tell a friend, not a headline.",
    placeholder: "I make jewelry, or I write songs, or I coach new parents",
  },
  {
    id: "feeling",
    label: "When you post about it as yourself, what's the feeling that stops you?",
    help: "Name it plainly. There's no wrong answer here.",
    placeholder: "Like I'm bragging, or like everyone's watching and judging",
  },
  {
    id: "fan",
    label: "Who quietly loves what you make? Describe one real person.",
    help: "Someone specific, not \"my audience.\"",
    placeholder: "My neighbor who buys a candle every restock and never says much. Or the client who quietly refers me to everyone they know.",
  },
  {
    id: "trusted",
    label: "Think of a brand or artist you love, where you've never seen the founder's face or heard them hype themselves. What made you trust them?",
    help: "The craft? The consistency? The vibe? Whatever it was for you.",
    placeholder: "A ceramics studio whose pieces speak for themselves. Or a newsletter I trusted for years without ever seeing the writer's face.",
  },
  {
    id: "place",
    label: "If your work were a place, what would it feel like to walk into?",
    help: "The mood, not the decor.",
    placeholder: "A small shop that smells like cedar, nobody rushing you. Or a calm room where someone finally has time to actually listen.",
  },
  {
    id: "wish",
    label: "What do you wish someone would say about your work, that you'd never say yourself?",
    help: "The praise you'd be embarrassed to write, but would love to hear.",
    placeholder: "The most honest thing they bought all year. Or the advice that finally made something click.",
  },
];

export default function ShieldWhisper() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);

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

    const systemPrompt = `You are the listener behind Branding Inward's brand voice tool: a warm, plainspoken guide for people who find self-promotion physically uncomfortable, the shy, the introverted, the ones who'd rather disappear than post about themselves. The belief this tool is built on: you do not GENERATE a voice for them, you OBSERVE the one they already have. Their answers are not just information, they are a voice sample. Study HOW they talk: the words they reach for, how long their sentences run, what they repeat, what they play down, where they suddenly get vivid. Everything you hand back must be built from who they already are, with evidence quoted from their own words. Never suggest a persona, an alter ego, or being someone else. The voice you hand back should feel like them on a good day, nerves removed, nothing added.

VOICE: plain, warm, short sentences, the way a real person texts. Do not use em-dashes or en-dashes anywhere, use commas and periods instead. NEVER assume gender: use "they", "them", or "your person", never he, she, him, her, his, or hers. This applies even to people the user names, no matter how the name sounds. Dana is "they", Priya is "they", Mike is "they". Max 2 sentences per field, except "heard" which may run to 3, "sample" which is one short post, and "names" which is exactly 3 short options.

${PSYCH_LIBRARY}

THREE RULES THAT MATTER MOST:
1. "heard" is observation, not flattery. Name 2 or 3 real patterns in how they actually wrote their answers (word choice, rhythm, what they repeat, what they understate), each backed by a short exact phrase of theirs quoted in single quotes. If their answers are short and plain, say what short and plain says about them, economy is a voice too. Never quote a phrase they did not write.
2. "proof" and "honest" must be built ONLY from what this person actually said, AND quietly grounded in the library, with every term and name left out. In "proof", make the point that quiet, steady presence is what actually builds trust and gets remembered, using their fan as the living evidence. In "honest", use your one allowed "researchers found" for the finding that self-promoters are liked less and judged no more capable, so their instinct not to perform is right. Name their fan from question 3, name what they said they trust in question 4, and echo their own word for the feeling from question 2. If a line could be copy-pasted onto someone else's answers, it is too generic, rewrite it until it could only be about them.
3. "today" must be one real, specific method, not generic advice like "post consistently" or "just start." Pick the ONE tactic below that best fits what they told you, and describe it as a concrete action, under 15 minutes, using their own project as the example.

TACTIC LIBRARY (pick and adapt exactly ONE for "today", matched to their answers, do not invent a new one):
- The Swap: don't write about yourself, ask your fan from question 3 for a two-sentence quote about your work and post their words as the caption, credited to them.
- The Curator Seat: feature someone else's work in your niche this week (a shoutout, a small roundup) instead of your own.
- Record Once, Cut Many: talk out loud to a friend, or record a voice memo, about your work for five minutes, then pull one sentence from it as your next caption.
- The Process Feed: post one photo of your hands or workspace mid-process, with a caption of five words or fewer.
- Apply, Don't Pitch: find one open call, directory, or "features wanted" post in your niche this week and submit to it, instead of posting about yourself.
- Comment Before You Post: leave one specific, generous comment on someone else's post in your space today, no post of your own required yet.
- The Standing Invitation: write one pinned post or bio line that says what you make and how to reach you, so you never have to re-announce yourself.

Return ONLY valid JSON, no markdown, no preamble. Output it compactly with no blank lines between fields, make sure every key is exactly "name": with a colon, and NEVER use double quote marks inside a field's text, use single quotes there instead:
{
  "heard": "2 or 3 patterns you noticed in how they actually talk, each with a short exact phrase of theirs quoted back in single quotes as evidence (max 3 sentences)",
  "voicename": "their voice, named the way you'd describe a person you know, 2 to 5 plain words drawn from their own language. It names what already exists, it is never a character to play",
  "proof": "the proof they already have, built from their fan (question 3) and what they trust (question 4), as living evidence that quiet, steady presence already works, no terms or names (max 2 sentences)",
  "honest": "their instinct not to perform is right, researchers found self-promoters are liked less and judged no more capable. Say it gently, echo their own word for the feeling from question 2, and land that a defined voice is them with the nerves removed, not a mask. (max 2 sentences)",
  "names": ["3 short brand-name directions that fit who they already are. If this reads like a personal brand, one option SHOULD be built on their own name"],
  "stand": "what this brand stands for (max 2 sentences)",
  "voice": "how this brand talks, 3 vivid traits observed in their answers, not invented (max 2 sentences)",
  "sample": "one short post in their voice, reusing at least one phrase they actually wrote, carrying the spirit of the praise they wished for in question 6, never boastful",
  "shows": "what they can show the world when they don't feel like showing their face: the work, the process, the place (max 2 sentences)",
  "today": "the ONE matched tactic from the library above, described as a concrete action using their own project, under 15 minutes (max 2 sentences)"
}`;

    const userPrompt = `Here's what they told me:
1. What they make or do: ${finalAnswers.makes}
2. The feeling that stops them from posting as themselves: ${finalAnswers.feeling}
3. A real person who quietly loves what they make: ${finalAnswers.fan}
4. A brand or artist they trust without ever seeing the founder's face: ${finalAnswers.trusted}
5. What their work would feel like as a place: ${finalAnswers.place}
6. What they wish someone would say about their work: ${finalAnswers.wish}

These answers are also your voice sample. Study how they wrote them, not just what they said. Observe their voice, name it, and hand it back in words they can use, with their own phrases quoted as evidence.`;

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
      parsed.names = Array.isArray(parsed.names) ? parsed.names : [];
      parsed._answers = finalAnswers;
      setResult(parsed);
      track("shield_completed");
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
    let t = "MY BRAND VOICE, from Branding Inward\n\n";
    if (result.heard) t += `What came through in how I talk:\n${result.heard}\n\n`;
    if (result.voicename) t += `My voice, named:\n${result.voicename}\n\n`;
    if (result.proof) t += `The proof I already have:\n${result.proof}\n\n`;
    if (result.honest) t += `Why this is more honest, not less:\n${result.honest}\n\n`;
    if (result.names?.length) t += `Brand name directions:\n${result.names.join(", ")}\n\n`;
    if (result.stand) t += `What I stand for:\n${result.stand}\n\n`;
    if (result.voice) t += `My voice:\n${result.voice}\n\n`;
    if (result.sample) t += `A sample post in my voice:\n${result.sample}\n\n`;
    if (result.shows) t += `What I show when I don't want to show my face:\n${result.shows}\n\n`;
    if (result.today) t += `My first move:\n${result.today}\n\n`;
    const card = buildVoiceCard();
    if (card) t += `----------\n${card}\n`;
    return t.trim();
  }

  // The take-anywhere voice card: paste into any AI so it edits toward this
  // voice instead of writing over it. Built from the observed fields, no extra AI call.
  function buildVoiceCard() {
    if (!result) return "";
    let t = "MY VOICE CARD. I'm pasting this so you can be my editor, not my ghostwriter.\n\n";
    if (result.voicename) t += `My voice, named: ${result.voicename}\n`;
    if (result.voice) t += `How I sound: ${result.voice}\n`;
    if (result.heard) t += `Patterns that are mine: ${result.heard}\n`;
    if (result.stand) t += `What I stand for: ${result.stand}\n`;
    if (result.sample) t += `A post that sounds like me: "${result.sample}"\n`;
    t += `\nWhen you help me write:
- Edit my drafts toward this voice. Keep my words wherever they already work.
- Never invent facts, feelings, or stories I didn't give you.
- Short sentences, plain words, no em-dashes, nothing salesy.
- If a line could be anyone's, point it out instead of polishing it.`;
    return t;
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  async function copyCard() {
    try { await navigator.clipboard.writeText(buildVoiceCard()); setCardCopied(true); setTimeout(() => setCardCopied(false), 2000); }
    catch (_) { setCardCopied(false); }
  }

  const cards = result ? [
    { key: "heard", label: "What came through in how you talk", body: result.heard, hero: true },
    { key: "voicename", label: "Your voice, named", body: result.voicename },
    { key: "proof", label: "The proof you already have", body: result.proof },
    { key: "honest", label: "Why this is more honest, not less", body: result.honest },
    { key: "names", label: "3 directions for a name", body: result.names?.join("  ·  ") },
    { key: "stand", label: "What you stand for", body: result.stand },
    { key: "voiceSample", label: "How you sound", body: result.voice, sample: result.sample },
    { key: "shows", label: "What to show, when you don't want to show your face", body: result.shows },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      {/* ── EDITORIAL INTRO: your voice, written down, still authentically you. Still image, no video, deliberately unlike the home hero. ── */}
      {step === -1 && (
        <section className="mw-fade" style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
            <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
                Branding Inward
              </span>
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <DoodleShield size={30} />
                <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: 0 }}>Your brand voice</p>
              </div>
              <h1 style={{ fontSize: "clamp(38px, 5.5vw, 54px)", lineHeight: 1.08, margin: "0 0 24px", fontWeight: 350 }}>
                You don't need a new voice.<br /><span style={{ fontStyle: "italic", color: ACCENT }}>You need yours, written down.</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 18px" }}>
                You already have a voice. It's the way you talk about your work when a friend asks and
                you forget to be nervous. Nobody ever helped you put words to it, so every post starts
                from a blank page, and blank pages are where the freezing happens.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C534B", margin: "0 0 18px" }}>
                Most AI tools generate a voice for you, and it sounds like everyone else's AI.
                This one works the other way around. Six questions, the kind a journalist would ask.
                You talk, it listens, and it hands back the patterns that were already yours,
                quoted from your own words, with a name.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: INK, fontWeight: 500, margin: "0 0 24px" }}>
                Then your voice is on paper, and you never start from blank again. Speak your answers
                if you can. Your voice lives in how you say things, not just what you say.
              </p>
              <WhatThisDoes
                walkaway="Your voice named and quoted back from your own words, plus one thing to post today."
                time="About three minutes"
                forwho="Anyone who sounds like a stranger the moment they go public."
              />
              <button className="mw-btn" onClick={() => { track("shield_started"); setStep(0); }} style={primaryBtn}>Put my voice on paper (takes 3 minutes)</button>
              <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 16, fontFamily: SANS }}>
                No account. Nothing you type or say is saved. Ramble welcome, nobody's grading this.
              </p>
            </div>
            <figure style={{ margin: 0 }}>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 18px 44px rgba(11,59,52,.16)", transform: "rotate(1.2deg)" }}>
                <img src="/media/shield-still.jpg" alt="An artist holding their painting up in front of their face" style={{ width: "100%", display: "block" }} />
              </div>
              <figcaption style={{ fontFamily: SANS, fontSize: 13, color: "#9A8F82", marginTop: 12, fontStyle: "italic", textAlign: "center" }}>
                Your work does the talking. Your voice makes it sound like you.
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: step === -1 ? "0 24px" : "48px 24px 80px" }}>
        {step !== -1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
                Branding Inward
              </span>
            </a>
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
                {step + 1 >= QUESTIONS.length ? "Show me my voice" : "Next"}
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
            <p style={{ fontSize: 22, color: "#5C534B" }}>Listening back through everything you said…</p>
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

        {/* RESULT — cards revealed one at a time, proof first */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Your voice, on paper</p>
            <div style={{ marginTop: 8 }}>
              {cards.slice(0, reveal + 1).map((c, i) => (
                <div key={c.key} className="mw-deal" style={c.hero ? heroCard : plainCard}>
                  {c.hero && <DropQuote />}
                  <p style={{ ...miniLabel, marginBottom: 8, position: "relative" }}>{c.label}</p>
                  <p style={{ fontSize: c.hero ? 24 : 19, lineHeight: 1.42, margin: c.sample ? "0 0 14px" : 0, color: INK, position: "relative", fontWeight: c.hero ? 350 : 400 }}>{c.body}</p>
                  {c.sample && (
                    <div style={{ ...quoteCard, margin: 0 }}>
                      <p style={{ fontSize: 18, lineHeight: 1.5, fontStyle: "italic", margin: 0, color: INK }}>"{c.sample}"</p>
                    </div>
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
                {result.today && (
                  <div style={todayBox}>
                    <p style={{ ...miniLabel, color: "#FFF", opacity: 0.85, marginBottom: 10 }}>Your first move</p>
                    <p style={{ fontSize: 20, lineHeight: 1.45, color: "#FFF", margin: 0 }}>{result.today}</p>
                  </div>
                )}

                <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1" }}>
                  <p style={{ ...miniLabel, marginBottom: 8 }}>Take your voice anywhere</p>
                  <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5C534B", margin: "0 0 14px" }}>
                    Your voice card is a block of text you paste into any AI before asking for writing help.
                    It turns the AI into your editor, not your ghostwriter. It fixes your drafts toward
                    sounding like you, instead of writing over you.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="mw-btn" onClick={copyCard} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15 }}>
                      {cardCopied ? "Copied ✓" : "Copy my voice card"}
                    </button>
                    <button className="mw-ghost" onClick={copyAll} style={ghostBtn}>
                      {copied ? "Copied ✓" : "Copy everything"}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #E5DDD1" }}>
                  <button className="mw-ghost" onClick={restart} style={{ ...ghostBtn, marginLeft: 0 }}>Start over</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <SuccessProof
        eyebrow="People who never performed either"
        headline={<>They hated the spotlight. <span style={{ fontStyle: "italic", color: ACCENT }}>People still found their voice.</span></>}
        intro="None of them use this site. They just prove you can be known for the work without performing yourself."
        quote={{ q: "The only way to do great work is to love what you do.", a: "Steve Jobs" }}
      />
      <NextTools current="voice" />
      <PageQuote id="voice" />

      {/* FOOTER — full-bleed ink teal */}
      <footer style={{ background: INK_TEAL, marginTop: 60 }}>
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
