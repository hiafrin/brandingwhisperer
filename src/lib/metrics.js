// Privacy-tight funnel metrics via PostHog, alongside Vercel's page counts.
// The deal this site makes with visitors is "everything you make stays on your
// device, I never see it" — so these events carry NO user content, ever: no
// answers, no scan results, no pasted writing. Only which step happened, and
// (for comparing test groups) whether they chose "myself" or "something I make".
// Cookieless (memory persistence), no autocapture, no session recording.
// Without a VITE_POSTHOG_KEY the whole thing is a silent no-op.

import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY;
let ready = false;

export function initMetrics() {
  if (!KEY || ready) return;
  posthog.init(KEY, {
    api_host: "https://us.i.posthog.com",
    persistence: "memory",          // no cookies, no localStorage
    autocapture: false,             // only the five events we chose
    capture_pageview: true,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_decide: false,
  });
  ready = true;
}

// The five funnel events, plus optional flat properties (never user content):
//   ph("scan_started"); ph("scan_completed");
//   ph("step_started", { step: "foundation" }); ph("step_completed", { step: "foundation" });
//   ph("brief_viewed", { sections_filled: 3 });
export function ph(event, props = {}) {
  if (!ready) return;
  try { posthog.capture(event, props); } catch (_) {}
}

// Tag every subsequent event with the chosen path, for comparing test groups.
export function phSetAudience(a) {
  if (!ready) return;
  try { posthog.register({ audience: a }); } catch (_) {}
}
