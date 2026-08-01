import Link from 'next/link';
import { Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { InvoiceStats } from '@/components/invoices/invoice-stats';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { getInvoices } from '@/app/actions/invoice';
import type { ClientInvoiceDoc } from '@/lib/firestore-types';

export const metadata = {
  title: "Doanh thu | SpaHeal",
  description: "Quản lý hóa đơn và theo dõi doanh thu của cửa hàng spa",
};

export default async function RevenuePage() {
  const result = await getInvoices();
  const invoices: ClientInvoiceDoc[] = result.success && result.data ? (result.data as unknown as ClientInvoiceDoc[]) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title="Doanh thu"
          description="Quản lý hóa đơn và theo dõi doanh thu cửa hàng"
          icon={Receipt}
        />
        <Link href="/doanh-thu/tao-moi" className="shrink-0">
          <Button className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hoá đơn
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      {invoices.length > 0 ? (
        <InvoiceStats invoices={invoices} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: 'Tổng Doanh Thu', value: '0₫' },
            { label: 'Số Hoá Đơn', value: '0' },
            { label: 'Giá Trị Trung Bình', value: '0₫' },
          ].map((item) => (
            <Card key={item.label} className="border-[var(--spa-border)] shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-[var(--spa-text-secondary)]">{item.label}</p>
                <p className="text-2xl font-semibold text-[var(--spa-text-primary)] mt-1">{item.value}</p>
                <p className="text-xs text-[var(--spa-text-muted)] mt-1">Chưa có dữ liệu</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoice Table */}
      <Card className="border-[var(--spa-border)] shadow-sm">
        <CardContent className="p-6">
          {invoices.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-[var(--spa-blush-50)] flex items-center justify-center mb-4">
                <Receipt className="h-7 w-7 text-[var(--spa-blush-300)]" />
              </div>
              <h3 className="font-heading text-xl font-normal text-[var(--spa-text-primary)] mb-2">
                Chưa có hoá đơn nào
              </h3>
              <p className="text-sm text-[var(--spa-text-secondary)] mb-6 max-w-xs">
                Tạo hoá đơn đầu tiên để bắt đầu theo dõi doanh thu của cửa hàng.
              </p>
              <Link href="/doanh-thu/tao-moi">
                <Button className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo hoá đơn đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            <InvoiceTable invoices={invoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
