'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, Eye, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import { InvoiceDetailDialog } from './invoice-detail-dialog';
import { cn } from '@/lib/utils';
import type { ClientInvoiceDoc } from '@/lib/firestore-types';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface InvoiceTableProps {
  invoices: ClientInvoiceDoc[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Hoàn thành', className: 'bg-[var(--spa-success)]/15 text-[var(--spa-success)] border-[var(--spa-success)]/30' },
  DRAFT: { label: 'Nháp', className: 'bg-[var(--spa-warning)]/15 text-amber-700 border-amber-300/30' },
  CANCELLED: { label: 'Đã huỷ', className: 'bg-[var(--spa-danger)]/15 text-[var(--spa-danger)] border-[var(--spa-danger)]/30' },
  REFUNDED: { label: 'Hoàn tiền', className: 'bg-blue-100 text-blue-700 border-blue-300/30 dark:bg-blue-900/20 dark:text-blue-300' },
};

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoiceDoc | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const lower = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceCode?.toLowerCase().includes(lower) ||
        inv.customerName?.toLowerCase().includes(lower)
    );
  }, [invoices, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const actualPage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice((actualPage - 1) * pageSize, actualPage * pageSize);
  }, [filteredInvoices, actualPage, pageSize]);

  const openDetail = (invoice: ClientInvoiceDoc) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="invoice-search"
            placeholder="Tìm theo mã HĐ, tên khách..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <Link href="/doanh-thu/tao-moi">
          <Button className="w-full sm:w-auto bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hoá đơn
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border border-[var(--spa-border)] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-11 bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-[var(--spa-text-secondary)]">Mã HĐ</TableHead>
              <TableHead className="font-semibold text-[var(--spa-text-secondary)]">Khách hàng</TableHead>
              <TableHead className="font-semibold text-[var(--spa-text-secondary)] hidden md:table-cell">Ngày</TableHead>
              <TableHead className="font-semibold text-[var(--spa-text-secondary)] hidden lg:table-cell">Nhân viên</TableHead>
              <TableHead className="font-semibold text-[var(--spa-text-secondary)] hidden md:table-cell">Trạng thái</TableHead>
              <TableHead className="font-semibold text-[var(--spa-text-secondary)] text-right">Tổng tiền</TableHead>
              <TableHead className="text-right font-semibold text-[var(--spa-text-secondary)]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-[var(--spa-text-muted)]">
                    <div className="h-12 w-12 rounded-full bg-[var(--spa-blush-50)] flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-[var(--spa-blush-300)]" />
                    </div>
                    <p className="text-sm">
                      {searchTerm ? 'Không tìm thấy hoá đơn phù hợp.' : 'Chưa có hoá đơn nào.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status] ?? { label: invoice.status, className: '' };
                return (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-[var(--spa-warm-50)] transition-colors duration-200"
                    onClick={() => openDetail(invoice)}
                  >
                    <TableCell className="py-4">
                      <span className="font-mono text-sm font-semibold text-[var(--spa-text-primary)]">
                        {invoice.invoiceCode}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-[var(--spa-text-primary)]">
                      {invoice.customerName}
                    </TableCell>
                    <TableCell className="py-4 text-[var(--spa-text-secondary)] hidden md:table-cell">
                      {formatDate(invoice.date)}
                    </TableCell>
                    <TableCell className="py-4 text-[var(--spa-text-secondary)] hidden lg:table-cell">
                      {invoice.staffName || <span className="text-[var(--spa-text-muted)] italic text-xs">Không có</span>}
                    </TableCell>
                    <TableCell className="py-4 hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-medium border', statusConfig.className)}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right font-semibold text-[var(--spa-blush-500)]">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell
                      className="text-right py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          id={`invoice-menu-${invoice.id}`}
                          className="inline-flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-[var(--spa-warm-200)] focus-visible:outline-none transition-colors"
                        >
                          <span className="sr-only">Mở menu</span>
                          <MoreHorizontal className="h-4 w-4 text-[var(--spa-text-secondary)]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem
                            onClick={() => openDetail(invoice)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-[var(--spa-champagne-300)]" />
                            <span>Xem chi tiết</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination 
        currentPage={actualPage}
        totalPages={totalPages}
        totalItems={filteredInvoices.length}
        onPageChange={setCurrentPage}
      />

      {/* Detail Dialog */}
      <InvoiceDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={selectedInvoice}
      />
    </div>
  );
}
