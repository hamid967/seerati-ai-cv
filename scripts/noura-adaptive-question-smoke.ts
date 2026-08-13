import { emptyAssistantAnswers } from "../src/lib/assistant-create";
import {
  adaptiveQuestionForGoal,
  isAdaptiveQuestionComplete,
  NOURA_GOALS,
  USER_TYPE_OPTIONS,
} from "../src/modules/noura";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const contactFields = new Set(["fullName", "email", "phone", "city"]);
const seenQuestions = new Set<string>();

for (const goal of NOURA_GOALS) {
  const question = adaptiveQuestionForGoal(goal.id);
  assert(question, `${goal.id} must map to one adaptive question`);
  assert(question.title.ar.trim().length > 0, `${goal.id} needs an Arabic title`);
  assert(question.title.en.trim().length > 0, `${goal.id} needs an English title`);
  assert(question.prompt.ar.trim().length > 0, `${goal.id} needs an Arabic prompt`);
  assert(question.prompt.en.trim().length > 0, `${goal.id} needs an English prompt`);
  assert(!seenQuestions.has(question.id), `${goal.id} must not reuse a generic question`);
  seenQuestions.add(question.id);
  assert(
    question.requiredFields.every((field) => !contactFields.has(field)),
    `${goal.id} must not require contact details to continue`,
  );
}

const createQuestion = adaptiveQuestionForGoal("create_resume");
const createAnswers = emptyAssistantAnswers();
assert(
  !isAdaptiveQuestionComplete(createQuestion, createAnswers),
  "empty create path must not pass",
);
createAnswers.userType = "graduate";
createAnswers.jobTitle = "Data Analyst";
assert(
  isAdaptiveQuestionComplete(createQuestion, createAnswers),
  "career stage and target role must unlock the create path",
);

const targetQuestion = adaptiveQuestionForGoal("target_job");
const targetAnswers = emptyAssistantAnswers();
targetAnswers.jobTitle = "Product Manager";
assert(
  !isAdaptiveQuestionComplete(targetQuestion, targetAnswers),
  "target job path must request user-provided evidence",
);
targetAnswers.story = "Improve cross-functional onboarding for a public role.";
assert(
  isAdaptiveQuestionComplete(targetQuestion, targetAnswers),
  "target job path must unlock after role and user-provided evidence",
);

assert(USER_TYPE_OPTIONS.length === 5, "career classification must expose five neutral choices");
assert(
  USER_TYPE_OPTIONS.every((option) => option.value && option.ar && option.en),
  "career classification choices must be bilingual and explicit",
);

console.log(
  "Noura adaptive question smoke passed: goal-specific, bilingual, contact-optional flow.",
);
