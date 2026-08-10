/**
 * Prompt construction + response validation for the AI gateway (server-only).
 *
 * Kept out of `ai.functions.ts` on purpose: modules that declare `createServerFn`
 * are split at build time, so sibling runtime helpers must live in an imported
 * module.
 */
import { ITEM_TASKS, type AiRequest, type AiResponse, type AiTask } from "./ai-types";

/** Model chosen for short, latency-sensitive resume editing tasks. */
export const AI_MODEL = "google/gemini-3.6-flash";

const HOUSE_RULES_AR = [
  "أنت «مساعد سيرتي»، كاتب سير ذاتية محترف للسوق السعودي والخليجي.",
  "اكتب عربية فصحى مهنية موجزة، بلا مبالغة وبلا حشو.",
  "لا تختلق أرقاماً ولا إنجازات ولا جهات عمل. إن كان الرقم مطلوباً ولا تعرفه، اكتبه بين قوسين هكذا [أكّد الرقم] ليؤكده المستخدم.",
  "لا تضف مقدمات ولا شروحاً ولا اعتذارات؛ أعد المحتوى المطلوب فقط.",
].join(" ");

const HOUSE_RULES_EN = [
  "You are the Seerati Assistant, a professional resume writer for the Saudi and Gulf market.",
  "Write concise, professional English with no fluff and no exaggeration.",
  "Never invent numbers, achievements or employers. If a figure is needed and unknown, write it as [confirm figure] for the user to confirm.",
  "Do not add preambles, explanations or apologies; return only the requested content.",
].join(" ");

function contextBlock(req: AiRequest): string {
  const c = req.context ?? {};
  const bits: string[] = [];
  if (c.targetRole || c.personal?.jobTitle) bits.push(`Target role: ${c.targetRole || c.personal?.jobTitle}`);
  if (c.answers?.["years"]) bits.push(`Years of experience: ${c.answers["years"]}`);
  if (c.answers?.["industry"]) bits.push(`Industry: ${c.answers["industry"]}`);
  if (c.section) bits.push(`Resume section: ${c.section}`);
  if (c.jobDescription) bits.push(`Job description (excerpt): ${c.jobDescription.slice(0, 1500)}`);
  return bits.length ? `\n\nContext:\n${bits.join("\n")}` : "";
}

const TASK_INSTRUCTION: Record<AiTask, { ar: string; en: string }> = {
  summary: {
    ar: "اكتب ملخصاً مهنياً واحداً من ٣ إلى ٤ أسطر (٤٠–٩٠ كلمة) بصيغة الغائب، يبرز التخصص والأثر، دون ضمير المتكلم.",
    en: "Write one professional summary of 3–4 lines (40–90 words) highlighting specialisation and impact, third person, no first-person pronouns.",
  },
  improve: {
    ar: "حسّن النقاط التالية لتبدأ بفعل قوي وتُبرز النتيجة، مع الحفاظ على المعنى والحقائق كما هي.",
    en: "Improve the following bullets so each starts with a strong verb and shows outcome, keeping the meaning and facts unchanged.",
  },
  rewrite: {
    ar: "أعد صياغة النقاط التالية بأسلوب مختلف وأكثر احترافية، دون تغيير الحقائق.",
    en: "Rewrite the following bullets in a different, more professional style without changing any fact.",
  },
  shorten: {
    ar: "اختصر النص التالي إلى نصف طوله تقريباً مع الحفاظ على المعلومات الجوهرية.",
    en: "Shorten the following text to roughly half its length while keeping the essential information.",
  },
  expand: {
    ar: "وسّع النص التالي بسطر أو سطرين من التفاصيل المهنية المعقولة المستنبطة من النص نفسه، دون اختلاق أرقام أو جهات.",
    en: "Expand the following text with one or two lines of reasonable professional detail derived from the text itself, inventing no figures or employers.",
  },
  quantify: {
    ar: "أضف مؤشر قياس مقترحاً لكل نقطة. لا تخترع رقماً حقيقياً: اكتب الرقم المقترح داخل [أكّد الرقم: ...] ليؤكده المستخدم أو يعدّله.",
    en: "Add a suggested metric to each bullet. Do not invent a real number: put the suggested figure inside [confirm figure: ...] for the user to confirm or edit.",
  },
  suggest_skills: {
    ar: "اقترح من ٨ إلى ١٢ مهارة مناسبة للدور المستهدف ولوصف الوظيفة إن وُجد، مهارات مفردة قصيرة بلا شرح.",
    en: "Suggest 8–12 skills relevant to the target role and job description if present, as short standalone skill names with no explanation.",
  },
  proofread: {
    ar: "صحّح الإملاء وعلامات الترقيم والصياغة في النص التالي، وأعد النص المصحّح فقط بنفس اللغة ونفس المعنى.",
    en: "Correct spelling, punctuation and phrasing in the following text and return only the corrected text in the same language and meaning.",
  },
  ats_keywords: {
    ar: "استخرج الكلمات المفتاحية والمهارات الأهم التي تتوقعها أنظمة التوظيف من وصف الوظيفة التالي، كلمات مفردة أو مركبات قصيرة.",
    en: "Extract the most important keywords and skills an applicant tracking system would look for in the following job description, as single words or short phrases.",
  },
  translate: {
    ar: "ترجم النص التالي إلى العربية المهنية المستخدمة في السير الذاتية، مع الحفاظ على المصطلحات التقنية بالإنجليزية عند الحاجة.",
    en: "Translate the following text into professional resume English, keeping technical terms as commonly written in the industry.",
  },
  chat: {
    ar: "أجب بإيجاز (٣ أسطر كحد أقصى) كمستشار سير ذاتية، واطرح سؤالاً واحداً محدداً في النهاية إن كان ذلك مفيداً.",
    en: "Answer briefly (max 3 lines) as a resume advisor, and end with one specific question if that helps.",
  },
};

