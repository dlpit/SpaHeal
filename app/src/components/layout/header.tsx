"use client";

import { Bell, Search, Menu, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import * as Icons from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight font-heading bg-gradient-to-r from-spa-blush-500 to-spa-blush-300 bg-clip-text text-transparent">
                  Bu's Beauty
                </span>
              </Link>
            </div>
            <div className="flex flex-col gap-1 p-4 overflow-y-auto">
              <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                Menu chính
              </div>
              {(NAV_ITEMS as unknown as NavItem[]).map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
                const isActive = pathname === item.href;
                
                return (
                  <SheetClose key={item.href} nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-primary/10 text-primary shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon 
                          className={cn(
                            "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} 
                        />
                        {item.title}
                      </Link>
                    }
                  />
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <div className="relative w-full max-w-md hidden md:flex">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm khách hàng, lịch hẹn, dịch vụ..."
            className="w-full rounded-full bg-muted/50 pl-10 pr-4 focus-visible:bg-background transition-colors border-transparent focus-visible:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto shrink-0">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-background hover:ring-muted transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin&backgroundColor=f3f4f6" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@busbeauty.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
