import { Router } from 'express';
import { requireAdminKey } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { parseYoutubeId } from '../utils/youtube.js';
import { getYoutubeSettings, saveYoutubeSettings } from '../services/configService.js';

const router = Router();

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
    const videoId = parseYoutubeId(url);

    if (url && !videoId) {
      return next(new ValidationError('Invalid YouTube URL or video ID'));
    }

    const saved = await saveYoutubeSettings(url, videoId);

    res.json({
      success: true,
      data: {
        url: saved.youtubeUrl || '',
        videoId: saved.youtubeVideoId || '',
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
