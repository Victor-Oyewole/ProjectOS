import { CheckCircle2, Clock, XCircle, AlertCircle, CircleDot } from "lucide-react";
import { Badge, type BadgeTone } from "../primitives/Badge";

// Doc 21 Section 3 names FeeStatusBadge explicitly as a composite example
// ("StudentCard, FeeStatusBadge, NotificationItem, AssignmentForm..."),
// and Doc 18 Section 2/4 require every status badge to pair color with an
// icon, never color alone. Each of these wraps the one shared Badge
// primitive with the exact status enum values from the DB check
// constraint that backs it (FeeRecord/TransferRequest/Attendance), so a
// schema change to the enum surfaces here as a type error, not a silent
// fallback render.
const ICON_SIZE = 14;

function iconFor(tone: BadgeTone) {
  switch (tone) {
    case "success":
      return <CheckCircle2 size={ICON_SIZE} />;
    case "warning":
      return <Clock size={ICON_SIZE} />;
    case "danger":
      return <XCircle size={ICON_SIZE} />;
    case "info":
      return <CircleDot size={ICON_SIZE} />;
    case "neutral":
      return <AlertCircle size={ICON_SIZE} />;
  }
}

export type FeeStatus = "Paid" | "Partial" | "Owing";
const FEE_TONE: Record<FeeStatus, BadgeTone> = { Paid: "success", Partial: "warning", Owing: "danger" };

export function FeeStatusBadge({ status }: { status: FeeStatus }) {
  const tone = FEE_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}

export type TransferStatus = "Pending" | "Approved" | "Denied";
const TRANSFER_TONE: Record<TransferStatus, BadgeTone> = { Pending: "warning", Approved: "success", Denied: "danger" };

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const tone = TRANSFER_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}

export type AttendanceStatus = "Present" | "Absent" | "Late";
const ATTENDANCE_TONE: Record<AttendanceStatus, BadgeTone> = { Present: "success", Absent: "danger", Late: "warning" };

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const tone = ATTENDANCE_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}

export type AssignmentStatus = "Published" | "Retracted";
const ASSIGNMENT_TONE: Record<AssignmentStatus, BadgeTone> = { Published: "success", Retracted: "neutral" };

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const tone = ASSIGNMENT_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}

export type DeletionRequestStatus = "pending" | "in_review" | "completed" | "denied";
const DELETION_TONE: Record<DeletionRequestStatus, BadgeTone> = {
  pending: "warning",
  in_review: "warning",
  completed: "success",
  denied: "danger",
};

export function DeletionRequestStatusBadge({ status }: { status: DeletionRequestStatus }) {
  const tone = DELETION_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}

export type ReportStatus = "draft" | "finalized" | "published";
const REPORT_TONE: Record<ReportStatus, BadgeTone> = { draft: "neutral", finalized: "warning", published: "success" };

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone = REPORT_TONE[status];
  return (
    <Badge tone={tone} icon={iconFor(tone)}>
      {status}
    </Badge>
  );
}
