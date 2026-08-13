import { z } from "zod";

export const ApplicationStageSchema = z.enum(["saved", "applied", "interview", "offer", "closed"]);
export type ApplicationStage = z.infer<typeof ApplicationStageSchema>;

export const JobTargetSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  language: z.enum(["ar", "en"]),
  createdAt: z.string().datetime(),
});
export type JobTarget = z.infer<typeof JobTargetSchema>;
export const ApplicationSchema = z.object({
  id: z.string(),
  jobTargetId: z.string(),
  stage: ApplicationStageSchema,
  resumeVersionId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Application = z.infer<typeof ApplicationSchema>;
export const TaskSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  dueAt: z.string().datetime().optional(),
});
export type ApplicationTask = z.infer<typeof TaskSchema>;
export const NoteSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  text: z.string(),
  createdAt: z.string().datetime(),
});
export type ApplicationNote = z.infer<typeof NoteSchema>;

export class CareerApplicationWorkspace {
  private readonly jobs = new Map<string, JobTarget>();
  private readonly applications = new Map<string, Application>();
  private readonly tasks = new Map<string, ApplicationTask>();
  private readonly notes = new Map<string, ApplicationNote>();

  addJob(input: Omit<JobTarget, "createdAt">): JobTarget {
    const job = JobTargetSchema.parse({ ...input, createdAt: new Date().toISOString() });
    this.jobs.set(job.id, job);
    return structuredClone(job);
  }

  createApplication(input: Omit<Application, "createdAt" | "updatedAt">): Application {
    if (!this.jobs.has(input.jobTargetId)) throw new Error("job_target_required");
    const timestamp = new Date().toISOString();
    const application = ApplicationSchema.parse({
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    this.applications.set(application.id, application);
    return structuredClone(application);
  }

  moveApplication(id: string, stage: ApplicationStage): Application | undefined {
    const existing = this.applications.get(id);
    if (!existing) return undefined;
    const updated = ApplicationSchema.parse({
      ...existing,
      stage,
      updatedAt: new Date().toISOString(),
    });
    this.applications.set(id, updated);
    return structuredClone(updated);
  }

  addTask(task: ApplicationTask): ApplicationTask {
    if (!this.applications.has(task.applicationId)) throw new Error("application_required");
    const parsed = TaskSchema.parse(task);
    this.tasks.set(parsed.id, parsed);
    return structuredClone(parsed);
  }

  addNote(note: ApplicationNote): ApplicationNote {
    if (!this.applications.has(note.applicationId)) throw new Error("application_required");
    const parsed = NoteSchema.parse(note);
    this.notes.set(parsed.id, parsed);
    return structuredClone(parsed);
  }

  deleteApplication(id: string): boolean {
    const deleted = this.applications.delete(id);
    for (const [taskId, task] of this.tasks)
      if (task.applicationId === id) this.tasks.delete(taskId);
    for (const [noteId, note] of this.notes)
      if (note.applicationId === id) this.notes.delete(noteId);
    return deleted;
  }

  exportJson(): string {
    return JSON.stringify(
      {
        jobs: [...this.jobs.values()],
        applications: [...this.applications.values()],
        tasks: [...this.tasks.values()],
        notes: [...this.notes.values()],
      },
      null,
      2,
    );
  }
}

export const createCareerApplicationWorkspace = () => new CareerApplicationWorkspace();
