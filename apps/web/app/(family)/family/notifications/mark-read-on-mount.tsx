"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsRead } from "./actions";

// Fires once per page load -- the list above already rendered with each
// notification's read_status as of the fetch, so marking them read now
// doesn't change what's on screen, only the bell badge next time it's
// queried (Doc 8's "mark-as-read-on-open").
export function MarkReadOnMount({ hasUnread }: { hasUnread: boolean }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || !hasUnread) return;
    fired.current = true;
    markAllNotificationsRead();
  }, [hasUnread]);
  return null;
}
