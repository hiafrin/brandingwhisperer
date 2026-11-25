import React, { useEffect, useRef } from "react";
import css from "./sincerelyunsaid/styles.css?inline";
import markup from "./sincerelyunsaid/markup.html?raw";
import { SU } from "./sincerelyunsaid/content.js";
import { initPage } from "./sincerelyunsaid/page.js";

// ── /sincerelyunsaid: the Sincerely Unsaid show page. It keeps its own design,
//    separate from the rest of the site: every style is scoped under .su and
//    goes away when the page unmounts. The words that change most (episodes,
//    questions, form messages) live in ./sincerelyunsaid/content.js. ──

const FONTS =
  "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap";

export default function SincerelyUnsaid() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const bodyBg = document.body.style.background;
    document.body.style.background = "#4a1322";
    el.className = "su";
    el.innerHTML = markup;
    const cleanup = initPage(el, SU);
    return () => {
      cleanup();
      el.innerHTML = "";
      el.className = "su";
      document.body.style.background = bodyBg;
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <style>{css}</style>
      <div className="su" ref={root} />
    </>
  );
}
