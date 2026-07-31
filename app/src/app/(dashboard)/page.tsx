import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { DollarSign, Users, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "../actions/dashboard";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const result = await getDashboardData();
  
  if (!result.success || !result.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Không thể tải dữ liệu. Vui lòng kiểm tra lại kết nối cơ sở dữ liệu.</p>
      </div>
    );
  }

  const { stats, recentInvoices, chartData } = result.data;

  return (
    <div className="flex-1 space-y-6 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-normal tracking-tight">Tổng quan</h2>
          <p className="text-muted-foreground mt-1">
            Hiệu suất kinh doanh trong tháng này.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/doanh-thu/tao-moi">
            <Button>Tạo hóa đơn</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">
              {formatCurrency(Number(stats.revenue))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tính từ đầu tháng đến hiện tại
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.customers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng số lượng khách hàng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.appointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu</CardTitle>
            <CardDescription>
              Thống kê doanh thu trong 6 tháng gần nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Giao dịch gần đây</CardTitle>
            <CardDescription>
              5 hóa đơn được thanh toán mới nhất.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {invoice.customer?.fullName || "Khách vãng lai"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {invoice.invoiceCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-medium">
                      +{formatCurrency(Number(invoice.totalAmount))}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 bg-spa-success/10 text-spa-success px-2 py-0.5 rounded-full">
                      Hoàn thành
                    </span>
                  </div>
                </div>
              ))}
              
              {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  Chưa có giao dịch nào
                </div>
              )}
            </div>
            
            <div className="mt-6 flex">
              <Link href="/doanh-thu" className="w-full">
                <Button variant="outline" className="w-full text-xs" size="sm">
                  Xem tất cả hóa đơn <ArrowRight className="ml-2 w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
