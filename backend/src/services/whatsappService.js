import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

export async function sendWhatsAppText(to, text) {
  if (!env.whatsappToken || !env.whatsappPhoneId) {
    logger.warn('WhatsApp API not configured, skipping outbound message');
    return { skipped: true };
  }

  const response = await fetch(`${GRAPH_URL}/${env.whatsappPhoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error('WhatsApp send failed', { data });
    throw new Error(data.error?.message || 'Failed to send WhatsApp message');
  }

  return data;
}

export function detectWhatsAppSource(message = {}) {
  const referral = message.referral || {};

  if (referral.source_type === 'ad' || referral.source_url) {
    return 'WhatsApp Channel';
  }

  if (message.context?.forwarded || message.context?.frequently_forwarded) {
    return 'WhatsApp Community';
  }

  return 'Direct WhatsApp Chat';
}

export function extractIncomingMessages(body = {}) {
  const entries = body.entry || [];
  const messages = [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = value.contacts || [];

      for (const message of value.messages || []) {
        if (message.type !== 'text' || !message.text?.body) {
          continue;
        }

        const contact = contacts.find((item) => item.wa_id === message.from) || {};
        messages.push({
          phone: message.from,
          name: contact.profile?.name || 'WhatsApp User',
          message: message.text.body.trim(),
          source: detectWhatsAppSource(message),
          messageId: message.id,
        });
      }
    }
  }

  return messages;
}

export function buildLeadAckMessage(name, category) {
  const firstName = String(name || 'there').split(' ')[0];
  return `Hi ${firstName}! 👋\n\nThanks for reaching out to THTWAAT. We received your message and categorized it as *${category}*.\n\nOur team will reply within 2 hours (Mon–Sat, 10am–8pm IST).\n\n— THTWAAT Technology Solutions`;
}
