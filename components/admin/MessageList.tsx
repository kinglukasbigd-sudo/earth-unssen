"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/types";
import { deleteMessageAction, setMessageReadAction } from "@/lib/actions/admin";
import { Button, ConfirmDialog } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  // Fixed zone so server and browser render the same text.
  timeZone: "UTC",
});

function replyHref(message: ContactMessage): string {
  const subject = `Re: ${message.subject || "Your message to Earth Unseen"}`;
  const quoted = message.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const body = `\n\n${message.name} wrote:\n${quoted}`;
  return `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function MessageList({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function setRead(id: string, read: boolean) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read } : m)));
    const result = await setMessageReadAction(id, read);
    if (!result.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: !read } : m)));
      toast({ title: "Couldn’t update", description: result.error });
      return;
    }
    router.refresh();
  }

  function toggle(message: ContactMessage) {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && !message.read) void setRead(message.id, true);
  }

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    const result = await deleteMessageAction(confirmId);
    setDeleting(false);
    if (result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== confirmId));
      toast({ title: "Message deleted" });
      router.refresh();
    } else {
      toast({ title: "Couldn’t delete", description: result.error });
    }
    setConfirmId(null);
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline px-6 py-20 text-center">
        <MailOpen className="mx-auto size-7 text-muted" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-2xl italic text-muted">No messages yet.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          When someone writes to you from the{" "}
          <a href="/contact" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            contact page
          </a>
          , their message will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-white/40">
        {messages.map((message) => {
          const open = openId === message.id;
          return (
            <li key={message.id} className={open ? "bg-white/70" : undefined}>
              <button
                type="button"
                onClick={() => toggle(message)}
                aria-expanded={open}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/60"
              >
                <span
                  aria-label={message.read ? "Read" : "Unread"}
                  className={`mt-2 size-2 shrink-0 rounded-full ${message.read ? "bg-transparent" : "bg-fall"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={`truncate text-sm ${message.read ? "text-ink/80" : "font-semibold text-ink"}`}>
                      {message.name}{" "}
                      <span className="ml-1 font-normal text-muted">{message.email}</span>
                    </span>
                    <time
                      dateTime={message.createdAt}
                      className="shrink-0 text-xs tabular-nums text-muted"
                    >
                      {dateTime.format(new Date(message.createdAt))} UTC
                    </time>
                  </span>
                  <span className={`mt-0.5 block truncate text-sm ${message.read ? "text-muted" : "text-ink"}`}>
                    {message.subject || <span className="italic">No subject</span>}
                    {!open && (
                      <span className="text-muted"> — {message.message.slice(0, 140)}</span>
                    )}
                  </span>
                </span>
              </button>

              {open && (
                <div className="px-5 pb-5 pl-11">
                  <p className="whitespace-pre-wrap break-words rounded-lg border border-hairline bg-paper px-4 py-3.5 text-sm leading-relaxed text-ink">
                    {message.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={replyHref(message)}
                      className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
                    >
                      <Reply className="size-4" />
                      Reply by email
                    </a>
                    <Button variant="ghost" onClick={() => setRead(message.id, !message.read)}>
                      {message.read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                      {message.read ? "Mark unread" : "Mark read"}
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmId(message.id)}>
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete this message?"
        body="It will be removed from your inbox permanently."
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
