'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[1100px] max-h-[95vh] overflow-y-auto bg-background">
        <DialogHeader className="bg-background px-6 py-4 border-b -mx-4 -mt-4 mb-2 rounded-t-xl sticky top-[-16px] z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--spa-blush-100)] rounded-lg">
              <FilePlus className="w-5 h-5 text-[var(--spa-blush-400)]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Tạo hóa đơn từ lịch hẹn
              </DialogTitle>
              <DialogDescription 
                className="text-sm text-muted-foreground line-clamp-1"
                title={fullServicesText ? `Khách hàng: ${appointment.customerName} · Dịch vụ: ${fullServicesText}` : undefined}
              >
                Khách hàng: <strong>{appointment.customerName}</strong>
                {servicesDisplay && (
                  <> · Dịch vụ: <strong>{servicesDisplay}</strong></>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        )}

        {fetchError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{fetchError}</p>
          </div>
        )}

        {options && !isLoading && (
          <InvoiceForm
            options={options}
            prefillValues={prefillValues}
            onSuccessRedirect={false}
            isDialog={true}
            onCancel={() => onClose(false)}
            onSuccess={() => {
              onClose(true);
              router.refresh();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
