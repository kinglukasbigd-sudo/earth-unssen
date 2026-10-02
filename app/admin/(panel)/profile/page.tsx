import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">About you</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Profile</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Tell visitors who made these photographs and how to reach you. These
          details fill in the About page, the Contact page and the footer.
        </p>
      </div>
      <div className="mt-10">
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  );
}
