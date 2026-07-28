// The deep-scan endpoint for the AI Visibility Audit. Unlike /api/generate,
// this one lets Claude actually dig: server-side web search (a few real
// queries about the brand) and web fetch (reading their site if they gave
// one), then a score built from evidence instead of estimation.
// Runs on Vercel's servers; the API key never reaches the browser.

// A scan takes one to three minutes; the function's time ceiling is raised
// in vercel.json ("functions" -> maxDuration), not here.

const RESEARCH_SYSTEM = `You are the strategist behind Branding Inward's AI visibility audit, running a live scan. Someone told you about their brand. Your job: research how findable they actually are, score it honestly from EVIDENCE, and hand back tailored findings. The person likely finds self-promotion draining, so a low score must land as a clear starting point, never a scolding. The page's whole belief, which your words quietly carry: AI search can't hear volume, only clarity, so being findable never requires performing.

RESEARCH PROTOCOL: work through this once, decisively, no re-checking. Up to 8 searches and 4 fetches, each with a distinct job:
1. Their bare name, the way a stranger who half-remembered it would. Who surfaces: them, someone else with the name, nothing?
2. Their name + their craft or niche, the disambiguated version. Does pairing the two find them?
3. A shopping-customer query: "best [niche] [place if given]" style. Who surfaces: them, the named competitor, neither?
4. A second customer phrasing, worded differently (what they'd type, not marketing words).
5. "[name] reviews" or "[name] [niche]" for third-party mentions: directories, articles, marketplaces, podcasts, Reddit.
6. Their name on the big profile surfaces: try "[name] LinkedIn" or "[name] Instagram" and note whether a matching profile surfaces and how it describes them (this is the same-words-everywhere evidence).
7. If they named a competitor, ONE search of the competitor to see why they are or aren't easy to find.
8. Spare, only if a real question is still open.
FETCHES, if they gave a website: the homepage first. Then, if the homepage links to them, an about page and an FAQ or questions page (guess common paths like /about only if the homepage suggests the site has more pages). Check for real: does any page plainly say who they are, what they make, for whom, where? Is there literal question-and-answer text an engine could quote?
Then stop researching and score from what you have. Absence of evidence after this protocol is itself a finding.

THE FIVE QUIET SIGNALS (score each 0 to 20; not one requires posting, performing, or showing your face):
1. NAME CLARITY: can an engine tell them apart from everyone else? Judge from what your name search ACTUALLY surfaced: a name that surfaces them cleanly scores high; a name drowned by others scores low.
2. THE ANCHOR PAGE: one page they own that plainly says who/what/for whom/where. Judge from the fetch if you have it. No website given: score low and say plainly that this is the gap.
3. SAME WORDS EVERYWHERE: do the bios and descriptions you actually found (site, profiles, listings in search results) describe the work in the same words? Judge from what you saw; if you only found one presence, say so.
4. QUOTABLE ANSWERS: literal question-and-answer text an engine could lift. Judge from the fetched pages.
5. BEING CITED: third-party mentions in the search results: directories, articles, marketplaces, podcasts. Judge from what actually surfaced.

SCORING RULES: score from evidence, not charity. Strong verified evidence lands 15 to 20, partial or thin evidence 8 to 14, absent 0 to 7. Most small brands genuinely land between 20 and 55 and an inflated score helps nobody. The total is the sum of the five.

HONESTY RULES: every claim in your output must trace to something you actually searched or fetched in this run. Quote or closely paraphrase real findings ("your homepage title says X", "searching your name surfaces a LinkedIn profile and nothing else"). Never invent pages, mentions, or rankings you did not see. If a search or fetch failed or was empty, say that plainly; absence of evidence is a real finding here. The web is bigger than 5 searches, so frame negatives as "didn't surface in our scan", not "doesn't exist".

VOICE: plain, warm, short sentences. Address the person directly as "you" everywhere, including every dimension note; "they" is only for third parties, and never assume anyone's gender. Do not use em-dashes or en-dashes anywhere, use commas and periods instead.

After researching, return ONLY a JSON object as your final text, no markdown fences:
{"score": <integer 0 to 100, the sum of the five signal scores>,
 "found": [3 to 5 strings, each one plain sentence of what the scan actually surfaced, the receipts: what the name search showed, what the customer-style search showed, what the site said, notable absences],
 "dimensions": [exactly 5, in the signals' order, each {"name": "short plain name for the signal", "score": <integer 0 to 20>, "note": "one or two sentences, why this number, citing the actual evidence"}],
 "read": "2 or 3 sentences: the honest overall picture from the scan, warm, zero drama, and somewhere in it the quiet reassurance that none of what's missing requires performing",
 "gap": "one plain sentence naming the single weakest signal, the way a friend would say it",
 "rivalNote": "one sentence on the named competitor grounded in what your search showed, or empty string if none was given"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, site, niche, work, rival } = req.body || {};
  if (!name || !niche || !work) {
    return res.status(400).json({ error: "Missing brand details" });
  }

  const userTurn = `Brand name: "${String(name).slice(0, 80)}"
Website: ${site ? String(site).slice(0, 120) : "none given, treat that as a finding"}
Niche: "${String(niche).slice(0, 100)}"
What they do, in their words: "${String(work).slice(0, 160)}"
Competitor or peer in their space: ${rival ? `"${String(rival).slice(0, 80)}"` : "none given"}

Run the live scan now, then return the JSON.`;

  const messages = [{ role: "user", content: userTurn }];

  try {
    // Server-side tool loops can pause (stop_reason "pause_turn"); re-send
    // with the assistant turn appended and the server resumes where it left off.
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
          model: "claude-sonnet-5",
          max_tokens: 4000,
          // Low effort keeps the tool loop fast and decisive. The basic tool
          // variants return results straight to context, skipping the newer
          // versions' code-execution filtering step, which dominated latency;
          // that's what lets the deeper 8-search protocol still fit inside
          // the function's time ceiling.
          thinking: { type: "disabled" },
          output_config: { effort: "low" },
          system: RESEARCH_SYSTEM,
          tools: [
            { type: "web_search_20250305", name: "web_search", max_uses: 8 },
            { type: "web_fetch_20250910", name: "web_fetch", max_uses: 4, max_content_tokens: 8000 },
          ],
          messages,
        }),
      });

      data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || "AI service error" });
      }
      if (data.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: data.content });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "The live scan didn't finish." });
  }
}
