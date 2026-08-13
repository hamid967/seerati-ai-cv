import {
  createInitialJourney,
  journeyPrompt,
  transitionJourney,
  type JourneySnapshot,
} from "../src/modules/noura/journey";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function transition(snapshot: JourneySnapshot, event: Parameters<typeof transitionJourney>[1]) {
  return transitionJourney(snapshot, event);
}

const initial = createInitialJourney();
assert(initial.state === "idle", "journey must start idle");
assert(initial.step === 0, "journey must start at step zero");
assert(initial.hasConsent === false, "guest journey must start without AI consent");

const create = transition(initial, { type: "choose_goal", goal: "create_resume" });
assert(create.state === "asking", "goal selection must enter asking");
assert(create.goal === "create_resume", "selected goal must be retained");
assert(create.questionFamily === "persona_and_role", "create goal must ask persona and role");
assert(
  journeyPrompt(create, "ar").includes("مستواك"),
  "Arabic question copy must be goal-specific",
);
assert(
  journeyPrompt(create, "en").includes("target role"),
  "English question copy must be goal-specific",
);

const target = transition(initial, { type: "choose_goal", goal: "target_job" });
assert(target.questionFamily === "job_description", "target job must ask for job description");

const noConsent = transition(create, { type: "request_ai" });
assert(noConsent.state === "consent_required", "AI request without consent must be blocked");
const consent = transition(noConsent, { type: "consent_granted" });
assert(consent.state === "ai_processing", "explicit consent must enter AI processing");
assert(consent.hasConsent === true, "consent must be tracked in session state");
const review = transition(consent, { type: "suggestion_ready" });
assert(review.state === "awaiting_approval", "suggestion must require approval");
const applied = transition(review, { type: "approve_suggestion" });
assert(applied.state === "completed", "only explicit approval may complete the journey");

const offline = transition(create, { type: "offline" });
assert(offline.state === "offline", "offline must be explicit");
const recovered = transition(offline, { type: "retry" });
assert(recovered.state === "asking", "retry must return to the selected journey");

const expiring = transition(create, { type: "session_expiring" });
assert(expiring.state === "session_expiring", "session expiry must be visible");
const deleted = transition(expiring, { type: "delete_data" });
assert(deleted.state === "data_deleted", "deletion must enter data_deleted");
assert(deleted.goal === undefined, "deletion must clear the selected goal");
assert(deleted.hasConsent === false, "deletion must clear session consent");
const immutable = transition(deleted, { type: "choose_goal", goal: "review_resume" });
assert(immutable.state === "data_deleted", "deleted session must reject new journey events");

console.log(
  "Phase 20 journey smoke passed: deterministic transitions, consent gate, offline recovery, expiry, and deletion.",
);
