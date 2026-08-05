"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-types";
import type { ServiceDoc, StaffDoc, PaymentMethodDoc, PaymentAccountDoc, CustomerDoc, InvoiceDoc, InvoiceItemEmbed, PaymentType } from "@/lib/firestore-types";
import { calculateLoyaltyTier, calculateRewardPoints } from "@/lib/firestore-types";
import { invoiceFormSchema, InvoiceFormValues, refundInvoiceSchema, RefundInvoiceValues } from "@/lib/schemas/invoice";
import { generateInvoiceCode, generateInvoiceCodeInTx, serverTimestamp, toTimestamp, serializeDoc } from "@/lib/firestore-helpers";
import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

function inferPaymentType(code: string, explicitType?: PaymentType): PaymentType {
  if (explicitType && ['CASH', 'BANK', 'WALLET', 'OTHER'].includes(explicitType)) {
    return explicitType;
  }
  const upper = (code || '').toUpperCase();
  if (upper === 'TM' || upper === 'CASH') return 'CASH';
  if (upper === 'CK' || upper === 'QR' || upper === 'VCB' || upper === 'MB' || upper === 'BANK') return 'BANK';
  if (upper === 'WALLET' || upper === 'MOMO' || upper === 'ZALOPAY' || upper === 'SHOPEEPAY') return 'WALLET';
  return 'OTHER';
}

