from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise RuntimeError(f"marker missing in {path}: {old[:80]!r}")
    p.write_text(s.replace(old, new, 1))


replace_once(
    "src/lib/types.ts",
    '  density?: "compact" | "normal" | "airy";\n  showPhoto?: boolean;',
    '  density?: "compact" | "normal" | "airy";\n'
    '  /** Optional user layout override; content remains unchanged. */\n'
    '  layout?: TemplateDesign["layout"];\n'
    '  showPhoto?: boolean;',
)

replace_once(
    "src/components/resume-preview.tsx",
    '    accent: user.accent || tpl.design.accent,\n'
    '    spacing: user.density || tpl.design.spacing,\n'
    '  };',
    '    accent: user.accent || tpl.design.accent,\n'
    '    spacing: user.density || tpl.design.spacing,\n'
    '    layout: user.layout || tpl.design.layout,\n'
    '  };',
)

replace_once(
    "src/components/professional-resume-preview.tsx",
    '  const template = getTemplate(resume.templateId);\n'
    '  const hidden = new Set(resume.data.hiddenSections ?? []);',
    '  const template = getTemplate(resume.templateId);\n'
    '  const layout = resume.data.design?.layout ?? template.design.layout;\n'
    '  const hidden = new Set(resume.data.hiddenSections ?? []);',
)
replace_once(
    "src/components/professional-resume-preview.tsx",
    '  if (template.design.layout === "single") return visible;',
    '  if (layout === "single") return visible;',
)
replace_once(
    "src/components/professional-resume-preview.tsx",
    '  return template.design.layout === "sidebar-left" ? [...aside, ...main] : [...main, ...aside];',
    '  return layout === "sidebar-left" ? [...aside, ...main] : [...main, ...aside];',
)

editor = Path("src/routes/resumes.$id.edit.tsx")
s = editor.read_text()
old_import = 'import { ResumePreview, getTemplate } from "@/components/resume-preview";'
new_import = '''import { getTemplate } from "@/components/resume-preview";
import { ProfessionalResumePreview } from "@/components/professional-resume-preview";
import {
  ResumeEditorLayoutControls,
  ResumeSectionVisibilityControls,
} from "@/components/resume-editor-layout-controls";'''
if old_import not in s:
    raise RuntimeError("editor import marker missing")
s = s.replace(old_import, new_import, 1)

photo_marker = '                {tpl?.design.supportsPhoto ? ('
layout_controls = '''                {tpl ? (
                  <ResumeEditorLayoutControls
                    ar={ar}
                    design={d.design}
                    template={tpl}
                    onChange={(designPatch) =>
                      setData((data) => {
                        data.design = { ...data.design, ...designPatch };
                      })
                    }
                  />
                ) : null}

'''
if photo_marker not in s:
    raise RuntimeError("editor design marker missing")
s = s.replace(photo_marker, layout_controls + photo_marker, 1)

order_marker = '''                <SortableList
                  ids={d.sectionOrder}'''
visibility_controls = '''                <ResumeSectionVisibilityControls
                  ar={ar}
                  sections={d.sectionOrder.map((key) => ({
                    key,
                    label: sectionLabels[key][lang],
                  }))}
                  hiddenSections={d.hiddenSections ?? []}
                  onChange={(hiddenSections) =>
                    setData((data) => {
                      data.hiddenSections = hiddenSections;
                    })
                  }
                />

'''
if order_marker not in s:
    raise RuntimeError("editor order marker missing")
s = s.replace(order_marker, visibility_controls + order_marker, 1)

if '<ResumePreview resume={draft} />' not in s:
    raise RuntimeError("desktop preview marker missing")
s = s.replace('<ResumePreview resume={draft} />', '<ProfessionalResumePreview resume={draft} />')
editor.write_text(s)
