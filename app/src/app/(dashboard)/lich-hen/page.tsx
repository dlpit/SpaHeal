import { Metadata } from 'next';
import { getAppointments } from '@/app/actions/appointment-actions';
import { getCustomers } from '@/app/actions/customer';
import { AppointmentCalendar } from './components/appointment-calendar';
import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Lịch hẹn | Spa Heal',
  description: 'Quản lý lịch hẹn của khách hàng',
};

export default async function AppointmentsPage() {
  const [appointments, customers] = await Promise.all([
    getAppointments(),
    getCustomers()
  ]);

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Lịch hẹn" 
        description="Xem và quản lý lịch hẹn của khách hàng theo dạng lịch trực quan."
        icon={CalendarDays}
      />

      <div className="mt-4">
        <AppointmentCalendar 
          initialAppointments={appointments} 
          customers={customers} 
        />
      </div>
    </div>
  );
}
