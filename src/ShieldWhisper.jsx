import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";

// ── The Shield Whisper ──
// For people who love their work but freeze when promoting it as THEMSELVES.
// Five questions → a brand persona they can post AS, so the brand talks and they stay in the work.

const QUESTIONS = [
  {
    id: "craft",
    label: "What do you make or do? Say it like you'd tell a friend, not a customer.",
    help: "Ramble welcome. Nobody's grading this.",
    placeholder: "I hand-pour candles, or I write songs in my bedroom studio",
  },
  {
    id: "fear",
    label: "When you post about it as yourself, what's the feeling that stops you?",
    help: "\"It feels like bragging.\" \"Like performing.\" Whatever's true for you.",
    placeholder: "It feels like performing enthusiasm, or like begging people to care",
  },
  {
    id: "fan",
    label: "Who quietly loves what you make? Describe one real person.",
    help: "A customer, a friend, a stranger who once said something kind.",
    placeholder: "A customer who reorders every winter and once wrote 'this got me through'",
  },
  {
    id: "place",
    label: "If your work were a place, what would it feel like to walk into?",
    help: "A warm workshop? A tidy studio? A midnight kitchen?",
    placeholder: "A quiet workshop with wood shavings and good light",
  },
  {
    id: "praise",
    label: "What do you wish someone would say about your work, that you'd never say yourself?",
    help: "This is the sentence your brand gets to say for you.",
    placeholder: "That it's made with more care than it had to be",
  },
];

const ACCENT = "#14805E";
const INK = "#2A2422";
const CREAM = "#FBF7F0";

function salvagePartialJson(str) {
  for (let end = str.length; end > 20; end--) {
    const slice = str.slice(0, end);
    const candidates = [slice + "}", slice + "]}", slice + '"}]}', slice + '"}', slice.replace(/,\s*$/, "") + "}", slice.replace(/,\s*$/, "") + "]}"];
    for (const c of candidates) {
      try { const o = JSON.parse(c); if (o && typeof o === "object") return o; } catch (_) {}
    }
  }
  return null;
}

