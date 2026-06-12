import { Router } from 'express';
import { env, assertRuntimeConfig } from '../config/env.js';
import { extractIncomingMessages } from '../services/whatsappService.js';
import { processWhatsAppLead } from '../services/leadService.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.whatsappVerifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification failed');
  return res.status(403).json({
    success: false,
    error: { message: 'Webhook verification failed', code: 'WEBHOOK_VERIFY_FAILED' },
  });
});

router.post('/', async (req, res, next) => {
  try {
    assertRuntimeConfig();

    const incomingMessages = extractIncomingMessages(req.body);

    if (!incomingMessages.length) {
      return res.status(200).json({ success: true, processed: 0 });
    }

    const results = [];

    for (const incoming of incomingMessages) {
      const lead = await processWhatsAppLead(incoming);
      results.push({ messageId: incoming.messageId, leadId: lead.timestamp, phone: lead.phone });
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
