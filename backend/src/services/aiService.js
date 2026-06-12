import OpenAI from 'openai';
import { env } from '../config/env.js';
import { LEAD_CATEGORIES } from '../constants/sources.js';
import { logger } from '../utils/logger.js';

let client = null;
let activeProvider = null;

function getClient() {
  if (client) {
    return client;
  }

  if (env.deepseekApiKey) {
    client = new OpenAI({
      apiKey: env.deepseekApiKey,
      baseURL: env.deepseekBaseUrl,
    });
    activeProvider = 'deepseek';
    return client;
  }

  if (env.openaiApiKey) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
    activeProvider = 'openai';
    return client;
  }

  return null;
}

function getModel() {
  if (env.deepseekApiKey) {
    return env.deepseekModel;
  }
  return env.openaiModel;
}

const SYSTEM_PROMPT = `You analyze inbound sales leads for THTWAAT, an Indian technology company offering mobile apps, websites, SaaS, AI automation, and digital marketing.

Return ONLY valid JSON with this shape:
{
  "category": "<one category>",
  "score": <integer 0-100>,
  "summary": "<2-3 sentence lead summary>"
}

Allowed categories: ${LEAD_CATEGORIES.join(', ')}

Scoring guide:
- 80-100: clear budget/timeline, ready to buy
- 50-79: genuine interest, needs follow-up
- 20-49: vague inquiry or student/research
- 0-19: spam or irrelevant`;

function fallbackAnalysis(message, source) {
  const text = String(message || '').toLowerCase();
  let category = 'General Inquiry';
  let score = 35;

  if (/app|flutter|android|ios|play store/.test(text)) {
    category = 'Mobile App';
    score = 55;
  } else if (/website|landing page|seo/.test(text)) {
    category = 'Website';
    score = 50;
  } else if (/saas|dashboard|web app|portal/.test(text)) {
    category = 'Web App / SaaS';
    score = 58;
  } else if (/ai|automation|bot|whatsapp bot|llm|gpt/.test(text)) {
    category = /llm|gpt|rag|model/.test(text) ? 'AI / LLM' : 'AI Automation';
    score = 60;
  } else if (/marketing|ads|google ads|meta ads/.test(text)) {
    category = 'Digital Marketing';
    score = 48;
  } else if (/merchant|shop|kirana|store|vendor/.test(text)) {
    category = 'Merchant';
    score = 52;
  } else if (/rider|delivery partner|driver/.test(text)) {
    category = 'Rider';
    score = 45;
  } else if (/customer|user app|download app/.test(text)) {
    category = 'Customer';
    score = 40;
  }

  if (source === 'Direct WhatsApp Chat' || source === 'WhatsApp Channel') {
    score += 5;
  }

  return {
    category,
    score: Math.min(score, 100),
    summary: `Inbound ${source} lead. Message intent appears related to ${category}. Follow up on WhatsApp within 2 hours.`,
  };
}

function parseAiResponse(content) {
  const raw = String(content || '').trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI response was not valid JSON');
  }
}

export async function analyzeLead({ name, phone, email, message, source }) {
  const aiClient = getClient();

  if (!aiClient) {
    logger.warn('No AI provider configured, using fallback lead analysis');
    return fallbackAnalysis(message, source);
  }

  const userPrompt = [
    `Name: ${name || 'Unknown'}`,
    `Phone: ${phone || 'Unknown'}`,
    `Email: ${email || 'Not provided'}`,
    `Source: ${source}`,
    `Message: ${message}`,
  ].join('\n');

  try {
    const response = await aiClient.chat.completions.create({
      model: getModel(),
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const parsed = parseAiResponse(content);

    const category = LEAD_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'General Inquiry';

    const score = Number.isFinite(Number(parsed.score))
      ? Math.max(0, Math.min(100, Math.round(Number(parsed.score))))
      : 40;

    const summary = String(parsed.summary || '').trim() || fallbackAnalysis(message, source).summary;

    logger.info('Lead analyzed with AI', { provider: activeProvider, category, score });

    return { category, score, summary };
  } catch (error) {
    logger.error(`${activeProvider || 'AI'} analysis failed, using fallback`, { error: error.message });
    return fallbackAnalysis(message, source);
  }
}

export function formatAiSummary(category, summary) {
  return `[Category: ${category}] ${summary}`;
}

export function getAiProvider() {
  if (env.deepseekApiKey) return 'deepseek';
  if (env.openaiApiKey) return 'openai';
  return 'fallback';
}
