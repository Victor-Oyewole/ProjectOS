import { TableSkeleton } from "@schoolos/ui";

export default function StudentsLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
