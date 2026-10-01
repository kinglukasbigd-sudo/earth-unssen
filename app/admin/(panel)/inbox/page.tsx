import { unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";
import type { ContactMessage } from "@/lib/types";
import { MessageList } from "@/components/admin/MessageList";

export default async function InboxPage() {
  let messages: ContactMessage[] = [];
  let unavailable = false;
  try {
    messages = await db.listMessages();
  } catch (error) {
    // Let Next.js's own signals (e.g. dynamic rendering via cookies) through.
    unstable_rethrow(error);
    console.error("[admin] inbox unavailable", error);
    unavailable = true;
  }
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow text-muted">Contact form</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">Inbox</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Messages sent from your Contact page. Open one to read it, then
            reply straight from your email app.
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
          {unread > 0 && ` · ${unread} unread`}
        </p>
      </div>
      <div className="mt-8">
        {unavailable ? (
          <p
            className="rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-4 py-3 text-sm text-[#85352a]"
            role="alert"
          >
            The inbox couldn’t be loaded. If you use Supabase, run{" "}
            <code className="font-mono text-xs">supabase/migrations/0005_profile_and_messages.sql</code>{" "}
            in the SQL editor, then reload.
          </p>
        ) : (
          <MessageList initialMessages={messages} />
        )}
      </div>
    </div>
  );
}