export default function ShieldWhisper() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseRef = useRef("");

  useEffect(() => {
    if (step >= 0 && step < QUESTIONS.length && inputRef.current) inputRef.current.focus();
  }, [step]);

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

  const q = step >= 0 && step < QUESTIONS.length ? QUESTIONS[step] : null;

  function next() {
    if (!q || !draft.trim()) return;
    if (listening && recognitionRef.current) { recognitionRef.current.stop(); setListening(false); }
    const updated = { ...answers, [q.id]: draft.trim() };
    setAnswers(updated);
    setDraft(""); baseRef.current = "";
    if (step + 1 >= QUESTIONS.length) generate(updated);
    else setStep(step + 1);
  }

  function back() {
    if (listening && recognitionRef.current) { recognitionRef.current.stop(); setListening(false); }
    if (step > 0) { const id = QUESTIONS[step - 1].id; setDraft(answers[id] || ""); baseRef.current = answers[id] || ""; setStep(step - 1); }
    else if (step === 0) setStep(-1);
  }

  async function generate(finalAnswers) {
    setStep(QUESTIONS.length);
    setLoading(true); setError(null); setResult(null); setReveal(0);

    const systemPrompt = `You are a warm, seasoned brand director helping someone who loves their work but freezes when promoting it as THEMSELVES. Posting feels like self-exposure: like bragging, performing, or begging for attention. You are building them a SHIELD BRAND: a brand persona that stands in front of them, so when they post, it is the brand talking, not them baring their soul. Real sellers and artists do this instinctively ("I get to hide behind a brand", "my alter ego posts, not me"). You are making it deliberate.

THE IDEA, in plain words: a brand is not a disguise, it is a shield. Promoting a brand does not feel like promoting yourself. The brand can say the proud things they would never say. The brand can show the work while their face stays optional, forever.

YOUR THINKING:
1. Reflect their exact fear back with warmth, then show how a shield brand dissolves it, specific to what they said, never generic.
2. Suggest 3 brand name directions that are NOT their own name. Draw from the place-feeling they described and what they make. Each name should feel like somewhere to stand, not a costume.
3. What the brand stands for: rooted in the person who quietly loves their work and the care they described.
4. How the brand speaks: 3 vivid traits. Calm, specific, never hype, never begging. The voice they can borrow.
5. One sample post line IN the brand's voice that says the praise they wished for, as the brand's plain statement. This is the moment they feel it: the brand just said the thing they couldn't.
6. What the brand shows instead of their face: process, materials, the place, the work, kind words from others.
7. One small thing to do today, under 15 minutes, using the shield.

VOICE: Direct but warm. Truth, then belief they can do it. No jargon. Short sentences. Write plainly, the way a real person texts. Do not use em-dashes or en-dashes anywhere; use commas and periods instead.

NEVER assume the gender of anyone mentioned. Use "they", "them", "your person". Never he, she, him, her, his, or hers.

Depth means insight, not length. Be specific to THIS person and their exact answers. If a sentence could be about a different maker, rewrite it until it could only be about them. No field longer than 2 sentences.

Return ONLY valid JSON, no markdown, no preamble:
{
  "why": "their fear reflected back warmly + why a shield brand dissolves it, specific to them (max 2 sentences)",
  "names": [ { "name": "a brand name direction, not their own name", "why": "one short line on why it fits them" } ],
  "stand": "what the brand stands for (max 2 sentences)",
  "voice": "3 vivid traits of how the brand speaks + what it never does (max 2 sentences)",
  "sample": "one short post line in the brand's voice that says their wished-for praise as a plain statement (max 20 words)",
  "shows": "what the brand shows instead of their face (max 2 sentences)",
  "today": "one small action today, under 15 minutes, using the shield (max 2 sentences)"
}
Give exactly 3 names.`;

    const userPrompt = `Here's what I told you:
- What I make or do: ${finalAnswers.craft}
- The feeling that stops me from posting as myself: ${finalAnswers.fear}
- One real person who quietly loves my work: ${finalAnswers.fan}
- If my work were a place: ${finalAnswers.place}
- What I wish someone would say about my work: ${finalAnswers.praise}

Build me a brand I can hide behind, so putting my work out there stops feeling like putting myself out there.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The AI service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const rawText = (data.content || []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("").trim();
      if (!rawText) throw new Error("The AI came back empty. Please try again.");
      let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch (_) { parsed = salvagePartialJson(cleaned); if (!parsed) throw new Error("The AI's answer got cut short. Tap to try again, it usually works on a second pass."); }
      parsed.why = parsed.why || ""; parsed.stand = parsed.stand || ""; parsed.voice = parsed.voice || "";
      parsed.sample = parsed.sample || ""; parsed.shows = parsed.shows || ""; parsed.today = parsed.today || "";
      parsed.names = Array.isArray(parsed.names) ? parsed.names : [];
      setResult(parsed);
      track("shield_completed"); // anonymous count only, no answers sent
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  function buildSummary() {
    if (!result) return "";
    let t = "MY SHIELD BRAND, from The Branding Whisperer\n\n";
    if (result.why) t += `Why this works for me:\n${result.why}\n\n`;
    if (result.names.length) {
      t += "NAME DIRECTIONS:\n";
      result.names.forEach((n, i) => { t += `${i + 1}. ${n.name}${n.why ? `, ${n.why}` : ""}\n`; });
      t += "\n";
    }
    if (result.stand) t += `What it stands for:\n${result.stand}\n\n`;
    if (result.voice) t += `How it speaks:\n${result.voice}\n\n`;
    if (result.sample) t += `A post in its voice:\n"${result.sample}"\n\n`;
    if (result.shows) t += `What it shows instead of my face:\n${result.shows}\n\n`;
    if (result.today) t += `One small thing to do today:\n${result.today}`;
    return t.trim();
  }

  async function copyAll() {
    try { await navigator.clipboard.writeText(buildSummary()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (_) { setCopied(false); }
  }

  function restart() {
    setStep(-1); setAnswers({}); setDraft(""); baseRef.current = "";
    setResult(null); setError(null); setReveal(0);
  }

  const cards = result ? [
    { label: "Why this works for you", body: result.why, hero: true },
    { label: "Three names you could stand behind", names: result.names },
    { label: "What your brand stands for", body: result.stand },
    { label: "How it speaks, so you don't have to", body: result.voice, sample: result.sample },
    { label: "What it shows instead of your face", body: result.shows },
    { label: "One small thing to do today", body: result.today },
  ].filter((c) => c.body || (c.names && c.names.length)) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: "'Georgia', serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes pulse { 0%,100% { opacity:.35;} 50% { opacity:1;} }
        @keyframes ring { 0% { box-shadow:0 0 0 0 rgba(20,128,94,.45);} 70% { box-shadow:0 0 0 16px rgba(20,128,94,0);} 100% { box-shadow:0 0 0 0 rgba(20,128,94,0);} }
        .mw-fade { animation: fadeUp .5s ease both; }
        .mw-area::placeholder { color:#B9AFA2; font-style:italic; }
        .mw-btn:hover { transform: translateY(-1px); filter: brightness(1.05);}
        .mw-btn:active { transform: translateY(0);}
        .mw-ghost:hover { color:${ACCENT};}
        .mw-mic-live { animation: ring 1.6s infinite;}
      `}</style>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, flexWrap: "wrap" }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
          <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
            The Shield Whisper
          </span>
          <a href="#/" style={{ marginLeft: "auto", fontFamily: "'Helvetica Neue', sans-serif", fontSize: 14, color: "#9A8F82", textDecoration: "none" }}>
            ← back to The Branding Whisperer
          </a>
        </div>

        {/* INTRO */}
        {step === -1 && (
          <div className="mw-fade">
            <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "0 0 18px", fontWeight: 400 }}>
              Build a brand<br />
              <span style={{ color: ACCENT }}>you can hide behind.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#5C534B", maxWidth: 520, margin: "0 0 18px" }}>
              You love the work. It's the promoting-yourself part that feels like performing.
              So let's build a brand that stands in front of you: it does the talking, it says
              the proud things you never would, and your face stays optional. Forever.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#857B70", maxWidth: 520, margin: "0 0 34px", fontStyle: "italic" }}>
              Five questions. Then the brand exists, and posting stops being about you.
            </p>
            <button className="mw-btn" onClick={() => { track("shield_started"); setStep(0); }} style={primaryBtn}>Start (takes 3 minutes)</button>
            <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 18, fontFamily: "'Helvetica Neue', sans-serif" }}>
              No account. Nothing you type is saved. One question at a time, I promise.
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
            <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, margin: "0 0 14px" }}>
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h2 style={{ fontSize: 30, lineHeight: 1.2, margin: "0 0 10px", fontWeight: 400 }}>{q.label}</h2>
            <p style={{ fontSize: 16, color: "#857B70", margin: "0 0 22px", fontFamily: "'Helvetica Neue', sans-serif" }}>{q.help}</p>
            <textarea
              ref={inputRef} className="mw-area" value={draft}
              onChange={(e) => { setDraft(e.target.value); baseRef.current = e.target.value; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(); } }}
              placeholder={q.placeholder} rows={3}
              style={{ width: "100%", fontSize: 19, fontFamily: "'Georgia', serif", color: INK, padding: "18px 20px", borderRadius: 14, border: "2px solid #E5DDD1", background: "#FFF", resize: "none", outline: "none", lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <button className="mw-btn" onClick={next} disabled={!draft.trim()} style={{ ...primaryBtn, opacity: draft.trim() ? 1 : 0.4, cursor: draft.trim() ? "pointer" : "not-allowed" }}>
                {step + 1 >= QUESTIONS.length ? "Build my shield" : "Next"}
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: "'Helvetica Neue', sans-serif", fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
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
            <p style={{ fontSize: 22, color: "#5C534B" }}>Building somewhere for you to stand…</p>
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

        {/* RESULT — cards revealed one at a time */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Your shield, one piece at a time</p>
            <div style={{ marginTop: 8 }}>
              {cards.slice(0, reveal + 1).map((c, i) => (
                <div key={i} className="mw-fade" style={c.hero ? heroCard : plainCard}>
                  <p style={{ ...miniLabel, marginBottom: 8 }}>{c.label}</p>
                  {c.body && <p style={{ fontSize: c.hero ? 23 : 19, lineHeight: 1.4, margin: 0, color: INK }}>{c.body}</p>}
                  {c.names && c.names.map((n, j) => (
                    <div key={j} style={{ marginTop: j === 0 ? 4 : 14 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{n.name}</p>
                      {n.why && <p style={{ fontSize: 15, lineHeight: 1.5, color: "#857B70", margin: "4px 0 0", fontFamily: "'Helvetica Neue', sans-serif" }}>{n.why}</p>}
                    </div>
                  ))}
                  {c.sample && (
                    <p style={{ fontSize: 18, lineHeight: 1.5, margin: "14px 0 0", fontStyle: "italic", color: ACCENT }}>
                      “{c.sample}”
                    </p>
                  )}
                </div>
              ))}
            </div>

            {reveal < cards.length - 1 ? (
              <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 26 }}>
                Show me the next piece
              </button>
            ) : (
              <div className="mw-fade" style={{ marginTop: 30 }}>
                <div style={todayBox}>
                  <p style={{ fontSize: 20, lineHeight: 1.45, color: "#FFF", margin: 0 }}>
                    That's your shield. From now on, the brand does the talking. You just keep making the thing you love.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                  <button className="mw-btn" onClick={copyAll} style={primaryBtn}>
                    {copied ? "Copied ✓" : "Copy everything"}
                  </button>
                  <button className="mw-btn" onClick={restart} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}` }}>
                    Start over
                  </button>
                </div>
                <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 18, fontFamily: "'Helvetica Neue', sans-serif" }}>
                  Nothing is saved here, so copy it somewhere safe.
                </p>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer style={{ marginTop: 80, paddingTop: 28, borderTop: "1px solid #E5DDD1" }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#857B70", margin: "0 0 16px", fontFamily: "'Helvetica Neue', sans-serif" }}>
            This tool exists purely to help you. Nothing you type here is saved, and I never see it.
            Want the six-question original? It's at{" "}
            <a href="#/" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>The Branding Whisperer</a>.
          </p>
          <p style={{ fontSize: 18, fontStyle: "italic", color: INK, margin: 0 }}>
            — <span style={{ color: ACCENT }}>S. Afrin</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

function MicIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

const primaryBtn = { background: ACCENT, color: "#FFF", border: "none", borderRadius: 100, padding: "16px 32px", fontSize: 17, fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 600, cursor: "pointer", transition: "all .18s ease" };
const ghostBtn = { background: "none", border: "none", color: "#9A8F82", fontSize: 16, cursor: "pointer", fontFamily: "'Helvetica Neue', sans-serif", transition: "color .18s", marginLeft: "auto" };
const miniLabel = { fontFamily: "'Helvetica Neue', sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, margin: "0 0 10px" };
const plainCard = { background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "22px 24px", marginBottom: 16 };
const heroCard = { background: "#FFF", border: "1px solid #EFE7DA", borderLeft: `4px solid ${ACCENT}`, borderRadius: 14, padding: "26px 26px", marginBottom: 16 };
const todayBox = { background: ACCENT, borderRadius: 18, padding: "28px 30px", marginTop: 6 };
