import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name, { optional = false } = {}) {
  const value = process.env[name]?.trim();
  if (!value && !optional) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

const storageProvider = (process.env.STORAGE_PROVIDER || 'excel').toLowerCase();

export function isVercelRuntime() {
  return Boolean(process.env.VERCEL === '1' || process.env.VERCEL_ENV);
}

/** Legacy static token (pre-OIDC or external hosts). */
export function getBlobReadWriteToken() {
  const direct = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (direct) {
    return direct;
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!value?.trim()) {
      continue;
    }

    if (/^BLOB_.+_READ_WRITE_TOKEN$/i.test(key)) {
      return value.trim();
    }
  }

  return '';
}

/** Injected when a Blob store is connected to the project (OIDC mode). */
export function getBlobStoreId() {
  return process.env.BLOB_STORE_ID?.trim() || '';
}

/** Short-lived token auto-injected on Vercel deployments (OIDC mode). */
export function getOidcToken() {
  return process.env.VERCEL_OIDC_TOKEN?.trim() || '';
}

export function getBlobAccess() {
  return (process.env.BLOB_ACCESS || 'private').toLowerCase() === 'public'
    ? 'public'
    : 'private';
}

/**
 * Vercel Blob auth modes:
 * - oidc: BLOB_STORE_ID + VERCEL_OIDC_TOKEN (current Vercel default)
 * - token: BLOB_READ_WRITE_TOKEN (legacy / external)
 */
export function getBlobAuthMode() {
  if (getBlobReadWriteToken()) {
    return 'token';
  }

  if (getBlobStoreId() && (getOidcToken() || isVercelRuntime())) {
    return 'oidc';
  }

  return 'none';
}

export function isBlobStorageAvailable() {
  if (getBlobReadWriteToken()) {
    return true;
  }

  if (getBlobStoreId() && getOidcToken()) {
    return true;
  }

  // On Vercel, VERCEL_OIDC_TOKEN is injected at runtime even if not visible in dashboard.
  if (isVercelRuntime() && getBlobStoreId()) {
    return true;
  }

  return false;
}

export function getExcelStorageMode() {
  if (isBlobStorageAvailable()) {
    return `vercel-blob-${getBlobAuthMode()}`;
  }

  if (isVercelRuntime()) {
    return 'vercel-blob-required';
  }

  return 'local-file';
}

export function hasExcelStorage() {
  if (isBlobStorageAvailable()) {
    return true;
  }

  if (isVercelRuntime()) {
    return false;
  }

  return Boolean(env.excelFilePath);
}

export function getExcelStorageConfigError() {
  if (hasExcelStorage()) {
    return null;
  }

  if (isVercelRuntime()) {
    return [
      'Connect a Vercel Blob store to this project (Storage → Blob → Connect).',
      'OIDC mode needs BLOB_STORE_ID (visible in env vars).',
      'VERCEL_OIDC_TOKEN is injected automatically at runtime on Vercel.',
      'Legacy fallback: add BLOB_READ_WRITE_TOKEN manually from the Blob store settings.',
    ].join(' ');
  }

  return 'Set EXCEL_FILE_PATH for local file storage or connect Vercel Blob for cloud storage.';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  storageProvider,
  excelFilePath: process.env.EXCEL_FILE_PATH || './data/leads.xlsx',
  blobReadWriteToken: getBlobReadWriteToken(),
  blobStoreId: getBlobStoreId(),
  blobAccess: getBlobAccess(),
  deepseekApiKey: requireEnv('DEEPSEEK_API_KEY', { optional: true }),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  openaiApiKey: requireEnv('OPENAI_API_KEY', { optional: true }),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  whatsappToken: requireEnv('WHATSAPP_TOKEN', { optional: true }),
  whatsappPhoneId: requireEnv('WHATSAPP_PHONE_ID', { optional: true }),
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'thtwaat_verify_token',
  googleSheetId: requireEnv('GOOGLE_SHEET_ID', { optional: true }),
  googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT || '',
  adminApiKey: process.env.ADMIN_API_KEY || '',
  razorpayKeyId: requireEnv('RAZORPAY_KEY_ID', { optional: true }),
  razorpayKeySecret: requireEnv('RAZORPAY_KEY_SECRET', { optional: true }),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export function parseServiceAccount() {
  if (!env.googleServiceAccount) {
    return null;
  }

  try {
    return JSON.parse(env.googleServiceAccount);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT must be valid JSON');
  }
}

function hasGoogleStorage() {
  return Boolean(env.googleSheetId && env.googleServiceAccount);
}

export function assertRuntimeConfig() {
  const missing = [];

  if (!env.deepseekApiKey && !env.openaiApiKey) {
    missing.push('DEEPSEEK_API_KEY or OPENAI_API_KEY');
  }

  if (env.storageProvider === 'google' && !hasGoogleStorage()) {
    missing.push('GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT');
  }

  if (env.storageProvider === 'excel' && !hasExcelStorage()) {
    missing.push(getExcelStorageConfigError());
  }

  if (env.storageProvider === 'both' && !hasGoogleStorage() && !hasExcelStorage()) {
    missing.push('Google Sheets or Excel/Blob storage configuration');
  }

  if (missing.length) {
    const error = new Error(`Lead pipeline misconfigured. Missing: ${missing.join('; ')}`);
    error.code = 'CONFIG_ERROR';
    throw error;
  }
}

export function getStorageDiagnostics() {
  return {
    runtime: isVercelRuntime() ? 'vercel' : 'local',
    mode: getExcelStorageMode(),
    blobAuthMode: getBlobAuthMode(),
    blobStoreIdConfigured: Boolean(getBlobStoreId()),
    oidcTokenConfigured: Boolean(getOidcToken()),
    blobTokenConfigured: Boolean(getBlobReadWriteToken()),
    configured: hasExcelStorage(),
    excelFilePath: env.excelFilePath,
    acceptedEnvVars: [
      'BLOB_STORE_ID + VERCEL_OIDC_TOKEN (OIDC, recommended on Vercel)',
      'BLOB_READ_WRITE_TOKEN (legacy token fallback)',
    ],
  };
}
