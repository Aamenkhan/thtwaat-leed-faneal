import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { list, put } from '@vercel/blob';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import {
  LEAD_HEADERS,
  EXCEL_BLOB_NAME,
  leadToRow,
  rowToLead,
  buildLeadStats,
} from '../constants/storage.js';

function useBlobStorage() {
  return Boolean(env.blobReadWriteToken);
}

async function ensureDataDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadBufferFromFile() {
  try {
    return await fs.readFile(env.excelFilePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function saveBufferToFile(buffer) {
  await ensureDataDir(env.excelFilePath);
  await fs.writeFile(env.excelFilePath, buffer);
}

async function loadBufferFromBlob() {
  const { blobs } = await list({ prefix: EXCEL_BLOB_NAME, limit: 1 });
  if (!blobs.length) {
    return null;
  }

  const response = await fetch(blobs[0].url);
  if (!response.ok) {
    throw new AppError('Failed to load Excel file from Vercel Blob', 503, 'EXCEL_LOAD_FAILED');
  }

  return Buffer.from(await response.arrayBuffer());
}

async function saveBufferToBlob(buffer) {
  await put(EXCEL_BLOB_NAME, buffer, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

async function loadWorkbookBuffer() {
  if (useBlobStorage()) {
    return loadBufferFromBlob();
  }
  return loadBufferFromFile();
}

async function saveWorkbookBuffer(buffer) {
  if (useBlobStorage()) {
    await saveBufferToBlob(buffer);
    return;
  }
  await saveBufferToFile(buffer);
}

async function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'THTWAAT Lead System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Leads', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.addRow(LEAD_HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0B429' },
  };

  LEAD_HEADERS.forEach((_, index) => {
    sheet.getColumn(index + 1).width = index === 3 || index === 7 ? 36 : 18;
  });

  return workbook;
}

async function loadWorkbook() {
  const buffer = await loadWorkbookBuffer();
  const workbook = new ExcelJS.Workbook();

  if (buffer) {
    await workbook.xlsx.load(buffer);
    return workbook;
  }

  return createWorkbook();
}

async function persistWorkbook(workbook) {
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  await saveWorkbookBuffer(buffer);
  return buffer;
}

function readLeadsFromWorkbook(workbook) {
  const sheet = workbook.getWorksheet('Leads') || workbook.worksheets[0];
  if (!sheet) {
    return [];
  }

  const leads = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = LEAD_HEADERS.map((_, index) => {
      const cell = row.getCell(index + 1).value;
      if (cell == null) {
        return '';
      }
      if (typeof cell === 'object' && cell.text) {
        return String(cell.text);
      }
      return String(cell);
    });

    if (values.some(Boolean)) {
      leads.push(rowToLead(values));
    }
  });

  return leads;
}

export function isExcelConfigured() {
  if (process.env.VERCEL) {
    return Boolean(env.blobReadWriteToken);
  }
  return Boolean(env.excelFilePath);
}

export async function appendLeadToExcel(lead) {
  if (!isExcelConfigured()) {
    throw new AppError('Excel storage is not configured', 503, 'EXCEL_NOT_CONFIGURED');
  }

  const workbook = await loadWorkbook();
  const sheet = workbook.getWorksheet('Leads') || workbook.worksheets[0] || workbook.addWorksheet('Leads');

  if (sheet.rowCount === 0) {
    sheet.addRow(LEAD_HEADERS);
  }

  sheet.addRow(leadToRow(lead));
  await persistWorkbook(workbook);

  logger.info('Lead saved to Excel', {
    phone: lead.phone,
    source: lead.source,
    backend: useBlobStorage() ? 'vercel-blob' : 'file',
  });

  return lead;
}

export async function fetchLeadsFromExcel() {
  if (!isExcelConfigured()) {
    return [];
  }

  const workbook = await loadWorkbook();
  return readLeadsFromWorkbook(workbook);
}

export async function getExcelLeadStats() {
  const leads = await fetchLeadsFromExcel();
  return buildLeadStats(leads);
}

export async function exportExcelBuffer() {
  const workbook = await loadWorkbook();
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function getExcelStorageInfo() {
  return {
    configured: isExcelConfigured(),
    backend: useBlobStorage() ? 'vercel-blob' : 'local-file',
    path: useBlobStorage() ? EXCEL_BLOB_NAME : env.excelFilePath,
  };
}
