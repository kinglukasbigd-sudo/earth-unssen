import { getIntroBackground } from "@/lib/data";
import { IntroSettings } from "@/components/admin/IntroSettings";

export default async function IntroCoverPage() {
  const intro = await getIntroBackground();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">Intro cover</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Intro cover background
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Choose what fills the screen on entry — a photograph or a colour.
          The wordmark, its timing and the lift are exactly as designed, and
          the choice applies to every page.
        </p>
      </div>
      <div className="mt-10">
        <IntroSettings initial={intro} />
      </div>
    </div>
  );
}
