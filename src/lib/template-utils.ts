import { defaultTemplates } from "@/lib/templates";
import type { TemplateDef } from "@/lib/types";

export function getTemplate(id: string, list?: TemplateDef[]): TemplateDef {
  const pool = list?.length ? list : defaultTemplates;
  return pool.find((template) => template.id === id) ?? defaultTemplates[0]!;
}
