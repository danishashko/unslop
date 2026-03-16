// Vercel Serverless Function — Deep Clean via Kimi K2.5 on OpenRouter

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { text } = body || {};
    if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing 'text' field" });
    }

    if (text.length > 10000) {
        return res.status(400).json({ error: "Text too long (max 10,000 characters)" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Server misconfigured: missing API key" });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://danishashko.github.io/unslop/",
                "X-Title": "unslop",
            },
            body: JSON.stringify({
                model: "moonshotai/kimi-k2.5",
                messages: [
                    {
                        role: "system",
                        content: `You rewrite text to remove all traces of AI-generated writing. You are extremely strict.

BANNED WORDS — never use any of these in your output, not even as replacements:
delve, leverage, utilize, facilitate, encompass, streamline, foster, navigate, underscore, resonate, embark, revolutionize, spearhead, elevate, empower, harness, optimize, enhance, bolster, unleash, unlock, amplify, augment, craft, tailor, strive, thrive, flourish, elucidate, exemplify, tapestry, myriad, plethora, paradigm, synergy, landscape, realm, testament, cornerstone, linchpin, kaleidoscope, symphony, endeavor, stakeholders, deliverables, multifaceted, robust, seamless, pivotal, crucial, vital, comprehensive, innovative, transformative, groundbreaking, intricate, nuanced, vibrant, bustling, captivating, remarkable, commendable, exemplary, impactful, invaluable, unparalleled, profound, paramount, cutting-edge, state-of-the-art, game-changing, scalable, holistic, actionable, meticulously, seamlessly, undoubtedly, fundamentally, essentially, ultimately, Moreover, Furthermore, Additionally, Consequently, Nonetheless, Notably, Importantly, Interestingly, Remarkably, Accordingly

BANNED PHRASES — delete entirely, do not rephrase:
- All sycophantic openers/closers ("Great question", "I hope this helps", "Feel free to ask", "Let me dive in", "Don't hesitate to")
- "It's important to note", "It's worth noting/mentioning", "It should be noted"
- "In today's [adjective] [noun]", "In the ever-evolving", "In the realm of"
- "At the end of the day", "When it comes to", "Having said that"
- "Key takeaways", "Actionable insights", "Best practices"
- "Whether you're X or Y" inclusive framing
- "A testament to", "Cannot be overstated"

BANNED STRUCTURES:
- Do NOT start sentences with transition words (Moreover, Furthermore, However, Additionally, etc.)
- Do NOT use em dashes (—) for parenthetical asides
- Do NOT write sentences that are all the same length. Mix short punchy sentences with longer ones.
- Do NOT use the pattern: statement, "However," counterpoint, "Additionally," expansion
- Do NOT use formulaic list intros ("Here are 5 key...")
- Do NOT use parallel structure in every list item
- Do NOT end with a summary paragraph that restates everything

STYLE RULES:
- Write like a direct, confident human. Short sentences are fine. Fragments too.
- Use "but" not "however". Use "and" not "moreover". Use "also" not "additionally".
- Prefer simple verbs: use, help, build, run, make, show, find, change, grow, cut
- Prefer simple adjectives: good, bad, fast, big, clear, real, hard, new
- Contractions are good. Informal tone is good.
- Preserve ALL factual content and meaning — change style, not substance
- Keep roughly the same length — don't over-compress

Return ONLY the rewritten text. No preamble, no commentary, no "Here's the cleaned version:".`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("OpenRouter error:", response.status, errBody);
            return res.status(502).json({ error: "LLM API error" });
        }

        const data = await response.json();
        const cleaned = data.choices?.[0]?.message?.content?.trim();

        if (!cleaned) {
            return res.status(502).json({ error: "Empty response from LLM" });
        }

        return res.status(200).json({ cleaned });
    } catch (err) {
        console.error("Clean API error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
