// Generates the static pages into dist/ AFTER `vite build`:
// 1. The resource library: src/library/*.md, curated shelves (philosophy,
//    framework, prompts, worksheets, linkedin), no dates, no chronology.
// 2. Pre-rendered tool pages, the homepage's crawlable text, sitemap, robots.
// Part 2 runs unconditionally: the library is content, the rest is the site.
//
// Run by `npm run build`: "vite build && node scripts/build-resources.mjs".

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LIBRARY_DIR = join(ROOT, "src", "library");
const DIST = join(ROOT, "dist");

const SITE_URL = "https://brandinginward.com";
const SITE_NAME = "Branding Inward";

// Shared entities. `sameAs` ties the writing to a real, findable person, which
// is what answer engines use to attribute a quote to an author.
const AUTHOR = {
  "@type": "Person",
  "@id": `${SITE_URL}/#afrin`,
  name: "Sabiha Afrin",
  jobTitle: "Brand strategist",
  url: `${SITE_URL}/about`,
  sameAs: ["https://www.linkedin.com/in/sabihaafrin"],
};
const PUBLISHER = { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: `${SITE_URL}/` };

// ── Brand tokens (kept in sync with src/lib/whisperKit.jsx) ──
const ACCENT = "#0F7C77";
const INK = "#2A2422";
const CREAM = "#FDFBF5";
const INK_TEAL = "#054648";
const BUTTER = "#F7D06B";
const ACCENT_TINT = "#E8F4F1";
const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600;700&display=swap";
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23FDFBF5'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%230F7C6C'/%3E%3C/svg%3E";

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// The shelves, in display order. linkedin only renders once items exist.
const SHELVES = [
  { key: "philosophy", name: "The philosophy", blurb: "What this whole site believes, in plain words." },
  { key: "framework", name: "The framework", blurb: "Know. Show. Grow. The method behind the five tools." },
  { key: "prompts", name: "Prompt collections", blurb: "The real patterns behind the tools, portable to any AI chat." },
  { key: "worksheets", name: "Worksheets & checklists", blurb: "Front-loaded work that compounds. Print them, work through them." },
  { key: "linkedin", name: "From my LinkedIn", blurb: "The best of what I write over there, kept here." },
];

