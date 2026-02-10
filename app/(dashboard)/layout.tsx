import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DrawerContainer } from "@/components/drawer-container";
import { DialogContainer } from "@/components/dialog-container";
import { DashboardInitializer } from "@/components/dashboard-initializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardInitializer />
      <AppSidebar />
      <SidebarInset>
        <main id="main-content">{children}</main>
      </SidebarInset>
      <DrawerContainer />
      <DialogContainer />
    </SidebarProvider>
  );
}
