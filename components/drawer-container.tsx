"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useDrawerStore } from "@/stores/drawer-store";

export function DrawerContainer() {
  const content = useDrawerStore((s) => s.content);
  const isOpen = useDrawerStore((s) => s.isOpen);
  const closeDrawer = useDrawerStore((s) => s.closeDrawer);

  return (
    <Drawer
      direction="right"
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <DrawerContent className="ml-auto h-full min-w-full! sm:min-w-[640px]! rounded-none border-l fixed inset-y-0 right-0 sm:max-w-[640px] flex flex-col p-0 gap-0">
        {content}
      </DrawerContent>
    </Drawer>
  );
}
