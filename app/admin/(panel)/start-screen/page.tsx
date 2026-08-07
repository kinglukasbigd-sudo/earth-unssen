import { getHeroBackground } from "@/lib/data";
import { HeroSettings } from "@/components/admin/HeroSettings";

export default async function StartScreenPage() {
  const hero = await getHeroBackground();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">Start screen</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Start-screen background
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Choose the photograph shown behind the opening screen. Only the
          image changes — the layout, typography and motion stay exactly as
          designed. Leave it unset to keep using your newest photograph
          automatically.
        </p>
      </div>
      <div className="mt-10">
        <HeroSettings initialBackground={hero} />
      </div>
    </div>
  );
}
