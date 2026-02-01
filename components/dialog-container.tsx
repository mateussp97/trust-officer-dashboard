"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useDialogStore } from "@/stores/dialog-store";

export function DialogContainer() {
  const content = useDialogStore((s) => s.content);
  const isOpen = useDialogStore((s) => s.isOpen);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <AlertDialogContent>{content}</AlertDialogContent>
    </AlertDialog>
  );
}
