import { CardGridSkeleton } from "@schoolos/ui";

export default function TransfersLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12">
      <CardGridSkeleton cards={3} />
    </main>
  );
}
