import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackProductEvent, type ProductEventName } from "@/lib/product-analytics";

const PAGE_EVENTS: Array<[prefix: string, event: ProductEventName]> = [
  ["/career-passport", "career_passport_viewed"],
  ["/arabic-intelligence", "arabic_intelligence_viewed"],
  ["/resumes/", "resume_studio_opened"],
];

/** Emits only route-level coarse events; never sends resume/job/user content. */
export function ProductAnalyticsBridge() {
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    const match = PAGE_EVENTS.find(([prefix]) => pathname.startsWith(prefix));
    if (!match) return;
    trackProductEvent(match[1], { authenticated_surface: true });
  }, [pathname]);

  return null;
}
