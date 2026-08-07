'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerCombobox } from '@/components/khach-hang/customer-combobox';
import { CustomerFormDialog } from '@/components/khach-hang/customer-form-dialog';
import { ServiceCombobox } from '@/components/dich-vu/service-combobox';
import { appointmentSchema, AppointmentFormValues, AppointmentFormInput } from '@/lib/schemas/appointment';
import {
  createAppointment,
  updateAppointment,
  ClientAppointmentDoc,
  getStaffForAppointment,
} from '@/app/actions/appointment-actions';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: (isSuccess?: boolean) => void;
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
  const [isDepositFocused, setIsDepositFocused] = useState(false);
  const isCalendarOpenState = useState(false);
  const isCalendarOpen = isCalendarOpenState[0];
  const setIsCalendarOpen = isCalendarOpenState[1];

  const isEditing = !!appointment;
  const isReadOnly = isEditing && (appointment?.status === 'COMPLETED' || appointment?.status === 'CANCELLED');

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
    control,
    formState: { errors },
  } = useForm<AppointmentFormInput, any, AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      services: [],
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

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services",
  });

  const servicesWatch = watch('services') || [];
  const subtotal = servicesWatch.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price || 0)), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

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
        let initialServices: { serviceId: string; serviceName: string; quantity: number; price: number }[] = [];
        if (appointment.services && appointment.services.length > 0) {
          initialServices = appointment.services;
        } else if (appointment.serviceId && appointment.serviceName) {
          initialServices = [{ serviceId: appointment.serviceId, serviceName: appointment.serviceName, quantity: 1, price: 0 }];
        }

        reset({
          customerId: appointment.customerId,
          customerName: appointment.customerName,
          services: initialServices,
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
          services: [],
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
        onClose(true);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    });
  };

  const selectedStatus = watch('status');
  const selectedStaffId = watch('staffId');
  const depositVal = watch('deposit') ?? 0;

  const formatDisplayDeposit = (val: number | null | undefined, isFocused: boolean) => {
    if (val === null || val === undefined || isNaN(val) || val === 0) {
      return isFocused ? '' : '0';
    }
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const onCustomerChange = (val: string) => {
    setValue('customerId', val, { shouldValidate: true });
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
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-[600px] bg-[var(--spa-warm-50)] border-[var(--spa-border)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
          <DialogTitle className="text-[var(--spa-text-primary)] font-serif text-xl">
            {isEditing ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
          </DialogTitle>
          <DialogDescription className="text-[var(--spa-text-secondary)]">
            Điền đầy đủ thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {isReadOnly && (
            <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-md border border-amber-200 mb-2 flex items-start">
              <div className="mr-2 mt-0.5 shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Lịch hẹn đã kết thúc / sinh hóa đơn. Dữ liệu bị khóa để bảo đảm toàn vẹn hệ thống (chỉ có thể cập nhật Ghi chú).</span>
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-[var(--spa-danger)] bg-red-50 rounded-md border border-[var(--spa-danger)]/20">
              {error}
            </div>
          )}

          {/* Khách hàng */}
          <div className="space-y-2">
            <Label className="text-[var(--spa-text-primary)]">Khách hàng <span className="text-red-500">*</span></Label>
            <CustomerCombobox
              value={watch('customerId')}
              initialCustomers={customers}
              error={!!errors.customerId}
              disabled={isReadOnly}
              onValueChange={(val) => onCustomerChange(val)}
              onCustomerSelected={(c) => setValue('customerName', c.fullName, { shouldValidate: true })}
              onAddNew={() => setIsCustomerModalOpen(true)}
            />
            {errors.customerId && <p className="text-xs text-[var(--spa-danger)]">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--spa-text-primary)]">Kỹ thuật viên</Label>
            <Select
              value={selectedStaffId || '__none__'}
              onValueChange={(val: string | null) => onStaffChange(val || '__none__')}
              disabled={isReadOnly}
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

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[var(--spa-text-primary)]">Dịch vụ</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => appendService({ serviceId: '', serviceName: '', quantity: 1, price: 0 })} disabled={isReadOnly}>
                <Plus className="size-4 mr-2" /> Thêm dịch vụ
              </Button>
            </div>
            
            {(() => {
              const watchedServices = watch('services') || [];
              const selectedAppointmentServiceIds = watchedServices.map((s: any) => s.serviceId).filter(Boolean);
              return serviceFields.map((field, index) => {
                const currentSvcId = watch(`services.${index}.serviceId`);
                const excludedServiceIds = selectedAppointmentServiceIds.filter((id: string) => id !== currentSvcId);
                return (
                  <div key={field.id} className="grid grid-cols-[1fr_6rem_7rem_auto] items-center gap-2 bg-[var(--spa-warm-100)] p-2 rounded-md">
                    <div className="min-w-0 space-y-1">
                      <ServiceCombobox
                        value={currentSvcId}
                        excludedServiceIds={excludedServiceIds}
                        initialServices={
                          currentSvcId && watch(`services.${index}.serviceName`)
                            ? [{ id: currentSvcId, name: watch(`services.${index}.serviceName`)!, code: '', price: watch(`services.${index}.price`)! }]
                            : []
                        }
                        disabled={isReadOnly}
                        onValueChange={(val) => {
                          if (val === '__none__') {
                            setValue(`services.${index}.serviceId`, '');
                            setValue(`services.${index}.serviceName`, '');
                            setValue(`services.${index}.price`, 0);
                          } else {
                            setValue(`services.${index}.serviceId`, val, { shouldValidate: true });
                          }
                        }}
                        onServiceSelected={(s) => {
                          setValue(`services.${index}.serviceName`, s.name, { shouldValidate: true });
                          setValue(`services.${index}.price`, s.price, { shouldValidate: true });
                        }}
                      />
                      {errors.services?.[index]?.serviceId && <p className="text-xs text-[var(--spa-danger)]">{errors.services[index].serviceId?.message}</p>}
                    </div>
                    
                    <div className="space-y-1">
                      <Input 
                        type="number" 
                        min={1} 
                        {...register(`services.${index}.quantity`, { valueAsNumber: true })} 
                        className={cn(errors.services?.[index]?.quantity ? 'border-[var(--spa-danger)]' : '', isReadOnly && 'opacity-50 pointer-events-none')}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                    </div>
                    
                    <div className="pt-2 text-right">
                      <span className="text-sm font-medium text-[var(--spa-text-primary)]">
                        {formatCurrency((watch(`services.${index}.quantity`) || 0) * (watch(`services.${index}.price`) || 0))}
                      </span>
                    </div>
                    
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => removeService(index)} disabled={isReadOnly}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              });
            })()}
            
            <div className="flex justify-between items-center py-2 px-3 border-t border-[var(--spa-border)] mt-2">
              <span className="font-medium text-[var(--spa-text-primary)]">Tổng tạm tính:</span>
              <span className="font-bold text-lg text-[var(--spa-primary)]">{formatCurrency(subtotal)}</span>
            </div>
            {errors.services?.root && <p className="text-xs text-[var(--spa-danger)]">{errors.services.root.message}</p>}
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
                      disabled={isReadOnly}
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
                    ? format(parse(watch('date') as unknown as string, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy") 
                    : <span>Chọn ngày</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]">
                  <Calendar
                    mode="single"
                    selected={watch('date') ? parse(watch('date') as unknown as string, 'yyyy-MM-dd', new Date()) : undefined}
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
                className={cn(errors.startTime ? 'border-[var(--spa-danger)]' : '', isReadOnly && 'opacity-50 pointer-events-none')}
                readOnly={isReadOnly}
                disabled={isReadOnly}
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
                className={isReadOnly ? 'opacity-50 pointer-events-none' : ''}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--spa-text-primary)]">Trạng thái</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
                disabled={isEditing || isReadOnly} // Disable completely on edit, force users to use quick actions
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
                  {!isEditing ? (
                    <>
                      <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                      <SelectItem value="DEPOSIT">Đã đặt cọc</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                      <SelectItem value="ARRIVED">Đã đến</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      <SelectItem value="RESCHEDULED">Dời lịch</SelectItem>
                      <SelectItem value="NO_SHOW">Không đến</SelectItem>
                      <SelectItem value="DEPOSIT">Đã đặt cọc</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tiền đặt cọc */}
          <div className="space-y-1.5">
            <Label className="text-[var(--spa-text-primary)] font-medium">Tiền đặt cọc</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                maxLength={15}
                value={formatDisplayDeposit(depositVal, isDepositFocused)}
                onFocus={() => setIsDepositFocused(true)}
                onBlur={() => setIsDepositFocused(false)}
                aria-invalid={!!errors.deposit}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                  const num = raw === '' ? 0 : parseInt(raw, 10);
                  setValue('deposit', num, { shouldValidate: true });
                }}
                className={cn(
                  "pr-8 font-semibold text-[var(--spa-text-primary)]",
                  errors.deposit ? 'border-[var(--spa-danger)]' : '',
                  isReadOnly && 'opacity-50 pointer-events-none'
                )}
                readOnly={isReadOnly}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                đ
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground mr-1">Chọn nhanh:</span>
              {[
                { label: '50k', value: 50000 },
                { label: '100k', value: 100000 },
                { label: '200k', value: 200000 },
                { label: '500k', value: 500000 },
              ].map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isReadOnly}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium border-[var(--spa-border)] hover:bg-[var(--spa-warm-100)] hover:text-[var(--spa-primary)] transition-colors",
                    depositVal === preset.value && "bg-[var(--spa-warm-200)] border-[var(--spa-primary)] text-[var(--spa-primary)] font-semibold"
                  )}
                  onClick={() => setValue('deposit', preset.value, { shouldValidate: true })}
                >
                  {preset.label}
                </Button>
              ))}
              {depositVal > 0 && !isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setValue('deposit', 0, { shouldValidate: true })}
                >
                  Xóa cọc
                </Button>
              )}
            </div>

            {errors.deposit && (
              <p className="text-xs text-[var(--spa-danger)]">{errors.deposit.message}</p>
            )}
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
              onClick={() => onClose()}
              className="border-[var(--spa-border)] text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white"
            >
              {isPending ? 'Đang lưu...' : isReadOnly ? 'Cập nhật Ghi chú' : isEditing ? 'Cập nhật' : 'Thêm mới'}
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
