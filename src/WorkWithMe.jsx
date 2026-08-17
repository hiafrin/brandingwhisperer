import React from "react";
import {
  ACCENT, INK, CREAM, SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, ToolsMenu, SiteFooter,
} from "./lib/whisperKit.jsx";

// ── /work-with-me: one screen, per the final-edits spec. The mailto is the
//    entire call to action; no form, no calendar embed. ──
export default function WorkWithMe() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "96px 24px 72px", width: "100%", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", lineHeight: 1.1, margin: "0 0 26px", fontWeight: 350 }}>
          Work <span style={{ fontStyle: "italic", color: ACCENT }}>with me</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: "#443F39", margin: "0 0 18px", fontFamily: SANS }}>
          I take a small number of engagements at a time. Positioning for one person, and
          workshops for groups who need to be visible without turning into content machines.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: "#443F39", margin: 0, fontFamily: SANS }}>
          Write to me at{" "}
          <a href="mailto:safrin@brandinginward.com" style={{ color: ACCENT, fontWeight: 600, textDecoration: "none", borderBottom: `2px solid ${ACCENT}` }}>
            safrin@brandinginward.com
          </a>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
