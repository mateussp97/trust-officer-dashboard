import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2Icon } from "lucide-react";

interface ConfirmDenialContentProps {
  description: string;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function ConfirmDenialContent({
  description,
  onConfirm,
  isProcessing,
}: ConfirmDenialContentProps) {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm Denial</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isProcessing}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {isProcessing ? (
            <Loader2Icon className="size-4 animate-spin" aria-label="Loading" />
          ) : (
            "Confirm Denial"
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
