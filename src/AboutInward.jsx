import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, BUTTER,
  SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, ToolsMenu, PageQuote, BuddyForm, primaryBtn, TOOLS,
} from "./lib/whisperKit.jsx";

// ── The portrait: shows Afrin's real photo the moment /media/afrin-portrait.jpg
//    exists; until then, an on-brand monogram stands in (never a stock face). ──
function Portrait() {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #0B3B34 0%, #0F7C6C 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(11,59,52,.28)" }}>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 96, color: "rgba(247,208,107,.92)" }}>SA</span>
      {ok && (
        <img src="/media/afrin-portrait.jpg" alt="S. Afrin" onError={() => setOk(false)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );
}

export default function AboutInward() {
  const three = ["scan", "voice", "plan"].map((k) => TOOLS[k]);
  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      {/* ── HERO: portrait + point of view ── */}
      <section style={{ background: INK_TEAL }}>
        <div className="mw-fade" style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px 60px" }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 44 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>Branding Inward</span>
          </a>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 40, alignItems: "center" }} className="mw-about-grid">
            <Portrait />
            <div>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: BUTTER, fontWeight: 600, margin: "0 0 14px" }}>About the strategist</p>
              <h1 style={{ fontSize: "clamp(30px, 4.6vw, 46px)", lineHeight: 1.12, margin: "0 0 18px", fontWeight: 350, color: CREAM }}>
                Digital media is a channel.<br /><span style={{ fontStyle: "italic", color: BUTTER }}>Not a destination.</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(251,247,240,.85)", margin: 0 }}>
                I'm Afrin. I build these tools, and this is why they work the way they do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE STORY ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 8px" }}>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: "#3D3630" }}>
          I've spent more than a decade in brand work, at agencies and with clients, learning what
          actually makes people remember a brand. I learned most of it before social media existed,
          and all of it before AI did. The fundamentals never depended on either.
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: "#3D3630" }}>
          A platform is just a place to put the work. It is not the brand, and it is not the point.
          So I built these tools around the part that lasts: who you are, how you sound, what you
          stand for. The AI helps you express it, never the other way around.
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: "#3D3630" }}>
          I built these because the loud, perform-every-day version of marketing never fit me, and I
          watched it not fit a lot of talented people who then went quiet. As I get better at this, I
          want to keep making tools like it for people who never came from marketing.
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: 0, color: INK, fontWeight: 500 }}>
          All of it free, so it works for everyone, not just people with a marketing budget.
        </p>
        <p style={{ fontSize: 18, fontStyle: "italic", color: ACCENT, margin: "26px 0 0" }}>
          &mdash; S. Afrin
        </p>
      </div>

      {/* ── SAY HI ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 0" }}>
        <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "26px 28px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
          <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 10px" }}>Say hi</p>
          <p style={{ fontSize: 17, lineHeight: 1.6, margin: "0 0 6px", color: INK }}>
            Got a thought, or a tool broke, or you just want to say hi? I'm at{" "}
            <a href="mailto:thecuriousafrin@gmail.com?subject=Branding%20Inward" onClick={() => track("about_email")} style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>thecuriousafrin@gmail.com</a>, or on{" "}
            <a href="https://www.linkedin.com/in/sabihaafrin" target="_blank" rel="noopener noreferrer" onClick={() => track("about_linkedin")} style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>LinkedIn</a>.
          </p>
        </div>
      </div>

      {/* ── START WITH A TOOL ── */}
      <section style={{ maxWidth: 920, margin: "56px auto 0", padding: "0 24px" }}>
        <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 4px" }}>Start where you're stuck</p>
        <p style={{ fontSize: 16, color: "#857B70", margin: "0 0 18px", fontFamily: SANS }}>All free, private by default, one small step at a time.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {three.map((t) => (
            <a key={t.key} href={t.href} className="mw-card-hover" style={{ display: "block", textDecoration: "none", color: INK, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 24px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
              <t.Doodle color={t.accent} />
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: t.accent === BUTTER ? "#854F0B" : t.accent, fontWeight: 700, margin: "12px 0 6px" }}>{t.name}</p>
              <p style={{ fontSize: 18, lineHeight: 1.4, fontStyle: "italic", margin: "0 0 12px" }}>&ldquo;{t.pain}&rdquo;</p>
              <span style={{ color: ACCENT, fontWeight: 600, fontFamily: SANS, fontSize: 15 }}>{t.cta} &rarr;</span>
            </a>
          ))}
        </div>
      </section>

      {/* The community: matchmaking, through me */}
      <BuddyForm />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
        <PageQuote id="about" />
      </div>

      {/* FOOTER */}
      <footer style={{ background: INK_TEAL, marginTop: 40 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 24px" }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>Branding Inward</span>
          </a>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(251,247,240,.6)", margin: 0, fontFamily: SANS }}>
            Free tools, saved only on your device. Photos and film from Pexels artists, with thanks.
          </p>
        </div>
      </footer>
    </div>
  );
}
