import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { emptyResumeData } from "@/lib/types";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_resume",
  title: "Create resume",
  description:
    "Create a new resume draft for the signed-in user (max 3 per account). Optionally set the headline details and summary.",
  inputSchema: {
    title: z.string().trim().min(1).max(120).describe("Resume title, e.g. 'Data Analyst CV'."),
    language: z.enum(["ar", "en"]).default("ar").describe("Resume language."),
    templateId: z.string().trim().min(1).optional().describe("Template id, e.g. 'cloud-flow'."),
    fullName: z.string().trim().max(120).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    summary: z.string().trim().max(2000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, language, templateId, fullName, jobTitle, summary }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const data = emptyResumeData();
    if (fullName) data.personal.fullName = fullName;
    if (jobTitle) data.personal.jobTitle = jobTitle;
    if (summary) data.summary = summary;

    const { data: row, error } = await supabase
      .from("resumes")
      .insert({
        user_id: ctx.getUserId(),
        title,
        language,
        template_id: templateId ?? "saudi-classic",
        status: "draft",
        data,
      })
      .select("id,title,language,template_id,status")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(row) }],
      structuredContent: { resume: row },
    };
  },
});
