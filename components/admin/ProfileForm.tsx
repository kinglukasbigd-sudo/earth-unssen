"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import type { Profile } from "@/lib/types";
import { PROFILE_LIMITS } from "@/lib/profile";
import { updateProfileAction } from "@/lib/actions/admin";
import { Button, Field, Spinner } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [saved, setSaved] = useState<Profile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = (Object.keys(profile) as (keyof Profile)[]).some(
    (key) => profile[key] !== saved[key],
  );

  function update(key: keyof Profile) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setProfile((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await updateProfileAction(profile);
    setSaving(false);
    if (result.ok && result.profile) {
      setProfile(result.profile);
      setSaved(result.profile);
      toast({
        title: "Profile saved",
        description: "About, Contact and the footer now show the new details.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the profile.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-5">
      <div className="space-y-8 lg:col-span-3">
        <fieldset className="rounded-xl border border-hairline bg-white/40 p-6">
          <legend className="eyebrow px-1 text-muted">Who you are</legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2">
            <Field
              label="Name"
              id="profile-name"
              value={profile.name}
              onChange={update("name")}
              maxLength={PROFILE_LIMITS.name}
              placeholder="Your name"
              hint="Shown on About and in the footer. Leave blank to stay anonymous."
            />
            <Field
              label="Based in"
              id="profile-location"
              value={profile.location}
              onChange={update("location")}
              maxLength={PROFILE_LIMITS.location}
              placeholder="e.g. Peak District, UK"
            />
          </div>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Biography
            </span>
            <textarea
              value={profile.bio}
              onChange={update("bio")}
              maxLength={PROFILE_LIMITS.bio}
              rows={8}
              placeholder="A few paragraphs about you and your work. Leave a blank line between paragraphs."
              className="w-full resize-y rounded-md border border-hairline bg-white/70 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-ink"
            />
            <span className="mt-1.5 flex justify-between text-xs text-muted">
              <span>Appears on the About page above “How the work gets made”.</span>
              <span className="tabular-nums">
                {profile.bio.length}/{PROFILE_LIMITS.bio}
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="rounded-xl border border-hairline bg-white/40 p-6">
          <legend className="eyebrow px-1 text-muted">How to reach you</legend>
          <div className="mt-2 space-y-5">
            <Field
              label="Public email"
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={update("email")}
              maxLength={PROFILE_LIMITS.email}
              placeholder="hello@example.com"
              hint="Shown on the Contact page. The contact form works without it."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Instagram"
                id="profile-instagram"
                value={profile.instagram}
                onChange={update("instagram")}
                maxLength={PROFILE_LIMITS.instagram}
                placeholder="@yourhandle"
              />
              <Field
                label="Website"
                id="profile-website"
                value={profile.website}
                onChange={update("website")}
                maxLength={PROFILE_LIMITS.website}
                placeholder="shop.example.com"
              />
            </div>
            <Field
              label="Availability"
              id="profile-availability"
              value={profile.availability}
              onChange={update("availability")}
              maxLength={PROFILE_LIMITS.availability}
              placeholder="Open for print sales, licensing and commissions."
              hint="One line shown on Contact and About."
            />
          </div>
        </fieldset>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-32 rounded-xl border border-hairline bg-white/40 p-6">
          <p className="eyebrow text-muted">Publish</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            {dirty ? "Unsaved changes" : "Everything saved"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your details appear on the About and Contact pages and in the site
            footer. Empty fields are simply left out.
          </p>

          {error && (
            <p
              className="mt-4 rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" disabled={!dirty || saving}>
              {saving ? <Spinner className="size-4 text-paper" /> : <Save className="size-4" />}
              {saving ? "Saving…" : "Save profile"}
            </Button>
            <a
              href="/about"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-4 py-2.5 text-sm text-ink transition-colors hover:border-ink/40 hover:bg-paper-deep"
            >
              View About
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
