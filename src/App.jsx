import React, { useState, useRef, useEffect } from "react";

// ── The six questions — worded to fit anyone building a brand: a business OR a personal one ──
const QUESTIONS = [
  {
    id: "business",
    label: "What are you building, in one plain sentence?",
    help: "A business, a product, or just your own name. \"I'm a freelance designer\" works too.",
    placeholder: "I make soy candles — or — I'm building my name as a career coach",
  },
  {
    id: "customer",
    label: "Picture one real person you want to reach. Who are they?",
    help: "A type of person, not \"everyone.\" The more specific, the better.",
    placeholder: "Women in their 30s into cozy self-care — or — new managers who feel out of their depth",
  },
  {
    id: "different",
    label: "Why would someone choose you over the others out there?",
    help: "Even if it feels small. Your style, your story, your point of view, made by you.",
    placeholder: "Clean small-batch candles — or — I've actually done the job I'm coaching on",
  },
  {
    id: "feeling",
    label: "When someone discovers you, what's the ONE thing you want them to feel?",
    help: "Pick a single feeling. This becomes the soul of your brand.",
    placeholder: "Calm — or — \"finally, someone who gets it\"",
  },
  {
    id: "where",
    label: "Where do the people you want to reach already spend time?",
    help: "Online or in real life. Instagram, LinkedIn, Pinterest, a niche forum, local events...",
    placeholder: "Instagram and Pinterest — or — LinkedIn and industry Slack groups",
  },
  {
    id: "goal",
    label: "What would make the next 3 months a win?",
    help: "Be honest about where you are. \"First 10 sales\" or \"500 real followers\" — both count.",
    placeholder: "My first 30 sales — or — known as a go-to voice in my niche",
  },
];

const ACCENT = "#E8633A";
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

