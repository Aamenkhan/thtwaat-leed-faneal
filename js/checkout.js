(function () {
  const USR_KEY = 'tt_user';
  const catalog = window.THTWAAT_CATALOG;

  const FALLBACK_PLANS = Object.fromEntries(
    (catalog?.plans || []).map((plan) => [plan.id, plan]),
  );

  let paymentPlans = { ...FALLBACK_PLANS };
  let categories = catalog?.categories || [{ id: 'all', label: 'All Plans', emoji: '✨' }];
  let selPlanId = 'website-start';
  let activeCategory = 'all';
  let checkoutStep = 1;
  let razorpayConfigured = false;
  let paymentBusy = false;

  function $(id) {
    return document.getElementById(id);
  }

  function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits;
  }

  function formatInr(paise) {
    if (catalog?.formatInr) return catalog.formatInr(paise);
    return '₹' + Math.round(paise / 100).toLocaleString('en-IN');
  }

  function resolvePlanId(planId) {
    if (catalog?.resolvePlanId) return catalog.resolvePlanId(planId);
    return planId;
  }

  function getPlan(planId) {
    const id = resolvePlanId(planId || selPlanId);
    return paymentPlans[id] || FALLBACK_PLANS[id] || FALLBACK_PLANS['website-start'];
  }

  function getQueryPlan() {
    const params = new URLSearchParams(window.location.search);
    const plan = resolvePlanId(params.get('plan'));
    return paymentPlans[plan] || FALLBACK_PLANS[plan] ? plan : 'website-start';
  }

  function showError(msg) {
    $('checkoutError').hidden = false;
    $('checkoutError').textContent = msg;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideError() {
    $('checkoutError').hidden = true;
  }

  function filteredPlans() {
    const plans = Object.values(paymentPlans);
    if (activeCategory === 'all') return plans;
    return plans.filter((p) => p.category === activeCategory);
  }

  function renderCategoryFilters() {
    const container = $('catFilters');
    const cats = categories.some((c) => c.id === 'all')
      ? categories
      : [{ id: 'all', label: 'All Plans', emoji: '✨' }, ...categories.filter((c) => c.id !== 'all')];

    container.innerHTML = cats
      .map(
        (cat) =>
          `<button type="button" class="cat-btn ${cat.id === activeCategory ? 'on' : ''}" data-cat="${cat.id}">${cat.emoji || ''} ${cat.label}</button>`,
      )
      .join('');

    container.querySelectorAll('.cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderCategoryFilters();
        renderPlans();
      });
    });
  }

  function renderPlans() {
    const container = $('planList');
    const plans = filteredPlans();

    if (!plans.some((p) => p.id === selPlanId)) {
      selPlanId = plans[0]?.id || selPlanId;
    }

    container.innerHTML = plans
      .map((plan) => {
        const on = plan.id === selPlanId;
        return `
        <label class="plan-card ${on ? 'on' : ''}" data-plan-id="${plan.id}">
          <input type="radio" name="plan" value="${plan.id}" ${on ? 'checked' : ''}/>
          <span class="plan-emoji">${plan.emoji || '📦'}</span>
          <div>
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">${formatInr(plan.amount)} · ${plan.delivery || ''}</div>
            <div class="plan-tag">${plan.tagline || ''}</div>
          </div>
        </label>`;
      })
      .join('');

    container.querySelectorAll('.plan-card').forEach((card) => {
      card.addEventListener('click', () => selectPlan(card.dataset.planId));
    });
  }

  function selectPlan(planId) {
    selPlanId = resolvePlanId(planId);
    document.querySelectorAll('.plan-card').forEach((card) => {
      const on = card.dataset.planId === selPlanId;
      card.classList.toggle('on', on);
      card.querySelector('input').checked = on;
    });
    updateSummary();
  }

  function setPayButtonsDisabled(disabled) {
    $('payUpiBtn').disabled = disabled;
    $('payCardBtn').disabled = disabled;
    paymentBusy = disabled;
  }

  function updateSummary() {
    const plan = getPlan(selPlanId);
    $('summaryPlan').textContent = plan.name;
    $('summaryDelivery').textContent = plan.delivery || '—';
    $('summaryAmount').textContent = formatInr(plan.amount);
    if (!paymentBusy) setPayButtonsDisabled(false);
  }

  function setStep(step) {
    checkoutStep = step;
    $('stepCheckout').classList.toggle('on', step === 1);
    $('stepPayment').classList.toggle('on', step === 2);
    $('panelCheckout').hidden = step !== 1;
    $('panelPayment').hidden = step !== 2;
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateCheckoutForm() {
    const name = $('cName').value.trim();
    const email = $('cEmail').value.trim();
    const phone = $('cPhone').value.trim();

    if (!name || !email || !phone) {
      showError('Please fill in your name, email, and phone number.');
      return null;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address.');
      return null;
    }
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 10) {
      showError('Please enter a valid 10-digit WhatsApp number.');
      return null;
    }

    return { name, email, phone: phoneDigits };
  }

  function goToPaymentStep() {
    const customer = validateCheckoutForm();
    if (!customer) return;

    $('summaryName').textContent = customer.name;
    $('summaryEmail').textContent = customer.email;
    $('summaryPhone').textContent = customer.phone;
    updateSummary();
    setStep(2);
  }

  function buildRazorpayConfig(method) {
    if (method === 'upi') {
      return {
        display: {
          blocks: {
            upiBlock: {
              name: 'Pay with UPI',
              instruments: [{ method: 'upi' }],
            },
          },
          sequence: ['block.upiBlock'],
          preferences: { show_default_blocks: false },
        },
      };
    }

    return {
      display: {
        blocks: {
          cardBlock: {
            name: 'Pay with Card',
            instruments: [{ method: 'card' }],
          },
        },
        sequence: ['block.cardBlock'],
        preferences: { show_default_blocks: false },
      },
    };
  }

  async function launchPayment(method) {
    if (paymentBusy) return;

    const customer = validateCheckoutForm();
    if (!customer) {
      setStep(1);
      return;
    }

    if (!window.ThtwaatPayments) {
      showError('Payment system not loaded. Please refresh the page.');
      return;
    }

    if (!razorpayConfigured) {
      showError('Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel.');
      return;
    }

    if (typeof Razorpay === 'undefined') {
      showError('Razorpay checkout failed to load. Check your internet connection.');
      return;
    }

    const upiId = $('cUpi').value.trim();
    if (method === 'upi' && upiId && !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upiId)) {
      showError('Please enter a valid UPI ID (example: yourname@paytm).');
      return;
    }

    setPayButtonsDisabled(true);
    hideError();

    const activeBtn = method === 'upi' ? $('payUpiBtn') : $('payCardBtn');
    const originalHtml = activeBtn.innerHTML;
    activeBtn.innerHTML = '<span>Opening secure checkout...</span>';

    try {
      const order = await ThtwaatPayments.createOrder({
        planId: selPlanId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });

      const plan = getPlan(selPlanId);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Thtwaat Technology Solutions',
        description: order.planName || plan.name,
        order_id: order.orderId,
        handler: async function (resp) {
          setPayButtonsDisabled(true);
          activeBtn.innerHTML = '<span>Verifying payment...</span>';
          try {
            const verified = await ThtwaatPayments.verifyPayment({
              planId: selPlanId,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });

            window.location.href =
              '/checkout?success=1&payment_id=' +
              encodeURIComponent(verified.paymentId) +
              '&plan=' +
              encodeURIComponent(selPlanId);
          } catch (err) {
            showError(
              'Payment received but verification failed. Save this Payment ID: ' +
                resp.razorpay_payment_id +
                ' — ' +
                err.message,
            );
            activeBtn.innerHTML = originalHtml;
            setPayButtonsDisabled(false);
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        notes: {
          service: order.planName || plan.name,
          paymentMethod: method,
          customerUpi: upiId || '',
        },
        theme: { color: method === 'upi' ? '#06D6A0' : '#F0B429' },
        config: buildRazorpayConfig(method),
        modal: {
          ondismiss: function () {
            activeBtn.innerHTML = originalHtml;
            setPayButtonsDisabled(false);
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (r) {
        showError('Payment failed: ' + (r.error?.description || 'Please try again.'));
        activeBtn.innerHTML = originalHtml;
        setPayButtonsDisabled(false);
      });
      rzp.open();
      activeBtn.innerHTML = originalHtml;
      setPayButtonsDisabled(false);
    } catch (err) {
      showError(err.message);
      activeBtn.innerHTML = originalHtml;
      setPayButtonsDisabled(false);
    }
  }

  function prefillUser() {
    try {
      const saved = localStorage.getItem(USR_KEY);
      if (!saved) return;
      const user = JSON.parse(saved);
      if (user.name) $('cName').value = user.name;
      if (user.email) $('cEmail').value = user.email;
      if (user.phone) $('cPhone').value = user.phone;
    } catch {
      /* ignore */
    }
  }

  function showSuccessState() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') !== '1') return;

    $('checkoutFlow').hidden = true;
    $('successPanel').hidden = false;
    $('successPaymentId').textContent = params.get('payment_id') || '—';
    $('successPlan').textContent = getPlan(params.get('plan') || selPlanId).name;
  }

  async function loadConfig() {
    if (!window.ThtwaatPayments) return;
    try {
      const config = await ThtwaatPayments.getConfig();
      razorpayConfigured = Boolean(config.configured);
      if (config.plans?.length) {
        paymentPlans = Object.fromEntries(config.plans.map((plan) => [plan.id, plan]));
      }
      if (config.categories?.length) {
        categories = [{ id: 'all', label: 'All Plans', emoji: '✨' }, ...config.categories];
      }
    } catch (err) {
      console.warn('[Checkout] Using catalog fallback', err.message);
    }
  }

  function init() {
    selPlanId = getQueryPlan();
    renderCategoryFilters();
    renderPlans();
    prefillUser();
    updateSummary();
    showSuccessState();

    $('continueBtn').addEventListener('click', goToPaymentStep);
    $('backBtn').addEventListener('click', () => setStep(1));
    $('payUpiBtn').addEventListener('click', () => launchPayment('upi'));
    $('payCardBtn').addEventListener('click', () => launchPayment('card'));

    ['cName', 'cEmail', 'cPhone'].forEach((id) => {
      $(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && checkoutStep === 1) goToPaymentStep();
      });
    });

    loadConfig().then(() => {
      renderCategoryFilters();
      renderPlans();
      updateSummary();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
