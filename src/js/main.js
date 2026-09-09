// Balaji Building Material Supplier - Main Application Bootstrap
import { translations } from './translations.js';
import { initQuotationBuilder } from './quotation.js';
import { initOwnerAuth } from './owner.js';
import { initInvoiceModule } from './invoice.js';
import { registerServiceWorker } from './sw-register.js';

const STORAGE_LANG_KEY = 'bbms_lang';

// Get current selected language ('mr' or 'en')
let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || 'mr';

export function getCurrentLang() {
  return currentLang;
}

// Update all DOM elements marked with data-i18n attributes
export function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem(STORAGE_LANG_KEY, lang);
  document.documentElement.lang = lang;

  const t = translations[lang] || translations.mr;

  // Text content
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  // HTML content (for elements containing nested badges or bold text)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) {
      el.innerHTML = t[key];
    }
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) {
      el.placeholder = t[key];
    }
  });

  // ARIA labels
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (t[key] !== undefined) {
      el.setAttribute('aria-label', t[key]);
    }
  });

  // Update Language Switcher buttons
  const langToggleBtn = document.getElementById('btn-lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.setAttribute('data-current-lang', lang);
    const activeText = lang === 'mr' ? 'मराठी' : 'EN';
    const altText = lang === 'mr' ? 'EN' : 'मराठी';
    langToggleBtn.innerHTML = `<span class="lang-active">${activeText}</span><span class="lang-divider">|</span><span class="lang-inactive">${altText}</span>`;
  }
}

// Setup Scroll Animations using IntersectionObserver
function setupScrollAnimations() {
  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      el.classList.add('is-revealed');
    });
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-on-scroll').forEach((el, index) => {
    // Add staggered delay to child cards if inside a grid
    if (el.classList.contains('stagger-item')) {
      const delay = (index % 4) * 120;
      el.style.transitionDelay = `${delay}ms`;
    }
    observer.observe(el);
  });
}

// Smooth scrolling and mobile nav toggle
function setupNavigation() {
  const mobileNavToggle = document.getElementById('mobile-menu-toggle');
  const navLinksList = document.getElementById('nav-links');

  if (mobileNavToggle && navLinksList) {
    mobileNavToggle.addEventListener('click', () => {
      const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
      mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
      navLinksList.classList.toggle('open');
    });

    // Close mobile nav when clicking a link
    navLinksList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinksList.classList.remove('open');
        mobileNavToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header scroll shadow
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('header-scrolled');
    } else {
      header?.classList.remove('header-scrolled');
    }
  }, { passive: true });
}

// Initialize everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Apply initial translations
  applyTranslations(currentLang);

  // Wire up language toggle button
  const langToggleBtn = document.getElementById('btn-lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const nextLang = currentLang === 'mr' ? 'en' : 'mr';
      applyTranslations(nextLang);
      if (quotationApi && quotationApi.updateSummary) {
        quotationApi.updateSummary();
      }
      if (invoiceApi && invoiceApi.renderLiveInvoicePreview) {
        invoiceApi.renderLiveInvoicePreview();
      }
    });
  }

  // Setup navigation & scroll observers
  setupNavigation();
  setupScrollAnimations();

  // Initialize Quotation Builder
  const quotationApi = initQuotationBuilder(getCurrentLang);

  // Initialize Invoice Module
  const invoiceApi = initInvoiceModule(getCurrentLang);

  // Initialize Owner Auth
  initOwnerAuth(() => {
    // When owner logs in, ensure invoice preview and history list are updated
    invoiceApi.renderLiveInvoicePreview();
    invoiceApi.renderHistoryList();
  }, getCurrentLang);

  // Register PWA Service Worker
  registerServiceWorker();
});
