'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClientAppointmentDoc, cancelAppointment } from '@/app/actions/appointment-actions';
import { AlertCircle } from 'lucide-react';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: (isSuccess?: boolean) => void;
  appointment: ClientAppointmentDoc | null;
}

const PREDEFINED_REASONS = [
  'Khách bận đột xuất',
  'Khách ốm',
  'Thay đổi lịch trình',
  'Spa hủy',
  'Khác...'
];

export function CancelAppointmentModal({
  isOpen,
  onClose,
  appointment,
}: CancelAppointmentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const hasDeposit = appointment && appointment.deposit && appointment.deposit > 0;

  const cancelSchema = z.object({
    reasonType: z.string().min(1, 'Vui lòng chọn lý do hủy'),
    customReason: z.string().optional(),
    depositResolution: z.enum(['REFUNDED', 'CONFISCATED']).optional().nullable(),
  }).refine((data) => {
    if (data.reasonType === 'Khác...' && (!data.customReason || data.customReason.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Vui lòng nhập lý do cụ thể",
    path: ["customReason"]
  }).refine((data) => {
    if (hasDeposit && !data.depositResolution) {
      return false;
    }
    return true;
  }, {
    message: "Vui lòng chọn hướng xử lý cọc",
    path: ["depositResolution"]
  });

  type CancelFormValues = z.infer<typeof cancelSchema>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reasonType: '',
      customReason: '',
      depositResolution: undefined,
    },
  });

  const reasonType = watch('reasonType');

  const onSubmit = (data: CancelFormValues) => {
    if (!appointment) return;
    setError(null);
    startTransition(async () => {
      try {
        const finalReason = data.reasonType === 'Khác...' ? data.customReason! : data.reasonType;
        const res = await cancelAppointment(appointment.id, {
          cancelReason: finalReason,
          depositResolution: data.depositResolution as any,
        });
        if (!res.success) {
          setError('Có lỗi xảy ra khi hủy lịch hẹn.');
          return;
        }
        reset();
        onClose(true);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setError(null);
    }
    onClose(false);
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[var(--spa-warm-50)] border-[var(--spa-border)]">
        <DialogHeader>
          <DialogTitle className="text-red-600 font-serif text-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Hủy lịch hẹn
          </DialogTitle>
          <DialogDescription className="text-[var(--spa-text-secondary)]">
            Bạn đang hủy lịch hẹn của khách hàng <span className="font-semibold">{appointment.customerName}</span>.
            Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-[var(--spa-danger)] bg-red-50 rounded-md border border-[var(--spa-danger)]/20">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-[var(--spa-text-primary)] font-semibold">Lý do hủy <span className="text-red-500">*</span></Label>
            
            <Controller
              control={control}
              name="reasonType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.reasonType ? 'border-[var(--spa-danger)]' : ''}>
                    <SelectValue placeholder="-- Chọn lý do --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_REASONS.map(reason => (
                      <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reasonType && <p className="text-xs text-[var(--spa-danger)]">{errors.reasonType.message}</p>}

            {reasonType === 'Khác...' && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                <Textarea
                  placeholder="Nhập lý do cụ thể..."
                  className={errors.customReason ? 'border-[var(--spa-danger)]' : ''}
                  {...register('customReason')}
                  rows={3}
                />
                {errors.customReason && <p className="text-xs text-[var(--spa-danger)] mt-1">{errors.customReason.message}</p>}
              </div>
            )}
          </div>

          {hasDeposit && (
            <div className="space-y-3 pt-3 border-t border-[var(--spa-border)]">
              <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                <span className="text-amber-800 text-sm">Tiền cọc đã nhận:</span>
                <span className="font-bold text-amber-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.deposit!)}
                </span>
              </div>
              
              <Label className="text-[var(--spa-text-primary)] font-semibold">Hướng xử lý cọc <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="depositResolution"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    className="flex flex-col gap-2 mt-2"
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-white transition-colors">
                      <RadioGroupItem value="REFUNDED" id="refund" />
                      <Label htmlFor="refund" className="cursor-pointer font-medium w-full">Hoàn trả tiền cọc cho khách</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-white transition-colors">
                      <RadioGroupItem value="CONFISCATED" id="confiscate" />
                      <Label htmlFor="confiscate" className="cursor-pointer font-medium w-full">Tịch thu tiền cọc</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.depositResolution && <p className="text-xs text-[var(--spa-danger)]">{errors.depositResolution.message}</p>}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-[var(--spa-border)] text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)]"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? 'Đang xử lý...' : 'Xác nhận Hủy lịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
