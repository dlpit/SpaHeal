"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { invoiceFormSchema, InvoiceFormValues } from "@/lib/schemas/invoice";
import { createInvoice } from "@/app/actions/invoice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FormOptions {
  customers: { id: string; fullName: string; phone: string | null }[];
  services: { id: string; code: string; name: string; price: number; categoryId: string | null }[];
  staff: { id: string; fullName: string; code: string }[];
  paymentMethods: { id: string; name: string; code: string }[];
  paymentAccounts: { id: string; bankName: string; code: string }[];
}

interface InvoiceFormProps {
  options: FormOptions;
  /** Giá trị pre-fill từ lịch hẹn — dùng khi tạo hóa đơn từ InvoiceFromAppointmentDialog */
  prefillValues?: Partial<InvoiceFormValues>;
  /** Lựa chọn có chuyển hướng sau khi thành công không */
  onSuccessRedirect?: boolean;
  /** Callback tùy chọn sau khi tạo hóa đơn thành công */
  onSuccess?: () => void;
  /** Trạng thái hiển thị trong Dialog (tránh lỗi sticky footer) */
  isDialog?: boolean;
  /** Callback khi nhấn Hủy */
  onCancel?: () => void;
}

export function InvoiceForm({
  options,
  prefillValues,
  onSuccessRedirect = true,
  onSuccess,
  isDialog = false,
  onCancel,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      date: new Date(),
      discount: 0,
      surcharge: 0,
      items: [{ serviceId: "", quantity: 1, unitPrice: 0 }],
      customerId: "",
      staffId: "",
      paymentMethodId: "",
      paymentAccountId: "",
      notes: "",
      appointmentId: null,
      // Merge prefillValues nếu có
      ...prefillValues,
    }
  });

  // Nếu có prefillValues.items với serviceId → auto-fill unitPrice từ options
  useEffect(() => {
    if (prefillValues?.items?.length && options.services.length) {
      prefillValues.items.forEach((item, idx) => {
        if (item.serviceId && item.unitPrice === 0) {
          const svc = options.services.find(s => s.id === item.serviceId);
          if (svc) form.setValue(`items.${idx}.unitPrice`, svc.price);
        }
      });
    }
  }, [options.services, prefillValues, form]);

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  // Watch values for calculation
  const items = form.watch("items");
  const discount = form.watch("discount") || 0;
  const surcharge = form.watch("surcharge") || 0;

  const customerMap = useMemo(() => new Map(options.customers.map(c => [c.id, c])), [options.customers]);
  const serviceMap = useMemo(() => new Map(options.services.map(s => [s.id, s])), [options.services]);
  const staffMap = useMemo(() => new Map(options.staff.map(s => [s.id, s])), [options.staff]);
  const paymentMethodMap = useMemo(() => new Map(options.paymentMethods.map(m => [m.id, m])), [options.paymentMethods]);
  const paymentAccountMap = useMemo(() => new Map(options.paymentAccounts.map(a => [a.id, a])), [options.paymentAccounts]);

  const subTotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  const totalAmount = Math.max(0, subTotal - discount + surcharge);

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createInvoice(data);
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else if (onSuccessRedirect) {
          router.push('/doanh-thu');
        }
      } else {
        setError(result.error || "Đã xảy ra lỗi");
      }
    } catch (err) {
      setError("Lỗi hệ thống");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", !isDialog && "pb-24")}>
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Ngày lập <span className="text-red-500">*</span></Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !form.watch("date") && "text-muted-foreground")}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("date") ? format(form.watch("date"), "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("date")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("date", date);
                          setIsCalendarOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.date && (
                  <p className="text-xs text-red-500">{form.formState.errors.date.message}</p>
                )}
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label>Khách hàng <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => form.setValue("customerId", val || "")} value={form.watch("customerId")}>
                  <SelectTrigger className={cn("w-full", form.formState.errors.customerId && "border-red-500")}>
                    <SelectValue placeholder="Chọn khách hàng">
                      {(val: string | null) => {
                        const c = customerMap.get(val || "");
                        return c ? `${c.fullName}${c.phone ? ` - ${c.phone}` : ""}` : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {options.customers.map((c) => (
                      <SelectItem 
                        key={c.id} 
                        value={c.id}
                        label={`${c.fullName}${c.phone ? ` - ${c.phone}` : ""}`}
                      >
                        {c.fullName} {c.phone && `- ${c.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.customerId && (
                  <p className="text-xs text-red-500">{form.formState.errors.customerId.message}</p>
                )}
              </div>

              {/* Staff */}
              <div className="space-y-2">
                <Label>Nhân viên thực hiện</Label>
                <Select 
                  onValueChange={(val) => form.setValue("staffId", val === "none" ? undefined : (val || undefined))} 
                  value={form.watch("staffId") || "none"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn nhân viên">
                      {(val: string | null) => {
                        if (val === "none") return "Không có";
                        const s = staffMap.get(val || "");
                        return s ? `${s.code} - ${s.fullName}` : null;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" label="Không có">Không có</SelectItem>
                    {options.staff.map((s) => (
                      <SelectItem 
                        key={s.id} 
                        value={s.id}
                        label={`${s.code} - ${s.fullName}`}
                      >
                        {s.code} - {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hình thức T.Toán</Label>
                  <Select onValueChange={(val) => form.setValue("paymentMethodId", val || undefined)} value={form.watch("paymentMethodId") || ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn PTTT">
                        {(val: string | null) => {
                          const m = paymentMethodMap.get(val || "");
                          return m ? m.name : null;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {options.paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id} label={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tài khoản nhận</Label>
                  <Select onValueChange={(val) => form.setValue("paymentAccountId", val || undefined)} value={form.watch("paymentAccountId") || ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn TK">
                        {(val: string | null) => {
                          const a = paymentAccountMap.get(val || "");
                          return a ? a.bankName : null;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {options.paymentAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} label={a.bankName}>{a.bankName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea 
                  id="notes"
                  placeholder="Ghi chú thêm..." 
                  {...form.register("notes")}
                  className="resize-none h-20"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Services & Total */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Chi tiết dịch vụ</CardTitle>
                <CardDescription>Thêm các dịch vụ khách hàng sử dụng</CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ serviceId: "", quantity: 1, unitPrice: 0 })}
                className="text-primary border-primary/20 hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm dịch vụ
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                  Chưa có dịch vụ nào được chọn
                </div>
              )}
              
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const error = form.formState.errors.items?.[index];
                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-4 items-start bg-background p-4 rounded-xl border border-muted shadow-sm relative group">
                      
                      {/* Service Select */}
                      <div className="col-span-12 sm:col-span-6 space-y-1">
                        <Label className="text-xs text-muted-foreground">Tên dịch vụ <span className="text-red-500">*</span></Label>
                        <Select 
                          value={form.watch(`items.${index}.serviceId`)}
                          onValueChange={(val) => {
                            form.setValue(`items.${index}.serviceId`, val || "");
                            // Auto fill price
                            const service = serviceMap.get(val || "");
                            if (service) {
                              form.setValue(`items.${index}.unitPrice`, service.price);
                            }
                          }}
                        >
                          <SelectTrigger className={cn("w-full", error?.serviceId && "border-red-500")}>
                            <SelectValue placeholder="Chọn dịch vụ">
                              {(val: string | null) => {
                                const svc = serviceMap.get(val || "");
                                return svc ? svc.name : null;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {options.services.map((s) => (
                              <SelectItem key={s.id} value={s.id} label={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">SL</Label>
                        <Input 
                          type="number" 
                          min="1"
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-8 sm:col-span-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Đơn giá</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            min="0"
                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="pr-8 text-right font-medium"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-12 sm:col-span-1 pt-6 text-right sm:text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                    </div>
                  )
                })}
              </div>

              {form.formState.errors.items?.root && (
                <p className="text-sm text-red-500 mt-4 font-medium">{form.formState.errors.items.root.message}</p>
              )}

              {/* Totals Section */}
              <div className="mt-8 pt-6 border-t border-dashed">
                <div className="w-full md:w-1/2 ml-auto space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Tạm tính:</span>
                    <span className="font-semibold">{formatCurrency(subTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-muted-foreground font-medium whitespace-nowrap">Giảm giá:</span>
                    <div className="relative w-32">
                      <Input 
                        type="number" 
                        min="0"
                        {...form.register("discount", { valueAsNumber: true })}
                        className="h-8 text-right pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₫</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-muted-foreground font-medium whitespace-nowrap">Phụ thu:</span>
                    <div className="relative w-32">
                      <Input 
                        type="number" 
                        min="0"
                        {...form.register("surcharge", { valueAsNumber: true })}
                        className="h-8 text-right pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₫</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Tổng cộng:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div 
        className={cn(
          "p-4 bg-background/95 backdrop-blur-xl border-t z-50 flex justify-end px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]",
          isDialog 
            ? "sticky bottom-[-16px] -mx-4 -mb-4 mt-6 rounded-b-xl" // Inside dialog: match p-4 padding of DialogContent
            : "fixed bottom-0 left-0 right-0 md:left-64" // Full page
        )}
      >
        <div className="flex gap-4 w-full max-w-7xl mx-auto justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onCancel ? onCancel() : router.back()}
            disabled={isSubmitting}
            className="w-32"
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-40 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Thanh toán</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
