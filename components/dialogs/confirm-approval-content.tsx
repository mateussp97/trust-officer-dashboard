import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2Icon } from "lucide-react";

interface ConfirmApprovalContentProps {
  description: string;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function ConfirmApprovalContent({
  description,
  onConfirm,
  isProcessing,
}: ConfirmApprovalContentProps) {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <Loader2Icon className="size-4 animate-spin" aria-label="Loading" />
          ) : (
            "Confirm Approval"
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
