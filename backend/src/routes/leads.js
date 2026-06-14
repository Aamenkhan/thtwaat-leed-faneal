import { Router } from 'express';
import { createLead, listLeadsWithStats } from '../services/leadService.js';
import { exportLeadsExcel } from '../services/storageService.js';
import { validateLeadPayload } from '../middleware/validateLead.js';
import { requireAdminKey } from '../middleware/auth.js';
import { assertRuntimeConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/create', validateLeadPayload, async (req, res, next) => {
  try {
    assertRuntimeConfig();
    logger.info('Lead create request received', {
      source: req.validatedLead.source,
      phone: req.validatedLead.phone,
      email: req.validatedLead.email,
    });

    const lead = await createLead(req.validatedLead);

    logger.info('Lead create request completed', {
      phone: lead.phone,
      source: lead.source,
      leadScore: lead.leadScore,
      category: lead.category,
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    logger.error('Lead create request failed', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    next(error);
  }
});

router.get('/', requireAdminKey, async (_req, res, next) => {
  try {
    assertRuntimeConfig();
    const stats = await listLeadsWithStats();

    res.json({
      success: true,
      data: {
        totalLeads: stats.totalLeads,
        newLeadsToday: stats.newLeadsToday,
        sources: stats.sources,
        categories: stats.categories,
        leads: stats.leads,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export', requireAdminKey, async (_req, res, next) => {
  try {
    assertRuntimeConfig();
    const buffer = await exportLeadsExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="thtwaat-leads.xlsx"',
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.use((err, _req, _res, next) => {
  logger.error('Lead route error', { message: err.message });
  next(err);
});

export default router;
