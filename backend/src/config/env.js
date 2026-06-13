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

/**
 * Vercel may inject BLOB_READ_WRITE_TOKEN or a store-specific variant
 * when a Blob store is linked to the project.
 */
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

export function getExcelStorageMode() {
  if (getBlobReadWriteToken()) {
    return 'vercel-blob';
  }

  if (isVercelRuntime()) {
    return 'vercel-blob-required';
  }

  return 'local-file';
}

export function hasExcelStorage() {
  const blobToken = getBlobReadWriteToken();

  if (blobToken) {
    return true;
  }

  // Vercel serverless filesystem is ephemeral — Blob token is required there.
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
      'On Vercel, EXCEL_FILE_PATH alone does not work (serverless has no persistent disk).',
      'Link a Blob store to this project in Vercel → Storage → Connect.',
      'That injects BLOB_READ_WRITE_TOKEN automatically for Production.',
      'Then redeploy.',
    ].join(' ');
  }

  return 'Set EXCEL_FILE_PATH for local file storage or BLOB_READ_WRITE_TOKEN for Vercel Blob.';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  storageProvider,
  excelFilePath: process.env.EXCEL_FILE_PATH || './data/leads.xlsx',
  blobReadWriteToken: getBlobReadWriteToken(),
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
    blobTokenConfigured: Boolean(getBlobReadWriteToken()),
    excelFilePath: env.excelFilePath,
    configured: hasExcelStorage(),
  };
}
