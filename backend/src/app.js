import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import leadRoutes from './routes/leads.js';
import webhookRoutes from './routes/webhook.js';
import settingsRoutes from './routes/settings.js';
import paymentRoutes from './routes/payment.js';
import visionRoutes from './routes/vision.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((item) => item.trim()),
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests', code: 'RATE_LIMITED' },
  },
});

app.use(apiLimiter);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'THTWAAT Lead Generation API',
    endpoints: {
      health: '/health',
      createLead: 'POST /lead/create',
      listLeads: 'GET /leads',
      exportExcel: 'GET /leads/export',
      youtubeSettings: 'GET /settings/youtube',
      siteContent: 'GET /settings/content',
      saveYoutube: 'PUT /settings/youtube',
      saveTemplates: 'PUT /settings/templates',
      saveReviews: 'PUT /settings/reviews',
      paymentConfig: 'GET /payment/config',
      createPaymentOrder: 'POST /payment/create-order',
      verifyPayment: 'POST /payment/verify',
      publicVisions: 'GET /vision/public',
      submitVision: 'POST /vision/submit',
      adminVisions: 'GET /vision',
      whatsappWebhook: 'GET|POST /webhook/whatsapp',
    },
  });
});

app.use('/health', healthRoutes);
app.use('/lead', leadRoutes);
app.use('/leads', leadRoutes);
app.use('/webhook/whatsapp', webhookRoutes);
app.use('/settings', settingsRoutes);
app.use('/payment', paymentRoutes);
app.use('/vision', visionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
