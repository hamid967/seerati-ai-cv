import type { CareerTwin } from "@/lib/career";

export type PassportField = {
  key: string;
  label: { ar: string; en: string };
  value: string;
  sensitive?: boolean;
};

export type PassportGroup = {
  id: "identity" | "targets" | "experience" | "education" | "certifications" | "skills" | "languages" | "links";
  label: { ar: string; en: string };
  fields: PassportField[];
};

export type CareerPassport = {
  generatedAt: string;
  completeness: number;
  groups: PassportGroup[];
  warnings: Array<{ ar: string; en: string }>;
};

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function normalizeSaudiPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^9665\d{8}$/.test(digits)) return `+${digits}`;
  if (/^05\d{8}$/.test(digits)) return `+966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `+966${digits}`;
  return value.trim();
}

function field(
  key: string,
  ar: string,
  en: string,
  value: unknown,
  sensitive = false,
): PassportField | null {
  const normalized = clean(value);
  return normalized ? { key, label: { ar, en }, value: normalized, ...(sensitive ? { sensitive } : {}) } : null;
}

const compact = <T>(items: Array<T | null | undefined>): T[] => items.filter(Boolean) as T[];

export function buildCareerPassport(twin: CareerTwin): CareerPassport {
  const identity: PassportGroup = {
    id: "identity",
    label: { ar: "الهوية المهنية", en: "Professional identity" },
    fields: compact([
      field("fullName", "الاسم الكامل", "Full name", twin.identity.fullName),
      field("headline", "المسمى/العنوان المهني", "Professional headline", twin.identity.headline),
      field("email", "البريد الإلكتروني", "Email", twin.identity.email, true),
      field("phone", "الجوال", "Mobile", normalizeSaudiPhone(twin.identity.phone), true),
      field("city", "المدينة", "City", twin.identity.city),
      field("summary", "الملخص المهني", "Professional summary", twin.identity.summary),
    ]),
  };

  const targets: PassportGroup = {
    id: "targets",
    label: { ar: "الأهداف المهنية", en: "Career targets" },
    fields: twin.targets.flatMap((target, index) =>
      compact([
        field(`target.${index}.title`, `الهدف ${index + 1}`, `Target ${index + 1}`, target.title),
        field(`target.${index}.seniority`, "المستوى", "Seniority", target.seniority),
        field(`target.${index}.industry`, "القطاع", "Industry", target.industry),
        field(`target.${index}.cities`, "المدن", "Cities", target.cities),
        field(`target.${index}.workMode`, "نمط العمل", "Work mode", target.workMode),
      ]),
    ),
  };

  const experience: PassportGroup = {
    id: "experience",
    label: { ar: "الخبرات", en: "Experience" },
    fields: twin.workHistory.flatMap((item, index) =>
      compact([
        field(`experience.${index}.role`, `المسمى ${index + 1}`, `Role ${index + 1}`, item.role),
        field(`experience.${index}.company`, "الجهة", "Company", item.company),
        field(`experience.${index}.location`, "الموقع", "Location", item.location),
        field(`experience.${index}.dates`, "الفترة", "Period", [item.start, item.end || (item.current ? "Present" : "")].filter(Boolean).join(" — ")),
        field(`experience.${index}.bullets`, "الإنجازات/المهام", "Achievements / responsibilities", item.bullets.join("\n")),
      ]),
    ),
  };

  const education: PassportGroup = {
    id: "education",
    label: { ar: "التعليم", en: "Education" },
    fields: twin.education.flatMap((item, index) =>
      compact([
        field(`education.${index}.degree`, `المؤهل ${index + 1}`, `Degree ${index + 1}`, item.degree),
        field(`education.${index}.school`, "الجهة التعليمية", "Institution", item.school),
        field(`education.${index}.dates`, "الفترة", "Period", [item.start, item.end].filter(Boolean).join(" — ")),
        field(`education.${index}.note`, "ملاحظات", "Notes", item.note),
      ]),
    ),
  };

  const certifications: PassportGroup = {
    id: "certifications",
    label: { ar: "الشهادات المهنية", en: "Certifications" },
    fields: twin.certifications.flatMap((item, index) =>
      compact([
        field(`certification.${index}.title`, `الشهادة ${index + 1}`, `Certification ${index + 1}`, item.title),
        field(`certification.${index}.detail`, "التفاصيل", "Details", item.detail),
      ]),
    ),
  };

  const skills: PassportGroup = {
    id: "skills",
    label: { ar: "المهارات", en: "Skills" },
    fields: twin.skills.map((item, index) => ({
      key: `skill.${index}`,
      label: { ar: `مهارة ${index + 1}`, en: `Skill ${index + 1}` },
      value: item.name,
    })),
  };

  const languages: PassportGroup = {
    id: "languages",
    label: { ar: "اللغات", en: "Languages" },
    fields: twin.languages.map((item, index) => ({
      key: `language.${index}`,
      label: { ar: item.name || `لغة ${index + 1}`, en: item.name || `Language ${index + 1}` },
      value: item.level,
    })),
  };

  const links: PassportGroup = {
    id: "links",
    label: { ar: "الروابط المهنية", en: "Professional links" },
    fields: twin.links.map((item, index) => ({
      key: `link.${index}`,
      label: { ar: item.label || `رابط ${index + 1}`, en: item.label || `Link ${index + 1}` },
      value: item.url,
    })),
  };

  const groups = [identity, targets, experience, education, certifications, skills, languages, links];
  const important = [
    !!twin.identity.fullName,
    !!twin.identity.email,
    !!twin.identity.phone,
    !!twin.identity.city,
    !!twin.identity.headline,
    !!twin.identity.summary,
    twin.targets.length > 0,
    twin.workHistory.length > 0,
    twin.education.length > 0,
    twin.skills.length >= 4,
    twin.languages.length > 0,
    twin.links.length > 0,
  ];
  const completeness = Math.round((important.filter(Boolean).length / important.length) * 100);
  const warnings: CareerPassport["warnings"] = [];
  if (!twin.identity.phone) {
    warnings.push({ ar: "أضف رقم جوال مهني قبل استخدام جوازك في طلبات التوظيف.", en: "Add a professional mobile number before using the passport for applications." });
  }
  if (!twin.identity.city) {
    warnings.push({ ar: "أضف المدينة لتسهيل تعبئة نماذج التوظيف المحلية.", en: "Add your city to make local application forms easier to complete." });
  }
  if (!twin.targets.length) {
    warnings.push({ ar: "حدد هدفًا مهنيًا واحدًا على الأقل.", en: "Add at least one career target." });
  }

  return { generatedAt: new Date().toISOString(), completeness, groups, warnings };
}

export function passportGroupText(group: PassportGroup, lang: "ar" | "en") {
  return group.fields.map((item) => `${item.label[lang]}: ${item.value}`).join("\n");
}

export function passportExport(twin: CareerTwin) {
  const passport = buildCareerPassport(twin);
  return {
    format: "seerati-career-passport-v1",
    generatedAt: passport.generatedAt,
    data: Object.fromEntries(
      passport.groups.map((group) => [
        group.id,
        Object.fromEntries(group.fields.map((item) => [item.key, item.value])),
      ]),
    ),
  };
}
