'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormValues, CustomerFormInput } from '@/lib/schemas/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useTransition } from 'react';
import { createCustomer, updateCustomer } from '@/app/actions/customer';
import { Loader2, User, Phone, Mail, Calendar, MapPin, Activity, Stethoscope } from 'lucide-react';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface CustomerFormProps {
  initialData?: ClientCustomerDoc & { id: string };
  onSuccess?: () => void;
}

export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CustomerFormInput, any, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      gender: initialData?.gender || undefined,
      birthday: initialData?.birthday ? new Date(initialData.birthday) : undefined,
      skinCondition: initialData?.skinCondition || '',
      medicalNotes: initialData?.medicalNotes || '',
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        if (initialData) {
          await updateCustomer(initialData.id, data);
        } else {
          await createCustomer(data);
        }
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || 'Đã có lỗi xảy ra');
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>}
      
      {/* Thông tin cơ bản */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 border-b pb-2">
          <User className="w-4 h-4" />
          Thông tin cá nhân
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên <span className="text-red-500">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" className="pl-9" placeholder="Nguyễn Văn A" {...form.register('fullName')} />
            </div>
            {form.formState.errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="phone" className="pl-9" placeholder="0901234567" {...form.register('phone')} />
            </div>
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" className="pl-9" placeholder="example@email.com" {...form.register('email')} />
            </div>
            {form.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthday">Ngày sinh</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="birthday" 
                type="date" 
                className="pl-9"
                {...form.register('birthday')} 
                defaultValue={initialData?.birthday ? new Date(initialData.birthday).toISOString().split('T')[0] : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="address" className="pl-9" placeholder="Số nhà, đường, quận..." {...form.register('address')} />
            </div>
          </div>
        </div>
      </div>

      {/* Hồ sơ Y tế */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200 pb-2">
          <Stethoscope className="w-4 h-4" />
          Hồ sơ y tế & Da liễu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skinCondition" className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" /> Tình trạng da
            </Label>
            <Textarea 
              id="skinCondition" 
              className="resize-none h-24"
              {...form.register('skinCondition')} 
              placeholder="VD: Da dầu mụn, nhạy cảm với cồn..." 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalNotes" className="flex items-center gap-2 text-amber-700">
              <Stethoscope className="w-4 h-4" /> Ghi chú y tế (Nhạy cảm)
            </Label>
            <Textarea 
              id="medicalNotes" 
              className="resize-none h-24 border-amber-300 focus-visible:ring-amber-500 bg-amber-50/30"
              {...form.register('medicalNotes')} 
              placeholder="VD: Dị ứng thuốc tê, tiền sử hen suyễn..." 
            />
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={isPending} className="px-8 shadow-md">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {initialData ? 'Lưu cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