async function ensureDefaultPaymentOptions() {
  const defaultMethods = [
    { code: 'TM', name: 'Tiền mặt', type: 'CASH' as const },
    { code: 'CK', name: 'Chuyển khoản', type: 'BANK' as const },
    { code: 'WALLET', name: 'Ví điện tử', type: 'WALLET' as const },
    { code: 'OTHER', name: 'Khác', type: 'OTHER' as const },
  ];

  const defaultAccounts = [
    { code: 'VCB', bankName: 'VIETCOMBANK', type: 'BANK' as const },
    { code: 'MB', bankName: 'MB BANK', type: 'BANK' as const },
    { code: 'MOMO', bankName: 'MoMo', type: 'WALLET' as const },
    { code: 'ZALOPAY', bankName: 'ZaloPay', type: 'WALLET' as const },
    { code: 'SHOPEEPAY', bankName: 'ShopeePay', type: 'WALLET' as const },
    { code: 'OTHER', bankName: 'Tài khoản khác', type: 'OTHER' as const },
  ];

  try {
    const methodsSnap = await db.collection(COLLECTIONS.PAYMENT_METHODS).get();
    const existingMethodCodes = new Set(methodsSnap.docs.map(d => (d.data() as PaymentMethodDoc).code));
    
    const batch = db.batch();
    let hasChanges = false;

    for (const pm of defaultMethods) {
      if (!existingMethodCodes.has(pm.code)) {
        const ref = db.collection(COLLECTIONS.PAYMENT_METHODS).doc();
        batch.set(ref, {
          code: pm.code,
          name: pm.name,
          type: pm.type,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        hasChanges = true;
      }
    }

    const accountsSnap = await db.collection(COLLECTIONS.PAYMENT_ACCOUNTS).get();
    const existingAccountCodes = new Set(accountsSnap.docs.map(d => (d.data() as PaymentAccountDoc).code));

    for (const pa of defaultAccounts) {
      if (!existingAccountCodes.has(pa.code)) {
        const ref = db.collection(COLLECTIONS.PAYMENT_ACCOUNTS).doc();
        batch.set(ref, {
          code: pa.code,
          bankName: pa.bankName,
          accountNumber: null,
          accountName: null,
          type: pa.type,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
    }
  } catch (err) {
    console.error("Error ensuring default payment options:", err);
  }
}

export async function getInvoiceFormOptions() {
  try {
    await ensureDefaultPaymentOptions();

    const [
      staffSnap,
      paymentMethodsSnap,
      paymentAccountsSnap,
    ] = await Promise.all([
      db.collection(COLLECTIONS.STAFF)
        .where('isActive', '==', true)
        .get(),
      db.collection(COLLECTIONS.PAYMENT_METHODS)
        .where('isActive', '==', true)
        .get(),
      db.collection(COLLECTIONS.PAYMENT_ACCOUNTS)
        .where('isActive', '==', true)
        .get(),
    ]);

    const staff = staffSnap.docs.map(doc => {
      const data = doc.data() as StaffDoc;
      return { id: doc.id, fullName: data.fullName, code: data.code };
    });

    const paymentMethods = paymentMethodsSnap.docs.map(doc => {
      const data = doc.data() as PaymentMethodDoc;
      const type = inferPaymentType(data.code, data.type);
      return { id: doc.id, name: data.name, code: data.code, type };
    });

    const paymentAccounts = paymentAccountsSnap.docs.map(doc => {
      const data = doc.data() as PaymentAccountDoc;
      const type = inferPaymentType(data.code, data.type);
      return { id: doc.id, bankName: data.bankName, code: data.code, type };
    });

    return {
      success: true,
      data: {
        staff,
        paymentMethods,
        paymentAccounts,
      },
    };
  } catch (error) {
    console.error("Error fetching invoice options:", error);
    return { success: false, error: "Không thể lấy dữ liệu. Vui lòng thử lại sau." };
  }
}

export async function getInvoices() {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.INVOICES)
      .orderBy('date', 'desc')
      .limit(100) // Giới hạn an toàn để tránh OOM
      .get();

    const invoices = snapshot.docs.map((doc) => {
      const data = doc.data() as InvoiceDoc & Record<string, unknown>;
      return serializeDoc(doc.id, data);
    });

    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: 'Không thể lấy danh sách hóa đơn.' };
  }
}

export async function createInvoice(data: InvoiceFormValues) {
  try {
    // Validate trên server
    const validData = invoiceFormSchema.parse(data);

    // Tính tổng tiền trên server để tránh giả mạo từ client
    let subTotal = 0;
    const itemsForInvoice: InvoiceItemEmbed[] = [];

    // Fetch service details để denormalize (dùng Set để tránh query trùng lặp)
    const uniqueServiceIds = Array.from(new Set(validData.items.map(item => item.serviceId)));
    const servicePromises = uniqueServiceIds.map(id =>
      db.collection(COLLECTIONS.SERVICES).doc(id).get()
    );
    const serviceDocs = await Promise.all(servicePromises);
    const serviceMap = new Map<string, ServiceDoc & { id: string }>();
    for (const doc of serviceDocs) {
      if (doc.exists) {
        serviceMap.set(doc.id, { id: doc.id, ...doc.data() as ServiceDoc });
      }
    }

    for (const item of validData.items) {
      const amount = item.quantity * item.unitPrice;
      subTotal += amount;
      
      const service = serviceMap.get(item.serviceId);
      if (!service) {
        throw new Error("Dịch vụ không tồn tại hoặc đã bị xóa: " + item.serviceId);
      }
      
      itemsForInvoice.push({
        serviceId: item.serviceId,
        serviceName: service.name,
        serviceCode: service.code || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
      });
    }

    const discount = validData.discount || 0;
    const surcharge = validData.surcharge || 0;
    // Đảm bảo totalAmount không bao giờ âm
    const totalAmount = Math.max(0, subTotal - discount + surcharge);

    // Fetch tên denormalized cho các dữ liệu không bị race condition
    const [staffDoc, paymentMethodDoc, paymentAccountDoc] = await Promise.all([
      validData.staffId
        ? db.collection(COLLECTIONS.STAFF).doc(validData.staffId).get()
        : Promise.resolve(null),
      validData.paymentMethodId
        ? db.collection(COLLECTIONS.PAYMENT_METHODS).doc(validData.paymentMethodId).get()
        : Promise.resolve(null),
      validData.paymentAccountId
        ? db.collection(COLLECTIONS.PAYMENT_ACCOUNTS).doc(validData.paymentAccountId).get()
        : Promise.resolve(null),
    ]);

    const staffData = staffDoc?.exists ? (staffDoc.data() as StaffDoc) : null;
    const pmData = paymentMethodDoc?.exists ? (paymentMethodDoc.data() as PaymentMethodDoc) : null;
    const paData = paymentAccountDoc?.exists ? (paymentAccountDoc.data() as PaymentAccountDoc) : null;

    if (pmData) {
      const pmType = inferPaymentType(pmData.code, pmData.type);
      if (pmType !== 'CASH' && !validData.paymentAccountId) {
        return { success: false, error: "Vui lòng chọn tài khoản nhận cho hình thức thanh toán này." };
      }
    }

    // Chuẩn bị reference hóa đơn
    const invoiceDate = validData.date;
    const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc();
    const createdInvoiceId = invoiceRef.id;
    let invoiceCode = "";

    // Dùng Firestore transaction để đảm bảo tính toán hạng thành viên (loyaltyTier) là atomicity
    await db.runTransaction(async (transaction) => {
      // Thực hiện tất cả các thao tác READ trước (Quy định của Firestore)
      const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(validData.customerId);
      const customerSnap = await transaction.get(customerRef);
      
      if (!customerSnap.exists) {
        throw new Error("Khách hàng không tồn tại hoặc đã bị xóa.");
      }
      
      // Đảm bảo tạo mã hóa đơn nguyên tử (atomic) - Hàm này thực hiện READ counterRef rồi WRITE counterRef
      invoiceCode = await generateInvoiceCodeInTx(transaction, invoiceDate);
      
      const customerData = customerSnap.data() as CustomerDoc;

      // Tính toán stats sau khi cộng thêm giao dịch mới
      const newTotalSpent = (customerData.totalSpent || 0) + totalAmount;
      const newRewardPoints = (customerData.rewardPoints || 0) + calculateRewardPoints(totalAmount);
      const newLoyaltyTier = calculateLoyaltyTier(newTotalSpent);

      const invoiceData: Omit<InvoiceDoc, 'createdAt' | 'updatedAt'> & { createdAt: FieldValue; updatedAt: FieldValue } = {
        invoiceCode,
        appointmentId: validData.appointmentId || null,
        date: toTimestamp(invoiceDate),
        customerId: validData.customerId,
        customerName: customerData.fullName,
        staffId: validData.staffId || null,
        staffName: staffData?.fullName || null,
        paymentMethodId: validData.paymentMethodId || null,
        paymentMethodName: pmData?.name || null,
        paymentAccountId: validData.paymentAccountId || null,
        paymentAccountName: paData?.bankName || null,
        subTotal,
        discount,
        surcharge,
        totalAmount,
        status: 'COMPLETED',
        notes: validData.notes || null,
        items: itemsForInvoice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Batch write: tạo invoice + cập nhật customer stats
      transaction.set(invoiceRef, invoiceData);

      // Cập nhật customer stats (bao gồm rewardPoints và loyaltyTier)
      transaction.update(customerRef, {
        totalSpent: newTotalSpent,
        visitCount: (customerData.visitCount || 0) + 1,
        lastVisit: toTimestamp(invoiceDate),
        rewardPoints: newRewardPoints,
        loyaltyTier: newLoyaltyTier, // Tự động thăng hạng nếu đủ điều kiện
        updatedAt: serverTimestamp(),
      });

      // Nếu hóa đơn được tạo từ lịch hẹn → tự động chuyển trạng thái sang COMPLETED và chốt Giờ kết thúc
      if (validData.appointmentId) {
        const appointmentRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(validData.appointmentId);
        
        const now = new Date();
        const endTime = new Intl.DateTimeFormat('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Ho_Chi_Minh' 
        }).format(now);

        // Cập nhật lại danh sách dịch vụ vào lịch hẹn (sync back)
        const appointmentServices = itemsForInvoice.map(item => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity,
          price: item.unitPrice,
        }));

        transaction.update(appointmentRef, {
          status: 'COMPLETED',
          statusHistory: FieldValue.arrayUnion({
            status: 'COMPLETED',
            timestamp: Timestamp.now(),
          }) as any,
          endTime: endTime,
          services: appointmentServices,
          ...(appointmentServices.length > 0 ? {
            serviceId: appointmentServices[0].serviceId,
            serviceName: appointmentServices[0].serviceName,
          } : {}),
          staffId: validData.staffId || null,
          staffName: staffData?.fullName || null,
          invoiceId: createdInvoiceId,
          updatedAt: serverTimestamp(),
        });
      }
    });

    revalidatePath('/doanh-thu');
    revalidatePath('/lich-hen');
    revalidatePath('/khach-hang');
    revalidatePath('/');

    return {
      success: true,
      data: { id: createdInvoiceId, invoiceCode },
    };

  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dữ liệu không hợp lệ" };
    }
    return { success: false, error: error.message || "Đã xảy ra lỗi khi tạo hóa đơn." };
  }
}

