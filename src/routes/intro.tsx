import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LandingIntro } from "@/components/landing-experience";
import { hasSeenIntro } from "@/lib/intro";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "سيرتي | مقدمة" },
      {
        name: "description",
        content: "مقدمة سيرتي — استوديو مهني عربي لبناء سيرة ذاتية جاهزة للتقديم.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntroPage,
});

function IntroPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hasSeenIntro()) {
      void navigate({ to: "/", replace: true });
      return;
    }
    setShow(true);
  }, [navigate]);

  if (!show) return null;

  return (
    <LandingIntro
      ar={ar}
      mode="page"
      onComplete={() => {
        void navigate({ to: "/", replace: true });
      }}
    />
  );
}
