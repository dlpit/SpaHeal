import { getInvoiceFormOptions } from "@/app/actions/invoice";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Tạo Hóa Đơn Mới",
};

export default async function CreateInvoicePage() {
  const optionsResult = await getInvoiceFormOptions();

  if (!optionsResult.success || !optionsResult.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
        <p className="text-muted-foreground mb-6">{optionsResult.error}</p>
        <Link href="/doanh-thu">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/doanh-thu" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Tạo Hóa Đơn</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            Thêm mới hóa đơn dịch vụ và thanh toán
          </p>
        </div>
      </div>

      {/* Form Content */}
      <InvoiceForm options={optionsResult.data} />
    </div>
  );
}
