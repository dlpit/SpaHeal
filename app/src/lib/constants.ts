export const APP_NAME = "Bu's Beauty Hideout";
export const APP_DESCRIPTION = 'Hệ thống quản lý Spa chuyên nghiệp';

export const NAV_ITEMS = [
  { title: 'Tổng quan', href: '/', icon: 'LayoutDashboard' },
  { title: 'Doanh thu', href: '/doanh-thu', icon: 'Receipt' },
  { title: 'Khách hàng', href: '/khach-hang', icon: 'Users' },
  { title: 'Dịch vụ', href: '/dich-vu', icon: 'Layers' },
  { title: 'Lịch hẹn', href: '/lich-hen', icon: 'CalendarDays' },
  { title: 'Chi phí', href: '/chi-phi', icon: 'Wallet' },
  { title: 'Kho vật tư', href: '/kho', icon: 'Package' },
  { title: 'Cài đặt', href: '/cai-dat', icon: 'Settings' },
] as const;
