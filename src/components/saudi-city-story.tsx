import { Link } from "@tanstack/react-router";

const cities = [
  {
    id: "riyadh",
    ar: "الرياض",
    en: "Riyadh",
    tone: "from-emerald-500/30 via-slate-950 to-slate-950",
  },
  { id: "jeddah", ar: "جدة", en: "Jeddah", tone: "from-sky-400/30 via-slate-950 to-slate-950" },
  {
    id: "dammam",
    ar: "الدمام",
    en: "Dammam",
    tone: "from-amber-300/30 via-slate-950 to-slate-950",
  },
  { id: "abha", ar: "أبها", en: "Abha", tone: "from-violet-400/30 via-slate-950 to-slate-950" },
  { id: "alula", ar: "العلا", en: "AlUla", tone: "from-orange-300/30 via-slate-950 to-slate-950" },
  { id: "tabuk", ar: "تبوك", en: "Tabuk", tone: "from-cyan-300/30 via-slate-950 to-slate-950" },
] as const;

type SaudiCityStoryProps = {
  arabic: boolean;
};

export function SaudiCityStory({ arabic }: SaudiCityStoryProps) {
  return (
    <section className="section-y mx-auto max-w-6xl px-4" aria-labelledby="saudi-city-story-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            {arabic ? "مستقبل مهني سعودي" : "Saudi Future Professional"}
          </p>
          <h2
            id="saudi-city-story-title"
            className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl"
          >
            {arabic ? "مهنتك تتحرك معك" : "Your career moves with you"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {arabic
              ? "اختر نقطة البداية، ثم ابنِ سيرة تعكس خبرتك وطموحك — أينما بدأت رحلتك المهنية."
              : "Choose your starting point, then build a resume that reflects your experience and ambition — wherever your career begins."}
          </p>
        </div>
        <Link
          to="/templates"
          className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
        >
          {arabic ? "استكشف القوالب" : "Explore templates"}
        </Link>
      </div>

      <ul
        className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]"
        aria-label={arabic ? "مدن البداية" : "Starting cities"}
      >
        {cities.map((city) => (
          <li key={city.id} className="min-w-[15rem] snap-start sm:min-w-[18rem]">
            <Link
              to="/templates"
              className={`group block min-h-48 rounded-3xl bg-gradient-to-br ${city.tone} p-5 text-white shadow-soft transition hover:-translate-y-1 focus-visible:outline-white`}
            >
              <span className="flex items-center justify-between gap-3 text-xs font-semibold text-white/70">
                <span>{arabic ? "نقطة بداية" : "Starting point"}</span>
                <span aria-hidden="true">↗</span>
              </span>
              <span className="mt-20 block text-2xl font-bold">{arabic ? city.ar : city.en}</span>
              <span className="mt-1 block text-xs text-white/65">
                {arabic ? "قالبك، قصتك، خطوتك التالية" : "Your template, story, next step"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
