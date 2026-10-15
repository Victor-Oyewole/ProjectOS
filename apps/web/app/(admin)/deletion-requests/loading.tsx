import { CardGridSkeleton } from "@schoolos/ui";

export default function DeletionRequestsLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <CardGridSkeleton cards={3} />
    </main>
  );
}
