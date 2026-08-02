'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { refundInvoiceSchema, RefundInvoiceValues } from '@/lib/schemas/invoice';
import { refundInvoice } from '@/app/actions/invoice';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REFUND_REASONS = [
  'Khách hàng đổi ý',
  'Thu ngân nhập sai dịch vụ',
  'Khách không hài lòng với dịch vụ',
  'Lỗi hệ thống/Trùng bill',
];
const OTHER_REASON = 'Lý do khác...';

interface RefundInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceCode: string;
  onSuccess?: () => void;
}

export function RefundInvoiceModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceCode,
  onSuccess,
}: RefundInvoiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dropdownReason, setDropdownReason] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<RefundInvoiceValues>({
    resolver: zodResolver(refundInvoiceSchema),
    defaultValues: {
      invoiceId: invoiceId,
      cancelReason: '',
    },
  });

  // Keep invoiceId up-to-date when modal is reused
  if (getValues('invoiceId') !== invoiceId) {
    setValue('invoiceId', invoiceId);
  }

  const onSubmit = async (values: RefundInvoiceValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await refundInvoice({
        ...values,
        // TODO: Pass actual user info when Auth is implemented
        cancelledBy: 'System / Admin',
      });

      if (result.success) {
        toast.success(`Đã hoàn tiền hóa đơn ${invoiceCode} thành công.`, {
          icon: <CheckCircle className="h-4 w-4" />
        });
        handleOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Lỗi khi hoàn tiền hóa đơn.');
        setErrorMsg(result.error || 'Lỗi khi hoàn tiền hóa đơn.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
      setErrorMsg('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (isSubmitting) return;
    onOpenChange(val);
    if (!val) {
      reset();
      setDropdownReason('');
      setErrorMsg(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Xác nhận Hoàn tiền Hóa đơn
          </DialogTitle>
          <DialogDescription>
            Bạn đang yêu cầu hoàn tiền cho hóa đơn <strong>{invoiceCode}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 text-red-800 border border-red-200 rounded-md p-3 mt-2">
          <p className="text-sm font-bold">Lưu ý quan trọng:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs mt-1">
            <li>Thao tác này KHÔNG THỂ hoàn tác.</li>
            <li>Hệ thống sẽ <strong>khấu trừ lại điểm thưởng và doanh số</strong> đã tích lũy của khách hàng.</li>
            <li>Một <strong>phiếu chi</strong> dòng tiền âm sẽ tự động được tạo ra để đối soát két.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Lý do hoàn tiền (Bắt buộc) <span className="text-red-500">*</span>
            </label>
            <Select
              value={dropdownReason}
              onValueChange={(val) => {
                if (val == null) return;
                setDropdownReason(val);
                if (val !== OTHER_REASON) {
                  setValue('cancelReason', val, { shouldValidate: true });
                } else {
                  setValue('cancelReason', '', { shouldValidate: true });
                }
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn lý do --" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_REASON}>{OTHER_REASON}</SelectItem>
              </SelectContent>
            </Select>

            {dropdownReason === OTHER_REASON && (
              <div className="transition-all animate-in fade-in slide-in-from-top-2 pt-2">
                <Textarea
                  placeholder="Nhập lý do chi tiết (tối thiểu 5 ký tự)..."
                  className="resize-none h-24"
                  {...register('cancelReason')}
                  disabled={isSubmitting}
                />
              </div>
            )}
            {errors.cancelReason && (
              <p className="text-sm font-medium text-destructive">
                {errors.cancelReason.message}
              </p>
            )}
            {errorMsg && (
              <p className="text-sm font-medium text-destructive">
                {errorMsg}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận Hoàn tiền'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
