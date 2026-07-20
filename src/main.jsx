import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import ShieldWhisper from "./ShieldWhisper.jsx";
import RoastWhisper from "./RoastWhisper.jsx";
import PlanWhisper from "./PlanWhisper.jsx";
import InwardScan from "./InwardScan.jsx";
import AboutInward from "./AboutInward.jsx";

const ROUTES = {
  "#/shield": ShieldWhisper,
  "#/roast": RoastWhisper,
  "#/editor": RoastWhisper, // old URL, briefly live, kept as a silent alias
  "#/plan": PlanWhisper,
  "#/scan": InwardScan,
  "#/about": AboutInward,
};

function Router() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
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
