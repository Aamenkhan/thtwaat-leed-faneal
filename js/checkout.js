(function () {
  const API_BASE = window.THTWAAT_API_BASE || '';
  const USR_KEY = 'tt_user';

  const FALLBACK_PLANS = {
    'mobile-app': { id: 'mobile-app', name: 'Mobile App — Flutter', amount: 2999900, delivery: '21 day delivery' },
    website: { id: 'website', name: 'Website — Professional', amount: 999900, delivery: '7 day delivery' },
    'web-app': { id: 'web-app', name: 'Web App / SaaS Platform', amount: 3999900, delivery: '30 day delivery' },
    'ai-automation': { id: 'ai-automation', name: 'AI Automation / WhatsApp Bot', amount: 1999900, delivery: '14 day delivery' },
    'ai-llm': { id: 'ai-llm', name: 'AI / LLM Custom Project', amount: 5999900, delivery: '35-45 day delivery' },
    'digital-marketing': { id: 'digital-marketing', name: 'Digital Marketing Retainer', amount: 799900, delivery: 'monthly' },
  };

  let paymentPlans = { ...FALLBACK_PLANS };
  let selPlanId = 'mobile-app';
  let checkoutStep = 1;
  let razorpayConfigured = false;

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
    return '₹' + Math.round(paise / 100).toLocaleString('en-IN');
  }

  function getPlan(planId) {
    return paymentPlans[planId] || FALLBACK_PLANS[planId] || FALLBACK_PLANS['mobile-app'];
  }

  function getQueryPlan() {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    return plan && (paymentPlans[plan] || FALLBACK_PLANS[plan]) ? plan : 'mobile-app';
  }

  function showError(msg) {
    const el = $('checkoutError');
    el.hidden = false;
    el.textContent = msg;
  }

  function hideError() {
    $('checkoutError').hidden = true;
  }

  function renderPlans() {
    const container = $('planList');
    container.innerHTML = Object.values(paymentPlans)
      .map(
        (plan) => `
      <label class="plan-card ${plan.id === selPlanId ? 'on' : ''}" data-plan-id="${plan.id}">
        <input type="radio" name="plan" value="${plan.id}" ${plan.id === selPlanId ? 'checked' : ''}/>
        <div>
          <div class="plan-name">${plan.name}</div>
          <div class="plan-price">${formatInr(plan.amount)} · ${plan.delivery || ''}</div>
        </div>
      </label>`,
      )
      .join('');

    container.querySelectorAll('.plan-card').forEach((card) => {
      card.addEventListener('click', () => selectPlan(card.dataset.planId));
    });
  }

  function selectPlan(planId) {
    selPlanId = planId;
    document.querySelectorAll('.plan-card').forEach((card) => {
      const on = card.dataset.planId === planId;
      card.classList.toggle('on', on);
      card.querySelector('input').checked = on;
    });
    updateSummary();
  }

  function updateSummary() {
    const plan = getPlan(selPlanId);
    $('summaryPlan').textContent = plan.name;
    $('summaryDelivery').textContent = plan.delivery || '—';
    $('summaryAmount').textContent = formatInr(plan.amount);
    $('payBtn').textContent = 'Pay ' + formatInr(plan.amount) + ' · UPI / Card';
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
      showError('Please fill name, email, and phone number.');
      return null;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address.');
      return null;
    }
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 10) {
      showError('Please enter a valid 10-digit phone number.');
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

  async function launchPayment() {
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
      showError('Razorpay checkout script failed to load. Check your internet connection.');
      return;
    }

    const btn = $('payBtn');
    btn.disabled = true;
    btn.textContent = 'Creating order...';
    hideError();

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
          btn.textContent = 'Verifying payment...';
          btn.disabled = true;
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
              'Payment completed but verification failed. Save Payment ID: ' +
                resp.razorpay_payment_id +
                ' — ' +
                err.message,
            );
            btn.disabled = false;
            updateSummary();
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        notes: { service: order.planName || plan.name },
        theme: { color: '#F0B429' },
        modal: {
          ondismiss: function () {
            btn.disabled = false;
            updateSummary();
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (r) {
        showError('Payment failed: ' + (r.error?.description || 'Please try again.'));
        btn.disabled = false;
        updateSummary();
      });
      rzp.open();
      btn.disabled = false;
      btn.textContent = 'Complete payment in Razorpay window...';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      updateSummary();
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
    const plan = getPlan(params.get('plan') || selPlanId);
    $('successPlan').textContent = plan.name;
  }

  async function loadConfig() {
    if (!window.ThtwaatPayments) return;
    try {
      const config = await ThtwaatPayments.getConfig();
      razorpayConfigured = Boolean(config.configured);
      if (config.plans?.length) {
        paymentPlans = Object.fromEntries(config.plans.map((plan) => [plan.id, plan]));
      }
    } catch (err) {
      console.warn('[Checkout] Using fallback plans', err.message);
    }
  }

  function init() {
    selPlanId = getQueryPlan();
    renderPlans();
    prefillUser();
    updateSummary();
    showSuccessState();

    $('continueBtn').addEventListener('click', goToPaymentStep);
    $('backBtn').addEventListener('click', () => setStep(1));
    $('payBtn').addEventListener('click', launchPayment);

    ['cName', 'cEmail', 'cPhone'].forEach((id) => {
      $(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && checkoutStep === 1) goToPaymentStep();
      });
    });

    loadConfig();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
