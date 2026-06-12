import { Router } from 'express';
import { env } from '../config/env.js';
import { getAiProvider } from '../services/aiService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'THTWAAT Lead API',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    aiProvider: getAiProvider(),
  });
});

export default router;
