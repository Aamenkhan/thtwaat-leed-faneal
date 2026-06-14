import { Router } from 'express';
import { z } from 'zod';
import { env, assertRuntimeConfig } from '../config/env.js';
import { listPlans, getPlanById } from '../constants/plans.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  formatPaidLeadMessage,
  isRazorpayConfigured,
} from '../services/paymentService.js';
import { createLead } from '../services/leadService.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = Router();

const customerSchema = z.object({
  planId: z.string().trim().min(1, 'Plan is required'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required').max(160),
  phone: z.string().trim().min(10, 'Valid phone number is required').max(20),
});

const verifySchema = customerSchema.extend({
  razorpay_order_id: z.string().trim().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().trim().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().trim().min(1, 'Signature is required'),
});

router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      configured: isRazorpayConfigured(),
      keyId: env.razorpayKeyId || '',
      plans: listPlans(),
    },
  });
});

router.post('/create-order', async (req, res, next) => {
  try {
    const result = customerSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError('Invalid checkout payload', result.error.flatten().fieldErrors));
    }

    if (!getPlanById(result.data.planId)) {
      return next(new ValidationError('Invalid service plan selected'));
    }

    const order = await createRazorpayOrder(result.data);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    assertRuntimeConfig();

    const result = verifySchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError('Invalid payment verification payload', result.error.flatten().fieldErrors));
    }

    const {
      planId,
      name,
      email,
      phone,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = result.data;

    const plan = getPlanById(planId);
    if (!plan) {
      return next(new ValidationError('Invalid service plan selected'));
    }

    const valid = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!valid) {
      logger.warn('Razorpay signature verification failed', { orderId, paymentId });
      return next(new ValidationError('Payment verification failed. Invalid signature.'));
    }

    const lead = await createLead({
      name,
      email,
      phone,
      source: 'Website',
      message: formatPaidLeadMessage(plan, paymentId, orderId),
    });

    logger.info('Payment verified and lead saved', {
      paymentId,
      orderId,
      planId: plan.id,
      phone: lead.phone,
    });

    res.json({
      success: true,
      data: {
        verified: true,
        paymentId,
        orderId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.amount,
        lead,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
