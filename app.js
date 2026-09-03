/**
 * PogX Waitlist Application Logic
 * Modern, accessible, client-side validation, state transitions, and API sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email-input');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');
  const inputGroup = document.querySelector('.form-input-group');
  
  const successView = document.getElementById('waitlist-success');
  const confirmedEmailEl = document.getElementById('confirmed-email');
  const queuePosEl = document.getElementById('queue-position-display');
  const refInput = document.getElementById('referral-link-input');
  const copyRefBtn = document.getElementById('copy-ref-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const resetBtn = document.getElementById('reset-form-btn');
  const proofCountEl = document.getElementById('proof-count-display');
  const toastEl = document.getElementById('toast');

  // Modals
  const manifestoModal = document.getElementById('manifesto-modal');
  const openManifestoBtn = document.getElementById('open-manifesto-btn');
  const closeManifestoBtn = document.getElementById('close-manifesto-btn');
  const manifestoJoinBtn = document.getElementById('manifesto-join-btn');

  const privacyModal = document.getElementById('privacy-modal');
  const openPrivacyBtn = document.getElementById('open-privacy-btn');
  const closePrivacyBtn = document.getElementById('close-privacy-btn');

  const termsModal = document.getElementById('terms-modal');
  const openTermsBtn = document.getElementById('open-terms-btn');
  const closeTermsBtn = document.getElementById('close-terms-btn');

  const LOCAL_STORAGE_KEY = 'pogx_waitlist_data';

  // Extract referral code from URL query params if present
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref') || null;

  // Initialize count and check saved state
  fetchInitialCount();
  checkSavedSubmission();

  // Helper to format real subscriber count in UI
  function updateProofCounter(count) {
    if (!proofCountEl) return;
    if (typeof count !== 'number' || count <= 0) {
      proofCountEl.textContent = 'Early access queue open';
    } else if (count === 1) {
      proofCountEl.innerHTML = '<strong>1</strong> creator on the waitlist';
    } else {
      proofCountEl.innerHTML = `<strong>${count.toLocaleString()}</strong> creators on the waitlist`;
    }
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();

    // Validation
    if (!email) {
      showError('Please enter your creator email address.');
      emailInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address (e.g. name@domain.com).');
      emailInput.focus();
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ref: refParam }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to join waitlist. Please try again.');
      }

      // Save submission locally
      saveSubmission({
        email,
        position: data.position,
        referralCode: data.referralCode,
      });

      // Update UI with real server data
      renderSuccess(email, data.position, data.referralCode);
      if (typeof data.total === 'number') {
        updateProofCounter(data.total);
      }

      showToast(data.alreadyRegistered 
        ? `Welcome back! Your spot is #${data.position}.` 
        : `You're in! Reserved Spot #${data.position}.`);
    } catch (err) {
      showError(err.message || 'Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Real-time error clearing when user types
  emailInput.addEventListener('input', () => {
    if (inputGroup.classList.contains('has-error')) {
      clearError();
    }
  });

  // Copy Referral Link
  copyRefBtn.addEventListener('click', async () => {
    const textToCopy = refInput.value;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        refInput.select();
        document.execCommand('copy');
      }
      copyBtnText.textContent = 'Copied!';
      copyRefBtn.style.backgroundColor = 'rgba(139, 92, 246, 0.35)';
      showToast('Referral link copied to clipboard!');

      setTimeout(() => {
        copyBtnText.textContent = 'Copy Link';
        copyRefBtn.style.backgroundColor = '';
      }, 2500);
    } catch (err) {
      refInput.select();
      showToast('Press Ctrl+C to copy your link.');
    }
  });

  // Reset Button (Register another email)
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    successView.classList.add('hidden');
    form.classList.remove('hidden');
    emailInput.value = '';
    clearError();
    setTimeout(() => emailInput.focus(), 100);
  });

  // Modal Handlers
  function setupModal(modal, openBtn, closeBtn) {
    if (!modal || !openBtn || !closeBtn) return;

    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      const firstClose = modal.querySelector('button');
      if (firstClose) firstClose.focus();
    });

    closeBtn.addEventListener('click', () => {
      closeModal(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  setupModal(manifestoModal, openManifestoBtn, closeManifestoBtn);
  setupModal(privacyModal, openPrivacyBtn, closePrivacyBtn);
  setupModal(termsModal, openTermsBtn, closeTermsBtn);

  if (manifestoJoinBtn) {
    manifestoJoinBtn.addEventListener('click', () => {
      closeModal(manifestoModal);
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => emailInput.focus(), 400);
    });
  }

  // Keyboard Shortcuts: Close active modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [manifestoModal, privacyModal, termsModal].forEach(m => {
        if (m && !m.classList.contains('hidden')) {
          closeModal(m);
        }
      });
    }
  });

  // Helper Functions
  function showError(msg) {
    inputGroup.classList.add('has-error');
    formError.textContent = msg;
    formError.classList.add('active');
  }

  function clearError() {
    inputGroup.classList.remove('has-error');
    formError.textContent = '';
    formError.classList.remove('active');
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      emailInput.disabled = true;
    } else {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      emailInput.disabled = false;
    }
  }

  function renderSuccess(email, position, referralCode) {
    form.classList.add('hidden');
    successView.classList.remove('hidden');

    confirmedEmailEl.textContent = email;
    queuePosEl.textContent = Number(position).toLocaleString();
    refInput.value = `https://pogx.net/?ref=${referralCode || 'CREATOR'}`;
  }

  function saveSubmission(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage disabled');
    }
  }

  function checkSavedSubmission() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.email && data.position) {
          renderSuccess(data.email, data.position, data.referralCode);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  async function fetchInitialCount() {
    try {
      if (window.location.protocol.startsWith('http')) {
        const res = await fetch('/api/waitlist-count');
        if (res.ok) {
          const data = await res.json();
          updateProofCounter(data.count);
        }
      }
    } catch {
      // Keep default 'Early access queue open'
    }
  }

  let toastTimeout;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('active');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('active');
    }, 3200);
  }
});
