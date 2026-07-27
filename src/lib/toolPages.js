// ── Per-tool page data for the static pre-render. Plain data, no JSX, so the
//    Node build script (scripts/build-resources.mjs) can import it too.
//    Every tool page gets its own <title>, description, and crawlable text
//    (h1 + summary + FAQs) baked into dist/<slug>/index.html, because search
//    and AI answer engines mostly don't run JavaScript. React replaces the
//    text on mount; a crawler reads it as-is. ──

export const TOOL_PAGES = [
  {
    slug: "scan",
    step: 1,
    title: "The Inward Scan: find how you get stuck | Branding Inward",
    description:
      "A free one-minute scan, eight taps and no typing, that names the pattern behind why self-promotion feels impossible for you: hiding, pushing, deleting, perfecting, or scattering.",
    h1: "The Inward Scan",
    summary:
      "Eight taps, no typing, about a minute. The scan names the pattern you can't see on your own, the specific way you get stuck when it's time to be visible, and points you at the one step that breaks it. Free, no account, and your answers stay on your device.",
    faqs: [
      {
        q: "What is the Inward Scan?",
        a: "A free one-minute quiz from Branding Inward, a brand strategist's six-step framework for getting known without performing. Eight taps reveal your visibility pattern: the Hider, the Pusher, the Deleter, the Perfectionist, or the Scatterer, and the one step that breaks it.",
      },
      {
        q: "Do I need an account or an email address?",
        a: "No. There is no account and no email. Your answers are saved only on your own device, and you can erase them anytime with one click.",
      },
      {
        q: "Is this the first step of a bigger framework?",
        a: "Yes. It's step one of six: See yourself, Understand yourself, Express yourself, Share yourself, Refine yourself, Keep yourself. Each step works on its own, and together they build your complete brand brief.",
      },
    ],
  },
  {
    slug: "foundation",
    step: 2,
    title: "What you're really about: six questions | Branding Inward",
    description:
      "Six questions that find the un-copyable thing in your own story: what you're really about, what makes you different, and the word you could own. Free, AI-assisted, built by a brand strategist.",
    h1: "What you're really about",
    summary:
      "Six questions, answered plainly, and the tool reflects back what you're really about: the un-copyable thing hiding in your own story, what makes you different without inventing a claim, and the one word you could own. About ten minutes, free, no account.",
    faqs: [
      {
        q: "How is this different from asking ChatGPT about my brand?",
        a: "The six questions were designed by a working brand strategist to extract what actually makes a brand memorable: real stories, sensory detail, and the things you refuse to do. The AI only reflects your own answers back, grounded in published consumer psychology, so the result can only be about you.",
      },
      {
        q: "What do I walk away with?",
        a: "A plain statement of what you're really about, the un-copyable edge in your own story, and a word you could own, saved to your device and assembled into your Inward Brief.",
      },
      {
        q: "Do I have to do the other steps first?",
        a: "No. Every step of the Inward Framework works on its own. This one is step two of six, and you can start here.",
      },
    ],
  },
  {
    slug: "brand-voice",
    step: 3,
    title: "Your Brand Voice: how you already talk, written down | Branding Inward",
    description:
      "A free tool that observes how you actually write and hands your voice back, named, with a voice card you can paste into any AI so it edits toward you instead of writing over you.",
    h1: "Your Brand Voice",
    summary:
      "You answer six questions like you'd text a friend. The tool studies how you actually talk, the words you reach for, what you play down, where you get vivid, and hands your voice back, named, with proof quoted from your own words. You leave with a voice card you can paste into any AI so it writes like you, not over you.",
    faqs: [
      {
        q: "What is a brand voice card?",
        a: "A short block of text describing your real writing voice, built from observation of how you actually talk. Paste it into any AI assistant before asking for writing help and the AI becomes your editor instead of your ghostwriter.",
      },
      {
        q: "Will this invent a persona for me?",
        a: "No. The tool never suggests a persona or an alter ego. It observes the voice you already have and removes the nerves, nothing added.",
      },
      {
        q: "Is it really free?",
        a: "Yes. No account, no email, no paywall. Your answers and your named voice are saved only on your own device.",
      },
    ],
  },
  {
    slug: "plan",
    step: 4,
    title: "The Quieter Plan: marketing at a cost you can bear | Branding Inward",
    description:
      "A free tool that chooses one marketing path built from what you can honestly stand and the time you really have. Maybe that's no social media at all. Includes a photo-to-posts tool.",
    h1: "The Quieter Plan",
    summary:
      "Every marketing plan you've been handed assumes you'll perform daily. This one starts from what you can honestly bear and the time you really have, then chooses one path for you, with a list of what to ignore and a first move under fifteen minutes. There's also a photo tool: upload one shot of your work and get three posts written in your voice.",
    faqs: [
      {
        q: "What if I hate social media?",
        a: "That's exactly who this is for. The plan is chosen from paths that include a tiny monthly letter, quiet process posts that never show your face, and routes with no social media at all.",
      },
      {
        q: "What is the photo-to-posts tool?",
        a: "Upload one photo of what you made, your workspace, or your process, and the tool writes three posts around it in your voice. No face required, no plan required, and the photo never leaves your request.",
      },
      {
        q: "Why one path instead of options?",
        a: "Choosing is the exhausting part. The tool picks the single best-fit path from your own answers and gives you explicit permission to ignore the rest.",
      },
    ],
  },
  {
    slug: "roast",
    step: 5,
    title: "The Gentle Roast: honest notes on what you wrote | Branding Inward",
    description:
      "Paste your bio, caption, or About page and get honest, kind notes: what to keep, what sounds like a costume, what a reader might miss. You pick how hard it lands. Free.",
    h1: "The Gentle Roast",
    summary:
      "Paste anything you've written about your work, your bio, a caption, your About page, and get it read closely: what's already strong and must not change, what sounds more formal than you, what a reader might not follow, and what's missing. You choose the intensity, from a warm friend to a brutal strategist, and every note aims at the writing, never at you.",
    faqs: [
      {
        q: "How is this different from other feedback tools?",
        a: "It always leads with what NOT to change. Confidence is what lets you hear the rest, so every roast starts with your strongest lines, quoted, with a plain reason they already work.",
      },
      {
        q: "Is my writing stored anywhere?",
        a: "No. What you paste is analyzed and never saved, and there is no account. Only the one line worth keeping is stored, on your own device, for your Inward Brief.",
      },
      {
        q: "Can I control how blunt it is?",
        a: "Yes. Three levels: a warm friend, a blunt stranger online, or a brutal strategist. Every level aims at the work, never the person.",
      },
    ],
  },
  {
    slug: "brief",
    step: 6,
    title: "Your Inward Brief: your whole brand, one page | Branding Inward",
    description:
      "Everything the six steps found, assembled on one page: your pattern, what you're about, your voice, your path, and your first move. Saved on your device only.",
    h1: "Your Inward Brief",
    summary:
      "The sixth step of the Inward Framework: everything the tools found about you, your pattern, what you're really about, your named voice, your chosen path, and your first move, assembled into one brief you can copy anywhere. It lives on your device only, and fills in as you complete the other steps.",
    faqs: [
      {
        q: "What is an Inward Brief?",
        a: "One page holding what each step of the Inward Framework found: how you get stuck, what you're really about, your voice named, the path you chose, and a line worth keeping. It's your brand, written down, in your own words.",
      },
      {
        q: "Where is my brief stored?",
        a: "Only on your own device, in your browser's local storage. Nothing is sent anywhere, there is no account, and you can erase it all with one click.",
      },
      {
        q: "Do I need to finish all six steps?",
        a: "No. The brief fills in from whichever steps you've done, in any order, and each section links to the step that produces it.",
      },
    ],
  },
  {
    slug: "ai-visibility",
    step: null,
    title: "The AI Visibility Snapshot: is AI search finding you? | Branding Inward",
    description:
      "Answer a few questions about your brand and get a visibility score out of 100: how findable you currently are to AI search, the five-part breakdown behind it, and three tailored fixes. Free, no email.",
    h1: "The AI Visibility Snapshot",
    summary:
      "People now ask AI assistants for recommendations the way they used to ask a friend. This free snapshot scores how findable your brand currently is to AI search, out of 100, across the five things answer engines actually check: name clarity, an anchor page, consistent bios, quotable answers, and third-party mentions. You leave with the breakdown and three fixes under twenty minutes each. It sits outside the six-step Inward Framework: the steps build your brand, this scores how findable it is.",
    faqs: [
      {
        q: "What does the AI visibility snapshot actually do?",
        a: "You describe your brand and answer four quick questions about your setup. It returns a score out of 100 with a band (Unseen, A faint trace, Coming into view, or Found), a five-part breakdown of where the points went, and three tailored fixes that move the score.",
      },
      {
        q: "Is this a live scan of what AI search says about me?",
        a: "No, and the page says so plainly. The score is estimated from your own answers plus AI judgment of your name itself. Treat it as a starting-point assessment, not a technical audit.",
      },
      {
        q: "Do I have to give my email to see my results?",
        a: "No. The full results, score, breakdown, and fixes appear right on the page. No account, no email, and nothing you type is saved.",
      },
      {
        q: "What kind of fixes does it give?",
        a: "The quiet kind: one anchor page that says plainly who you are, one bio sentence used identically everywhere, FAQ-shaped pages engines can quote, pairing your name with your craft, and one citable third-party mention. No posting schedule, no performing.",
      },
    ],
  },
  {
    slug: "about",
    step: null,
    title: "About: the strategist behind Branding Inward",
    description:
      "Branding Inward is a brand strategist's free toolkit for people who find self-promotion draining: six steps to get known without performing.",
    h1: "About Branding Inward",
    summary:
      "Branding Inward is built by Sabiha Afrin, a brand strategist. The framework, the questions, and the research behind every tool are hers; the AI is just what hands it to you in three minutes, for free. It exists for people who want to be known for their work without performing for it.",
    faqs: [
      {
        q: "Who makes Branding Inward?",
        a: "Sabiha Afrin, a brand strategist. The six-step framework and every question in the tools come from her practice and research into consumer psychology.",
      },
      {
        q: "Why is it free?",
        a: "Because the people it's built for, the quiet ones who find self-promotion draining, are the least likely to pay for marketing help they suspect wasn't made for them. The tools are the proof it was.",
      },
      {
        q: "Are the results just generic AI answers?",
        a: "No. Every tool runs on a strategist-written framework grounded in published consumer psychology, and works only from your own answers, so the output can only be about you.",
      },
    ],
  },
];
