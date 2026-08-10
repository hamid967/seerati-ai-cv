/**
 * AI service abstraction.
 *
 * The UI only ever talks to `aiService`. Today it is fulfilled by a deterministic
 * local provider so the product is fully usable with no secrets in the browser.
 * To go live, implement `AiProvider` against a server function (Lovable Cloud AI
 * gateway) and swap `activeProvider` — no UI changes are required.
 */
import type { ResumeData } from "./types";

export type AiTask =
  | "summary"
  | "improve"
  | "rewrite"
  | "shorten"
  | "expand"
  | "quantify"
  | "suggest_skills"
  | "proofread"
  | "ats_keywords"
  | "translate"
  | "chat";

export type AiRequest = {
  task: AiTask;
  lang: "ar" | "en";
  input: string;
  context?: Partial<ResumeData> & {
    targetRole?: string;
    jobDescription?: string;
    section?: string;
    answers?: Record<string, string>;
  };
};

export type AiResponse = { text: string; items?: string[] };

export interface AiProvider {
  id: string;
  run(req: AiRequest): Promise<AiResponse>;
}

export const AI_TASK_LABELS: Record<AiTask, { ar: string; en: string }> = {
  summary: { ar: "اكتب ملخصاً", en: "Write summary" },
  improve: { ar: "تحسين", en: "Improve" },
  rewrite: { ar: "إعادة صياغة", en: "Rewrite" },
  shorten: { ar: "اختصار", en: "Shorten" },
  expand: { ar: "توسيع", en: "Expand" },
  quantify: { ar: "أضف أرقاماً", en: "Quantify" },
  suggest_skills: { ar: "اقترح مهارات", en: "Suggest skills" },
  proofread: { ar: "تصحيح لغوي", en: "Proofread" },
  ats_keywords: { ar: "كلمات ATS", en: "ATS keywords" },
  translate: { ar: "ترجمة", en: "Translate" },
  chat: { ar: "محادثة", en: "Chat" },
};

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

/* ------------------------------ local provider ---------------------------- */

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
const stripBullet = (s: string) => s.replace(/^[-•*\u2022]\s*/, "").trim();

const AR_ACTION = ["قدت", "طوّرت", "حسّنت", "أدرت", "أطلقت", "خفّضت", "رفعت"];
const EN_ACTION = ["Led", "Built", "Improved", "Managed", "Launched", "Reduced", "Increased"];

