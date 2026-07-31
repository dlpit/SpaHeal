"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  try {
    const now = new Date();
    
    // Start and end of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 1. Fetch Stats (Parallel)
    const [
      currentMonthRevenue,
      totalCustomers,
      todayAppointments,
      recentInvoices,
      chartDataRaw
    ] = await Promise.all([
      // Doanh thu tháng này
      prisma.invoice.aggregate({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      // Tổng số khách hàng
      prisma.customer.count({
        where: { isActive: true }
      }),
      // Lịch hẹn hôm nay
      prisma.appointment.count({
        where: {
          date: { gte: startOfToday, lte: new Date(startOfToday.getTime() + 86400000 - 1) }
        }
      }),
      // 5 Hóa đơn gần nhất
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } }
        }
      }),
      // Data biểu đồ: Doanh thu 6 tháng gần nhất (gom nhóm theo tháng)
      // Prisma không hỗ trợ GROUP BY theo tháng trực tiếp tốt cho SQLite/MySQL một cách đồng nhất, 
      // nên ta fetch toàn bộ hóa đơn 6 tháng và tính toán bằng JS cho an toàn.
      prisma.invoice.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            lte: endOfMonth
          },
          status: 'COMPLETED'
        },
        select: {
          date: true,
          totalAmount: true
        }
      })
    ]);

    // 2. Process Chart Data
    // Tạo mảng 6 tháng gần nhất
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `T${d.getMonth() + 1}`;
      
      // Lọc các hóa đơn trong tháng này
      const monthlyTotal = chartDataRaw
        .filter(inv => inv.date.getMonth() === d.getMonth() && inv.date.getFullYear() === d.getFullYear())
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

      chartData.push({
        name: monthStr,
        total: monthlyTotal
      });
    }

    return {
      success: true,
      data: {
        stats: {
          revenue: currentMonthRevenue._sum.totalAmount || 0,
          customers: totalCustomers,
          appointments: todayAppointments
        },
        recentInvoices,
        chartData
      }
    };

  } catch (error) {
    console.error("Dashboard data error:", error);
    return { success: false, error: "Không thể tải dữ liệu Dashboard." };
  }
}
