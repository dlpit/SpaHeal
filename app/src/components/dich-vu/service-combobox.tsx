'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { searchServices } from '@/app/actions/appointment-actions';

type ServiceOption = { id: string; name: string; price: number; code: string };

interface ServiceComboboxProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  onServiceSelected?: (service: ServiceOption) => void;
  initialServices?: ServiceOption[];
  error?: boolean;
  disabled?: boolean;
}

export function ServiceCombobox({
  value,
  onValueChange,
  onServiceSelected,
  initialServices = [],
  error,
  disabled,
}: ServiceComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [services, setServices] = React.useState<ServiceOption[]>(initialServices);

  const selectedService = React.useMemo(() => {
    return services.find((s) => s.id === value) || initialServices.find((s) => s.id === value);
  }, [value, services, initialServices]);

  React.useEffect(() => {
    let active = true;

    const fetchServices = async () => {
      setLoading(true);
      try {
        const results = await searchServices(query);
        if (active) {
          setServices(results);
        }
      } catch (err) {
        console.error('Lỗi khi tải dịch vụ', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchServices();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setQuery(''); // Xóa kết quả search khi đóng
    }}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex w-full overflow-hidden items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 h-8",
          error && "border-destructive ring-3 ring-destructive/20",
          !selectedService && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex-1 text-left truncate">
          {selectedService
            ? `${selectedService.name} - ${selectedService.code} - ${formatCurrency(selectedService.price)}`
            : "— Chưa chọn —"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Tìm theo tên hoặc mã dịch vụ..." 
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
                  <span className="text-muted-foreground">Không tìm thấy dịch vụ.</span>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      onValueChange('');
                      setOpen(false);
                    }}
                  >
                    <span>— Chưa chọn —</span>
                    <Check
                      className={cn(
                        "ml-auto size-4",
                        !value || value === '' ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {services.map((service) => (
                    <CommandItem
                      key={service.id}
                      value={service.id}
                      onSelect={() => {
                        onValueChange(service.id);
                        onServiceSelected?.(service);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatCurrency(service.price)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Mã: {service.code}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 size-4 shrink-0",
                          value === service.id ? "opacity-100" : "opacity-0"
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
