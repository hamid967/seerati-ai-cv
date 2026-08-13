import type { CareerTwin } from "@/lib/career";
import { emptyResumeData, type ResumeData } from "@/lib/types";
import { fromResumeData } from "./adapters";
import type { CareerProfileGraph } from "./schemas";

export function resumeDataFromCareerTwin(twin: CareerTwin): ResumeData {
  const data = emptyResumeData();
  data.personal = {
    fullName: twin.identity.fullName,
    jobTitle: twin.identity.headline,
    email: twin.identity.email,
    phone: twin.identity.phone,
    city: twin.identity.city,
    country: "",
  };
  data.summary = twin.identity.summary;
  if (twin.targets[0]?.title) data.targetJob = twin.targets[0].title;
  data.experience = twin.workHistory;
  data.education = twin.education;
  data.skills = twin.skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    ...(skill.level !== undefined ? { level: skill.level } : {}),
  }));
  data.languages = twin.languages;
  data.certificates = twin.certifications.map((item) => ({
    id: item.id,
    title: item.title,
    ...(item.detail ? { detail: item.detail } : {}),
  }));
  data.projects = twin.projects.map((item) => ({
    id: item.id,
    title: item.title,
    ...(item.detail ? { detail: item.detail } : {}),
  }));
  data.achievements = twin.achievements.map((item) => ({
    id: item.id,
    title: item.text,
    ...(item.metric ? { detail: item.metric } : {}),
  }));
  data.links = twin.links;
  data.custom = twin.storyBank.map((story) => ({
    id: `story-${story.id}`,
    title: story.title,
    items: [
      {
        id: story.id,
        title: story.title,
        detail: `${story.situation} ${story.task} ${story.action} ${story.result}`.trim(),
      },
    ],
  }));
  data.sectionOrder = [
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
    "certificates",
    "projects",
    "achievements",
    "links",
    "custom",
  ];
  return data;
}

export function graphFromCareerTwin(twin: CareerTwin, language: "ar" | "en"): CareerProfileGraph {
  const data = resumeDataFromCareerTwin(twin);
  return fromResumeData(data, { graphId: `career-twin-${twin.id}`, language }).graph;
}
