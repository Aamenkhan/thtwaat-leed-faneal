(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';

  function stars(rating) {
    const count = Math.min(5, Math.max(1, Number(rating) || 5));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  function initials(name) {
    return String(name || 'C')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTemplates(templates) {
    const root = document.getElementById('templatesGrid');
    if (!root) return;

    if (!templates.length) {
      root.innerHTML = '<div class="content-empty">Templates will appear here once added in Admin.</div>';
      return;
    }

    root.innerHTML = templates
      .map((item) => {
        const image = item.imageUrl
          ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy"/>`
          : `<div class="template-fallback"><span>${escapeHtml(item.category || 'Template')}</span></div>`;
        const badge = item.badge ? `<span class="template-badge">${escapeHtml(item.badge)}</span>` : '';
        const cta = item.previewUrl
          ? `<a class="template-link" href="${escapeHtml(item.previewUrl)}">Use Template →</a>`
          : `<button class="template-link" type="button" onclick="openPay()">Get Started →</button>`;

        return `
          <article class="template-card rev">
            <div class="template-media">${image}${badge}</div>
            <div class="template-body">
              <div class="template-cat">${escapeHtml(item.category || 'Template')}</div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description || '')}</p>
              ${cta}
            </div>
          </article>`;
      })
      .join('');

    if (window.initReveal) window.initReveal();
  }

  function renderReviews(reviews) {
    const root = document.getElementById('reviewsGrid');
    if (!root) return;

    if (!reviews.length) {
      root.innerHTML = '<div class="content-empty">Client reviews will appear here once added in Admin.</div>';
      return;
    }

    root.innerHTML = reviews
      .map((item) => {
        const avatar = item.avatarUrl
          ? `<img src="${escapeHtml(item.avatarUrl)}" alt="${escapeHtml(item.name)}" loading="lazy"/>`
          : `<span>${initials(item.name)}</span>`;

        return `
          <article class="review-card rev">
            <div class="review-stars">${stars(item.rating)}</div>
            <p class="review-text">"${escapeHtml(item.text)}"</p>
            <div class="review-author">
              <div class="review-avatar">${avatar}</div>
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml([item.role, item.company].filter(Boolean).join(' · '))}</span>
              </div>
            </div>
          </article>`;
      })
      .join('');

    if (window.initReveal) window.initReveal();
  }

  function renderServiceVideos(videos) {
    const root = document.getElementById('serviceVideosGrid');
    if (!root) return;

    if (!videos.length) {
      root.innerHTML = '<div class="content-empty">Service videos will appear here once added in Admin.</div>';
      return;
    }

    root.innerHTML = videos
      .map((item) => {
        const videoId = item.videoId || '';
        const thumb = videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : '';
        return `
          <article class="svc-video-card rev" data-video-id="${escapeHtml(videoId)}">
            <div class="svc-video-thumb" style="background-image:url('${thumb}')" onclick="playServiceVideo('${escapeHtml(videoId)}', this)" role="button" tabindex="0" aria-label="Play ${escapeHtml(item.title)}">
              <div class="yt-play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
            <div class="svc-video-body">
              <div class="svc-video-cat">${escapeHtml(item.category || 'Service')}</div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description || '')}</p>
            </div>
          </article>`;
      })
      .join('');

    if (window.initReveal) window.initReveal();
  }

  function playServiceVideo(videoId, el) {
    if (!videoId || !el) return;
    if (el.querySelector('iframe')) return;
    el.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="Service video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  window.playServiceVideo = playServiceVideo;

  function applyYoutubeContent(youtube) {
    const videoId = youtube?.videoId || '';
    const title = youtube?.title || 'Company Services Demo';
    const subtitle = youtube?.subtitle || 'Watch how we deliver apps, websites, AI automation, and full ecosystems.';

    const titleEl = document.getElementById('videoTitle');
    const subEl = document.getElementById('videoSubtitle');
    const labelEl = document.getElementById('ytLabel');
    const wrap = document.getElementById('videoWrap');
    const placeholder = document.getElementById('ytPlaceholder');
    const heroBtn = document.getElementById('heroWatchBtn');

    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    if (labelEl) labelEl.textContent = title;

    if (typeof window.applyYoutubeVideo === 'function') {
      window.applyYoutubeVideo(youtube?.url || '', videoId);
    }

    if (wrap) wrap.hidden = false;

    if (!videoId && placeholder) {
      placeholder.classList.remove('has-thumb');
      placeholder.style.backgroundImage = '';
      const sublabel = placeholder.querySelector('.yt-sublabel');
      if (sublabel) {
        sublabel.textContent = 'Add your company demo video in Admin → YouTube section';
      }
    }

    if (heroBtn) heroBtn.hidden = !videoId;
  }

  async function loadSiteContent() {
    try {
      const response = await fetch(`${API_BASE}/settings/content`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load site content');

      const data = payload.data || {};
      applyYoutubeContent(data.youtube);
      renderServiceVideos(data.serviceVideos || []);
      renderTemplates(data.templates || []);
      renderReviews(data.reviews || []);
    } catch (error) {
      console.warn('[Site Content]', error.message);
      applyYoutubeContent({});
      renderServiceVideos([]);
      renderTemplates([]);
      renderReviews([]);
    }
  }

  window.ThtwaatSiteContent = { loadSiteContent };
  loadSiteContent();
})();
