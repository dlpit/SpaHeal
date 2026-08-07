import { Metadata } from 'next';
import { getAppointments } from '@/app/actions/appointment-actions';
import { getFrequentCustomers } from '@/app/actions/customer';
import { AppointmentCalendar } from './components/appointment-calendar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lịch hẹn | Spa Heal',
  description: 'Quản lý lịch hẹn của khách hàng',
};

export default async function AppointmentsPage() {
  // Lấy lịch hẹn trong khoảng tháng hiện tại (Mặc định cho lần load đầu tiên)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [appointments, customers] = await Promise.all([
    getAppointments(start, end),
    getFrequentCustomers(20)
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
