"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { NavItem } from "@/types";
import * as Icons from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card px-4 py-6 md:flex">
      <div className="flex h-[60px] items-center px-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <Icons.Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bu's Beauty
          </span>
        </Link>
      </div>
      
      <div className="mt-8 flex flex-col gap-1 flex-1 overflow-y-auto pr-2">
        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Menu chính
        </div>
        {(NAV_ITEMS as unknown as NavItem[]).map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
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
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-6 px-2">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm border border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Icons.Headset className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cần hỗ trợ?</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Liên hệ với đội ngũ kỹ thuật nếu bạn gặp vấn đề.
          </p>
          <button className="w-full rounded-lg bg-background border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </aside>
  );
}
