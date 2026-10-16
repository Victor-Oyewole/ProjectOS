"use client";

import { useState } from "react";

export function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/activate/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-sm border border-border px-3 py-1 text-xs font-medium hover:bg-primary-light transition-colors duration-fast ease-standard"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
