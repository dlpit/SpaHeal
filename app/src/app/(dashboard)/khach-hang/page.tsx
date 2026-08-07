import { getCustomers } from '@/app/actions/customer';
import { CustomerTable } from '@/components/khach-hang/customer-table';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Khách hàng | SpaHeal',
  description: 'Quản lý khách hàng Spa',
};

export default async function CustomersPage() {
  const customers = await getCustomers();
  
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Khách hàng" 
        description="Quản lý danh sách khách hàng, hạng thẻ và lịch sử chi tiêu."
        icon={Users}
      />
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-[var(--spa-border)]">
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
}
