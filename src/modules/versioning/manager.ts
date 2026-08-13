import type { CareerProfileGraph } from "@/modules/career";

export type CareerVersion = {
  id: string;
  name: string;
  graph: CareerProfileGraph;
  createdAt: string;
  source: "draft" | "duplicate" | "restore";
};

export type CareerDiff = {
  added: string[];
  removed: string[];
  changed: Array<{ factId: string; before: string; after: string }>;
};

export class CareerVersionManager {
  private readonly versions = new Map<string, CareerVersion>();

  create(
    name: string,
    graph: CareerProfileGraph,
    source: CareerVersion["source"] = "draft",
  ): CareerVersion {
    const version: CareerVersion = {
      id: `version-${this.versions.size + 1}`,
      name: name.trim() || "Untitled version",
      graph: structuredClone(graph),
      createdAt: new Date().toISOString(),
      source,
    };
    this.versions.set(version.id, version);
    return structuredClone(version);
  }

  duplicate(id: string, name: string): CareerVersion | undefined {
    const existing = this.versions.get(id);
    return existing ? this.create(name, existing.graph, "duplicate") : undefined;
  }

  restore(id: string): CareerProfileGraph | undefined {
    const existing = this.versions.get(id);
    return existing ? structuredClone(existing.graph) : undefined;
  }

  delete(id: string): boolean {
    return this.versions.delete(id);
  }

  list(): CareerVersion[] {
    return [...this.versions.values()].map((version) => structuredClone(version));
  }

  diff(left: CareerProfileGraph, right: CareerProfileGraph): CareerDiff {
    const leftMap = new Map(left.facts.map((fact) => [fact.id, fact.value]));
    const rightMap = new Map(right.facts.map((fact) => [fact.id, fact.value]));
    const added = [...rightMap.keys()].filter((id) => !leftMap.has(id)).sort();
    const removed = [...leftMap.keys()].filter((id) => !rightMap.has(id)).sort();
    const changed = [...leftMap.keys()]
      .filter((id) => rightMap.has(id) && leftMap.get(id) !== rightMap.get(id))
      .sort()
      .map((factId) => ({
        factId,
        before: leftMap.get(factId) ?? "",
        after: rightMap.get(factId) ?? "",
      }));
    return { added, removed, changed };
  }
}

export const createCareerVersionManager = () => new CareerVersionManager();
