// Balaji Building Material Supplier - Owner Invoice Generator & Offline History
import html2canvas from 'html2canvas';
import { translations } from './translations.js';
import { createUpiPaymentUri, renderUpiQrToCanvas } from './qr.js';

const STORAGE_KEYS = {
  INVOICE_COUNTER: 'bbms_inv_counter',
  INVOICE_HISTORY: 'bbms_inv_history'
};

const DEFAULT_MATERIALS = [
  { val: 'वाळू (नदीची)', name_mr: 'वाळू (नदीची)', name_en: 'वाळू (नदीची)', defaultRate: 5000 },
  { val: 'खडी (१०/२०/४० मि.मी.)', name_mr: 'खडी (१०/२०/४० मि.मी.)', name_en: 'खडी (१०/२०/४० मि.मी.)', defaultRate: 2800 },
  { val: 'डस्ट सँड / क्रश सँड', name_mr: 'डस्ट सँड / क्रश सँड', name_en: 'डस्ट सँड / क्रश सँड', defaultRate: 2400 },
  { val: 'वॉश वाळू (मशिन वॉश)', name_mr: 'वॉश वाळू (मशिन वॉश)', name_en: 'वॉश वाळू (मशिन वॉश)', defaultRate: 3500 },
  { val: 'इतर बांधकाम साहित्य', name_mr: 'इतर बांधकाम साहित्य', name_en: 'इतर बांधकाम साहित्य', defaultRate: 3000 }
];

