/**
 * THTWAAT Lead API client for website forms.
 */
(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';

  async function submitLead(payload) {
    const response = await fetch(`${API_BASE}/lead/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'Failed to submit lead';
      throw new Error(message);
    }

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
