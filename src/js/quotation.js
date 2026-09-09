// Balaji Building Material Supplier - Quotation Builder Module
import { translations } from './translations.js';

export const WHATSAPP_PHONE = '918484029427';

const MATERIALS_META = [
  {
    id: 'sand',
    name_mr: 'वाळू (Sand)',
    name_en: 'Sand (वाळू)',
    defaultQty: 2
  },
  {
    id: 'khadi',
    name_mr: 'खडी (Khadi)',
    name_en: 'Khadi / Aggregate (खडी)',
    defaultQty: 1
  },
  {
    id: 'crush_sand',
    name_mr: 'डस्ट सँड / क्रश सँड (Crush Sand)',
    name_en: 'Dust Sand / Crush Sand (डस्ट सँड)',
    defaultQty: 2
  },
  {
    id: 'wash_valu',
    name_mr: 'वॉश वाळू (Wash Valu)',
    name_en: 'Wash Valu / Washed Sand (वॉश वाळू)',
    defaultQty: 2
  }
];

export function initQuotationBuilder(getCurrentLang) {
  const quoteForm = document.getElementById('quotation-form');
  const sendWaBtn = document.getElementById('btn-send-quote-wa');
  const summaryList = document.getElementById('quote-summary-list');
  const totalVolumeEl = document.getElementById('quote-total-volume-val');
  const nameInput = document.getElementById('quote-cust-name');
  const siteInput = document.getElementById('quote-cust-site');

  if (!quoteForm) return;

  function updateSummary() {
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;
    let selectedCount = 0;
    let totalBrass = 0;
    let summaryHtml = '';

    MATERIALS_META.forEach((mat) => {
      const checkbox = document.getElementById(`quote-check-${mat.id}`);
      const qtyInput = document.getElementById(`quote-qty-${mat.id}`);

      if (checkbox && checkbox.checked) {
        selectedCount++;
        const qty = parseFloat(qtyInput?.value) || 1;
        totalBrass += qty;
        const matName = lang === 'mr' ? mat.name_mr : mat.name_en;

        summaryHtml += `
          <li class="summary-item">
            <span class="summary-item-name"><span class="badge-dot"></span>${matName}</span>
            <span class="summary-item-qty">${qty} ${t.quote_brass_unit}</span>
          </li>
        `;
      }
    });

    if (selectedCount === 0) {
      summaryList.innerHTML = `<li class="summary-empty">${t.quote_summary_empty}</li>`;
      totalVolumeEl.textContent = `0 ${t.quote_brass_unit}`;
      if (sendWaBtn) {
        sendWaBtn.disabled = true;
        sendWaBtn.classList.add('disabled');
      }
    } else {
      summaryList.innerHTML = summaryHtml;
      totalVolumeEl.textContent = `${totalBrass} ${t.quote_brass_unit}`;
      if (sendWaBtn) {
        sendWaBtn.disabled = false;
        sendWaBtn.classList.remove('disabled');
      }
    }
  }

  // Hook up checkboxes and quantity inputs
  MATERIALS_META.forEach((mat) => {
    const checkbox = document.getElementById(`quote-check-${mat.id}`);
    const qtyInput = document.getElementById(`quote-qty-${mat.id}`);
    const minusBtn = document.getElementById(`quote-minus-${mat.id}`);
    const plusBtn = document.getElementById(`quote-plus-${mat.id}`);
    const row = document.getElementById(`quote-row-${mat.id}`);

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (row) {
          row.classList.toggle('active', checkbox.checked);
        }
        if (qtyInput) {
          qtyInput.disabled = !checkbox.checked;
        }
        if (minusBtn) minusBtn.disabled = !checkbox.checked;
        if (plusBtn) plusBtn.disabled = !checkbox.checked;
        updateSummary();
      });
    }

    if (qtyInput) {
      qtyInput.addEventListener('input', () => {
        if (parseFloat(qtyInput.value) < 0.5) qtyInput.value = 0.5;
        updateSummary();
      });
    }

    if (minusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        let current = parseFloat(qtyInput.value) || 1;
        if (current > 0.5) {
          qtyInput.value = (current - 0.5).toFixed(1).replace(/\.0$/, '');
          updateSummary();
        }
      });
    }

    if (plusBtn && qtyInput) {
      plusBtn.addEventListener('click', () => {
        let current = parseFloat(qtyInput.value) || 1;
        qtyInput.value = (current + 0.5).toFixed(1).replace(/\.0$/, '');
        updateSummary();
      });
    }
  });

  // Handle WhatsApp Click
  if (sendWaBtn) {
    sendWaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = getCurrentLang();
      const t = translations[lang] || translations.mr;
      const selectedItems = [];

      MATERIALS_META.forEach((mat) => {
        const checkbox = document.getElementById(`quote-check-${mat.id}`);
        const qtyInput = document.getElementById(`quote-qty-${mat.id}`);
        if (checkbox && checkbox.checked) {
          const qty = parseFloat(qtyInput?.value) || 1;
          const matName = lang === 'mr' ? mat.name_mr : mat.name_en;
          selectedItems.push(`- ${matName}: ${qty} ${t.quote_brass_unit}`);
        }
      });

      if (selectedItems.length === 0) {
        alert(t.quote_summary_empty);
        return;
      }

      const name = nameInput ? nameInput.value.trim() : '';
      const site = siteInput ? siteInput.value.trim() : '';

      let message = '';
      if (lang === 'mr') {
        message = `${t.quote_wa_greeting}\n${t.quote_wa_req_text}\n` +
          selectedItems.join('\n') + '\n';
        if (name) message += `${t.quote_wa_name}: ${name}\n`;
        if (site) message += `${t.quote_wa_location}: ${site}\n`;
        message += t.quote_wa_footer;
      } else {
        message = `${t.quote_wa_greeting}\n${t.quote_wa_req_text}\n` +
          selectedItems.join('\n') + '\n';
        if (name) message += `${t.quote_wa_name}: ${name}\n`;
        if (site) message += `${t.quote_wa_location}: ${site}\n`;
        message += t.quote_wa_footer;
      }

      const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Handle product card "Inquire" buttons
  document.querySelectorAll('.btn-inquire-product').forEach((btn) => {
    btn.addEventListener('click', () => {
      const matId = btn.getAttribute('data-product-id');
      const targetCheck = document.getElementById(`quote-check-${matId}`);
      if (targetCheck) {
        targetCheck.checked = true;
        const row = document.getElementById(`quote-row-${matId}`);
        const qtyInput = document.getElementById(`quote-qty-${matId}`);
        const minusBtn = document.getElementById(`quote-minus-${matId}`);
        const plusBtn = document.getElementById(`quote-plus-${matId}`);
        if (row) row.classList.add('active');
        if (qtyInput) qtyInput.disabled = false;
        if (minusBtn) minusBtn.disabled = false;
        if (plusBtn) plusBtn.disabled = false;
        updateSummary();
      }
      const quoteSection = document.getElementById('quotation');
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Initial calculation
  updateSummary();

  // Return update function for language switches
  return { updateSummary };
}
