// Balaji Building Material Supplier - Hidden Owner Authentication Module
import { translations } from './translations.js';

/**
 * CLIENT-SIDE OBFUSCATION NOTICE:
 * This client-side PIN hash check is designed for convenient owner access to
 * the local invoice generator and offline records on the owner's personal device.
 * It is not bank-grade security since code executes in the client browser, but
 * no sensitive server data or credentials exist; all invoices reside strictly
 * on the owner's local device storage.
 */
const OWNER_PIN_HASH = '61648a4dcebd96a87d3f6010c3eaf7d7c9ab46b684f4650dfdba304b2e0dd4ad'; // SHA-256 of Sudip@622
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes lockout

const STORAGE_KEYS = {
  ATTEMPTS: 'bbms_auth_attempts',
  LOCKOUT_TIME: 'bbms_auth_lockout_until',
  SESSION: 'bbms_owner_auth_session'
};

/**
 * Computes SHA-256 hex string using browser native Web Crypto API
 */
async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function initOwnerAuth(onOwnerLoginSuccess, getCurrentLang) {
  const brandHeaderTrigger = document.getElementById('brand-header-trigger');
  const footerTrigger = document.getElementById('footer-secret-trigger');
  const modal = document.getElementById('owner-auth-modal');
  const pinInput = document.getElementById('owner-pin-input');
  const pinForm = document.getElementById('owner-pin-form');
  const cancelBtn = document.getElementById('owner-pin-cancel');
  const errorEl = document.getElementById('owner-pin-error');
  const attemptsEl = document.getElementById('owner-pin-attempts');
  const ownerOverlay = document.getElementById('owner-dashboard-overlay');
  const logoutBtn = document.getElementById('btn-owner-logout');
  const closeDashboardBtn = document.getElementById('btn-owner-close');

  let logoTapCount = 0;
  let logoTapTimer = null;
  let lockoutInterval = null;

  function isOwnerSessionActive() {
    return localStorage.getItem(STORAGE_KEYS.SESSION) === 'active' ||
           sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'active';
  }

  // Check if owner already authenticated in current session / device
  if (isOwnerSessionActive() && (window.location.hash === '#owner' || window.location.search.includes('owner'))) {
    if (ownerOverlay) {
      ownerOverlay.classList.add('visible');
      if (onOwnerLoginSuccess) onOwnerLoginSuccess();
    }
  }

  function isLockedOut() {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_TIME) || '0', 10);
    const now = Date.now();
    return lockoutUntil > now;
  }

  function getRemainingLockoutSeconds() {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_TIME) || '0', 10);
    return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  }

  function updateLockoutUI() {
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;
    const remainingSec = getRemainingLockoutSeconds();

    if (remainingSec > 0) {
      if (errorEl) {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        errorEl.textContent = `${t.owner_error_locked} (${mins}:${secs.toString().padStart(2, '0')})`;
        errorEl.classList.remove('hidden');
      }
      if (pinInput) pinInput.disabled = true;
      const submitBtn = pinForm ? pinForm.querySelector('button[type="submit"]') : null;
      if (submitBtn) submitBtn.disabled = true;
      if (attemptsEl) attemptsEl.classList.add('hidden');
    } else {
      if (lockoutInterval) {
        clearInterval(lockoutInterval);
        lockoutInterval = null;
      }
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_TIME);
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, '0');
      if (pinInput) pinInput.disabled = false;
      const submitBtn = pinForm ? pinForm.querySelector('button[type="submit"]') : null;
      if (submitBtn) submitBtn.disabled = false;
      if (errorEl) errorEl.classList.add('hidden');
      if (attemptsEl) attemptsEl.classList.add('hidden');
    }
  }

  function openPinModal() {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    if (errorEl) errorEl.classList.add('hidden');
    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 150);
    }

    if (isLockedOut()) {
      updateLockoutUI();
      if (!lockoutInterval) {
        lockoutInterval = setInterval(updateLockoutUI, 1000);
      }
    } else {
      const attempts = parseInt(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '0', 10);
      if (attempts > 0 && attemptsEl) {
        const lang = getCurrentLang();
        const t = translations[lang] || translations.mr;
        attemptsEl.textContent = `${t.owner_attempts_left} ${MAX_ATTEMPTS - attempts}`;
        attemptsEl.classList.remove('hidden');
      }
    }
  }

  function closePinModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (lockoutInterval) {
      clearInterval(lockoutInterval);
      lockoutInterval = null;
    }
    if (pinInput) pinInput.value = '';
  }

  // 3-tap detection on brand logo trigger (opens owner panel)
  function registerTripleTap(element) {
    if (!element) return;
    element.addEventListener('click', (e) => {
      logoTapCount++;
      if (logoTapTimer) clearTimeout(logoTapTimer);

      logoTapTimer = setTimeout(() => {
        logoTapCount = 0;
      }, 2500);

      if (logoTapCount >= 3) {
        e.preventDefault();
        e.stopPropagation();
        logoTapCount = 0;
        clearTimeout(logoTapTimer);

        if (isOwnerSessionActive()) {
          if (ownerOverlay) ownerOverlay.classList.add('visible');
          if (onOwnerLoginSuccess) onOwnerLoginSuccess();
        } else {
          openPinModal();
        }
      }
    });
  }

  registerTripleTap(brandHeaderTrigger);
  registerTripleTap(footerTrigger);

  // Also allow opening via URL hash #owner or ?owner for owner convenience
  function checkUrlForOwnerTrigger() {
    if (window.location.hash === '#owner' || window.location.search.includes('owner')) {
      if (isOwnerSessionActive()) {
        if (ownerOverlay) ownerOverlay.classList.add('visible');
        if (onOwnerLoginSuccess) onOwnerLoginSuccess();
      } else {
        openPinModal();
      }
    }
  }

  checkUrlForOwnerTrigger();
  window.addEventListener('hashchange', checkUrlForOwnerTrigger);

  // Handle PIN Submission
  if (pinForm) {
    pinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isLockedOut()) {
        updateLockoutUI();
        return;
      }

      const enteredPin = pinInput ? pinInput.value.trim() : '';
      if (!enteredPin) return;

      const hash = await computeSha256(enteredPin);

      if (hash === OWNER_PIN_HASH) {
        // Successful authentication - persist for owner's installed PWA / device
        localStorage.setItem(STORAGE_KEYS.SESSION, 'active');
        sessionStorage.setItem(STORAGE_KEYS.SESSION, 'active');
        localStorage.setItem('bbms_owner_device', 'true');
        localStorage.setItem(STORAGE_KEYS.ATTEMPTS, '0');
        localStorage.removeItem(STORAGE_KEYS.LOCKOUT_TIME);
        closePinModal();

        if (ownerOverlay) {
          ownerOverlay.classList.add('visible');
        }
        if (onOwnerLoginSuccess) {
          onOwnerLoginSuccess();
        }
      } else {
        // Failed attempt
        let attempts = parseInt(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '0', 10) + 1;
        localStorage.setItem(STORAGE_KEYS.ATTEMPTS, attempts.toString());

        const lang = getCurrentLang();
        const t = translations[lang] || translations.mr;

        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(STORAGE_KEYS.LOCKOUT_TIME, (Date.now() + LOCKOUT_MS).toString());
          updateLockoutUI();
          if (!lockoutInterval) {
            lockoutInterval = setInterval(updateLockoutUI, 1000);
          }
        } else {
          if (errorEl) {
            errorEl.textContent = t.owner_error_pin;
            errorEl.classList.remove('hidden');
          }
          if (attemptsEl) {
            attemptsEl.textContent = `${t.owner_attempts_left} ${MAX_ATTEMPTS - attempts}`;
            attemptsEl.classList.remove('hidden');
          }
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
        }
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePinModal);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePinModal();
      }
    });
  }

  // Close Dashboard button inside Owner Dashboard (returns to site without logout)
  if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', () => {
      if (ownerOverlay) ownerOverlay.classList.remove('visible');
    });
  }

  // Logout button inside Owner Dashboard (clears owner device persistence)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem('bbms_owner_device');
      if (ownerOverlay) ownerOverlay.classList.remove('visible');
    });
  }
}
