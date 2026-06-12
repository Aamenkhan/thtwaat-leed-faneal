export const LEAD_SOURCES = Object.freeze([
  'Website',
  'WhatsApp Channel',
  'WhatsApp Community',
  'Direct WhatsApp Chat',
]);

export const LEAD_CATEGORIES = Object.freeze([
  'Mobile App',
  'Website',
  'Web App / SaaS',
  'AI Automation',
  'AI / LLM',
  'Digital Marketing',
  'Merchant',
  'Rider',
  'Customer',
  'General Inquiry',
]);

export function normalizeSource(source) {
  const value = String(source || '').trim();
  if (LEAD_SOURCES.includes(value)) {
    return value;
  }
  return 'Website';
}
