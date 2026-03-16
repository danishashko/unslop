// unslop — Client-side Slop Analyzer

class SlopAnalyzer {
    constructor() {
        this.results = null;
    }

    analyze(text) {
        if (!text.trim()) return null;

        const matches = [];
        const textLower = text.toLowerCase();
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        // 1. Phrase + word matching (combined list)
        for (const phrase of ALL_SLOP_ITEMS) {
            const phraseLower = phrase.toLowerCase();
            let searchText = textLower;
            let offset = 0;

            while (true) {
                const idx = searchText.indexOf(phraseLower);
                if (idx === -1) break;

                // Check word boundaries for single words
                const globalIdx = offset + idx;
                const before = globalIdx > 0 ? text[globalIdx - 1] : ' ';
                const after = globalIdx + phrase.length < text.length ? text[globalIdx + phrase.length] : ' ';
                const isWordBoundary = /[\s,.!?;:'"()\-—\n]/.test(before) || globalIdx === 0;
                const isWordBoundaryEnd = /[\s,.!?;:'"()\-—\n]/.test(after) || (globalIdx + phrase.length) === text.length;

                if (isWordBoundary && isWordBoundaryEnd) {
                    matches.push({
                        start: globalIdx,
                        end: globalIdx + phrase.length,
                        text: text.substring(globalIdx, globalIdx + phrase.length),
                        category: "phrase",
                        weight: phrase.split(/\s+/).length >= 3 ? 3 : 2,
                    });
                }

                offset += idx + phrase.length;
                searchText = textLower.substring(offset);
            }
        }

        // 2. Pattern matching
        for (const pattern of SLOP_PATTERNS) {
            let match;
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    category: "structure",
                    label: pattern.label,
                    weight: 3,
                });
            }
        }

        // 3. Hedge word matching
        for (const hedge of HEDGE_WORDS) {
            const hedgeLower = hedge.toLowerCase();
            let searchText = textLower;
            let offset = 0;

            while (true) {
                const idx = searchText.indexOf(hedgeLower);
                if (idx === -1) break;

                const globalIdx = offset + idx;
                const before = globalIdx > 0 ? text[globalIdx - 1] : ' ';
                const after = globalIdx + hedge.length < text.length ? text[globalIdx + hedge.length] : ' ';
                const isWordBoundary = /[\s,.!?;:'"()\-—\n]/.test(before) || globalIdx === 0;
                const isWordBoundaryEnd = /[\s,.!?;:'"()\-—\n]/.test(after) || (globalIdx + hedge.length) === text.length;

                if (isWordBoundary && isWordBoundaryEnd) {
                    matches.push({
                        start: globalIdx,
                        end: globalIdx + hedge.length,
                        text: text.substring(globalIdx, globalIdx + hedge.length),
                        category: "hedge",
                        weight: 1,
                    });
                }

                offset += idx + hedge.length;
                searchText = textLower.substring(offset);
            }
        }

        // 4. Sentence uniformity check
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
        const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceLengths.length || 1);
        const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / (sentenceLengths.length || 1);
        const uniformityScore = Math.max(0, 1 - (Math.sqrt(variance) / avgLen));

        // 5. Deduplicate overlapping matches (keep longer/higher weight)
        const deduped = this._deduplicateMatches(matches);

        // 6. Calculate score
        const phraseWeight = deduped.filter(m => m.category === "phrase").reduce((s, m) => s + m.weight, 0);
        const structureWeight = deduped.filter(m => m.category === "structure").reduce((s, m) => s + m.weight, 0);
        const hedgeWeight = deduped.filter(m => m.category === "hedge").reduce((s, m) => s + m.weight, 0);

        const totalWeight = phraseWeight + structureWeight + hedgeWeight;

        // Normalize to 0-100 based on text length
        // ~1 slop hit per 20 words = moderate (50), per 10 words = heavy (80+)
        const density = (totalWeight / Math.max(wordCount, 1)) * 100;
        const uniformityPenalty = uniformityScore > 0.7 ? (uniformityScore - 0.7) * 30 : 0;
        const rawScore = Math.min(100, density * 5 + uniformityPenalty);
        const score = Math.round(rawScore);

        this.results = {
            score,
            matches: deduped,
            wordCount,
            phraseCount: deduped.filter(m => m.category === "phrase").length,
            structureCount: deduped.filter(m => m.category === "structure").length,
            hedgeCount: deduped.filter(m => m.category === "hedge").length,
            sentenceUniformity: Math.round(uniformityScore * 100),
            density: Math.round(density * 10) / 10,
        };

        return this.results;
    }

    _deduplicateMatches(matches) {
        // Sort by start position, then by length descending
        matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

        const result = [];
        for (const match of matches) {
            const overlaps = result.some(existing =>
                match.start < existing.end && match.end > existing.start
            );
            if (!overlaps) {
                result.push(match);
            }
        }
        return result;
    }

    getVerdict(score) {
        if (score >= 80) return { text: "Weapons-grade slop", emoji: "biohazard", class: "verdict-extreme" };
        if (score >= 60) return { text: "Unmistakably AI", emoji: "robot", class: "verdict-high" };
        if (score >= 40) return { text: "Suspiciously smooth", emoji: "eyes", class: "verdict-medium" };
        if (score >= 20) return { text: "Slightly synthetic", emoji: "test_tube", class: "verdict-low" };
        return { text: "Looks human", emoji: "check", class: "verdict-clean" };
    }

    generateHighlightedHTML(text) {
        if (!this.results) return text;

        const matches = [...this.results.matches].sort((a, b) => a.start - b.start);
        let html = '';
        let lastIdx = 0;

        for (const match of matches) {
            // Add text before this match
            if (match.start > lastIdx) {
                html += this._escapeHtml(text.substring(lastIdx, match.start));
            }

            const tooltip = match.label || match.category;
            html += `<mark class="slop-${match.category}" title="${this._escapeHtml(tooltip)}">${this._escapeHtml(match.text)}</mark>`;
            lastIdx = match.end;
        }

        // Add remaining text
        if (lastIdx < text.length) {
            html += this._escapeHtml(text.substring(lastIdx));
        }

        return html;
    }

    generateShareText() {
        if (!this.results) return '';
        const verdict = this.getVerdict(this.results.score);
        return `Slop Score: ${this.results.score}/100 — "${verdict.text}"\n` +
            `${this.results.phraseCount} slop phrases, ${this.results.structureCount} structural patterns, ${this.results.hedgeCount} hedges\n` +
            `Analyzed ${this.results.wordCount} words\n\n` +
            `Check your AI text: https://danishashko.github.io/unslop/`;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
