import { google } from 'googleapis';
import { env, parseServiceAccount } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const SHEET_NAME = 'Leads';
const HEADERS = [
  'Name',
  'Phone',
  'Email',
  'Message',
  'Source',
  'Timestamp',
  'Lead Score',
  'AI Summary',
];

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
      requestBody: { values: [HEADERS] },
    });
    logger.info('Google Sheet headers initialized');
  }

  headersInitialized = true;
}

export async function appendLeadToSheet(lead) {
  await ensureHeaders();

  const sheets = getSheetsClient();
  const row = [
    lead.name,
    lead.phone,
    lead.email || '',
    lead.message,
    lead.source,
    lead.timestamp,
    String(lead.leadScore),
    lead.aiSummary,
  ];

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

function parseCategoryFromSummary(aiSummary) {
  const match = String(aiSummary || '').match(/\[Category:\s*(.+?)\]/i);
  return match ? match[1].trim() : 'Uncategorized';
}

export async function fetchLeadsFromSheet() {
  await ensureHeaders();

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetId,
    range: `${SHEET_NAME}!A2:H`,
  });

  const rows = response.data.values || [];

  return rows.map((row) => {
    const [name, phone, email, message, source, timestamp, leadScore, aiSummary] = row;
    return {
      name: name || '',
      phone: phone || '',
      email: email || '',
      message: message || '',
      source: source || 'Website',
      timestamp: timestamp || '',
      leadScore: Number(leadScore) || 0,
      aiSummary: aiSummary || '',
      category: parseCategoryFromSummary(aiSummary),
    };
  });
}

export async function getLeadStats() {
  const leads = await fetchLeadsFromSheet();
  const today = new Date().toISOString().slice(0, 10);

  const sources = {};
  const categories = {};

  let newLeadsToday = 0;

  for (const lead of leads) {
    sources[lead.source] = (sources[lead.source] || 0) + 1;
    categories[lead.category] = (categories[lead.category] || 0) + 1;

    if (lead.timestamp.startsWith(today)) {
      newLeadsToday += 1;
    }
  }

  return {
    totalLeads: leads.length,
    newLeadsToday,
    sources,
    categories,
    leads: leads.reverse(),
  };
}
