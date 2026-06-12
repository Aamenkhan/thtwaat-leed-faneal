export const LEAD_HEADERS = [
  'Name',
  'Phone',
  'Email',
  'Message',
  'Source',
  'Timestamp',
  'Lead Score',
  'AI Summary',
];

export const EXCEL_BLOB_NAME = 'thtwaat-leads.xlsx';

export function parseCategoryFromSummary(aiSummary) {
  const match = String(aiSummary || '').match(/\[Category:\s*(.+?)\]/i);
  return match ? match[1].trim() : 'Uncategorized';
}

export function rowToLead(row) {
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
}

export function leadToRow(lead) {
  return [
    lead.name,
    lead.phone,
    lead.email || '',
    lead.message,
    lead.source,
    lead.timestamp,
    lead.leadScore,
    lead.aiSummary,
  ];
}

export function buildLeadStats(leads) {
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
    leads: [...leads].reverse(),
  };
}
