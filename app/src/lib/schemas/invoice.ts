import { z } from "zod";

export const invoiceItemSchema = z.object({
  serviceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  quantity: z.number().min(1, "Số lượng tối thiểu là 1"),
  unitPrice: z.number().min(0, "Giá không hợp lệ"),
});

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  date: z.date({
    required_error: "Vui lòng chọn ngày lập",
  }),
  staffId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentAccountId: z.string().optional(),
  discount: z.number().min(0, "Giảm giá phải >= 0").optional(),
  surcharge: z.number().min(0, "Phụ thu phải >= 0").optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Hóa đơn phải có ít nhất 1 dịch vụ"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
