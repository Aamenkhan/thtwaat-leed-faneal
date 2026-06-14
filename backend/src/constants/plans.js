export const PLAN_CATEGORIES = Object.freeze([
  { id: 'starter', label: 'Starter', emoji: '⚡' },
  { id: 'build', label: 'Build & Launch', emoji: '🚀' },
  { id: 'marketing', label: 'SEO & Marketing', emoji: '📈' },
  { id: 'custom', label: 'Custom Dev', emoji: '🛠️' },
  { id: 'ai', label: 'AI Products', emoji: '🧠' },
  { id: 'enterprise', label: 'Enterprise', emoji: '🏢' },
]);

export const PAYMENT_PLANS = Object.freeze({
  'website-start': {
    id: 'website-start',
    name: 'Website Start',
    amount: 9900,
    delivery: '3–5 days',
    category: 'starter',
    tagline: 'Launch your first business website fast.',
    emoji: '🌐',
  },
  'landing-page-marketing': {
    id: 'landing-page-marketing',
    name: 'Landing Page Marketing',
    amount: 9900,
    delivery: '2–4 days',
    category: 'starter',
    tagline: 'High-converting landing page for ads & leads.',
    emoji: '🎯',
  },
  'app-start': {
    id: 'app-start',
    name: 'App Start Package',
    amount: 99900,
    delivery: '7–14 days',
    category: 'starter',
    tagline: 'MVP mobile app starter — Android ready.',
    emoji: '📱',
  },
  'web-app': {
    id: 'web-app',
    name: 'Web App',
    amount: 99900,
    delivery: '7–14 days',
    category: 'build',
    tagline: 'Interactive web application with auth & dashboard.',
    emoji: '💻',
  },
  'saas-build': {
    id: 'saas-build',
    name: 'SaaS Build',
    amount: 99900,
    delivery: '14–21 days',
    category: 'build',
    tagline: 'Multi-tenant SaaS foundation with billing hooks.',
    emoji: '☁️',
  },
  'app-seo': {
    id: 'app-seo',
    name: 'App SEO',
    amount: 99900,
    delivery: 'monthly',
    category: 'marketing',
    tagline: 'ASO + Play Store optimization for your app.',
    emoji: '🔍',
  },
  'website-seo': {
    id: 'website-seo',
    name: 'Website SEO',
    amount: 99900,
    delivery: 'monthly',
    category: 'marketing',
    tagline: 'On-page SEO, indexing & local search growth.',
    emoji: '📊',
  },
  'app-marketing': {
    id: 'app-marketing',
    name: 'App Marketing',
    amount: 99900,
    delivery: 'monthly',
    category: 'marketing',
    tagline: 'User acquisition campaigns for mobile apps.',
    emoji: '📣',
  },
  'website-marketing': {
    id: 'website-marketing',
    name: 'Website Marketing',
    amount: 99900,
    delivery: 'monthly',
    category: 'marketing',
    tagline: 'Google & Meta ads to drive website leads.',
    emoji: '📢',
  },
  'ai-automation': {
    id: 'ai-automation',
    name: 'AI Automation',
    amount: 99900,
    delivery: '5–10 days',
    category: 'build',
    tagline: 'Automate workflows with AI — save hours daily.',
    emoji: '🤖',
  },
  'whatsapp-automation': {
    id: 'whatsapp-automation',
    name: 'WhatsApp Automation (Custom)',
    amount: 99900,
    delivery: '5–10 days',
    category: 'build',
    tagline: 'Custom WhatsApp bot + lead capture flows.',
    emoji: '💬',
  },
  'custom-app': {
    id: 'custom-app',
    name: 'Custom App',
    amount: 999900,
    delivery: '21–30 days',
    category: 'custom',
    tagline: 'Fully tailored mobile app for your business.',
    emoji: '📲',
  },
  'custom-website': {
    id: 'custom-website',
    name: 'Custom Website',
    amount: 999900,
    delivery: '7–14 days',
    category: 'custom',
    tagline: 'Brand-first website built around your goals.',
    emoji: '🖥️',
  },
  'ai-bot': {
    id: 'ai-bot',
    name: 'AI Bot',
    amount: 999900,
    delivery: '10–14 days',
    category: 'custom',
    tagline: 'Smart chatbot trained on your business data.',
    emoji: '🤖',
  },
  'ai-integration': {
    id: 'ai-integration',
    name: 'AI Integration (App + Website)',
    amount: 999900,
    delivery: '14–21 days',
    category: 'custom',
    tagline: 'Embed AI features across app and web.',
    emoji: '🔗',
  },
  'ai-app': {
    id: 'ai-app',
    name: 'AI App',
    amount: 9999900,
    delivery: '30–45 days',
    category: 'ai',
    tagline: 'AI-native mobile product with custom models.',
    emoji: '🧠',
  },
  'ai-web-app': {
    id: 'ai-web-app',
    name: 'AI Web App',
    amount: 9999900,
    delivery: '30–45 days',
    category: 'ai',
    tagline: 'AI-powered web platform with dashboards.',
    emoji: '✨',
  },
  'ai-llm-project': {
    id: 'ai-llm-project',
    name: 'AI LLM Project',
    amount: 99999900,
    delivery: '45–60 days',
    category: 'ai',
    tagline: 'Custom LLM pipeline, RAG & knowledge systems.',
    emoji: '🔬',
  },
  'ai-model-training': {
    id: 'ai-model-training',
    name: 'AI Model Training & Fine-tune',
    amount: 199999900,
    delivery: '30–60 days',
    category: 'ai',
    tagline: 'Train and fine-tune models on your data.',
    emoji: '⚙️',
  },
  'ai-ide-saas': {
    id: 'ai-ide-saas',
    name: 'AI IDE SaaS',
    amount: 999999900,
    delivery: '60–90 days',
    category: 'ai',
    tagline: 'Full AI developer IDE platform as a service.',
    emoji: '💡',
  },
  'founder-environment': {
    id: 'founder-environment',
    name: 'Founder Environment Creator',
    amount: 49999900,
    delivery: '14–21 days',
    category: 'enterprise',
    tagline: 'Complete dev, cloud & AI stack for founders.',
    emoji: '🏗️',
  },
  'full-ecosystem': {
    id: 'full-ecosystem',
    name: 'Full Ecosystem — Start to End',
    amount: 1499999900,
    delivery: '90–180 days',
    category: 'enterprise',
    tagline: 'End-to-end product ecosystem — app, web, AI, ops.',
    emoji: '🌍',
  },
});

/** Old checkout links still work */
export const LEGACY_PLAN_ALIASES = Object.freeze({
  'mobile-app': 'app-start',
  website: 'website-start',
  'ai-llm': 'ai-llm-project',
  'digital-marketing': 'website-marketing',
});

export function resolvePlanId(planId) {
  const id = String(planId || '').trim();
  if (PAYMENT_PLANS[id]) return id;
  return LEGACY_PLAN_ALIASES[id] || id;
}

export function getPlanById(planId) {
  const resolved = resolvePlanId(planId);
  return PAYMENT_PLANS[resolved] || null;
}

export function listPlans() {
  return Object.values(PAYMENT_PLANS).map(
    ({ id, name, amount, delivery, category, tagline, emoji }) => ({
      id,
      name,
      amount,
      delivery,
      category,
      tagline,
      emoji,
      displayAmount: `₹${(amount / 100).toLocaleString('en-IN')}`,
    }),
  );
}

export function listCategories() {
  return PLAN_CATEGORIES.map((cat) => ({
    ...cat,
    count: Object.values(PAYMENT_PLANS).filter((p) => p.category === cat.id).length,
  }));
}
