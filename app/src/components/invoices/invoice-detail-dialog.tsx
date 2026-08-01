'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/format';
import { Receipt, User, CalendarDays, CreditCard, Tag, FileText } from 'lucide-react';
import type { ClientInvoiceDoc } from '@/lib/firestore-types';
import { cn } from '@/lib/utils';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ClientInvoiceDoc | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Hoàn thành', className: 'bg-[var(--spa-success)]/15 text-[var(--spa-success)] border-[var(--spa-success)]/30' },
  DRAFT: { label: 'Nháp', className: 'bg-[var(--spa-warning)]/15 text-amber-700 border-amber-300/30' },
  CANCELLED: { label: 'Đã huỷ', className: 'bg-[var(--spa-danger)]/15 text-[var(--spa-danger)] border-[var(--spa-danger)]/30' },
  REFUNDED: { label: 'Hoàn tiền', className: 'bg-blue-100 text-blue-700 border-blue-300/30 dark:bg-blue-900/20 dark:text-blue-300' },
};

export function InvoiceDetailDialog({ open, onOpenChange, invoice }: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const statusConfig = STATUS_CONFIG[invoice.status] ?? { label: invoice.status, className: '' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-muted/30 px-6 py-4 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--spa-blush-100)] flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5 text-[var(--spa-blush-500)]" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-xl font-normal text-[var(--spa-text-primary)]">
                    {invoice.invoiceCode}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[var(--spa-text-muted)]">
                    Chi tiết hoá đơn
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('text-xs font-medium border', statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* General Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow icon={CalendarDays} label="Ngày lập" value={formatDate(invoice.date)} />
            <InfoRow icon={User} label="Khách hàng" value={invoice.customerName} />
            <InfoRow icon={Tag} label="Nhân viên" value={invoice.staffName || 'Không có'} />
            <InfoRow
              icon={CreditCard}
              label="Thanh toán"
              value={[invoice.paymentMethodName, invoice.paymentAccountName]
                .filter(Boolean)
                .join(' — ') || 'Không có'}
            />
            {invoice.notes && (
              <div className="col-span-2">
                <InfoRow icon={FileText} label="Ghi chú" value={invoice.notes} />
              </div>
            )}
          </div>

          <Separator className="border-dashed" />

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--spa-text-primary)] mb-3">
              Dịch vụ sử dụng
            </h3>
            <div className="rounded-xl border border-[var(--spa-border)] overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold text-[var(--spa-text-secondary)] uppercase tracking-wide">
                <span className="col-span-5">Tên dịch vụ</span>
                <span className="col-span-2 text-center">Mã</span>
                <span className="col-span-2 text-center">SL</span>
                <span className="col-span-3 text-right">Thành tiền</span>
              </div>
              {/* Items */}
              {invoice.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-t border-[var(--spa-border)] hover:bg-muted/20 transition-colors"
                >
                  <span className="col-span-5 font-medium text-[var(--spa-text-primary)] truncate">
                    {item.serviceName}
                  </span>
                  <span className="col-span-2 text-center text-[var(--spa-text-muted)] font-mono text-xs">
                    {item.serviceCode}
                  </span>
                  <span className="col-span-2 text-center text-[var(--spa-text-secondary)]">
                    {item.quantity}
                  </span>
                  <span className="col-span-3 text-right font-semibold text-[var(--spa-text-primary)]">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* Totals */}
          <div className="space-y-2 w-full max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-[var(--spa-text-secondary)]">
              <span>Tạm tính</span>
              <span className="font-medium">{formatCurrency(invoice.subTotal)}</span>
            </div>
            {(invoice.discount ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--spa-danger)]">
                <span>Giảm giá</span>
                <span className="font-medium">- {formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {(invoice.surcharge ?? 0) > 0 && (
              <div className="flex justify-between text-[var(--spa-text-secondary)]">
                <span>Phụ thu</span>
                <span className="font-medium">+ {formatCurrency(invoice.surcharge)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center pt-1">
              <span className="text-base font-semibold text-[var(--spa-text-primary)]">Tổng cộng</span>
              <span className="text-xl font-bold text-[var(--spa-blush-500)]">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-component ---
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-[var(--spa-champagne-300)] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-[var(--spa-text-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--spa-text-primary)]">{value}</p>
      </div>
    </div>
  );
}