export function initInvoiceModule(getCurrentLang) {
  // Elements - Form Inputs
  const invForm = document.getElementById('invoice-form');
  const invFormCard = document.getElementById('invoice-form-card');
  const invNoInput = document.getElementById('inv-input-no');
  const invDateInput = document.getElementById('inv-input-date');
  const custNameInput = document.getElementById('inv-input-name');
  const custMobileInput = document.getElementById('inv-input-mobile');
  const custVillageInput = document.getElementById('inv-input-village');
  const notesInput = document.getElementById('inv-input-notes');
  const itemsContainer = document.getElementById('inv-items-container');
  const itemsEmptyHint = document.getElementById('inv-items-empty-hint');
  const addItemBtn = document.getElementById('btn-add-inv-item');

  // Calculation & Totals Inputs
  const subtotalInput = document.getElementById('inv-input-subtotal');
  const discountInput = document.getElementById('inv-input-discount');
  const grandTotalInput = document.getElementById('inv-input-grand-total');
  const advancePaidInput = document.getElementById('inv-input-advance');
  const balanceDueInput = document.getElementById('inv-input-balance');

  // Form Controls
  const btnGenerateInv = document.getElementById('btn-inv-generate');
  const btnResetForm = document.getElementById('btn-inv-reset');

  // Preview Wrapper & Card Elements
  const invoicePreviewWrapper = document.getElementById('invoice-preview-wrapper');
  const invoicePreviewEl = document.getElementById('invoice-printable-card');
  const prevInvNo = document.getElementById('bill-val-no');
  const prevDate = document.getElementById('bill-val-date');
  const prevCustName = document.getElementById('bill-val-name');
  const prevCustMobile = document.getElementById('bill-val-mobile');
  const prevCustVillage = document.getElementById('bill-val-site');
  const prevNotesRow = document.getElementById('bill-row-notes');
  const prevNotesVal = document.getElementById('bill-val-notes');
  const prevItemsTbody = document.getElementById('bill-tbody-items');
  const prevSubtotal = document.getElementById('bill-val-subtotal');
  const prevRowDiscount = document.getElementById('bill-row-discount');
  const prevDiscount = document.getElementById('bill-val-discount');
  const prevGrandTotal = document.getElementById('bill-val-grandtotal');
  const prevAdvance = document.getElementById('bill-val-advance');
  const prevBalance = document.getElementById('bill-val-balance');
  const qrCanvas = document.getElementById('bill-qr-canvas');

  // Preview Action Buttons
  const btnSaveInv = document.getElementById('btn-inv-save');
  const btnEditInv = document.getElementById('btn-inv-edit');
  const btnShareWa = document.getElementById('btn-inv-share-wa');
  const btnDownloadPng = document.getElementById('btn-inv-download-png');

  // Topbar Popup Modals Elements
  const btnOwnerHistoryPopup = document.getElementById('btn-owner-history-popup');
  const btnOwnerBackupPopup = document.getElementById('btn-owner-backup-popup');
  const ownerHistoryModal = document.getElementById('owner-history-modal');
  const ownerBackupModal = document.getElementById('owner-backup-modal');
  const btnCloseHistModal = document.getElementById('btn-close-hist-modal');
  const btnCloseBackupModal = document.getElementById('btn-close-backup-modal');

  // History & Backup Controls
  const searchInput = document.getElementById('hist-search-input');
  const historyListContainer = document.getElementById('hist-list-container');
  const statTotalInvoices = document.getElementById('stat-total-invoices');
  const statTotalBilled = document.getElementById('stat-total-billed');
  const statTotalPending = document.getElementById('stat-total-pending');
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportBackup = document.getElementById('btn-import-backup');
  const fileImportInput = document.getElementById('file-import-input');

  let currentEditingInvoiceId = null;

  // Set default Date to today
  function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Auto-generate invoice number format: BBM-2026-001
  function getNextInvoiceNumber() {
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER) || '1', 10);
    const year = new Date().getFullYear();
    return `BBM-${year}-${String(counter).padStart(3, '0')}`;
  }

  function incrementInvoiceCounter() {
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER) || '1', 10);
    localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, (counter + 1).toString());
  }

  // Check and toggle empty items state container
  function updateEmptyItemsState() {
    if (!itemsContainer) return;
    const rowCount = itemsContainer.querySelectorAll('.inv-item-row').length;
    if (itemsEmptyHint) {
      itemsEmptyHint.style.display = rowCount === 0 ? 'block' : 'none';
    }
  }

  // Create a new Line Item Row (empty by default unless data provided)
  function createLineItemRow(data = {}) {
    if (!itemsContainer) return;

    const row = document.createElement('div');
    row.className = 'inv-item-row';

    const hasMaterialSelected = Boolean(data.material);
    const placeholderOption = `<option value="" disabled ${!hasMaterialSelected ? 'selected' : ''}>-- साहित्य निवडा (Select) --</option>`;
    const materialOptions = DEFAULT_MATERIALS.map(
      (m) => `<option value="${m.val}" ${data.material === m.val ? 'selected' : ''}>${m.val}</option>`
    ).join('');

    const qtyVal = (data.qty !== undefined && data.qty !== null && data.qty !== '') ? data.qty : '';
    const rateVal = (data.rate !== undefined && data.rate !== null && data.rate !== '') ? data.rate : '';

    row.innerHTML = `
      <div class="inv-item-field material-col">
        <label class="sr-only">साहित्य</label>
        <select class="inv-item-material select-input">
          ${placeholderOption}
          ${materialOptions}
        </select>
      </div>
      <div class="inv-item-field qty-col">
        <label class="sr-only">प्रमाण (ब्रास)</label>
        <input type="number" class="inv-item-qty text-input" placeholder="ब्रास" min="0.1" step="0.5" value="${qtyVal}">
      </div>
      <div class="inv-item-field rate-col">
        <label class="sr-only">दर (₹/ब्रास)</label>
        <input type="number" class="inv-item-rate text-input" placeholder="दर ₹" min="0" step="100" value="${rateVal}">
      </div>
      <div class="inv-item-field total-col">
        <label class="sr-only">एकूण</label>
        <span class="inv-item-line-total">₹0</span>
      </div>
      <div class="inv-item-field action-col">
        <button type="button" class="btn-remove-line-item" title="काढून टाका" aria-label="काढून टाका">×</button>
      </div>
    `;

    const matSelect = row.querySelector('.inv-item-material');
    const qtyInput = row.querySelector('.inv-item-qty');
    const rateInput = row.querySelector('.inv-item-rate');
    const lineTotalSpan = row.querySelector('.inv-item-line-total');
    const removeBtn = row.querySelector('.btn-remove-line-item');

    function updateLineTotal() {
      const q = parseFloat(qtyInput.value) || 0;
      const r = parseFloat(rateInput.value) || 0;
      const total = Math.round(q * r);
      lineTotalSpan.textContent = `₹${total.toLocaleString('en-IN')}`;
      updateGrandTotals();
    }

    matSelect.addEventListener('change', () => {
      // Auto-suggest default rate if input was empty or untouched
      const found = DEFAULT_MATERIALS.find((m) => m.val === matSelect.value);
      if (found && (!rateInput.value || rateInput.value === '0' || rateInput.dataset.touched !== 'true')) {
        rateInput.value = found.defaultRate;
      }
      updateLineTotal();
    });

    rateInput.addEventListener('input', () => {
      rateInput.dataset.touched = 'true';
      updateLineTotal();
    });

    qtyInput.addEventListener('input', updateLineTotal);

    removeBtn.addEventListener('click', () => {
      row.remove();
      updateEmptyItemsState();
      updateGrandTotals();
    });

    itemsContainer.appendChild(row);
    updateEmptyItemsState();
    updateLineTotal();
  }

  // Update Grand Total, Discount, and Balance Due
  function updateGrandTotals() {
    let subtotal = 0;
    const rows = itemsContainer ? itemsContainer.querySelectorAll('.inv-item-row') : [];

    rows.forEach((row) => {
      const q = parseFloat(row.querySelector('.inv-item-qty')?.value) || 0;
      const r = parseFloat(row.querySelector('.inv-item-rate')?.value) || 0;
      subtotal += Math.round(q * r);
    });

    const discount = Math.max(0, parseFloat(discountInput?.value) || 0);
    const grandTotal = Math.max(0, subtotal - discount);
    const advance = Math.max(0, parseFloat(advancePaidInput?.value) || 0);
    const balance = Math.max(0, grandTotal - advance);

    if (subtotalInput) subtotalInput.value = subtotal;
    if (grandTotalInput) grandTotalInput.value = grandTotal;
    if (balanceDueInput) balanceDueInput.value = balance;

    // Refresh live preview if already generated and visible
    if (invoicePreviewWrapper && invoicePreviewWrapper.style.display !== 'none') {
      renderLiveInvoicePreview();
    }
  }

  // Gather current form data
  function getFormData() {
    const rows = itemsContainer ? itemsContainer.querySelectorAll('.inv-item-row') : [];
    const items = [];

    rows.forEach((row) => {
      const material = row.querySelector('.inv-item-material')?.value || '';
      const qty = parseFloat(row.querySelector('.inv-item-qty')?.value) || 0;
      const rate = parseFloat(row.querySelector('.inv-item-rate')?.value) || 0;
      const amount = Math.round(qty * rate);
      if (material || qty > 0 || rate > 0) {
        items.push({ material: material || 'बांधकाम साहित्य', qty, rate, amount });
      }
    });

    const subtotal = parseFloat(subtotalInput?.value) || 0;
    const discount = Math.max(0, parseFloat(discountInput?.value) || 0);
    const grandTotal = Math.max(0, parseFloat(grandTotalInput?.value) || Math.max(0, subtotal - discount));
    const advancePaid = Math.max(0, parseFloat(advancePaidInput?.value) || 0);
    const balanceDue = Math.max(0, parseFloat(balanceDueInput?.value) || Math.max(0, grandTotal - advancePaid));

    return {
      invoiceNo: invNoInput ? invNoInput.value.trim() : getNextInvoiceNumber(),
      date: invDateInput ? invDateInput.value : getTodayString(),
      customerName: custNameInput ? custNameInput.value.trim() : '',
      customerMobile: custMobileInput ? custMobileInput.value.trim() : '',
      customerVillage: custVillageInput ? custVillageInput.value.trim() : '',
      notes: notesInput ? notesInput.value.trim() : '',
      items,
      subtotal,
      discount,
      grandTotal,
      advancePaid,
      balanceDue,
      timestamp: Date.now()
    };
  }

  // Render DOM Invoice Preview (Pure Marathi bill format)
  async function renderLiveInvoicePreview() {
    const data = getFormData();

    if (prevInvNo) prevInvNo.textContent = data.invoiceNo;
    if (prevDate) prevDate.textContent = data.date;
    if (prevCustName) prevCustName.textContent = data.customerName || 'ग्राहक';
    if (prevCustMobile) prevCustMobile.textContent = data.customerMobile || '-';
    if (prevCustVillage) prevCustVillage.textContent = data.customerVillage || '-';

    if (data.notes) {
      if (prevNotesRow) prevNotesRow.style.display = '';
      if (prevNotesVal) prevNotesVal.textContent = data.notes;
    } else {
      if (prevNotesRow) prevNotesRow.style.display = 'none';
    }

    // Populate line items strictly in pure Marathi
    if (prevItemsTbody) {
      if (data.items.length === 0) {
        prevItemsTbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center" style="padding: 0.85rem; color: #64748b;">
              कोणतेही साहित्य जोडलेले नाही
            </td>
          </tr>
        `;
      } else {
        prevItemsTbody.innerHTML = data.items.map((item, idx) => `
          <tr>
            <td class="text-center font-bold">${idx + 1}</td>
            <td>${item.material}</td>
            <td class="text-center font-bold">${item.qty} ब्रास</td>
            <td class="text-right">₹${item.rate.toLocaleString('en-IN')}</td>
            <td class="text-right font-bold">₹${item.amount.toLocaleString('en-IN')}</td>
          </tr>
        `).join('');
      }
    }

    if (prevSubtotal) prevSubtotal.textContent = `₹${data.subtotal.toLocaleString('en-IN')}`;

    // Discount row visibility
    if (data.discount > 0) {
      if (prevRowDiscount) prevRowDiscount.style.display = 'flex';
      if (prevDiscount) prevDiscount.textContent = `- ₹${data.discount.toLocaleString('en-IN')}`;
    } else {
      if (prevRowDiscount) prevRowDiscount.style.display = 'none';
    }

    if (prevGrandTotal) prevGrandTotal.textContent = `₹${data.grandTotal.toLocaleString('en-IN')}`;
    if (prevAdvance) prevAdvance.textContent = `₹${data.advancePaid.toLocaleString('en-IN')}`;
    if (prevBalance) prevBalance.textContent = `₹${data.balanceDue.toLocaleString('en-IN')}`;

    // Render open static UPI QR code (strictly non-amount driven) onto canvas
    if (qrCanvas) {
      const upiUri = createUpiPaymentUri(data.invoiceNo);
      await renderUpiQrToCanvas(qrCanvas, upiUri, 170);
    }
  }

  // Reset form to blank new invoice (Empty materials, hidden preview)
  function resetForm() {
    currentEditingInvoiceId = null;
    if (invNoInput) invNoInput.value = getNextInvoiceNumber();
    if (invDateInput) invDateInput.value = getTodayString();
    if (custNameInput) custNameInput.value = '';
    if (custMobileInput) custMobileInput.value = '';
    if (custVillageInput) custVillageInput.value = '';
    if (notesInput) notesInput.value = '';
    if (discountInput) discountInput.value = '0';
    if (advancePaidInput) advancePaidInput.value = '0';

    // Materials kept empty initially as requested
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
    }
    updateEmptyItemsState();
    updateGrandTotals();

    // Hide invoice preview until user fills data and clicks generate
    if (invoicePreviewWrapper) {
      invoicePreviewWrapper.style.display = 'none';
    }
  }

  // Generate PNG Blob from invoice card using html2canvas
  async function generateInvoiceBlob() {
    await renderLiveInvoicePreview();
    if (!invoicePreviewEl) return null;

    const canvas = await html2canvas(invoicePreviewEl, {
      scale: 2, // 2x for high DPI sharpness
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  }

  // Save invoice to localStorage history
  function saveInvoiceToHistory() {
    const data = getFormData();
    if (!data.customerName && data.items.length === 0) {
      alert('कृपया किमान ग्राहकाचे नाव किंवा साहित्याचा तपशील भरा.');
      return false;
    }

    const history = getSavedInvoices();
    const existingIndex = history.findIndex((inv) => inv.invoiceNo === data.invoiceNo);

    if (existingIndex >= 0) {
      // Update existing
      history[existingIndex] = data;
    } else {
      // Prepend new
      history.unshift(data);
      incrementInvoiceCounter();
    }

    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history));
    renderHistoryList(searchInput?.value || '');
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;
    alert(t.msg_saved_success || 'बिल यशस्वीरीत्या सेव्ह झाले!');
    return true;
  }

  function getSavedInvoices() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INVOICE_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error parsing history:', e);
      return [];
    }
  }

  // Load a historical invoice into the generator form and open preview
  function loadInvoiceToForm(inv) {
    currentEditingInvoiceId = inv.invoiceNo;
    if (invNoInput) invNoInput.value = inv.invoiceNo;
    if (invDateInput) invDateInput.value = inv.date;
    if (custNameInput) custNameInput.value = inv.customerName || '';
    if (custMobileInput) custMobileInput.value = inv.customerMobile || '';
    if (custVillageInput) custVillageInput.value = inv.customerVillage || '';
    if (notesInput) notesInput.value = inv.notes || '';
    if (discountInput) discountInput.value = inv.discount || 0;
    if (advancePaidInput) advancePaidInput.value = inv.advancePaid || 0;

    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item) => createLineItemRow(item));
      }
    }
    updateEmptyItemsState();
    updateGrandTotals();

    // Close History Modal
    closeModal(ownerHistoryModal);

    // Show preview directly for inspection
    renderLiveInvoicePreview();
    if (invoicePreviewWrapper) {
      invoicePreviewWrapper.style.display = 'block';
      invoicePreviewWrapper.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Delete invoice from history
  function deleteInvoice(invoiceNo) {
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;
    if (!confirm(`${t.hist_confirm_delete || 'तुम्हाला हे बिल कायमचे हटवायचे आहे का?'} (${invoiceNo})`)) return;

    let history = getSavedInvoices();
    history = history.filter((inv) => inv.invoiceNo !== invoiceNo);
    localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(history));
    renderHistoryList(searchInput?.value || '');
  }

  // Render History List & Stats in the History Popup
  function renderHistoryList(filterText = '') {
    const history = getSavedInvoices();
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;

    let totalBilled = 0;
    let totalPending = 0;

    history.forEach((inv) => {
      totalBilled += Number(inv.grandTotal) || 0;
      totalPending += Number(inv.balanceDue) || 0;
    });

    if (statTotalInvoices) statTotalInvoices.textContent = history.length;
    if (statTotalBilled) statTotalBilled.textContent = `₹${totalBilled.toLocaleString('en-IN')}`;
    if (statTotalPending) statTotalPending.textContent = `₹${totalPending.toLocaleString('en-IN')}`;

    const query = filterText.toLowerCase().trim();
    const filtered = history.filter((inv) => {
      if (!query) return true;
      return (
        (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(query)) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(query)) ||
        (inv.customerMobile && inv.customerMobile.includes(query)) ||
        (inv.customerVillage && inv.customerVillage.toLowerCase().includes(query))
      );
    });

    if (!historyListContainer) return;

    if (filtered.length === 0) {
      historyListContainer.innerHTML = `<div class="hist-empty-notice">${t.hist_empty || 'कोणतेही सेव्ह केलेले बिल आढळले नाही.'}</div>`;
      return;
    }

    historyListContainer.innerHTML = filtered.map((inv) => `
      <div class="hist-card" data-inv-id="${inv.invoiceNo}">
        <div class="hist-card-header">
          <span class="hist-inv-no">${inv.invoiceNo}</span>
          <span class="hist-inv-date">${inv.date}</span>
        </div>
        <div class="hist-card-body">
          <h4 class="hist-cust-name">${inv.customerName || 'ग्राहक'}</h4>
          <p class="hist-cust-details">
            <span>📍 ${inv.customerVillage || 'तासगाव'}</span>
            ${inv.customerMobile ? `<span>📞 ${inv.customerMobile}</span>` : ''}
          </p>
          <div class="hist-amount-row">
            <div>
              <small>${t.inv_total_amount || 'एकूण रक्कम'}</small>
              <strong class="text-dark">₹${(inv.grandTotal || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <small>${t.inv_balance_due || 'शिल्लक रक्कम'}</small>
              <strong class="text-orange">₹${(inv.balanceDue || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
        <div class="hist-card-actions">
          <button type="button" class="btn-hist-view" data-inv-id="${inv.invoiceNo}">${t.hist_btn_view || 'बिल पहा / एडिट'}</button>
          <button type="button" class="btn-hist-delete" data-inv-id="${inv.invoiceNo}">✕ ${t.hist_btn_delete || 'हटवा'}</button>
        </div>
      </div>
    `).join('');

    // Attach click handlers
    historyListContainer.querySelectorAll('.btn-hist-view').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inv-id');
        const found = history.find((i) => i.invoiceNo === id);
        if (found) loadInvoiceToForm(found);
      });
    });

    historyListContainer.querySelectorAll('.btn-hist-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inv-id');
        deleteInvoice(id);
      });
    });
  }

  // Web Share API & WhatsApp Sharing
  async function shareInvoice() {
    const data = getFormData();

    // Auto-save invoice to history
    saveInvoiceToHistory();

    const blob = await generateInvoiceBlob();
    if (!blob) {
      alert('इमेज तयार करण्यात अडचण आली!');
      return;
    }

    const fileName = `Invoice_${data.invoiceNo}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    // Clean mobile number for WhatsApp link
    const cleanPhone = (data.customerMobile || '').replace(/\D/g, '');
    const recipientPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const mrT = translations.mr;
    let shareSummaryText = `${mrT.bill_firm_name} (${mrT.brand_tagline})\n` +
      `*${mrT.bill_type_title}*\n` +
      `${mrT.bill_lbl_inv_no} ${data.invoiceNo}\n` +
      `${mrT.bill_lbl_customer} ${data.customerName || 'ग्राहक'}\n` +
      `${mrT.bill_lbl_subtotal} ₹${data.subtotal.toLocaleString('en-IN')}\n`;

    if (data.discount > 0) {
      shareSummaryText += `${mrT.bill_lbl_discount} -₹${data.discount.toLocaleString('en-IN')}\n`;
    }

    shareSummaryText += `${mrT.bill_lbl_grandtotal} ₹${data.grandTotal.toLocaleString('en-IN')}\n` +
      `${mrT.bill_lbl_advance} ₹${data.advancePaid.toLocaleString('en-IN')}\n` +
      `*${mrT.bill_lbl_balance} ₹${data.balanceDue.toLocaleString('en-IN')}*\n` +
      `UPI नंबर: 7083330914`;

    // Try Web Share API with files (Android Chrome, iOS Safari)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Invoice ${data.invoiceNo}`,
          text: shareSummaryText
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Web Share API error:', err);
        }
      }
    }

    // Fallback: Download PNG & Open WhatsApp
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Open WhatsApp deep link
    const waUrl = recipientPhone
      ? `https://wa.me/${recipientPhone}?text=${encodeURIComponent(shareSummaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareSummaryText)}`;

    window.open(waUrl, '_blank');
  }

  // Direct PNG Download
  async function downloadInvoicePng() {
    const data = getFormData();
    const blob = await generateInvoiceBlob();
    if (!blob) return;

    const fileName = `Invoice_${data.invoiceNo}.png`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Backup Export
  function exportBackup() {
    const history = getSavedInvoices();
    const counter = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER) || '1';
    const backupData = {
      app: 'BalajiBuildingMaterial',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      counter,
      invoices: history
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Balaji_BM_Backup_${d}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Backup Import
  function importBackup(file) {
    const lang = getCurrentLang();
    const t = translations[lang] || translations.mr;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.app === 'BalajiBuildingMaterial' && Array.isArray(parsed.invoices)) {
          localStorage.setItem(STORAGE_KEYS.INVOICE_HISTORY, JSON.stringify(parsed.invoices));
          if (parsed.counter) {
            localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, parsed.counter.toString());
          }
          renderHistoryList();
          alert(t.msg_backup_restored || 'बॅकअप यशस्वीरीत्या रिस्टोअर झाला!');
          closeModal(ownerBackupModal);
        } else {
          alert(t.msg_invalid_backup || 'अवैध बॅकअप फाइल!');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert(t.msg_invalid_backup || 'अवैध बॅकअप फाइल!');
      }
    };
    reader.readAsText(file);
  }

  // Modal helpers
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('visible');
    modalEl.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('visible');
    modalEl.setAttribute('aria-hidden', 'true');
  }

  // Popup Triggers & Closes
  if (btnOwnerHistoryPopup) {
    btnOwnerHistoryPopup.addEventListener('click', () => {
      renderHistoryList(searchInput?.value || '');
      openModal(ownerHistoryModal);
    });
  }

  if (btnOwnerBackupPopup) {
    btnOwnerBackupPopup.addEventListener('click', () => {
      openModal(ownerBackupModal);
    });
  }

  if (btnCloseHistModal) {
    btnCloseHistModal.addEventListener('click', () => {
      closeModal(ownerHistoryModal);
    });
  }

  if (btnCloseBackupModal) {
    btnCloseBackupModal.addEventListener('click', () => {
      closeModal(ownerBackupModal);
    });
  }

  // Close modals on clicking outside / backdrop
  [ownerHistoryModal, ownerBackupModal].forEach((m) => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) closeModal(m);
      });
    }
  });

  // Escape key closes open submodals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(ownerHistoryModal);
      closeModal(ownerBackupModal);
    }
  });

  // Add Item Click
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => createLineItemRow());
  }

  // Input Listeners for Calculations
  if (discountInput) discountInput.addEventListener('input', updateGrandTotals);
  if (advancePaidInput) advancePaidInput.addEventListener('input', updateGrandTotals);

  // Live input updates if preview is already visible
  [invNoInput, invDateInput, custNameInput, custMobileInput, custVillageInput, notesInput].forEach((inp) => {
    if (inp) {
      inp.addEventListener('input', () => {
        if (invoicePreviewWrapper && invoicePreviewWrapper.style.display !== 'none') {
          renderLiveInvoicePreview();
        }
      });
    }
  });

  // Generate Bill Button Click: Validate -> Render -> Reveal Preview & Scroll
  if (btnGenerateInv) {
    btnGenerateInv.addEventListener('click', async () => {
      const data = getFormData();
      const hasValidItem = data.items.some((it) => it.qty > 0 && it.rate > 0);

      if (!data.customerName && !hasValidItem) {
        alert('कृपया आधी ग्राहकाचे नाव किंवा किमान एका साहित्याचा तपशील (प्रमाण व दर) भरा.');
        return;
      }

      await renderLiveInvoicePreview();
      if (invoicePreviewWrapper) {
        invoicePreviewWrapper.style.display = 'block';
        invoicePreviewWrapper.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Edit Button Click: Smooth scroll back up to form
  if (btnEditInv) {
    btnEditInv.addEventListener('click', () => {
      if (invFormCard) {
        invFormCard.scrollIntoView({ behavior: 'smooth' });
        const targetInput = custNameInput || invFormCard.querySelector('input:not([readonly])');
        if (targetInput) targetInput.focus();
      }
    });
  }

  // Actions on Preview Card
  if (btnShareWa) btnShareWa.addEventListener('click', shareInvoice);
  if (btnDownloadPng) btnDownloadPng.addEventListener('click', downloadInvoicePng);
  if (btnSaveInv) btnSaveInv.addEventListener('click', saveInvoiceToHistory);
  if (btnResetForm) btnResetForm.addEventListener('click', resetForm);

  // History Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderHistoryList(e.target.value);
    });
  }

  // Backup Export & Import
  if (btnExportBackup) btnExportBackup.addEventListener('click', exportBackup);
  if (btnImportBackup && fileImportInput) {
    btnImportBackup.addEventListener('click', () => fileImportInput.click());
    fileImportInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importBackup(e.target.files[0]);
        fileImportInput.value = '';
      }
    });
  }

  // Initialize form to blank state
  resetForm();

  return {
    renderLiveInvoicePreview,
    renderHistoryList,
    resetForm
  };
}
