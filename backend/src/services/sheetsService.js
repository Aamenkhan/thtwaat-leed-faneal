import { google } from 'googleapis';
import { env, parseServiceAccount } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import {
  LEAD_HEADERS,
  leadToRow,
  rowToLead,
  buildLeadStats,
} from '../constants/storage.js';

const SHEET_NAME = 'Leads';

let sheetsClient = null;
let headersInitialized = false;

function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const credentials = parseServiceAccount();
  if (!credentials || !env.googleSheetId) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function ensureHeaders() {
  if (headersInitialized) {
    return;
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    throw new AppError('Google Sheets is not configured', 503, 'SHEETS_NOT_CONFIGURED');
  }

  const range = `${SHEET_NAME}!A1:H1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetId,
    range,
  });

  const firstRow = existing.data.values?.[0] || [];

  if (firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.googleSheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [LEAD_HEADERS] },
    });
    logger.info('Google Sheet headers initialized');
  }

  headersInitialized = true;
}

export async function appendLeadToSheet(lead) {
  await ensureHeaders();

  const sheets = getSheetsClient();
  const row = leadToRow(lead);

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.googleSheetId,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  logger.info('Lead saved to Google Sheets', { phone: lead.phone, source: lead.source });
  return lead;
}

export function isGoogleConfigured() {
  return Boolean(env.googleSheetId && env.googleServiceAccount);
}

export async function fetchLeadsFromSheet() {
  await ensureHeaders();

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetId,
    range: `${SHEET_NAME}!A2:H`,
  });

  const rows = response.data.values || [];

  return rows.map((row) => rowToLead(row));
}

export async function getLeadStats() {
  const leads = await fetchLeadsFromSheet();
  return buildLeadStats(leads);
}
