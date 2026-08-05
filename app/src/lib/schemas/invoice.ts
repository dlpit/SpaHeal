import { z } from "zod";

export const invoiceItemSchema = z.object({
  serviceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  quantity: z.number().min(1, "Số lượng tối thiểu là 1"),
  unitPrice: z.number().min(0, "Giá không hợp lệ"),
});

export const invoiceFormSchema = z.object({
  /** Tham chiếu lịch hẹn nguồn — optional, chỉ có khi tạo hóa đơn từ lịch hẹn */
  appointmentId: z.string().optional().nullable(),
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  date: z.date({
    required_error: "Vui lòng chọn ngày lập",
  }),
  staffId: z.string().optional(),
  paymentMethodId: z.string().min(1, "Vui lòng chọn hình thức thanh toán"),
  paymentAccountId: z.string().optional(),
  paymentMethodType: z.enum(["CASH", "BANK", "WALLET", "OTHER"]).optional(),
  discount: z.number().min(0, "Giảm giá phải >= 0").optional(),
  surcharge: z.number().min(0, "Phụ thu phải >= 0").optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Hóa đơn phải có ít nhất 1 dịch vụ"),
}).superRefine((val, ctx) => {
  // Nếu phương thức thanh toán không phải Tiền mặt (CASH), bắt buộc chọn Tài khoản nhận
  if (val.paymentMethodType && val.paymentMethodType !== "CASH" && !val.paymentAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vui lòng chọn tài khoản nhận",
      path: ["paymentAccountId"],
    });
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const refundInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Thiếu ID hóa đơn"),
  cancelReason: z.string().min(5, "Lý do hủy/hoàn tiền phải dài ít nhất 5 ký tự"),
});

export type RefundInvoiceValues = z.infer<typeof refundInvoiceSchema>;
