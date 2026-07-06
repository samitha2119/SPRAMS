const Anthropic = require('@anthropic-ai/sdk');

const logger = require('../utils/logger');

let client = null;

const keywordCache = new Map();

const isAIConfigured = () => {
    return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here');
};

const getClient = () => {
    if (!isAIConfigured()) {
        logger.warn('ANTHROPIC_API_KEY is not configured. AI features are disabled.');
        return null;
    }
    if (!client) {
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
};

const MODEL = 'claude-3-5-sonnet-20240620';

/**
 * Generate a concise 3–5 sentence plain-English summary of research entry
 */
const generateResearchSummary = async (title, description) => {
    const anthropic = getClient();
    if (!anthropic) {
        throw new Error('AI features are currently unavailable (API key not configured)');
    }
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [
            {
                role: 'user',
                content: `You are an academic research summarizer. Generate a concise 3–5 sentence plain-English summary of the following research entry. The summary should be accessible to non-specialists while remaining accurate.

Research Title: ${title}

Research Description: ${description}

Provide only the summary paragraph, no headings or extra formatting.`,
            },
        ],
    });

    return message.content[0]?.text?.trim() || null;
};

/**
 * Improve project abstract with academic tone
 */
const improveAbstract = async (abstract) => {
    const anthropic = getClient();
    if (!anthropic) {
        throw new Error('AI features are currently unavailable (API key not configured)');
    }
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: `You are an academic writing assistant. Rewrite the following project abstract to improve its academic tone, clarity, and structure. The rewritten abstract should:
- Use formal academic language
- Be well-structured with clear sentences
- Highlight the problem, methodology, and expected outcomes
- Be concise (150–300 words)
- Maintain the original meaning and research intent

Original Abstract:
${abstract}

Provide only the improved abstract, no explanations or additional commentary.`,
            },
        ],
    });

    return message.content[0]?.text?.trim() || null;
};

/**
 * Expand search query with 3 related keywords
 */
const expandSearchQuery = async (query) => {
    const normalizedQuery = query.toLowerCase().trim();
    if (keywordCache.has(normalizedQuery)) {
        return keywordCache.get(normalizedQuery);
    }

    const anthropic = getClient();
    if (!anthropic) return [];

    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 200,
        messages: [
            {
                role: 'user',
                content: `You are a search assistant for an academic archive system. The user is searching for: "${query}"

Suggest exactly 3 related academic keywords or phrases that would help broaden the search results. These should be closely related to the original query.

Return ONLY a JSON array with exactly 3 strings, like this:
["keyword1", "keyword2", "keyword3"]

No explanations, just the JSON array.`,
            },
        ],
    });

    try {
        const responseText = message.content[0]?.text?.trim() || '[]';
        const keywords = JSON.parse(responseText);
        const result = Array.isArray(keywords) ? keywords.slice(0, 3) : [];

        // Simple cache cleanup
        if (keywordCache.size > 100) {
            const firstKey = keywordCache.keys().next().value;
            keywordCache.delete(firstKey);
        }
        keywordCache.set(normalizedQuery, result);

        return result;
    } catch {
        return [];
    }
};

/**
 * Generate a complete project abstract from basic keywords and context
 */
const generateAbstract = async (title, keywords, department) => {
    const anthropic = getClient();
    if (!anthropic) {
        throw new Error('AI features are currently unavailable (API key not configured)');
    }
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: `You are an academic writing assistant. Generate a professional, high-quality project abstract (200-300 words) based on the following information:

Project Title: ${title}
Keywords/Key Points: ${keywords}
Department: ${department}

The abstract should follow standard academic structure: Problem statement, Methodology, Key findings/Expected outcomes, and Significance.`,
            },
        ],
    });

    return message.content[0]?.text?.trim() || null;
};

/**
 * Suggest 5 alternative catchy yet professional titles for a project
 */
const suggestTitles = async (abstract, currentTitle) => {
    const anthropic = getClient();
    if (!anthropic) {
        throw new Error('AI features are currently unavailable (API key not configured)');
    }
    const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [
            {
                role: 'user',
                content: `Based on the following project abstract, suggest 5 professional and engaging alternative titles.

Original Title: ${currentTitle}
Abstract: ${abstract}

Return ONLY a JSON array of strings containing exactly 5 suggestions.`,
            },
        ],
    });

    try {
        const responseText = message.content[0]?.text?.trim() || '[]';
        const titles = JSON.parse(responseText);
        return Array.isArray(titles) ? titles.slice(0, 5) : [];
    } catch {
        return [];
    }
};

module.exports = { 
    isAIConfigured,
    generateResearchSummary, 
    improveAbstract, 
    expandSearchQuery, 
    generateAbstract, 
    suggestTitles 
};
