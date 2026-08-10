/**
 * Next Best Action engine — deterministic priority, never AI-decided.
 *
 * The engine only reads facts the system already knows: twin completeness,
 * evidence verification, resume lint findings, the target job, application
 * status, interview dates and cover-letter state. An assistant may narrate
 * *why* an action matters, but it can never invent an action or change a status
 * here, because nothing in this file calls a model.
 */
import type { CareerTwin, JobStatus, JobWorkspace } from "./career";
import { twinHealth } from "./career";
import { factsMissingEvidence, verifiedFacts, type FactGraph } from "./career-facts";
import { lintResume } from "./resume-lint";
import type { Resume } from "./types";

export type ActionPriority = "critical" | "high" | "medium" | "low";

export const PRIORITY_LABEL: Record<ActionPriority, { ar: string; en: string }> = {
  critical: { ar: "عاجل", en: "Critical" },
  high: { ar: "مهم", en: "High" },
  medium: { ar: "متوسط", en: "Medium" },
  low: { ar: "لاحقاً", en: "Low" },
};

export type NextAction = {
  id: string;
  priority: ActionPriority;
  title: { ar: string; en: string };
  /** The evidence-based reason, phrased from real data. */
  why: { ar: string; en: string };
  /** In-app destination; params are passed separately for typed links. */
  to: string;
  params?: Record<string, string>;
  /** Which Career Studio specialist owns this step. */
  personaOwner: string;
};

const WEIGHT: Record<ActionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export type NextActionInput = {
  twin: CareerTwin | null;
  graph: FactGraph;
  resumes: Resume[];
  jobs: JobWorkspace[];
  /** Jobs whose interview date is known, from timeline events. */
  upcomingInterviews?: Array<{ jobId: string; jobTitle: string; occurredAt: string }>;
  /** Job ids that already have a cover letter asset. */
  jobsWithCoverLetter?: string[];
  /** Job ids that already have a resume variant snapshot. */
  jobsWithVariant?: string[];
};

const ACTIVE_STATUSES: JobStatus[] = ["applied", "interview", "offer"];

