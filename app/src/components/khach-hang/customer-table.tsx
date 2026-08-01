'use client';

import { useState, useMemo } from 'react';
import { ClientCustomerDoc } from '@/lib/firestore-types';
import { CustomerFormDialog } from './customer-form-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MoreHorizontal, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface CustomerTableProps {
  customers: ClientCustomerDoc[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ClientCustomerDoc | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(searchLower);
      const matchPhone = c.phone?.includes(searchTerm);
      return matchName || matchPhone;
    });
  }, [customers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const actualPage = Math.min(currentPage, totalPages);
  
  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice((actualPage - 1) * pageSize, actualPage * pageSize);
  }, [filteredCustomers, actualPage, pageSize]);

  const openEdit = (customer: ClientCustomerDoc) => {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  };

  const openCreate = () => {
    setSelectedCustomer(null);
    setSheetOpen(true);
  };

  const getTierBadge = (tier: string) => {
    switch(tier) {
      case 'PLATINUM': return <Badge className="bg-[var(--spa-text-primary)] text-[var(--spa-champagne-300)]">Platinum</Badge>;
      case 'GOLD': return <Badge className="bg-[var(--spa-champagne-300)] text-white">Gold</Badge>;
      case 'SILVER': return <Badge className="bg-[var(--spa-text-secondary)] text-white">Silver</Badge>;
      case 'MEMBER': return <Badge variant="outline" className="bg-gray-50/50">Thành viên</Badge>;
      default: return <Badge variant="outline" className="bg-gray-50/50">Thành viên</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo tên, SĐT..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
          />
        </div>
        <Button onClick={openCreate} className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white">
          <Plus className="mr-2 h-4 w-4" /> Thêm khách hàng
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="h-12 bg-muted/30">
              <TableHead className="font-semibold">Mã KH</TableHead>
              <TableHead className="font-semibold">Khách hàng</TableHead>
              <TableHead className="font-semibold">SĐT</TableHead>
              <TableHead className="font-semibold">Hạng</TableHead>
              <TableHead className="font-semibold">Chi tiêu</TableHead>
              <TableHead className="font-semibold">Lượt đến</TableHead>
              <TableHead className="text-right font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Không tìm thấy khách hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map(customer => (
                <TableRow 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openEdit(customer)}
                >
                  <TableCell className="font-medium py-4">{customer.customerCode || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-medium text-foreground">{customer.fullName}</TableCell>
                  <TableCell className="py-4 text-muted-foreground">{customer.phone}</TableCell>
                  <TableCell className="py-4">{getTierBadge(customer.loyaltyTier)}</TableCell>
                  <TableCell className="py-4">{formatCurrency(customer.totalSpent)}</TableCell>
                  <TableCell className="py-4">{customer.visitCount || 0}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-[var(--spa-warm-50)] focus-visible:outline-none transition-colors">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4 text-[var(--spa-text-secondary)]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => openEdit(customer)} className="cursor-pointer">
                          <Edit2 className="mr-2 h-4 w-4 text-[var(--spa-champagne-300)]" />
                          <span>Sửa / Chi tiết</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination 
        currentPage={actualPage}
        totalPages={totalPages}
        totalItems={filteredCustomers.length}
        onPageChange={setCurrentPage}
      />

      <CustomerFormDialog 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        customer={selectedCustomer} 
      />
    </div>
  );
}
