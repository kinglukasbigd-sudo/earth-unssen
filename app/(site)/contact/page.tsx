import type { Metadata } from "next";
import { AtSign, Globe, Mail, MapPin } from "lucide-react";
import { getProfile } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import {
  instagramHandle,
  instagramUrl,
  websiteLabel,
  websiteUrl,
} from "@/lib/profile";
import { Reveal } from "@/components/public/Reveal";
import { ContactForm } from "@/components/public/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Earth Unseen about prints, licensing, commissions or anything else.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact — Earth Unseen",
    url: `${SITE_URL}/contact`,
  },
};

export default async function ContactPage() {
  const profile = await getProfile();
  const instagram = instagramUrl(profile.instagram);
  const website = websiteUrl(profile.website);

  const details = [
    profile.email && {
      icon: Mail,
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      external: false,
    },
    instagram && {
      icon: AtSign,
      label: "Instagram",
      value: instagramHandle(profile.instagram) ?? instagram,
      href: instagram,
      external: true,
    },
    website && {
      icon: Globe,
      label: "Website",
      value: websiteLabel(profile.website) ?? website,
      href: website,
      external: true,
    },
    profile.location && {
      icon: MapPin,
      label: "Based in",
      value: profile.location,
      href: null,
      external: false,
    },
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    value: string;
    href: string | null;
    external: boolean;
  }[];

  return (
    <section className="container-site pb-24 pt-36 sm:pb-32 sm:pt-44">
      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <p className="eyebrow text-muted">Contact</p>
            <h1 className="mt-5 font-display text-xxl">
              Say hello.{" "}
              <span className="block italic text-muted">I’d love to hear from you.</span>
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-muted">
              {profile.availability ||
                "For prints, image licensing, commissions, or a conversation about a photograph — send a note and I’ll reply personally."}
            </p>
          </Reveal>

          {details.length > 0 && (
            <Reveal delay={0.08}>
              <dl className="mt-10 divide-y divide-hairline border-y border-hairline">
                {details.map((item) => (
                  <div key={item.label} className="flex items-center gap-4 py-4">
                    <item.icon className="size-4 shrink-0 text-muted" strokeWidth={1.5} />
                    <dt className="w-24 shrink-0 text-xs uppercase tracking-[0.22em] text-muted">
                      {item.label}
                    </dt>
                    <dd className="min-w-0 truncate font-display text-lg italic">
                      {item.href ? (
                        <a
                          href={item.href}
                          {...(item.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="underline-offset-4 hover:underline"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal delay={0.05}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
