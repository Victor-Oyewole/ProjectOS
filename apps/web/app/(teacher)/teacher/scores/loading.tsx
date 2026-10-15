import { TableSkeleton } from "@schoolos/ui";

export default function ScoresLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <TableSkeleton rows={6} columns={5} />
    </main>
  );
}
