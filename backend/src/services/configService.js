import fs from 'fs/promises';
import path from 'path';
import { get, put } from '@vercel/blob';
import {
  env,
  getBlobReadWriteToken,
  isBlobStorageAvailable,
} from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import {
  buildPublicSiteContent,
  normalizeTemplates,
  normalizeReviews,
} from '../constants/siteContent.js';

const CONFIG_BLOB_NAME = 'thtwaat-site-config.json';
const LOCAL_CONFIG_PATH = './data/site-config.json';

function blobOptions(extra = {}) {
  const token = getBlobReadWriteToken();
  if (token) {
    return { token, ...extra };
  }
  return extra;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function readLocalConfig() {
  try {
    const raw = await fs.readFile(LOCAL_CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeLocalConfig(config) {
  await fs.mkdir(path.dirname(LOCAL_CONFIG_PATH), { recursive: true });
  await fs.writeFile(LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

async function readBlobConfig() {
  const result = await get(CONFIG_BLOB_NAME, blobOptions({ access: env.blobAccess }));
  if (result?.stream) {
    const buffer = await streamToBuffer(result.stream);
    return JSON.parse(buffer.toString('utf8'));
  }
  return {};
}

async function writeBlobConfig(config) {
  await put(CONFIG_BLOB_NAME, JSON.stringify(config), blobOptions({
    access: env.blobAccess,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  }));
}

function assertConfigStorage() {
  if (!isBlobStorageAvailable() && env.nodeEnv === 'production' && process.env.VERCEL) {
    throw new AppError(
      'Site config storage is not configured. Connect Vercel Blob to save YouTube links.',
      503,
      'CONFIG_STORAGE_NOT_CONFIGURED',
    );
  }
}

export async function getSiteConfig() {
  if (isBlobStorageAvailable()) {
    try {
      return await readBlobConfig();
    } catch (error) {
      logger.warn('Failed to read config from blob, using local fallback', { error: error.message });
    }
  }

  return readLocalConfig();
}

export async function saveSiteConfig(partial) {
  assertConfigStorage();

  const current = await getSiteConfig();
  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  if (isBlobStorageAvailable()) {
    await writeBlobConfig(next);
  } else {
    await writeLocalConfig(next);
  }

  logger.info('Site config saved', { keys: Object.keys(partial) });
  return next;
}

export async function getYoutubeSettings() {
  const config = await getSiteConfig();
  const youtube = buildPublicSiteContent(config).youtube;
  return {
    url: youtube.url,
    videoId: youtube.videoId,
    title: youtube.title,
    subtitle: youtube.subtitle,
    updatedAt: config.updatedAt || null,
    usingDefault: !String(config.youtubeVideoId || config.youtubeUrl || '').trim(),
  };
}

export async function saveYoutubeSettings(url, videoId, title, subtitle) {
  return saveSiteConfig({
    youtubeUrl: url,
    youtubeVideoId: videoId,
    youtubeTitle: title || 'Company Services Demo',
    youtubeSubtitle: subtitle || '',
  });
}

export async function getPublicSiteContent() {
  const config = await getSiteConfig();
  return buildPublicSiteContent(config);
}

export async function saveTemplates(templates) {
  const normalized = normalizeTemplates(templates);
  return saveSiteConfig({ templates: normalized });
}

export async function saveReviews(reviews) {
  const normalized = normalizeReviews(reviews);
  return saveSiteConfig({ reviews: normalized });
}
