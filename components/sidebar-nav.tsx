"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, InboxIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  useDashboardStore,
  selectPendingCount,
} from "@/stores/dashboard-store";

const NAV_ITEMS = [
  { label: "Ledger", href: "/ledger", icon: BookOpenIcon },
  { label: "Request Queue", href: "/queue", icon: InboxIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const pendingCount = useDashboardStore(selectPendingCount);

  return (
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
  );
}
