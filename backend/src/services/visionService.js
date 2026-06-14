import fs from 'fs/promises';
import { get, put } from '@vercel/blob';
import {
  env,
  getBlobReadWriteToken,
  isBlobStorageAvailable,
  isVercelRuntime,
} from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { postVisionToFacebook, isFacebookConfigured } from './facebookService.js';
import { createLead } from './leadService.js';

const VISIONS_BLOB_NAME = 'thtwaat-visions.json';
const LOCAL_VISIONS_PATH = './data/visions.json';
const MAX_STORED = 250;
const PUBLIC_LIMIT = 40;

const DEFAULT_VISIONS = Object.freeze([
  {
    id: 'vision-demo-1',
    name: 'Alex M.',
    email: '',
    vision: 'I want an AI-powered SaaS dashboard for US freelancers — billing, clients, and automation in one app.',
    timestamp: '2026-06-01T10:00:00.000Z',
    facebookPosted: false,
    facebookPostId: '',
    isDemo: true,
  },
  {
    id: 'vision-demo-2',
    name: 'Sana K.',
    email: '',
    vision: 'My vision is a hyperlocal marketplace app like Thtwaat but for my city — vendors, riders, and COD payments.',
    timestamp: '2026-06-02T14:30:00.000Z',
    facebookPosted: false,
    facebookPostId: '',
    isDemo: true,
  },
  {
    id: 'vision-demo-3',
    name: 'Ryan P.',
    email: '',
    vision: 'Build a modern clinic website with online booking, WhatsApp reminders, and SEO for local patients.',
    timestamp: '2026-06-03T09:15:00.000Z',
    facebookPosted: false,
    facebookPostId: '',
    isDemo: true,
  },
]);

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

function normalizeVisionInput(input = {}) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim();
  const phone = String(input.phone || '').trim();
  const vision = String(input.vision || input.message || '').trim();

  if (!name || name.length < 2) {
    throw new AppError('Name is required (min 2 characters)', 400, 'INVALID_VISION');
  }

  if (!vision || vision.length < 15) {
    throw new AppError('Please describe your vision (min 15 characters)', 400, 'INVALID_VISION');
  }

  if (vision.length > 2000) {
    throw new AppError('Vision message is too long (max 2000 characters)', 400, 'INVALID_VISION');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please enter a valid email address', 400, 'INVALID_VISION');
  }

  return { name, email, phone, vision };
}

function sanitizePublicVision(item) {
  return {
    id: item.id,
    name: item.name,
    vision: item.vision,
    timestamp: item.timestamp,
    isDemo: Boolean(item.isDemo),
  };
}

function assertVisionStorage() {
  if (!isBlobStorageAvailable() && isVercelRuntime()) {
    throw new AppError(
      'Vision storage is not configured. Connect Vercel Blob to save visions.',
      503,
      'VISION_STORAGE_NOT_CONFIGURED',
    );
  }
}

async function readLocalVisions() {
  try {
    const raw = await fs.readFile(LOCAL_VISIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.visions) ? parsed.visions : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeLocalVisions(visions) {
  await fs.mkdir('./data', { recursive: true });
  await fs.writeFile(
    LOCAL_VISIONS_PATH,
    JSON.stringify({ visions, updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );
}

async function readBlobVisions() {
  const result = await get(VISIONS_BLOB_NAME, blobOptions({ access: env.blobAccess }));
  if (result?.stream) {
    const buffer = await streamToBuffer(result.stream);
    const parsed = JSON.parse(buffer.toString('utf8'));
    return Array.isArray(parsed.visions) ? parsed.visions : [];
  }
  return [];
}

async function writeBlobVisions(visions) {
  await put(
    VISIONS_BLOB_NAME,
    JSON.stringify({ visions, updatedAt: new Date().toISOString() }),
    blobOptions({
      access: env.blobAccess,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    }),
  );
}

export async function loadAllVisions() {
  if (isBlobStorageAvailable()) {
    try {
      return await readBlobVisions();
    } catch (error) {
      logger.warn('Failed to read visions from blob, using local fallback', { error: error.message });
    }
  }

  return readLocalVisions();
}

export async function saveAllVisions(visions) {
  assertVisionStorage();
  const trimmed = visions.slice(0, MAX_STORED);

  if (isBlobStorageAvailable()) {
    await writeBlobVisions(trimmed);
  } else {
    await writeLocalVisions(trimmed);
  }

  return trimmed;
}

export async function getPublicVisions(limit = PUBLIC_LIMIT) {
  const stored = await loadAllVisions();
  const list = stored.length ? stored : [...DEFAULT_VISIONS];
  return list.slice(0, limit).map(sanitizePublicVision);
}

export async function getVisionStats() {
  const stored = await loadAllVisions();
  const list = stored.length ? stored : [...DEFAULT_VISIONS];
  const facebookPosted = list.filter((item) => item.facebookPosted).length;

  return {
    total: list.length,
    userSubmitted: stored.length,
    facebookPosted,
    facebookConfigured: isFacebookConfigured(),
    recent: list.slice(0, 50).map((item) => ({
      ...sanitizePublicVision(item),
      email: item.email || '',
      phone: item.phone || '',
      facebookPosted: Boolean(item.facebookPosted),
      facebookPostId: item.facebookPostId || '',
    })),
  };
}

async function notifyAdminLead(entry) {
  try {
    const phoneDigits = String(entry.phone || '').replace(/\D/g, '');
    const phone = phoneDigits.length >= 7 ? entry.phone : '0000000000';
    const email = entry.email || `${entry.name.replace(/\s+/g, '.').toLowerCase()}@vision.local`;

    await createLead({
      name: entry.name,
      phone,
      email,
      message: `[Your Vision]\n\n${entry.vision}`,
      source: 'Your Vision',
    });
  } catch (error) {
    logger.warn('Vision saved but admin lead notification failed', { error: error.message });
  }
}

export async function submitVision(input) {
  const payload = normalizeVisionInput(input);

  const entry = {
    id: `vision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    vision: payload.vision,
    timestamp: new Date().toISOString(),
    facebookPosted: false,
    facebookPostId: '',
    isDemo: false,
  };

  const visions = await loadAllVisions();
  const withoutDemos = visions.filter((item) => !item.isDemo);
  withoutDemos.unshift(entry);

  await saveAllVisions(withoutDemos);

  let facebookError = null;

  if (isFacebookConfigured()) {
    try {
      const fb = await postVisionToFacebook({ name: entry.name, vision: entry.vision });
      entry.facebookPosted = true;
      entry.facebookPostId = fb.postId;
      withoutDemos[0] = entry;
      await saveAllVisions(withoutDemos);
    } catch (error) {
      facebookError = error.message;
      logger.warn('Vision saved locally but Facebook post failed', { error: error.message });
    }
  }

  await notifyAdminLead(entry);

  return {
    vision: sanitizePublicVision(entry),
    facebookPosted: entry.facebookPosted,
    facebookConfigured: isFacebookConfigured(),
    facebookError,
  };
}
