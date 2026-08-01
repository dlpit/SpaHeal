'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Search, Plus, Edit2, Power, PowerOff } from 'lucide-react';
import { SerializedService, SerializedServiceCategory, toggleServiceStatus } from '@/app/actions/service-actions';
import { ServiceFormModal } from './service-form-modal';
import { formatCurrency } from '@/lib/format';
import { useTransition } from 'react';

interface ServiceTableProps {
  initialServices: SerializedService[];
  categories: SerializedServiceCategory[];
}

export function ServiceTable({ initialServices, categories }: ServiceTableProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // For modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SerializedService | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [isPending, startTransition] = useTransition();

  // Lọc danh sách
  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      const searchLower = search.toLowerCase();
      const matchSearch = 
        service.name?.toLowerCase().includes(searchLower) || 
        service.code?.toLowerCase().includes(searchLower);
      
      const matchCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
      
      return matchSearch && matchCategory;
    });
  }, [initialServices, search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const paginatedServices = useMemo(() => {
    return filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredServices, currentPage, pageSize]);

  const handleEdit = (service: SerializedService) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Thanh công cụ: Tìm kiếm & Lọc & Thêm mới */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--spa-text-muted)]" />
            <Input
              placeholder="Tìm tên hoặc mã dịch vụ..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select value={selectedCategory} onValueChange={(val) => {
            setSelectedCategory(val || 'all');
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddNew} className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white">
          <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ
        </Button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="rounded-md border border-[var(--spa-border)] overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--spa-warm-50)]">
            <TableRow>
              <TableHead className="w-[100px]">Mã DV</TableHead>
              <TableHead>Tên dịch vụ</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">Giá tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[var(--spa-text-muted)]">
                  Không tìm thấy dịch vụ nào.
                </TableCell>
              </TableRow>
            ) : (
              paginatedServices.map((service) => (
                <TableRow 
                  key={service.id}
                  className="cursor-pointer hover:bg-[var(--spa-warm-50)] transition-colors"
                  onClick={() => handleEdit(service)}
                >
                  <TableCell className="font-medium">{service.code}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[var(--spa-blush-100)] text-[var(--spa-text-primary)]">
                      {service.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(service.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {service.isActive ? (
                      <Badge variant="outline" className="border-[var(--spa-success)] text-[var(--spa-success)] bg-green-50/50">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-[var(--spa-text-muted)] text-[var(--spa-text-muted)] bg-gray-50/50">
                        Đã ẩn
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-[var(--spa-warm-50)] focus-visible:outline-none transition-colors">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4 text-[var(--spa-text-secondary)]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => handleEdit(service)} className="cursor-pointer">
                          <Edit2 className="mr-2 h-4 w-4 text-[var(--spa-champagne-300)]" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await toggleServiceStatus(service.id, service.isActive);
                            });
                          }}
                        >
                          {service.isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4 text-[var(--spa-danger)]" />
                              <span className="text-[var(--spa-danger)]">Ẩn dịch vụ</span>
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4 text-[var(--spa-success)]" />
                              <span className="text-[var(--spa-success)]">Bật dịch vụ</span>
                            </>
                          )}
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
          <div className="text-sm text-[var(--spa-text-muted)]">
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

      <ServiceFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categories={categories}
        service={editingService}
      />
    </div>
  );
}
