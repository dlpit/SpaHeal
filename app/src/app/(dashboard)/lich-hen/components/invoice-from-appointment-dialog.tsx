'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus, AlertCircle } from 'lucide-react';
import { ClientAppointmentDoc } from '@/app/actions/appointment-actions';
import { getInvoiceFormOptions } from '@/app/actions/invoice';
import { createInvoice } from '@/app/actions/invoice';
import { InvoiceFormValues } from '@/lib/schemas/invoice';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface InvoiceFromAppointmentDialogProps {
  isOpen: boolean;
  onClose: (isSuccess?: boolean) => void;
  appointment: ClientAppointmentDoc;
}

type FormOptions = {
  customers: { id: string; fullName: string; phone: string | null }[];
  services: { id: string; code: string; name: string; price: number; categoryId: string | null }[];
  staff: { id: string; fullName: string; code: string }[];
  paymentMethods: { id: string; name: string; code: string }[];
  paymentAccounts: { id: string; bankName: string; code: string }[];
};

/**
 * Dialog tạo hóa đơn trực tiếp từ một lịch hẹn.
 * Tự động pre-fill: khách hàng, dịch vụ, kỹ thuật viên, ngày.
 * Sau khi thanh toán, lịch hẹn sẽ tự động chuyển sang trạng thái COMPLETED.
 */
export function InvoiceFromAppointmentDialog({
  isOpen,
  onClose,
  appointment,
}: InvoiceFromAppointmentDialogProps) {
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch form options khi dialog mở
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setFetchError(null);
    getInvoiceFormOptions().then((result) => {
      if (result.success && result.data) {
        setOptions(result.data as FormOptions);
      } else {
        setFetchError(result.error || 'Không thể tải dữ liệu');
      }
      setIsLoading(false);
    });
  }, [isOpen]);

  // Pre-fill values từ lịch hẹn
  const prefillValues: Partial<InvoiceFormValues> = {
    appointmentId: appointment.id,
    customerId: appointment.customerId,
    staffId: appointment.staffId || undefined,
    date: new Date(appointment.date),
    notes: appointment.notes || '',
    ...(appointment.services && appointment.services.length > 0
      ? {
          items: appointment.services.map((s) => ({
            serviceId: s.serviceId,
            quantity: s.quantity || 1,
            unitPrice: s.price || 0,
          })),
        }
      : appointment.serviceId
      ? {
          items: [
            {
              serviceId: appointment.serviceId,
              quantity: 1,
              unitPrice: 0,
            },
          ],
        }
      : {}),
  };

  // Prepare service display text to avoid long wrapping lines
  let servicesDisplay = null;
  let fullServicesText = '';
  if (appointment.services && appointment.services.length > 0) {
    fullServicesText = appointment.services.map((s) => s.serviceName).join(', ');
    if (appointment.services.length <= 2) {
      servicesDisplay = fullServicesText;
    } else {
      const firstTwo = appointment.services.slice(0, 2).map((s) => s.serviceName).join(', ');
      servicesDisplay = `${firstTwo} và ${appointment.services.length - 2} dịch vụ khác`;
    }
  } else if (appointment.serviceName) {
    fullServicesText = appointment.serviceName;
    servicesDisplay = appointment.serviceName;
  }

  const initialServices = appointment.services && appointment.services.length > 0
    ? appointment.services.map((s) => ({ id: s.serviceId, name: s.serviceName, price: s.price || 0, code: '' }))
    : appointment.serviceId
    ? [{ id: appointment.serviceId, name: appointment.serviceName || '', price: 0, code: '' }]
    : [];

  const initialCustomers = [
    { 
      id: appointment.customerId, 
      fullName: appointment.customerName || 'Khách hàng', 
      phone: null,
      totalSpent: 0,
      visitCount: 0,
      loyaltyTier: 'BRONZE' as const,
      createdAt: { seconds: 0, nanoseconds: 0 } as any
    } as unknown as ClientCustomerDoc
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Tạo Hóa Đơn</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground flex flex-col gap-1">
            <span>Từ lịch hẹn: <strong>{format(new Date(appointment.date), "dd/MM/yyyy HH:mm", { locale: vi })}</strong></span>
            <span>Khách hàng: <strong>{appointment.customerName}</strong></span>
            <span>Dịch vụ: <strong>{servicesDisplay || "Chưa chọn dịch vụ"}</strong></span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 pt-2 bg-muted/10 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu biểu mẫu...</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-red-500 mb-4">{fetchError}</p>
              <Button variant="outline" onClick={() => onClose(false)}>Đóng</Button>
            </div>
          ) : options ? (
            <InvoiceForm 
              options={options} 
              prefillValues={prefillValues}
              initialCustomers={initialCustomers}
              initialServices={initialServices}
              isDialog={true}
              onSuccess={() => {
                onClose(true);
                router.refresh();
              }}
              onCancel={() => onClose(false)}
              onSuccessRedirect={false}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
