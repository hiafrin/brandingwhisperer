import React, { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ph } from "./lib/metrics.js";
import {
  ACCENT, INK, CREAM, INK_TEAL, BUTTER,
  SERIF, SANS, GLOBAL_CSS,
  GrainOverlay, SiteNav, FrameworkStrip, PageQuote, BuddyForm, SiteFooter, ForgetButton,
  recall, remember, primaryBtn,
} from "./lib/whisperKit.jsx";

// Each brief line, the device key it reads, and the step that fills it.
// Ordered by the framework: See, Understand, Express, Share, Refine.
// hrefs must match the real routes; every tool works on its own, and the
// questions moved to /foundation when the front door was swapped.
const ITEMS = [
  { key: "patternName", label: "How I get stuck", step: "The Inward Scan", href: "/scan" },
  { key: "reallyabout", label: "What I'm really about", step: "Foundation", href: "/foundation" },
  { key: "edge", label: "What makes me un-copyable", step: "Foundation", href: "/foundation" },
  { key: "voice", label: "My voice, named", step: "Brand Voice", href: "/brand-voice" },
  { key: "voicesample", label: "A post that sounds like me", step: "Brand Voice", href: "/brand-voice" },
  { key: "playbook", label: "The path I chose", step: "The Quieter Plan", href: "/plan" },
  { key: "firstmove", label: "My first move", step: "The Quieter Plan", href: "/plan" },
  { key: "roasted", label: "A line worth keeping", step: "The Gentle Roast", href: "/roast" },
];

