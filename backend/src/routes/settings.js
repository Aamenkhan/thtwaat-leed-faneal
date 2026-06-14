import { Router } from 'express';
import { requireAdminKey } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { parseYoutubeId } from '../utils/youtube.js';
import {
  getYoutubeSettings,
  saveYoutubeSettings,
  getPublicSiteContent,
  saveTemplates,
  saveReviews,
} from '../services/configService.js';

const router = Router();

router.get('/content', async (_req, res, next) => {
  try {
    const content = await getPublicSiteContent();
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
});

router.get('/youtube', async (_req, res, next) => {
  try {
    const settings = await getYoutubeSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/youtube', requireAdminKey, async (req, res, next) => {
  try {
    const url = String(req.body.url || req.body.youtubeUrl || '').trim();
    const title = String(req.body.title || req.body.youtubeTitle || '').trim();
    const subtitle = String(req.body.subtitle || req.body.youtubeSubtitle || '').trim();
    const videoId = parseYoutubeId(url);

    if (url && !videoId) {
      return next(new ValidationError('Invalid YouTube URL or video ID'));
    }

    const saved = await saveYoutubeSettings(url, videoId, title, subtitle);

    res.json({
      success: true,
      data: {
        url: saved.youtubeUrl || '',
        videoId: saved.youtubeVideoId || '',
        title: saved.youtubeTitle || 'Company Services Demo',
        subtitle: saved.youtubeSubtitle || '',
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/templates', async (_req, res, next) => {
  try {
    const content = await getPublicSiteContent();
    res.json({ success: true, data: { templates: content.templates } });
  } catch (error) {
    next(error);
  }
});

router.put('/templates', requireAdminKey, async (req, res, next) => {
  try {
    const templates = req.body.templates;
    if (!Array.isArray(templates)) {
      return next(new ValidationError('templates must be an array'));
    }

    const saved = await saveTemplates(templates);

    res.json({
      success: true,
      data: {
        templates: saved.templates || [],
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reviews', async (_req, res, next) => {
  try {
    const content = await getPublicSiteContent();
    res.json({ success: true, data: { reviews: content.reviews } });
  } catch (error) {
    next(error);
  }
});

router.put('/reviews', requireAdminKey, async (req, res, next) => {
  try {
    const reviews = req.body.reviews;
    if (!Array.isArray(reviews)) {
      return next(new ValidationError('reviews must be an array'));
    }

    const saved = await saveReviews(reviews);

    res.json({
      success: true,
      data: {
        reviews: saved.reviews || [],
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
