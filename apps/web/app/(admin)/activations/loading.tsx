import { TableSkeleton } from "@schoolos/ui";

export default function ActivationsLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <TableSkeleton rows={4} columns={3} />
    </main>
  );
}