export default function MarketingWhisperer() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(0); // how many insight cards are shown — one at a time
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseRef = useRef("");

  useEffect(() => {
    if (step >= 0 && step < QUESTIONS.length && inputRef.current) inputRef.current.focus();
  }, [step]);

  // Browser speech recognition (activates only on a hosted page, not in preview)
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

    // ── The product: Raisa's actual strategist thinking. Works for a business OR a personal brand. ──
    const systemPrompt = `You are a sharp brand strategist giving advice to a nervous person trying to build a brand — could be a small business, OR a personal brand (a freelancer, creator, coach, or someone building their name and visibility). Treat them like a friend, not a client. First, quietly notice which one this is from their answers, and speak to their actual situation. Go DEEP like a real strategist, but say each thing simply, because this person is intimidated by marketing.

IMPORTANT ON LANGUAGE: If they're a business selling a product, it's fine to talk about what they're "selling." If they're building a PERSONAL brand or visibility, do NOT say "selling" — say what they're really "offering," what they want to be "known for," or the value people will come to them for. Match their world.

YOUR THINKING, IN ORDER:
1. Start with the PAIN and the ASPIRATION — the ache the person they want to reach hasn't even named yet, and the dream pulling them. A good marketer understands that pain before the other person has felt it. Find the real human moment underneath.
2. REFRAME what they're really about. Not the surface features — what it DOES for that pain. Make them feel a jolt: "oh, THAT'S what I'm really offering" (or selling, if a product). This reframe is the centerpiece — specific and a little surprising.
3. Find what's UN-COPYABLE and the ONE person who'd be most drawn to them — these are the SAME insight from two sides. What can't be copied is exactly what makes that one specific person feel "this is for me." For a personal brand, the un-copyable thing is usually their story, perspective, or lived experience.

VOICE: Direct but warm. Tell the truth plainly, then make them believe they can do it. Like a smart friend who actually cares. No jargon, no buzzwords, no corporate tone. Short sentences.

THE CLOSE — MOST IMPORTANT: Do NOT give a big plan. Overwhelm kills brands before they start. Give ONE small thing to do TODAY (doable in under an hour), then one gentle line about what comes next. Small wins. Today first.

Depth means insight, not length. Each field should feel like it took real thought — but stay short. No field longer than 2 sentences.

Return ONLY valid JSON. No markdown, no preamble, no text outside the JSON:
{
  "pain": "the real ache + aspiration of the person they want to reach, as a vivid human moment (max 2 sentences)",
  "reframe": "'you're not just doing X, you're really offering Y' — the surprising, specific reframe (max 2 sentences)",
  "edge": "what's un-copyable AND the one person most drawn to them, as one linked insight (max 2 sentences)",
  "sample": "one short, ready-to-use line — a caption, bio line, or post opener in their voice they could use today",
  "today": "the ONE small thing to do today, under an hour, specific and encouraging (max 2 sentences)",
  "next": "one gentle line on what comes after today (1 sentence)"
}`;

    const userPrompt = `Here's what I'm building, from a few quick questions:
- What I'm building: ${finalAnswers.business}
- The person I want to reach: ${finalAnswers.customer}
- Why someone would choose me: ${finalAnswers.different}
- The one feeling I want them to have: ${finalAnswers.feeling}
- Where those people spend time: ${finalAnswers.where}
- My 3-month win: ${finalAnswers.goal}

Talk me through it like a friend. Find the pain, tell me what I'm really offering, and give me one thing to do today.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      if (!response.ok) throw new Error(`The service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const rawText = (data.content || []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("").trim();
      if (!rawText) throw new Error("The AI came back empty. Please try again.");
      let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch (_) { parsed = salvagePartialJson(cleaned); if (!parsed) throw new Error("The AI's answer got cut short. Tap to try again — this usually works on a second pass."); }
      parsed.pain = parsed.pain || ""; parsed.reframe = parsed.reframe || ""; parsed.edge = parsed.edge || "";
      parsed.sample = parsed.sample || ""; parsed.today = parsed.today || ""; parsed.next = parsed.next || "";
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep(-1); setAnswers({}); setDraft(""); baseRef.current = ""; setResult(null); setError(null); setReveal(0);
  }

  // The insight cards, revealed one at a time so it never overwhelms
  const cards = result ? [
    { label: "The real reason they'd choose you", body: result.pain },
    { label: "Here's what you're really about", body: result.reframe, hero: true },
    { label: "What makes you un-copyable", body: result.edge },
    { label: "Try posting something like this", body: result.sample, quote: true },
  ].filter((c) => c.body) : [];

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: "'Georgia', serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes pulse { 0%,100% { opacity:.35;} 50% { opacity:1;} }
        @keyframes ring { 0% { box-shadow:0 0 0 0 rgba(232,99,58,.45);} 70% { box-shadow:0 0 0 16px rgba(232,99,58,0);} 100% { box-shadow:0 0 0 0 rgba(232,99,58,0);} }
        .mw-fade { animation: fadeUp .5s ease both; }
        .mw-area::placeholder { color:#B9AFA2; font-style:italic; }
        .mw-btn:hover { transform: translateY(-1px); filter: brightness(1.05);}
        .mw-btn:active { transform: translateY(0);}
        .mw-ghost:hover { color:${ACCENT};}
        .mw-mic-live { animation: ring 1.6s infinite;}
      `}</style>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: ACCENT }} />
          <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase" }}>
            The Marketing Whisperer
          </span>
        </div>

        {/* INTRO */}
        {step === -1 && (
          <div className="mw-fade">
            <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "0 0 18px", fontWeight: 400 }}>
              Six little questions.<br />
              <span style={{ color: ACCENT }}>Then I'll tell you what you're really about.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#5C534B", maxWidth: 520, margin: "0 0 34px" }}>
              Building a business or building your own name — either way, no marketing words needed.
              Answer one question at a time, type or talk, and you'll walk away knowing the real reason
              people will choose you, and the one small thing to do today.
            </p>
            <button className="mw-btn" onClick={() => setStep(0)} style={primaryBtn}>Start — takes 3 minutes</button>
            <p style={{ fontSize: 14, color: "#9A8F82", marginTop: 18, fontFamily: "'Helvetica Neue', sans-serif" }}>
              No account. One question at a time, I promise.
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
                {step + 1 >= QUESTIONS.length ? "Show me what I'm really about" : "Next"}
              </button>
              {voiceSupported && (
                <button onClick={toggleMic} className={listening ? "mw-mic-live" : ""} style={{ display: "flex", alignItems: "center", gap: 8, background: listening ? ACCENT : "#FFF", color: listening ? "#FFF" : INK, border: `2px solid ${listening ? ACCENT : "#E5DDD1"}`, borderRadius: 100, padding: "11px 18px", cursor: "pointer", fontFamily: "'Helvetica Neue', sans-serif", fontSize: 14, fontWeight: 600, transition: "all .18s" }}>
                  <MicIcon color={listening ? "#FFF" : ACCENT} />
                  {listening ? "Listening…" : "Speak"}
                </button>
              )}
              <button className="mw-ghost" onClick={back} style={ghostBtn}>Back</button>
            </div>
            {!voiceSupported && (
              <p style={{ fontSize: 13, color: "#B9AFA2", marginTop: 14, fontFamily: "'Helvetica Neue', sans-serif" }}>
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

        {/* RESULT — revealed one card at a time, ending on the one thing to do today */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">
            <p style={miniLabel}>Okay — here's what I see</p>
            <div style={{ marginTop: 8 }}>
              {cards.slice(0, reveal + 1).map((c, i) => (
                <div key={i} className="mw-fade" style={c.hero ? heroCard : c.quote ? quoteCard : plainCard}>
                  <p style={{ ...miniLabel, marginBottom: 8 }}>{c.label}</p>
                  <p style={{ fontSize: c.hero ? 23 : 19, lineHeight: 1.4, margin: 0, fontStyle: c.quote ? "italic" : "normal", color: INK }}>
                    {c.quote ? `"${c.body}"` : c.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Reveal next card, or the final "today" close */}
            {reveal < cards.length - 1 ? (
              <button className="mw-btn" onClick={() => setReveal(reveal + 1)} style={{ ...primaryBtn, marginTop: 26 }}>
                Show me the next bit
              </button>
            ) : (
              <>
                {result.today && (
                  <div className="mw-fade" style={todayBox}>
                    <p style={{ ...miniLabel, color: "#FFF", opacity: 0.85 }}>Forget the rest. Just do this today.</p>
                    <p style={{ fontSize: 22, lineHeight: 1.4, color: "#FFF", margin: "6px 0 0" }}>{result.today}</p>
                    {result.next && (
                      <p style={{ fontSize: 15, lineHeight: 1.6, color: "#FFE9E0", margin: "18px 0 0", fontFamily: "'Helvetica Neue', sans-serif" }}>
                        When you're ready → {result.next}
                      </p>
                    )}
                  </div>
                )}
                <button className="mw-btn" onClick={restart} style={{ ...primaryBtn, marginTop: 30 }}>Start over with a new idea</button>
              </>
            )}
          </div>
        )}
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
const quoteCard = { background: "#F7EFE4", border: "1px solid #EFE7DA", borderRadius: 14, padding: "22px 24px", marginBottom: 16 };
const todayBox = { background: ACCENT, borderRadius: 18, padding: "28px 30px", marginTop: 30 };