// ── FAQ extraction: authors just end a post with a `## FAQ` section and
//    `### question?` subheads. The section stays VISIBLE in the rendered body
//    (answer engines only trust Q&A they can actually see), and we also emit it
//    as FAQPage structured data. ──
function stripMd(s = "") {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")   // links → text
    .replace(/[*_`>]/g, "")                     // emphasis/code marks
    .replace(/\s+/g, " ")
    .trim();
}

function extractFaqs(body) {
  const sec = body.match(/^##\s+(?:FAQ|Frequently asked questions)[^\n]*\n([\s\S]*)$/im);
  if (!sec) return [];
  const faqs = [];
  // Each `### question` runs until the next ### / ## or the end of the section.
  const re = /^###\s+(.+?)\s*$\n([\s\S]*?)(?=^###\s|^##\s|$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(sec[1])) !== null) {
    const q = stripMd(m[1]);
    const a = stripMd(m[2]);
    if (q && a) faqs.push({ q, a });
  }
  return faqs;
}

// ── Frontmatter: simple `key: value` block between --- fences. Library items
//    need title, description, and a shelf; `order` sorts within a shelf, and
//    `external: <url>` makes an outbound card (a LinkedIn post) with no page. ──
function parseItem(file) {
  const raw = readFileSync(join(LIBRARY_DIR, file), "utf8");
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error(`Library item ${file} is missing its --- frontmatter --- header.`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = m[2];
  const slug = file.replace(/\.md$/, "");
  if (!meta.title || !meta.description || !meta.shelf) {
    throw new Error(`Library item ${file} needs title, description, and shelf in its frontmatter.`);
  }
  if (!SHELVES.some((sh) => sh.key === meta.shelf)) {
    throw new Error(`Library item ${file} has unknown shelf "${meta.shelf}".`);
  }
  // Wrap the rendered FAQ section (heading through end) so it can be styled as a block.
  let html = marked.parse(body);
  html = html.replace(/(<h2[^>]*>\s*(?:FAQ|Frequently asked questions)[\s\S]*)$/i, '<div class="faq">$1</div>');
  return { slug, ...meta, order: Number(meta.order || 99), body, html, faqs: extractFaqs(body) };
}

// ── Shared chrome ──
const STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; background:${CREAM}; color:${INK}; font-family:'Fraunces','Georgia',serif; -webkit-font-smoothing:antialiased; }
  a { color:${ACCENT}; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }
  .site-head { border-bottom: 1px solid #EFE7DA; }
  .site-head .wrap { display:flex; align-items:center; justify-content:space-between; padding-top:22px; padding-bottom:22px; }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:${INK}; }
  .brand .dot { width:11px; height:11px; border-radius:50%; background:${ACCENT}; }
  .brand .name { font-family:'Inter',sans-serif; font-weight:700; letter-spacing:.14em; font-size:13px; text-transform:uppercase; }
  .nav-tools { font-family:'Inter',sans-serif; font-size:14px; font-weight:600; text-decoration:none; color:${ACCENT}; }
  .eyebrow { font-family:'Inter',sans-serif; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:${ACCENT}; font-weight:600; margin:0 0 10px; }
  h1.page { font-size: clamp(30px, 5vw, 46px); line-height:1.12; font-weight:350; margin:0 0 14px; }
  .lede { font-family:'Inter',sans-serif; font-size:18px; line-height:1.6; color:#5C534B; margin:0 0 8px; }
  .meta { font-family:'Inter',sans-serif; font-size:13px; color:#9A8F82; }
  /* index list */
  .post-card { display:block; text-decoration:none; color:${INK}; border-top:1px solid #EFE7DA; padding:26px 0; }
  .post-card:last-of-type { border-bottom:1px solid #EFE7DA; }
  .post-card .tag { font-family:'Inter',sans-serif; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${ACCENT}; font-weight:700; }
  .post-card h2 { font-size:26px; line-height:1.25; font-weight:400; margin:8px 0 8px; }
  .post-card p { font-family:'Inter',sans-serif; font-size:16px; line-height:1.55; color:#5C534B; margin:0; }
  /* article prose */
  article .prose { font-size:19px; line-height:1.75; color:#3D3630; }
  article .prose h2 { font-size:26px; line-height:1.25; font-weight:400; margin:38px 0 10px; }
  article .prose h3 { font-size:21px; line-height:1.3; font-weight:500; margin:28px 0 8px; }
  article .prose p { margin:0 0 20px; }
  article .prose a { font-weight:500; }
  article .prose ul, article .prose ol { margin:0 0 20px; padding-left:24px; }
  article .prose li { margin:0 0 10px; }
  article .prose strong { font-weight:600; }
  article .prose em { font-style:italic; }
  article .prose blockquote { margin:0 0 20px; padding:4px 0 4px 20px; border-left:3px solid ${BUTTER}; font-style:italic; color:#5C534B; }
  .disclosure { font-family:'Inter',sans-serif; font-size:13px; line-height:1.55; color:#9A8F82; font-style:italic; background:${ACCENT_TINT}; border-radius:10px; padding:12px 16px; margin:0 0 32px; }
  /* FAQ: a distinct, scannable block. Headings stay real h2/h3 so answer engines can parse them. */
  article .prose .faq { margin-top:44px; padding-top:8px; border-top:1px solid #EFE7DA; }
  article .prose .faq h2 { font-size:22px; margin:20px 0 4px; }
  article .prose .faq h3 { font-size:19px; font-weight:600; margin:24px 0 6px; color:${INK_TEAL}; }
  article .prose .faq h3 + p { margin-bottom:16px; }
  article .prose code { font-family:'Inter',sans-serif; font-size:.9em; background:${ACCENT_TINT}; padding:2px 6px; border-radius:5px; }
  /* CTA + signup */
  .cta { background:${ACCENT_TINT}; border:1px solid #DCEFEB; border-radius:16px; padding:24px 26px; margin:44px 0; }
  .cta p { font-family:'Inter',sans-serif; margin:0 0 14px; font-size:16px; color:#3D3630; line-height:1.5; }
  .btn { display:inline-block; background:${ACCENT}; color:#fff; text-decoration:none; font-family:'Inter',sans-serif; font-weight:600; font-size:16px; padding:14px 26px; border-radius:999px; }
  /* footer */
  footer.site { background:${INK_TEAL}; margin-top:64px; }
  footer.site .wrap { padding-top:44px; padding-bottom:44px; }
  footer.site .name { color:${CREAM}; }
  footer.site .tag { font-family:'Inter',sans-serif; font-size:14px; line-height:1.6; color:rgba(251,247,240,.72); margin:16px 0 14px; max-width:600px; }
  footer.site .links a { color:${BUTTER}; text-decoration:none; font-family:'Inter',sans-serif; font-weight:600; font-size:15px; }
  footer.site .links span { color:rgba(251,247,240,.3); margin:0 11px; }
  @media (max-width:520px){ .site-head .wrap{ padding-top:16px; padding-bottom:16px; } }
`;

const HEADER = `
  <header class="site-head"><div class="wrap">
    <a class="brand" href="/"><span class="dot"></span><span class="name">Branding Inward</span></a>
    <a class="nav-tools" href="/">The tools &rarr;</a>
  </div></header>`;

const FOOTER = `
  <footer class="site"><div class="wrap">
    <a class="brand" href="/"><span class="dot" style="background:${BUTTER}"></span><span class="name">Branding Inward</span></a>
    <p class="tag">These aren't generic AI answers. Real questions from a real strategist, delivered by AI so they reach you in minutes, for free.</p>
    <p class="links">
      <a href="/resources">Library</a><span>&middot;</span>
      <a href="/about">Read my story</a><span>&middot;</span>
      <a href="https://www.linkedin.com/in/sabihaafrin" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </p>
  </div></footer>`;

function pageShell({ title, description, canonical, jsonld, body, ogType = "website" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="${FAVICON}" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONTS}" rel="stylesheet" />
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ""}
<style>${STYLE}</style>
</head>
<body>
${HEADER}
${body}
${FOOTER}
</body>
</html>`;
}

function renderIndex(items) {
  const card = (p) => p.external
    ? `
    <a class="post-card" href="${esc(p.external)}" target="_blank" rel="noopener noreferrer">
      <span class="tag">${esc(p.tag || "LinkedIn")}</span>
      <h2>${esc(p.title)} &nearr;</h2>
      <p>${esc(p.description)}</p>
    </a>`
    : `
    <a class="post-card" href="/resources/${p.slug}">
      <span class="tag">${esc(p.tag || "Library")}</span>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
    </a>`;
  const shelves = SHELVES.map((sh) => {
    const onShelf = items.filter((p) => p.shelf === sh.key).sort((a, b) => a.order - b.order);
    if (!onShelf.length) return ""; // the linkedin shelf stays hidden until it has items
    return `
      <section style="margin-top:44px">
        <p class="eyebrow">${esc(sh.name)}</p>
        <p class="lede" style="font-size:15px; margin-bottom:4px">${esc(sh.blurb)}</p>
        ${onShelf.map(card).join("")}
      </section>`;
  }).join("");
  const body = `
    <main class="wrap" style="padding-top:52px; padding-bottom:8px">
      <p class="eyebrow">The library</p>
      <h1 class="page">Everything worth keeping, <em>on shelves.</em></h1>
      <p class="lede">Not a blog. The philosophy, the framework, the prompts, and the checklists behind Branding Inward, curated so you can find what you need and get back to making.</p>
      ${shelves}
    </main>`;
  const internal = items.filter((p) => !p.external);
  const indexGraph = [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, publisher: PUBLISHER },
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/resources#library`,
      url: `${SITE_URL}/resources`,
      name: `${SITE_NAME} Library`,
      description: "The philosophy, framework, prompt collections, and checklists behind Branding Inward.",
      author: AUTHOR,
      publisher: PUBLISHER,
      hasPart: internal.map((p) => ({
        "@type": "Article",
        headline: p.title,
        description: p.description,
        url: `${SITE_URL}/resources/${p.slug}`,
      })),
    },
  ];
  return pageShell({
    title: `The Library | ${SITE_NAME}`,
    description: "The Branding Inward library: the philosophy, the Know. Show. Grow. framework, AI prompt collections, and findability checklists. Free, no email.",
    canonical: `${SITE_URL}/resources`,
    jsonld: JSON.stringify({ "@context": "https://schema.org", "@graph": indexGraph }),
    body,
  });
}

function renderItem(p) {
  const url = `${SITE_URL}/resources/${p.slug}`;
  const graph = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: p.title,
      description: p.description,
      author: AUTHOR,
      publisher: PUBLISHER,
      mainEntityOfPage: url,
      isPartOf: { "@id": `${SITE_URL}/resources#library` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Library", item: `${SITE_URL}/resources` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  // Only emit FAQPage when the item actually has visible Q&A on the page.
  if (p.faqs && p.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: p.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const body = `
    <main class="wrap" style="padding-top:40px; padding-bottom:8px">
      <p style="margin:0 0 24px"><a href="/resources" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; text-decoration:none">&larr; The library</a></p>
      <article>
        <p class="eyebrow" style="margin-bottom:12px">${esc(p.tag || "Library")}</p>
        <h1 class="page">${esc(p.title)}</h1>
        <p class="lede" style="margin:0 0 32px">${esc(p.description)}</p>
        <div class="prose">${p.html}</div>
      </article>
      <div class="cta">
        <p><strong>Want to try it on your own brand?</strong> The Inward Scan finds where you get stuck, then points you to the right tool. Free, no account, one minute.</p>
        <a class="btn" href="/scan">Start the scan &rarr;</a>
      </div>
    </main>`;
  return pageShell({
    title: `${p.title} | ${SITE_NAME}`,
    description: p.description,
    canonical: url,
    jsonld,
    ogType: "article",
    body,
  });
}

// ── Tool pages: each real route gets its own dist/<slug>/index.html, cloned
//    from the built SPA shell so the hashed asset tags stay correct, with its
//    own head and crawlable text inside #root (search and AI answer engines
//    mostly don't run JS; React replaces the text on mount). ──
function renderToolPage(shell, t) {
  const url = `${SITE_URL}/${t.slug}`;
  let html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(t.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(t.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(t.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(t.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(t.description)}$2`);

  const graph = [
    {
      "@type": "SoftwareApplication",
      name: t.h1,
      url,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: t.description,
      author: AUTHOR,
      publisher: PUBLISHER,
    },
    {
      "@type": "FAQPage",
      mainEntity: t.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  const jsonld = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
  html = html.replace("</head>", `${jsonld}\n</head>`);

  // Crawlable fallback content. React clears it on mount.
  const fallback = `<h1>${esc(t.h1)}</h1>
<p>${esc(t.summary)}</p>
${t.faqs.map((f) => `<h2>${esc(f.q)}</h2>\n<p>${esc(f.a)}</p>`).join("\n")}
<p><a href="/">Branding Inward: all five tools</a> · <a href="/resources">Resources</a></p>`;
  return html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

// ── Run ──
const files = existsSync(LIBRARY_DIR) ? readdirSync(LIBRARY_DIR).filter((f) => f.endsWith(".md")) : [];
const items = files.map(parseItem);
const pageItems = items.filter((p) => !p.external);

mkdirSync(join(DIST, "resources"), { recursive: true });
writeFileSync(join(DIST, "resources", "index.html"), renderIndex(items));
for (const p of pageItems) {
  const dir = join(DIST, "resources", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderItem(p));
}

// tool pages
const { TOOL_PAGES } = await import(join(ROOT, "src", "lib", "toolPages.js"));
const shell = readFileSync(join(DIST, "index.html"), "utf8");
for (const t of TOOL_PAGES) {
  const dir = join(DIST, t.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderToolPage(shell, t));
}

// ── The homepage itself: give it a real title and crawlable text. Answer
//    engines mostly don't run JavaScript, so without this the front door of
//    the whole site is an empty div to them (the audit tool found exactly
//    that when it fetched the site). React replaces #root on mount, same as
//    the tool pages. ──
const HOME_TITLE = "Branding Inward: get found without performing | free AI branding tools";
const homeFallback = `
  <h1>Get found. Without performing.</h1>
  <p>Personal branding for people who are good at the work and bad at the announcing. Built by Sabiha Afrin, brand strategist. The questions are hers. The AI just makes them fast. Six questions, about ten minutes, and you leave knowing what content to make, with a gentle 7-day plan. No account, no email.</p>
  <h2>The tools</h2>
  <p>Each one works on its own.</p>
  <ul>
    <li><a href="/foundation">The Six Questions. You leave with a positioning line, the thing about your work nobody can copy, one word you could own, and a gentle 7-day plan.</a></li>
    <li><a href="/photo-to-posts">Photo to Posts. Upload one photo of your work; the AI looks at it and writes three posts in your voice, ready to tweak. No face required.</a></li>
    <li><a href="/scan">The Inward Scan. Eight taps, no typing. It names the specific way you get stuck when it is time to be visible.</a></li>
    <li><a href="/brand-voice">Brand Voice. Your actual voice, written down, so everything you publish sounds like you instead of like everyone.</a></li>
    <li><a href="/roast">The Gentle Roast. Honest, kind notes on anything you wrote about your work.</a></li>
    <li><a href="/ai-visibility">An AI visibility check. A live scan of where you actually show up, with the words that raise it.</a></li>
  </ul>
  <p>Everything you make quietly collects into <a href="/brief">your Inward Brief</a>, emailed to you as one page.</p>
  <p>You have the expertise. Someone with half of it has the audience. That gap is not a talent problem. It is a specific way of getting stuck when you have to talk about your own work. There are five of them, and each one has a name.</p>
  <h2>Built for people whose credibility lives in their work</h2>
  <p>Professors, researchers, and PhD candidates. Clinicians and scientists. Engineers, designers, and independent consultants. Anyone who would rather be judged on what they made than on how loudly they said it.</p>
  <p>People often tell me branding feels like it was written for extroverts. I disagree. Any good brand strategist knows great brands aren't built on volume. They're built on clarity, consistency, and the confidence to be unmistakably yourself.</p>
  <p><a href="/resources">The library</a> · <a href="/buddy">Find a hype buddy</a> · <a href="/about">About the strategist</a> · <a href="/work-with-me">Work with me</a></p>`;
const homeHtml = shell
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(HOME_TITLE)}</title>`)
  .replace('<div id="root"></div>', `<div id="root">${homeFallback}</div>`);
writeFileSync(join(DIST, "index.html"), homeHtml);

// sitemap + robots
const urls = [
  `${SITE_URL}/`,
  ...TOOL_PAGES.map((t) => `${SITE_URL}/${t.slug}`),
  `${SITE_URL}/resources`,
  ...pageItems.map((p) => `${SITE_URL}/resources/${p.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`[library] built ${items.length} library item(s) + ${TOOL_PAGES.length} tool page(s) + index, sitemap (${urls.length} urls), robots.`);
