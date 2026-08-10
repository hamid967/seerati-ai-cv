import type { Resume, TemplateDef } from "@/lib/types";
import { defaultTemplates } from "@/lib/templates";

export function getTemplate(id: string): TemplateDef {
  return defaultTemplates.find((t) => t.id === id) ?? defaultTemplates[0]!;
}

const spacingMap = { compact: 10, normal: 14, airy: 20 } as const;

function SectionTitle({
  children,
  design,
}: {
  children: React.ReactNode;
  design: TemplateDef["design"];
}) {
  const style: React.CSSProperties = {
    color: design.accent,
    fontFamily: design.headingFont === "serif" ? "Georgia, 'Tajawal', serif" : undefined,
  };
  if (design.sectionStyle === "line") {
    return (
      <h3 style={{ ...style, borderBottom: `1.5px solid ${design.accent}`, paddingBottom: 3 }} className="mb-2 text-[13px] font-bold uppercase tracking-wide">
        {children}
      </h3>
    );
  }
  if (design.sectionStyle === "bar") {
    return (
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold" style={style}>
        <span style={{ background: design.accent }} className="inline-block h-3.5 w-1.5 rounded-full" />
        {children}
      </h3>
    );
  }
  return (
    <h3 className="mb-2 text-[13px] font-bold tracking-wide" style={style}>
      {children}
    </h3>
  );
}

