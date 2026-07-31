// =============================================================================
// Formatting Utilities cho Spa Management System
// =============================================================================

/**
 * Format số thành tiền Việt Nam (VND)
 * @example formatCurrency(35000) → "35.000₫"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
}

/**
 * Format số ngắn gọn (dùng cho dashboard widget)
 * @example formatCompactCurrency(1500000) → "1.5tr"
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}₫`;
}

/**
 * Format ngày giờ theo định dạng Việt Nam
 * @example formatDate(new Date()) → "31/07/2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format ngày giờ đầy đủ
 * @example formatDateTime(new Date()) → "31/07/2026, 14:30"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format số điện thoại Việt Nam
 * @example formatPhone("0901234567") → "090 123 4567"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Tạo mã hóa đơn tự động
 * @example generateInvoiceCode(55) → "HD055"
 */
export function generateInvoiceCode(sequence: number): string {
  return `HD${String(sequence).padStart(3, '0')}`;
}
