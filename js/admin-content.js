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

      const liveNote = [];
      if (data.usingDefaultYoutube) liveNote.push('demo video');
      if (data.usingDefaultTemplates) liveNote.push('demo templates');
      if (data.usingDefaultReviews) liveNote.push('demo reviews');
      if (liveNote.length) {
        setStatus(
          $('contentStatus'),
          'loading',
          `Website shows ${liveNote.join(', ')}. Click "Load & Save Sample Content" to publish samples permanently, or edit below.`,
        );
      }
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
    }
  }

  async function saveYoutube() {
    const apiKey = getApiKey();
    const status = $('youtubeStatus');
    if (!apiKey) {
      setStatus(status, 'error', 'Enter ADMIN_API_KEY first.');
      return false;
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
      return true;
    } catch (error) {
      setStatus(status, 'error', error.message);
      return false;
    }
  }

  async function saveTemplates() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus($('contentStatus'), 'error', 'Enter ADMIN_API_KEY first.');
      return false;
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
      return true;
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
      return false;
    }
  }

  async function saveReviews() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus($('contentStatus'), 'error', 'Enter ADMIN_API_KEY first.');
      return false;
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
      return true;
    } catch (error) {
      setStatus($('contentStatus'), 'error', error.message);
      return false;
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

  function applySampleDrafts() {
    const sample = window.THTWAAT_SAMPLE_CONTENT;
    if (!sample) return false;

    $('youtubeUrl').value = sample.youtube.url;
    $('youtubeTitle').value = sample.youtube.title;
    $('youtubeSubtitle').value = sample.youtube.subtitle;
    templatesDraft = sample.templates.map((item) => ({ ...item }));
    reviewsDraft = sample.reviews.map((item) => ({ ...item }));
    renderTemplateList();
    renderReviewList();
    return true;
  }

  async function loadAndSaveSampleContent() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus($('contentStatus'), 'error', 'Enter ADMIN_API_KEY first.');
      return;
    }
    if (!applySampleDrafts()) {
      setStatus($('contentStatus'), 'error', 'Sample content file not loaded.');
      return;
    }

    setStatus($('contentStatus'), 'loading', 'Saving sample video, templates, and reviews...');
    const videoOk = await saveYoutube();
    const templatesOk = await saveTemplates();
    const reviewsOk = await saveReviews();

    if (videoOk && templatesOk && reviewsOk) {
      setStatus(
        $('contentStatus'),
        'loading',
        'Sample content saved! Website now has demo video, 6 templates, and 5 professional reviews.',
      );
      return;
    }

    setStatus($('contentStatus'), 'error', 'Some sample content failed to save. Check messages above and retry.');
  }

  function init() {
    $('saveYoutubeBtn').addEventListener('click', saveYoutube);
    $('addTemplateBtn').addEventListener('click', addTemplate);
    $('saveTemplatesBtn').addEventListener('click', saveTemplates);
    $('addReviewBtn').addEventListener('click', addReview);
    $('saveReviewsBtn').addEventListener('click', saveReviews);
    const loadSampleBtn = $('loadSampleBtn');
    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', loadAndSaveSampleContent);
    }
    const previewSampleBtn = $('previewSampleBtn');
    if (previewSampleBtn) {
      previewSampleBtn.addEventListener('click', () => {
        if (applySampleDrafts()) {
          setStatus($('contentStatus'), 'loading', 'Sample content loaded in forms. Click Save buttons or "Load & Save Sample Content".');
        }
      });
    }
    loadAllContent();
  }

  window.AdminContent = { loadAllContent, init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
