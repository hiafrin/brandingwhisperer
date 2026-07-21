import React, { useState } from "react";
import { track } from "@vercel/analytics";
import {
  ACCENT, INK, CREAM, INK_TEAL, BUTTER,
  SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, ToolsMenu, FrameworkStrip, PageQuote, BuddyForm,
  recall, forgetAll, primaryBtn,
} from "./lib/whisperKit.jsx";

// Each brief line, the device key it reads, and the step that fills it.
const ITEMS = [
  { key: "patternName", label: "How I get stuck", step: "The Inward Scan", href: "#/scan" },
  { key: "reallyabout", label: "What I'm really about", step: "The six questions", href: "#/" },
  { key: "edge", label: "What makes me un-copyable", step: "The six questions", href: "#/" },
  { key: "voice", label: "My voice, named", step: "Your Brand Voice", href: "#/shield" },
  { key: "voicesample", label: "A post that sounds like me", step: "Your Brand Voice", href: "#/shield" },
  { key: "playbook", label: "The path I chose", step: "The Quieter Plan", href: "#/plan" },
  { key: "firstmove", label: "My first move", step: "The Quieter Plan", href: "#/plan" },
];

export default function InwardBrief() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  const data = ITEMS.map((it) => ({ ...it, value: recall(it.key) }));
  const filled = data.filter((d) => d.value);
  // Steps that have produced nothing yet, in framework order.
  const emptySteps = [];
  ["The Inward Scan", "The six questions", "Your Brand Voice", "The Quieter Plan"].forEach((step) => {
    if (!filled.some((f) => f.step === step)) {
      const first = ITEMS.find((i) => i.step === step);
      emptySteps.push({ step, href: first.href });
    }
  });

  function buildText() {
    let t = "MY INWARD BRIEF, from Branding Inward\n\n";
    filled.forEach((d) => { t += `${d.label}:\n${d.value}\n\n`; });
    return t.trim();
  }
  async function copyAll() {
    try { await navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); track("brief_copied"); } catch { /* clipboard blocked */ }
  }
  async function sendEmail() {
    if (!email.trim()) return;
    setSending(true); setErr(null);
    try {
      const r = await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: email.trim(), summary: buildText() }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Couldn't send it. Try Copy instead."); }
      setSent(true); track("brief_emailed");
    } catch (e) { setErr(e.message || "Couldn't send it. Try Copy instead."); }
    finally { setSending(false); }
  }

  const nothingYet = filled.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <ToolsMenu />

      {/* HERO */}
      <section style={{ background: INK_TEAL }}>
        <div className="mw-fade" style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 56px" }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>Branding Inward</span>
          </a>
          <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: BUTTER, fontWeight: 600, margin: "0 0 14px" }}>Your Inward Brief</p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 18px", fontWeight: 350, color: CREAM }}>
            Everything you've found, <span style={{ fontStyle: "italic", color: BUTTER }}>in one place.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(251,247,240,.85)", margin: 0, maxWidth: 560 }}>
            It lives only on this device. Copy it, email it to yourself, keep it close.{nothingYet ? " Do a step or two and it starts to fill in." : ""}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 0" }}>
        {nothingYet ? (
          <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "28px 30px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
            <p style={{ fontSize: 19, lineHeight: 1.55, margin: "0 0 16px", color: INK }}>
              Nothing here yet. Each step you finish adds a line, and it all stays on this device.
            </p>
            <a href="#/scan" style={{ fontFamily: SANS, fontSize: 16, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>Start with the Inward Scan &rarr;</a>
          </div>
        ) : (
          <>
            {filled.map((d, i) => (
              <div key={i} className="mw-fade" style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "22px 26px", marginBottom: 14, boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
                <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, margin: "0 0 8px" }}>{d.label}</p>
                <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0, color: "#3D3630" }}>{d.value}</p>
              </div>
            ))}

            {/* Save row */}
            <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid #E5DDD1" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
                <button className="mw-btn" onClick={copyAll} style={{ ...primaryBtn, padding: "13px 24px", fontSize: 16 }}>{copied ? "Copied ✓" : "Copy everything"}</button>
              </div>
              {sent ? (
                <p style={{ fontSize: 16, color: ACCENT, margin: 0, fontFamily: SANS, fontWeight: 600 }}>Sent. Check your inbox for your brief.</p>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email it to yourself" style={{ flex: "1 1 220px", background: "#FFF", border: "1px solid #E5DDD1", borderRadius: 100, padding: "13px 18px", fontSize: 16, fontFamily: SANS, color: INK, outline: "none" }} />
                  <button className="mw-btn" onClick={sendEmail} disabled={sending} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}`, boxShadow: "none", padding: "12px 22px", fontSize: 15, opacity: sending ? 0.7 : 1 }}>
                    {sending ? "Sending…" : "Email it to me"}
                  </button>
                </div>
              )}
              {err && <p style={{ fontSize: 14, color: ACCENT, margin: "12px 0 0", fontFamily: SANS }}>{err}</p>}
            </div>
          </>
        )}

        {/* What's still to add */}
        {emptySteps.length > 0 && (
          <div style={{ marginTop: 34 }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A8F82", fontWeight: 700, margin: "0 0 14px" }}>Still to add</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emptySteps.map((s, i) => (
                <a key={i} href={s.href} className="mw-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: INK, background: "#FFF", border: "1px dashed #D8CFBF", borderRadius: 14, padding: "16px 20px" }}>
                  <span style={{ fontSize: 17 }}>{s.step}</span>
                  <span style={{ color: ACCENT, fontWeight: 700, fontFamily: SANS }}>Do it &rarr;</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The community layer, as the culmination */}
      <BuddyForm />

      <FrameworkStrip current="brief" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
        <PageQuote id="brief" />
      </div>

      {/* FOOTER with the persistent Forget control */}
      <footer style={{ background: INK_TEAL, marginTop: 40 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "44px 24px" }}>
          <a href="#/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: BUTTER }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, letterSpacing: ".14em", fontSize: 13, textTransform: "uppercase", color: CREAM }}>Branding Inward</span>
          </a>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(251,247,240,.6)", margin: 0, fontFamily: SANS }}>
            Your brief lives only on this device, never sent to me.{" "}
            <button onClick={() => { forgetAll(); window.location.reload(); }} style={{ background: "none", border: "none", padding: 0, color: "rgba(251,247,240,.75)", textDecoration: "underline", cursor: "pointer", fontFamily: SANS, fontSize: 14 }}>
              Forget everything on this device
            </button>.
          </p>
        </div>
      </footer>
    </div>
  );
}
