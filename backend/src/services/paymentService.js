import crypto from 'crypto';
import { env } from '../config/env.js';
import { getPlanById, resolvePlanId } from '../constants/plans.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

export function isRazorpayConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

function assertRazorpayConfigured() {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
      503,
      'RAZORPAY_NOT_CONFIGURED',
    );
  }
}

function getRazorpayAuthHeader() {
  assertRazorpayConfigured();
  const token = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
  return `Basic ${token}`;
}

export async function createRazorpayOrder({ planId, name, email, phone }) {
  const plan = getPlanById(resolvePlanId(planId));
  if (!plan) {
    throw new AppError('Invalid service plan selected', 400, 'INVALID_PLAN');
  }

  assertRazorpayConfigured();

  const receipt = `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const response = await fetch(RAZORPAY_ORDERS_URL, {
    method: 'POST',
    headers: {
      Authorization: getRazorpayAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: plan.amount,
      currency: 'INR',
      receipt,
      notes: {
        planId: plan.id,
        planName: plan.name,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error('Razorpay order creation failed', { data });
    throw new AppError(
      data.error?.description || 'Failed to create Razorpay order',
      502,
      'RAZORPAY_ORDER_FAILED',
    );
  }

  logger.info('Razorpay order created', {
    orderId: data.id,
    planId: plan.id,
    amount: plan.amount,
  });

  return {
    orderId: data.id,
    amount: plan.amount,
    currency: 'INR',
    keyId: env.razorpayKeyId,
    planId: plan.id,
    planName: plan.name,
    receipt,
  };
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  assertRazorpayConfigured();

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(body)
    .digest('hex');

  return expected === signature;
}

export function formatPaidLeadMessage(plan, paymentId, orderId) {
  const amountInr = (plan.amount / 100).toLocaleString('en-IN');
  return [
    `PAID via Razorpay — ${plan.name}`,
    `Amount: ₹${amountInr}`,
    `Payment ID: ${paymentId}`,
    `Order ID: ${orderId}`,
    'Customer completed checkout on THTWAAT website.',
  ].join(' | ');
}
