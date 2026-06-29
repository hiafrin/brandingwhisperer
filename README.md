# The Marketing Whisperer

Your live tool. Here's what each part is, in plain language:

- `src/App.jsx` — the tool itself: the questions, the cards, the design.
- `api/generate.js` — the small backend that safely holds your secret key and talks to Claude.
- everything else — the scaffolding that turns it into a real website.

## What's left to do (Steps 3 and 4)

You've uploaded these files to GitHub. Next:

1. Go to vercel.com and sign in with your GitHub account.
2. Click "Add New… → Project," pick this repository, and click "Deploy."
3. Once it's deploying, go to the project's "Settings → Environment Variables."
4. Add one variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key
5. Save, then redeploy (Deployments tab → the "…" menu → Redeploy).

That's it — your site will be live at a free `.vercel.app` address.

## The one cost

Each time someone uses the tool, it makes a small paid AI call billed to your Anthropic account. At small scale this is pennies.