export function buildPrompt(req: AiRequest): { system: string; prompt: string } {
  const ar = req.lang === "ar";
  const instruction = TASK_INSTRUCTION[req.task][ar ? "ar" : "en"];
  const wantsItems = ITEM_TASKS.includes(req.task);

  const format = wantsItems
    ? ar
      ? 'أعد النتيجة بصيغة JSON فقط بهذا الشكل: {"items": ["...", "..."]} بدون أي نص خارج JSON.'
      : 'Return the result as JSON only, in this exact shape: {"items": ["...", "..."]} with no text outside the JSON.'
    : ar
      ? "أعد النص النهائي فقط بدون علامات تنسيق أو عناوين."
      : "Return only the final text with no markdown or headings.";

  return {
    system: `${ar ? HOUSE_RULES_AR : HOUSE_RULES_EN}\n${format}`,
    prompt: `${instruction}${contextBlock(req)}\n\n---\n${req.input.slice(0, 6000)}`,
  };
}

/** Tolerant extraction of the first JSON object in a model response. */
function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

const cleanItem = (s: string) =>
  s
    .replace(/^\s*(?:[-•*\u2022]|\d+[.)])\s*/, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();

/**
 * Validates the raw model output for a task. Item tasks must yield a non-empty
 * list of strings: JSON is preferred, line splitting is the tolerant fallback.
 * Throws when nothing usable can be recovered so the caller can fall back.
 */
export function validateAiOutput(task: AiTask, raw: string): AiResponse {
  const text = raw.trim();
  if (!text) throw new Error("empty_model_output");

  if (!ITEM_TASKS.includes(task)) {
    return { text: text.replace(/^```[a-z]*\s*|```$/g, "").trim() };
  }

  const parsed = extractJson(text);
  let items: string[] = [];

  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)) {
    items = ((parsed as { items: unknown[] }).items)
      .filter((v): v is string => typeof v === "string")
      .map(cleanItem)
      .filter(Boolean);
  }

  if (items.length === 0) {
    // Fallback: treat the response as a list of lines / comma-separated values.
    const lines = text
      .split("\n")
      .map(cleanItem)
      .filter((l) => Boolean(l) && !l.startsWith("{") && !l.startsWith("}") && !/^```/.test(l));
    items = (lines.length > 1 ? lines : text.split(/[,،]/).map(cleanItem)).filter(Boolean);
  }

  if (items.length === 0) throw new Error("no_items_in_model_output");

  const capped = items.slice(0, 20);
  return { text: capped.join("\n"), items: capped };
}
