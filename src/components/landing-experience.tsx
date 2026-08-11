import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  Gauge,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import "../landing-experience.css";

const INTRO_SESSION_KEY = "seerati:intro:premium-v1";
const INTRO_DURATION_MS = 8600;

export function LandingIntro({ ar }: { ar: boolean }) {
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState(0);

  const copy = useMemo(
    () =>
      ar
        ? [
            {
              eyebrow: "كل مسيرة تبدأ بقصة",
              title: "اجمع خبرتك في مكان واحد",
              body: "حوّل خبراتك ومهاراتك وإنجازاتك إلى ملف مهني موحّد يبقى معك.",
            },
            {
              eyebrow: "لكل فرصة نسخة أذكى",
              title: "طابق سيرتك مع الوظيفة",
              body: "افهم المتطلبات، أبرز ما لديك فعلًا، واعرف الفجوات قبل إرسال الطلب.",
            },
            {
              eyebrow: "من أول انطباع إلى آخر صفحة",
              title: "صمّم، افحص، وصدّر بثقة",
              body: "قوالب احترافية، فحص ATS إرشادي، وتصدير عربي مضبوط للطباعة والتقديم.",
            },
            {
              eyebrow: "سيرتي | Seerati",
              title: "مسارك المهني يبدأ من هنا",
              body: "استوديو مهني سعودي، عربي أولًا، مصمم ليجعل بناء السيرة والتقديم أوضح وأسرع.",
            },
          ]
        : [
            {
              eyebrow: "Every career starts with a story",
              title: "Bring your experience into one place",
              body: "Turn your experience, skills and achievements into one reusable career profile.",
            },
            {
              eyebrow: "A smarter version for every opportunity",
              title: "Match your resume to the role",
              body: "Understand requirements, surface what you truly have and see the gaps before you apply.",
            },
            {
              eyebrow: "From first impression to final page",
              title: "Design, check and export with clarity",
              body: "Professional templates, rule-based ATS guidance and reliable Arabic-ready export.",
            },
            {
              eyebrow: "Seerati | سيرتي",
              title: "Your career journey starts here",
              body: "A Saudi-built, Arabic-first career studio designed to make resumes and applications clearer and faster.",
            },
          ],
    [ar],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "seen";
    if (!reducedMotion && !alreadySeen) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const close = () => {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
      setVisible(false);
    };
    const timers = [
      window.setTimeout(() => setScene(1), 2100),
      window.setTimeout(() => setScene(2), 4200),
      window.setTimeout(() => setScene(3), 6300),
      window.setTimeout(close, INTRO_DURATION_MS),
    ];
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  const closeIntro = () => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="seerati-intro" role="dialog" aria-modal="true" aria-label={ar ? "مقدمة تعريفية عن سيرتي" : "Introduction to Seerati"} dir={ar ? "rtl" : "ltr"}>
      <div className="seerati-intro__aurora" aria-hidden="true" />
      <div className="seerati-intro__grid" aria-hidden="true" />
      <button className="seerati-intro__skip" type="button" onClick={closeIntro}>
        <X className="size-4" aria-hidden="true" />
        {ar ? "تخطي" : "Skip"}
      </button>
      <div className="seerati-intro__brand" aria-hidden="true">
        <span className="seerati-intro__mark">س</span>
        <span>SEERATI</span>
      </div>
      <div className="seerati-intro__stage">
        <div className="seerati-intro__orbit" aria-hidden="true">
          <span className="seerati-intro__orb seerati-intro__orb--one" />
          <span className="seerati-intro__orb seerati-intro__orb--two" />
          <span className="seerati-intro__orb seerati-intro__orb--three" />
          <div className="seerati-intro__document">
            <span className="seerati-intro__document-head" />
            <span /><span /><span className="short" /><span /><span className="short" />
          </div>
        </div>
        <div className="seerati-intro__copy" key={scene}>
          <p>{copy[scene]?.eyebrow}</p>
          <h2>{copy[scene]?.title}</h2>
          <span>{copy[scene]?.body}</span>
        </div>
      </div>
      <div className="seerati-intro__footer">
        <div className="seerati-intro__dots" aria-label={`${scene + 1} / ${copy.length}`}>
          {copy.map((_, index) => <span key={index} className={index === scene ? "is-active" : ""} />)}
        </div>
        <div className="seerati-intro__progress" aria-hidden="true"><span /></div>
        <p>{ar ? "اضغط ESC للتخطي" : "Press ESC to skip"}</p>
      </div>
    </div>
  );
}

