(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';
  let visions = [];
  let tickerIndex = 0;
  let tickerTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setFormStatus(type, message) {
    const el = $('visionFormStatus');
    if (!el) return;
    el.className = type || '';
    el.textContent = message || '';
  }

  function renderTicker() {
    const ticker = $('visionTicker');
    const peek = $('navVisionPeek');
    if (!ticker) return;

    if (!visions.length) {
      ticker.innerHTML = '<span class="vision-ticker-item">Be the first to share your vision with Thtwaat →</span>';
      if (peek) peek.textContent = 'Share your project vision';
      return;
    }

    const item = visions[tickerIndex % visions.length];
    const label = `<strong>${escapeHtml(item.name)}:</strong> ${escapeHtml(item.vision)}`;
    ticker.innerHTML = `<span class="vision-ticker-item vision-ticker-in">${label}</span>`;

    if (peek) {
      peek.textContent = `${item.name}: ${item.vision.slice(0, 72)}${item.vision.length > 72 ? '…' : ''}`;
    }
  }

  function startTicker() {
    if (tickerTimer) clearInterval(tickerTimer);
    renderTicker();
    if (visions.length <= 1) return;
    tickerTimer = setInterval(() => {
      tickerIndex += 1;
      renderTicker();
    }, 7000);
  }

  async function loadVisions() {
    try {
      const response = await fetch(`${API_BASE}/vision/public`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load visions');
      visions = payload.data?.visions || [];
      startTicker();
    } catch (error) {
      console.warn('[Vision Board]', error.message);
      visions = [];
      startTicker();
    }
  }

  function openVisionModal() {
    const modal = $('visionModal');
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const nameInput = $('visionName');
    if (nameInput && window.CU?.name) nameInput.value = window.CU.name;
    const emailInput = $('visionEmail');
    if (emailInput && window.CU?.email) emailInput.value = window.CU.email;
    const phoneInput = $('visionPhone');
    if (phoneInput && window.CU?.phone) phoneInput.value = window.CU.phone;
  }

  function closeVisionModal() {
    const modal = $('visionModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  async function submitVision(event) {
    event.preventDefault();
    setFormStatus('loading', 'Sending your vision to Thtwaat…');

    const payload = {
      name: $('visionName').value.trim(),
      email: $('visionEmail').value.trim(),
      phone: $('visionPhone').value.trim(),
      vision: $('visionText').value.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/vision/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Failed to send vision');

      const posted = data.data?.facebookPosted;
      setFormStatus(
        'success',
        posted
          ? 'Vision saved on website and posted to our Facebook Page as "Your Vision".'
          : 'Vision saved on website and sent to admin. Facebook will post once configured.',
      );

      $('visionText').value = '';
      await loadVisions();
      setTimeout(closeVisionModal, 1800);
    } catch (error) {
      setFormStatus('error', error.message);
    }
  }

  function init() {
    $('visionToggleBtn')?.addEventListener('click', openVisionModal);
    $('visionModalClose')?.addEventListener('click', closeVisionModal);
    $('visionForm')?.addEventListener('submit', submitVision);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeVisionModal();
    });
    loadVisions();
  }

  window.VisionBoard = { loadVisions, openVisionModal, closeVisionModal };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
