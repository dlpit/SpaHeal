// ============================================================================
// RBAC / Permissions Helper
// Placeholder module for Future-proofing role-based access control
// ============================================================================

/**
 * Kiểm tra quyền thực hiện thao tác Hoàn tiền / Hủy bỏ hóa đơn.
 * Hiện tại mặc định trả về true để cho phép mọi người dùng sử dụng.
 * @param user Đối tượng user hiện tại (ví dụ lấy từ session)
 * @returns boolean
 */
export function canVoidInvoice(user?: unknown): boolean {
  // TODO: Tích hợp với User Session & RBAC matrix sau này.
  // Ví dụ: return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = true; // Placeholder
  return isAdmin;
}
