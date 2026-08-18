// The live-scan endpoint for the AI Visibility Audit, tiered so it can run
// off the Claude meter entirely:
//   site reading  — always our own fetch + HTML-to-text (no per-fetch AI fees)
//   web searches  — Tavily when TAVILY_API_KEY is set (1,000/mo free),
//                   else Claude's server-side web_search capped at 4
//   scoring       — Gemini flash when GEMINI_API_KEY is set (free tier),
//                   else claude-haiku-4-5
// With both keys set a scan costs $0; with neither it's a few cents (Haiku +
// four searches), still far below the old Sonnet + web_fetch bill.
// The response keeps the Anthropic content-blocks shape the client already
// parses, whichever backend produced the text.

// A scan takes well under a minute; the function's ceiling is raised in
// vercel.json ("functions" -> maxDuration), not here.

const RESEARCH_SYSTEM = `You are the strategist behind Branding Inward's AI visibility audit, reviewing the results of a live scan. Someone told you about their brand; the scan already ran the web searches and fetched their site, and the raw evidence is in the user message. Your job: score how findable they are honestly from that EVIDENCE and hand back tailored findings. The person likely finds self-promotion draining, so a low score must land as a clear starting point, never a scolding. The page's whole belief, which your words quietly carry: AI search can't hear volume, only clarity, so being findable never requires performing.

THE FIVE QUIET SIGNALS (score each 0 to 20; not one requires posting, performing, or showing your face):
1. NAME CLARITY: can an engine tell them apart from everyone else? Judge from what the name search ACTUALLY surfaced: a name that surfaces them cleanly scores high; a name drowned by others scores low.
2. THE ANCHOR PAGE: one page they own that plainly says who/what/for whom/where. Judge from the fetched site text if you have it. No website given: score low and say plainly that this is the gap.
3. SAME WORDS EVERYWHERE: do the bios and descriptions in the evidence (site text, profiles and listings in the search results) describe the work in the same words? Judge from what the scan saw; if it only found one presence, say so.
4. QUOTABLE ANSWERS: literal question-and-answer text an engine could lift, judged from the fetched site text.
5. BEING CITED: third-party mentions in the search results: directories, articles, marketplaces, podcasts. Judge from what actually surfaced.

SCORING RULES: score from evidence, not charity. Strong verified evidence lands 15 to 20, partial or thin evidence 8 to 14, absent 0 to 7. Most small brands genuinely land between 20 and 55 and an inflated score helps nobody. The total is the sum of the five.

DISAMBIGUATION: if an affiliation was given, use it to decide which search results are actually this person and which are other people who share the name. Say plainly in the receipts which is which ("the LinkedIn profile at X is you; the economist and the designer are other Sabiha Afrins" style, with their real details). Finding name twins is a real finding about NAME CLARITY; name it without drama, and score name clarity by whether THEY are findable among the twins.

HONESTY RULES: every claim in your output must trace to something in the evidence block. Quote or closely paraphrase real findings ("your homepage says X", "searching your name surfaces a LinkedIn profile and nothing else"). Never invent pages, mentions, or rankings that are not in the evidence. If a search came back empty or the site fetch failed, say that plainly; absence of evidence is a real finding here. The web is bigger than a handful of searches, so frame negatives as "didn't surface in our scan", not "doesn't exist".

VOICE: plain, warm, short sentences. Address the person directly as "you" everywhere, including every dimension note; "they" is only for third parties, and never assume anyone's gender. Do not use em-dashes or en-dashes anywhere, use commas and periods instead.

Return ONLY a JSON object as your final text, no markdown fences:
{"score": <integer 0 to 100, the sum of the five signal scores>,
 "found": [3 to 5 strings, each one plain sentence of what the scan actually surfaced, the receipts: what the name search showed, what the customer-style search showed, what the site said, notable absences],
 "dimensions": [exactly 5, in the signals' order, each {"name": "short plain name for the signal", "score": <integer 0 to 20>, "note": "one or two sentences, why this number, citing the actual evidence"}],
 "read": "2 or 3 sentences: the honest overall picture from the scan, warm, zero drama, and somewhere in it the quiet reassurance that none of what's missing requires performing",
 "gap": "one plain sentence naming the single weakest signal, the way a friend would say it",
 "rivalNote": ""}`;

// When no Tavily key exists, Claude runs the searches itself with the same
// protocol, compressed to four searches.
const CLAUDE_SEARCH_ADDENDUM = `

SEARCH PROTOCOL: the site text (if any) is already in the user message, but you must run the web searches yourself, up to 4, each with a distinct job, then stop and score:
1. Their bare name, the way a stranger who half-remembered it would.
2. Their name in quotes, exact, the way an engine disambiguates it.
3. Their name plus their affiliation if one was given, otherwise "[name] LinkedIn", for the profile that is actually them.
4. Spare: a second phrasing of their name plus what they do.
Do not fetch any web pages; the site text you have is the site evidence.`;

// ── Our own site reader: plain fetch + tag stripping, zero AI cost. ──
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandingInwardAudit/1.0; +https://brandinginward.com/ai-visibility)" },
    });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.includes("html") && !type.includes("text")) return null;
    const html = (await r.text()).slice(0, 400000);
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "";
    return { title: htmlToText(title).slice(0, 200), text: htmlToText(html).slice(0, 8000) };
  } catch (_) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function readSite(site) {
  let base = String(site).trim();
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  let origin;
  try { origin = new URL(base).origin; } catch (_) { return null; }
  const [home, about] = await Promise.all([
    fetchPage(base),
    fetchPage(origin + "/about"),
  ]);
  if (!home && !about) return null;
  return { home, about };
}

