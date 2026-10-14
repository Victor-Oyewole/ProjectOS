"use client";

import { useEffect, useRef } from "react";
import { markAssignmentStatus } from "./actions";

export function MarkViewedOnMount({ enrollmentId, assignmentIds }: { enrollmentId: string; assignmentIds: string[] }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || assignmentIds.length === 0) return;
    fired.current = true;
    for (const assignmentId of assignmentIds) {
      markAssignmentStatus({ assignmentId, enrollmentId, status: "Viewed" });
    }
  }, [enrollmentId, assignmentIds]);
  return null;
}