export function computeNextActions(input: NextActionInput, limit = 5): NextAction[] {
  const actions: NextAction[] = [];
  const { twin, graph, resumes, jobs } = input;
  const primary = resumes[0];

  // 1. Interview prep beats everything else once a date exists.
  for (const iv of input.upcomingInterviews ?? []) {
    const stories = graph.facts.filter((f) => f.type === "star_story").length;
    if (stories < 3) {
      actions.push({
        id: `interview_${iv.jobId}`,
        priority: "critical",
        title: {
          ar: `جهّز قصة STAR قبل مقابلة ${iv.jobTitle}`,
          en: `Prepare a STAR story before the ${iv.jobTitle} interview`,
        },
        why: {
          ar: `لديك ${stories} قصة جاهزة فقط، والمقابلة مسجّلة بتاريخ ${new Date(iv.occurredAt).toLocaleDateString("ar")}.`,
          en: `You have only ${stories} ready stories, and the interview is logged for ${new Date(iv.occurredAt).toLocaleDateString("en")}.`,
        },
        to: "/jobs/$id",
        params: { id: iv.jobId },
        personaOwner: "majed",
      });
    }
  }

  // 2. Unverified numbers are a credibility risk in front of a recruiter.
  const needsReview = graph.facts.filter((f) => f.verificationStatus === "needs_review");
  if (needsReview.length) {
    const first = needsReview[0]!;
    actions.push({
      id: "verify_fact",
      priority: "critical",
      title: { ar: "راجع رقماً غير موثّق", en: "Review an unverified figure" },
      why: {
        ar: `«${first.title}» محفوظة بحالة تحتاج مراجعة (${needsReview.length} إجمالاً). أي رقم بلا دليل يضعف مصداقية السيرة.`,
        en: `“${first.title}” is stored as needs review (${needsReview.length} in total). A figure without proof weakens the whole resume.`,
      },
      to: "/career-evidence",
      personaOwner: "noura",
    });
  }

  // 3. Facts with no evidence row at all.
  const noEvidence = factsMissingEvidence(graph);
  if (noEvidence.length >= 2) {
    actions.push({
      id: "add_evidence",
      priority: "high",
      title: {
        ar: `أكمل دليل ${noEvidence.length} حقيقة`,
        en: `Add evidence for ${noEvidence.length} facts`,
      },
      why: {
        ar: "الحقائق بلا دليل لا تُستخدم في الخطابات ولا في إجابات المقابلة.",
        en: "Facts without evidence are not used in letters or interview answers.",
      },
      to: "/career-evidence",
      personaOwner: "noura",
    });
  }

  // 4. A saved job with no tailored variant yet.
  const withVariant = new Set(input.jobsWithVariant ?? []);
  const targetJob = jobs.find((j) => !withVariant.has(j.id) && j.jobDescription.trim().length > 40);
  if (targetJob && primary) {
    actions.push({
      id: `variant_${targetJob.id}`,
      priority: "high",
      title: {
        ar: `أنشئ نسخة سيرة لوظيفة ${targetJob.jobTitle}`,
        en: `Create a resume variant for ${targetJob.jobTitle}`,
      },
      why: {
        ar: "النسخ لا تستهلك حدّ الثلاث سير الذاتية، وتسمح بتخصيص السيرة لهذا الوصف الوظيفي.",
        en: "Variants do not consume your 3-resume limit and let you tailor to this description.",
      },
      to: "/jobs/$id",
      params: { id: targetJob.id },
      personaOwner: "salman",
    });
  }

  // 5. Resume quality findings from the deterministic lint engine.
  if (primary) {
    const report = lintResume(primary, graph);
    const worst = report.findings.find((f) => f.severity === "error") ?? report.findings[0];
    if (worst) {
      actions.push({
        id: "lint_fix",
        priority: report.score < 60 ? "high" : "medium",
        title: { ar: "أصلح أهم ملاحظة في السيرة", en: "Fix the top resume finding" },
        why: {
          ar: `${worst.message.ar} (جودة السيرة الحالية ${report.score}/100).`,
          en: `${worst.message.en} (current quality ${report.score}/100).`,
        },
        to: "/ats",
        personaOwner: "salman",
      });
    }
  }

  // 6. Cover letter missing for an active application.
  const withLetter = new Set(input.jobsWithCoverLetter ?? []);
  const activeNoLetter = jobs.find((j) => ACTIVE_STATUSES.includes(j.status) && !withLetter.has(j.id));
  if (activeNoLetter) {
    actions.push({
      id: `letter_${activeNoLetter.id}`,
      priority: "medium",
      title: {
        ar: `اكتب خطاب تقديم لـ ${activeNoLetter.company || activeNoLetter.jobTitle}`,
        en: `Write a cover letter for ${activeNoLetter.company || activeNoLetter.jobTitle}`,
      },
      why: {
        ar: "الطلب في مرحلة نشطة بدون خطاب مرتبط به.",
        en: "This application is active with no letter attached.",
      },
      to: "/jobs/$id",
      params: { id: activeNoLetter.id },
      personaOwner: "layan",
    });
  }

  // 7. Career twin completeness.
  const health = twinHealth(twin);
  const weakSection = health.sections.find((s) => !s.done);
  if (weakSection && health.score < 80) {
    actions.push({
      id: "twin_complete",
      priority: health.score < 50 ? "high" : "medium",
      title: {
        ar: `أكمل قسم ${weakSection.label.ar} في ملفك المهني`,
        en: `Complete ${weakSection.label.en} in your career profile`,
      },
      why: {
        ar: `اكتمال الملف ${health.score}% — كل قسم ناقص يقلّل جودة كل ما يُبنى منه.`,
        en: `Profile is ${health.score}% complete — every missing section weakens everything built from it.`,
      },
      to: "/career-twin",
      personaOwner: "noura",
    });
  }

  // 8. Nothing tracked yet.
  if (!jobs.length) {
    actions.push({
      id: "first_job",
      priority: "medium",
      title: { ar: "أضف أول وظيفة تستهدفها", en: "Add your first target job" },
      why: {
        ar: "بدون وصف وظيفي لا يمكن حساب المطابقة ولا تخصيص السيرة.",
        en: "Without a job description, matching and tailoring cannot run.",
      },
      to: "/jobs",
      personaOwner: "salman",
    });
  }
  if (!resumes.length) {
    actions.push({
      id: "first_resume",
      priority: "critical",
      title: { ar: "أنشئ سيرتك الأولى", en: "Create your first resume" },
      why: {
        ar: "لا توجد سيرة بعد، وكل أدوات المطابقة والتحسين تعمل على سيرة قائمة.",
        en: "No resume exists yet, and every matching and improvement tool works on one.",
      },
      to: "/resumes/new",
      personaOwner: "salman",
    });
  }
  if (!verifiedFacts(graph).length && graph.facts.length === 0) {
    actions.push({
      id: "first_fact",
      priority: "high",
      title: { ar: "سجّل أول إنجاز موثّق", en: "Record your first documented achievement" },
      why: {
        ar: "المساعد لا يذكر عنك إلا ما هو موجود في خزانة الأدلة.",
        en: "The assistant only states what exists in your evidence vault.",
      },
      to: "/career-evidence",
      personaOwner: "noura",
    });
  }

  const seen = new Set<string>();
  return actions
    .filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)))
    .sort((a, b) => WEIGHT[a.priority] - WEIGHT[b.priority])
    .slice(0, limit);
}
