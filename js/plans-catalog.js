/**
 * Shared service catalog for checkout & pricing (mirrors backend plans).
 */
(function () {
  const CATEGORIES = [
    { id: 'all', label: 'All Plans', emoji: '✨' },
    { id: 'starter', label: 'Starter', emoji: '⚡' },
    { id: 'build', label: 'Build', emoji: '🚀' },
    { id: 'marketing', label: 'Marketing', emoji: '📈' },
    { id: 'custom', label: 'Custom', emoji: '🛠️' },
    { id: 'ai', label: 'AI', emoji: '🧠' },
    { id: 'enterprise', label: 'Enterprise', emoji: '🏢' },
  ];

  const PLANS = [
    { id: 'project-chat-start', name: 'Start Chat About This Project', amount: 100, delivery: 'Instant', category: 'starter', tagline: 'Pay $1 to unlock direct project chat & priority reply.', emoji: '💬', feats: ['Direct team chat access', 'Discuss your project scope', 'Priority 2-hour response', '$1 credited toward build'] },
    { id: 'website-start', name: 'Website Start', amount: 9900, delivery: '3–5 days', category: 'starter', tagline: 'Launch your first business website fast.', emoji: '🌐', feats: ['Up to 5 pages', 'Mobile responsive', 'WhatsApp button', 'Basic SEO'] },
    { id: 'landing-page-marketing', name: 'Landing Page Marketing', amount: 9900, delivery: '2–4 days', category: 'starter', tagline: 'High-converting page for ads & leads.', emoji: '🎯', feats: ['Single landing page', 'Lead capture form', 'Ad-ready layout', 'Fast delivery'] },
    { id: 'app-start', name: 'App Start Package', amount: 99900, delivery: '7–14 days', category: 'starter', tagline: 'MVP mobile app starter — Android ready.', emoji: '📱', feats: ['Flutter MVP', 'Firebase backend', 'Core screens', 'Play Store ready'] },
    { id: 'web-app', name: 'Web App', amount: 99900, delivery: '7–14 days', category: 'build', tagline: 'Interactive web app with auth & dashboard.', emoji: '💻', feats: ['React / Next.js UI', 'User auth', 'Admin panel', 'API integration'] },
    { id: 'saas-build', name: 'SaaS Build', amount: 99900, delivery: '14–21 days', category: 'build', tagline: 'Multi-tenant SaaS foundation.', emoji: '☁️', feats: ['SaaS architecture', 'Billing hooks', 'User roles', 'Dashboard'] },
    { id: 'ai-automation', name: 'AI Automation', amount: 99900, delivery: '5–10 days', category: 'build', tagline: 'Automate workflows with AI.', emoji: '🤖', feats: ['Workflow automation', 'AI triggers', 'Integrations', 'Monitoring'] },
    { id: 'whatsapp-automation', name: 'WhatsApp Automation', amount: 99900, delivery: '5–10 days', category: 'build', tagline: 'Custom WhatsApp bot & lead flows.', emoji: '💬', feats: ['Meta Cloud API', 'Auto-replies', 'Lead capture', 'CRM sync'] },
    { id: 'app-seo', name: 'App SEO', amount: 99900, delivery: 'monthly', category: 'marketing', tagline: 'ASO & Play Store optimization.', emoji: '🔍', feats: ['Keyword research', 'Store listing', 'Ratings strategy', 'Monthly report'] },
    { id: 'website-seo', name: 'Website SEO', amount: 99900, delivery: 'monthly', category: 'marketing', tagline: 'On-page SEO & local search growth.', emoji: '📊', feats: ['Technical SEO', 'Content plan', 'Google indexing', 'Analytics'] },
    { id: 'app-marketing', name: 'App Marketing', amount: 99900, delivery: 'monthly', category: 'marketing', tagline: 'User acquisition for mobile apps.', emoji: '📣', feats: ['Ad campaigns', 'Install tracking', 'Creative assets', 'ROI reports'] },
    { id: 'website-marketing', name: 'Website Marketing', amount: 99900, delivery: 'monthly', category: 'marketing', tagline: 'Google & Meta ads for website leads.', emoji: '📢', feats: ['Google Ads', 'Meta Ads', 'Landing pages', 'Lead tracking'] },
    { id: 'custom-app', name: 'Custom App', amount: 999900, delivery: '21–30 days', category: 'custom', tagline: 'Fully tailored mobile app.', emoji: '📲', feats: ['Custom UI/UX', 'Full backend', 'Payments', '30-day support'] },
    { id: 'custom-website', name: 'Custom Website', amount: 999900, delivery: '7–14 days', category: 'custom', tagline: 'Brand-first website for your business.', emoji: '🖥️', feats: ['Custom design', 'Up to 15 pages', 'CMS setup', 'SEO included'] },
    { id: 'ai-bot', name: 'AI Bot', amount: 999900, delivery: '10–14 days', category: 'custom', tagline: 'Smart chatbot on your data.', emoji: '🤖', feats: ['Custom training', 'Multi-channel', 'Analytics', 'Handoff to human'] },
    { id: 'ai-integration', name: 'AI Integration', amount: 999900, delivery: '14–21 days', category: 'custom', tagline: 'AI features in app + website.', emoji: '🔗', feats: ['API integration', 'LLM features', 'Unified dashboard', 'Documentation'] },
    { id: 'ai-app', name: 'AI App', amount: 9999900, delivery: '30–45 days', category: 'ai', tagline: 'AI-native mobile product.', emoji: '🧠', feats: ['Custom AI models', 'Mobile + backend', 'Real-time inference', 'Scalable infra'] },
    { id: 'ai-web-app', name: 'AI Web App', amount: 9999900, delivery: '30–45 days', category: 'ai', tagline: 'AI-powered web platform.', emoji: '✨', feats: ['LLM features', 'Admin dashboard', 'API layer', 'Cloud deploy'] },
    { id: 'ai-llm-project', name: 'AI LLM Project', amount: 99999900, delivery: '45–60 days', category: 'ai', tagline: 'Custom LLM, RAG & knowledge base.', emoji: '🔬', feats: ['RAG pipeline', 'Vector search', 'Fine-tuning', 'Production API'] },
    { id: 'ai-model-training', name: 'AI Model Training', amount: 199999900, delivery: '30–60 days', category: 'ai', tagline: 'Train & fine-tune on your data.', emoji: '⚙️', feats: ['Dataset prep', 'Fine-tuning', 'Evaluation', 'Deployment'] },
    { id: 'ai-ide-saas', name: 'AI IDE SaaS', amount: 999999900, delivery: '60–90 days', category: 'ai', tagline: 'Full AI developer IDE platform.', emoji: '💡', feats: ['IDE platform', 'Multi-tenant SaaS', 'AI copilot', 'Billing system'] },
    { id: 'founder-environment', name: 'Founder Environment', amount: 49999900, delivery: '14–21 days', category: 'enterprise', tagline: 'Complete dev, cloud & AI stack.', emoji: '🏗️', feats: ['Cloud setup', 'CI/CD pipeline', 'AI dev tools', 'Team onboarding'] },
    { id: 'full-ecosystem', name: 'Full Ecosystem', amount: 1499999900, delivery: '90–180 days', category: 'enterprise', tagline: 'Start-to-end product ecosystem.', emoji: '🌍', feats: ['App + Web + AI', 'Marketing & ops', 'Dedicated team', 'End-to-end delivery'] },
  ];

  const LEGACY = {
    'mobile-app': 'app-start',
    website: 'website-start',
    'ai-llm': 'ai-llm-project',
    'digital-marketing': 'website-marketing',
  };

  function resolvePlanId(id) {
    const key = String(id || '').trim();
    if (PLANS.some((p) => p.id === key)) return key;
    return LEGACY[key] || key;
  }

  function getPlan(id) {
    const resolved = resolvePlanId(id);
    return PLANS.find((p) => p.id === resolved) || PLANS[2];
  }

  function formatUsd(paise) {
    return '$' + Math.round(paise / 100).toLocaleString('en-US');
  }

  function formatInr(paise) {
    return formatUsd(paise);
  }

  window.THTWAAT_CATALOG = {
    categories: CATEGORIES,
    plans: PLANS,
    resolvePlanId,
    getPlan,
    formatInr,
    formatUsd,
  };
})();
