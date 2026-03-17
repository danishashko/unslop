# unslop

**How sloppy is your AI text?**

Paste any AI-generated text and instantly see how much slop it contains. Detects 250+ AI-isms, filler phrases, structural patterns, and robotic hedging. Optionally rewrites it to sound human.

**Live:** [danishashko.github.io/unslop](https://danishashko.github.io/unslop/)

## What it does

**Analyze** (free, instant, client-side):
- Scores text 0-100 on a "Slop Score"
- Highlights every detected AI-ism with color-coded categories
- Breaks down: slop phrases, structural patterns, hedges, sentence uniformity
- Shareable score card

**Deep Clean** (LLM-powered via Vercel):
- Rewrites text to remove all AI traces
- Uses an explicit banned word list (80+ words the LLM cannot use)
- Enforces structural rules: no em dashes, no transition-word openers, varied sentence lengths
- Output scores 0/100 on our own detector

## Detection categories

| Category | What it catches | Examples |
|----------|----------------|----------|
| **Slop phrases** | Multi-word AI filler | "it's important to note", "let's dive in", "I hope this helps" |
| **Slop words** | Overused AI vocabulary | delve, leverage, tapestry, multifaceted, robust, seamless |
| **Structure** | Formulaic AI patterns | However-Moreover chains, "In today's rapidly evolving...", generic list intros |
| **Hedges** | Weak qualifiers that add up | perhaps, arguably, generally, "in many cases" |
| **Uniformity** | Suspiciously even sentence lengths | AI writes sentences that are all ~the same word count |

## How it works

The scoring engine runs entirely in the browser using regex matching and statistical analysis. No data leaves your machine for the Analyze function.

Deep Clean sends your text to a Vercel serverless function that calls Kimi K2.5 via OpenRouter with a strict system prompt containing:
- 80+ explicitly banned words
- Banned phrases to delete (not rephrase)
- Banned structural patterns
- Style rules enforcing plain, direct human writing

## Stack

- **Frontend:** Static HTML/CSS/JS on GitHub Pages (zero build step)
- **API:** Vercel serverless function (Node.js)
- **LLM:** Kimi K2.5 via OpenRouter

## Run locally

Just open `index.html` in a browser. The Analyze function works offline.

For Deep Clean, you need the Vercel function running:

```bash
cd unslop
vercel dev
```

Set `OPENROUTER_API_KEY` in your Vercel environment.

## Sources

Slop dictionary compiled from:
- [Embryo — List of words AI overuses](https://embryo.com/blog/list-words-ai-overuses/) (300+ words)
- [Reddit — Crowdsourced ChatGPT overused words](https://www.reddit.com/r/ChatGPTPromptGenius/comments/1dphlga/) (100+ words)
- [Wikipedia — Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [Pangram Labs — How to detect AI writing](https://www.pangram.com/blog/how-to-detect-ai-writing)
- [GPTHuman — Common AI words to avoid](https://gpthuman.ai/common-ai-words-to-avoid-if-you-want-to-bypass-ai-detectors/)

## License

MIT

---

Built by [Daniel Shashko](https://www.linkedin.com/in/daniel-shashko/)
