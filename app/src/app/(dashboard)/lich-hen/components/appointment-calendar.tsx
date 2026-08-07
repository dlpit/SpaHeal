'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { addMonths, subMonths, addDays, subDays, addWeeks, subWeeks } from 'date-fns';
import { ClientAppointmentDoc, updateAppointmentStatus, reopenAppointmentAsClone } from '@/app/actions/appointment-actions';
import { ClientCustomerDoc, AppointmentStatus } from '@/lib/firestore-types';
import { PageHeader } from '@/components/ui/page-header';
import { CustomCalendarGrid } from './custom-calendar-grid';
import { AppointmentFormModal } from './appointment-form-modal';
import { InvoiceFromAppointmentDialog } from './invoice-from-appointment-dialog';
import { CancelAppointmentModal } from './cancel-appointment-modal';
import { APPOINTMENT_TRANSITIONS, STATUS_LABELS } from '@/lib/constants/appointment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FilePlus, Pencil, User, Wrench, Clock, CalendarDays, Plus, ChevronLeft, ChevronRight, XCircle, CheckCircle, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

interface AppointmentCalendarProps {
  initialAppointments: ClientAppointmentDoc[];
  customers: ClientCustomerDoc[];
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

export function AppointmentCalendar({ initialAppointments, customers }: AppointmentCalendarProps) {
  const [activeView, setActiveView] = useState<ViewMode>('week');
  const [isMounted, setIsMounted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<AppointmentStatus | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentDoc | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const calendarRef = useRef<FullCalendar>(null);

  const handleStatusUpdate = async (status: AppointmentStatus, forceInvoice: boolean = false) => {
    if (!selectedAppointment) return;
    setIsUpdatingStatus(true);
    
    if (status === 'COMPLETED' || forceInvoice) {
      setPreviousStatus(selectedAppointment.status);
    }

    try {
      const res = await updateAppointmentStatus(selectedAppointment.id, status);
      if (res.success) {
        toast.success(`Đã cập nhật trạng thái thành: ${STATUS_LABELS[status].label}`);
        
        // Luôn cập nhật local state để view thay đổi liền mạch và logic revert hoạt động đúng
        setSelectedAppointment({ ...selectedAppointment, status });

        if (status === 'COMPLETED' || forceInvoice) {
          setIsDetailOpen(false);
          // Wait briefly to avoid dialog stacking issues
          setTimeout(() => {
            setIsInvoiceDialogOpen(true);
          }, 200);
        } else if (status === 'CONFIRMED' && (selectedAppointment.status === 'CANCELLED' || selectedAppointment.status === 'NO_SHOW')) {
          setIsDetailOpen(false);
        }
      } else {
        toast.error(res.error || 'Lỗi cập nhật trạng thái');
      }
    } catch (err: any) {
      toast.error('Lỗi hệ thống khi cập nhật trạng thái');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedAppointment) return;
    
    setIsUpdatingStatus(true);
    try {
      const res = await reopenAppointmentAsClone(selectedAppointment.id);
      if (res.success && res.newAppointment) {
        const newApp = res.newAppointment;
        toast.success('Đã mở lại lịch và hoàn tiền cọc thành công!');
        
        setIsDetailOpen(false);
        // Wait briefly to avoid dialog stacking issues
        setTimeout(() => {
          setSelectedAppointment(newApp);
          setIsFormOpen(true);
        }, 300);
      } else {
        toast.error(!res.success ? res.error : 'Lỗi khi mở lại lịch hẹn');
      }
    } catch (err: any) {
      toast.error('Lỗi hệ thống khi mở lại lịch hẹn');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Sync date to FullCalendar when activeView changes to month/list
  useEffect(() => {
    let isSubscribed = true;
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      const fcView = activeView === 'month' ? 'dayGridMonth' : 'listWeek';
      queueMicrotask(() => {
        if (isSubscribed && calendarRef.current) {
          api.gotoDate(currentDate);
          api.changeView(fcView);
        }
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [activeView, currentDate]);

  const goBack = () => {
    let nd: Date;
    if (activeView === 'month') nd = subMonths(currentDate, 1);
    else if (activeView === 'week') nd = subWeeks(currentDate, 1);
    else nd = subDays(currentDate, 1);
    setCurrentDate(nd);
  };

  const goForward = () => {
    let nd: Date;
    if (activeView === 'month') nd = addMonths(currentDate, 1);
    else if (activeView === 'week') nd = addWeeks(currentDate, 1);
    else nd = addDays(currentDate, 1);
    setCurrentDate(nd);
  };

  const goToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  const titleStr = useMemo(() => {
    if (activeView === 'month') {
      return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    } else if (activeView === 'day' || activeView === 'list') {
      return currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      // week
      const d = new Date(currentDate);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      const s = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
      const e = end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
      return `${s} – ${e}`;
    }
  }, [activeView, currentDate]);

  const handleCellClick = (dateTimeStr: string) => {
    setSelectedDateStr(dateTimeStr);
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleAppointmentClick = (app: ClientAppointmentDoc) => {
    setSelectedAppointment(app);
    setSelectedDateStr(null);
    setIsDetailOpen(true);
  };

  const filteredAppointments = useMemo(() => {
    return initialAppointments.filter(app => showCancelled || app.status !== 'CANCELLED');
  }, [initialAppointments, showCancelled]);

  // FullCalendar event adapters
  const fcEvents = useMemo(() => {
    return filteredAppointments.map((app) => {
      const d = new Date(app.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const start = `${dateStr}T${app.startTime}:00`;
      const end = app.endTime ? `${dateStr}T${app.endTime}:00` : undefined;
      const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: 'var(--spa-blush-300)' };
      return {
        id: app.id,
        title: `${app.customerName}${app.services && app.services.length > 0 ? ` · ${app.services.map(s => s.serviceName).join(', ')}` : app.serviceName ? ` · ${app.serviceName}` : ''}`,
        start,
        end,
        backgroundColor: statusInfo.color,
        borderColor: statusInfo.color,
        classNames: app.status === 'CANCELLED' ? ['opacity-50', 'line-through'] : [],
        extendedProps: { ...app },
      };
    });
  }, [filteredAppointments]);

  const handleFcDateClick = (arg: any) => {
    setSelectedDateStr(arg.dateStr);
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleFcEventClick = (arg: any) => {
    const app = arg.event.extendedProps as ClientAppointmentDoc;
    handleAppointmentClick(app);
  };

  const detailApp = selectedAppointment;
  const detailStatus = detailApp ? STATUS_LABELS[detailApp.status] : null;
  const canCreateInvoice = detailApp &&
    !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(detailApp.status);

  if (!isMounted) {
    return <div className="w-full min-h-[600px] animate-pulse bg-[var(--spa-warm-50)] rounded-xl border border-[var(--spa-border)]" />;
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Lịch hẹn"
        description="Xem và quản lý lịch hẹn của khách hàng theo dạng lịch trực quan."
        icon={CalendarDays}
      >
        <Button
          onClick={() => {
            setSelectedAppointment(null);
            setSelectedDateStr(null);
            setIsFormOpen(true);
          }}
          className="bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm lịch hẹn
        </Button>
      </PageHeader>

      {/* Unified Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            aria-label="Trước"
            className="p-1.5 rounded-md border border-[var(--spa-border)] bg-white hover:bg-[var(--spa-warm-100)] transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-[var(--spa-text-secondary)]" />
          </button>
          <button
            onClick={goForward}
            aria-label="Tiếp"
            className="p-1.5 rounded-md border border-[var(--spa-border)] bg-white hover:bg-[var(--spa-warm-100)] transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-[var(--spa-text-secondary)]" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--spa-border)] bg-white hover:bg-[var(--spa-warm-100)] transition-colors text-[var(--spa-text-primary)]"
          >
            Hôm nay
          </button>
          <span className="font-semibold text-[var(--spa-text-primary)] text-xl ml-4 hidden sm:inline capitalize">
            {titleStr}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 hidden sm:flex">
            <Switch
              id="show-cancelled"
              checked={showCancelled}
              onCheckedChange={setShowCancelled}
            />
            <Label htmlFor="show-cancelled" className="text-sm cursor-pointer text-[var(--spa-text-secondary)]">Xem lịch đã hủy</Label>
          </div>
          <div className="flex items-center gap-0.5 bg-[var(--spa-warm-50)] rounded-lg p-1 border border-[var(--spa-border)]">
            {(['month', 'week', 'day', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveView(mode)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors font-medium capitalize ${
                  activeView === mode
                    ? 'bg-[var(--spa-blush-300)] text-white shadow-sm'
                    : 'text-[var(--spa-text-secondary)] hover:bg-[var(--spa-warm-100)]'
                }`}
              >
                {mode === 'month' ? 'Tháng' : mode === 'week' ? 'Tuần' : mode === 'day' ? 'Ngày' : 'DS'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-sm font-semibold text-[var(--spa-text-primary)] mb-2 sm:hidden capitalize">{titleStr}</p>

      {/* Conditional Rendering */}
      {activeView === 'week' || activeView === 'day' ? (
        <CustomCalendarGrid
          appointments={filteredAppointments}
          currentDate={currentDate}
          viewMode={activeView}
          onCellClick={handleCellClick}
          onAppointmentClick={handleAppointmentClick}
        />
      ) : (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-[var(--spa-border)]">
          <style dangerouslySetInnerHTML={{__html: `
            .fc { --fc-page-bg-color: transparent; --fc-neutral-bg-color: var(--spa-warm-50); --fc-neutral-text-color: var(--spa-text-primary); --fc-border-color: var(--spa-border); --fc-button-text-color: var(--spa-text-primary); --fc-button-bg-color: #fff; --fc-button-border-color: var(--spa-border); --fc-button-hover-bg-color: var(--spa-warm-100); --fc-button-hover-border-color: var(--spa-border); --fc-button-active-bg-color: var(--spa-blush-200); --fc-button-active-border-color: var(--spa-blush-300); --fc-button-active-text-color: #000; --fc-event-bg-color: var(--spa-blush-300); --fc-event-border-color: var(--spa-blush-300); --fc-event-text-color: #fff; --fc-event-selected-overlay-color: rgba(0,0,0,0.25); --fc-more-link-bg-color: var(--spa-warm-100); --fc-more-link-text-color: var(--spa-text-primary); --fc-today-bg-color: var(--spa-warm-100); font-family: inherit; }
            .fc .fc-toolbar-title { display: none; }
            .fc-event { border-radius: 4px; padding: 2px; }
          `}} />
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin as any, listPlugin as any, interactionPlugin as any]}
            initialView={activeView === 'month' ? 'dayGridMonth' : 'listWeek'}
            initialDate={currentDate}
            headerToolbar={false}
            events={fcEvents}
            dateClick={handleFcDateClick}
            eventClick={handleFcEventClick}
            height="auto"
            locale="vi"
            dayMaxEvents={true}
            dayCellClassNames="group relative"
            dayCellContent={(arg: any) => {
              const d = arg.date;
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return (
                <>
                  <div className="fc-daygrid-day-number">{arg.dayNumberText}</div>
                  <button
                    type="button"
                    title="Thêm lịch hẹn"
                    className="absolute bottom-1 right-1 p-1 rounded-md bg-white border border-[var(--spa-border)] text-[var(--spa-text-secondary)] shadow-sm hover:text-[var(--spa-blush-400)] hover:border-[var(--spa-blush-300)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(dateStr);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              );
            }}
          />
        </div>
      )}

      {/* Form Modal */}
      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        appointment={selectedAppointment}
        customers={customers}
        selectedDateStr={selectedDateStr}
      />

      {/* Detail Dialog */}
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

                {(detailApp.services && detailApp.services.length > 0) ? (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[var(--spa-border)]">
                    <Wrench className="w-4 h-4 text-[var(--spa-blush-300)] shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-[var(--spa-text-secondary)] mb-1">{detailApp.staffName ? `KTV: ${detailApp.staffName}` : 'Dịch vụ'}</p>
                      {detailApp.services.map((s, idx) => (
                        <p key={idx} className="font-medium text-[var(--spa-text-primary)]">
                          {s.serviceName} {s.quantity > 1 ? `(x${s.quantity})` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : detailApp.serviceName ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[var(--spa-border)]">
                    <Wrench className="w-4 h-4 text-[var(--spa-blush-300)] shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--spa-text-primary)]">{detailApp.serviceName}</p>
                      <p className="text-xs text-[var(--spa-text-secondary)]">{detailApp.staffName ? `KTV: ${detailApp.staffName}` : 'Dịch vụ'}</p>
                    </div>
                  </div>
                ) : null}

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
                    &ldquo;{detailApp.notes}&rdquo;
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-[var(--spa-border)] mt-4">
                {/* QUICK ACTIONS ROW */}
                <div className="grid grid-cols-2 gap-2">
                  {APPOINTMENT_TRANSITIONS[detailApp.status]?.includes('ARRIVED') && (
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => handleStatusUpdate('ARRIVED')}
                      disabled={isUpdatingStatus}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Khách đã đến
                    </Button>
                  )}
                  {APPOINTMENT_TRANSITIONS[detailApp.status]?.includes('IN_PROGRESS') && (
                    <Button 
                      size="sm" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                      disabled={isUpdatingStatus}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Bắt đầu làm
                    </Button>
                  )}
                  {detailApp.status === 'IN_PROGRESS' && APPOINTMENT_TRANSITIONS[detailApp.status]?.includes('COMPLETED') && (
                    <Button 
                      size="sm" 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      disabled={isUpdatingStatus}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Hoàn thành
                    </Button>
                  )}
                  {['CANCELLED', 'NO_SHOW'].includes(detailApp.status) && APPOINTMENT_TRANSITIONS[detailApp.status]?.includes('CONFIRMED') && (
                    <Button 
                      size="sm" 
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                      onClick={handleReopen}
                      disabled={isUpdatingStatus}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Mở lại lịch (Re-open)
                    </Button>
                  )}

                  {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(detailApp.status) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => handleStatusUpdate('COMPLETED', true)}
                      disabled={isUpdatingStatus}
                      title="Hoàn thành & Đi đến tạo Hóa đơn ngay"
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      Hoàn thành & Thu tiền
                    </Button>
                  )}
                </div>

                {/* SECONDARY ACTIONS ROW */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[100px] border-[var(--spa-border)]"
                    onClick={() => { setIsDetailOpen(false); setIsFormOpen(true); }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>

                  {canCreateInvoice && detailApp.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      className="flex-1 min-w-[120px] bg-[var(--spa-blush-300)] hover:bg-[var(--spa-blush-400)] text-white"
                      onClick={() => { setIsDetailOpen(false); setIsInvoiceDialogOpen(true); }}
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      Tạo hóa đơn
                    </Button>
                  )}
                  
                  {!['COMPLETED', 'CANCELLED'].includes(detailApp.status) && (
                    <div className="flex-1 min-w-[100px]">
                      {!!detailApp.invoiceId ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<div className="w-full" />}>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={true}
                                className="w-full border-[var(--spa-danger)] text-[var(--spa-danger)] pointer-events-none"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Hủy lịch
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-red-500 text-white border-none">
                              <p>Lịch hẹn này đã sinh Hóa đơn. Vui lòng xử lý Hóa đơn trước.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-[var(--spa-danger)] text-[var(--spa-danger)] hover:bg-red-50 hover:text-[var(--spa-danger)]"
                          onClick={() => { setIsDetailOpen(false); setIsCancelModalOpen(true); }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Hủy lịch
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedAppointment && (
        <InvoiceFromAppointmentDialog
          isOpen={isInvoiceDialogOpen}
          onClose={async (isSuccess?: boolean) => {
            setIsInvoiceDialogOpen(false);
            if (!isSuccess && previousStatus && selectedAppointment && selectedAppointment.status === 'COMPLETED') {
              try {
                toast.promise(
                  updateAppointmentStatus(selectedAppointment.id, previousStatus, true).then(res => {
                    if (!res.success) throw new Error(res.error);
                    return res;
                  }),
                  {
                    loading: 'Khách chưa thanh toán, đang hoàn tác trạng thái lịch hẹn...',
                    success: () => {
                      const revertedLabel = STATUS_LABELS[previousStatus]?.label ?? previousStatus;
                      setSelectedAppointment(prev => prev ? { ...prev, status: previousStatus } : null);
                      setPreviousStatus(null);
                      return `Đã lùi trạng thái về: ${revertedLabel}`;
                    },
                    error: (err) => err.message || 'Lỗi hoàn tác trạng thái'
                  }
                );
              } catch (err) {
                console.error(err);
              }
            } else {
              setPreviousStatus(null);
            }
          }}
          appointment={selectedAppointment}
        />
      )}

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
