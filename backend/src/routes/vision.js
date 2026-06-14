import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdminKey } from '../middleware/auth.js';
import { getPublicVisions, getVisionStats, submitVision } from '../services/visionService.js';

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many vision submissions. Please try again later.', code: 'VISION_RATE_LIMITED' },
  },
});

router.get('/public', async (_req, res, next) => {
  try {
    const visions = await getPublicVisions();
    res.json({ success: true, data: { visions } });
  } catch (error) {
    next(error);
  }
});

router.post('/submit', submitLimiter, async (req, res, next) => {
  try {
    const result = await submitVision(req.body || {});
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAdminKey, async (_req, res, next) => {
  try {
    const stats = await getVisionStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
