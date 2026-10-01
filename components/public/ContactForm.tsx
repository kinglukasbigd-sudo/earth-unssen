"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { sendMessageAction, type ContactState } from "@/lib/actions/contact";

const initialState: ContactState = {};

const INPUT =
  "w-full rounded-md border border-hairline bg-white/70 px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-ink";
const LABEL = "mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted";
const UUID = /^[0-9a-f-]{36}$/i;

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendMessageAction, initialState);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // "Enquire" links from a photograph's page pre-fill the form with its link.
  useEffect(() => {
    const photo = new URLSearchParams(window.location.search).get("photo");
    if (!photo || !UUID.test(photo)) return;
    if (subjectRef.current && !subjectRef.current.value) {
      subjectRef.current.value = "Photograph enquiry";
    }
    if (messageRef.current && !messageRef.current.value) {
      messageRef.current.value = `About this photograph: ${window.location.origin}/photos/${photo}\n\n`;
    }
  }, []);

  if (state.ok) {
    return (
      <motion.div
        className="rounded-xl border border-hairline bg-white/50 px-6 py-14 text-center sm:px-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role="status"
      >
        <CheckCircle2 className="mx-auto size-8 text-spring-deep" strokeWidth={1.5} />
        <h2 className="mt-5 font-display text-3xl tracking-tight">Thank you.</h2>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
          Your message is on its way. I read everything and will reply to
          the email address you gave.
        </p>
      </motion.div>
    );
  }

  const values = state.values;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL}>
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            defaultValue={values?.name}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={values?.email}
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={LABEL}>
          Subject <span className="normal-case tracking-normal text-ink-soft">(optional)</span>
        </label>
        <input
          ref={subjectRef}
          id="contact-subject"
          name="subject"
          maxLength={160}
          placeholder="Print, licensing, commission, or just hello"
          defaultValue={values?.subject}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL}>
          Message
        </label>
        <textarea
          ref={messageRef}
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          defaultValue={values?.message}
          className={`${INPUT} resize-y leading-relaxed`}
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <p
          className="rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-colors hover:bg-ink/85 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </form>
  );
}
