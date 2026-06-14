(function () {
  const catalog = window.THTWAAT_CATALOG;
  if (!catalog) return;

  const fmt = catalog.formatUsd || catalog.formatInr;
  const FEATURED = ['project-chat-start', 'website-start', 'app-start', 'custom-app', 'ai-automation', 'ai-llm-project', 'full-ecosystem'];

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
        <div class="pq-card hot" style="border-color:#10b981;background:linear-gradient(135deg,rgba(16,185,129,.12),var(--bg3))">
          <span>Start Chat</span><strong>${fmt(100)}</strong><small>Talk about your project — instant access</small>
          <button class="p-btn solid btn-chat-start" onclick="openPayFor('project-chat-start')">Start Chat $1 →</button>
        </div>
        <div class="pq-card"><span>Starter</span><strong>${fmt(9900)}</strong><small>Website &amp; landing pages</small><button class="p-btn solid" onclick="openPayFor('website-start')">Start at $99 →</button></div>
        <div class="pq-card hot"><span>Most Popular</span><strong>${fmt(99900)}</strong><small>App · Web · AI automation</small><button class="p-btn solid" onclick="openPayFor('app-start')">Get Started $999 →</button></div>
        <div class="pq-card"><span>Enterprise</span><strong>${fmt(1499999900)}</strong><small>Full ecosystem — end to end</small><button class="p-btn outline" onclick="openPayFor('full-ecosystem')">Contact Sales →</button></div>
      </div>
      <p class="price-note rev">All prices fixed upfront · Secure checkout with credit/debit card or UPI · No hidden fees.</p>
    `;

    Object.values(byCategory).forEach((group) => {
      if (!group.plans.length) return;
      html += `
        <div class="pricing-cat rev">
          <div class="pricing-cat-head">
            <span class="pricing-cat-emoji">${group.emoji || '📦'}</span>
            <div>
              <h3 class="pricing-cat-title">${group.label}</h3>
              <p class="pricing-cat-sub">${group.plans.length} packages · instant checkout</p>
            </div>
          </div>
          <div class="pricing-grid">
      `;

      group.plans.forEach((plan) => {
        const hot = FEATURED.includes(plan.id) ? ' hot' : '';
        const hotBadge = plan.id === 'project-chat-start'
          ? '<div class="p-hot-badge" style="background:#10b981;color:#fff">Start Chat</div>'
          : plan.id === 'app-start'
            ? '<div class="p-hot-badge">Most Popular</div>'
            : '';
        html += `
          <div class="p-card${hot} rev">
            ${hotBadge}
            <div class="p-emoji">${plan.emoji || '📦'}</div>
            <div class="p-name">${plan.name}</div>
            <div class="p-tagline">${plan.tagline || ''}</div>
            <div class="p-price">${fmt(plan.amount)}</div>
            <div class="p-period">${plan.delivery || ''}</div>
            <ul class="p-feats">${(plan.feats || []).slice(0, 4).map((f) => `<li>${f}</li>`).join('')}</ul>
            <button class="p-btn ${plan.amount <= 99900 ? 'solid' : 'outline'}${plan.id === 'project-chat-start' ? ' btn-chat-start' : ''}" onclick="openPayFor('${plan.id}')">${plan.id === 'project-chat-start' ? 'Start Chat $1 →' : 'Checkout →'}</button>
          </div>
        `;
      });

      html += `</div></div>`;
    });

    html += `
      <div class="pricing-all rev">
        <p>Questions before you buy? <a href="#mvp">Book a free strategy call</a> or go straight to secure checkout.</p>
        <button class="p-btn solid" onclick="openPay()" style="margin-top:1rem">Open Secure Checkout →</button>
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
