export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  return digits;
}

export function formatPhoneDisplay(phone) {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith('91') && normalized.length === 12) {
    return `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`;
  }
  return normalized ? `+${normalized}` : '';
}
