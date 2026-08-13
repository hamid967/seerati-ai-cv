import { useEffect, useMemo, useRef, useState } from "react";
import { markIntroSeen } from "@/lib/intro";
import "../landing-experience.css";

const INTRO_DURATION_MS = 7600;
const INTRO_REDUCED_MOTION_MS = 600;

type LandingIntroProps = {
  ar: boolean;
  /** Full-page route vs overlay (default page). */
  mode?: "page" | "overlay";
  onComplete?: () => void;
};

export function LandingIntro({ ar, mode = "page", onComplete }: LandingIntroProps) {
  const [scene, setScene] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const copy = useMemo(
    () =>
      ar
        ? [
            {
              eyebrow: "سيرتي",
              title: "ابنِ سيرة تفوز بالوظيفة",
              body: "استوديو مهني عربي أولاً — من خبرتك الحقيقية إلى PDF جاهز للتقديم.",
            },
            {
              eyebrow: "تصميم موحّد",
              title: "صور وتصاميم بتأثير واحد",
              body: "فريق مصممين يوحّد الهوية البصرية والقوالب والمحتوى الإعلاني للموقع.",
            },
            {
              eyebrow: "مساعد سيرتي",
              title: "أسئلة قصيرة ثم سيرة جاهزة",
              body: "اختر متخصصاً، أجب باختصار، واختر قالباً — بدون بيانات وهمية في صفحتك.",
            },
            {
              eyebrow: "جاهز للبدء",
              title: "ادخل الصفحة الرئيسية",
              body: "واجهة نظيفة: ابدأ سيرة، استعرض القوالب، أو تعرّف على فريق التصميم.",
            },
          ]
        : [
            {
              eyebrow: "Seerati",
              title: "Build a job-winning resume",
              body: "An Arabic-first career studio — from your real experience to a submission-ready PDF.",
            },
            {
              eyebrow: "Unified design",
              title: "Images and layouts in one system",
              body: "A design team keeps brand visuals, templates and campaign content aligned.",
            },
            {
              eyebrow: "Seerati Assistant",
              title: "Short answers, then a resume",
              body: "Pick a specialist, answer briefly, choose a template — no fake filler on your home page.",
            },
            {
              eyebrow: "Ready",
              title: "Enter the homepage",
              body: "A clean surface: start a resume, browse templates, or meet the design team.",
            },
          ],
    [ar],
  );

  const finish = () => {
    markIntroSeen();
    onComplete?.();
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    skipRef.current?.focus();
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mode === "overlay" || mode === "page") {
      document.body.style.overflow = "hidden";
    }

    const timers = [
      window.setTimeout(() => setScene(1), reducedMotion ? 150 : 1900),
      window.setTimeout(() => setScene(2), reducedMotion ? 300 : 3800),
      window.setTimeout(() => setScene(3), reducedMotion ? 450 : 5700),
      window.setTimeout(finish, reducedMotion ? INTRO_REDUCED_MOTION_MS : INTRO_DURATION_MS),
    ];
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish is intentionally scoped to the mounted intro
  }, [reducedMotion]);

  return (
    <div
      className={mode === "page" ? "seerati-intro seerati-intro--page" : "seerati-intro"}
      role="dialog"
      aria-modal="true"
      aria-label={ar ? "مقدمة سيرتي" : "Seerati introduction"}
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="seerati-intro__aurora" aria-hidden="true" />
      <div className="seerati-intro__grid" aria-hidden="true" />
      <div className="seerati-intro__beam" aria-hidden="true" />
      <button
        ref={skipRef}
        className="seerati-intro__skip"
        type="button"
        onClick={finish}
        aria-label={ar ? "تخطي المقدمة" : "Skip introduction"}
      >
        <span aria-hidden="true">×</span>
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
            <span />
            <span />
            <span className="short" />
            <span />
            <span className="short" />
          </div>
        </div>
        <div className="seerati-intro__copy" key={scene}>
          <p>{copy[scene]?.eyebrow}</p>
          <h1>{copy[scene]?.title}</h1>
          <span>{copy[scene]?.body}</span>
          {scene === copy.length - 1 && (
            <button type="button" className="seerati-intro__enter" onClick={finish}>
              {ar ? "ادخل الموقع" : "Enter the site"}
            </button>
          )}
        </div>
      </div>
      <div className="seerati-intro__footer">
        <div className="seerati-intro__dots" aria-label={`${scene + 1} / ${copy.length}`}>
          {copy.map((_, index) => (
            <span key={index} className={index === scene ? "is-active" : ""} />
          ))}
        </div>
        <div className="seerati-intro__progress" aria-hidden="true">
          <span />
        </div>
        <p>{ar ? "ESC للتخطي · Enter للمتابعة" : "ESC to skip · Enter to continue"}</p>
      </div>
    </div>
  );
}
