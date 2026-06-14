/**
 * THTWAAT Razorpay payment client.
 */
(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';

  async function parseJsonResponse(response) {
    try {
      return await response.json();
    } catch {
      throw new Error('Invalid response from payment API');
    }
  }

  async function getConfig() {
    const response = await fetch(`${API_BASE}/payment/config`);
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to load payment config');
    }
    return data.data;
  }

  async function createOrder({ planId, name, email, phone }) {
    const response = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, name, email, phone }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to create payment order');
    }
    return data.data;
  }

  async function verifyPayment(payload) {
    const response = await fetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Payment verification failed');
    }
    return data.data;
  }

  window.ThtwaatPayments = {
    getConfig,
    createOrder,
    verifyPayment,
  };
})();