const localProvider: AiProvider = {
  id: "local-draft",
  async run({ task, lang, input, context }) {
    await new Promise((r) => setTimeout(r, 450));
    const ar = lang === "ar";
    const role =
      context?.targetRole || context?.personal?.jobTitle || (ar ? "المسمى المستهدف" : "your target role");
    const years = context?.answers?.["years"] ?? "";
    const lines = input.split("\n").map(stripBullet).filter(Boolean);

    switch (task) {
      case "summary": {
        const industry = context?.answers?.["industry"] ?? "";
        return {
          text: ar
            ? tidy(`${role}${years ? ` بخبرة ${years} سنوات` : ""}${industry ? ` في قطاع ${industry}` : ""}،
                 يعمل على تحسين النتائج القابلة للقياس عبر تنظيم العمليات ومتابعة الجودة.
                 يجيد التنسيق مع أصحاب المصلحة وإعداد التقارير ودعم القرار بالبيانات.
                 يسعى إلى دور يوسّع نطاق المسؤولية والأثر.`)
            : tidy(`${role}${years ? ` with ${years} years of experience` : ""}${industry ? ` in ${industry}` : ""},
                 focused on improving measurable outcomes through better process and quality follow-up.
                 Comfortable aligning stakeholders, reporting progress and supporting decisions with data.
                 Seeking a role with broader ownership and impact.`),
        };
      }
      case "improve":
      case "rewrite": {
        const src = lines.length ? lines : [input];
        const items = src.map((l, i) =>
          ar
            ? `${AR_ACTION[i % AR_ACTION.length]} ${l} بما أسهم في تحسين النتيجة المرتبطة.`
            : `${EN_ACTION[i % EN_ACTION.length]} ${l.charAt(0).toLowerCase()}${l.slice(1)}, improving the related outcome.`,
        );
        return { text: items.join("\n"), items };
      }
      case "quantify": {
        const src = lines.length ? lines : [input];
        const items = src.map((l) =>
          ar
            ? `${l} — بنسبة تحسّن ٢٠٪ تقريباً (عدّل الرقم ليطابق واقعك).`
            : `${l} — by roughly 20% (adjust the figure to match your reality).`,
        );
        return { text: items.join("\n"), items };
      }
      case "suggest_skills": {
        const base = ar
          ? ["إدارة المشاريع", "تحليل البيانات", "التواصل المهني", "Excel المتقدم", "إعداد التقارير", "إدارة أصحاب المصلحة", "تحسين العمليات", "العمل ضمن فريق"]
          : ["Project management", "Data analysis", "Stakeholder communication", "Advanced Excel", "Reporting", "Process improvement", "Prioritisation", "Teamwork"];
        const fromJd = context?.jobDescription
          ? Array.from(
              new Set(
                context.jobDescription
                  .split(/[^\p{L}\p{N}+#.]+/u)
                  .filter((t) => t.length > 4)
                  .slice(0, 8),
              ),
            )
          : [];
        const items = Array.from(new Set([...fromJd, ...base])).slice(0, 10);
        return { text: items.join(", "), items };
      }
      case "proofread":
        return {
          text: input
            .replace(/\s+([,.،؛:!؟])/g, "$1")
            .replace(/([,.،؛:])(?=\S)/g, "$1 ")
            .replace(/\s{2,}/g, " ")
            .trim(),
        };
      case "shorten": {
        const s = input.split(/(?<=[.؟!،])\s+/).slice(0, 2).join(" ");
        return { text: tidy(s || input.slice(0, 180)) };
      }
      case "expand":
        return {
          text: tidy(
            input +
              (ar
                ? " كما تابعت التفاصيل التنفيذية ونسّقت مع الفرق ذات العلاقة لضمان تسليم النتائج في الوقت المحدد وبالجودة المطلوبة."
                : " Also tracked execution details and coordinated with related teams to deliver on time and to the expected quality."),
          ),
        };
      case "ats_keywords": {
        const jd = context?.jobDescription || input;
        const items = Array.from(
          new Set(
            jd
              .toLowerCase()
              .split(/[^\p{L}\p{N}+#.]+/u)
              .filter((t) => t.length > 3),
          ),
        ).slice(0, 14);
        return { text: items.join(", "), items };
      }
      case "translate":
        return {
          text: ar ? `[ترجمة مسودة إلى العربية] ${input}` : `[Draft English translation] ${input}`,
        };
      case "chat":
      default:
        return {
          text: ar
            ? "سجّلت ذلك. أخبرني بأهم إنجاز قمت به في وظيفتك الحالية وسأصيغه كنقطة مهنية قابلة للإضافة."
            : "Noted. Tell me your biggest achievement in your current role and I’ll turn it into a resume-ready bullet.",
        };
    }
  },
};

const activeProvider: AiProvider = localProvider;
const limiter = new RateLimiter({ maxRequests: 25, windowMs: 60_000 });

export const aiService = {
  providerId: activeProvider.id,
  isMock: activeProvider.id === "local-draft",
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

/* --------------------------------- wizard --------------------------------- */

export type WizardQuestion = {
  id: string;
  ar: string;
  en: string;
  placeholder: { ar: string; en: string };
};

export const summaryWizard: WizardQuestion[] = [
  {
    id: "role",
    ar: "ما المسمى الوظيفي الذي تستهدفه؟",
    en: "Which job title are you targeting?",
    placeholder: { ar: "مثال: محلل بيانات", en: "e.g. Data Analyst" },
  },
  {
    id: "years",
    ar: "كم سنة خبرة لديك في هذا المجال؟",
    en: "How many years of experience do you have?",
    placeholder: { ar: "مثال: ٤", en: "e.g. 4" },
  },
  {
    id: "industry",
    ar: "في أي قطاع تعمل؟",
    en: "Which industry do you work in?",
    placeholder: { ar: "مثال: المالية", en: "e.g. Finance" },
  },
  {
    id: "achievement",
    ar: "ما أبرز إنجاز تفتخر به؟ اذكره بجملة واحدة.",
    en: "What is your proudest achievement? One sentence is enough.",
    placeholder: { ar: "مثال: خفّضت زمن التقارير ٣٠٪", en: "e.g. cut reporting time by 30%" },
  },
];
