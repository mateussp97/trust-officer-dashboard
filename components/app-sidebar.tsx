"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  InboxIcon,
  UserIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useDashboardStore, selectPendingCount } from "@/stores/dashboard-store";

const NAV_ITEMS = [
  {
    label: "Ledger",
    href: "/ledger",
    icon: BookOpenIcon,
  },
  {
    label: "Request Queue",
    href: "/queue",
    icon: InboxIcon,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const pendingCount = useDashboardStore(selectPendingCount);

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
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === "/queue" && pendingCount > 0 && (
                      <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
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
