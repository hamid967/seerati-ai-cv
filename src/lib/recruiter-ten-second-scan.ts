import { analyzeResume } from "./ats";
import { verifiedFacts, type FactGraph } from "./career-facts";
import { buildRecruiterSnapshot } from "./recruiter-view";
import { lintResume } from "./resume-lint";
import type { Resume, SectionKey, TemplateDef } from "./types";

export type LocalizedText = { ar: string; en: string };
export type RecruiterScanBand = "strong" | "workable" | "weak";
export type AttentionLevel = "high" | "medium" | "low";

export type RecruiterScanCategory = {
  id: "identity" | "proof" | "relevance" | "scanability" | "trust";
  label: LocalizedText;
  score: number;
  max: number;
  explanation: LocalizedText;
};

export type RecruiterTimelineMoment = {
  window: "0–2s" | "2–5s" | "5–10s";
  title: LocalizedText;
  notices: LocalizedText[];
};

export type RecruiterAttentionItem = {
  section: "header" | SectionKey;
  label: LocalizedText;
  score: number;
  level: AttentionLevel;
  reason: LocalizedText;
};

export type RecruiterScanAction = {
  id: string;
  priority: 1 | 2 | 3;
  step: "personal" | "summary" | "experience" | "skills" | "design" | "evidence";
  title: LocalizedText;
  detail: LocalizedText;
};

export type RecruiterTenSecondScan = {
  score: number;
  band: RecruiterScanBand;
  confidence: "medium" | "high";
  disclaimer: LocalizedText;
  categories: RecruiterScanCategory[];
  timeline: RecruiterTimelineMoment[];
  attentionMap: RecruiterAttentionItem[];
  strongestSignals: LocalizedText[];
  blindSpots: LocalizedText[];
  actions: RecruiterScanAction[];
};

const clamp = (n: number, max = 100) => Math.max(0, Math.min(max, Math.round(n)));
const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const hasNumber = (value: string) => /\d|[٠-٩]/.test(value);

function attention(score: number): AttentionLevel {
  return score >= 75 ? "high" : score >= 45 ? "medium" : "low";
}

function visibleSections(resume: Resume) {
  const hidden = new Set(resume.data.hiddenSections ?? []);
  return resume.data.sectionOrder.filter((section) => !hidden.has(section));
}

function sectionLabel(section: "header" | SectionKey): LocalizedText {
  const labels: Record<"header" | SectionKey, LocalizedText> = {
    header: { ar: "الرأس والهوية المهنية", en: "Header & professional identity" },
    summary: { ar: "الملخص المهني", en: "Professional summary" },
    experience: { ar: "الخبرات", en: "Experience" },
    education: { ar: "التعليم", en: "Education" },
    skills: { ar: "المهارات", en: "Skills" },
    languages: { ar: "اللغات", en: "Languages" },
    certificates: { ar: "الشهادات", en: "Certificates" },
    projects: { ar: "المشاريع", en: "Projects" },
    achievements: { ar: "الإنجازات", en: "Achievements" },
    volunteering: { ar: "التطوع", en: "Volunteering" },
    links: { ar: "الروابط", en: "Links" },
    references: { ar: "المراجع", en: "References" },
    custom: { ar: "الأقسام المخصصة", en: "Custom sections" },
  };
  return labels[section];
}

function sectionContentScore(resume: Resume, section: SectionKey) {
  const d = resume.data;
  if (section === "summary") {
    const words = wordCount(d.summary);
    return d.summary ? clamp(45 + Math.min(words, 60) * 0.7 + (hasNumber(d.summary) ? 12 : 0)) : 10;
  }
  if (section === "experience") {
    const bullets = d.experience.flatMap((item) => item.bullets.filter(Boolean));
    const quantified = bullets.filter(hasNumber).length;
    return clamp(30 + d.experience.length * 12 + Math.min(bullets.length, 8) * 4 + quantified * 5);
  }
  if (section === "skills") return clamp(25 + Math.min(d.skills.length, 12) * 6);
  if (section === "education") return clamp(25 + Math.min(d.education.length, 3) * 18);
  if (section === "projects") return clamp(20 + Math.min(d.projects.length, 4) * 16);
  if (section === "achievements") return clamp(20 + Math.min(d.achievements.length, 4) * 18);
  if (section === "certificates") return clamp(20 + Math.min(d.certificates.length, 5) * 12);
  if (section === "languages") return clamp(18 + Math.min(d.languages.length, 4) * 14);
  if (section === "links") return clamp(15 + Math.min(d.links.length, 3) * 18);
  if (section === "volunteering") return clamp(15 + Math.min(d.volunteering.length, 3) * 15);
  if (section === "references") return clamp(10 + Math.min(d.references.length, 2) * 12);
  return clamp(15 + Math.min(d.custom.length, 3) * 14);
}

