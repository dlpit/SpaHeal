"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-types";
import type { ServiceDoc, StaffDoc, PaymentMethodDoc, PaymentAccountDoc, CustomerDoc, InvoiceDoc, InvoiceItemEmbed } from "@/lib/firestore-types";
import { invoiceFormSchema, InvoiceFormValues } from "@/lib/schemas/invoice";
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

export async function createInvoice(data: InvoiceFormValues) {
  try {
    // Validate on server
    const validData = invoiceFormSchema.parse(data);

    // Calculate totals on server to prevent tampering
    let subTotal = 0;
    const itemsForInvoice: InvoiceItemEmbed[] = [];

    // Fetch service details for denormalization
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
    const totalAmount = subTotal - discount + surcharge;

    // Fetch denormalized names
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

    const customerData = customerDoc.data() as CustomerDoc | undefined;
    const staffData = staffDoc?.exists ? (staffDoc.data() as StaffDoc) : null;
    const pmData = paymentMethodDoc?.exists ? (paymentMethodDoc.data() as PaymentMethodDoc) : null;
    const paData = paymentAccountDoc?.exists ? (paymentAccountDoc.data() as PaymentAccountDoc) : null;

    // Generate invoice code
    const invoiceDate = validData.date;
    const invoiceCode = await generateInvoiceCode(invoiceDate);

    // Use Firestore transaction for atomicity
    const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc();

    const invoiceData: Omit<InvoiceDoc, 'createdAt' | 'updatedAt'> & { createdAt: FieldValue; updatedAt: FieldValue } = {
      invoiceCode,
      date: toTimestamp(invoiceDate),
      customerId: validData.customerId,
      customerName: customerData?.fullName || 'Khách vãng lai',
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

    // Batch write: create invoice + update customer stats
    const batch = db.batch();
    
    batch.set(invoiceRef, invoiceData);

    // Update customer stats
    const customerRef = db.collection(COLLECTIONS.CUSTOMERS).doc(validData.customerId);
    batch.update(customerRef, {
      totalSpent: FieldValue.increment(totalAmount),
      visitCount: FieldValue.increment(1),
      lastVisit: toTimestamp(invoiceDate),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    revalidatePath('/doanh-thu');
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
