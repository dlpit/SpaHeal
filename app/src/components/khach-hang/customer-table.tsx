'use client';

import { useState } from 'react';
import { ClientCustomerDoc } from '@/lib/firestore-types';
import { CustomerFormDialog } from './customer-form-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomerTableProps {
  customers: (ClientCustomerDoc & { id: string })[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<(ClientCustomerDoc & { id: string }) | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openEdit = (customer: ClientCustomerDoc & { id: string }) => {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  };

  const openCreate = () => {
    setSelectedCustomer(null);
    setSheetOpen(true);
  };

  const getTierBadge = (tier: string) => {
    switch(tier) {
      case 'PLATINUM': return <Badge className="bg-slate-800">Platinum</Badge>;
      case 'GOLD': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Gold</Badge>;
      case 'SILVER': return <Badge className="bg-gray-400 hover:bg-gray-500">Silver</Badge>;
      case 'MEMBER': return <Badge variant="outline">Thành viên</Badge>;
      default: return <Badge variant="outline">Thành viên</Badge>;
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
        <Button onClick={openCreate}>
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
                  <TableCell className="font-medium py-4">{customer.customerId || 'N/A'}</TableCell>
                  <TableCell className="py-4 font-medium text-foreground">{customer.fullName}</TableCell>
                  <TableCell className="py-4 text-muted-foreground">{customer.phone}</TableCell>
                  <TableCell className="py-4">{getTierBadge(customer.loyaltyTier)}</TableCell>
                  <TableCell className="py-4">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent || 0)}</TableCell>
                  <TableCell className="py-4">{customer.visitCount || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Trang trước
          </Button>
          <div className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}

      <CustomerFormDialog 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        customer={selectedCustomer} 
      />
    </div>
  );
}
