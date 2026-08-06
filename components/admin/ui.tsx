"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import type { Season } from "@/lib/types";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const styles: Record<string, string> = {
    primary: "bg-ink text-paper hover:bg-ink/85",
    ghost:
      "border border-hairline bg-transparent text-ink hover:border-ink/40 hover:bg-paper-deep",
    danger: "bg-[#9c3f2d] text-paper hover:bg-[#85352a]",
  };
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...props} />
  );
}

export function Field({
  label,
  id,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-hairline bg-white/70 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
        {...props}
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SeasonSelect({
  value,
  onChange,
  id,
  className = "",
}: {
  value: Season;
  onChange: (season: Season) => void;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Season)}
        className="w-full cursor-pointer appearance-none rounded-md border border-hairline bg-white/70 py-2.5 pl-3.5 pr-9 text-sm text-ink outline-none transition-colors focus:border-ink"
      >
        {SEASONS.map((season) => (
          <option key={season} value={season}>
            {seasonInfo(season).label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] grid place-items-center bg-ink/40 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-sm rounded-xl border border-hairline bg-paper p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#9c3f2d]/10 text-[#9c3f2d]">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h2 className="font-display text-xl">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancel} disabled={pending}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} disabled={pending}>
                {pending ? <Spinner /> : null}
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
