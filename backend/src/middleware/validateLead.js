import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';
import { LEAD_SOURCES } from '../constants/sources.js';

const leadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: z.string().trim().min(7, 'Valid phone number is required').max(20),
  email: z.string().trim().email('Valid email is required').max(160),
  message: z.string().trim().min(1, 'Message is required').max(4000),
  source: z.enum(LEAD_SOURCES).optional().default('Website'),
});

export function validateLeadPayload(req, _res, next) {
  const result = leadSchema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    return next(new ValidationError('Invalid lead payload', details));
  }

  req.validatedLead = result.data;
  return next();
}
