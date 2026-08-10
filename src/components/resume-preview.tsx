import { useEffect, useRef, useState } from "react";
import type { Resume, ResumeUserDesign, TemplateDef } from "@/lib/types";
import { defaultTemplates } from "@/lib/templates";

export function getTemplate(id: string, list?: TemplateDef[]): TemplateDef {
  const pool = list?.length ? list : defaultTemplates;
  return pool.find((t) => t.id === id) ?? defaultTemplates[0]!;
}

const spacingMap = { compact: 9, normal: 14, airy: 20 } as const;
const bodySize = { compact: 11.5, normal: 12.5, airy: 13 } as const;

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

type Design = TemplateDef["design"];

function SectionTitle({ children, design }: { children: React.ReactNode; design: Design }) {
  const base: React.CSSProperties = {
    color: design.accent,
    fontFamily: design.headingFont === "serif" ? "Georgia, 'Tajawal', serif" : undefined,
  };
  if (design.sectionStyle === "line")
    return (
      <h3
        style={{ ...base, borderBottom: `1.5px solid ${design.accent}`, paddingBottom: 3 }}
        className="mb-2 text-[12.5px] font-bold uppercase tracking-[0.08em]"
      >
        {children}
      </h3>
    );
  if (design.sectionStyle === "bar")
    return (
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold" style={base}>
        <span style={{ background: design.accent }} className="inline-block h-3.5 w-1.5 rounded-full" />
        {children}
      </h3>
    );
  if (design.sectionStyle === "caps")
    return (
      <h3
        className="mb-2 text-[12px] font-bold uppercase tracking-[0.22em]"
        style={{ ...base, fontVariant: "small-caps" }}
      >
        {children}
      </h3>
    );
  return (
    <h3 className="mb-1.5 text-[12.5px] font-bold tracking-wide" style={base}>
      {children}
    </h3>
  );
}

const bulletClass = (b: Design["bullet"]) =>
  b === "square" ? "list-square" : b === "dash" ? "list-none" : "list-disc";

