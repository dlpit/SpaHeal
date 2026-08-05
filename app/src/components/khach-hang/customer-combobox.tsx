'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchCustomers, getCustomer } from '@/app/actions/customer';
import { ClientCustomerDoc } from '@/lib/firestore-types';

interface CustomerComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  onCustomerSelected?: (customer: ClientCustomerDoc) => void;
  onAddNew?: () => void;
  initialCustomers?: ClientCustomerDoc[];
  error?: boolean;
  disabled?: boolean;
}

export function CustomerCombobox({
  value,
  onValueChange,
  onCustomerSelected,
  onAddNew,
  initialCustomers = [],
  error,
  disabled,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [customers, setCustomers] = React.useState<ClientCustomerDoc[]>(initialCustomers);

  const selectedCustomer = React.useMemo(() => {
    return customers.find((c) => c.id === value) || initialCustomers.find((c) => c.id === value);
  }, [value, customers, initialCustomers]);

  React.useEffect(() => {
    if (!value) return;
    const exists = customers.some((c) => c.id === value) || initialCustomers.some((c) => c.id === value);
    if (exists) return;

    let active = true;
    const fetchSingleCustomer = async () => {
      try {
        const res = await getCustomer(value);
        if (res && active) {
          setCustomers((prev) => {
            if (prev.some((c) => c.id === res.id)) return prev;
            return [res, ...prev];
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin khách hàng đã chọn:', err);
      }
    };

    fetchSingleCustomer();

    return () => {
      active = false;
    };
  }, [value, customers, initialCustomers]);

  React.useEffect(() => {
    let active = true;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const results = await searchCustomers(query);
        if (active) {
          setCustomers(results);
        }
      } catch (err) {
        console.error('Lỗi khi tải khách hàng', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setQuery(''); // Xóa kết quả search khi đóng để lần sau mở lại thấy list đầy đủ
    }}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 h-8",
          error && "border-destructive ring-3 ring-destructive/20",
          !selectedCustomer && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate">
          {selectedCustomer
            ? `${selectedCustomer.fullName} - ${selectedCustomer.phone}`
            : "Chọn khách hàng..."}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        {/* cmdk doesn't natively support manual controlled value easily with async filtering, 
            so we pass shouldFilter={false} to let our server do the filtering */}
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Tìm theo tên hoặc số điện thoại..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty className="p-4 text-center text-sm flex flex-col items-center gap-3">
                  <span className="text-muted-foreground">Không tìm thấy khách hàng.</span>
                  {onAddNew && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-[var(--spa-primary)] text-[var(--spa-primary)] hover:bg-[var(--spa-primary-light)]/10"
                      onClick={() => {
                        setOpen(false);
                        onAddNew();
                      }}
                    >
                      <PlusCircle className="size-4" />
                      Thêm khách hàng mới
                    </Button>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => {
                        onValueChange(customer.id);
                        onCustomerSelected?.(customer);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span>{customer.fullName}</span>
                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto size-4",
                          value === customer.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
