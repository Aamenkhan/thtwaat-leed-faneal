export const PAYMENT_PLANS = Object.freeze({
  'mobile-app': {
    id: 'mobile-app',
    name: 'Mobile App — Flutter',
    amount: 2999900,
    delivery: '21 day delivery',
  },
  website: {
    id: 'website',
    name: 'Website — Professional',
    amount: 999900,
    delivery: '7 day delivery',
  },
  'web-app': {
    id: 'web-app',
    name: 'Web App / SaaS Platform',
    amount: 3999900,
    delivery: '30 day delivery',
  },
  'ai-automation': {
    id: 'ai-automation',
    name: 'AI Automation / WhatsApp Bot',
    amount: 1999900,
    delivery: '14 day delivery',
  },
  'ai-llm': {
    id: 'ai-llm',
    name: 'AI / LLM Custom Project',
    amount: 5999900,
    delivery: '35-45 day delivery',
  },
  'digital-marketing': {
    id: 'digital-marketing',
    name: 'Digital Marketing Retainer',
    amount: 799900,
    delivery: 'monthly',
  },
});

export function listPlans() {
  return Object.values(PAYMENT_PLANS).map(({ id, name, amount, delivery }) => ({
    id,
    name,
    amount,
    delivery,
    displayAmount: `₹${(amount / 100).toLocaleString('en-IN')}`,
  }));
}

export function getPlanById(planId) {
  const plan = PAYMENT_PLANS[String(planId || '').trim()];
  if (!plan) {
    return null;
  }
  return plan;
}
