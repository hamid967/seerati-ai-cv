import { createFileRoute } from "@tanstack/react-router";
import { ApplicationLaunchpad } from "@/components/application-launchpad";

export const Route = createFileRoute("/application-center")({
  head: () => ({
    meta: [
      { title: "مركز التقديم | سيرتي" },
      {
        name: "description",
        content:
          "مركز محلي لتجهيز حزمة التقديم: مطابقة الوظيفة، كلمات الوصف، خطاب التقديم، وفحص الجاهزية قبل الإرسال.",
      },
      { property: "og:title", content: "مركز التقديم | سيرتي" },
      {
        property: "og:description",
        content: "جهّز حزمة تقديم واضحة بخطوات قابلة للمراجعة وبدون حساب للبدء.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplicationCenter,
});

function ApplicationCenter() {
  return <ApplicationLaunchpad />;
}
