/**
 * AI service abstraction.
 *
 * The UI only talks to `aiService`. Today it is fulfilled by a deterministic
 * mock provider so the product is fully demoable with no secrets in the client.
 * To go live, implement `AiProvider` against a server function (Lovable Cloud /
 * AI gateway) and swap `activeProvider` — no UI changes required.
 */
import type { ResumeData } from "./types";

export type AiTask =
  | "summary"
  | "improve_bullets"
  | "duties_to_achievements"
  | "suggest_skills"
  | "proofread"
  | "shorten"
  | "expand"
  | "ats_keywords"
  | "translate"
  | "chat";

export type AiRequest = {
  task: AiTask;
  lang: "ar" | "en";
  input: string;
  context?: Partial<ResumeData> & { targetRole?: string; jobDescription?: string };
};

export type AiResponse = { text: string; items?: string[] };

export interface AiProvider {
  id: string;
  run(req: AiRequest): Promise<AiResponse>;
}

/* ------------------------------- rate limit ------------------------------- */

export type RateLimitConfig = { maxRequests: number; windowMs: number };

export class RateLimiter {
  private hits: number[] = [];
  constructor(private config: RateLimitConfig) {}
  check() {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.config.windowMs);
    if (this.hits.length >= this.config.maxRequests) {
      const retryIn = Math.ceil((this.config.windowMs - (now - (this.hits[0] ?? now))) / 1000);
      return { allowed: false as const, retryIn };
    }
    this.hits.push(now);
    return { allowed: true as const, remaining: this.config.maxRequests - this.hits.length };
  }
}

/* ------------------------------ mock provider ----------------------------- */

const ar = (s: string) => s.replace(/\s+/g, " ").trim();

const mockProvider: AiProvider = {
  id: "mock",
  async run({ task, lang, input, context }) {
    await new Promise((r) => setTimeout(r, 550));
    const role = context?.targetRole || context?.personal?.jobTitle || (lang === "ar" ? "المسمى المستهدف" : "your target role");

    switch (task) {
      case "summary":
        return {
          text:
            lang === "ar"
              ? ar(`${role} يمتلك خبرة عملية في تنفيذ المهام وتحسين النتائج، مع تركيز على الدقة والعمل الجماعي.
                 أسهم في تحسين مؤشرات الأداء عبر تنظيم العمليات ومتابعة الجودة، ويجيد التعامل مع أصحاب المصلحة
                 وإعداد التقارير الدورية. يسعى للانتقال إلى دور يوسّع نطاق الأثر والمسؤولية.`)
              : ar(`${role} with hands-on experience delivering work that improves measurable outcomes.
                 Comfortable coordinating stakeholders, tracking quality and reporting progress clearly.
                 Looking for a role with broader scope and ownership.`),
        };
      case "improve_bullets":
      case "duties_to_achievements": {
        const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
        const items = (lines.length ? lines : [input]).map((l) =>
          lang === "ar"
            ? `أنجزت ${l.replace(/^[-•]\s*/, "")} مما أدى إلى تحسّن ملموس في المؤشر المرتبط (أضف رقماً).`
            : `Delivered ${l.replace(/^[-•]\s*/, "").toLowerCase()}, improving the related metric (add a number).`,
        );
        return { text: items.join("\n"), items };
      }
      case "suggest_skills": {
        const items =
          lang === "ar"
            ? ["إدارة المشاريع", "تحليل البيانات", "التواصل المهني", "Excel المتقدم", "إعداد التقارير", "خدمة العملاء"]
            : ["Project management", "Data analysis", "Stakeholder communication", "Advanced Excel", "Reporting", "Customer service"];
        return { text: items.join(", "), items };
      }
      case "proofread":
        return {
          text: input
            .replace(/\s+([,.،؛])/g, "$1")
            .replace(/([,.،؛])(?=\S)/g, "$1 ")
            .replace(/\s{2,}/g, " ")
            .trim(),
        };
      case "shorten": {
        const s = input.split(/(?<=[.؟!،.])\s+/).slice(0, 2).join(" ");
        return { text: s || input.slice(0, 180) };
      }
      case "expand":
        return {
          text:
            input +
            (lang === "ar"
              ? " كما تولّيت متابعة التفاصيل التنفيذية والتنسيق مع الفرق ذات العلاقة لضمان تسليم النتائج في الوقت المحدد."
              : " Additionally, coordinated with related teams and tracked execution details to deliver on time."),
        };
      case "ats_keywords": {
        const jd = context?.jobDescription || input;
        const items = Array.from(
          new Set(
            jd
              .split(/[^\p{L}\p{N}+#.]+/u)
              .filter((t) => t.length > 3)
              .slice(0, 40),
          ),
        ).slice(0, 12);
        return { text: items.join(", "), items };
      }
      case "translate":
        return {
          text:
            lang === "ar"
              ? `[ترجمة تقريبية للعربية] ${input}`
              : `[Draft English translation] ${input}`,
        };
      case "chat":
      default:
        return {
          text:
            lang === "ar"
              ? "تمام، سجّلت ذلك. أخبرني بمسماك الوظيفي الحالي وسنوات خبرتك، ثم سأقترح صياغة الملخص ونقاط الخبرة."
              : "Noted. Tell me your current title and years of experience, and I’ll draft your summary and bullets.",
        };
    }
  },
};

const activeProvider: AiProvider = mockProvider;
const limiter = new RateLimiter({ maxRequests: 20, windowMs: 60_000 });

export const aiService = {
  providerId: activeProvider.id,
  isMock: activeProvider.id === "mock",
  async run(req: AiRequest): Promise<AiResponse> {
    const gate = limiter.check();
    if (!gate.allowed) {
      throw new Error(
        req.lang === "ar"
          ? `تم تجاوز الحد المسموح، أعد المحاولة بعد ${gate.retryIn} ثانية.`
          : `Rate limit reached, retry in ${gate.retryIn}s.`,
      );
    }
    return activeProvider.run(req);
  },
};
