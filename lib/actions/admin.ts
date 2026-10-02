"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  changeAdminPassword,
  isAdmin,
  loginAdmin,
  logoutAdmin,
} from "@/lib/auth";
import { SEASONS } from "@/lib/seasons";
import { EMAIL_PATTERN, normalizeProfile } from "@/lib/profile";
import type { Photo, PhotoDraft, PhotoPatch, Profile, Season } from "@/lib/types";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CAPTION = 280;
const MAX_BLUR_DATA = 30_000;
const MAX_TAGLINE = 140;
const MAX_DESCRIPTION = 1000;

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

async function uploadSettingsPhoto(
  save: (draft: PhotoDraft) => Promise<Photo>,
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

    const photo = await save({
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
    console.error("[admin] settings photo upload failed", error);
    return { ok: false, error: "Could not save the new background." };
  }
}

export async function setHeroBackgroundAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; photo?: Photo }> {
  return uploadSettingsPhoto((draft) => db.setHeroBackground(draft), formData);
}

export async function setIntroPhotoAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; photo?: Photo }> {
  return uploadSettingsPhoto((draft) => db.setIntroPhoto(draft), formData);
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

const HEX_COLOR = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

function normalizeColor(value: string): string | null {
  const hex = value.trim();
  if (!HEX_COLOR.test(hex)) return null;
  if (hex.length === 4) {
    return `#${hex
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  return hex.toLowerCase();
}

export async function setIntroColorAction(
  color: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const hex = normalizeColor(color);
    if (!hex) return { ok: false, error: "Choose a valid colour." };
    await db.setIntroColor(hex);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] intro colour failed", error);
    return { ok: false, error: "Could not save the colour." };
  }
}

export async function clearIntroBackgroundAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    await db.clearIntroBackground();
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] intro background clear failed", error);
    return { ok: false, error: "Could not reset the intro cover." };
  }
}

export async function setSeasonHeroAction(
  season: Season,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; photo?: Photo }> {
  if (!isSeason(season)) return { ok: false, error: "Unknown season." };
  return uploadSettingsPhoto(
    (draft) => db.setSeasonHero(season, draft),
    formData,
  );
}

export async function clearSeasonHeroAction(season: Season): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    if (!isSeason(season)) return { ok: false, error: "Unknown season." };
    await db.clearSeasonHero(season);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] season hero clear failed", error);
    return { ok: false, error: "Could not reset the hero photograph." };
  }
}

export async function setSeasonCoverAction(
  season: Season,
  photoId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!isSeason(season)) return { ok: false, error: "Unknown season." };

    const normalized = photoId?.trim() ? photoId.trim() : null;
    if (normalized) {
      const photo = await db.getPhoto(normalized);
      if (!photo || photo.season !== season) {
        return {
          ok: false,
          error: "That photograph doesn’t belong to this season.",
        };
      }
    }

    await db.setSeasonCover(season, normalized);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] season cover failed", error);
    return { ok: false, error: "Could not save the cover photograph." };
  }
}

export async function updateSeasonTextAction(
  season: Season,
  tagline: string,
  description: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!isSeason(season)) return { ok: false, error: "Unknown season." };

    const tag = (typeof tagline === "string" ? tagline : "")
      .trim()
      .slice(0, MAX_TAGLINE);
    const desc = (typeof description === "string" ? description : "")
      .trim()
      .slice(0, MAX_DESCRIPTION);

    await db.updateSeasonText(season, tag ? tag : null, desc ? desc : null);
    revalidateSite();
    return { ok: true };
  } catch (error) {
    console.error("[admin] season text failed", error);
    return { ok: false, error: "Could not save the season copy." };
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

export async function updateProfileAction(
  input: Profile,
): Promise<{ ok: boolean; error?: string; profile?: Profile }> {
  try {
    await requireAdmin();
    const profile = normalizeProfile(input);
    if (profile.email && !EMAIL_PATTERN.test(profile.email)) {
      return { ok: false, error: "That email address doesn’t look right." };
    }
    await db.updateProfile(profile);
    revalidateSite();
    return { ok: true, profile };
  } catch (error) {
    console.error("[admin] profile update failed", error);
    return { ok: false, error: "Could not save the profile." };
  }
}

export async function setMessageReadAction(
  id: string,
  read: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (typeof id !== "string" || typeof read !== "boolean") {
      return { ok: false, error: "Invalid message." };
    }
    await db.setMessageRead(id, read);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[admin] message update failed", error);
    return { ok: false, error: "Could not update the message." };
  }
}

export async function deleteMessageAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (typeof id !== "string") return { ok: false, error: "Invalid message." };
    await db.deleteMessage(id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[admin] message delete failed", error);
    return { ok: false, error: "Could not delete the message." };
  }
}

export interface PasswordState {
  ok?: boolean;
  error?: string;
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) {
    return { error: "The new passwords don’t match." };
  }
  try {
    const result = await changeAdminPassword(current, next);
    if (!result.ok) return { error: result.error ?? "Could not change the password." };
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[admin] password change failed", error);
    return { error: "Could not change the password." };
  }
}