function buildAttentionMap(resume: Resume): RecruiterAttentionItem[] {
  const sections = visibleSections(resume);
  const title = (resume.data.targetJob || resume.data.personal.jobTitle).trim();
  const headerScore = clamp(
    (resume.data.personal.fullName.trim() ? 25 : 0) +
      (title ? 35 : 0) +
      (resume.data.personal.email.trim() ? 12 : 0) +
      (resume.data.personal.phone.trim() ? 12 : 0) +
      (resume.data.personal.city.trim() ? 8 : 0) +
      (resume.data.links.length ? 8 : 0),
  );
  const items: RecruiterAttentionItem[] = [
    {
      section: "header",
      label: sectionLabel("header"),
      score: headerScore,
      level: attention(headerScore),
      reason: title
        ? {
            ar: "المسمى المهني وبيانات التواصل ظاهرة في أعلى السيرة، لذلك تُقرأ مبكرًا.",
            en: "The professional title and contact details sit at the top, so they are scanned early.",
          }
        : {
            ar: "غياب مسمى مهني واضح يضعف أول إشارة يلتقطها المراجع.",
            en: "A missing professional title weakens the first signal a reviewer can pick up.",
          },
    },
  ];

  sections.forEach((section, index) => {
    const base = sectionContentScore(resume, section);
    const positionBonus = Math.max(0, 22 - index * 4);
    const score = clamp(base * 0.78 + positionBonus);
    items.push({
      section,
      label: sectionLabel(section),
      score,
      level: attention(score),
      reason: {
        ar:
          index <= 2
            ? "موقع القسم مبكر في ترتيب السيرة ويرفع احتمال ملاحظته."
            : "القسم يظهر متأخرًا نسبيًا في مسار القراءة.",
        en:
          index <= 2
            ? "The section appears early in the resume order, increasing its scan prominence."
            : "The section appears later in the likely scan path.",
      },
    });
  });

  return items.sort((a, b) => b.score - a.score);
}

