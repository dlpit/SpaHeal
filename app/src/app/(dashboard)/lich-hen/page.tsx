import { Metadata } from 'next';
import { getAppointments } from '@/app/actions/appointment-actions';
import { getCustomers } from '@/app/actions/customer';
import { AppointmentCalendar } from './components/appointment-calendar';

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
      <div className="mt-0">
        <AppointmentCalendar 
          initialAppointments={appointments} 
          customers={customers} 
        />
      </div>
    </div>
  );
}
