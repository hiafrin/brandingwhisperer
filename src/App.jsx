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
    let t = "MY BRAND — from The Branding Whisperer\n\n";
    if (result.pain) t += `The real reason they'd choose me:\n${result.pain}\n\n`;
    if (result.reframe) t += `What I'm really about:\n${result.reframe}\n\n`;
    if (result.edge) t += `What makes me un-copyable:\n${result.edge}\n\n`;
    if (result.personality) t += `My brand's personality:\n${result.personality}\n\n`;
    if (result.against) t += `What I stand against:\n${result.against}\n\n`;
    if (posts?.posts?.length) {
      t += "POST IDEAS:\n";
      posts.posts.forEach((p, i) => { t += `${i + 1}. ${p.hook}${p.idea ? ` — ${p.idea}` : ""}\n`; });
      t += "\n";
    }
    if (plan?.days?.length) {
      t += "MY 7-DAY PLAN:\n";
      plan.days.forEach((d) => { t += `Day ${d.day}: ${d.title} — ${d.action}\n`; });
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
        throw new Error(d.error || "Couldn't send it — try again, or use Copy.");
      }
      setEmailSent(true);
    } catch (e) {
      setEmailError(e.message || "Couldn't send it — try again, or use Copy.");
    } finally { setEmailSending(false); }
  }
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

    // ── CALL 1: The brand foundation. Director-level depth, said simply. ──
    const systemPrompt = `You are a seasoned brand director giving advice to a nervous person building a brand — a small business OR a personal brand (freelancer, creator, coach, someone building their name). Treat them like a friend, not a client. Notice which kind they are and speak to their real situation. Go DEEP like a real director, but say everything simply — they're intimidated by marketing.

LANGUAGE: For a product business, "selling" is fine. For a PERSONAL brand, don't say "selling" — say what they "offer," want to be "known for," or the value people come to them for.

YOUR THINKING:
1. PAIN & ASPIRATION — the ache the person they want to reach hasn't named yet, and the dream pulling them. Understand it before they've felt it. Find the real human moment.
2. THE REFRAME — what they're REALLY about, not surface features. A jolt: "oh, THAT'S what I'm really offering." Specific and surprising. This is the centerpiece.
3. WHAT'S UN-COPYABLE + the one person most drawn to them — same insight, two sides. For a personal brand it's usually their story or lived experience.
4. BRAND PERSONALITY — if this brand were a person, how do they talk and carry themselves? Give 3 vivid traits.
5. WHAT THEY STAND AGAINST — the thing in their world they push back on. Brands get sharp by having an enemy (a bad norm, a tired way of doing things).

VOICE: Direct but warm. Truth, then belief they can do it. No jargon. Short sentences.

Depth means insight, not length. No field longer than 2 sentences.

Return ONLY valid JSON, no markdown, no preamble:
{
  "pain": "the real ache + aspiration as a vivid human moment (max 2 sentences)",
  "reframe": "'you're not just doing X, you're really offering Y' — surprising and specific (max 2 sentences)",
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
      const rawText = (data.content || []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("").trim();
      if (!rawText) throw new Error("The AI came back empty. Please try again.");
      let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch (_) { parsed = salvagePartialJson(cleaned); if (!parsed) throw new Error("The AI's answer got cut short. Tap to try again — this usually works on a second pass."); }
      parsed.pain = parsed.pain || ""; parsed.reframe = parsed.reframe || ""; parsed.edge = parsed.edge || "";
      parsed.personality = parsed.personality || ""; parsed.against = parsed.against || "";
      // stash the answers so the 7-day plan call can use them
      parsed._answers = finalAnswers;
      setResult(parsed);
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

    const sys = `You are a brand director giving a nervous beginner 5 post ideas they could actually publish. Each must sound like THEM, carry THEIR point of view, and speak to THEIR people. Specific, not generic. No "share your journey" filler. For personal brands, lean on their story and take. Short. No jargon.

Their brand:
- Really about: ${result?.reframe || ""}
- Un-copyable edge: ${result?.edge || ""}
- Personality/voice: ${result?.personality || ""}
- Stands against: ${result?.against || ""}

