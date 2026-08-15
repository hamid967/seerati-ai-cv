import { createFileRoute } from "@tanstack/react-router";
import { InterviewPractice } from "@/components/interview-practice";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "تدريب المقابلات | سيرتي" },
      {
        name: "description",
        content:
          "تمرّن على أسئلة مقابلة نصية مرتبطة بالدور ووصف الوظيفة باستخدام منهج STAR، مع بقاء الإجابات محلية في الصفحة.",
      },
      { property: "og:title", content: "تدريب المقابلات | سيرتي" },
      {
        property: "og:description",
        content: "تدريب نصي محلي على إجابات قابلة للمراجعة، بلا تسجيل صوتي أو وعود بنتائج توظيف.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterviewsPage,
});

function InterviewsPage() {
  return <InterviewPractice />;
}