// ── Tavily searches, run in parallel. Free tier: 1,000 credits/month. ──
async function tavilySearch(query, key) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, max_results: 5, include_answer: false }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!r.ok) return { query, results: null };
    const d = await r.json();
    const results = (d.results || []).slice(0, 5).map((x) => ({
      title: String(x.title || "").slice(0, 150),
      url: String(x.url || "").slice(0, 200),
      snippet: String(x.content || "").slice(0, 350),
    }));
    return { query, results };
  } catch (_) {
    return { query, results: null };
  }
}

function buildQueries({ name, niche, where }) {
  // Name-first: the scan's job is to show people where THEY surface. An
  // affiliation beats a topic for disambiguation, so it takes that slot.
  const topic = niche.split(/\s+/).slice(0, 4).join(" ");
  return [
    name,
    `"${name}"`,
    where ? `${name} ${where}` : `${name} ${topic}`,
    `${name} LinkedIn`,
  ];
}

function evidenceBlock(siteData, searches) {
  const parts = [];
  if (siteData) {
    if (siteData.home) parts.push(`FETCHED HOMEPAGE (title: "${siteData.home.title}"):\n${siteData.home.text}`);
    if (siteData.about) parts.push(`FETCHED /ABOUT PAGE (title: "${siteData.about.title}"):\n${siteData.about.text}`);
    if (!siteData.home && !siteData.about) parts.push("SITE FETCH: failed, could not read the site.");
  } else {
    parts.push("SITE: none given (or unreadable), treat that as a finding.");
  }
  if (searches) {
    for (const s of searches) {
      if (!s.results) { parts.push(`SEARCH "${s.query}": the search failed to run.`); continue; }
      if (!s.results.length) { parts.push(`SEARCH "${s.query}": no results surfaced.`); continue; }
      parts.push(`SEARCH "${s.query}":\n` + s.results.map((r, i) => `${i + 1}. ${r.title} (${r.url}) ${r.snippet}`).join("\n"));
    }
  }
  return parts.join("\n\n");
}

// ── Scoring backends. Both return the raw text of the model's answer. ──
async function scoreWithGemini(system, user, key) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.4 },
      }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "gemini error");
  const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  if (!text.trim()) throw new Error("gemini empty");
  return text;
}

async function scoreWithClaude(system, user, { withSearch }) {
  const messages = [{ role: "user", content: user }];
  let data = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system,
        // The basic search variant returns results straight to context; no
        // web_fetch tool at all, our own fetch already read the site.
        ...(withSearch ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] } : {}),
        messages,
      }),
    });
    data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI service error");
    if (data.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: data.content });
  }
  return (data.content || []).filter((b) => b && b.type === "text").map((b) => b.text).join("");
}

// ── Best-effort per-IP throttle: 3 scans a day. In-memory, so a cold start
//    resets it; good enough to stop one person draining launch week. ──
function throttled(req) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const store = (globalThis.__visitScanHits ||= new Map());
  const rec = store.get(ip);
  if (!rec || rec.day !== day) { store.set(ip, { day, count: 1 }); return false; }
  if (rec.count >= 3) return true;
  rec.count += 1;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (throttled(req)) {
    return res.status(429).json({ error: "Three scans a day is the limit, so every scan stays free for everyone. Come back tomorrow, your answers will keep." });
  }

  const { name, site, niche, work, where } = req.body || {};
  if (!name || !work) {
    return res.status(400).json({ error: "Missing brand details" });
  }

  const brand = {
    name: String(name).slice(0, 80),
    site: site ? String(site).slice(0, 120) : "",
    niche: String(niche || work).slice(0, 100),
    work: String(work).slice(0, 160),
    where: where ? String(where).slice(0, 80) : "",
  };

  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Read their site ourselves (free), and run Tavily searches (free) in
    //    parallel when the key exists.
    const [siteData, searches] = await Promise.all([
      brand.site ? readSite(brand.site) : Promise.resolve(null),
      tavilyKey ? Promise.all(buildQueries(brand).map((q) => tavilySearch(q, tavilyKey))) : Promise.resolve(null),
    ]);

    // 2. Assemble the evidence and pick the scoring brain.
    const haveSearches = Array.isArray(searches) && searches.some((s) => s.results?.length);
    const system = haveSearches || geminiKey ? RESEARCH_SYSTEM : RESEARCH_SYSTEM + CLAUDE_SEARCH_ADDENDUM;
    const userTurn = `Brand name: "${brand.name}"
Website: ${brand.site ? `"${brand.site}"` : "none given, treat that as a finding"}
What they do, in their words: "${brand.work}"${brand.where ? `\nWhere they work or teach: "${brand.where}"` : ""}

SCAN EVIDENCE:
${evidenceBlock(siteData, searches)}

Score the five signals from this evidence now, then return the JSON.`;

    let text;
    if (geminiKey) {
      try {
        text = await scoreWithGemini(system, userTurn, geminiKey);
      } catch (_) {
        // Gemini hiccup: fall through to Haiku so the scan still lands.
        text = await scoreWithClaude(RESEARCH_SYSTEM + (haveSearches ? "" : CLAUDE_SEARCH_ADDENDUM), userTurn, { withSearch: !haveSearches });
      }
    } else {
      text = await scoreWithClaude(system, userTurn, { withSearch: !haveSearches });
    }

    // Same envelope the client has always parsed.
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (e) {
    return res.status(500).json({ error: "The live scan didn't finish." });
  }
}
