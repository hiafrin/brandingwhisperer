import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, BUTTER,
  SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, SiteNav, PageQuote, BuddyForm, SiteFooter, primaryBtn, TOOLS,
} from "./lib/whisperKit.jsx";

// ── The portrait: shows Afrin's real photo the moment /media/afrin-portrait.jpg
//    exists; until then, an on-brand monogram stands in (never a stock face). ──
function Portrait() {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #0B3B34 0%, #0F7C6C 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(11,59,52,.28)" }}>
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 96, color: "rgba(247,208,107,.92)" }}>SA</span>
      {ok && (
        <img loading="lazy" decoding="async" src="/media/afrin-portrait.jpg" alt="S. Afrin" onError={() => setOk(false)}
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

      {/* ── HERO: portrait + point of view ── */}
      <section style={{ background: INK_TEAL }}>
        <SiteNav tone="dark" />
        <div className="mw-fade" style={{ maxWidth: 920, margin: "0 auto", padding: "34px 24px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 40, alignItems: "center" }} className="mw-about-grid">
            <Portrait />
            <div>
              <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: BUTTER, fontWeight: 600, margin: "0 0 14px" }}>About the strategist</p>
              <h1 style={{ fontSize: "clamp(30px, 4.6vw, 46px)", lineHeight: 1.12, margin: "0 0 18px", fontWeight: 350, color: CREAM }}>
                Digital media is a channel.<br />
                <span style={{ fontStyle: "italic", color: BUTTER }}>Not a destination.</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(251,247,240,.85)", margin: 0 }}>
                I'm the S. Afrin at the bottom of every page, and no, no relation to the nasal spray. I'm a brand strategist, and I built these to help you start from a place that actually feels like you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE STORY ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 8px" }}>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: "#3D3630" }}>
          I've spent more than a decade in brand marketing, first at agencies and later in-house. I learned
          what makes people remember a brand long before social media became part of every job, and long
          before AI entered the conversation. Platforms change all the time. What lasts is who you are, how
          you communicate, and what people come to know you for. That's what these tools are built around.
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: "#3D3630" }}>
          A lot of people assume these are just ChatGPT prompts. They're not. I spent a long time
          researching, testing, and building the framework behind them. The questions come from the same way
          a brand strategist thinks through a problem. AI simply makes that process accessible in a few
          minutes instead of a few hours.
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, margin: "0 0 22px", color: INK, fontWeight: 500 }}>
          I made these tools because traditional marketing often rewards the loudest voices. That never felt
          natural to me, and I've met plenty of thoughtful, talented people who felt like they had to become
          someone else just to be seen. I wanted to build something that helps people communicate more
          clearly without asking them to perform. Keeping everything free was important for the same reason.
          Good guidance shouldn't depend on having a marketing budget.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.7, margin: 0, color: "#5C534B" }}>
          One more thing. I'm not a professional web developer. I just love making things, whether that's
          shaping clay, trying a new recipe, building an app, or figuring out a complex website. I'm learning
          as I go, so you'll probably come across a bug or something that feels a little off. When you do, I'd
          really appreciate you letting me know. Every piece of feedback helps me make this better.
        </p>
        <p style={{ fontSize: 18, fontStyle: "italic", color: ACCENT, margin: "26px 0 0" }}>
          &mdash; Sabiha Afrin
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

      <SiteFooter />
    </div>
  );
}