const labels = {
  summary: { ar: "الملخص المهني", en: "Professional Summary" },
  experience: { ar: "الخبرات العملية", en: "Experience" },
  education: { ar: "التعليم", en: "Education" },
  skills: { ar: "المهارات", en: "Skills" },
  languages: { ar: "اللغات", en: "Languages" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  projects: { ar: "المشاريع", en: "Projects" },
  achievements: { ar: "الإنجازات", en: "Achievements" },
  volunteering: { ar: "العمل التطوعي", en: "Volunteering" },
  links: { ar: "الروابط", en: "Links" },
  references: { ar: "المراجع", en: "References" },
  custom: { ar: "قسم مخصص", en: "Custom" },
} as const;

export function ResumePreview({ resume }: { resume: Resume }) {
  const tpl = getTemplate(resume.templateId);
  const d = resume.data;
  const lang = resume.language;
  const gap = spacingMap[tpl.design.spacing];
  const L = (k: keyof typeof labels) => labels[k][lang];

  const simpleList = (items: { id: string; title: string; detail?: string }[]) => (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.id} className="text-[12.5px] leading-relaxed">
          <span className="font-semibold">{i.title}</span>
          {i.detail ? <span className="text-[#4b5768]"> — {i.detail}</span> : null}
        </li>
      ))}
    </ul>
  );

  const sections: Record<string, React.ReactNode> = {
    summary: d.summary ? <p className="text-[12.5px] leading-[1.9] text-[#2c3a4b]">{d.summary}</p> : null,
    experience: d.experience.length ? (
      <div className="space-y-3">
        {d.experience.map((e) => (
          <div key={e.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-[13px] font-bold">{e.role}</p>
              <p className="text-[11.5px] text-[#5a6779]">
                {e.start} – {e.current ? (lang === "ar" ? "حتى الآن" : "Present") : e.end}
              </p>
            </div>
            <p className="text-[12px] font-medium" style={{ color: tpl.design.accent }}>
              {e.company}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            <ul className="mt-1 space-y-0.5 ps-4">
              {e.bullets.filter(Boolean).map((b, i) => (
                <li key={i} className="list-disc text-[12.5px] leading-[1.8] text-[#2c3a4b]">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ) : null,
    education: d.education.length ? (
      <div className="space-y-2">
        {d.education.map((e) => (
          <div key={e.id} className="flex flex-wrap items-baseline justify-between gap-1">
            <div>
              <p className="text-[13px] font-bold">{e.degree}</p>
              <p className="text-[12px] text-[#4b5768]">
                {e.school}
                {e.note ? ` · ${e.note}` : ""}
              </p>
            </div>
            <p className="text-[11.5px] text-[#5a6779]">
              {e.start} – {e.end}
            </p>
          </div>
        ))}
      </div>
    ) : null,
    skills: d.skills.length ? (
      <div className="flex flex-wrap gap-1.5">
        {d.skills.map((s) => (
          <span
            key={s.id}
            className="rounded-md px-2 py-0.5 text-[11.5px]"
            style={{ background: `${tpl.design.accent}14`, color: tpl.design.accent }}
          >
            {s.name}
          </span>
        ))}
      </div>
    ) : null,
    languages: d.languages.length ? (
      <ul className="space-y-1">
        {d.languages.map((l) => (
          <li key={l.id} className="flex justify-between text-[12.5px]">
            <span className="font-semibold">{l.name}</span>
            <span className="text-[#5a6779]">{l.level}</span>
          </li>
        ))}
      </ul>
    ) : null,
    certificates: d.certificates.length ? simpleList(d.certificates) : null,
    projects: d.projects.length ? simpleList(d.projects) : null,
    achievements: d.achievements.length ? simpleList(d.achievements) : null,
    volunteering: d.volunteering.length ? simpleList(d.volunteering) : null,
    references: d.references.length ? simpleList(d.references) : null,
    links: d.links.length ? (
      <ul className="space-y-1">
        {d.links.map((l) => (
          <li key={l.id} className="text-[12.5px]">
            <span className="font-semibold">{l.label}:</span> <span className="text-[#4b5768]">{l.url}</span>
          </li>
        ))}
      </ul>
    ) : null,
    custom: d.custom.length ? (
      <div className="space-y-3">
        {d.custom.map((c) => (
          <div key={c.id}>
            <p className="text-[12.5px] font-bold">{c.title}</p>
            {simpleList(c.items)}
          </div>
        ))}
      </div>
    ) : null,
  };

  const sidebarKeys = ["skills", "languages", "links"] as const;
  const isSidebar = tpl.design.layout === "sidebar";
  const mainOrder = d.sectionOrder.filter((k) => !isSidebar || !sidebarKeys.includes(k as never));

  const renderSections = (keys: string[]) =>
    keys.map((k) => {
      const node = sections[k];
      if (!node) return null;
      const title = k === "custom" && d.custom.length === 1 ? d.custom[0]!.title : L(k as keyof typeof labels);
      return (
        <section key={k} style={{ marginBottom: gap }}>
          {k === "custom" && d.custom.length === 1 ? (
            <SectionTitle design={tpl.design}>{title}</SectionTitle>
          ) : (
            <SectionTitle design={tpl.design}>{title}</SectionTitle>
          )}
          {node}
        </section>
      );
    });

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="paper mx-auto w-full max-w-[820px] p-8 shadow-soft"
      style={{ aspectRatio: "1 / 1.414", minHeight: 0 }}
    >
      <header className="mb-5">
        <h1
          className="text-2xl font-extrabold leading-tight"
          style={{
            color: tpl.design.accent,
            fontFamily: tpl.design.headingFont === "serif" ? "Georgia, 'Tajawal', serif" : undefined,
          }}
        >
          {d.personal.fullName || (lang === "ar" ? "اسمك الكامل" : "Your name")}
        </h1>
        {d.personal.jobTitle && <p className="mt-0.5 text-[13.5px] font-medium text-[#3d4b5e]">{d.personal.jobTitle}</p>}
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-[#5a6779]">
          {[d.personal.email, d.personal.phone, [d.personal.city, d.personal.country].filter(Boolean).join(", "), d.personal.nationality]
            .filter(Boolean)
            .map((x, i) => (
              <span key={i}>{x}</span>
            ))}
        </p>
        <div className="mt-3 h-[3px] w-full rounded-full" style={{ background: `${tpl.design.accent}` }} />
      </header>

      {isSidebar ? (
        <div className="grid grid-cols-[1fr_200px] gap-6">
          <div>{renderSections(mainOrder)}</div>
          <aside className="rounded-lg p-3" style={{ background: `${tpl.design.accent}0d` }}>
            {renderSections([...sidebarKeys])}
          </aside>
        </div>
      ) : (
        <div>{renderSections(mainOrder)}</div>
      )}
    </div>
  );
}
