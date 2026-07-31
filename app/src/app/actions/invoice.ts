"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { invoiceFormSchema, InvoiceFormValues } from "@/lib/schemas/invoice";
import { revalidatePath } from "next/cache";

export async function getInvoiceFormOptions() {
  try {
    const [customers, services, staff, paymentMethods, paymentAccounts] = await Promise.all([
      prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, phone: true },
        orderBy: { fullName: 'asc' }
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, price: true, categoryId: true },
        orderBy: { sortOrder: 'asc' }
      }).then(services => services.map(s => ({ ...s, price: Number(s.price) }))),
      prisma.staff.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, code: true }
      }),
      prisma.paymentMethod.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true }
      }),
      prisma.paymentAccount.findMany({
        where: { isActive: true },
        select: { id: true, bankName: true, code: true }
      })
    ]);

    return {
      success: true,
      data: {
        customers,
        services,
        staff,
        paymentMethods,
        paymentAccounts
      }
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
    const itemsData = validData.items.map(item => {
      const amount = item.quantity * item.unitPrice;
      subTotal += amount;
      return {
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: amount,
      };
    });

    const discount = validData.discount || 0;
    const surcharge = validData.surcharge || 0;
    const totalAmount = subTotal - discount + surcharge;

    // Start Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Invoice Code (e.g. HD011)
      const dateStart = new Date(validData.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(validData.date);
      dateEnd.setHours(23, 59, 59, 999);

      // Count invoices today to generate sequence
      const todayCount = await tx.invoice.count({
        where: {
          createdAt: {
            gte: dateStart,
            lte: dateEnd,
          }
        }
      });
      
      const sequence = todayCount + 1;
      const dateStr = `${dateStart.getFullYear().toString().slice(-2)}${(dateStart.getMonth() + 1).toString().padStart(2, '0')}${dateStart.getDate().toString().padStart(2, '0')}`;
      const invoiceCode = `HD${dateStr}-${sequence.toString().padStart(3, '0')}`;

      // 2. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceCode,
          date: validData.date,
          customerId: validData.customerId,
          staffId: validData.staffId || null,
          paymentMethodId: validData.paymentMethodId || null,
          paymentAccountId: validData.paymentAccountId || null,
          subTotal,
          discount,
          surcharge,
          totalAmount,
          notes: validData.notes,
          status: 'COMPLETED',
          items: {
            create: itemsData,
          }
        }
      });

      // 3. Update Customer Stats
      await tx.customer.update({
        where: { id: validData.customerId },
        data: {
          totalSpent: { increment: totalAmount },
          visitCount: { increment: 1 },
          lastVisit: validData.date,
        }
      });

      return invoice;
    });

    revalidatePath('/doanh-thu');
    revalidatePath('/');
    
    return { success: true, data: result };

  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dữ liệu không hợp lệ" };
    }
    return { success: false, error: "Đã xảy ra lỗi khi tạo hóa đơn." };
  }
}
