import { analyzeLead, formatAiSummary } from './aiService.js';
import { saveLead, getLeadStats } from './storageService.js';
import { sendWhatsAppText, buildLeadAckMessage } from './whatsappService.js';
import { normalizePhone, formatPhoneDisplay } from '../utils/phone.js';
import { normalizeSource } from '../constants/sources.js';
import { logger } from '../utils/logger.js';

function buildTimestamp() {
  return new Date().toISOString();
}

export async function createLead(input) {
  const source = normalizeSource(input.source);
  const phone = normalizePhone(input.phone);
  const name = String(input.name || 'Unknown').trim() || 'Unknown';
  const email = String(input.email || '').trim();
  const message = String(input.message || '').trim();

  const analysis = await analyzeLead({ name, phone, email, message, source });

  const lead = {
    name,
    phone: formatPhoneDisplay(phone) || phone,
    email,
    message,
    source,
    timestamp: buildTimestamp(),
    leadScore: analysis.score,
    category: analysis.category,
    aiSummary: formatAiSummary(analysis.category, analysis.summary),
  };

  await saveLead(lead);

  return lead;
}

export async function processWhatsAppLead(incoming) {
  const lead = await createLead({
    name: incoming.name,
    phone: incoming.phone,
    email: '',
    message: incoming.message,
    source: incoming.source,
  });

  try {
    await sendWhatsAppText(
      normalizePhone(incoming.phone),
      buildLeadAckMessage(incoming.name, lead.category),
    );
  } catch (error) {
    logger.warn('WhatsApp acknowledgement failed', { error: error.message });
  }

  return lead;
}

export async function listLeadsWithStats() {
  return getLeadStats();
}
