import React from "react";

// ── The product design system for the suite-era homepage. Deliberately
//    separate from whisperKit's editorial tokens so the inner tool pages
//    keep working untouched while the landing page moves to the new look.
//    Language: near-white ground, one teal accent, black pill CTAs, thin
//    borders, Inter everywhere, and coded UI mockups instead of prose. ──

export const S = {
  BG: "#FFFFFF",
  CARD: "#FFFFFF",
  BORDER: "#E6E6E6",
  INK: "#0A0A0A",
  MUTED: "#5C5C5C",
  FAINT: "#969696",
  TEAL: "#0F7C77",
  TEAL_TINT: "#EDF5F4",
  BAR: "#EEEEEE", // skeleton placeholder bars
  SANS: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  MONO: "'SF Mono', ui-monospace, 'Menlo', monospace",
};

export const blackPill = {
  background: "#0A0A0A",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 100,
  padding: "13px 26px",
  fontFamily: S.SANS,
  fontSize: 15.5,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  whiteSpace: "nowrap",
};

export const sectionLabel = {
  fontFamily: S.SANS,
  fontSize: 12.5,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: S.MUTED,
  fontWeight: 600,
  margin: "0 0 14px",
};

export const cardStyle = {
  background: S.CARD,
  border: `1px solid ${S.BORDER}`,
  borderRadius: 16,
};

// ── Small line icons, one per tool. Teal stroke, no fills, 24px grid. ──
const ic = (children, size) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={S.TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const Icons = {
  questions: (size = 22) => ic(<><path d="M4 5h16v11H9l-5 4z" /><path d="M9.5 9h5M9.5 12h3" /></>, size),
  photo: (size = 22) => ic(<><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7l1.5-3h4l1.5 3" /><circle cx="12" cy="13.5" r="3.4" /></>, size),
  scan: (size = 22) => ic(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="1.4" fill={S.TEAL} /><path d="M12 3.5v4M20.5 12h-4" /></>, size),
  voice: (size = 22) => ic(<><path d="M4 12h2M8 8v8M12 5v14M16 9v6M20 11v2" /></>, size),
  roast: (size = 22) => ic(<><path d="M12 3c2 3.5 6 5 6 10a6 6 0 0 1-12 0c0-5 4-6.5 6-10z" /><path d="M12 12c1 1.4 2 2 2 3.8a2 2 0 0 1-4 0c0-1.8 1-2.4 2-3.8z" /></>, size),
  visibility: (size = 22) => ic(<><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>, size),
  linkedin: (size = 22) => ic(<><path d="M20 4c-6 1-11 5-13 11l-2 5 5-2c6-2 10-7 11-13z" /><path d="M7 15c2.5-3.5 5.5-6 9-8" /></>, size),
  brief: (size = 22) => ic(<><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h3.5" /></>, size),
};

// ── Skeleton placeholder bar, the grey line that says "document". ──
export function Bar({ w = "100%", h = 9, mb = 8, tint = false }) {
  return <div style={{ width: w, height: h, borderRadius: 5, background: tint ? S.TEAL_TINT : S.BAR, marginBottom: mb }} />;
}

// ── A dossier document mockup: labeled sections of skeleton bars. ──
export function SkeletonDoc({ title, badge, sections }) {
  return (
    <div style={{ ...cardStyle, padding: "22px 24px", boxShadow: "0 14px 40px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: S.SANS, fontSize: 14.5, fontWeight: 600, color: S.INK }}>{title}</span>
        {badge && <span style={{ fontFamily: S.SANS, fontSize: 11.5, color: S.MUTED, background: S.BG, border: `1px solid ${S.BORDER}`, borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap" }}>{badge}</span>}
      </div>
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: i === sections.length - 1 ? 0 : 16 }}>
          <p style={{ fontFamily: S.SANS, fontSize: 12.5, fontWeight: 600, color: S.INK, margin: "0 0 8px" }}>{sec}</p>
          <Bar w="92%" /><Bar w="70%" /><Bar w="83%" mb={0} />
        </div>
      ))}
    </div>
  );
}

// ── A mono file chip, the "brand-voice.md" artifact. ──
export function FileChip({ name }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: S.MONO, fontSize: 12.5, color: S.INK, background: S.BG, border: `1px solid ${S.BORDER}`, borderRadius: 8, padding: "6px 11px" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.MUTED} strokeWidth="2" aria-hidden="true"><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /></svg>
      {name}
    </span>
  );
}

// ── An editable-caption panel mockup: what Photo to Posts hands back. ──
export function CaptionMock() {
  return (
    <div style={{ ...cardStyle, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: S.SANS, fontSize: 12.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: S.MUTED }}>LinkedIn, it teaches</span>
        <span style={{ fontFamily: S.SANS, fontSize: 11.5, color: S.FAINT }}>Tweak it right here</span>
      </div>
      <div style={{ background: S.BG, border: `1px solid ${S.BORDER}`, borderRadius: 10, padding: "13px 14px", marginBottom: 12 }}>
        <Bar w="88%" h={8} /><Bar w="97%" h={8} /><Bar w="60%" h={8} /><Bar w="0%" h={4} mb={4} /><Bar w="78%" h={8} /><Bar w="41%" h={8} mb={0} />
      </div>
      <span style={{ fontFamily: S.SANS, fontSize: 13, fontWeight: 600, color: S.TEAL, border: `1.5px solid ${S.TEAL}`, borderRadius: 100, padding: "7px 16px", display: "inline-block" }}>Copy this caption</span>
    </div>
  );
}

// ── A visibility-scan result mockup: dial, band, receipt lines. ──
export function ScoreDialMock() {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div style={{ ...cardStyle, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke={S.BAR} strokeWidth="7" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={S.TEAL} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${0.57 * c} ${c}`} transform="rotate(-90 32 32)" />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.SANS, fontSize: 17, fontWeight: 700, color: S.INK, fontVariantNumeric: "tabular-nums" }}>57</span>
        </div>
        <div>
          <p style={{ fontFamily: S.SANS, fontSize: 14.5, fontWeight: 600, color: S.INK, margin: "0 0 3px" }}>Coming into view</p>
          <p style={{ fontFamily: S.SANS, fontSize: 12.5, color: S.MUTED, margin: 0 }}>Scored from a live scan, receipts shown</p>
        </div>
      </div>
      <p style={{ fontFamily: S.SANS, fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: S.MUTED, margin: "0 0 8px" }}>Here's where you show up</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
        <span style={{ color: S.TEAL, fontWeight: 700, fontSize: 13, lineHeight: "13px" }}>·</span><Bar w="86%" h={8} mb={0} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 7 }}>
        <span style={{ color: S.TEAL, fontWeight: 700, fontSize: 13, lineHeight: "13px" }}>·</span><Bar w="71%" h={8} mb={0} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ color: S.TEAL, fontWeight: 700, fontSize: 13, lineHeight: "13px" }}>·</span><Bar w="79%" h={8} mb={0} />
      </div>
    </div>
  );
}
