import * as z from 'zod';

export const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  customerName: z.string().min(1, 'Tên khách hàng không được để trống'), // Denormalized
  serviceId: z.string().optional().nullable(),
  serviceName: z.string().optional().nullable(), // Denormalized — auto-fill khi chọn dịch vụ
  staffId: z.string().optional().nullable(),
  staffName: z.string().optional().nullable(), // Denormalized — auto-fill khi chọn kỹ thuật viên
  date: z.coerce.date({
    required_error: "Vui lòng chọn ngày hẹn",
    invalid_type_error: "Ngày hẹn không hợp lệ",
  }),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không hợp lệ (HH:mm)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không hợp lệ (HH:mm)').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  deposit: z.coerce.number().min(0, 'Tiền cọc không được âm').optional().nullable(),
  status: z.enum([
    'CONFIRMED',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'RESCHEDULED',
    'NO_SHOW',
    'DEPOSIT'
  ])
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
export type AppointmentFormInput = z.input<typeof appointmentSchema>;
