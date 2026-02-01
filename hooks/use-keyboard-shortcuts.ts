"use client";

import { useEffect, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
}

/**
 * Registers keyboard shortcuts that are ignored when focus is in
 * an input, textarea, select, or contentEditable element.
 *
 * The hook stores shortcuts in a ref so the consumer doesn't need
 * to memoize the array — the event listener always reads the latest.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      for (const s of shortcutsRef.current) {
        if (
          e.key === s.key &&
          !!s.ctrl === (e.ctrlKey || e.metaKey) &&
          !!s.shift === e.shiftKey
        ) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
