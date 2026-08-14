/**
 * AI service abstraction.
 *
 * The UI only ever talks to `aiService`. Requests go to the Lovable Cloud AI
 * gateway through an authenticated server function (no key ever reaches the
 * browser). If the gateway is unavailable, rate limited or returns something
 * unusable, we degrade gracefully to a deterministic local draft provider so the
 * product never breaks in front of the user.
 */
import { runAiTask } from "./ai.functions";
import type { AiRequest, AiResponse, AiTask } from "./ai-types";

export type { AiRequest, AiResponse, AiTask };

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
  copilot: { ar: "مساعد المحادثة", en: "Copilot" },
  adapt_sample: { ar: "تكييف عينة تجريبية", en: "Adapt sample resume" },
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
      context?.targetRole ||
      context?.personal?.jobTitle ||
      (ar ? "المسمى المستهدف" : "your target role");
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
          ? [
              "إدارة المشاريع",
              "تحليل البيانات",
              "التواصل المهني",
              "Excel المتقدم",
              "إعداد التقارير",
              "إدارة أصحاب المصلحة",
              "تحسين العمليات",
              "العمل ضمن فريق",
            ]
          : [
              "Project management",
              "Data analysis",
              "Stakeholder communication",
              "Advanced Excel",
              "Reporting",
              "Process improvement",
              "Prioritisation",
              "Teamwork",
            ];
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
        const s = input
          .split(/(?<=[.؟!،])\s+/)
          .slice(0, 2)
          .join(" ");
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

/* ----------------------------- gateway provider --------------------------- */

const gatewayProvider: AiProvider = {
  id: "lovable-ai-gateway",
  async run(req) {
    const res = await runAiTask({ data: req });
    if (res.ok) return { text: res.text, ...(res.items ? { items: res.items } : {}) };

    const ar = req.lang === "ar";
    if (res.code === "rate_limited") {
      throw new AiUserError(
        ar
          ? "تجاوزت عدد الطلبات المسموح في الدقيقة. انتظر قليلاً ثم أعد المحاولة."
          : "You have exceeded the per-minute request limit. Please wait a moment and retry.",
      );
    }
    if (res.code === "quota_exceeded") {
      throw new AiUserError(
        ar
          ? "استنفدت حصتك اليومية من طلبات الذكاء الاصطناعي. حاول غداً."
          : "You have used your daily AI quota. Please try again tomorrow.",
      );
    }
    throw new Error(res.code);
  },
};

/** Error whose message is already user-facing and must not trigger a fallback. */
export class AiUserError extends Error {}

const limiter = new RateLimiter({ maxRequests: 25, windowMs: 60_000 });

/**
 * Guests (no session) cannot call the authenticated gateway server function —
 * it rejects with "Unauthorized: No authorization header provided". Detect that
 * up front and serve the local draft provider instead.
 */
async function hasSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.access_token);
  } catch {
    return false;
  }
}

export const aiService = {
  providerId: gatewayProvider.id,
  isMock: false,
  /** Provider that served the most recent successful request. */
  lastProvider: gatewayProvider.id as string,
  async run(req: AiRequest): Promise<AiResponse> {
    const gate = limiter.check();
    if (!gate.allowed) {
      throw new AiUserError(
        req.lang === "ar"
          ? `تم تجاوز الحد المسموح، أعد المحاولة بعد ${gate.retryIn} ثانية.`
          : `Rate limit reached, retry in ${gate.retryIn}s.`,
      );
    }

    if (!(await hasSession())) {
      aiService.lastProvider = localProvider.id;
      return localProvider.run(req);
    }

    try {
      const result = await gatewayProvider.run(req);
      aiService.lastProvider = gatewayProvider.id;
      return result;
    } catch (error) {
      // Rate limits and quota messages are final — never mask them with a draft.
      if (error instanceof AiUserError) throw error;
      console.warn("[ai] gateway unavailable, using local draft provider", error);
      aiService.lastProvider = localProvider.id;
      return localProvider.run(req);
    }
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
