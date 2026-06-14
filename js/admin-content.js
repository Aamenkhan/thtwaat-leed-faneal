(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';

  let templatesDraft = [];
  let reviewsDraft = [];

  function $(id) {
    return document.getElementById(id);
  }

  function getApiKey() {
    return $('apiKey').value.trim();
  }

  function setStatus(el, type, message) {
    el.className = type;
    el.textContent = message;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function renderTemplateList() {
    const list = $('templateList');
    if (!templatesDraft.length) {
      list.innerHTML = '<div class="empty">No custom templates yet. Demo templates show on website until you save your own.</div>';
      return;
    }

    list.innerHTML = templatesDraft
      .map(
        (item, index) => `
        <div class="item-row">
          <div>
            <strong>${item.title}</strong>
            <div class="item-meta">${item.category}${item.badge ? ' · ' + item.badge : ''}</div>
          </div>
          <button type="button" class="btn btn-danger" data-remove-template="${index}">Remove</button>
        </div>`,
      )
      .join('');

    list.querySelectorAll('[data-remove-template]').forEach((btn) => {
      btn.addEventListener('click', () => {
        templatesDraft.splice(Number(btn.dataset.removeTemplate), 1);
        renderTemplateList();
      });
    });
  }

  function renderReviewList() {
    const list = $('reviewList');
    if (!reviewsDraft.length) {
      list.innerHTML = '<div class="empty">No custom reviews yet. Demo reviews show on website until you save your own.</div>';
      return;
    }

    list.innerHTML = reviewsDraft
      .map(
        (item, index) => `
        <div class="item-row">
          <div>
            <strong>${item.name}</strong>
            <div class="item-meta">${'★'.repeat(item.rating)} · ${item.company || item.role || ''}</div>
          </div>
          <button type="button" class="btn btn-danger" data-remove-review="${index}">Remove</button>
        </div>`,
      )
      .join('');

    list.querySelectorAll('[data-remove-review]').forEach((btn) => {
      btn.addEventListener('click', () => {
        reviewsDraft.splice(Number(btn.dataset.removeReview), 1);
        renderReviewList();
      });
    });
  }

  async function loadAllContent() {
    try {
      const response = await fetch(`${API_BASE}/settings/content`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load content');

      const data = payload.data || {};
      $('youtubeUrl').value = data.youtube?.url || '';
      $('youtubeTitle').value = data.youtube?.title || 'Company Services Demo';
      $('youtubeSubtitle').value = data.youtube?.subtitle || '';

      templatesDraft = data.usingDefaultTemplates ? [] : [...(data.templates || [])];
      reviewsDraft = data.usingDefaultReviews ? [] : [...(data.reviews || [])];

      renderTemplateList();
      renderReviewList();
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
    }
  }

  async function saveYoutube() {
    const apiKey = getApiKey();
    const status = $('youtubeStatus');
    if (!apiKey) {
      setStatus(status, 'error', 'Enter ADMIN_API_KEY first.');
      return;
    }

    setStatus(status, 'loading', 'Saving YouTube video...');
    try {
      const response = await fetch(`${API_BASE}/settings/youtube`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          url: $('youtubeUrl').value.trim(),
          title: $('youtubeTitle').value.trim(),
          subtitle: $('youtubeSubtitle').value.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to save YouTube');
      localStorage.setItem('tt_admin_api_key', apiKey);
      setStatus(status, 'loading', 'YouTube demo video saved to website.');
    } catch (error) {
      setStatus(status, 'error', error.message);
    }
  }

  async function saveTemplates() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus($('contentStatus'), 'error', 'Enter ADMIN_API_KEY first.');
      return;
    }

    setStatus($('contentStatus'), 'loading', 'Saving templates...');
    try {
      const response = await fetch(`${API_BASE}/settings/templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ templates: templatesDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to save templates');
      templatesDraft = payload.data.templates || [];
      renderTemplateList();
      setStatus($('contentStatus'), 'loading', 'Client templates saved to website.');
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
    }
  }

  async function saveReviews() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus($('contentStatus'), 'error', 'Enter ADMIN_API_KEY first.');
      return;
    }

    setStatus($('contentStatus'), 'loading', 'Saving reviews...');
    try {
      const response = await fetch(`${API_BASE}/settings/reviews`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ reviews: reviewsDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to save reviews');
      reviewsDraft = payload.data.reviews || [];
      renderReviewList();
      setStatus($('contentStatus'), 'loading', 'Client reviews saved to website.');
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
    }
  }

  function addTemplate() {
    const title = $('tplTitle').value.trim();
    if (!title) return;

    templatesDraft.push({
      id: uid('tpl'),
      title,
      category: $('tplCategory').value.trim() || 'Template',
      description: $('tplDesc').value.trim(),
      imageUrl: $('tplImage').value.trim(),
      previewUrl: $('tplLink').value.trim(),
      badge: $('tplBadge').value.trim(),
    });

    $('tplTitle').value = '';
    $('tplDesc').value = '';
    $('tplImage').value = '';
    $('tplLink').value = '';
    $('tplBadge').value = '';
    renderTemplateList();
  }

  function addReview() {
    const name = $('revName').value.trim();
    const text = $('revText').value.trim();
    if (!name || !text) return;

    reviewsDraft.push({
      id: uid('rev'),
      name,
      role: $('revRole').value.trim(),
      company: $('revCompany').value.trim(),
      rating: Number($('revRating').value) || 5,
      text,
      avatarUrl: $('revAvatar').value.trim(),
    });

    $('revName').value = '';
    $('revRole').value = '';
    $('revCompany').value = '';
    $('revText').value = '';
    $('revAvatar').value = '';
    renderReviewList();
  }

  function init() {
    $('saveYoutubeBtn').addEventListener('click', saveYoutube);
    $('addTemplateBtn').addEventListener('click', addTemplate);
    $('saveTemplatesBtn').addEventListener('click', saveTemplates);
    $('addReviewBtn').addEventListener('click', addReview);
    $('saveReviewsBtn').addEventListener('click', saveReviews);
    loadAllContent();
  }

  window.AdminContent = { loadAllContent, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
