/**
 * THTWAAT Lead API client for website forms.
 */
(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';

  async function submitLead(payload) {
    const url = `${API_BASE}/lead/create`;
    console.info('[THTWAAT Lead] Submitting lead', { url, payload });

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      console.error('[THTWAAT Lead] Network error during submit', networkError);
      throw networkError;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[THTWAAT Lead] Failed to parse API response', {
        status: response.status,
        parseError,
      });
      throw new Error('Invalid response from lead API');
    }

    if (!response.ok) {
      const message = data?.error?.message || 'Failed to submit lead';
      console.error('[THTWAAT Lead] API rejected lead', {
        status: response.status,
        error: data?.error || message,
      });
      throw new Error(message);
    }

    console.info('[THTWAAT Lead] Lead saved successfully', data.data);
    return data.data;
  }

  async function submitWebsiteLead({ name, phone, email, message, source = 'Website' }) {
    return submitLead({ name, phone, email, message, source });
  }

  window.ThtwaatLeads = {
    submitLead,
    submitWebsiteLead,
  };
})();
