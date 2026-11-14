import React from "react";
import {
  ACCENT, ACCENT_TINT, INK, CREAM, SERIF, SANS, GLOBAL_CSS,
  SiteNav, SiteFooter,
} from "./lib/whisperKit.jsx";

// ── /gathering: the in-person community event page. The Oct 10, 2026
//    AI Week NY gathering happened; this is now its recap, and the page
//    stays the home of whatever gathering comes next. ──

const FLOW = [
  { t: "3:15 PM", d: "Doors opened. Chai, a few hellos, no icebreakers." },
  { t: "3:40 PM", d: "The workshop: what a personal brand actually is, why it matters now that AI shapes how people find you, and how to show up online without pretending to be someone else. Everyone tried a few AI tools, including Inward AI." },
  { t: "4:15 PM", d: "The panel: candid stories from accomplished people who once cringed at the idea of a personal brand. What felt awkward, what worked, and what they wish someone had told them on day one." },
  { t: "5:15 PM", d: "Curious conversations, with cookies, among people who get it." },
  { t: "6:00 PM", d: "Wrap. People left with a brand statement that sounded like them, a plan for what's next, and a few new hype buddies." },
];

export default function Gathering() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>

      <SiteNav tone="light" />
      <main style={{ flex: 1, maxWidth: 720, margin: "0 auto", padding: "64px 24px 40px", width: "100%", boxSizing: "border-box" }}>
        <p style={{ margin: "0 0 14px", fontFamily: SANS, fontSize: 12.5, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 700 }}>
          Community gathering {"·"} #AIWeekNY
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 46px)", lineHeight: 1.12, margin: "0 0 16px", fontWeight: 700, letterSpacing: "-0.015em", fontFamily: SANS }}>
          Branding without performing, live in New York.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: "#4A4A4A", margin: "0 0 26px", fontFamily: SANS }}>
          On October 10, during NYC AI Week, we gathered the quiet ones: a hands-on workshop,
          a candid panel, chai, cookies, and conversations with people who get it. This page
          is where the next one will be announced.
        </p>

        <div style={{ background: ACCENT_TINT, border: "1px solid #E6E6E6", borderRadius: 14, padding: "20px 22px", margin: "0 0 28px", fontFamily: SANS }}>
          <p style={{ margin: "0 0 4px", fontSize: 16.5, fontWeight: 700 }}>This one happened: Saturday, October 10, 2026</p>
          <p style={{ margin: "0 0 16px", fontSize: 15, color: "#4A4A4A" }}>
            Thank you to everyone who came. Want to be in the room next time?
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="https://www.linkedin.com/company/branding-inward/" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", background: "#0A0A0A", color: "#FFF", borderRadius: 100, padding: "12px 24px", fontFamily: SANS, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Follow Branding Inward
            </a>
            <a href="mailto:letstalk@brandinginward.com?subject=Tell%20me%20about%20the%20next%20gathering"
              style={{ display: "inline-block", background: "#FFF", color: INK, border: "1px solid #E6E6E6", borderRadius: 100, padding: "12px 24px", fontFamily: SANS, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Email me about the next one
            </a>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 14px", fontFamily: SANS, letterSpacing: "-0.01em" }}>How the afternoon went</h2>
        <div style={{ margin: "0 0 30px" }}>
          {FLOW.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderTop: i ? "1px solid #F0F0F0" : "none", fontFamily: SANS }}>
              <span style={{ flexShrink: 0, width: 72, fontSize: 13.5, fontWeight: 700, color: ACCENT, paddingTop: 2 }}>{f.t}</span>
              <span style={{ fontSize: 15.5, lineHeight: 1.6, color: "#333333" }}>{f.d}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", fontFamily: SANS, letterSpacing: "-0.01em" }}>Who hosted</h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4A4A4A", margin: "0 0 12px", fontFamily: SANS }}>
          Sabiha Afrin, Director of Marketing and Advertising and the strategist behind
          Branding Inward, has spent years helping people figure out how to talk about
          themselves. In her experience, the people with the most to say are often the
          quietest about it.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4A4A4A", margin: "0 0 30px", fontFamily: SANS }}>
          Jack McNamara, an award-winning creative director, shared how great creative work
          gets made and what it teaches us about telling our own story, alongside panelists
          from media, entertainment, and branding.
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: "#767676", margin: "0 0 24px", fontFamily: SANS }}>
          The gathering was part of #AIWeekNY by Pulse NYC, a community-led festival
          celebrating the AI ecosystem. The next one gets announced here, on the
          Branding Inward LinkedIn page, and nowhere louder.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