Return ONLY valid JSON, no markdown:
{ "posts": [ { "hook": "the scroll-stopping first line (max 15 words)", "idea": "what the post is about, one sentence" } ] }
Give exactly 5. Keep it tight. (variety seed: ${seed})`;

    const usr = `Reaching: ${a.customer}. On: ${a.where}. Give me 5 post ideas I could publish this week.`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!r.ok) throw new Error(`Error (${r.status}). Try again.`);
      const data = await r.json();
      const raw = (data.content || []).filter((b) => b?.type === "text").map((b) => b.text).join("").trim();
      let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch (_) { parsed = salvagePartialJson(cleaned); }
      if (!parsed?.posts) throw new Error("Cut short — tap to try again.");
      parsed.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
      setPosts(parsed);
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

    const sys = `You are a brand director building a gentle 7-day starter plan for a nervous beginner. CORE RULE: each day is ONE focused action that takes under 30 minutes. Never overwhelm. The days build on each other — foundation first, then visibility, escalating gently. Day 1 is tiny and confidence-building. By day 7 they've made their first real public move. Speak warmly and simply, no jargon.

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
Build my gentle 7-day plan — one small action per day.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!response.ok) throw new Error(`The service returned an error (${response.status}). Please try again.`);
      const data = await response.json();
      const raw = (data.content || []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("").trim();
      if (!raw) throw new Error("Came back empty. Please try again.");
      let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const f = cleaned.indexOf("{"), l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) cleaned = cleaned.slice(f, l + 1);
      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch (_) { parsed = salvagePartialJson(cleaned); if (!parsed) throw new Error("The plan got cut short. Tap to try again."); }
      parsed.days = Array.isArray(parsed.days) ? parsed.days : [];
      setPlan(parsed);
    } catch (e) {
      setPlanError(e.message || "Something went wrong. Give it another try.");
    } finally {
      setPlanLoading(false);
    }
  }

  function restart() {
    setStep(-1); setAnswers({}); setDraft(""); baseRef.current = "";
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
            The Branding Whisperer
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

        {/* RESULT — Phase 1: foundation cards one at a time, then Phase 2: the 7-day plan */}
        {step === QUESTIONS.length && result && !loading && (
          <div className="mw-fade">

            {/* ---------- PHASE 1: FOUNDATION ---------- */}
            {phase === "foundation" && (
              <>
                <p style={miniLabel}>First — let's understand your brand</p>
                <div style={{ marginTop: 8 }}>
                  {cards.slice(0, reveal + 1).map((c, i) => (
                    <div key={i} className="mw-fade" style={c.hero ? heroCard : plainCard}>
                      <p style={{ ...miniLabel, marginBottom: 8 }}>{c.label}</p>
                      <p style={{ fontSize: c.hero ? 23 : 19, lineHeight: 1.4, margin: 0, color: INK }}>{c.body}</p>
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
                        in <strong>your</strong> voice — refill anytime.
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
                            {p.idea && <p style={{ fontSize: 15, lineHeight: 1.5, color: "#857B70", margin: 0, fontFamily: "'Helvetica Neue', sans-serif" }}>{p.idea}</p>}
                          </div>
                        ))}
                        <button className="mw-btn" onClick={generatePosts} style={{ ...primaryBtn, marginTop: 12 }}>
                          Give me 5 more ↻
                        </button>

                        {/* The ask comes only after they've received the free value */}
                        <div style={{ ...bridgeBox, marginTop: 26 }}>
                          {!emailSent ? (
                            <>
                              <p style={{ fontSize: 18, lineHeight: 1.5, margin: 0, color: INK }}>
                                These are yours, free. Want me to email you everything — your brand
                                breakdown and these ideas — plus <strong>5 fresh post ideas next week</strong>?
                              </p>
                              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                                <input
                                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                  placeholder="your@email.com"
                                  style={{ flex: 1, minWidth: 200, fontSize: 15, fontFamily: "'Georgia', serif", padding: "12px 16px", borderRadius: 100, border: "2px solid #E5DDD1", outline: "none", background: "#FFF" }}
                                  onFocus={(e) => (e.target.style.borderColor = ACCENT)} onBlur={(e) => (e.target.style.borderColor = "#E5DDD1")}
                                />
                                <button className="mw-btn" onClick={sendEmail} disabled={!email.trim() || emailSending} style={{ ...primaryBtn, padding: "12px 22px", fontSize: 15, opacity: email.trim() ? 1 : 0.4 }}>
                                  {emailSending ? "Sending…" : "Yes — email it to me"}
                                </button>
                              </div>
                              {emailError && (
                                <p style={{ fontSize: 14, color: ACCENT, marginTop: 10, fontFamily: "'Helvetica Neue', sans-serif" }}>{emailError}</p>
                              )}
                            </>
                          ) : (
                            <p style={{ fontSize: 17, color: ACCENT, margin: 0, fontFamily: "'Helvetica Neue', sans-serif" }}>
                              Sent — check your inbox ✓ Fresh ideas coming next week.
                            </p>
                          )}
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
                <p style={miniLabel}>Your 7-day plan — one small step a day</p>

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
                          {d.why && <p style={{ fontSize: 14, lineHeight: 1.5, color: "#857B70", margin: 0, fontStyle: "italic", fontFamily: "'Helvetica Neue', sans-serif" }}>{d.why}</p>}
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
                            That's your week. Don't think about day 7 yet — just do Day 1. You've got this.
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
const bridgeBox = { background: "#F7EFE4", border: "1px solid #EFE7DA", borderRadius: 14, padding: "22px 24px" };
const dayCard = { background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "20px 22px", marginBottom: 14 };
const dayBadge = { flexShrink: 0, background: "#F3E9DC", color: ACCENT, borderRadius: 100, padding: "4px 12px", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: ".04em" };
