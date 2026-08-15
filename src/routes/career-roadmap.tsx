import { createFileRoute } from "@tanstack/react-router";
import { CareerRoadmapPlanner } from "@/components/career-roadmap-planner";

export const Route = createFileRoute("/career-roadmap")({
  head: () => ({
    meta: [
      { title: "خارطة المسار المهني | سيرتي" },
      {
        name: "description",
        content:
          "حوّل اتجاهاً مهنياً إلى مراحل مراجعة محلية للمهارات أو المحفظة أو العلاقات المهنية أو التقديم، بلا وعود بنتائج توظيف.",
      },
      { property: "og:title", content: "خارطة المسار المهني | سيرتي" },
      {
        property: "og:description",
        content: "خطة مهنية محلية قابلة للمراجعة والتعديل، تحترم خصوصية الضيف.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CareerRoadmapPage,
});

function CareerRoadmapPage() {
  return <CareerRoadmapPlanner />;
}
