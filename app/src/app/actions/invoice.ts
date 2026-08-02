"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-types";
import type { ServiceDoc, StaffDoc, PaymentMethodDoc, PaymentAccountDoc, CustomerDoc, InvoiceDoc, InvoiceItemEmbed } from "@/lib/firestore-types";
import { calculateLoyaltyTier, calculateRewardPoints } from "@/lib/firestore-types";
import { invoiceFormSchema, InvoiceFormValues, refundInvoiceSchema, RefundInvoiceValues } from "@/lib/schemas/invoice";
import { generateInvoiceCode, serverTimestamp, toTimestamp, serializeDoc } from "@/lib/firestore-helpers";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

export async function getInvoiceFormOptions() {
  try {
    const [
      customersSnap,
      servicesSnap,
      staffSnap,
      paymentMethodsSnap,
      paymentAccountsSnap,
    ] = await Promise.all([
      db.collection(COLLECTIONS.CUSTOMERS)
        .where('isActive', '==', true)
        .get(),
      db.collection(COLLECTIONS.SERVICES)
        .where('isActive', '==', true)
        .get(),
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

    const customers = customersSnap.docs.map(doc => {
      const data = doc.data() as CustomerDoc;
      return { id: doc.id, fullName: data.fullName, phone: data.phone };
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));

    const services = servicesSnap.docs.map(doc => {
      const data = doc.data() as ServiceDoc;
      return {
        id: doc.id,
        code: data.code,
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
      };
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const staff = staffSnap.docs.map(doc => {
      const data = doc.data() as StaffDoc;
      return { id: doc.id, fullName: data.fullName, code: data.code };
    });

    const paymentMethods = paymentMethodsSnap.docs.map(doc => {
      const data = doc.data() as PaymentMethodDoc;
      return { id: doc.id, name: data.name, code: data.code };
    });

    const paymentAccounts = paymentAccountsSnap.docs.map(doc => {
      const data = doc.data() as PaymentAccountDoc;
      return { id: doc.id, bankName: data.bankName, code: data.code };
    });

    return {
      success: true,
      data: {
        customers,
        services,
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

    // Fetch service details để denormalize
    const serviceIds = validData.items.map(item => item.serviceId);
    const servicePromises = serviceIds.map(id =>
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
      itemsForInvoice.push({
        serviceId: item.serviceId,
        serviceName: service?.name || 'Unknown',
        serviceCode: service?.code || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
      });
    }

    const discount = validData.discount || 0;
    const surcharge = validData.surcharge || 0;
    // Đảm bảo totalAmount không bao giờ âm
    const totalAmount = Math.max(0, subTotal - discount + surcharge);

    // Fetch tên denormalized
    const [customerDoc, staffDoc, paymentMethodDoc, paymentAccountDoc] = await Promise.all([
      db.collection(COLLECTIONS.CUSTOMERS).doc(validData.customerId).get(),
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

    if (!customerDoc.exists) {
      return { success: false, error: "Khách hàng không tồn tại hoặc đã bị xóa." };
    }

    const customerData = customerDoc.data() as CustomerDoc;
    const staffData = staffDoc?.exists ? (staffDoc.data() as StaffDoc) : null;
    const pmData = paymentMethodDoc?.exists ? (paymentMethodDoc.data() as PaymentMethodDoc) : null;
    const paData = paymentAccountDoc?.exists ? (paymentAccountDoc.data() as PaymentAccountDoc) : null;

    // Generate mã hóa đơn
    const invoiceDate = validData.date;
    const invoiceCode = await generateInvoiceCode(invoiceDate);

    // Tính toán stats sau khi cộng thêm giao dịch mới
    const newTotalSpent = (customerData.totalSpent || 0) + totalAmount;
    const newRewardPoints = (customerData.rewardPoints || 0) + calculateRewardPoints(totalAmount);
    const newLoyaltyTier = calculateLoyaltyTier(newTotalSpent);

    // Dùng Firestore batch để đảm bảo atomicity
    const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc();

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
    const batch = db.batch();
    
    batch.set(invoiceRef, invoiceData);

    // Cập nhật customer stats (bao gồm rewardPoints và loyaltyTier)
    const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(validData.customerId);
    batch.update(customerRef, {
      totalSpent: FieldValue.increment(totalAmount),
      visitCount: FieldValue.increment(1),
      lastVisit: toTimestamp(invoiceDate),
      rewardPoints: FieldValue.increment(calculateRewardPoints(totalAmount)),
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

      batch.update(appointmentRef, {
        status: 'COMPLETED',
        endTime: endTime,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    revalidatePath('/doanh-thu');
    revalidatePath('/lich-hen');
    revalidatePath('/khach-hang');
    revalidatePath('/');

    return {
      success: true,
      data: { id: invoiceRef.id, invoiceCode },
    };

  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dữ liệu không hợp lệ" };
    }
    return { success: false, error: "Đã xảy ra lỗi khi tạo hóa đơn." };
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
        
        transaction.update(customerRef, {
          totalSpent: newTotalSpent,
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
