import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useAuthGuard, useStore } from "@/lib/store";
import {
  loadCareerTwin,
  saveCareerTwin,
  twinHealth,
  type CareerTwin,
  type TwinPatch,
} from "@/lib/career";
import { agentsForSurface } from "@/lib/team";
import {
  IdentityCard,
  TargetsCard,
  WorkHistoryCard,
  AchievementsCard,
  EducationCard,
  SimpleListCard,
  SkillsCard,
  LanguagesCard,
  LinksCard,
  PreferencesCard,
} from "@/components/twin-sections";

export const Route = createFileRoute("/career-twin")({
  head: () => ({
    meta: [
      { title: "ملفي المهني | سيرتي — Career Twin" },
      {
        name: "description",
        content:
          "مصدر بياناتك المهنية الموحّد: أدخلها مرة واحدة ليستخدمها كل من السيرة الذاتية وخطاب التقديم والتحضير للمقابلة.",
      },
      { property: "og:title", content: "ملفي المهني | سيرتي" },
      { property: "og:description", content: "بياناتك المهنية في مكان واحد، تُستخدم في كل مكان." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CareerTwinPage,
});

const sectionRefKeys = [
  "identity",
  "summary",
  "targets",
  "work",
  "achievements",
  "skills",
  "education",
  "stories",
] as const;

function CareerTwinPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, ready } = useStore();
  useAuthGuard();

  const [twin, setTwin] = useState<CareerTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreSavedRef = useRef<number | null>(null);

  const sectionRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    void loadCareerTwin(user.id).then((t) => {
      if (alive) {
        setTwin(t);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [ready, user]);

  const health = useMemo(() => twinHealth(twin), [twin]);

  // Autosave with debounce.
  const queuePatch = (patch: TwinPatch) => {
    if (!user) return;
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCareerTwin(user.id, patch).then(() => setSaved(true));
    }, 800);
  };

  const update = <K extends keyof CareerTwin>(key: K, value: CareerTwin[K]) => {
    setTwin((prev) => (prev ? { ...prev, [key]: value } : prev));
    queuePatch({ [key]: value } as TwinPatch);
  };

  // Persist computed completion score whenever it changes.
  useEffect(() => {
    if (!twin || !user) return;
    if (scoreSavedRef.current === health.score) return;
    scoreSavedRef.current = health.score;
    if (twin.completionScore !== health.score) {
      void saveCareerTwin(user.id, { completionScore: health.score });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health.score, twin?.id]);

  const unverifiedAchievements = useMemo(
    () => (twin?.achievements ?? []).filter((a) => a.metric && !a.verified).length,
    [twin],
  );

  const scrollToSection = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = el.querySelector<HTMLElement>("input, textarea");
      input?.focus();
    }
  };

  const team = agentsForSurface("career-twin");

  const isEmpty =
    !!twin &&
    !twin.identity.fullName &&
    !twin.identity.summary &&
    twin.targets.length === 0 &&
    twin.workHistory.length === 0;

  if (!ready || !user || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-12">
          <Skeleton className="h-10 w-52" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!twin) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 text-center text-sm text-muted-foreground">
          {ar
            ? "تعذّر تحميل ملفك المهني، حاول تحديث الصفحة."
            : "Could not load your career twin, try refreshing."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {ar ? "ملفي المهني" : "Career Twin"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {ar
                ? "مصدر بياناتك المهنية الموحّد. كل ما تُدخله هنا مرة واحدة يُعاد استخدامه في كل سيرة ذاتية وخطاب تقديم وتحضير مقابلة."
                : "The single source of truth for your professional data — reused across every resume, cover letter and interview prep."}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {saved ? (ar ? "تم الحفظ" : "Saved") : ar ? "جارٍ الحفظ…" : "Saving…"}
          </span>
        </div>

        {isEmpty && (
          <Card className="mt-6 border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles className="size-6 text-primary" />
              <p className="text-sm font-semibold">
                {ar ? "ابدأ بملء بياناتك الأساسية" : "Start by filling your core data"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {ar
                  ? "أدخل معلوماتك مرة واحدة هنا؛ سيستفيد منها مُنشئ السيرة الذاتية وخطاب التقديم والتحضير للمقابلات تلقائياً."
                  : "Enter your information once here; the resume builder, cover letter and interview prep will reuse it automatically."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team strip */}
        <div className="mt-6 flex flex-wrap gap-3">
          {team.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-foreground">
                {agent.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{agent.name[lang]}</p>
                <p className="truncate text-xs text-muted-foreground">{agent.role[lang]}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ms-2 shrink-0"
                onClick={() => {
                  const target = agent.surfaces.includes("career-twin")
                    ? "identity"
                    : sectionRefKeys[0];
                  scrollToSection(target);
                }}
              >
                {ar ? "تحدث معه" : "Talk to them"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div
              ref={(el) => {
                sectionRefs.current["identity"] = el;
              }}
            >
              <IdentityCard
                twin={twin}
                ar={ar}
                onChange={(patch) => update("identity", { ...twin.identity, ...patch })}
              />
            </div>

            <div
              ref={(el) => {
                sectionRefs.current["targets"] = el;
              }}
            >
              <TargetsCard
                targets={twin.targets}
                ar={ar}
                onChange={(next) => update("targets", next)}
              />
            </div>

            <div
              ref={(el) => {
                sectionRefs.current["work"] = el;
              }}
            >
              <WorkHistoryCard
                items={twin.workHistory}
                ar={ar}
                onChange={(next) => update("workHistory", next)}
              />
            </div>

            <div
              ref={(el) => {
                sectionRefs.current["achievements"] = el;
              }}
            >
              <AchievementsCard
                items={twin.achievements}
                ar={ar}
                onChange={(next) => update("achievements", next)}
              />
            </div>

            <div
              ref={(el) => {
                sectionRefs.current["education"] = el;
              }}
            >
              <EducationCard
                items={twin.education}
                ar={ar}
                onChange={(next) => update("education", next)}
              />
            </div>

            <SimpleListCard
              title={ar ? "الشهادات" : "Certifications"}
              items={twin.certifications}
              ar={ar}
              onChange={(next) => update("certifications", next)}
              addLabel={ar ? "إضافة شهادة" : "Add certification"}
              titlePlaceholder={ar ? "اسم الشهادة" : "Certification title"}
              detailPlaceholder={ar ? "الجهة/السنة" : "Issuer / year"}
            />

            <div
              ref={(el) => {
                sectionRefs.current["skills"] = el;
              }}
            >
              <SkillsCard items={twin.skills} ar={ar} onChange={(next) => update("skills", next)} />
            </div>

            <LanguagesCard
              items={twin.languages}
              ar={ar}
              onChange={(next) => update("languages", next)}
            />

            <SimpleListCard
              title={ar ? "المشاريع" : "Projects"}
              items={twin.projects}
              ar={ar}
              onChange={(next) => update("projects", next)}
              addLabel={ar ? "إضافة مشروع" : "Add project"}
              titlePlaceholder={ar ? "اسم المشروع" : "Project title"}
              detailPlaceholder={ar ? "وصف مختصر" : "Short detail"}
            />

            <LinksCard items={twin.links} ar={ar} onChange={(next) => update("links", next)} />

            <PreferencesCard
              prefs={twin.preferences}
              ar={ar}
              onChange={(patch) => update("preferences", { ...twin.preferences, ...patch })}
            />
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {ar ? "اكتمال الملف" : "Profile health"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {ar ? "النسبة الإجمالية" : "Overall score"}
                    </span>
                    <span className="font-bold">{health.score}%</span>
                  </div>
                  <Progress value={health.score} className="mt-2" />
                </div>
                <ul className="space-y-2">
                  {health.sections.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-sm">
                      {s.done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={s.done ? "" : "text-muted-foreground"}>{s.label[lang]}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "هذه النسبة تصف اكتمال بياناتك فقط، وليست تنبؤاً بفرص التوظيف."
                    : "This score only describes data completeness — it is not a prediction of hiring outcomes."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {ar ? "ملخص التحقق" : "Evidence summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? `لديك ${unverifiedAchievements} إنجاز يحتوي رقماً غير مؤكد بعد.`
                    : `You have ${unverifiedAchievements} achievement(s) with an unverified figure.`}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => scrollToSection("achievements")}
                >
                  {ar ? "مراجعة الإنجازات" : "Review achievements"}
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
