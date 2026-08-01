import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ 
  currentPage, 
  totalPages, 
  totalItems,
  onPageChange 
}: DataTablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-[var(--spa-text-muted)]">
        Trang {currentPage} / {totalPages}
        {totalItems !== undefined && ` (${totalItems} kết quả)`}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Trang trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Trang sau
        </Button>
      </div>
    </div>
  );
}
