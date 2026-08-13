import { auth, defineMcp } from "@lovable.dev/mcp-js";
import createResumeTool from "./tools/create-resume";
import getResumeTool from "./tools/get-resume";
import listResumesTool from "./tools/list-resumes";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "seerati-ai",
  title: "Seerati AI",
  version: "0.1.0",
  instructions:
    "Tools for Seerati AI, a bilingual (Arabic/English) AI resume builder. Use `list_resumes` to see the signed-in user's resumes, `get_resume` to read one in full, and `create_resume` to start a new draft (accounts are limited to 3 resumes).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listResumesTool, getResumeTool, createResumeTool] as unknown as Parameters<
    typeof defineMcp
  >[0]["tools"],
});
