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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerCombobox } from '@/components/khach-hang/customer-combobox';
import { CustomerFormDialog } from '@/components/khach-hang/customer-form-dialog';
import { ServiceCombobox } from '@/components/dich-vu/service-combobox';
import { appointmentSchema, AppointmentFormValues } from '@/lib/schemas/appointment';
import {
  createAppointment,
  updateAppointment,
  ClientAppointmentDoc,
  getStaffForAppointment,
} from '@/app/actions/appointment-actions';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: ClientAppointmentDoc | null;
  customers: ClientCustomerDoc[];
  selectedDateStr?: string | null;
}

type ServiceOption = { id: string; name: string; price: number; code: string };
type StaffOption = { id: string; fullName: string; code: string };

export function AppointmentFormModal({
  isOpen,
  onClose,
  appointment,
  customers,
  selectedDateStr,
}: AppointmentFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isEditing = !!appointment;

  const formatDateForInput = (d: Date | string) => {
    const dateObj = new Date(d);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

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
      serviceId: null,
      serviceName: null,
      staffId: null,
      staffName: null,
      date: formatDateForInput(new Date()) as any,
      startTime: '09:00',
      endTime: '',
      notes: '',
      deposit: 0,
      status: 'CONFIRMED',
    },
  });

  // Fetch staff khi modal mở lần đầu
  useEffect(() => {
    if (isOpen && staffList.length === 0) {
      getStaffForAppointment().then((stfList) => {
        setStaffList(stfList);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        reset({
          customerId: appointment.customerId,
          customerName: appointment.customerName,
          serviceId: appointment.serviceId || null,
          serviceName: appointment.serviceName || null,
          staffId: appointment.staffId || null,
          staffName: appointment.staffName || null,
          date: formatDateForInput(appointment.date) as any,
          startTime: appointment.startTime,
          endTime: appointment.endTime || '',
          notes: appointment.notes || '',
          deposit: appointment.deposit || 0,
          status: appointment.status,
        });
      } else {
        const now = new Date();
        let initialDate = formatDateForInput(now);
        let initialStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (selectedDateStr) {
          if (selectedDateStr.includes('T')) {
            // Clicked on a time slot in TimeGrid (e.g. 2024-05-15T14:30:00+07:00)
            const d = new Date(selectedDateStr);
            initialDate = formatDateForInput(d);
            initialStartTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          } else {
            // Clicked on DayGrid without specific time (e.g. 2024-05-15)
            // Lấy nguyên chuỗi ngày (YYYY-MM-DD) để tránh lỗi parse UTC bị lùi 1 ngày ở một số timezone
            initialDate = selectedDateStr;
          }
        }

        reset({
          customerId: '',
          customerName: '',
          serviceId: null,
          serviceName: null,
          staffId: null,
          staffName: null,
          date: initialDate as any,
          startTime: initialStartTime,
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
  const selectedServiceId = watch('serviceId');
  const selectedStaffId = watch('staffId');

  const onCustomerChange = (val: string) => {
    setValue('customerId', val, { shouldValidate: true });
    // Dữ liệu 'c' sẽ được set thông qua onCustomerSelected của Combobox
    // để đảm bảo luôn lấy được data kể cả khi khách hàng load động từ API.
  };

  const onServiceChange = (val: string) => {
    if (val === '__none__') {
      setValue('serviceId', null);
      setValue('serviceName', null);
      return;
    }
    setValue('serviceId', val, { shouldValidate: true });
    // Dữ liệu serviceName sẽ được set qua onServiceSelected của Combobox
  };

  const onStaffChange = (val: string) => {
    if (val === '__none__') {
      setValue('staffId', null);
      setValue('staffName', null);
      return;
    }
    setValue('staffId', val, { shouldValidate: true });
    const stf = staffList.find(s => s.id === val);
    if (stf) setValue('staffName', stf.fullName, { shouldValidate: true });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[520px] bg-[var(--spa-warm-50)] border-[var(--spa-border)] max-h-[90vh] overflow-y-auto">
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

          {/* Khách hàng */}
          <div className="space-y-2">
            <Label className="text-[var(--spa-text-primary)]">Khách hàng <span className="text-red-500">*</span></Label>
            <CustomerCombobox
              value={selectedCustomerId}
              initialCustomers={customers}
              error={!!errors.customerId}
              onValueChange={(val) => onCustomerChange(val)}
              onCustomerSelected={(c) => setValue('customerName', c.fullName, { shouldValidate: true })}
              onAddNew={() => setIsCustomerModalOpen(true)}
            />
            {errors.customerId && <p className="text-xs text-[var(--spa-danger)]">{errors.customerId.message}</p>}
          </div>

          {/* Dịch vụ & Kỹ thuật viên */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Dịch vụ</Label>
              <ServiceCombobox
                value={selectedServiceId}
                initialServices={
                  selectedServiceId && watch('serviceName')
                    ? [{ id: selectedServiceId, name: watch('serviceName') as string, code: '', price: 0 }]
                    : []
                }
                onValueChange={(val) => onServiceChange(val)}
                onServiceSelected={(s) => setValue('serviceName', s.name, { shouldValidate: true })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Kỹ thuật viên</Label>
              <Select
                value={selectedStaffId || '__none__'}
                onValueChange={(val: string | null) => onStaffChange(val || '__none__')}
              >
                <SelectTrigger>
                  <span data-slot="select-value" className={`flex flex-1 text-left truncate ${!selectedStaffId ? 'text-muted-foreground' : ''}`}>
                    {(() => {
                      if (!selectedStaffId) return "— Chưa chọn —";
                      const s = staffList.find(x => x.id === selectedStaffId);
                      return s ? `${s.code} - ${s.fullName}` : "— Chưa chọn —";
                    })()}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chưa chọn —</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ngày & Giờ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Ngày hẹn <span className="text-red-500">*</span></Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[var(--spa-border)]",
                        !watch('date') && "text-muted-foreground",
                        errors.date && "border-[var(--spa-danger)]"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('date') 
                    ? format(parse(watch('date') as string, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy") 
                    : <span>Chọn ngày</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]">
                  <Calendar
                    mode="single"
                    selected={watch('date') ? parse(watch('date') as string, 'yyyy-MM-dd', new Date()) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue('date', format(date, 'yyyy-MM-dd') as any, { shouldValidate: true });
                      }
                      setIsCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-[var(--spa-danger)]">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Giờ bắt đầu <span className="text-red-500">*</span></Label>
              <Input
                type="time"
                {...register('startTime')}
                className={errors.startTime ? 'border-[var(--spa-danger)]' : ''}
              />
              {errors.startTime && <p className="text-xs text-[var(--spa-danger)]">{errors.startTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Giờ kết thúc</Label>
              <Input
                type="time"
                {...register('endTime')}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Trạng thái</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <span data-slot="select-value" className="flex flex-1 text-left truncate">
                    {{
                      CONFIRMED: 'Đã xác nhận',
                      ARRIVED: 'Đã đến',
                      IN_PROGRESS: 'Đang làm',
                      COMPLETED: 'Hoàn thành',
                      CANCELLED: 'Đã hủy',
                      RESCHEDULED: 'Dời lịch',
                      NO_SHOW: 'Không đến',
                      DEPOSIT: 'Đã đặt cọc',
                    }[selectedStatus] || "Trạng thái"}
                  </span>
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
            <Label className="text-[var(--spa-text-primary)]">Tiền đặt cọc (VND)</Label>
            <Input
              type="number"
              placeholder="0"
              {...register('deposit', { valueAsNumber: true })}
              className={errors.deposit ? 'border-[var(--spa-danger)]' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--spa-text-primary)]">Ghi chú</Label>
            <Input
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
              {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      <CustomerFormDialog
        open={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          // If closing and we need to refresh list, we could trigger a re-render
          // or rely on server action revalidating path and React fetching fresh data,
          // but for now the user can just search their new name.
        }}
        customer={null}
      />
    </>
  );
}
