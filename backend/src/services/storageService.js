import { env, getStorageDiagnostics } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import {
  isGoogleConfigured,
  appendLeadToSheet,
  getLeadStats as getGoogleLeadStats,
} from './sheetsService.js';
import * as excelService from './excelService.js';

export function getStorageProvider() {
  return env.storageProvider;
}

export function getStorageInfo() {
  return {
    provider: env.storageProvider,
    diagnostics: getStorageDiagnostics(),
    google: {
      configured: isGoogleConfigured(),
      sheetId: env.googleSheetId || null,
    },
    excel: excelService.getExcelStorageInfo(),
  };
}

function assertStorageConfigured() {
  const provider = env.storageProvider;
  const googleReady = isGoogleConfigured();
  const excelReady = excelService.isExcelConfigured();

  if (provider === 'google' && !googleReady) {
    throw new AppError(
      'Google Sheets storage is not configured',
      503,
      'STORAGE_NOT_CONFIGURED',
    );
  }

  if (provider === 'excel' && !excelReady) {
    throw new AppError(
      'Excel storage is not configured. Set EXCEL_FILE_PATH or enable Vercel Blob.',
      503,
      'STORAGE_NOT_CONFIGURED',
    );
  }

  if (provider === 'both' && !googleReady && !excelReady) {
    throw new AppError(
      'No storage backend configured for Google Sheets or Excel',
      503,
      'STORAGE_NOT_CONFIGURED',
    );
  }
}

export async function saveLead(lead) {
  assertStorageConfigured();
  const provider = env.storageProvider;

  logger.info('saveLead invoked', {
    provider,
    phone: lead.phone,
    source: lead.source,
    excelPath: excelService.getExcelStorageInfo().path,
  });

  if (provider === 'google') {
    return appendLeadToSheet(lead);
  }

  if (provider === 'excel') {
    return excelService.appendLeadToExcel(lead);
  }

  const results = await Promise.allSettled([
    isGoogleConfigured() ? appendLeadToSheet(lead) : Promise.resolve(null),
    excelService.isExcelConfigured() ? excelService.appendLeadToExcel(lead) : Promise.resolve(null),
  ]);

  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length === results.length) {
    logger.error('All storage backends failed', {
      errors: failures.map((item) => item.reason?.message),
    });
    throw failures[0].reason;
  }

  if (failures.length) {
    logger.warn('Lead saved to one storage backend, another failed', {
      errors: failures.map((item) => item.reason?.message),
    });
  }

  return lead;
}

export async function getLeadStats() {
  assertStorageConfigured();
  const provider = env.storageProvider;

  if (provider === 'google') {
    return getGoogleLeadStats();
  }

  if (provider === 'excel') {
    return excelService.getExcelLeadStats();
  }

  if (excelService.isExcelConfigured()) {
    return excelService.getExcelLeadStats();
  }

  return getGoogleLeadStats();
}

export async function exportLeadsExcel() {
  if (!excelService.isExcelConfigured()) {
    throw new AppError('Excel export is not configured', 503, 'EXCEL_NOT_CONFIGURED');
  }
  return excelService.exportExcelBuffer();
}
