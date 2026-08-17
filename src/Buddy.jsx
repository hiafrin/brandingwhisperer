import React from "react";
import {
  ACCENT, INK, CREAM, SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, SiteNav, BuddyForm, SiteFooter,
} from "./lib/whisperKit.jsx";

// ── /buddy: the roast-buddy matching page. The form itself has lived on the
//    Brief and About pages all along; this gives it a front door of its own. ──
export default function Buddy() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      <SiteNav tone="light" />
      <main style={{ flex: 1, width: "100%", boxSizing: "border-box", padding: "48px 0 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 46px)", lineHeight: 1.12, margin: "0 0 16px", fontWeight: 350 }}>
            Find a <span style={{ fontStyle: "italic", color: ACCENT }}>roast buddy.</span>
          </h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.7, color: "#443F39", margin: 0, fontFamily: SANS }}>
            The hardest part of getting feedback is asking for it. So don't ask a stranger,
            get matched with one. One other quiet person, introduced by me, to trade honest
            notes on each other's writing, swap endorsements, or just compare notes on being
            bad at announcing. No group, no community to keep up with. One person.
          </p>
        </div>
        <BuddyForm />
      </main>

      <SiteFooter />
    </div>
  );
}
