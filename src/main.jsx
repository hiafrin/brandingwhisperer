import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { initMetrics } from "./lib/metrics.js";
import App from "./App.jsx";
import ShieldWhisper from "./ShieldWhisper.jsx";
import RoastWhisper from "./RoastWhisper.jsx";
import PlanWhisper from "./PlanWhisper.jsx";
import AboutInward from "./AboutInward.jsx";
import InwardBrief from "./InwardBrief.jsx";
import InwardScan from "./InwardScan.jsx";
import AIVisibility from "./AIVisibility.jsx";
import WorkWithMe from "./WorkWithMe.jsx";
import { TOOL_PAGES } from "./lib/toolPages.js";

// Real, indexable paths — one per tool. Each is also pre-rendered to its own
// dist/<slug>/index.html by scripts/build-resources.mjs so crawlers see it.
const ROUTES = {
  "/": () => <App view="home" />,
  "/scan": () => <InwardScan />,
  "/foundation": () => <App view="foundation" />,
  "/brand-voice": () => <ShieldWhisper />,
  "/plan": () => <PlanWhisper />,
  "/roast": () => <RoastWhisper />,
  "/brief": () => <InwardBrief />,
  "/about": () => <AboutInward />,
  "/ai-visibility": () => <AIVisibility />, // outside the six-step framework
  "/work-with-me": () => <WorkWithMe />,
};

// Old hash URLs, briefly live and possibly bookmarked or shared. Each maps to
// its new real path on load, so nothing anyone saved ever breaks.
const LEGACY_HASH = {
  "#/": "/",
  "#/scan": "/scan",
  "#/foundation": "/foundation",
  "#/shield": "/brand-voice",
  "#/roast": "/roast",
  "#/editor": "/roast", // even older URL, kept as a silent alias
  "#/plan": "/plan",
  "#/about": "/about",
  "#/brief": "/brief",
};

function normalizePath(p) {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

// Per-page titles, from the same data the pre-render bakes into each page's
// static HTML, so a soft navigation and a direct load always agree.
const TITLES = Object.fromEntries(TOOL_PAGES.map((t) => [`/${t.slug}`, t.title]));

function Router() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    // Legacy hash → real path, once, on boot.
    const legacy = LEGACY_HASH[window.location.hash];
    if (legacy) {
      window.history.replaceState({}, "", legacy);
      setPath(legacy);
    }

    const onPop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPop);

    // One interceptor for every internal link: pushState instead of a full
    // reload, so the site keeps its instant feel while every link stays a
    // plain <a> that right-click and open-in-new-tab handle correctly.
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.origin !== window.location.origin) return;
      if (a.getAttribute("href").startsWith("#")) return; // in-page anchors stay native
      const href = normalizePath(a.pathname);
      if (!(href in ROUTES)) return; // /resources and unknowns do a real load
      e.preventDefault();
      if (href !== normalizePath(window.location.pathname)) {
        window.history.pushState({}, "", href);
        setPath(href);
        window.scrollTo({ top: 0 });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    document.title = TITLES[path] || "Branding Inward";
  }, [path]);

  const Page = ROUTES[path] || ROUTES["/"];
  return <Page />;
}

initMetrics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
    <Analytics />
  </React.StrictMode>
);
