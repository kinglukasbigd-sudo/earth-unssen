import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { SEASONS } from "@/lib/seasons";
import type {
  IntroBackground,
  Photo,
  PhotoDraft,
  PhotoPatch,
  Season,
  SeasonSettings,
} from "@/lib/types";

const BUCKET = "photos";

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Session-authenticated client for writes; requires the admin's cookies. */
async function adminSupabase(): Promise<SupabaseClient> {
  return createSupabaseServerClient();
}

interface SupabaseRow {
  id: string;
  season: Season;
  caption: string;
  image_path: string;
  width: number;
  height: number;
  blur_data_url: string;
  sort_order: number;
  created_at: string;
}

function publicUrl(imagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(
    imagePath,
  )}`;
}

function toPhoto(row: SupabaseRow): Photo {
  return {
    id: row.id,
    season: row.season,
    caption: row.caption,
    imagePath: row.image_path,
    imageUrl: publicUrl(row.image_path),
    width: row.width,
    height: row.height,
    blurDataUrl: row.blur_data_url,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

interface SettingsRow {
  hero_image_path: string | null;
  hero_image_width: number | null;
  hero_image_height: number | null;
  hero_blur_data_url: string | null;
  intro_mode: string;
  intro_image_path: string | null;
  intro_image_width: number | null;
  intro_image_height: number | null;
  intro_blur_data_url: string | null;
  intro_color: string | null;
}

interface SeasonSettingsRow {
  season: Season;
  hero_image_path: string | null;
  hero_image_width: number | null;
  hero_image_height: number | null;
  hero_blur_data_url: string | null;
  cover_photo_id: string | null;
  tagline: string | null;
  description: string | null;
}

function settingsPhoto(
  path: string,
  width: number,
  height: number,
  blurDataUrl: string,
): Photo {
  return {
    id: "settings",
    season: "winter",
    caption: "",
    imagePath: path,
    imageUrl: publicUrl(path),
    width,
    height,
    blurDataUrl,
    sortOrder: 0,
    createdAt: "",
  };
}

const SEASON_SETTINGS_COLUMNS =
  "season, hero_image_path, hero_image_width, hero_image_height, hero_blur_data_url, cover_photo_id, tagline, description";

function toSeasonSettings(
  season: Season,
  row: Partial<SeasonSettingsRow> | null,
): SeasonSettings {
  return {
    season,
    hero: row?.hero_image_path
      ? settingsPhoto(
          row.hero_image_path,
          row.hero_image_width ?? 2048,
          row.hero_image_height ?? 1365,
          row.hero_blur_data_url ?? "",
        )
      : null,
    coverPhotoId: row?.cover_photo_id ?? null,
    tagline: row?.tagline ?? null,
    description: row?.description ?? null,
  };
}

const INTRO_COLUMNS =
  "intro_mode, intro_image_path, intro_image_width, intro_image_height, intro_blur_data_url, intro_color";

function introBackgroundFrom(row: Partial<SettingsRow> | null): IntroBackground {
  const mode =
    row?.intro_mode === "photo" || row?.intro_mode === "color"
      ? row.intro_mode
      : "auto";
  return {
    mode,
    color:
      mode === "color" && row?.intro_color ? row.intro_color : null,
    photo:
      mode === "photo" && row?.intro_image_path
        ? settingsPhoto(
            row.intro_image_path,
            row.intro_image_width ?? 2048,
            row.intro_image_height ?? 1365,
            row.intro_blur_data_url ?? "",
          )
        : null,
  };
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const supabaseDb = {
  async listPhotos(season?: Season): Promise<Photo[]> {
    let query = supabase()
      .from("photos")
      .select("*")
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (season) query = query.eq("season", season);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list photos: ${error.message}`);
    return (data as SupabaseRow[]).map(toPhoto);
  },

  async getPhoto(id: string): Promise<Photo | null> {
    const { data, error } = await supabase()
      .from("photos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to get photo: ${error.message}`);
    return data ? toPhoto(data as SupabaseRow) : null;
  },

  async getLatest(): Promise<Photo | null> {
    const { data, error } = await supabase()
      .from("photos")
      .select("*")
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to get latest photo: ${error.message}`);
    return data ? toPhoto(data as SupabaseRow) : null;
  },

  async getCover(season: Season): Promise<Photo | null> {
    const { data, error } = await supabase()
      .from("photos")
      .select("*")
      .eq("season", season)
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to get cover: ${error.message}`);
    return data ? toPhoto(data as SupabaseRow) : null;
  },

  async createPhoto(draft: PhotoDraft): Promise<Photo> {
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const objectPath = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await draft.file.arrayBuffer());
    const client = await adminSupabase();

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: draft.file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data, error } = await client
      .from("photos")
      .insert({
        season: draft.season,
        caption: draft.caption,
        image_path: objectPath,
        width: draft.width,
        height: draft.height,
        blur_data_url: draft.blurDataUrl,
        sort_order: Date.now(),
      })
      .select()
      .single();
    if (error) {
      await client.storage
        .from(BUCKET)
        .remove([objectPath])
        .catch(() => {});
      throw new Error(`Failed to save photo: ${error.message}`);
    }
    return toPhoto(data as SupabaseRow);
  },

  async updatePhoto(id: string, patch: PhotoPatch): Promise<Photo | null> {
    const client = await adminSupabase();
    const { data, error } = await client
      .from("photos")
      .update({
        ...(patch.caption !== undefined ? { caption: patch.caption } : {}),
        ...(patch.season !== undefined ? { season: patch.season } : {}),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update photo: ${error.message}`);
    return data ? toPhoto(data as SupabaseRow) : null;
  },

  async deletePhoto(id: string): Promise<void> {
    const photo = await this.getPhoto(id);
    if (!photo) return;
    const client = await adminSupabase();
    const { error } = await client.from("photos").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete photo: ${error.message}`);
    await client.storage
      .from(BUCKET)
      .remove([photo.imagePath])
      .catch(() => {});
  },

  async reorderPhotos(orderedIds: string[]): Promise<void> {
    const client = await adminSupabase();
    const { data, error: listError } = await client
      .from("photos")
      .select("id");
    if (listError) throw new Error(`Failed to list photos: ${listError.message}`);
    const count = (data as { id: string }[]).length;
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await client
        .from("photos")
        .update({ sort_order: (count - index) * 10 })
        .eq("id", id);
      if (error) throw new Error(`Failed to reorder photos: ${error.message}`);
    }
  },

  async getHeroBackground(): Promise<Photo | null> {
    const { data, error } = await supabase()
      .from("settings")
      .select(
        "hero_image_path, hero_image_width, hero_image_height, hero_blur_data_url",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error) return null;
    const settings = data as SettingsRow | null;
    if (!settings?.hero_image_path) return null;
    return settingsPhoto(
      settings.hero_image_path,
      settings.hero_image_width ?? 2048,
      settings.hero_image_height ?? 1365,
      settings.hero_blur_data_url ?? "",
    );
  },

  async setHeroBackground(draft: PhotoDraft): Promise<Photo> {
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const objectPath = `hero-${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await draft.file.arrayBuffer());
    const client = await adminSupabase();

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: draft.file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: previous, error: readError } = await client
      .from("settings")
      .select("hero_image_path")
      .eq("id", 1)
      .maybeSingle();
    if (readError) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to read settings: ${readError.message}`);
    }

    const { error } = await client
      .from("settings")
      .update({
        hero_image_path: objectPath,
        hero_image_width: draft.width,
        hero_image_height: draft.height,
        hero_blur_data_url: draft.blurDataUrl,
      })
      .eq("id", 1);
    if (error) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to save hero background: ${error.message}`);
    }

    if (previous?.hero_image_path && previous.hero_image_path !== objectPath) {
      await client.storage
        .from(BUCKET)
        .remove([previous.hero_image_path])
        .catch(() => {});
    }

    return settingsPhoto(
      objectPath,
      draft.width,
      draft.height,
      draft.blurDataUrl,
    );
  },

  async clearHeroBackground(): Promise<void> {
    const client = await adminSupabase();
    const { data, error: readError } = await client
      .from("settings")
      .select("hero_image_path")
      .eq("id", 1)
      .maybeSingle();
    if (readError) throw new Error(`Failed to read settings: ${readError.message}`);

    const { error } = await client
      .from("settings")
      .update({
        hero_image_path: null,
        hero_image_width: null,
        hero_image_height: null,
        hero_blur_data_url: null,
      })
      .eq("id", 1);
    if (error) throw new Error(`Failed to clear hero background: ${error.message}`);

    if (data?.hero_image_path) {
      await client.storage
        .from(BUCKET)
        .remove([data.hero_image_path])
        .catch(() => {});
    }
  },

  async getIntroBackground(): Promise<IntroBackground> {
    const { data, error } = await supabase()
      .from("settings")
      .select(INTRO_COLUMNS)
      .eq("id", 1)
      .maybeSingle();
    if (error) return introBackgroundFrom(null);
    return introBackgroundFrom(data as Partial<SettingsRow> | null);
  },

  async setIntroPhoto(draft: PhotoDraft): Promise<Photo> {
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const objectPath = `intro-${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await draft.file.arrayBuffer());
    const client = await adminSupabase();

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: draft.file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: previous, error: readError } = await client
      .from("settings")
      .select("intro_image_path")
      .eq("id", 1)
      .maybeSingle();
    if (readError) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to read settings: ${readError.message}`);
    }

    const { error } = await client
      .from("settings")
      .update({
        intro_mode: "photo",
        intro_image_path: objectPath,
        intro_image_width: draft.width,
        intro_image_height: draft.height,
        intro_blur_data_url: draft.blurDataUrl,
        intro_color: null,
      })
      .eq("id", 1);
    if (error) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to save intro cover: ${error.message}`);
    }

    const previousPath = (previous as Partial<SettingsRow> | null)
      ?.intro_image_path;
    if (previousPath && previousPath !== objectPath) {
      await client.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => {});
    }

    return settingsPhoto(
      objectPath,
      draft.width,
      draft.height,
      draft.blurDataUrl,
    );
  },

  async setIntroColor(color: string): Promise<void> {
    const client = await adminSupabase();
    const { data: previous, error: readError } = await client
      .from("settings")
      .select("intro_image_path")
      .eq("id", 1)
      .maybeSingle();
    if (readError) throw new Error(`Failed to read settings: ${readError.message}`);

    const { error } = await client
      .from("settings")
      .update({
        intro_mode: "color",
        intro_color: color,
        intro_image_path: null,
        intro_image_width: null,
        intro_image_height: null,
        intro_blur_data_url: null,
      })
      .eq("id", 1);
    if (error) throw new Error(`Failed to save intro cover: ${error.message}`);

    const previousPath = (previous as Partial<SettingsRow> | null)
      ?.intro_image_path;
    if (previousPath) {
      await client.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => {});
    }
  },

  async clearIntroBackground(): Promise<void> {
    const client = await adminSupabase();
    const { data, error: readError } = await client
      .from("settings")
      .select("intro_image_path")
      .eq("id", 1)
      .maybeSingle();
    if (readError) throw new Error(`Failed to read settings: ${readError.message}`);

    const { error } = await client
      .from("settings")
      .update({
        intro_mode: "auto",
        intro_color: null,
        intro_image_path: null,
        intro_image_width: null,
        intro_image_height: null,
        intro_blur_data_url: null,
      })
      .eq("id", 1);
    if (error) throw new Error(`Failed to reset intro cover: ${error.message}`);

    const previousPath = (data as Partial<SettingsRow> | null)
      ?.intro_image_path;
    if (previousPath) {
      await client.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => {});
    }
  },

  async getSeasonSettings(season: Season): Promise<SeasonSettings> {
    const { data, error } = await supabase()
      .from("season_settings")
      .select(SEASON_SETTINGS_COLUMNS)
      .eq("season", season)
      .maybeSingle();
    if (error) {
      return { season, hero: null, coverPhotoId: null, tagline: null, description: null };
    }
    return toSeasonSettings(season, data as Partial<SeasonSettingsRow> | null);
  },

  async getAllSeasonSettings(): Promise<SeasonSettings[]> {
    const { data, error } = await supabase()
      .from("season_settings")
      .select(SEASON_SETTINGS_COLUMNS);
    if (error) {
      return SEASONS.map((season) => toSeasonSettings(season, null));
    }
    const rows = (data as Partial<SeasonSettingsRow>[] | null) ?? [];
    const bySeason = new Map(rows.map((row) => [row.season, row]));
    return SEASONS.map((season) =>
      toSeasonSettings(season, bySeason.get(season) ?? null),
    );
  },

  async setSeasonHero(season: Season, draft: PhotoDraft): Promise<Photo> {
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const objectPath = `season-${season}-${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await draft.file.arrayBuffer());
    const client = await adminSupabase();

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: draft.file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: previous, error: readError } = await client
      .from("season_settings")
      .select("hero_image_path")
      .eq("season", season)
      .maybeSingle();
    if (readError) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to read season settings: ${readError.message}`);
    }

    const { error } = await client
      .from("season_settings")
      .upsert(
        {
          season,
          hero_image_path: objectPath,
          hero_image_width: draft.width,
          hero_image_height: draft.height,
          hero_blur_data_url: draft.blurDataUrl,
        },
        { onConflict: "season" },
      );
    if (error) {
      await client.storage.from(BUCKET).remove([objectPath]).catch(() => {});
      throw new Error(`Failed to save season hero: ${error.message}`);
    }

    const previousPath = (previous as Partial<SeasonSettingsRow> | null)
      ?.hero_image_path;
    if (previousPath && previousPath !== objectPath) {
      await client.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => {});
    }

    return settingsPhoto(
      objectPath,
      draft.width,
      draft.height,
      draft.blurDataUrl,
    );
  },

  async clearSeasonHero(season: Season): Promise<void> {
    const client = await adminSupabase();
    const { data, error: readError } = await client
      .from("season_settings")
      .select("hero_image_path")
      .eq("season", season)
      .maybeSingle();
    if (readError) {
      throw new Error(`Failed to read season settings: ${readError.message}`);
    }

    const { error } = await client
      .from("season_settings")
      .upsert(
        {
          season,
          hero_image_path: null,
          hero_image_width: null,
          hero_image_height: null,
          hero_blur_data_url: null,
        },
        { onConflict: "season" },
      );
    if (error) throw new Error(`Failed to clear season hero: ${error.message}`);

    const previousPath = (data as Partial<SeasonSettingsRow> | null)
      ?.hero_image_path;
    if (previousPath) {
      await client.storage
        .from(BUCKET)
        .remove([previousPath])
        .catch(() => {});
    }
  },

  async setSeasonCover(season: Season, photoId: string | null): Promise<void> {
    const client = await adminSupabase();
    const { error } = await client
      .from("season_settings")
      .upsert({ season, cover_photo_id: photoId }, { onConflict: "season" });
    if (error) throw new Error(`Failed to save season cover: ${error.message}`);
  },

  async updateSeasonText(
    season: Season,
    tagline: string | null,
    description: string | null,
  ): Promise<void> {
    const client = await adminSupabase();
    const { error } = await client
      .from("season_settings")
      .upsert({ season, tagline, description }, { onConflict: "season" });
    if (error) throw new Error(`Failed to save season text: ${error.message}`);
  },
};
