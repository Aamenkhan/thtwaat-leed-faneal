export const DEFAULT_TEMPLATES = Object.freeze([
  {
    id: 'demo-website',
    title: 'Business Website Template',
    category: 'Website',
    description: 'Clean, conversion-focused website layout for service businesses and startups.',
    imageUrl: '',
    previewUrl: '/checkout?plan=website-start',
    badge: 'Starter',
  },
  {
    id: 'demo-app',
    title: 'Mobile App UI Template',
    category: 'Mobile App',
    description: 'Flutter-ready app screens with onboarding, dashboard, and payments flow.',
    imageUrl: '',
    previewUrl: '/checkout?plan=app-start',
    badge: 'Popular',
  },
  {
    id: 'demo-saas',
    title: 'SaaS Dashboard Template',
    category: 'SaaS',
    description: 'Admin panel, analytics, billing hooks, and multi-tenant architecture starter.',
    imageUrl: '',
    previewUrl: '/checkout?plan=saas-build',
    badge: 'Pro',
  },
  {
    id: 'demo-ai',
    title: 'AI Automation Template',
    category: 'AI',
    description: 'Workflow automation dashboard with chatbot integration and lead capture.',
    imageUrl: '',
    previewUrl: '/checkout?plan=ai-automation',
    badge: 'AI',
  },
]);

export const DEFAULT_REVIEWS = Object.freeze([
  {
    id: 'demo-review-1',
    name: 'Michael R.',
    role: 'CEO',
    company: 'ScaleUp Labs · Austin, TX',
    rating: 5,
    text: 'Thtwaat shipped our SaaS MVP in under 3 weeks. Clear communication, fixed pricing, and zero surprises. Highly recommend for US startups.',
    avatarUrl: '',
  },
  {
    id: 'demo-review-2',
    name: 'Priya S.',
    role: 'Product Manager',
    company: 'Nova Retail · San Francisco',
    rating: 5,
    text: 'Professional team from discovery to launch. Our AI automation saved 20+ hours per week. The checkout and onboarding flow was seamless.',
    avatarUrl: '',
  },
  {
    id: 'demo-review-3',
    name: 'James T.',
    role: 'Founder',
    company: 'BuildRight Co · New York',
    rating: 5,
    text: 'Best dev partner we have worked with. Templates were polished, reviews from their clients checked out, and delivery was on time.',
    avatarUrl: '',
  },
]);

export function normalizeTemplate(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  const title = String(item.title || '').trim();
  if (!title) return null;

  return {
    id: String(item.id || `template-${index + 1}`).trim(),
    title,
    category: String(item.category || 'General').trim(),
    description: String(item.description || '').trim(),
    imageUrl: String(item.imageUrl || '').trim(),
    previewUrl: String(item.previewUrl || '').trim(),
    badge: String(item.badge || '').trim(),
  };
}

export function normalizeReview(item, index = 0) {
  if (!item || typeof item !== 'object') return null;

  const name = String(item.name || '').trim();
  const text = String(item.text || '').trim();
  if (!name || !text) return null;

  const rating = Math.min(5, Math.max(1, Number(item.rating) || 5));

  return {
    id: String(item.id || `review-${index + 1}`).trim(),
    name,
    role: String(item.role || '').trim(),
    company: String(item.company || '').trim(),
    rating,
    text,
    avatarUrl: String(item.avatarUrl || '').trim(),
  };
}

export function normalizeTemplates(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => normalizeTemplate(item, index)).filter(Boolean);
}

export function normalizeReviews(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => normalizeReview(item, index)).filter(Boolean);
}

export function getDisplayTemplates(configTemplates) {
  const saved = normalizeTemplates(configTemplates);
  return saved.length ? saved : [...DEFAULT_TEMPLATES];
}

export function getDisplayReviews(configReviews) {
  const saved = normalizeReviews(configReviews);
  return saved.length ? saved : [...DEFAULT_REVIEWS];
}

export function buildPublicSiteContent(config = {}) {
  return {
    youtube: {
      url: config.youtubeUrl || '',
      videoId: config.youtubeVideoId || '',
      title: config.youtubeTitle || 'Company Services Demo',
      subtitle: config.youtubeSubtitle || 'Watch how we build apps, websites, AI systems, and full product ecosystems.',
    },
    templates: getDisplayTemplates(config.templates),
    reviews: getDisplayReviews(config.reviews),
    usingDefaultTemplates: !normalizeTemplates(config.templates).length,
    usingDefaultReviews: !normalizeReviews(config.reviews).length,
    updatedAt: config.updatedAt || null,
  };
}
