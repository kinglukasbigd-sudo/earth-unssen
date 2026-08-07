"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin, loginAdmin, logoutAdmin } from "@/lib/auth";
import { SEASONS } from "@/lib/seasons";
import type { Photo, PhotoPatch, Season } from "@/lib/types";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CAPTION = 280;
const MAX_BLUR_DATA = 30_000;

function isSeason(value: unknown): value is Season {
  return typeof value === "string" && (SEASONS as readonly string[]).includes(value);
}

function safeCaption(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_CAPTION).trim() : "";
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

function revalidateSite(): void {
  revalidatePath("/", "layout");
}

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const result = await loginAdmin(password, email || undefined);
  if (!result.ok) {
    return { error: result.error ?? "Login failed. Please try again." };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function uploadPhotoAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; photo?: Photo }> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    const season = formData.get("season");

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image to upload." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "That file is not an image." };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: "Image is too large (max 25 MB)." };
    }
    if (!isSeason(season)) {
      return { ok: false, error: "Choose a season for this photo." };
    }

    const width = Number(formData.get("width") ?? 0);
    const height = Number(formData.get("height") ?? 0);
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1
    ) {
      return { ok: false, error: "Could not read the image dimensions." };
    }

    const photo = await db.createPhoto({
      season,
      caption: safeCaption(formData.get("caption")),
      file,
      width,
      height,
      blurDataUrl: String(formData.get("blurDataUrl") ?? "").slice(
        0,
        MAX_BLUR_DATA,
      ),
    });

    revalidateSite();
    return { ok: true, photo };
  } catch (error) {
    console.error("[admin] upload failed", error);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

export async function setHeroBackgroundAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; photo?: Photo }> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image to upload." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "That file is not an image." };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: "Image is too large (max 25 MB)." };
    }

    const width = Number(formData.get("width") ?? 0);
    const height = Number(formData.get("height") ?? 0);
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1
    ) {
      return { ok: false, error: "Could not read the image dimensions." };
    }

    const photo = await db.setHeroBackground({
      season: "winter",
      caption: "",
      file,
      width,
      height,
      blurDataUrl: String(formData.get("blurDataUrl") ?? "").slice(
        0,
        MAX_BLUR_DATA,
      ),
    });

    revalidateSite();
    return { ok: true, photo };
  } catch (error) {
    console.error("[admin] hero background upload failed", error);
    return { ok: false, error: "Could not save the new background." };
  }
}

export async function clearHeroBackgroundAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    await db.clearHeroBackground();
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] hero background clear failed", error);
    return { ok: false, error: "Could not reset the background." };
  }
}

export async function updatePhotoAction(input: {
  id: string;
  caption?: string;
  season?: Season;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const patch: PhotoPatch = {};

    if (input.caption !== undefined) {
      patch.caption = safeCaption(input.caption);
    }
    if (input.season !== undefined) {
      if (!isSeason(input.season)) {
        return { ok: false, error: "Invalid season." };
      }
      patch.season = input.season;
    }

    await db.updatePhoto(input.id, patch);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] update failed", error);
    return { ok: false, error: "Could not save changes." };
  }
}
export async function deletePhotoAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await db.deletePhoto(id);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] delete failed", error);
    return { ok: false, error: "Could not delete this photo." };
  }
}

export async function reorderPhotosAction(
  orderedIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
      return { ok: false, error: "Invalid order." };
    }
    await db.reorderPhotos(orderedIds);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] reorder failed", error);
    return { ok: false, error: "Could not save the new order." };
  }
}
