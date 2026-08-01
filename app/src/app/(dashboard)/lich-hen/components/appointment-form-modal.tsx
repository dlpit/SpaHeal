'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { appointmentSchema, AppointmentFormValues } from '@/lib/schemas/appointment';
import { createAppointment, updateAppointment, ClientAppointmentDoc } from '@/app/actions/appointment-actions';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: ClientAppointmentDoc | null;
  customers: ClientCustomerDoc[];
  selectedDateStr?: string | null; // Pass from calendar date click
}

export function AppointmentFormModal({ isOpen, onClose, appointment, customers, selectedDateStr }: AppointmentFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!appointment;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      date: new Date(),
      startTime: '09:00',
      endTime: '',
      notes: '',
      deposit: 0,
      status: 'CONFIRMED',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        reset({
          customerId: appointment.customerId,
          customerName: appointment.customerName,
          date: new Date(appointment.date),
          startTime: appointment.startTime,
          endTime: appointment.endTime || '',
          notes: appointment.notes || '',
          deposit: appointment.deposit || 0,
          status: appointment.status,
        });
      } else {
        reset({
          customerId: '',
          customerName: '',
          date: selectedDateStr ? new Date(selectedDateStr) : new Date(),
          startTime: '09:00',
          endTime: '',
          notes: '',
          deposit: 0,
          status: 'CONFIRMED',
        });
      }
      setError(null);
    }
  }, [isOpen, appointment, reset, selectedDateStr]);

  const onSubmit = (data: AppointmentFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        if (isEditing && appointment) {
          const res = await updateAppointment(appointment.id, data);
          if (!res.success) {
            setError('Lỗi cập nhật lịch hẹn');
            return;
          }
        } else {
          const res = await createAppointment(data);
          if (!res.success) {
            setError('Lỗi thêm lịch hẹn');
            return;
          }
        }
        
        onClose();
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    });
  };

  const selectedCustomerId = watch('customerId');
  const selectedStatus = watch('status');

  const onCustomerChange = (val: string) => {
    setValue('customerId', val, { shouldValidate: true });
    const c = customers.find(x => x.customerId === val);
    if (c) {
      setValue('customerName', c.fullName, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[var(--spa-warm-50)] border-[var(--spa-border)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--spa-text-primary)] font-serif text-xl">
            {isEditing ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
          </DialogTitle>
          <DialogDescription className="text-[var(--spa-text-secondary)]">
            Điền đầy đủ thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-[var(--spa-danger)] bg-red-50 rounded-md border border-[var(--spa-danger)]/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer" className="text-[var(--spa-text-primary)]">Khách hàng <span className="text-red-500">*</span></Label>
            <Select 
              value={selectedCustomerId} 
              onValueChange={(val) => val && onCustomerChange(val)}
            >
              <SelectTrigger className={errors.customerId ? 'border-[var(--spa-danger)]' : ''}>
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.customerId} value={c.customerId}>
                    {c.fullName} - {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-[var(--spa-danger)]">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[var(--spa-text-primary)]">Ngày hẹn <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-[var(--spa-danger)]' : ''}
              />
              {errors.date && <p className="text-xs text-[var(--spa-danger)]">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-[var(--spa-text-primary)]">Giờ bắt đầu <span className="text-red-500">*</span></Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                className={errors.startTime ? 'border-[var(--spa-danger)]' : ''}
              />
              {errors.startTime && <p className="text-xs text-[var(--spa-danger)]">{errors.startTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-[var(--spa-text-primary)]">Giờ kết thúc (Không bắt buộc)</Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                className={errors.endTime ? 'border-[var(--spa-danger)]' : ''}
              />
              {errors.endTime && <p className="text-xs text-[var(--spa-danger)]">{errors.endTime.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-[var(--spa-text-primary)]">Trạng thái</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                  <SelectItem value="ARRIVED">Đã đến</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="RESCHEDULED">Dời lịch</SelectItem>
                  <SelectItem value="NO_SHOW">Không đến</SelectItem>
                  <SelectItem value="DEPOSIT">Đã đặt cọc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-[var(--spa-text-primary)]">Tiền đặt cọc (VND)</Label>
            <Input
              id="deposit"
              type="number"
              placeholder="0"
              {...register('deposit')}
              className={errors.deposit ? 'border-[var(--spa-danger)]' : ''}
            />
            {errors.deposit && <p className="text-xs text-[var(--spa-danger)]">{errors.deposit.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[var(--spa-text-primary)]">Ghi chú</Label>
            <Input
              id="notes"
              placeholder="Ghi chú về khách hàng hoặc dịch vụ..."
              {...register('notes')}
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
