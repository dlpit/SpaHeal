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
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';

interface AppointmentCalendarProps {
  initialAppointments: ClientAppointmentDoc[];
  customers: ClientCustomerDoc[];
}

export function AppointmentCalendar({ initialAppointments, customers }: AppointmentCalendarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentDoc | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Chuyển đổi dữ liệu Appointment thành Event của FullCalendar
  const events = initialAppointments.map((app) => {
    // Format: "YYYY-MM-DDTHH:mm:00"
    const dateStr = app.date.split('T')[0];
    const start = `${dateStr}T${app.startTime}:00`;
    let end = undefined;
    if (app.endTime) {
      end = `${dateStr}T${app.endTime}:00`;
    }

    let color = 'var(--spa-blush-300)';
    switch (app.status) {
      case 'CONFIRMED': color = '#3b82f6'; break; // Blue
      case 'ARRIVED': color = '#eab308'; break; // Yellow
      case 'IN_PROGRESS': color = '#f97316'; break; // Orange
      case 'COMPLETED': color = '#22c55e'; break; // Green
      case 'CANCELLED': color = '#ef4444'; break; // Red
      case 'RESCHEDULED': color = '#8b5cf6'; break; // Purple
      case 'NO_SHOW': color = '#6b7280'; break; // Gray
      case 'DEPOSIT': color = '#06b6d4'; break; // Cyan
    }

    return {
      id: app.id,
      title: `${app.customerName} - ${app.status}`,
      start,
      end,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { ...app },
    };
  });

  const handleDateClick = (arg: any) => {
    setSelectedDateStr(arg.dateStr);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const app = arg.event.extendedProps as ClientAppointmentDoc;
    setSelectedAppointment(app);
    setSelectedDateStr(null);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (arg: any) => {
    if (!arg.event.start) {
      arg.revert();
      return;
    }
    
    setIsUpdating(true);
    try {
      const appId = arg.event.id;
      const newDate = arg.event.start;
      
      const padZero = (num: number) => num.toString().padStart(2, '0');
      const newStartTime = `${padZero(newDate.getHours())}:${padZero(newDate.getMinutes())}`;
      
      let newEndTime = null;
      if (arg.event.end) {
        newEndTime = `${padZero(arg.event.end.getHours())}:${padZero(arg.event.end.getMinutes())}`;
      }

      const res = await updateAppointmentTime(appId, newDate, newStartTime, newEndTime);
      
      if (!res.success) {
        alert('Cập nhật thất bại');
        arg.revert();
      }
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi cập nhật thời gian');
      arg.revert();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-[var(--spa-border)]">
      {isUpdating && (
        <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">Đang cập nhật...</div>
        </div>
      )}

      {/* Styling cho FullCalendar để hợp với Theme SPA HEAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .fc {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: var(--spa-warm-50);
          --fc-neutral-text-color: var(--spa-text-primary);
          --fc-border-color: var(--spa-border);
          
          --fc-button-text-color: var(--spa-text-primary);
          --fc-button-bg-color: #fff;
          --fc-button-border-color: var(--spa-border);
          --fc-button-hover-bg-color: var(--spa-warm-100);
          --fc-button-hover-border-color: var(--spa-border);
          --fc-button-active-bg-color: var(--spa-blush-200);
          --fc-button-active-border-color: var(--spa-blush-300);
          --fc-button-active-text-color: #000;
          
          --fc-event-bg-color: var(--spa-blush-300);
          --fc-event-border-color: var(--spa-blush-300);
          --fc-event-text-color: #fff;
          --fc-event-selected-overlay-color: rgba(0, 0, 0, 0.25);

          --fc-more-link-bg-color: var(--spa-warm-100);
          --fc-more-link-text-color: var(--spa-text-primary);
          
          --fc-today-bg-color: var(--spa-warm-100);
          font-family: inherit;
        }
        
        .fc .fc-toolbar-title {
          font-family: var(--font-serif, ui-serif, serif);
          font-size: 1.5rem;
          color: var(--spa-text-primary);
        }

        .fc .fc-button {
          padding: 0.4rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          text-transform: capitalize;
          transition: all 0.2s ease;
        }
        
        .fc .fc-button-primary:not(:disabled):active,
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: var(--spa-blush-300) !important;
          border-color: var(--spa-blush-400) !important;
          color: white !important;
        }
      `}} />

      <FullCalendar
        plugins={[dayGridPlugin as any, timeGridPlugin as any, interactionPlugin as any, listPlugin as any]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
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

      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        customers={customers}
        selectedDateStr={selectedDateStr}
      />
    </div>
  );
}
