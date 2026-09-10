// Balaji Building Material Supplier - UPI QR Code Generator
import QRCode from 'qrcode';

export const UPI_CONFIG = {
  pa: 'pujarisudip5@okaxis',
  pn: 'Balaji Building Material Supplier',
  cu: 'INR'
};

/**
 * Generates an open static UPI payment URL string (STRICTLY NOT amount-driven)
 * format: upi://pay?pa=pujarisudip5@okaxis&pn=Balaji%20Building%20Material%20Supplier&cu=INR&tn=Invoice...
 * Allows customer to enter their own payment amount in Google Pay, PhonePe, Paytm, BHIM, etc.
 */
export function createUpiPaymentUri(...args) {
  let invoiceNo = '';
  // Support both createUpiPaymentUri(invoiceNo) and legacy test callers createUpiPaymentUri(amount, invoiceNo)
  if (args.length >= 2 && typeof args[1] === 'string') {
    invoiceNo = args[1];
  } else if (args.length >= 1 && typeof args[0] === 'string') {
    invoiceNo = args[0];
  }

  const pa = encodeURIComponent(UPI_CONFIG.pa);
  const pn = encodeURIComponent(UPI_CONFIG.pn);
  const cu = UPI_CONFIG.cu;
  const tn = encodeURIComponent(invoiceNo ? `Invoice ${invoiceNo}` : 'Balaji Building Material');

  // Open / non-amount driven UPI QR code - strictly NO &am=
  return `upi://pay?pa=${pa}&pn=${pn}&cu=${cu}&tn=${tn}`;
}

/**
 * Renders the UPI QR code directly onto a canvas or returns DataURL
 * @param {HTMLCanvasElement} canvas
 * @param {string} upiUri
 * @param {number} size
 */
export async function renderUpiQrToCanvas(canvas, upiUri, size = 180) {
  try {
    await QRCode.toCanvas(canvas, upiUri, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return true;
  } catch (err) {
    console.error('QR code rendering failed, falling back:', err);
    // Draw basic fallback on canvas
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UPI QR CODE', size / 2, size / 2 - 10);
    ctx.fillText('UPI: 8484029427', size / 2, size / 2 + 15);
    return false;
  }
}

/**
 * Returns QR as a high quality Data URL
 */
export async function getUpiQrDataUrl(upiUri, size = 240) {
  try {
    return await QRCode.toDataURL(upiUri, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Failed to get QR data URL:', err);
    return '';
  }
}
