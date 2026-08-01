import { getCustomers } from '@/app/actions/customer';
import { CustomerTable } from '@/components/khach-hang/customer-table';

export const metadata = {
  title: 'Khách hàng | SpaHeal',
  description: 'Quản lý khách hàng Spa',
};

export default async function CustomersPage() {
  const customers = await getCustomers();
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Khách hàng</h2>
      </div>
      <CustomerTable customers={customers} />
    </div>
  );
}
