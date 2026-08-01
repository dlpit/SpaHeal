'use client';

import { useMemo } from 'react';
import { TrendingUp, Receipt, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { ClientInvoiceDoc } from '@/lib/firestore-types';

interface InvoiceStatsProps {
  invoices: ClientInvoiceDoc[];
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
}

function StatCard({ title, value, subtitle, icon: Icon, accentClass }: StatCardProps) {
  return (
    <Card className="border-[var(--spa-border)] shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--spa-text-secondary)]">{title}</p>
            <p className="text-2xl font-semibold text-[var(--spa-text-primary)] tracking-tight">
              {value}
            </p>
            <p className="text-xs text-[var(--spa-text-muted)]">{subtitle}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const stats = useMemo(() => {
    const completed = invoices.filter((inv) => inv.status === 'COMPLETED');
    const totalRevenue = completed.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalCount = completed.length;
    const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;

    return { totalRevenue, totalCount, avgValue };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <StatCard
        title="Tổng Doanh Thu"
        value={formatCurrency(stats.totalRevenue)}
        subtitle="Từ các hoá đơn hoàn thành"
        icon={TrendingUp}
        accentClass="bg-[var(--spa-blush-100)] text-[var(--spa-blush-500)]"
      />
      <StatCard
        title="Số Hoá Đơn"
        value={stats.totalCount.toLocaleString('vi-VN')}
        subtitle="Hoá đơn đã hoàn thành"
        icon={Receipt}
        accentClass="bg-[var(--spa-champagne-100)] text-[var(--spa-champagne-300)]"
      />
      <StatCard
        title="Giá Trị Trung Bình"
        value={formatCurrency(stats.avgValue)}
        subtitle="Mỗi hoá đơn hoàn thành"
        icon={CreditCard}
        accentClass="bg-[var(--spa-warm-200)] text-[var(--spa-text-secondary)]"
      />
    </div>
  );
}
