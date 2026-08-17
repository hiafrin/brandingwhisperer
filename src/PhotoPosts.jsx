import React, { useState, useRef } from "react";
import { track } from "@vercel/analytics";
import { ph } from "./lib/metrics.js";
import {
  ACCENT, INK, CREAM, INK_TEAL, BUTTER,
  SERIF, SANS, GLOBAL_CSS, PSYCH_LIBRARY,
  parseWhisperResponse, recall, remember, fileToCanvas,
  StepLoader,
  GrainOverlay, PageQuote, ToolHero, ToolIntro, FrameworkStrip, ToolsMenu, SiteFooter,
  primaryBtn, ghostBtn, miniLabel, plainCard,
} from "./lib/whisperKit.jsx";

// A small hand-drawn camera, because this page starts from one real photo.
function DoodleCamera({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="24" height="16" rx="3" stroke={ACCENT} strokeWidth="2" fill="none" />
      <path d="M12 10 L14 6 H18 L20 10" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <circle cx="16" cy="18" r="5" stroke={ACCENT} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

// ── /photo-to-posts: the boss-validated tool, standing on its own. Upload one
//    real photo; the AI looks at it and writes three posts in their voice,
//    each caption editable in place before copying. ──
export default function PhotoPosts() {
  const [about, setAbout] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState(null);
  const [postResult, setPostResult] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [postCopied, setPostCopied] = useState(-1);
  const fileRef = useRef(null);

  async function onPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = ""; // let them re-pick the same file later
    if (!file) return;
    setPhotoErr(null); setPostResult(null); setPhotoBusy(true);
    try {
      const canvas = await fileToCanvas(file);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      setPhotoPreview(dataUrl);
      await makePosts(dataUrl.split(",")[1]);
    } catch (err) {
      setPhotoBusy(false);
      setPhotoErr(
        err && err.message === "video"
          ? "I couldn't read a frame from that video. Try a photo, or a screenshot of the best moment."
          : "I couldn't read that file. A JPG or PNG photo works best."
      );
    }
  }

  async function makePosts(base64) {
    setPhotoBusy(true); setPhotoErr(null);
    const memWord = recall("word");
    const memVoice = recall("voice");
    const memAbout = recall("reallyabout");

    const sys = `You help a shy maker turn ONE real photo of their own work into posts they could actually publish, written in their own voice. You can SEE the photo. Ground everything in what is genuinely in it. Never invent details that are not there, and if you are unsure what something is, describe it plainly instead of guessing a brand, a price, or a story that might be false.

${PSYCH_LIBRARY}

Use the library invisibly, no terms and no researcher names, and "researchers found" at most once in the whole response. If they told you about themselves, their words are a voice sample: match how they actually talk, their sentence length, their plainness. Never add hype, fake urgency, sales pressure, exclamation-point energy, or a pile of hashtags unless their own words already sound like that. The photo does the talking. The caption just points at it, gently.

Write exactly 3 posts, each a different angle:
1. The small true story: the honest, specific moment behind what's in the photo.
2. The quiet one: barely a caption, a line or two, letting the photo carry it.
3. The soft invite: a low-pressure way for someone to buy, follow, or reach out, never pushy.

VOICE: plain, warm, short sentences, the way a real person texts. Do not use em-dashes or en-dashes, use commas and periods. NEVER assume gender: use "they" and "them" for anyone. NEVER use double quote marks inside a field's text, use single quotes there instead.

Return ONLY valid JSON, no markdown, no preamble, compact, every key exactly "name": with a colon:
{
  "seen": "one honest plain sentence describing what is actually in the photo",
  "posts": [
    { "where": "where this fits, like 'Instagram' or 'LinkedIn' or 'your shop listing'", "caption": "the caption in their voice", "why": "one plain sentence on why this one works" }
  ]
}`;

    const usr = `Here is a photo of my work.${about.trim() ? `\nWhat I make or do, in my words: ${about.trim().slice(0, 200)}` : ""}${memAbout ? `\nWhat I'm really about: ${memAbout}` : ""}${memWord ? `\nThe one word I want to own: ${memWord}` : ""}${memVoice ? `\nMy brand voice is called: ${memVoice}` : ""}

Look at the photo and write 3 posts around it, in my voice.`;

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, user: usr, image: { data: base64, media_type: "image/jpeg" } }),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const data = await r.json();
      const parsed = parseWhisperResponse(data);
      if (!parsed || !Array.isArray(parsed.posts) || !parsed.posts.length) throw new Error("cut short");
      setPostResult(parsed);
      setDrafts(parsed.posts.map((p) => p.caption || ""));
      // Marks the tool done on this device, and gives the Brief a line.
      remember("photoposts", (parsed.posts[0] && parsed.posts[0].caption) || "Made posts from a photo");
      ph("step_completed", { step: "photo" });
      track("posts_from_photo");
    } catch (_) {
      setPhotoErr("Something went wrong reading the photo. Give it another try.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function copyCaption(i) {
    try { await navigator.clipboard.writeText(drafts[i] || ""); setPostCopied(i); setTimeout(() => setPostCopied(-1), 2000); }
    catch (_) { setPostCopied(-1); }
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      <ToolHero
        label="Photo to posts"
        photo="/media/plan-hands.jpg"
        accent={ACCENT}
        Doodle={DoodleCamera}
        headline={<>One photo of your work.<br /><span style={{ fontStyle: "italic", color: "#F7D06B" }}>Three posts, ready to go.</span></>}
        sub="Upload a shot of what you made, your workspace, a whiteboard you filled, your hands mid-process. The AI looks at it and writes three posts around it, in your voice. No face required."
      />

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px 8px" }}>
        <ToolIntro
          stepKey="photo"
          walkaway="Three posts built from one real photo, each one editable right here before you copy it."
          time="Under two minutes"
          madeFor="anyone who never knows what to say about their own work."
        />

        <div style={{ border: `2px solid ${ACCENT}`, borderRadius: 18, padding: "26px 26px", background: "#FFF" }}>
          <input aria-label="What do you make or do (optional)" value={about} onChange={(e) => setAbout(e.target.value)}
            placeholder="Optional: what do you make or do? Helps the voice."
            style={{ width: "100%", boxSizing: "border-box", fontFamily: SANS, fontSize: 15.5, padding: "12px 14px", borderRadius: 10, border: "1px solid #E5DDD1", background: CREAM, color: INK, outline: "none", marginBottom: 14 }} />
          <input aria-label="Choose a photo or short clip" ref={fileRef} type="file" accept="image/*,video/*" onChange={onPhoto} style={{ display: "none" }} />
          {photoPreview && (
            <div style={{ borderRadius: 14, overflow: "hidden", margin: "0 0 14px", border: "1px solid #EFE7DA" }}>
              <img src={photoPreview} alt="The photo you uploaded" style={{ width: "100%", display: "block" }} />
            </div>
          )}
          {!photoBusy && (
            <button className="mw-btn" onClick={() => { track("photo_pick"); ph("step_started", { step: "photo" }); fileRef.current?.click(); }} style={{ ...primaryBtn, fontSize: 17, padding: "15px 28px" }}>
              {photoPreview ? "Choose a different photo" : "Choose a photo"}
            </button>
          )}
          {photoBusy && (
            <StepLoader steps={["Looking at your photo", "Finding the story in it", "Writing three posts in your voice"]} />
          )}
          {photoErr && !photoBusy && (
            <p style={{ fontSize: 15, color: "#B4552D", fontFamily: SANS, margin: "14px 0 0", lineHeight: 1.55 }}>{photoErr}</p>
          )}
          {!photoBusy && !postResult && (
            <p style={{ fontSize: 13.5, color: "#857B70", fontFamily: SANS, margin: "12px 0 0", lineHeight: 1.6 }}>
              The photo is read once and never stored. Nothing you upload leaves the one request.
            </p>
          )}

          {postResult && !photoBusy && (
            <div className="mw-fade" style={{ marginTop: 22 }}>
              {postResult.seen && (
                <p style={{ fontSize: 15, fontStyle: "italic", color: "#6B6157", margin: "0 0 18px", fontFamily: SANS, lineHeight: 1.55 }}>
                  Here's what I see: {postResult.seen}
                </p>
              )}
              {postResult.posts.map((p, i) => (
                <div key={i} className="mw-deal" style={{ ...plainCard, boxShadow: "none" }}>
                  {p.where && <p style={{ ...miniLabel, marginBottom: 4 }}>{p.where}</p>}
                  <p style={{ fontSize: 12.5, color: "#9A8F82", fontFamily: SANS, margin: "0 0 8px" }}>Tweak it right here, then copy.</p>
                  <textarea value={drafts[i] || ""} onChange={(e) => setDrafts((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                    rows={Math.max(3, Math.ceil((drafts[i] || "").length / 55))}
                    style={{ width: "100%", boxSizing: "border-box", fontFamily: SERIF, fontSize: 18, lineHeight: 1.55, color: INK, background: CREAM, border: "1px solid #EFE7DA", borderRadius: 10, padding: "12px 14px", margin: "0 0 10px", resize: "vertical", outline: "none" }} />
                  {p.why && <p style={{ fontSize: 13, color: "#857B70", fontStyle: "italic", fontFamily: SANS, margin: "0 0 12px", lineHeight: 1.5 }}>{p.why}</p>}
                  <button className="mw-btn" onClick={() => copyCaption(i)} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}`, boxShadow: "none", padding: "9px 18px", fontSize: 14 }}>
                    {postCopied === i ? "Copied ✓" : "Copy this caption"}
                  </button>
                </div>
              ))}
              <button className="mw-ghost" onClick={() => { setPostResult(null); setDrafts([]); setPhotoPreview(null); }} style={{ ...ghostBtn, marginTop: 6 }}>
                Try another photo
              </button>
            </div>
          )}
        </div>
      </div>

      <FrameworkStrip current="photo" />
      <PageQuote id="plan" />
      <SiteFooter />
    </div>
  );
}