export function ResumePreview({
  resume,
  template,
  templates,
  className,
}: {
  resume: Resume;
  template?: TemplateDef;
  templates?: TemplateDef[];
  className?: string;
}) {
  const tpl = template ?? getTemplate(resume.templateId, templates);
  const d = resume.data;
  const user: ResumeUserDesign = d.design ?? {};
  const design: Design = {
    ...tpl.design,
    accent: user.accent || tpl.design.accent,
    spacing: user.density || tpl.design.spacing,
  };
  const showPhoto = Boolean(design.supportsPhoto && (user.showPhoto ?? true) && d.personal.photoUrl);
  const lang = resume.language;
  const rtl = lang === "ar";
  const gap = spacingMap[design.spacing];
  const fs = bodySize[design.spacing];
  const L = (k: keyof typeof labels) => labels[k][lang];
  const hidden = new Set(d.hiddenSections ?? []);

  const simpleList = (items: { id: string; title: string; detail?: string }[]) => (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.id} style={{ fontSize: fs }} className="leading-relaxed">
          <span className="font-semibold">{i.title}</span>
          {i.detail ? <span className="text-[#4b5768]"> — {i.detail}</span> : null}
        </li>
      ))}
    </ul>
  );

  const sections: Record<string, React.ReactNode> = {
    summary: d.summary ? (
      <p style={{ fontSize: fs }} className="leading-[1.9] text-[#2c3a4b]">
        {d.summary}
      </p>
    ) : null,
    experience: d.experience.length ? (
      <div className="space-y-3">
        {d.experience.map((e) => (
          <div key={e.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-[13px] font-bold">{e.role}</p>
              <p className="text-[11px] text-[#5a6779]">
                {e.start} – {e.current ? (rtl ? "حتى الآن" : "Present") : e.end}
              </p>
            </div>
            <p className="text-[12px] font-medium" style={{ color: design.accent }}>
              {e.company}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            <ul className={`mt-1 space-y-0.5 ${design.bullet === "dash" ? "" : "ps-4"}`}>
              {e.bullets.filter(Boolean).map((b, i) => (
                <li
                  key={i}
                  style={{ fontSize: fs }}
                  className={`${bulletClass(design.bullet)} leading-[1.8] text-[#2c3a4b]`}
                >
                  {design.bullet === "dash" ? `— ${b}` : b}
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
              <p className="text-[12.5px] font-bold">{e.degree}</p>
              <p className="text-[12px] text-[#4b5768]">
                {e.school}
                {e.note ? ` · ${e.note}` : ""}
              </p>
            </div>
            <p className="text-[11px] text-[#5a6779]">
              {e.start} – {e.end}
            </p>
          </div>
        ))}
      </div>
    ) : null,
    skills: d.skills.length ? (
      design.sectionStyle === "line" || design.sectionStyle === "caps" ? (
        <p style={{ fontSize: fs }} className="leading-[1.9] text-[#2c3a4b]">
          {d.skills.map((s) => s.name).join(" · ")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {d.skills.map((s) => (
            <span
              key={s.id}
              className="rounded-md px-2 py-0.5 text-[11.5px]"
              style={{ background: `${design.accent}14`, color: design.accent }}
            >
              {s.name}
            </span>
          ))}
        </div>
      )
    ) : null,
    languages: d.languages.length ? (
      <ul className="space-y-1">
        {d.languages.map((l) => (
          <li key={l.id} className="flex justify-between gap-2 text-[12px]">
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
          <li key={l.id} className="break-all text-[11.5px]">
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

  const sidebarKeys = ["skills", "languages", "links", "certificates"] as const;
  const sidebar = design.layout !== "single";
  const order = d.sectionOrder.filter((k) => !hidden.has(k));
  const mainOrder = order.filter((k) => !sidebar || !sidebarKeys.includes(k as never));
  const asideOrder = order.filter((k) => sidebarKeys.includes(k as never));

  const renderSections = (keys: string[]) =>
    keys.map((k) => {
      const node = sections[k];
      if (!node) return null;
      const title = k === "custom" && d.custom.length === 1 ? d.custom[0]!.title : L(k as keyof typeof labels);
      return (
        <section key={k} style={{ marginBottom: gap }}>
          <SectionTitle design={design}>{title}</SectionTitle>
          {node}
        </section>
      );
    });

  const name = d.personal.fullName || (rtl ? "اسمك الكامل" : "Your name");
  const contactBits = [
    d.personal.email,
    d.personal.phone,
    [d.personal.city, d.personal.country].filter(Boolean).join(", "),
    d.personal.nationality,
  ].filter(Boolean) as string[];

  const nameStyle: React.CSSProperties = {
    fontFamily: design.headingFont === "serif" ? "Georgia, 'Tajawal', serif" : undefined,
  };

  const Photo = () =>
    showPhoto ? (
      <img
        src={d.personal.photoUrl}
        alt={name}
        className="h-[74px] w-[74px] shrink-0 rounded-full object-cover"
        style={{ border: `2px solid ${design.accent}` }}
      />
    ) : null;

  const header = () => {
    if (design.header === "banner")
      return (
        <header className="-mx-8 -mt-8 mb-5 flex items-center gap-4 px-8 py-6" style={{ background: design.accent }}>
          <Photo />
          <div className="min-w-0 text-white">
            <h1 className="text-[26px] font-extrabold leading-tight" style={nameStyle}>
              {name}
            </h1>
            {d.personal.jobTitle && <p className="mt-0.5 text-[13px] opacity-90">{d.personal.jobTitle}</p>}
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-85">
              {contactBits.map((x, i) => (
                <span key={i}>{x}</span>
              ))}
            </p>
          </div>
        </header>
      );
    if (design.header === "centered")
      return (
        <header className="mb-6 text-center">
          <h1 className="text-[27px] font-semibold tracking-tight" style={{ ...nameStyle, color: "#101828" }}>
            {name}
          </h1>
          {d.personal.jobTitle && (
            <p className="mt-1 text-[12.5px] uppercase tracking-[0.24em] text-[#5a6779]">{d.personal.jobTitle}</p>
          )}
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 text-[11px] text-[#5a6779]">
            {contactBits.map((x, i) => (
              <span key={i}>{x}</span>
            ))}
          </p>
        </header>
      );
    if (design.header === "split")
      return (
        <header
          className="mb-5 flex flex-wrap items-end justify-between gap-3 pb-3"
          style={{ borderBottom: `2.5px solid ${design.accent}` }}
        >
          <div>
            <h1 className="text-[26px] font-bold leading-tight" style={{ ...nameStyle, color: "#0f1b2d" }}>
              {name}
            </h1>
            {d.personal.jobTitle && (
              <p className="mt-1 text-[13px] font-medium" style={{ color: design.accent }}>
                {d.personal.jobTitle}
              </p>
            )}
          </div>
          <div className={`text-[11px] leading-[1.7] text-[#5a6779] ${rtl ? "text-left" : "text-right"}`}>
            {contactBits.map((x, i) => (
              <div key={i}>{x}</div>
            ))}
          </div>
        </header>
      );
    return (
      <header className="mb-5 flex items-start gap-4">
        <Photo />
        <div className="min-w-0">
          <h1 className="text-[25px] font-extrabold leading-tight" style={{ ...nameStyle, color: design.accent }}>
            {name}
          </h1>
          {d.personal.jobTitle && <p className="mt-0.5 text-[13px] font-medium text-[#3d4b5e]">{d.personal.jobTitle}</p>}
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#5a6779]">
            {contactBits.map((x, i) => (
              <span key={i}>{x}</span>
            ))}
          </p>
          <div className="mt-3 h-[2px] w-full rounded-full" style={{ background: design.accent }} />
        </div>
      </header>
    );
  };

  const aside = (
    <aside
      className="rounded-lg p-3.5"
      style={{ background: `${design.accent}0f`, borderTop: `3px solid ${design.accent}` }}
    >
      {renderSections(asideOrder)}
    </aside>
  );

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className={`paper mx-auto w-full max-w-[820px] p-8 shadow-soft ${className ?? ""}`}
      style={{ aspectRatio: "1 / 1.414", minHeight: 0 }}
    >
      {header()}
      {sidebar ? (
        <div
          className={
            design.layout === "sidebar-left"
              ? "grid grid-cols-[210px_1fr] gap-6"
              : "grid grid-cols-[1fr_210px] gap-6"
          }
        >
          {design.layout === "sidebar-left" ? (
            <>
              {aside}
              <div>{renderSections(mainOrder)}</div>
            </>
          ) : (
            <>
              <div>{renderSections(mainOrder)}</div>
              {aside}
            </>
          )}
        </div>
      ) : (
        <div>{renderSections(mainOrder)}</div>
      )}
    </div>
  );
}

/** Scaled, non-interactive preview used for gallery thumbnails. */
export function ResumeThumb({
  resume,
  template,
}: {
  resume: Resume;
  template?: TemplateDef;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none relative w-full overflow-hidden rounded-lg border bg-white"
      style={{ aspectRatio: "1 / 1.414" }}
      aria-hidden
    >
      <div
        className="absolute top-0"
        style={{ left: 0, width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <ResumePreview resume={resume} {...(template ? { template } : {})} className="shadow-none" />
      </div>
    </div>
  );
}
