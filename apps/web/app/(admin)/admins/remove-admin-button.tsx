"use client";

import { useState, useTransition } from "react";
import { removeSecondAdmin } from "./actions";

export function RemoveAdminButton({ adminId }: { adminId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await removeSecondAdmin(adminId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-sm border border-danger/30 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-60 transition-colors duration-fast ease-standard"
      >
        Remove
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
