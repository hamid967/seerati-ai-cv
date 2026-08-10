import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type {
  CareerTwin,
  CareerTarget,
  Achievement,
  CareerSkill,
} from "@/lib/career";
import type { Experience, Education, LanguageItem, LinkItem } from "@/lib/types";


type WorkMode = "onsite" | "hybrid" | "remote";
const WORK_MODES: WorkMode[] = ["onsite", "hybrid", "remote"];
/** Returns a valid work mode, or null when the field should be cleared. */
function toWorkMode(raw: string): WorkMode | null {
  const v = raw.trim();
  return WORK_MODES.includes(v as WorkMode) ? (v as WorkMode) : null;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

type Ar = boolean;

/* ------------------------------- Identity ------------------------------- */

export function IdentityCard({
  twin,
  ar,
  onChange,
}: {
  twin: CareerTwin;
  ar: Ar;
  onChange: (patch: Partial<CareerTwin["identity"]>) => void;
}) {
  const id = twin.identity;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "الهوية ومعلومات الاتصال" : "Identity & contact"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label={ar ? "الاسم الكامل" : "Full name"}>
          <Input value={id.fullName} onChange={(e) => onChange({ fullName: e.target.value })} />
        </Field>
        <Field label={ar ? "المسمى المهني" : "Headline"}>
          <Input value={id.headline} onChange={(e) => onChange({ headline: e.target.value })} />
        </Field>
        <Field label={ar ? "البريد الإلكتروني" : "Email"}>
          <Input type="email" value={id.email} onChange={(e) => onChange({ email: e.target.value })} />
        </Field>
        <Field label={ar ? "الجوال" : "Phone"}>
          <Input value={id.phone} onChange={(e) => onChange({ phone: e.target.value })} />
        </Field>
        <Field label={ar ? "المدينة" : "City"}>
          <Input value={id.city} onChange={(e) => onChange({ city: e.target.value })} />
        </Field>
        <Field label={ar ? "الملخص المهني" : "Professional summary"} full>
          <Textarea rows={4} value={id.summary} onChange={(e) => onChange({ summary: e.target.value })} />
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1.5 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function RowShell({ children, onRemove, ar }: { children: React.ReactNode; onRemove: () => void; ar: Ar }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="grid flex-1 gap-2">{children}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={ar ? "حذف" : "Remove"}
          onClick={onRemove}
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------- Targets -------------------------------- */

export function TargetsCard({
  targets,
  ar,
  onChange,
}: {
  targets: CareerTarget[];
  ar: Ar;
  onChange: (next: CareerTarget[]) => void;
}) {
  const update = (i: number, patch: Partial<CareerTarget>) =>
    onChange(targets.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const remove = (i: number) => onChange(targets.filter((_, idx) => idx !== i));
  const add = () => onChange([...targets, { id: newId(), title: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "الهدف المهني" : "Career targets"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {targets.map((tg, i) => (
          <RowShell key={tg.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={ar ? "المسمى الوظيفي المستهدف" : "Target title"}
                value={tg.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
              <Input
                placeholder={ar ? "المستوى (مبتدئ/متوسط/أول)" : "Seniority"}
                value={tg.seniority ?? ""}
                onChange={(e) => update(i, { seniority: e.target.value })}
              />
              <Input
                placeholder={ar ? "الصناعة" : "Industry"}
                value={tg.industry ?? ""}
                onChange={(e) => update(i, { industry: e.target.value })}
              />
              <Input
                placeholder={ar ? "المدن" : "Cities"}
                value={tg.cities ?? ""}
                onChange={(e) => update(i, { cities: e.target.value })}
              />
              <Input
                placeholder={ar ? "نمط العمل (حضوري/هجين/عن بعد)" : "Work mode"}
                value={tg.workMode ?? ""}
                onChange={(e) => {
                  const v = toWorkMode(e.target.value);
                  if (v !== null) update(i, { workMode: v });
                  else {
                    const { workMode: _drop, ...rest } = tg;
                    onChange(targets.map((t, idx) => (idx === i ? rest : t)));
                  }
                }}
              />
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة هدف" : "Add target"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Work history ------------------------------ */

export function WorkHistoryCard({
  items,
  ar,
  onChange,
}: {
  items: Experience[];
  ar: Ar;
  onChange: (next: Experience[]) => void;
}) {
  const update = (i: number, patch: Partial<Experience>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), role: "", company: "", bullets: [] }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "الخبرات العملية" : "Work history"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={ar ? "المسمى الوظيفي" : "Role"}
                value={x.role}
                onChange={(e) => update(i, { role: e.target.value })}
              />
              <Input
                placeholder={ar ? "الشركة" : "Company"}
                value={x.company}
                onChange={(e) => update(i, { company: e.target.value })}
              />
              <Input
                placeholder={ar ? "بداية" : "Start"}
                value={x.start ?? ""}
                onChange={(e) => update(i, { start: e.target.value })}
              />
              <Input
                placeholder={ar ? "نهاية" : "End"}
                value={x.end ?? ""}
                onChange={(e) => update(i, { end: e.target.value })}
              />
            </div>
            <Textarea
              rows={3}
              placeholder={ar ? "الإنجازات — سطر لكل عنصر" : "Bullets — one per line"}
              value={x.bullets.join("\n")}
              onChange={(e) => update(i, { bullets: e.target.value.split("\n") })}
            />
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة خبرة" : "Add role"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Achievements ------------------------------ */

export function AchievementsCard({
  items,
  ar,
  onChange,
}: {
  items: Achievement[];
  ar: Ar;
  onChange: (next: Achievement[]) => void;
}) {
  const update = (i: number, patch: Partial<Achievement>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), text: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "الإنجازات والأدلة" : "Achievements & evidence"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <Textarea
              rows={2}
              placeholder={ar ? "وصف الإنجاز" : "Achievement text"}
              value={x.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="max-w-48"
                placeholder={ar ? "الرقم/المقياس" : "Metric"}
                value={x.metric ?? ""}
                onChange={(e) => update(i, { metric: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!x.verified} onCheckedChange={(v) => update(i, { verified: v === true })} />
                {ar ? "أكّدت هذا الرقم" : "I verified this figure"}
              </label>
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة إنجاز" : "Add achievement"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Education -------------------------------- */

export function EducationCard({
  items,
  ar,
  onChange,
}: {
  items: Education[];
  ar: Ar;
  onChange: (next: Education[]) => void;
}) {
  const update = (i: number, patch: Partial<Education>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), degree: "", school: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "التعليم" : "Education"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={ar ? "الدرجة/التخصص" : "Degree"}
                value={x.degree}
                onChange={(e) => update(i, { degree: e.target.value })}
              />
              <Input
                placeholder={ar ? "المؤسسة" : "School"}
                value={x.school}
                onChange={(e) => update(i, { school: e.target.value })}
              />
              <Input
                placeholder={ar ? "بداية" : "Start"}
                value={x.start ?? ""}
                onChange={(e) => update(i, { start: e.target.value })}
              />
              <Input
                placeholder={ar ? "نهاية" : "End"}
                value={x.end ?? ""}
                onChange={(e) => update(i, { end: e.target.value })}
              />
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة مؤهل" : "Add education"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Certifications ------------------------------ */

export function SimpleListCard({
  title,
  items,
  ar,
  onChange,
  addLabel,
  titlePlaceholder,
  detailPlaceholder,
}: {
  title: string;
  items: Array<{ id: string; title: string; detail?: string }>;
  ar: Ar;
  onChange: (next: Array<{ id: string; title: string; detail?: string }>) => void;
  addLabel: string;
  titlePlaceholder: string;
  detailPlaceholder: string;
}) {
  const update = (i: number, patch: Partial<{ title: string; detail?: string }>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), title: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder={titlePlaceholder} value={x.title} onChange={(e) => update(i, { title: e.target.value })} />
              <Input
                placeholder={detailPlaceholder}
                value={x.detail ?? ""}
                onChange={(e) => update(i, { detail: e.target.value })}
              />
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Skills --------------------------------- */

export function SkillsCard({
  items,
  ar,
  onChange,
}: {
  items: CareerSkill[];
  ar: Ar;
  onChange: (next: CareerSkill[]) => void;
}) {
  const update = (i: number, patch: Partial<CareerSkill>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), name: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "المهارات" : "Skills"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder={ar ? "المهارة" : "Skill"} value={x.name} onChange={(e) => update(i, { name: e.target.value })} />
              <Input
                placeholder={ar ? "دليل (مشروع/نتيجة)" : "Evidence"}
                value={x.evidence ?? ""}
                onChange={(e) => update(i, { evidence: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!x.verified} onCheckedChange={(v) => update(i, { verified: v === true })} />
              {ar ? "مؤكدة" : "Verified"}
            </label>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة مهارة" : "Add skill"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Languages -------------------------------- */

export function LanguagesCard({
  items,
  ar,
  onChange,
}: {
  items: LanguageItem[];
  ar: Ar;
  onChange: (next: LanguageItem[]) => void;
}) {
  const update = (i: number, patch: Partial<LanguageItem>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), name: "", level: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "اللغات" : "Languages"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder={ar ? "اللغة" : "Language"} value={x.name} onChange={(e) => update(i, { name: e.target.value })} />
              <Input placeholder={ar ? "المستوى" : "Level"} value={x.level} onChange={(e) => update(i, { level: e.target.value })} />
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة لغة" : "Add language"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------- Links ---------------------------------- */

export function LinksCard({
  items,
  ar,
  onChange,
}: {
  items: LinkItem[];
  ar: Ar;
  onChange: (next: LinkItem[]) => void;
}) {
  const update = (i: number, patch: Partial<LinkItem>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { id: newId(), label: "", url: "" }]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "الروابط" : "Links"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((x, i) => (
          <RowShell key={x.id} ar={ar} onRemove={() => remove(i)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder={ar ? "التسمية" : "Label"} value={x.label} onChange={(e) => update(i, { label: e.target.value })} />
              <Input placeholder="https://" value={x.url} onChange={(e) => update(i, { url: e.target.value })} />
            </div>
          </RowShell>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {ar ? "إضافة رابط" : "Add link"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Preferences card ----------------------------- */

export function PreferencesCard({
  prefs,
  ar,
  onChange,
}: {
  prefs: CareerTwin["preferences"];
  ar: Ar;
  onChange: (patch: Partial<CareerTwin["preferences"]>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ar ? "التفضيلات" : "Preferences"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label={ar ? "المدن" : "Cities"}>
          <Input value={prefs.cities ?? ""} onChange={(e) => onChange({ cities: e.target.value })} />
        </Field>
        <Field label={ar ? "نمط العمل" : "Work mode"}>
          <Input
            value={prefs.workMode ?? ""}
            onChange={(e) => {
              const v = toWorkMode(e.target.value);
              if (v !== null) onChange({ workMode: v });
              else {
                const { workMode: _drop, ...rest } = prefs;
                onChange(rest);
              }
            }}
          />
        </Field>
        <Field label={ar ? "الصناعات" : "Industries"}>
          <Input value={prefs.industries ?? ""} onChange={(e) => onChange({ industries: e.target.value })} />
        </Field>
        <Field label={ar ? "المستوى الوظيفي" : "Seniority"}>
          <Input value={prefs.seniority ?? ""} onChange={(e) => onChange({ seniority: e.target.value })} />
        </Field>
        <Field label={ar ? "فترة الإشعار" : "Notice period"}>
          <Input value={prefs.noticePeriod ?? ""} onChange={(e) => onChange({ noticePeriod: e.target.value })} />
        </Field>
      </CardContent>
    </Card>
  );
}
