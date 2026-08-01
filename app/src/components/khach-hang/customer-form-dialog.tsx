'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClientCustomerDoc } from '@/lib/firestore-types';
import { CustomerForm } from './customer-form';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: ClientCustomerDoc | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden">
        <div className="bg-muted/30 px-6 py-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {customer ? 'Chỉnh sửa hồ sơ Khách hàng' : 'Thêm Khách hàng mới'}
            </DialogTitle>
            <DialogDescription>
              {customer 
                ? 'Cập nhật thông tin và hồ sơ y tế của khách hàng.'
                : 'Điền thông tin bên dưới để tạo hồ sơ khách hàng mới vào hệ thống.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          <CustomerForm 
            key={customer?.id || 'new'} 
            initialData={customer || undefined} 
            onSuccess={() => onOpenChange(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
