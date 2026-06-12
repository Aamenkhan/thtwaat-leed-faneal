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

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  storageProvider,
  excelFilePath: process.env.EXCEL_FILE_PATH || './data/leads.xlsx',
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
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

function hasExcelStorage() {
  if (process.env.VERCEL) {
    return Boolean(env.blobReadWriteToken);
  }
  return Boolean(env.excelFilePath);
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
    missing.push('EXCEL_FILE_PATH or BLOB_READ_WRITE_TOKEN');
  }

  if (env.storageProvider === 'both' && !hasGoogleStorage() && !hasExcelStorage()) {
    missing.push('Google Sheets or Excel storage configuration');
  }

  if (missing.length) {
    const error = new Error(`Lead pipeline misconfigured. Missing: ${missing.join(', ')}`);
    error.code = 'CONFIG_ERROR';
    throw error;
  }
}
