import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Quản lý Doanh thu",
};

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doanh thu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hóa đơn và theo dõi doanh thu
          </p>
        </div>
        <Link href="/doanh-thu/tao-moi">
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Tạo hóa đơn
          </Button>
        </Link>
      </div>

      {/* Placeholder cho Data Table sẽ làm sau */}
      <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/10 flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Chưa có dữ liệu hiển thị</h3>
        <p className="text-sm">Bảng danh sách hóa đơn sẽ được phát triển sau.</p>
        <Link href="/doanh-thu/tao-moi" className="mt-4">
          <Button variant="outline">Tạo hóa đơn đầu tiên</Button>
        </Link>
      </div>
    </div>
  );
}
