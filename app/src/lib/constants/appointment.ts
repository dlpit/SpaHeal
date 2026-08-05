import { AppointmentStatus } from '../firestore-types';

/**
 * Các trạng thái hợp lệ khi khởi tạo một Lịch hẹn mới.
 */
export const INITIAL_APPOINTMENT_STATUSES: AppointmentStatus[] = ['CONFIRMED', 'DEPOSIT'];

/**
 * Ma trận chuyển đổi trạng thái (State Machine Matrix).
 * Khóa (key) là trạng thái hiện tại, giá trị (value) là danh sách các trạng thái có thể chuyển tới.
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  CONFIRMED: ['ARRIVED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'COMPLETED'],
  DEPOSIT: ['ARRIVED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW', 'COMPLETED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [], // Trạng thái cuối
  CANCELLED: ['CONFIRMED'], // Cho phép mở lại (Re-open)
  RESCHEDULED: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
  NO_SHOW: ['CONFIRMED'], // Cho phép mở lại (Re-open)
};

/**
 * Nhãn hiển thị và màu sắc tương ứng cho từng trạng thái.
 */
export const STATUS_LABELS: Record<AppointmentStatus, { label: string; color: string }> = {
  CONFIRMED:   { label: 'Đã xác nhận',  color: '#3b82f6' }, // Blue
  ARRIVED:     { label: 'Đã đến',        color: '#eab308' }, // Yellow
  IN_PROGRESS: { label: 'Đang làm',      color: '#f97316' }, // Orange
  COMPLETED:   { label: 'Hoàn thành',   color: '#22c55e' }, // Green
  CANCELLED:   { label: 'Đã hủy',       color: '#ef4444' }, // Red
  RESCHEDULED: { label: 'Dời lịch',     color: '#8b5cf6' }, // Purple
  NO_SHOW:     { label: 'Không đến',    color: '#6b7280' }, // Gray
  DEPOSIT:     { label: 'Đã đặt cọc',   color: '#06b6d4' }, // Cyan
};
