"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KeyboardShortcutHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { keys: ["j"], description: "Move focus down" },
  { keys: ["k"], description: "Move focus up" },
  { keys: ["Enter"], description: "Open focused request" },
  { keys: ["Esc"], description: "Close drawer / clear selection" },
  { keys: ["x"], description: "Toggle selection on focused request" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutHelp({
  open,
  onOpenChange,
}: KeyboardShortcutHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate and act on requests using your keyboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.description}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-muted-foreground">
                {s.description}
              </span>
              <div className="flex gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 text-xs font-mono font-medium"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
