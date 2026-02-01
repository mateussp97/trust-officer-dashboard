"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SiteHeader({ title, description, actions }: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-sm font-semibold">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}
