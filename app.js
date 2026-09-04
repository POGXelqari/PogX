/**
 * PogX Waitlist Application Logic
 * Modern, accessible, client-side validation, floating nav handling, and server-side queue sync.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email-input');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');
  const inputRow = document.querySelector('.input-row');
  
  const successView = document.getElementById('waitlist-success');
  const confirmedEmailEl = document.getElementById('confirmed-email');
  const queuePosEl = document.getElementById('queue-position-display');
  const refInput = document.getElementById('referral-link-input');
  const copyRefBtn = document.getElementById('copy-ref-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const resetBtn = document.getElementById('reset-form-btn');
  const proofCountEl = document.getElementById('proof-count-display');
  const toastEl = document.getElementById('toast');

  // Navigation elements
  const navJoinBtn = document.getElementById('nav-join-btn');
  const mobileJoinBtn = document.getElementById('mobile-join-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');

  // Modals & triggers
  const aboutModal = document.getElementById('about-modal');
  const navAboutBtn = document.getElementById('nav-about-btn');
  const mobileAboutBtn = document.getElementById('mobile-about-btn');
  const closeAboutBtn = document.getElementById('close-about-btn');

  const mechanicsModal = document.getElementById('mechanics-modal');
  const navMechanicsBtn = document.getElementById('nav-mechanics-btn');
  const mobileMechanicsBtn = document.getElementById('mobile-mechanics-btn');
  const closeMechanicsBtn = document.getElementById('close-mechanics-btn');

  const manifestoModal = document.getElementById('manifesto-modal');
  const navManifestoBtn = document.getElementById('nav-manifesto-btn');
  const mobileManifestoBtn = document.getElementById('mobile-manifesto-btn');
  const closeManifestoBtn = document.getElementById('close-manifesto-btn');
  const manifestoJoinBtn = document.getElementById('manifesto-join-btn');

  const faqModal = document.getElementById('faq-modal');
  const navFaqBtn = document.getElementById('nav-faq-btn');
  const mobileFaqBtn = document.getElementById('mobile-faq-btn');
  const closeFaqBtn = document.getElementById('close-faq-btn');

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

  // Focus & Scroll to waitlist input
  function scrollToWaitlist() {
    if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
      mobileDrawer.classList.add('hidden');
    }
    if (emailInput) {
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => emailInput.focus(), 350);
    }
  }

  if (navJoinBtn) navJoinBtn.addEventListener('click', scrollToWaitlist);
  if (mobileJoinBtn) mobileJoinBtn.addEventListener('click', scrollToWaitlist);

  // Mobile Menu Toggle
  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileDrawer.classList.contains('hidden');
      if (isHidden) {
        mobileDrawer.classList.remove('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
      } else {
        mobileDrawer.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim().toLowerCase();

    // Client-side validation
    if (!email) {
      showError('Please enter your creator email address.');
      emailInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address (e.g. creator@pogx.net).');
      emailInput.focus();
      return;
    }

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
        referralCode: data.referralCode
      });

      // Update and reveal ticket
      renderSuccess(email, data.position, data.referralCode);

      // Update proof counter if total provided
      if (typeof data.total === 'number') {
        updateProofCounter(data.total);
      }

      showToast(data.alreadyRegistered ? `Welcome back! You are Spot #${data.position}.` : `You're in! Reserved Spot #${data.position}.`);
    } catch (err) {
      showError(err.message || 'Unable to reach server. Please check your network.');
    } finally {
      setLoading(false);
    }
  });

  // Clear error state on input change
  emailInput.addEventListener('input', () => {
    if (inputRow.classList.contains('has-error')) {
      clearError();
    }
  });

  // Handle Referral Copy
  copyRefBtn.addEventListener('click', async () => {
    const link = refInput.value;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        refInput.select();
        document.execCommand('copy');
      }
      copyBtnText.textContent = 'Copied!';
      copyRefBtn.style.backgroundColor = 'var(--accent-purple)';
      showToast('Referral link copied to clipboard!');

      setTimeout(() => {
        copyBtnText.textContent = 'Copy Link';
        copyRefBtn.style.backgroundColor = '';
      }, 2000);
    } catch (err) {
      refInput.select();
      showToast('Press Ctrl+C to copy link');
    }
  });

  // Reset form to register another email
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    successView.classList.add('hidden');
    form.classList.remove('hidden');
    emailInput.value = '';
    clearError();
    setTimeout(() => emailInput.focus(), 100);
  });

  // Modal Helper Setup
  function setupModal(modal, openBtns, closeBtn) {
    if (!modal) return;
    const btnList = Array.isArray(openBtns) ? openBtns : [openBtns];

    btnList.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
            mobileDrawer.classList.add('hidden');
          }
          modal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
          const focusable = modal.querySelector('button, [href], input, select, textarea');
          if (focusable) focusable.focus();
        });
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // Setup all modals
  setupModal(aboutModal, [navAboutBtn, mobileAboutBtn], closeAboutBtn);
  setupModal(mechanicsModal, [navMechanicsBtn, mobileMechanicsBtn], closeMechanicsBtn);
  setupModal(manifestoModal, [navManifestoBtn, mobileManifestoBtn], closeManifestoBtn);
  setupModal(faqModal, [navFaqBtn, mobileFaqBtn], closeFaqBtn);
  setupModal(privacyModal, openPrivacyBtn, closePrivacyBtn);
  setupModal(termsModal, openTermsBtn, closeTermsBtn);

  // Manifesto CTA: Close modal & focus waitlist
  if (manifestoJoinBtn) {
    manifestoJoinBtn.addEventListener('click', () => {
      closeModal(manifestoModal);
      scrollToWaitlist();
    });
  }

  // Global ESC key listener for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [aboutModal, mechanicsModal, manifestoModal, faqModal, privacyModal, termsModal].forEach(modal => {
        if (modal && !modal.classList.contains('hidden')) closeModal(modal);
      });
      if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
        mobileDrawer.classList.add('hidden');
      }
    }
  });

  // UI State Helpers
  function showError(msg) {
    inputRow.classList.add('has-error');
    formError.textContent = msg;
    formError.classList.remove('hidden');
  }

  function clearError() {
    inputRow.classList.remove('has-error');
    formError.textContent = '';
    formError.classList.add('hidden');
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
    confirmedEmailEl.textContent = email;
    queuePosEl.textContent = Number(position).toLocaleString();
    refInput.value = `https://pogx.net/?ref=${referralCode || 'COHORT01'}`;
    successView.classList.remove('hidden');
  }

  function saveSubmission(payload) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage unavailable');
    }
  }

  function checkSavedSubmission() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.position) {
          renderSuccess(parsed.email, parsed.position, parsed.referralCode);
        }
      }
    } catch (e) {
      // Ignore parse errors
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
      // Graceful fallback
    }
  }

  let toastTimer;
  function showToast(message) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }
});
