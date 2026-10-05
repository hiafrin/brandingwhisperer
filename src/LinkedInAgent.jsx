import React, { useState } from "react";
import { track } from "@vercel/analytics";
import { ph } from "./lib/metrics.js";
import {
  ACCENT, INK, CREAM, SANS, GLOBAL_CSS,
  parseWhisperResponse, recall, remember, tightenResult, PROMPT_QUALITY,
  StepLoader, ToolHero, ToolIntro, FrameworkStrip, SiteFooter,
  primaryBtn, ghostBtn, miniLabel, plainCard,
} from "./lib/whisperKit.jsx";

// A small feather pen, because this page writes with them, not for them.
function DoodlePen({ color = ACCENT, size = 40 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4c-6 1-11 5-13 11l-2 5 5-2c6-2 10-7 11-13z" />
      <path d="M7 15c2.5-3.5 5.5-6 9-8" />
    </svg>
  );
}

// ── /linkedin-agent: the first Inward AI agent. Two jobs: write post ideas
//    from the dossier saved on this device, and check a draft with a
//    LinkedIn-specific lens. Everything runs through /api/generate. ──
export default function LinkedInAgent() {
  const [mode, setMode] = useState("ideas"); // ideas | check
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ideas, setIdeas] = useState(null);
  const [review, setReview] = useState(null);
  const [copied, setCopied] = useState(-1);

  // The dossier, read from this device. The agent is sharpest when the six
  // questions and Brand Voice have run, but it works cold too.
  const dossier = {
    about: recall("reallyabout"),
    voice: recall("voice"),
    sample: recall("voicesample"),
    word: recall("word"),
    edge: recall("edge"),
    pattern: recall("patternName"),
  };
  const dossierLines = Object.entries({
    "What I'm really about": dossier.about,
    "My voice, named": dossier.voice,
    "A post that already sounds like me": dossier.sample,
    "The one word I want to own": dossier.word,
    "What makes me un-copyable": dossier.edge,
  }).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  const hasDossier = dossierLines.length > 0;

  const CRAFT = `LINKEDIN CRAFT, non-negotiable:
- The first line is the hook and must survive alone: the feed truncates after two lines. Banned first lines: greetings, 'I'm excited', 'Thrilled to', anything that could open anyone's post.
- Short paragraphs, real line breaks (as \\n), sentences that vary in length. One idea per post.
- No engagement bait ('agree?', 'thoughts?'), no hashtag piles (2 max, only if their voice uses them), no emoji unless their words use them.
- Plain, warm, specific. If a line could sit in a different person's post, rewrite it until it can't.
- Do not use em-dashes or en-dashes anywhere, use commas and periods. Never assume anyone's gender: they and them.`;

  async function generateIdeas() {
    setBusy(true); setError(null); setIdeas(null);
    const sys = `You are the LinkedIn strategist inside Branding Inward's Inward AI suite, writing for a quiet professional who finds self-promotion draining. You write POST IDEAS they could publish this week: grounded in their dossier, in their voice, zero performance.

${CRAFT}

Each idea has a different strategic job: 1) authority (teach one thing their work proves they know), 2) a small true story, 3) an observation from their field that only they would phrase this way, 4) a quiet behind-the-scenes of the work itself, 5) a soft invite or question to the one reader who needs them.

Return ONLY valid JSON, no markdown, compact, every key exactly "name": with a colon, single quotes inside text:
{"ideas": [exactly 5, each {"hook": "the first line, feed-proof", "post": "the full short post, 40 to 120 words, with \\n between paragraphs", "why": "one sentence on the strategy at work, so they learn the move"}]}`
      + PROMPT_QUALITY;

    const usr = `My dossier, from the Inward AI tools:
${hasDossier ? dossierLines : "(no dossier on this device yet, work from the lines below alone)"}
${audience.trim() ? `\nWho I want to reach: ${audience.trim().slice(0, 160)}` : ""}${topic.trim() ? `\nSomething on my mind this week: ${topic.trim().slice(0, 200)}` : ""}

Write my 5 post ideas for this week, in my voice.`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!r.ok) throw new Error();
      const parsed = parseWhisperResponse(await r.json());
      if (!parsed || !Array.isArray(parsed.ideas) || !parsed.ideas.length) throw new Error();
      setIdeas(parsed.ideas.slice(0, 5));
      remember("linkedinidea", parsed.ideas[0].hook || "A week of post ideas");
      ph("step_completed", { step: "linkedin" });
      track("li_ideas");
    } catch (_) {
      setError("The ideas didn't come through. Give it another try in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function checkDraft() {
    if (!draft.trim()) return;
    setBusy(true); setError(null); setReview(null);
    const sys = `You are the LinkedIn editor inside Branding Inward's Inward AI suite, reading a quiet professional's draft before they post it. Lead with what to KEEP, always: confidence is what lets them hear the rest. Judge only against the craft rules and their own voice, never against some influencer template.

${CRAFT}

Return ONLY valid JSON, no markdown, compact, single quotes inside text:
{"hookRead": "one or two sentences on the first two lines: would a feed-scroller stop? Quote their opening back.",
 "keep": [2 or 3 exact lines of theirs worth keeping, quoted],
 "fixes": [2 or 3, each {"issue": "plain name of the problem", "fix": "the concrete change, specific to their words"}],
 "rewrite": "the full improved draft in THEIR voice, 40 to 150 words, \\n between paragraphs, keeping every line you told them to keep"}`
      + PROMPT_QUALITY;

    const usr = `${hasDossier ? `My dossier, for voice reference:\n${dossierLines}\n\n` : ""}My draft:
${draft.trim().slice(0, 2500)}

Read it with the LinkedIn lens and hand back the review.`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr }),
      });
      if (!r.ok) throw new Error();
      let parsed = parseWhisperResponse(await r.json());
      if (!parsed || !parsed.rewrite) throw new Error();
      parsed = await tightenResult(parsed, draft.trim(), ["hookRead", "rewrite"]);
      setReview(parsed);
      ph("step_completed", { step: "linkedin" });
      track("li_check");
    } catch (_) {
      setError("The review didn't come through. Give it another try in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text, i) {
    try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(-1), 2000); } catch (_) {}
  }

  const inputStyle = { width: "100%", boxSizing: "border-box", fontFamily: SANS, fontSize: 15.5, padding: "12px 14px", borderRadius: 10, border: "1px solid #E6E6E6", background: "#FAFAFA", color: INK, outline: "none" };
  const tabStyle = (on) => ({ background: on ? "#0A0A0A" : "#FFF", color: on ? "#FFF" : INK, border: `1px solid ${on ? "#0A0A0A" : "#E6E6E6"}`, borderRadius: 100, padding: "9px 20px", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, cursor: "pointer" });

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SANS }}>
      <style>{GLOBAL_CSS}</style>

      <ToolHero
        label="LinkedIn Agent"
        Doodle={DoodlePen}
        headline={<>Five posts you'd actually publish.<br /><span style={{ fontStyle: "italic", color: ACCENT }}>In your voice, for your audience.</span></>}
        sub="The agent reads your brand dossier, writes this week's post ideas, and checks your drafts before you press post. Nothing goes out unless you put it there."
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 8px" }}>
        <ToolIntro
          stepKey="linkedin"
          walkaway="Five feed-proof post ideas in your voice, or an honest read on a draft, keepers first."
          time="Under a minute per run"
          madeFor="anyone who opens LinkedIn to post and closes it twenty minutes later."
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button className="mw-btn" onClick={() => setMode("ideas")} style={tabStyle(mode === "ideas")}>Write my ideas</button>
          <button className="mw-btn" onClick={() => setMode("check")} style={tabStyle(mode === "check")}>Check my draft</button>
        </div>

        {!hasDossier && (
          <p style={{ fontSize: 13.5, color: "#767676", margin: "0 0 16px", lineHeight: 1.6 }}>
            No dossier on this device yet. The agent works cold, but it gets sharp after{" "}
            <a href="/foundation" style={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}>the six questions</a> and{" "}
            <a href="/brand-voice" style={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}>Brand Voice</a>.
          </p>
        )}

        {mode === "ideas" && (
          <div style={{ ...plainCard }}>
            <p style={{ ...miniLabel, marginBottom: 10 }}>Who do you want to reach? (optional)</p>
            <input aria-label="Who do you want to reach" value={audience} maxLength={160} onChange={(e) => setAudience(e.target.value)}
              placeholder="Department chairs. Or quiet consultants. Or people hiring brand strategists." style={{ ...inputStyle, marginBottom: 14 }} />
            <p style={{ ...miniLabel, marginBottom: 10 }}>Anything on your mind this week? (optional)</p>
            <input aria-label="Anything on your mind this week" value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)}
              placeholder="A project that just wrapped, a question students keep asking, a small win." style={{ ...inputStyle, marginBottom: 18 }} />
            {!busy && (
              <button className="mw-btn" onClick={generateIdeas} style={{ ...primaryBtn, background: "#0A0A0A" }}>
                Write this week's ideas
              </button>
            )}
            {busy && <StepLoader steps={["Reading your dossier", "Finding what only you would say", "Writing five posts in your voice", "Cutting anything generic"]} />}
            {error && !busy && <p style={{ fontSize: 15, color: "#B4552D", margin: "14px 0 0" }}>{error}</p>}

            {ideas && !busy && (
              <div className="mw-fade" style={{ marginTop: 24 }}>
                {ideas.map((it, i) => (
                  <div key={i} style={{ border: "1px solid #E6E6E6", borderRadius: 14, padding: "18px 20px", marginBottom: 12, background: "#FFF" }}>
                    <p style={{ fontSize: 16.5, fontWeight: 650, margin: "0 0 10px", lineHeight: 1.4 }}>{it.hook}</p>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333", margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{it.post}</p>
                    {it.why && <p style={{ fontSize: 13, color: "#767676", fontStyle: "italic", margin: "0 0 12px" }}>{it.why}</p>}
                    <button className="mw-btn" onClick={() => copyText((it.hook ? it.hook + "\n\n" : "") + (it.post || ""), i)}
                      style={{ background: "#FFF", color: ACCENT, border: `1.5px solid ${ACCENT}`, borderRadius: 100, padding: "8px 16px", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                      {copied === i ? "Copied ✓" : "Copy this post"}
                    </button>
                  </div>
                ))}
                <button className="mw-ghost" onClick={generateIdeas} style={ghostBtn}>Five more</button>
              </div>
            )}
          </div>
        )}

        {mode === "check" && (
          <div style={{ ...plainCard }}>
            <p style={{ ...miniLabel, marginBottom: 10 }}>Paste the draft you're unsure about</p>
            <textarea aria-label="Your LinkedIn draft" value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="The post you wrote and haven't published." rows={7}
              style={{ ...inputStyle, resize: "vertical", marginBottom: 18, lineHeight: 1.6 }} />
            {!busy && (
              <button className="mw-btn" onClick={checkDraft} disabled={!draft.trim()}
                style={{ ...primaryBtn, background: "#0A0A0A", opacity: draft.trim() ? 1 : 0.4, cursor: draft.trim() ? "pointer" : "not-allowed" }}>
                Read it before I post it
              </button>
            )}
            {busy && <StepLoader steps={["Reading your draft twice", "Testing the hook against the feed", "Finding the lines to keep", "Writing the sharper version"]} />}
            {error && !busy && <p style={{ fontSize: 15, color: "#B4552D", margin: "14px 0 0" }}>{error}</p>}

            {review && !busy && (
              <div className="mw-fade" style={{ marginTop: 24 }}>
                {review.hookRead && (
                  <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14, marginBottom: 18 }}>
                    <p style={{ ...miniLabel, marginBottom: 6 }}>The first two lines</p>
                    <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: "#333" }}>{review.hookRead}</p>
                  </div>
                )}
                {Array.isArray(review.keep) && review.keep.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ ...miniLabel, marginBottom: 8 }}>Keep these, they're already you</p>
                    {review.keep.map((k, i) => (
                      <p key={i} style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 6px", color: INK }}>
                        <span style={{ color: ACCENT, fontWeight: 700, marginRight: 8 }}>&#10003;</span>{k}
                      </p>
                    ))}
                  </div>
                )}
                {Array.isArray(review.fixes) && review.fixes.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ ...miniLabel, marginBottom: 8 }}>Worth a fix</p>
                    {review.fixes.map((f, i) => (
                      <p key={i} style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 8px", color: "#333" }}>
                        <span style={{ fontWeight: 650, color: INK }}>{f.issue}.</span> {f.fix}
                      </p>
                    ))}
                  </div>
                )}
                {review.rewrite && (
                  <div style={{ border: "1px solid #E6E6E6", borderRadius: 14, padding: "18px 20px", background: "#FAFAFA" }}>
                    <p style={{ ...miniLabel, marginBottom: 10 }}>The sharper version, still yours</p>
                    <p style={{ fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: "0 0 12px", color: INK }}>{review.rewrite}</p>
                    <button className="mw-btn" onClick={() => copyText(review.rewrite, 99)}
                      style={{ background: "#FFF", color: ACCENT, border: `1.5px solid ${ACCENT}`, borderRadius: 100, padding: "8px 16px", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                      {copied === 99 ? "Copied ✓" : "Copy the rewrite"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, color: "#767676", margin: "16px 0 0", lineHeight: 1.6 }}>
          Nothing posts automatically and nothing you type is stored. The agent writes, you decide.
        </p>
      </div>

      <FrameworkStrip current="linkedin" />
      <SiteFooter />
    </div>
  );
}
