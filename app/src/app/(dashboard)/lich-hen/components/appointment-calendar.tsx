'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { ClientAppointmentDoc, updateAppointmentTime } from '@/app/actions/appointment-actions';
import { ClientCustomerDoc } from '@/lib/firestore-types';
import { AppointmentFormModal } from './appointment-form-modal';
import { InvoiceFromAppointmentDialog } from './invoice-from-appointment-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilePlus, Pencil, X, User, Wrench, Clock } from 'lucide-react';

interface AppointmentCalendarProps {
  initialAppointments: ClientAppointmentDoc[];
  customers: ClientCustomerDoc[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CONFIRMED:   { label: 'Đã xác nhận',  color: '#3b82f6' },
  ARRIVED:     { label: 'Đã đến',        color: '#eab308' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#f97316' },
  COMPLETED:   { label: 'Hoàn thành',   color: '#22c55e' },
  CANCELLED:   { label: 'Đã hủy',       color: '#ef4444' },
  RESCHEDULED: { label: 'Dời lịch',     color: '#8b5cf6' },
  NO_SHOW:     { label: 'Không đến',    color: '#6b7280' },
  DEPOSIT:     { label: 'Đã đặt cọc',   color: '#06b6d4' },
};

export function AppointmentCalendar({ initialAppointments, customers }: AppointmentCalendarProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentDoc | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const events = initialAppointments.map((app) => {
    // Parse ISO string to local Date to avoid timezone shifting
    const d = new Date(app.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const start = `${dateStr}T${app.startTime}:00`;
    let end = undefined;
    if (app.endTime) end = `${dateStr}T${app.endTime}:00`;

    const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: 'var(--spa-blush-300)' };

    return {
      id: app.id,
      title: `${app.customerName}${app.serviceName ? ` · ${app.serviceName}` : ''}`,
      start,
      end,
      backgroundColor: statusInfo.color,
      borderColor: statusInfo.color,
      extendedProps: { ...app },
    };
  });

  const handleDateClick = (arg: any) => {
    setSelectedDateStr(arg.dateStr);
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const app = arg.event.extendedProps as ClientAppointmentDoc;
    setSelectedAppointment(app);
    setSelectedDateStr(null);
    setIsDetailOpen(true);
  };

  const handleEditFromDetail = () => {
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleCreateInvoiceFromDetail = () => {
    setIsDetailOpen(false);
    setIsInvoiceDialogOpen(true);
  };

  const handleEventDrop = async (arg: any) => {
    if (!arg.event.start) { arg.revert(); return; }
    setIsUpdating(true);
    try {
      const padZero = (num: number) => num.toString().padStart(2, '0');
      const newDate = arg.event.start;
      const newStartTime = `${padZero(newDate.getHours())}:${padZero(newDate.getMinutes())}`;
      let newEndTime = null;
      if (arg.event.end) {
        newEndTime = `${padZero(arg.event.end.getHours())}:${padZero(arg.event.end.getMinutes())}`;
      }
      const res = await updateAppointmentTime(arg.event.id, newDate, newStartTime, newEndTime);
      if (!res.success) { alert('Cập nhật thất bại'); arg.revert(); }
    } catch {
      alert('Đã xảy ra lỗi khi cập nhật thời gian');
      arg.revert();
    } finally {
      setIsUpdating(false);
    }
  };

  const detailApp = selectedAppointment;
  const detailStatus = detailApp ? STATUS_LABELS[detailApp.status] : null;
  const canCreateInvoice = detailApp &&
    !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(detailApp.status);

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-[var(--spa-border)]">
      {isUpdating && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">Đang cập nhật...</div>
        </div>
      )}

      {/* Styling FullCalendar theo theme SPA HEAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .fc { --fc-page-bg-color: transparent; --fc-neutral-bg-color: var(--spa-warm-50); --fc-neutral-text-color: var(--spa-text-primary); --fc-border-color: var(--spa-border); --fc-button-text-color: var(--spa-text-primary); --fc-button-bg-color: #fff; --fc-button-border-color: var(--spa-border); --fc-button-hover-bg-color: var(--spa-warm-100); --fc-button-hover-border-color: var(--spa-border); --fc-button-active-bg-color: var(--spa-blush-200); --fc-button-active-border-color: var(--spa-blush-300); --fc-button-active-text-color: #000; --fc-event-bg-color: var(--spa-blush-300); --fc-event-border-color: var(--spa-blush-300); --fc-event-text-color: #fff; --fc-event-selected-overlay-color: rgba(0,0,0,0.25); --fc-more-link-bg-color: var(--spa-warm-100); --fc-more-link-text-color: var(--spa-text-primary); --fc-today-bg-color: var(--spa-warm-100); font-family: inherit; }
        .fc .fc-toolbar-title { font-family: var(--font-serif, ui-serif, serif); font-size: 1.5rem; color: var(--spa-text-primary); }
        .fc .fc-button { padding: 0.4rem 0.75rem; font-size: 0.875rem; border-radius: 0.375rem; text-transform: capitalize; transition: all 0.2s ease; }
        .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: var(--spa-blush-300) !important; border-color: var(--spa-blush-400) !important; color: white !important; }
      `}} />

      <FullCalendar
        plugins={[dayGridPlugin as any, timeGridPlugin as any, interactionPlugin as any, listPlugin as any]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="auto"
        locale="vi"
      />

      {/* Form Modal: Tạo/Sửa lịch hẹn */}
      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        appointment={selectedAppointment}
        customers={customers}
        selectedDateStr={selectedDateStr}
      />

      {/* Detail Dialog: Xem chi tiết lịch hẹn */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[var(--spa-warm-50)] border-[var(--spa-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--spa-text-primary)] font-serif text-lg">
              Chi tiết lịch hẹn
            </DialogTitle>
            <DialogDescription className="text-[var(--spa-text-secondary)]">
              {detailApp?.date ? new Date(detailApp.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </DialogDescription>
          </DialogHeader>

          {detailApp && (
            <div className="space-y-4 py-2">
              {/* Trạng thái */}
              {detailStatus && (
                <div className="flex justify-center">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: detailStatus.color }}
                  >
                    {detailStatus.label}
                  </span>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[var(--spa-border)]">
                  <User className="w-4 h-4 text-[var(--spa-blush-300)] shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--spa-text-primary)]">{detailApp.customerName}</p>
                    <p className="text-xs text-[var(--spa-text-secondary)]">Khách hàng</p>
                  </div>
                </div>

                {detailApp.serviceName && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[var(--spa-border)]">
                    <Wrench className="w-4 h-4 text-[var(--spa-blush-300)] shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--spa-text-primary)]">{detailApp.serviceName}</p>
                      <p className="text-xs text-[var(--spa-text-secondary)]">{detailApp.staffName ? `KTV: ${detailApp.staffName}` : 'Dịch vụ'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[var(--spa-border)]">
                  <Clock className="w-4 h-4 text-[var(--spa-blush-300)] shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--spa-text-primary)]">
                      {detailApp.startTime}{detailApp.endTime ? ` — ${detailApp.endTime}` : ''}
                    </p>
                    <p className="text-xs text-[var(--spa-text-secondary)]">Thời gian</p>
                  </div>
                </div>

                {detailApp.notes && (
                  <div className="p-3 bg-white rounded-lg border border-[var(--spa-border)] text-[var(--spa-text-secondary)] text-xs italic">
                    "{detailApp.notes}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[var(--spa-border)]"
                  onClick={handleEditFromDetail}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>

                {canCreateInvoice && (
                  <Button
                    size="sm"
                    className="flex-1 bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white"
                    onClick={handleCreateInvoiceFromDetail}
                  >
                    <FilePlus className="w-4 h-4 mr-2" />
                    Tạo hóa đơn
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog: Tạo hóa đơn từ lịch hẹn */}
      {selectedAppointment && (
        <InvoiceFromAppointmentDialog
          isOpen={isInvoiceDialogOpen}
          onClose={() => setIsInvoiceDialogOpen(false)}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
}
