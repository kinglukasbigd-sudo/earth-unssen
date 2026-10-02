"use server";

import { db } from "@/lib/db";
import { EMAIL_PATTERN } from "@/lib/profile";
import { allowAttempt, clientIp } from "@/lib/rate-limit";

export interface ContactState {
  ok?: boolean;
  error?: string;
  /** Field values echoed back so a failed submission keeps the visitor's text. */
  values?: { name: string; email: string; subject: string; message: string };
}

const LIMITS = { name: 120, email: 254, subject: 160, message: 5000 };
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 60 * 60 * 1000;

function field(formData: FormData, key: keyof typeof LIMITS): string {
  return String(formData.get(key) ?? "").trim().slice(0, LIMITS[key]);
}

export async function sendMessageAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    subject: field(formData, "subject"),
    message: field(formData, "message"),
  };

  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("company") ?? "")) return { ok: true };

  if (!values.name) return { error: "Please add your name.", values };
  if (!EMAIL_PATTERN.test(values.email)) {
    return { error: "Please add an email address so I can reply.", values };
  }
  if (values.message.length < 10) {
    return { error: "Your message looks a little short.", values };
  }

  if (!allowAttempt(`contact:${await clientIp()}`, CONTACT_LIMIT, CONTACT_WINDOW_MS)) {
    return {
      error: "Thanks — you’ve sent several messages already. Please try again later.",
      values,
    };
  }

  try {
    await db.createMessage(values);
    return { ok: true };
  } catch (error) {
    console.error("[contact] message failed", error);
    return {
      error: "Sorry, the message couldn’t be sent. Please try again in a moment.",
      values,
    };
  }
}