export function LandingCareerVisual({ ar }: { ar: boolean }) {
  const stages = ar
    ? [
        { label: "ملفك المهني", value: "موحّد", icon: BriefcaseBusiness },
        { label: "مطابقة الوظيفة", value: "واضحة", icon: Target },
        { label: "فحص ATS", value: "إرشادي", icon: Gauge },
      ]
    : [
        { label: "Career profile", value: "Unified", icon: BriefcaseBusiness },
        { label: "Role matching", value: "Explainable", icon: Target },
        { label: "ATS check", value: "Guidance", icon: Gauge },
      ];

  return (
    <div className="seerati-career-visual" aria-label={ar ? "مثال توضيحي لواجهة سيرتي" : "Illustrative Seerati interface example"}>
      <div className="seerati-career-visual__glow" aria-hidden="true" />
      <div className="seerati-career-visual__frame">
        <div className="seerati-career-visual__topbar">
          <div className="seerati-career-visual__identity">
            <span className="seerati-career-visual__mini-logo">س</span>
            <div><strong>{ar ? "مساحة مسارك المهني" : "Your career workspace"}</strong><small>{ar ? "مثال توضيحي" : "Illustrative preview"}</small></div>
          </div>
          <span className="seerati-career-visual__status"><BadgeCheck className="size-3.5" />{ar ? "جاهز للعمل" : "Ready"}</span>
        </div>
        <div className="seerati-career-visual__content">
          <div className="seerati-career-visual__resume">
            <div className="seerati-career-visual__resume-head"><span className="seerati-career-visual__avatar">س</span><div><span className="seerati-career-visual__line wide" /><span className="seerati-career-visual__line medium" /></div></div>
            <div className="seerati-career-visual__section"><span className="seerati-career-visual__label" /><span className="seerati-career-visual__line wide" /><span className="seerati-career-visual__line wide" /><span className="seerati-career-visual__line medium" /></div>
            <div className="seerati-career-visual__section"><span className="seerati-career-visual__label" /><span className="seerati-career-visual__line wide" /><span className="seerati-career-visual__line short" /></div>
            <div className="seerati-career-visual__skills"><span /><span /><span /><span /></div>
          </div>
          <div className="seerati-career-visual__rail">
            <div className="seerati-career-visual__role"><span>{ar ? "الوظيفة المستهدفة" : "Target role"}</span><strong>{ar ? "مثال: مهندس برمجيات" : "Example: Software Engineer"}</strong><small>{ar ? "يُستخدم للمطابقة فقط" : "Used for matching only"}</small></div>
            {stages.map(({ label, value, icon: Icon }) => <div className="seerati-career-visual__metric" key={label}><span className="seerati-career-visual__metric-icon"><Icon className="size-4" /></span><div><small>{label}</small><strong>{value}</strong></div><ArrowUpRight className="size-4 opacity-45 rtl:-scale-x-100" /></div>)}
            <div className="seerati-career-visual__export"><FileCheck2 className="size-4" /><span>{ar ? "PDF نصي للتقديم" : "Text PDF for applications"}</span></div>
          </div>
        </div>
      </div>
      <div className="seerati-career-visual__float seerati-career-visual__float--ai" aria-hidden="true"><Sparkles className="size-4" /><span>{ar ? "مساعد سيرتي" : "Seerati copilot"}</span></div>
      <div className="seerati-career-visual__float seerati-career-visual__float--doc" aria-hidden="true"><FileText className="size-4" /><span>{ar ? "سيرة قابلة للتخصيص" : "Tailorable resume"}</span></div>
    </div>
  );
}
