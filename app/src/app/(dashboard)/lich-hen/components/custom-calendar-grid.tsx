'use client';

import { useMemo } from 'react';
import { ClientAppointmentDoc } from '@/app/actions/appointment-actions';
import { Plus } from 'lucide-react';

interface CustomCalendarGridProps {
  appointments: ClientAppointmentDoc[];
  currentDate: Date;
  viewMode: 'week' | 'day';
  onCellClick: (dateTimeStr: string) => void;
  onAppointmentClick: (appointment: ClientAppointmentDoc) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  CONFIRMED:   { bg: '#3b82f6', text: '#fff' },
  ARRIVED:     { bg: '#eab308', text: '#fff' },
  IN_PROGRESS: { bg: '#f97316', text: '#fff' },
  COMPLETED:   { bg: '#22c55e', text: '#fff' },
  CANCELLED:   { bg: '#ef4444', text: '#fff' },
  RESCHEDULED: { bg: '#8b5cf6', text: '#fff' },
  NO_SHOW:     { bg: '#6b7280', text: '#fff' },
  DEPOSIT:     { bg: '#06b6d4', text: '#fff' },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const VI_DAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function getLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function CustomCalendarGrid({
  appointments,
  currentDate,
  viewMode,
  onCellClick,
  onAppointmentClick,
}: CustomCalendarGridProps) {
  const daysToShow = useMemo<Date[]>(() => {
    if (viewMode === 'day') return [currentDate];
    const weekStart = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [viewMode, currentDate]);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, ClientAppointmentDoc[]>();
    for (const app of appointments) {
      const d = new Date(app.date);
      const dateStr = getLocalDateStr(d);
      const hour = parseInt(app.startTime.split(':')[0], 10);
      const key = `${dateStr}-${hour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    }
    return map;
  }, [appointments]);

  const todayStr = getLocalDateStr(new Date());

  return (
    <div className="w-full">
      <div className="overflow-auto rounded-xl border border-[var(--spa-border)] bg-white shadow-sm mt-4">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '72px', minWidth: '64px' }} />
            {daysToShow.map((_, i) => <col key={i} style={{ minWidth: '140px' }} />)}
          </colgroup>

          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--spa-warm-50)]">
              <th className="border-b border-r border-[var(--spa-border)] p-2" />
              {daysToShow.map((day) => {
                const dayStr = getLocalDateStr(day);
                const isToday = dayStr === todayStr;
                return (
                  <th
                    key={dayStr}
                    className={`border-b border-r border-[var(--spa-border)] last:border-r-0 py-2 px-1 text-center select-none ${isToday ? 'bg-[var(--spa-blush-100)]' : ''}`}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-[var(--spa-blush-400)]' : 'text-[var(--spa-text-secondary)]'}`}>
                      {VI_DAYS[day.getDay()]}
                    </div>
                    <div className={`text-xl font-bold leading-tight ${isToday ? 'text-[var(--spa-blush-400)]' : 'text-[var(--spa-text-primary)]'}`}>
                      {day.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                {/* Hour label */}
                <td className="border-b border-r border-[var(--spa-border)] align-top p-2 bg-[var(--spa-warm-50)] select-none">
                  <span className="text-xs text-[var(--spa-text-secondary)] font-medium whitespace-nowrap">
                    {String(hour).padStart(2, '0')} giờ
                  </span>
                </td>

                {daysToShow.map((day) => {
                  const dayStr = getLocalDateStr(day);
                  const key = `${dayStr}-${hour}`;
                  const cellApps = appointmentMap.get(key) ?? [];
                  const isToday = dayStr === todayStr;
                  const dateTimeStr = `${dayStr}T${String(hour).padStart(2, '0')}:00:00`;

                  return (
                    <td
                      key={dayStr}
                      onClick={() => onCellClick(dateTimeStr)}
                      className={`group border-b border-r border-[var(--spa-border)] last:border-r-0 align-top p-1 cursor-pointer transition-colors ${
                        isToday ? 'bg-[var(--spa-blush-50)] hover:bg-[var(--spa-blush-100)]' : 'hover:bg-[var(--spa-warm-50)]'
                      }`}
                    >
                      {cellApps.length === 0 ? (
                        <div className="min-h-[44px] flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCellClick(dateTimeStr); }}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border border-dashed border-[var(--spa-border)] text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)] hover:text-[var(--spa-blush-400)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 h-full min-h-[36px]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {cellApps.map((app) => {
                            const style = STATUS_STYLES[app.status] ?? { bg: '#e9a8b0', text: '#fff' };
                            return (
                              <button
                                key={app.id}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-left
                                  transition-all hover:opacity-90 hover:shadow-md focus:outline-none ${
                                    app.status === 'CANCELLED' ? 'opacity-50 line-through' : ''
                                  }`}
                                style={{ backgroundColor: style.bg, color: style.text }}
                              >
                                <span className="shrink-0 font-bold opacity-90">{app.startTime}</span>
                                <span className="truncate">
                                  {app.customerName}
                                  {app.services && app.services.length > 0 
                                    ? ` · ${app.services.map(s => s.serviceName).join(', ')}` 
                                    : app.serviceName ? ` · ${app.serviceName}` : ''}
                                </span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCellClick(dateTimeStr); }}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border border-dashed border-[var(--spa-border)] text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)] hover:text-[var(--spa-blush-400)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
