// unslop — Main App

const CLEAN_API_URL = "https://unslop-eight.vercel.app/api/clean";

const analyzer = new SlopAnalyzer();

// DOM elements
const inputText = document.getElementById("input-text");
const analyzeBtn = document.getElementById("analyze-btn");
const cleanBtn = document.getElementById("clean-btn");
const clearBtn = document.getElementById("clear-btn");
const exampleBtn = document.getElementById("example-btn");
const scoreCard = document.getElementById("score-card");
const scoreCircle = document.getElementById("score-circle");
const scoreNumber = document.getElementById("score-number");
const scoreVerdict = document.getElementById("score-verdict");
const scoreStats = document.getElementById("score-stats");
const breakdownBars = document.getElementById("breakdown-bars");
const highlightedText = document.getElementById("highlighted-text");
const cleanResult = document.getElementById("clean-result");
const cleanedText = document.getElementById("cleaned-text");
const shareBtn = document.getElementById("share-btn");
const copyCleanBtn = document.getElementById("copy-clean-btn");
const toast = document.getElementById("toast");

// Analyze
analyzeBtn.addEventListener("click", () => {
    const text = inputText.value.trim();
    if (!text) return;

    const results = analyzer.analyze(text);
    if (!results) return;

    displayResults(text, results);
});

// Keyboard shortcut
inputText.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        analyzeBtn.click();
    }
});

// Deep Clean
cleanBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();
    if (!text) return;

    // Analyze first if not done
    if (!analyzer.results) {
        const results = analyzer.analyze(text);
        if (results) displayResults(text, results);
    }

    cleanBtn.disabled = true;
    cleanBtn.textContent = "Cleaning...";

    try {
        const res = await fetch(CLEAN_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `API error ${res.status}`);
        }

        const data = await res.json();
        cleanedText.textContent = data.cleaned;
        cleanResult.classList.remove("hidden");
    } catch (err) {
        cleanedText.textContent = `Error: ${err.message}. The Deep Clean API may be unavailable.`;
        cleanResult.classList.remove("hidden");
    } finally {
        cleanBtn.disabled = false;
        cleanBtn.textContent = "Deep Clean";
    }
});

// Clear
clearBtn.addEventListener("click", () => {
    inputText.value = "";
    scoreCard.classList.add("hidden");
    cleanResult.classList.add("hidden");
    analyzer.results = null;
});

// Load Example
exampleBtn.addEventListener("click", () => {
    inputText.value = EXAMPLE_TEXT;
    scoreCard.classList.add("hidden");
    cleanResult.classList.add("hidden");
    analyzer.results = null;
});

// Share
shareBtn.addEventListener("click", () => {
    const shareText = analyzer.generateShareText();
    navigator.clipboard.writeText(shareText).then(() => showToast("Copied to clipboard!"));
});

// Copy cleaned text
copyCleanBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(cleanedText.textContent).then(() => showToast("Copied!"));
});

function displayResults(text, results) {
    scoreCard.classList.remove("hidden");
    cleanResult.classList.add("hidden");

    // Animate score
    animateScore(results.score);

    // Verdict
    const verdict = analyzer.getVerdict(results.score);
    scoreVerdict.textContent = verdict.text;
    scoreVerdict.className = `score-verdict ${verdict.class}`;

    // Stats
    scoreStats.innerHTML =
        `<span>${results.wordCount} words</span>` +
        `<span>${results.matches.length} detections</span>` +
        `<span>${results.density}% density</span>`;

    // Breakdown bars
    const maxCount = Math.max(results.phraseCount, results.structureCount, results.hedgeCount, 1);
    breakdownBars.innerHTML = `
        <div class="bar-row">
            <span class="bar-label">Slop phrases</span>
            <div class="bar-track">
                <div class="bar-fill bar-phrase" style="width: ${(results.phraseCount / maxCount) * 100}%"></div>
            </div>
            <span class="bar-count">${results.phraseCount}</span>
        </div>
        <div class="bar-row">
            <span class="bar-label">Structure issues</span>
            <div class="bar-track">
                <div class="bar-fill bar-structure" style="width: ${(results.structureCount / maxCount) * 100}%"></div>
            </div>
            <span class="bar-count">${results.structureCount}</span>
        </div>
        <div class="bar-row">
            <span class="bar-label">Hedges</span>
            <div class="bar-track">
                <div class="bar-fill bar-hedge" style="width: ${(results.hedgeCount / maxCount) * 100}%"></div>
            </div>
            <span class="bar-count">${results.hedgeCount}</span>
        </div>
        <div class="bar-row">
            <span class="bar-label">Sentence uniformity</span>
            <div class="bar-track">
                <div class="bar-fill bar-uniformity" style="width: ${results.sentenceUniformity}%"></div>
            </div>
            <span class="bar-count">${results.sentenceUniformity}%</span>
        </div>
    `;

    // Highlighted text
    highlightedText.innerHTML = analyzer.generateHighlightedHTML(text);
}

function animateScore(target) {
    const duration = 600;
    const start = performance.now();
    const startVal = 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(startVal + (target - startVal) * eased);

        scoreNumber.textContent = current;
        updateScoreColor(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateScoreColor(score) {
    let hue;
    if (score <= 20) hue = 142; // green
    else if (score <= 40) hue = 80; // yellow-green
    else if (score <= 60) hue = 45; // yellow-orange
    else if (score <= 80) hue = 20; // orange
    else hue = 0; // red

    scoreCircle.style.borderColor = `hsl(${hue}, 80%, 50%)`;
    scoreNumber.style.color = `hsl(${hue}, 80%, 50%)`;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2000);
}
