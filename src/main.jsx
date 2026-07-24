import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import ShieldWhisper from "./ShieldWhisper.jsx";
import RoastWhisper from "./RoastWhisper.jsx";
import PlanWhisper from "./PlanWhisper.jsx";
import AboutInward from "./AboutInward.jsx";
import InwardBrief from "./InwardBrief.jsx";

const ROUTES = {
  "#/shield": ShieldWhisper,
  "#/roast": RoastWhisper,
  "#/editor": RoastWhisper, // old URL, briefly live, kept as a silent alias
  "#/plan": PlanWhisper,
  "#/about": AboutInward,
  "#/brief": InwardBrief,
  // The Scan now lives on the home (#/); the six questions live at #/foundation.
  // Both render App, which reads the hash. #/scan is redirected to #/ below.
};

function Router() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const norm = () => {
      if (window.location.hash === "#/scan") { window.location.hash = "/"; return; } // old scan URL -> home
      setHash(window.location.hash);
    };
    norm(); // handle a direct load on #/scan
    window.addEventListener("hashchange", norm);
    return () => window.removeEventListener("hashchange", norm);
  }, []);
  const Page = ROUTES[hash] || App;
  return <Page />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
    <Analytics />
  </React.StrictMode>
);
