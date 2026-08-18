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
      "Eight taps, no typing, about a minute. The scan names the pattern you can't see on your own, the specific way you get stuck when it's time to be visible, and points you at the one move that breaks it. Free, no account, and your answers stay on your device.",
    faqs: [
      {
        q: "What is the Inward Scan?",
        a: "A free one-minute quiz from Branding Inward, a brand strategist's toolkit for getting found without performing. Eight taps reveal your visibility pattern: the Hider, the Pusher, the Deleter, the Perfectionist, or the Scatterer, and the one move that breaks it.",
      },
      {
        q: "Do I need an account or an email address?",
        a: "No. There is no account and no email. Your answers are saved only on your own device, and you can erase them anytime with one click.",
      },
      {
        q: "Is this part of a bigger framework?",
        a: "It points you to the tool that fits your pattern. Every Branding Inward tool works on its own, and anything you make also collects quietly into your Inward Brief, one page that's yours to keep.",
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
        q: "Do I have to use the other tools first?",
        a: "No. Every Branding Inward tool works on its own, in any order. You can start right here.",
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
    slug: "photo-to-posts",
    step: 2,
    title: "Photo to Posts: one photo in, three posts out | Branding Inward",
    description:
      "Upload one photo of your work. The AI looks at what is actually in it and writes three posts in your voice, each one editable before you copy it. Free, no face required.",
    h1: "Photo to Posts",
    summary:
      "You never know what to say about your own work; the photo already says most of it. Upload one shot, of what you made, your workspace, your hands mid-process, and the AI looks at what is actually there and writes three posts around it in your voice: a small true story, a quiet caption, and a soft invite. Each one is editable right on the page before you copy it. No face required, no account, and the photo is read once and never stored.",
    faqs: [
      {
        q: "What kind of photo works?",
        a: "Anything real: the thing you made, your desk, a whiteboard you filled, your hands mid-process, even a short clip (it reads one frame). No face required. The AI only describes what is genuinely in the picture, it never invents details.",
      },
      {
        q: "Is my photo stored anywhere?",
        a: "No. The photo is downscaled on your own device, read once to write the posts, and never stored. There is no account and no email.",
      },
      {
        q: "Can I edit the posts before using them?",
        a: "Yes, that is the point. Each caption sits in an editable box on the page, so you tweak it until it sounds right, then copy it wherever you post.",
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
      "Everything the Branding Inward tools found about you, assembled on one page and emailed to you: your pattern, what you're about, your voice, and your first move.",
    h1: "Your Inward Brief",
    summary:
      "Everything the tools found about you, your pattern, what you're really about, your named voice, your chosen path, and your first move, assembled into one brief you can copy anywhere. It lives on your device only, and fills in from whichever tools you use, in any order.",
    faqs: [
      {
        q: "What is an Inward Brief?",
        a: "One page holding what the Branding Inward tools found: how you get stuck, what you're really about, your voice named, the path you chose, and a line worth keeping. It's your brand, written down, in your own words.",
      },
      {
        q: "Where is my brief stored?",
        a: "Your answers live only on your own device, in your browser's local storage. Leaving your email sends you the one-page brief and opens it on the page; the email is used for that send, nothing else unless you ask.",
      },
      {
        q: "Do I need to use all five tools?",
        a: "No. The brief fills in from whichever tools you've used, in any order, and each section links to the tool that produces it.",
      },
    ],
  },
  {
    slug: "ai-visibility",
    step: null,
    title: "The AI Visibility Audit: a live scan of how findable you are, then the words that fix it | Branding Inward",
    description:
      "AI search can't hear volume, only clarity. This free tool runs a few real web searches about your brand, reads your site, scores your findability out of 100, and writes the kit that raises it. No email.",
    h1: "The AI Visibility Audit",
    summary:
      "People now ask AI assistants for recommendations the way they used to ask a friend, and the engines can't tell who's loudest, only who's clearest. This free audit actually goes and looks: it runs real web searches on your actual name the way a stranger would, reads your website if you share one, and shows you where you surface, with the receipts first, then scores the five quiet signals answer engines actually check. Then it writes the findability kit that raises the score: an anchor paragraph for your About page, one bio sentence to use identically everywhere, and three quotable answers, all in your own words. Not one signal requires posting, performing, or showing your face. The other tools build your brand; this one makes it findable.",
    faqs: [
      {
        q: "What does the AI visibility audit actually do?",
        a: "You give your name, one sentence about what you do, and optionally your site, and the tool runs a light live scan: real web searches about your actual name, plus a read of your website. It returns a findability score out of 100 with a band (Unseen, A faint trace, Coming into view, or Found), the evidence it found, the five-signal breakdown, and then writes your findability kit: an anchor paragraph, one bio sentence, and three quotable answers, ready to paste.",
      },
      {
        q: "Is this a real live scan or an AI guess?",
        a: "A real, light one. The tool performs actual web searches and actually fetches your site, and every claim in the results traces to something it found. It is still a light audit, not an exhaustive one: the web is bigger than a handful of searches, and different AI assistants may know more or less than the live web.",
      },
      {
        q: "How is this different from other AI visibility checkers?",
        a: "Most tools grade you and hand you a to-do list. This one shows you the receipts from a real scan and then writes the actual words: the About paragraph, the bio sentence, the FAQ answers, built only from facts you gave it and what the scan found, in your voice. If you've used the other tools, it borrows the voice and story already saved on your device.",
      },
      {
        q: "Do I have to give my email to see my results?",
        a: "No. The score, the evidence, the breakdown, and the full kit appear right on the page. No account, no email, and nothing you type is saved.",
      },
    ],
  },
  {
    slug: "work-with-me",
    step: null,
    title: "Work with me | Branding Inward",
    description:
      "A small number of engagements at a time: positioning for one person, and workshops for groups who need to be visible without turning into content machines.",
    h1: "Work with me",
    summary:
      "I take a small number of engagements at a time. Positioning for one person, and workshops for groups who need to be visible without turning into content machines. Write to me at safrin@brandinginward.com.",
    faqs: [
      {
        q: "What kind of engagements does Branding Inward take?",
        a: "Two kinds: one-on-one positioning work for a single person, and workshops for groups, departments, and teams who need to be visible without turning into content machines.",
      },
      {
        q: "How do I get in touch?",
        a: "Write to safrin@brandinginward.com. Engagements are limited to a small number at a time.",
      },
    ],
  },
  {
    slug: "buddy",
    step: null,
    title: "Find a hype buddy | Branding Inward",
    description:
      "Get matched one-to-one with another quiet professional to cheer each other's work, swap endorsements, and nudge each other to actually press post. No group, no community. One person.",
    h1: "Find a hype buddy",
    summary:
      "Quiet people don't need a critic, they need one person in their corner. Get matched with one other quiet professional, introduced personally, to cheer each other's work, celebrate the small wins, swap endorsements where you vouch for each other, and nudge each other to actually press post. No group to keep up with, no community obligations. One person, matched by a real human.",
    faqs: [
      {
        q: "How does the hype buddy matching work?",
        a: "You leave your name, email, and a line about what you make. Sabiha Afrin matches you personally with one other person whose work and temperament fit, and introduces you by email. No algorithm, no group chat.",
      },
      {
        q: "What do buddies actually do?",
        a: "Whatever you agree on: cheer each other's posts, swap endorsements where you vouch for each other's work, celebrate small wins, or just have coffee with someone who gets it.",
      },
    ],
  },
  {
    slug: "about",
    step: null,
    title: "About: the strategist behind Branding Inward",
    description:
      "Branding Inward is a brand strategist's free toolkit for people who find self-promotion draining: five tools to get found without performing.",
    h1: "About Branding Inward",
    summary:
      "Branding Inward is built by Sabiha Afrin, a brand strategist. The framework, the questions, and the research behind every tool are hers; the AI is just what hands it to you in three minutes, for free. It exists for people who want to be known for their work without performing for it.",
    faqs: [
      {
        q: "Who makes Branding Inward?",
        a: "Sabiha Afrin, a brand strategist. The framework and every question in the tools come from her practice and research into consumer psychology.",
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
