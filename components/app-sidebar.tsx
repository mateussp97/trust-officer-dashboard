import Image from "next/image";
import { UserIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarResetButton } from "@/components/sidebar-reset-button";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-7 items-center justify-center">
            <Image
              src="/sava-emblem.webp"
              alt="Sava Trust"
              width={28}
              height={28}
              className="size-7 dark:brightness-[3]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Sava Trust
            </span>
            <span className="text-[11px] text-muted-foreground">
              Officer Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarResetButton />
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted">
            <UserIcon className="size-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">Margaret Chen</span>
            <span className="text-[11px] text-muted-foreground">
              Trust Officer
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