export async function refundInvoice(data: RefundInvoiceValues & { cancelledBy?: string }) {
  try {
    const validData = refundInvoiceSchema.parse(data);

    await db.runTransaction(async (transaction) => {
      const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc(validData.invoiceId);
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
      
      if (invoiceData.customerId) {
        customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(invoiceData.customerId);
        customerSnap = await transaction.get(customerRef);
      }

      // 1. Cập nhật hóa đơn (Bắt đầu các thao tác WRITE)
      transaction.update(invoiceRef, {
        status: "REFUNDED",
        cancelReason: validData.cancelReason,
        refundedAt: serverTimestamp(),
        cancelledBy: data.cancelledBy || null,
        updatedAt: serverTimestamp(),
      });

      // 2. Cập nhật điểm & doanh số khách hàng
      if (customerRef && customerSnap && customerSnap.exists) {
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
      // Chúng ta sử dụng ID 'REFUND' tạm thời cho category nếu không có bảng mã tĩnh, 
      // hoặc bạn có thể query lấy ID của category 'Hoàn tiền' (trong phạm vi này ta lưu thẳng giá trị denormalized)
      transaction.set(expenseRef, {
        date: serverTimestamp(),
        expenseCategoryId: "REFUND_CATEGORY", // Dummy ID hoặc ID thật của danh mục hoàn tiền
        categoryName: "Hoàn tiền dịch vụ",
        categoryGroup: "Hoàn tiền hóa đơn",
        amount: invoiceData.totalAmount,
        quantity: 1,
        description: `Hoàn tiền cho hóa đơn ${invoiceData.invoiceCode}. Lý do: ${validData.cancelReason}`,
        notes: `Thực hiện bởi: ${data.cancelledBy || 'System'}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    revalidatePath('/doanh-thu');
    revalidatePath('/lich-hen');
    revalidatePath('/khach-hang');
    revalidatePath('/chi-phi');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error("Error refunding invoice:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dữ liệu không hợp lệ" };
    }
    return { success: false, error: error.message || "Đã xảy ra lỗi khi hoàn tiền hóa đơn." };
  }
}
