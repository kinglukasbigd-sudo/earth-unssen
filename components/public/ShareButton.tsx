"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Uses the native share sheet where available (phones), otherwise copies
 * the page link to the clipboard.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unavailable — fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm text-ink/85 transition-colors hover:border-ink/40 hover:text-ink"
    >
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
