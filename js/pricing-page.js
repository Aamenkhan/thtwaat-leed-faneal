(function () {
  const catalog = window.THTWAAT_CATALOG;
  if (!catalog) return;

  const FEATURED = ['website-start', 'app-start', 'custom-app', 'ai-automation', 'ai-llm-project', 'full-ecosystem'];

  function renderPricing() {
    const root = document.getElementById('pricingCatalog');
    if (!root) return;

    const byCategory = {};
    catalog.categories
      .filter((c) => c.id !== 'all')
      .forEach((cat) => {
        byCategory[cat.id] = { ...cat, plans: catalog.plans.filter((p) => p.category === cat.id) };
      });

    let html = `
      <div class="pricing-quick rev">
        <div class="pq-card"><span>From</span><strong>${catalog.formatInr(9900)}</strong><small>Website & Landing Page</small><button class="p-btn solid" onclick="openPayFor('website-start')">Start at ₹99 →</button></div>
        <div class="pq-card hot"><span>Most Popular</span><strong>${catalog.formatInr(99900)}</strong><small>App · Web · AI Automation</small><button class="p-btn solid" onclick="openPayFor('app-start')">Book at ₹999 →</button></div>
        <div class="pq-card"><span>Enterprise</span><strong>${catalog.formatInr(1499999900)}</strong><small>Full ecosystem — start to end</small><button class="p-btn outline" onclick="openPayFor('full-ecosystem')">Talk to us →</button></div>
      </div>
    `;

    Object.values(byCategory).forEach((group) => {
      if (!group.plans.length) return;
      html += `
        <div class="pricing-cat rev">
          <div class="pricing-cat-head">
            <span class="pricing-cat-emoji">${group.emoji || '📦'}</span>
            <div>
              <h3 class="pricing-cat-title">${group.label}</h3>
              <p class="pricing-cat-sub">${group.plans.length} fixed-price packages</p>
            </div>
          </div>
          <div class="pricing-grid">
      `;

      group.plans.forEach((plan) => {
        const hot = FEATURED.includes(plan.id) ? ' hot' : '';
        html += `
          <div class="p-card${hot} rev">
            ${plan.id === 'app-start' ? '<div class="p-hot-badge">⭐ Popular</div>' : ''}
            <div class="p-emoji">${plan.emoji || '📦'}</div>
            <div class="p-name">${plan.name}</div>
            <div class="p-tagline">${plan.tagline || ''}</div>
            <div class="p-price">${catalog.formatInr(plan.amount)}</div>
            <div class="p-period">${plan.delivery || ''}</div>
            <ul class="p-feats">${(plan.feats || []).slice(0, 4).map((f) => `<li>${f}</li>`).join('')}</ul>
            <button class="p-btn ${plan.amount <= 99900 ? 'solid' : 'outline'}" onclick="openPayFor('${plan.id}')">Get Started →</button>
          </div>
        `;
      });

      html += `</div></div>`;
    });

    html += `
      <div class="pricing-all rev">
        <p>Not sure which plan fits? <a href="#mvp">Book a free MVP chat</a> or view all plans on checkout.</p>
        <button class="p-btn solid" onclick="openPay()" style="margin-top:1rem">View All Plans & Pay →</button>
      </div>
    `;

    root.innerHTML = html;

    if (window.initReveal) window.initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPricing);
  } else {
    renderPricing();
  }
})();
