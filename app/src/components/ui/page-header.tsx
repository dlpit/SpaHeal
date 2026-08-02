import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-[var(--spa-text-primary)] flex items-center gap-2">
          {Icon && <Icon className="h-8 w-8 text-[var(--spa-champagne-300)]" />}
          {title}
        </h2>
        {description && (
          <p className="text-[var(--spa-text-secondary)] mt-2">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}