export default function InwardBrief() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  // The brief is the one email-gated thing on the site: fill the form once
  // and it opens (and stays open on this device). The tools stay no-email.
  const [unlocked, setUnlocked] = useState(() => !!recall("briefUnlocked"));

  const data = ITEMS.map((it) => ({ ...it, value: recall(it.key) }));
  const filled = data.filter((d) => d.value);

  // The real success metric: someone reached the payoff page, with how much of it real.
  useEffect(() => { ph("brief_viewed", { sections_filled: filled.length }); /* eslint-disable-next-line */ }, []);
  // Steps that have produced nothing yet, in framework order. Derived from
  // ITEMS rather than a hardcoded list, so renaming a step can't break this.
  const emptySteps = [];
  [...new Set(ITEMS.map((i) => i.step))].forEach((step) => {
    if (!filled.some((f) => f.step === step)) {
      const first = ITEMS.find((i) => i.step === step);
      if (first) emptySteps.push({ step, href: first.href });
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
      setSent(true); setUnlocked(true); remember("briefUnlocked", "yes"); track("brief_emailed");
    } catch (e) { setErr(e.message || "Couldn't send it. Try Copy instead."); }
    finally { setSending(false); }
  }

  const nothingYet = filled.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: SERIF }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />

      {/* HERO */}
      <section style={{ background: INK_TEAL }}>
        <SiteNav tone="dark" />
        <div className="mw-fade" style={{ maxWidth: 820, margin: "0 auto", padding: "34px 24px 56px" }}>
          <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: BUTTER, fontWeight: 600, margin: "0 0 14px" }}>Your Inward Brief</p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)", lineHeight: 1.1, margin: "0 0 18px", fontWeight: 350, color: CREAM }}>
            Everything you've found, <span style={{ fontStyle: "italic", color: BUTTER }}>in one place.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(251,247,240,.85)", margin: 0, maxWidth: 560 }}>
            Nothing new is made here. It fills in from whichever tools you've used, in any order, so it's yours in one piece. It lives only on this device. Copy it, email it to yourself, keep it close.{nothingYet ? " Use a tool or two and it starts to fill in." : ""}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 0" }}>
        {nothingYet ? (
          <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "28px 30px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
            <p style={{ fontSize: 19, lineHeight: 1.55, margin: "0 0 16px", color: INK }}>
              Nothing here yet. Any tool you use adds a line, in any order, and it all stays on this device.
            </p>
            <a href="/" style={{ fontFamily: SANS, fontSize: 16, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>Start with the Inward Scan &rarr;</a>
          </div>
        ) : !unlocked ? (
          <div style={{ background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 16, padding: "28px 30px", boxShadow: "0 8px 24px rgba(11,59,52,.05)" }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, margin: "0 0 10px" }}>
              {filled.length} {filled.length === 1 ? "line" : "lines"} of your brief {filled.length === 1 ? "is" : "are"} ready
            </p>
            <p style={{ fontSize: 19, lineHeight: 1.6, margin: "0 0 18px", color: INK }}>
              Leave your email and I'll send your brief as one page, and open it right here. That's the whole trade, no newsletter unless you ask for one.
            </p>
            {sent ? (
              <p style={{ fontSize: 16, color: ACCENT, margin: 0, fontFamily: SANS, fontWeight: 600 }}>Sent. Opening your brief&hellip;</p>
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input aria-label="Your email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" style={{ flex: "1 1 220px", background: CREAM, border: "1px solid #E5DDD1", borderRadius: 100, padding: "13px 18px", fontSize: 16, fontFamily: SANS, color: INK, outline: "none" }} />
                <button className="mw-btn" onClick={sendEmail} disabled={sending} style={{ ...primaryBtn, padding: "13px 24px", fontSize: 16, opacity: sending ? 0.7 : 1 }}>
                  {sending ? "Sending\u2026" : "Email me my brief"}
                </button>
              </div>
            )}
            {err && <p style={{ fontSize: 14, color: ACCENT, margin: "12px 0 0", fontFamily: SANS }}>{err}</p>}
            <p style={{ fontSize: 13.5, color: "#857B70", fontFamily: SANS, margin: "14px 0 0", lineHeight: 1.6 }}>
              Your answers still live only on this device. The email sends this one page, nothing else.
            </p>
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
                  <input aria-label="Your email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email it to yourself" style={{ flex: "1 1 220px", background: "#FFF", border: "1px solid #E5DDD1", borderRadius: 100, padding: "13px 18px", fontSize: 16, fontFamily: SANS, color: INK, outline: "none" }} />
                  <button className="mw-btn" onClick={sendEmail} disabled={sending} style={{ ...primaryBtn, background: "#FFF", color: ACCENT, border: `2px solid ${ACCENT}`, boxShadow: "none", padding: "12px 22px", fontSize: 15, opacity: sending ? 0.7 : 1 }}>
                    {sending ? "Sending…" : "Email it to me"}
                  </button>
                </div>
              )}
              {err && <p style={{ fontSize: 14, color: ACCENT, margin: "12px 0 0", fontFamily: SANS }}>{err}</p>}
              {/* Reset lives here, where the saved results are actually shown. */}
              <p style={{ margin: "20px 0 0" }}>
                <ForgetButton label="Start fresh, forget my answers on this device" />
              </p>
            </div>
          </>
        )}

        {/* What's still to add */}
        {emptySteps.length > 0 && (
          <div style={{ marginTop: 34 }}>
            <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#9A8F82", fontWeight: 700, margin: "0 0 14px" }}>Add more, if you ever want to</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emptySteps.map((s, i) => (
                <a key={i} href={s.href} className="mw-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: INK, background: "#FFF", border: "1px dashed #D8CFBF", borderRadius: 14, padding: "16px 20px" }}>
                  <span style={{ fontSize: 17 }}>{s.step}</span>
                  <span style={{ color: ACCENT, fontWeight: 700, fontFamily: SANS }}>Open &rarr;</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The community layer, as the culmination */}
      <BuddyForm />

      {/* ── GO DEEPER: the natural next steps once the payoff page exists. ── */}
      <section style={{ maxWidth: 920, margin: "48px auto 0", padding: "0 24px" }}>
        <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, margin: "0 0 8px" }}>Go deeper</p>
        <p style={{ fontSize: 15, color: "#857B70", margin: "0 0 16px", fontFamily: SANS }}>Each of these sharpens a section of this page.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { outcome: "Write down how you actually sound", name: "Your Brand Voice", href: "/brand-voice" },
            { outcome: "Make a plan you can actually keep", name: "The Quieter Plan", href: "/plan" },
            { outcome: "Get honest feedback on what you wrote", name: "The Gentle Roast", href: "/roast" },
            { outcome: "See how findable you are to AI search", name: "The AI Visibility Audit", href: "/ai-visibility" },
          ].map((c) => (
            <a key={c.href} href={c.href} className="mw-card-hover" style={{ display: "block", textDecoration: "none", color: INK, background: "#FFF", border: "1px solid #EFE7DA", borderRadius: 14, padding: "16px 16px", fontFamily: SERIF }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{c.outcome}</span>
              <span style={{ display: "block", fontSize: 12.5, color: ACCENT, fontFamily: SANS }}>{c.name}</span>
            </a>
          ))}
        </div>
      </section>

      <FrameworkStrip current="brief" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
        <PageQuote id="brief" />
      </div>

      <SiteFooter />
    </div>
  );
}
