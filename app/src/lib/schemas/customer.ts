import * as z from 'zod';

export const customerSchema = z.object({
  fullName: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự').max(100, 'Tên quá dài'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  birthday: z.coerce.date().optional().nullable().or(z.literal('').transform(() => null)),
  skinCondition: z.string().optional().or(z.literal('')),
  medicalNotes: z.string().optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type CustomerFormInput = z.input<typeof customerSchema>;
