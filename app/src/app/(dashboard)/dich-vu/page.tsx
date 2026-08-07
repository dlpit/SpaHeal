import { Metadata } from 'next';
import { getServices } from '@/app/actions/service-actions';
import { ServiceTable } from './components/service-table';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quản lý Dịch vụ | Spa Heal',
  description: 'Quản lý danh sách dịch vụ và danh mục dịch vụ của Spa Heal',
};

export default async function ServicesPage() {
  const { services, categories } = await getServices();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Quản lý Dịch vụ" 
        description="Quản lý danh sách các dịch vụ hiện có, giá cả và trạng thái hoạt động."
        icon={Layers}
      />

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-[var(--spa-border)]">
        <ServiceTable 
          initialServices={services} 
          categories={categories} 
        />
      </div>
    </div>
  );
}
