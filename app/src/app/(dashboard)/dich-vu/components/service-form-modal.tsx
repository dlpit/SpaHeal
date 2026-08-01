'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SerializedService, SerializedServiceCategory, createService, updateService } from '@/app/actions/service-actions';

const serviceSchema = z.object({
  code: z.string().min(1, 'Mã dịch vụ không được để trống'),
  name: z.string().min(1, 'Tên dịch vụ không được để trống'),
  price: z.coerce.number().min(0, 'Giá tiền phải lớn hơn hoặc bằng 0'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: SerializedServiceCategory[];
  service: SerializedService | null;
}

export function ServiceFormModal({ isOpen, onClose, categories, service }: ServiceFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      code: '',
      name: '',
      price: 0,
      categoryId: '',
      isActive: true,
    },
  });

  // Reset form when modal opens/closes or service changes
  useState(() => {
    if (isOpen) {
      if (service) {
        reset({
          code: service.code,
          name: service.name,
          price: service.price,
          categoryId: service.categoryId,
          isActive: service.isActive,
        });
      } else {
        reset({
          code: '',
          name: '',
          price: 0,
          categoryId: '',
          isActive: true,
        });
      }
      setError(null);
    }
  });

  const onSubmit = (data: ServiceFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const category = categories.find((c) => c.id === data.categoryId);
        const payload = {
          ...data,
          categoryName: category?.name || '',
          sortOrder: service?.sortOrder || 0,
        };

        if (isEditing && service) {
          const res = await updateService(service.id, payload);
          if (!res.success) {
            setError(res.error || 'Lỗi không xác định');
            return;
          }
        } else {
          const res = await createService(payload);
          if (!res.success) {
            setError(res.error || 'Lỗi không xác định');
            return;
          }
        }
        
        onClose();
      } catch {
        setError('Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    });
  };

  const selectedCategoryId = watch('categoryId');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--spa-warm-50)] border-[var(--spa-border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--spa-text-primary)] font-serif text-xl">
            {isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          </DialogTitle>
          <DialogDescription className="text-[var(--spa-text-secondary)]">
            Điền đầy đủ thông tin dịch vụ bên dưới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-[var(--spa-danger)] bg-red-50 rounded-md border border-[var(--spa-danger)]/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code" className="text-[var(--spa-text-primary)]">Mã dịch vụ</Label>
            <Input
              id="code"
              placeholder="VD: GD01"
              {...register('code')}
              className={errors.code ? 'border-[var(--spa-danger)]' : ''}
              disabled={isEditing} // Không cho đổi mã khi edit (nếu muốn)
            />
            {errors.code && <p className="text-xs text-[var(--spa-danger)]">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[var(--spa-text-primary)]">Tên dịch vụ</Label>
            <Input
              id="name"
              placeholder="VD: Gội đầu thảo dược"
              {...register('name')}
              className={errors.name ? 'border-[var(--spa-danger)]' : ''}
            />
            {errors.name && <p className="text-xs text-[var(--spa-danger)]">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-[var(--spa-text-primary)]">Giá tiền (VND)</Label>
            <Input
              id="price"
              type="number"
              placeholder="0"
              {...register('price')}
              className={errors.price ? 'border-[var(--spa-danger)]' : ''}
            />
            {errors.price && <p className="text-xs text-[var(--spa-danger)]">{errors.price.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-[var(--spa-text-primary)]">Danh mục</Label>
            <Select 
              value={selectedCategoryId} 
              onValueChange={(val) => setValue('categoryId', val || '', { shouldValidate: true })}
            >
              <SelectTrigger className={errors.categoryId ? 'border-[var(--spa-danger)]' : ''}>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-[var(--spa-danger)]">{errors.categoryId.message}</p>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isActive" className="text-[var(--spa-text-primary)] cursor-pointer">
              Trạng thái hoạt động
            </Label>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(val) => setValue('isActive', val)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[var(--spa-border)] text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)]"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white"
            >
              {isPending ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
