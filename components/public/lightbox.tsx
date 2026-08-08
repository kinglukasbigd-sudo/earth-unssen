"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/types";
import { seasonInfo } from "@/lib/seasons";
import { PhotoImage } from "@/components/public/PhotoImage";

interface LightboxContextValue {
  open: (photos: Photo[], index: number) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const openLightbox = useCallback((photos: Photo[], at: number) => {
    if (!photos.length) return;
    setItems(photos);
    setIndex(Math.max(0, Math.min(at, photos.length - 1)));
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const current = items[index];

  return (
    <LightboxContext.Provider value={useMemo(() => ({ open: openLightbox }), [openLightbox])}>
      {children}

      <AnimatePresence>
        {open && current && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-[120] flex flex-col text-paper"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-ink/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            />

            <motion.button
              onClick={close}
              aria-label="Close viewer"
              className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full bg-paper/10 text-paper transition hover:bg-paper/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <X className="size-5" />
            </motion.button>

            {items.length > 1 && (
              <>
                <motion.button
                  onClick={() => step(-1)}
                  aria-label="Previous photograph"
                  className="absolute left-3 top-1/2 z-20 -translate-y-1/2 grid size-11 place-items-center rounded-full bg-paper/10 text-paper transition hover:bg-paper/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <ChevronLeft className="size-6" />
                </motion.button>
                <motion.button
                  onClick={() => step(1)}
                  aria-label="Next photograph"
                  className="absolute right-3 top-1/2 z-20 -translate-y-1/2 grid size-11 place-items-center rounded-full bg-paper/10 text-paper transition hover:bg-paper/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <ChevronRight className="size-6" />
                </motion.button>
              </>
            )}

            <div className="flex flex-1 items-center justify-center overflow-hidden px-4 py-20 sm:px-16">
              <motion.div
                key={current.id}
                className="relative h-full w-full max-w-5xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <PhotoImage
                  photo={current}
                  fill
                  priority
                  sizes="(min-width: 1024px) 72vw, 92vw"
                  quality={92}
                  className="object-contain"
                />
              </motion.div>
            </div>

            <motion.div
              className="flex items-center justify-between gap-4 border-t border-paper/10 px-5 py-4 sm:px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <div className="min-w-0">
                <p className="truncate font-display text-lg">
                  {current.caption || "Untitled"}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-paper/50">
                  {seasonInfo(current.season).label}
                </p>
              </div>
              <p className="shrink-0 text-xs tabular-nums tracking-widest text-paper/50">
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
}
