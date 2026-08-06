import { db } from './firebase';
import { COLLECTIONS, InvoiceDoc, CustomerDoc } from './firestore-types';
import { calculateRewardPoints, calculateLoyaltyTier } from './firestore-types';
import { serverTimestamp } from './firestore-helpers';

export async function refundInvoiceInTx(
  transaction: FirebaseFirestore.Transaction,
  invoiceId: string,
  cancelReason: string,
  cancelledBy: string | null = null,
  isPenalty: boolean = false
) {
  const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(invoiceId);
  const invoiceSnap = await transaction.get(invoiceRef);

  if (!invoiceSnap.exists) {
    throw new Error("Hóa đơn không tồn tại.");
  }

  const invoiceData = invoiceSnap.data() as InvoiceDoc;

  if (invoiceData.status !== "COMPLETED") {
    throw new Error("Chỉ có thể hoàn tiền hóa đơn đã hoàn thành.");
  }

  // Thực hiện tất cả các thao tác READ trước (Quy định của Firestore)
  let customerSnap = null;
  let customerRef = null;
  
  if (invoiceData.customerId && !isPenalty) {
    customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(invoiceData.customerId);
    customerSnap = await transaction.get(customerRef);
  }

  // 1. Cập nhật hóa đơn (Bắt đầu các thao tác WRITE)
  transaction.update(invoiceRef, {
    status: "REFUNDED",
    cancelReason: cancelReason,
    refundedAt: serverTimestamp(),
    cancelledBy: cancelledBy,
    updatedAt: serverTimestamp(),
  });

  // 2. Cập nhật điểm & doanh số khách hàng (Chỉ làm khi KHÔNG phải hóa đơn phạt)
  if (!isPenalty && customerRef && customerSnap && customerSnap.exists) {
    const customerData = customerSnap.data() as CustomerDoc;
    
    const newTotalSpent = Math.max(0, (customerData.totalSpent || 0) - invoiceData.totalAmount);
    const pointsToDeduct = calculateRewardPoints(invoiceData.totalAmount);
    const newRewardPoints = Math.max(0, (customerData.rewardPoints || 0) - pointsToDeduct);
    const newLoyaltyTier = calculateLoyaltyTier(newTotalSpent);
    const newVisitCount = Math.max(0, (customerData.visitCount || 0) - 1);
    
    transaction.update(customerRef, {
      totalSpent: newTotalSpent,
      visitCount: newVisitCount,
      rewardPoints: newRewardPoints,
      loyaltyTier: newLoyaltyTier,
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Tạo phiếu chi (Expense) để đối soát dòng tiền
  const expenseRef = db.collection(COLLECTIONS.EXPENSES).doc();
  transaction.set(expenseRef, {
    date: serverTimestamp(),
    expenseCategoryId: "REFUND_CATEGORY",
    categoryName: "Hoàn tiền dịch vụ",
    categoryGroup: "Hoàn tiền hóa đơn",
    amount: invoiceData.totalAmount,
    quantity: 1,
    description: `Hoàn tiền cho hóa đơn ${invoiceData.invoiceCode}. Lý do: ${cancelReason}`,
    notes: `Thực hiện bởi: ${cancelledBy || 'System'}${isPenalty ? ' (Auto-refund do Reopen lịch hẹn)' : ''}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