export function buildRecruiterTenSecondScan(
  resume: Resume,
  options: { graph?: FactGraph; jobDescription?: string; template?: TemplateDef } = {},
): RecruiterTenSecondScan {
  const graph = options.graph ?? { facts: [], evidence: [] };
  const d = resume.data;
  const title = (d.targetJob || d.personal.jobTitle).trim();
  const jd = (options.jobDescription ?? d.jobDescription ?? "").trim();
  const ats = analyzeResume(resume, options.template, jd);
  const snapshot = buildRecruiterSnapshot(resume, { graph, jobDescription: jd });
  const lint = lintResume(resume, graph);
  const verified = verifiedFacts(graph);
  const bullets = d.experience.flatMap((item) => item.bullets.filter((bullet) => bullet.trim()));
  const quantified = bullets.filter(hasNumber).length;
  const firstRole = d.experience[0];
  const summaryWords = wordCount(d.summary);

  let identity = 0;
  if (d.personal.fullName.trim()) identity += 5;
  if (title) identity += 10;
  if (d.personal.email.trim() && d.personal.phone.trim()) identity += 4;
  if (d.personal.city.trim()) identity += 2;
  if (summaryWords >= 25 && summaryWords <= 100) identity += 4;

  let proof = 0;
  if (d.experience.length) proof += 6;
  if (firstRole?.role.trim() && firstRole.company.trim()) proof += 4;
  proof += Math.min(6, quantified * 2);
  proof += Math.min(9, verified.length * 3);

  let relevance = 8;
  if (title) relevance += 4;
  if (jd && ats.keywords) relevance = clamp(6 + ats.keywords.coverage * 0.14, 20);
  else if (d.skills.length >= 6) relevance += 5;
  if (d.summary.toLowerCase().includes(title.toLowerCase()) && title) relevance += 3;
  relevance = clamp(relevance, 20);

  const scanFlags = lint.findings.filter(
    (finding) => finding.category === "readability" || finding.category === "structure",
  ).length;
  let scanability = clamp(20 - scanFlags * 2.5, 20);
  if (options.template && !options.template.atsFriendly) scanability = clamp(scanability - 3, 20);
  if ((d.hiddenSections ?? []).includes("experience")) scanability = clamp(scanability - 5, 20);

  let trust = 0;
  if (snapshot.contact.complete) trust += 3;
  if (snapshot.yearsExperience !== null) trust += 2;
  if (verified.length) trust += 3;
  if (!snapshot.vaguest) trust += 2;

  const categories: RecruiterScanCategory[] = [
    {
      id: "identity",
      label: { ar: "وضوح الهوية", en: "Identity clarity" },
      score: clamp(identity, 25),
      max: 25,
      explanation: {
        ar: "هل يعرف المراجع بسرعة من أنت وما الدور الذي تستهدفه؟",
        en: "Can a reviewer quickly tell who you are and what role you target?",
      },
    },
    {
      id: "proof",
      label: { ar: "قوة الدليل", en: "Proof strength" },
      score: clamp(proof, 25),
      max: 25,
      explanation: {
        ar: "خبرة وإنجازات وأرقام وحقائق موثقة بدل الادعاءات العامة.",
        en: "Experience, outcomes, figures and verified facts instead of broad claims.",
      },
    },
    {
      id: "relevance",
      label: { ar: "صلة السيرة بالدور", en: "Role relevance" },
      score: relevance,
      max: 20,
      explanation: {
        ar: "مدى ظهور المهارات والمسمى والكلمات ذات الصلة بالدور المستهدف.",
        en: "How visibly the title, skills and job-relevant terms align with the target role.",
      },
    },
    {
      id: "scanability",
      label: { ar: "قابلية المسح", en: "Scanability" },
      score: scanability,
      max: 20,
      explanation: {
        ar: "ترتيب واضح وقالب قابل للقراءة مع تقليل عوائق المسح البصري.",
        en: "Clear ordering and readable presentation with fewer scan barriers.",
      },
    },
    {
      id: "trust",
      label: { ar: "الثقة والاتساق", en: "Trust & consistency" },
      score: clamp(trust, 10),
      max: 10,
      explanation: {
        ar: "تواريخ واتصال وأدلة وعبارات محددة قابلة للتحقق.",
        en: "Dates, contact details, evidence and specific claims that can be checked.",
      },
    },
  ];

  const score = clamp(categories.reduce((sum, category) => sum + category.score, 0));
  const band: RecruiterScanBand = score >= 80 ? "strong" : score >= 60 ? "workable" : "weak";
  const strongestSignals: LocalizedText[] = [];
  if (title)
    strongestSignals.push({
      ar: `المسمى المهني واضح: ${title}`,
      en: `Professional title is clear: ${title}`,
    });
  if (firstRole?.role.trim())
    strongestSignals.push({
      ar: `أول خبرة تظهر دور «${firstRole.role}»${firstRole.company ? ` لدى ${firstRole.company}` : ""}.`,
      en: `The first role shows “${firstRole.role}”${firstRole.company ? ` at ${firstRole.company}` : ""}.`,
    });
  if (quantified)
    strongestSignals.push({
      ar: `${quantified} نقطة خبرة تحتوي أرقامًا/نتائج قابلة للملاحظة.`,
      en: `${quantified} experience bullet${quantified === 1 ? "" : "s"} include observable figures/results.`,
    });
  if (verified.length)
    strongestSignals.push({
      ar: `${verified.length} حقيقة مهنية موثقة متاحة في خزانة الأدلة.`,
      en: `${verified.length} verified career fact${verified.length === 1 ? "" : "s"} are available in the evidence vault.`,
    });
  if (jd && ats.keywords)
    strongestSignals.push({
      ar: `تغطية كلمات الوصف الوظيفي الحالية ${ats.keywords.coverage}٪.`,
      en: `Current job-description keyword coverage is ${ats.keywords.coverage}%.`,
    });

  const blindSpots: LocalizedText[] = [];
  if (!title)
    blindSpots.push({
      ar: "لا يوجد مسمى مهني/دور مستهدف واضح في أول نظرة.",
      en: "No clear professional title/target role is visible at first glance.",
    });
  if (!d.summary.trim())
    blindSpots.push({
      ar: "الملخص المهني مفقود، فيفقد المراجع سياق القيمة بسرعة.",
      en: "The professional summary is missing, so the reviewer gets less context quickly.",
    });
  if (!quantified && bullets.length)
    blindSpots.push({
      ar: "نقاط الخبرة موجودة لكنها لا تعرض نتائج رقمية واضحة.",
      en: "Experience bullets exist but do not show clear quantified outcomes.",
    });
  if (!verified.length)
    blindSpots.push({
      ar: "لا توجد حقائق مهنية موثقة في خزانة الأدلة حتى الآن.",
      en: "There are no verified career facts in the evidence vault yet.",
    });
  if (jd && ats.keywords && ats.keywords.coverage < 55)
    blindSpots.push({
      ar: "صلة الكلمات المفتاحية بالوصف الوظيفي منخفضة نسبيًا؛ لا تضف كلمة إلا إذا كانت صحيحة عن خبرتك.",
      en: "Keyword relevance to the job description is relatively low; only add terms that are true of your experience.",
    });
  if (snapshot.vaguest)
    blindSpots.push({
      ar: `هناك عبارة عامة تحتاج تحديدًا: «${snapshot.vaguest.text}».`,
      en: `One broad statement needs more specificity: “${snapshot.vaguest.text}”.`,
    });

  const actions: RecruiterScanAction[] = [];
  if (!title)
    actions.push({
      id: "title",
      priority: 1,
      step: "personal",
      title: {
        ar: "ثبّت المسمى المستهدف أعلى السيرة",
        en: "Make the target title explicit at the top",
      },
      detail: {
        ar: "استخدم المسمى الحقيقي الذي تستهدفه دون تضخيم المستوى الوظيفي.",
        en: "Use the real role you target without inflating seniority.",
      },
    });
  if (!d.summary.trim() || summaryWords < 25)
    actions.push({
      id: "summary",
      priority: 1,
      step: "summary",
      title: { ar: "قوِّ أول 3 أسطر", en: "Strengthen the first three lines" },
      detail: {
        ar: "اكتب ملخصًا قصيرًا يوضح التخصص والقيمة وخبرة مثبتة فقط.",
        en: "Write a concise summary showing specialization, value and only supported experience.",
      },
    });
  if (bullets.length && quantified / Math.max(1, bullets.length) < 0.35)
    actions.push({
      id: "metrics",
      priority: 2,
      step: "experience",
      title: { ar: "حوّل المهام إلى أثر قابل للملاحظة", en: "Turn duties into observable impact" },
      detail: {
        ar: "أضف أرقامًا فقط عندما تكون حقيقية ويمكنك تأكيدها؛ وإلا استخدم نتيجة وصفية محددة.",
        en: "Add figures only when true and confirmable; otherwise use a specific qualitative outcome.",
      },
    });
  if (!verified.length)
    actions.push({
      id: "evidence",
      priority: 2,
      step: "evidence",
      title: { ar: "وثّق أقوى إنجاز", en: "Verify your strongest achievement" },
      detail: {
        ar: "أضف حقيقة واحدة على الأقل مع دليل أو مرجع داخل خزانة الأدلة.",
        en: "Add at least one career fact with evidence or a reference in the evidence vault.",
      },
    });
  if (jd && ats.keywords && ats.keywords.coverage < 55)
    actions.push({
      id: "relevance",
      priority: 2,
      step: "skills",
      title: { ar: "راجع فجوة وصف الوظيفة", en: "Review the job-description gap" },
      detail: {
        ar: "قارن المهارات المطلوبة بخبرتك الفعلية وأظهر المطابق منها فقط.",
        en: "Compare requested skills with your actual experience and surface only genuine matches.",
      },
    });
  if (scanFlags >= 2 || (options.template && !options.template.atsFriendly))
    actions.push({
      id: "design",
      priority: 3,
      step: "design",
      title: { ar: "بسّط مسار القراءة", en: "Simplify the scan path" },
      detail: {
        ar: "استخدم ترتيبًا مبكرًا للملخص والخبرة والمهارات وقالبًا آمنًا عند التقديم الإلكتروني.",
        en: "Prioritize summary, experience and skills early and use an ATS-safe template for online applications.",
      },
    });

  const timeline: RecruiterTimelineMoment[] = [
    {
      window: "0–2s",
      title: { ar: "من أنت؟", en: "Who are you?" },
      notices: [
        title
          ? { ar: `يلتقط المسمى: ${title}`, en: `Picks up the title: ${title}` }
          : { ar: "لا يلتقط مسمى مستهدفًا واضحًا.", en: "No clear target title is picked up." },
        snapshot.contact.complete
          ? { ar: "بيانات التواصل مكتملة بصريًا.", en: "Contact details are visually complete." }
          : {
              ar: "هناك نقص في بيانات التواصل الأساسية.",
              en: "Some core contact details are missing.",
            },
      ],
    },
    {
      window: "2–5s",
      title: { ar: "هل لديك دليل؟", en: "Where is the proof?" },
      notices: [
        firstRole
          ? {
              ar: `أول خبرة: ${firstRole.role || "دور غير مسمى"}${firstRole.company ? ` — ${firstRole.company}` : ""}`,
              en: `First role: ${firstRole.role || "Untitled role"}${firstRole.company ? ` — ${firstRole.company}` : ""}`,
            }
          : {
              ar: "لا تظهر خبرة عملية في هذه المرحلة.",
              en: "No work experience is visible at this stage.",
            },
        quantified
          ? {
              ar: `يرى ${quantified} إشارة رقمية داخل نقاط الخبرة.`,
              en: `Sees ${quantified} numeric signal${quantified === 1 ? "" : "s"} in experience bullets.`,
            }
          : {
              ar: "لا توجد نتائج رقمية ظاهرة في نقاط الخبرة.",
              en: "No quantified outcomes are visible in experience bullets.",
            },
      ],
    },
    {
      window: "5–10s",
      title: { ar: "هل تناسب الدور؟", en: "Do you fit the role?" },
      notices:
        jd && ats.keywords
          ? [
              {
                ar: `تغطية الكلمات المرتبطة بالوصف: ${ats.keywords.coverage}٪.`,
                en: `Job-description term coverage: ${ats.keywords.coverage}%.`,
              },
              {
                ar: `${d.skills.length} مهارة مسجلة في السيرة.`,
                en: `${d.skills.length} skills are listed in the resume.`,
              },
            ]
          : [
              {
                ar: `${d.skills.length} مهارة ظاهرة بدون وصف وظيفة للمقارنة.`,
                en: `${d.skills.length} skills are visible without a job description to compare against.`,
              },
              {
                ar: "النتيجة هنا تقيس وضوح السيرة لا احتمال القبول.",
                en: "This measures resume clarity, not hiring probability.",
              },
            ],
    },
  ];

  return {
    score,
    band,
    confidence: jd || verified.length ? "high" : "medium",
    disclaimer: {
      ar: "هذه محاكاة قواعد ثابتة لمسار قراءة محتمل خلال أول 10 ثوانٍ، وليست تتبع عين حقيقيًا ولا تمثل قرار مسؤول توظيف أو احتمال قبول.",
      en: "This is a deterministic approximation of a likely first-10-second scan, not real eye tracking, a recruiter decision, or a hiring probability.",
    },
    categories,
    timeline,
    attentionMap: buildAttentionMap(resume),
    strongestSignals: strongestSignals.slice(0, 5),
    blindSpots: blindSpots.slice(0, 5),
    actions: actions.slice(0, 6),
  };
}
