import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import ShieldWhisper from "./ShieldWhisper.jsx";

// Tiny hash router: "#/shield" shows the Shield Whisper, everything else shows the main tool.
// Hash links need no server config, so Vercel keeps working exactly as before.
function Router() {
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const onChange = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash.startsWith("#/shield") ? <ShieldWhisper /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
    <Analytics />
  </React.StrictMode>
);
