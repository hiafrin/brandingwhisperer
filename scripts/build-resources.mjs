// Generates the static Resources blog into dist/ AFTER `vite build`.
// Each post in src/posts/*.md becomes a real, indexable HTML page at a clean
// URL (/resources/<slug>), with its own SEO head. Plus an index, a sitemap,
// and robots.txt. The tools SPA (hash routes) is untouched.
//
// Run by `npm run build`: "vite build && node scripts/build-resources.mjs".

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const POSTS_DIR = join(ROOT, "src", "posts");
const DIST = join(ROOT, "dist");

const SITE_URL = "https://brandinginward.com";
const SITE_NAME = "Branding Inward";

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
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
const readingTime = (md) => Math.max(1, Math.round(md.split(/\s+/).length / 200)) + " min read";

// ── Frontmatter: simple `key: value` block between --- fences ──
function parsePost(file) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf8");
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error(`Post ${file} is missing its --- frontmatter --- header.`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = m[2];
  const slug = file.replace(/\.md$/, "");
  if (!meta.title || !meta.date || !meta.description) {
    throw new Error(`Post ${file} needs title, date, and description in its frontmatter.`);
  }
  return { slug, ...meta, body, html: marked.parse(body), reading: readingTime(body) };
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
  article .prose code { font-family:'Inter',sans-serif; font-size:.9em; background:${ACCENT_TINT}; padding:2px 6px; border-radius:5px; }
  /* CTA + signup */
  .cta { background:${ACCENT_TINT}; border:1px solid #DCEFEB; border-radius:16px; padding:24px 26px; margin:44px 0; }
  .cta p { font-family:'Inter',sans-serif; margin:0 0 14px; font-size:16px; color:#3D3630; line-height:1.5; }
  .btn { display:inline-block; background:${ACCENT}; color:#fff; text-decoration:none; font-family:'Inter',sans-serif; font-weight:600; font-size:16px; padding:14px 26px; border-radius:999px; }
  .signup { border:1px solid #EFE7DA; background:#fff; border-radius:16px; padding:26px 28px; margin:44px 0; box-shadow:0 8px 24px rgba(11,59,52,.05); }
  .signup .eyebrow { margin-bottom:8px; }
  .signup h3 { font-size:22px; font-weight:400; margin:0 0 8px; }
  .signup p { font-family:'Inter',sans-serif; font-size:14px; line-height:1.6; color:#857B70; margin:0 0 16px; }
  .signup form { display:flex; gap:10px; flex-wrap:wrap; }
  .signup input { flex:1; min-width:200px; font-family:'Inter',sans-serif; font-size:16px; padding:12px 14px; border:1px solid #DDD3C4; border-radius:10px; background:#FDFBF5; color:${INK}; }
  .signup button { font-family:'Inter',sans-serif; font-weight:600; font-size:16px; padding:12px 22px; border:none; border-radius:10px; background:${ACCENT}; color:#fff; cursor:pointer; }
  .signup .msg { font-family:'Inter',sans-serif; font-size:14px; margin:12px 0 0; min-height:1px; }
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
    <a class="nav-tools" href="/#/">The tools &rarr;</a>
  </div></header>`;

const FOOTER = `
  <footer class="site"><div class="wrap">
    <a class="brand" href="/"><span class="dot" style="background:${BUTTER}"></span><span class="name">Branding Inward</span></a>
    <p class="tag">These aren't generic AI answers. Real questions from a real strategist, delivered by AI so they reach you in minutes, for free.</p>
    <p class="links">
      <a href="/resources">Resources</a><span>&middot;</span>
      <a href="/#/about">Read my story</a><span>&middot;</span>
      <a href="https://www.linkedin.com/in/sabihaafrin" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </p>
  </div></footer>`;

// Signup: static pages, so vanilla JS posts to /api/email. Named exception + free.
const SIGNUP = `
  <div class="signup">
    <p class="eyebrow">The one opt-in</p>
    <h3>Want the next how-to?</h3>
    <p>The tools never ask for this, and never will. The writing is the one thing you can choose to get in your inbox. Free, like everything here, and one click to leave.</p>
    <form onsubmit="subInward(this); return false;">
      <input type="email" name="email" placeholder="you@example.com" required aria-label="Your email" />
      <button type="submit">Keep me posted</button>
    </form>
    <p class="msg" id="submsg" role="status"></p>
  </div>
  <script>
    async function subInward(form){
      var msg=document.getElementById('submsg');
      var email=form.email.value.trim();
      msg.style.color='#857B70'; msg.textContent='Sending...';
      try{
        var r=await fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({to:email,summary:"NEWSLETTER SIGNUP for Branding Inward. You're on the list, new how-tos as they come. One click to leave anytime."})});
        var d=await r.json().catch(function(){return {};});
        if(r.ok&&d.ok){ msg.style.color='${ACCENT}'; msg.textContent="You're on the list. Talk soon."; form.reset(); }
        else { msg.style.color='#B4472F'; msg.textContent=(d&&d.error)||"Couldn't sign you up just now. Try again in a moment."; }
      }catch(e){ msg.style.color='#B4472F'; msg.textContent="Couldn't sign you up just now. Try again in a moment."; }
      return false;
    }
  </script>`;

function pageShell({ title, description, canonical, jsonld, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="${FAVICON}" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="${jsonld ? "article" : "website"}" />
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

function renderIndex(posts) {
  const cards = posts.map((p) => `
    <a class="post-card" href="/resources/${p.slug}">
      <span class="tag">${esc(p.tag || "Writing")}</span>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
      <p class="meta" style="margin-top:10px">${fmtDate(p.date)} &middot; ${p.reading}</p>
    </a>`).join("");
  const body = `
    <main class="wrap" style="padding-top:52px; padding-bottom:8px">
      <p class="eyebrow">Resources</p>
      <h1 class="page">How-tos for getting known <em>without performing.</em></h1>
      <p class="lede">Plain, practical writing on building a brand when self-promotion drains you. No hype, no growth hacks, just what actually works for quiet people.</p>
      <div style="margin-top:36px">${cards}</div>
      ${SIGNUP}
    </main>`;
  return pageShell({
    title: `Resources | ${SITE_NAME}`,
    description: "Plain, practical how-tos on building a brand when self-promotion drains you. Get known without performing.",
    canonical: `${SITE_URL}/resources`,
    jsonld: null,
    body,
  });
}

function renderPost(p) {
  const url = `${SITE_URL}/resources/${p.slug}`;
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    author: { "@type": "Person", name: "Sabiha Afrin" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: url,
  });
  const body = `
    <main class="wrap" style="padding-top:40px; padding-bottom:8px">
      <p style="margin:0 0 24px"><a href="/resources" style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; text-decoration:none">&larr; Resources</a></p>
      <article>
        <p class="eyebrow" style="margin-bottom:12px">${esc(p.tag || "Writing")}</p>
        <h1 class="page">${esc(p.title)}</h1>
        <p class="meta" style="margin:0 0 ${p.affiliate === "true" ? "20px" : "32px"}">${fmtDate(p.date)} &middot; ${p.reading}</p>
        ${p.affiliate === "true" ? `<p class="disclosure">Some links here are affiliate links. I may earn a small commission at no cost to you, and I only ever recommend tools I actually use.</p>` : ""}
        <div class="prose">${p.html}</div>
      </article>
      <div class="cta">
        <p><strong>Want to try it on your own brand?</strong> The Inward Pattern Scan finds where you get stuck, then points you to the right tool. Free, no account, three minutes.</p>
        <a class="btn" href="/#/scan">Start the scan &rarr;</a>
      </div>
      ${SIGNUP}
    </main>`;
  return pageShell({
    title: `${p.title} | ${SITE_NAME}`,
    description: p.description,
    canonical: url,
    jsonld,
    body,
  });
}

// ── Run ──
if (!existsSync(POSTS_DIR)) { console.log("[resources] no src/posts dir, skipping."); process.exit(0); }
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const posts = files.map(parsePost).sort((a, b) => (a.date < b.date ? 1 : -1));

mkdirSync(join(DIST, "resources"), { recursive: true });
writeFileSync(join(DIST, "resources", "index.html"), renderIndex(posts));
for (const p of posts) {
  const dir = join(DIST, "resources", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), renderPost(p));
}

// sitemap + robots
const urls = [`${SITE_URL}/`, `${SITE_URL}/resources`, ...posts.map((p) => `${SITE_URL}/resources/${p.slug}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u}</loc></url>`)
  .join("\n")}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`[resources] built ${posts.length} post(s) + index, sitemap, robots.`);
