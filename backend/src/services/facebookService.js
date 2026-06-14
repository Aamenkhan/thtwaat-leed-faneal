import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

export function isFacebookConfigured() {
  return Boolean(env.facebookPageId && env.facebookPageAccessToken);
}

export function buildVisionFacebookMessage({ name, vision }) {
  const author = String(name || 'Anonymous').trim() || 'Anonymous';
  const text = String(vision || '').trim();
  return [
    '💡 Your Vision',
    `From: ${author}`,
    '',
    text,
    '',
    '— Shared via Thtwaat.tech',
  ].join('\n');
}

export async function postVisionToFacebook({ name, vision }) {
  if (!isFacebookConfigured()) {
    throw new AppError(
      'Facebook Page is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.',
      503,
      'FACEBOOK_NOT_CONFIGURED',
    );
  }

  const message = buildVisionFacebookMessage({ name, vision });

  const response = await fetch(`${GRAPH_URL}/${env.facebookPageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      access_token: env.facebookPageAccessToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error('Facebook vision post failed', { data });
    throw new AppError(
      data.error?.message || 'Failed to post vision to Facebook Page',
      502,
      'FACEBOOK_POST_FAILED',
    );
  }

  logger.info('Vision posted to Facebook Page', { postId: data.id, pageId: env.facebookPageId });

  return {
    postId: data.id,
    message,
  };
}
