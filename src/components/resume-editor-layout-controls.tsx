import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResumeUserDesign, SectionKey, TemplateDef } from "@/lib/types";

type LayoutControlsProps = {
  ar: boolean;
  design: ResumeUserDesign | undefined;
  template: TemplateDef;
  onChange: (patch: Partial<ResumeUserDesign>) => void;
};

export function ResumeEditorLayoutControls({
  ar,
  design,
  template,
  onChange,
}: LayoutControlsProps) {
  const layout = design?.layout ?? template.design.layout;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-4">
      <div>
        <p className="text-sm font-semibold">
          {ar ? "تخطيط احترافي" : "Professional layout controls"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ar
            ? "عدّل التخطيط والحجم والمسافات مع معاينة حية. لا تتغير بيانات السيرة عند تغيير التصميم."
            : "Adjust layout, page size and spacing with a live preview. Your resume content is not changed."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{ar ? "تخطيط الصفحة" : "Page layout"}</Label>
          <Select
            value={layout}
            onValueChange={(value) =>
              onChange({ layout: value as "single" | "sidebar" | "sidebar-left" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">
                {ar ? "عمود واحد — مناسب لـ ATS" : "Single column — ATS oriented"}
              </SelectItem>
              <SelectItem value="sidebar">
                {ar ? "عمودان — جانبي يمين" : "Two columns — right sidebar"}
              </SelectItem>
              <SelectItem value="sidebar-left">
                {ar ? "عمودان — جانبي يسار" : "Two columns — left sidebar"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{ar ? "حجم الصفحة" : "Page size"}</Label>
          <Select
            value={design?.pageSize ?? "a4"}
            onValueChange={(value) => onChange({ pageSize: value as "a4" | "letter" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="letter">US Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RangeControl
          label={ar ? "حجم الخط" : "Font scale"}
          value={design?.fontScale ?? 1}
          min={0.85}
          max={1.15}
          step={0.01}
          display={`${Math.round((design?.fontScale ?? 1) * 100)}%`}
          onChange={(value) => onChange({ fontScale: value })}
        />
        <RangeControl
          label={ar ? "الهامش" : "Page margin"}
          value={design?.marginMm ?? 14}
          min={8}
          max={24}
          step={1}
          display={`${design?.marginMm ?? 14} mm`}
          onChange={(value) => onChange({ marginMm: value })}
        />
        <RangeControl
          label={ar ? "تباعد الأسطر" : "Line height"}
          value={design?.lineHeight ?? 1.5}
          min={1.2}
          max={1.8}
          step={0.05}
          display={(design?.lineHeight ?? 1.5).toFixed(2)}
          onChange={(value) => onChange({ lineHeight: value })}
        />
        <RangeControl
          label={ar ? "عرض العمود الجانبي" : "Sidebar width"}
          value={design?.columnWidth ?? 32}
          min={25}
          max={42}
          step={1}
          display={`${design?.columnWidth ?? 32}%`}
          disabled={layout === "single"}
          onChange={(value) => onChange({ columnWidth: value })}
        />
      </div>

      {layout !== "single" && template.atsFriendly ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground">
          {ar
            ? "للتقديم عبر نظام ATS صارم، العمود الواحد هو الخيار الأكثر تحفظًا. تصميم العمودين مناسب للقراءة البشرية، لكن طريقة تحليله تختلف بين أنظمة الفرز."
            : "For strict ATS submissions, a single column is the conservative choice. Two-column layouts can help human scanning, but parsing varies between screening systems."}
        </p>
      ) : null}
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={`space-y-1.5 text-sm ${disabled ? "opacity-50" : ""}`}>
      <span className="flex justify-between gap-3">
        <span>{label}</span>
        <span className="text-muted-foreground">{display}</span>
      </span>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type VisibilityControlsProps = {
  ar: boolean;
  sections: Array<{ key: SectionKey; label: string }>;
  hiddenSections: SectionKey[];
  onChange: (hiddenSections: SectionKey[]) => void;
};

export function ResumeSectionVisibilityControls({
  ar,
  sections,
  hiddenSections,
  onChange,
}: VisibilityControlsProps) {
  const hidden = new Set(hiddenSections);

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">
          {ar ? "إظهار وإخفاء الأقسام" : "Section visibility"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ar
            ? "إخفاء القسم لا يحذف محتواه. يمكنك إظهاره مرة أخرى في أي وقت."
            : "Hiding a section does not delete its content. You can show it again at any time."}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map(({ key, label }) => {
          const visible = !hidden.has(key);
          return (
            <label
              key={key}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm"
            >
              <Checkbox
                checked={visible}
                onCheckedChange={(checked) => {
                  const next = new Set(hiddenSections);
                  if (checked) next.delete(key);
                  else next.add(key);
                  onChange([...next]);
                }}
              />
              <span className="font-medium">{label}</span>
              <span className="ms-auto text-[11px] text-muted-foreground">
                {visible ? (ar ? "ظاهر" : "Visible") : ar ? "مخفي" : "Hidden"}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
