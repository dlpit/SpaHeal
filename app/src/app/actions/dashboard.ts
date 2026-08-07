"use server";

import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-types";
import type { InvoiceDoc } from "@/lib/firestore-types";
import { Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";

const getDashboardDataCached = unstable_cache(
  async () => {
  try {
    const now = new Date();

    // Start and end of current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);

    // Start of 6 months ago (for chart)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Firestore Timestamps
    const tsStartOfToday = Timestamp.fromDate(startOfToday);
    const tsEndOfToday = Timestamp.fromDate(endOfToday);
    const tsSixMonthsAgo = Timestamp.fromDate(sixMonthsAgo);
    const tsEndOfMonth = Timestamp.fromDate(endOfMonth);

    // 1. Fetch all data in parallel
    const [
      totalCustomersSnap,
      todayAppointmentsSnap,
      recentInvoicesSnap,
      chartInvoicesSnap,
    ] = await Promise.all([
      // Tổng số khách hàng active
      db.collection(COLLECTIONS.CUSTOMERS)
        .where('isActive', '==', true)
        .count()
        .get(),

      // Lịch hẹn hôm nay
      db.collection(COLLECTIONS.APPOINTMENTS)
        .where('date', '>=', tsStartOfToday)
        .where('date', '<=', tsEndOfToday)
        .count()
        .get(),

      // 5 Hóa đơn gần nhất
      db.collection(COLLECTIONS.INVOICES)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),

      // Data biểu đồ: Hóa đơn 6 tháng gần nhất (Bao gồm cả tháng này, nên có thể dùng để tính monthlyRevenue)
      db.collection(COLLECTIONS.INVOICES)
        .where('date', '>=', tsSixMonthsAgo)
        .where('date', '<=', tsEndOfMonth)
        .get(),
    ]);

    // 2. Format recent invoices
    const recentInvoices = recentInvoicesSnap.docs.map(doc => {
      const data = doc.data() as InvoiceDoc;
      return {
        id: doc.id,
        invoiceCode: data.invoiceCode,
        totalAmount: data.totalAmount,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        customer: {
          fullName: data.customerName,
        },
      };
    });

    // 3. Process Chart Data and calculate monthlyRevenue
    let monthlyRevenue = 0;
    const chartData: { name: string; total: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `T${d.getMonth() + 1}`;
      const isCurrentMonth = i === 0;

      // Lọc hóa đơn trong tháng này
      const monthlyTotal = chartInvoicesSnap.docs
        .filter(doc => {
          const data = doc.data() as InvoiceDoc;
          const invoiceDate = data.date?.toDate?.();
          return data.status === 'COMPLETED' &&
            invoiceDate &&
            invoiceDate.getMonth() === d.getMonth() &&
            invoiceDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, doc) => {
          const data = doc.data() as InvoiceDoc;
          return sum + data.totalAmount;
        }, 0);

      chartData.push({
        name: monthStr,
        total: monthlyTotal,
      });

      if (isCurrentMonth) {
        monthlyRevenue = monthlyTotal;
      }
    }

    return {
      success: true,
      data: {
        stats: {
          revenue: monthlyRevenue,
          customers: totalCustomersSnap.data().count,
          appointments: todayAppointmentsSnap.data().count,
        },
        recentInvoices,
        chartData,
      },
    };

  } catch (error) {
    console.error("Dashboard data error:", error);
    return { success: false, error: "Không thể tải dữ liệu Dashboard." };
  }
}, ['dashboard-data'], { revalidate: 300 }); // Cache 5 phút

export async function getDashboardData() {
  return getDashboardDataCached();
}
