import {
  clearConsentedSessionRecovery,
  hasSessionRecoveryConsent,
  readConsentedSessionRecovery,
  saveConsentedSessionRecovery,
  setSessionRecoveryConsent,
} from "../src/lib/guest-store";
import { emptyResumeData, type Resume } from "../src/lib/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemorySessionStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
const sessionStorage = new MemorySessionStorage();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { sessionStorage },
});

try {
  const resume: Resume = {
    id: "guest-recovery-test",
    ownerId: "guest",
    title: "Synthetic recovery resume",
    templateId: "classic-ats",
    language: "en",
    data: emptyResumeData(),
    status: "draft",
    completionScore: 0,
    atsScore: 0,
    lastViewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clearConsentedSessionRecovery();
  assert(!hasSessionRecoveryConsent(), "recovery must be disabled by default");
  saveConsentedSessionRecovery([resume]);
  assert(
    sessionStorage.getItem("seerati.session-recovery") === null,
    "recovery payload must not exist without explicit consent",
  );

  setSessionRecoveryConsent(true);
  assert(hasSessionRecoveryConsent(), "explicit consent must enable this-tab recovery");
  saveConsentedSessionRecovery([resume]);
  const raw = sessionStorage.getItem("seerati.session-recovery");
  assert(raw, "consented recovery must write a payload");
  const payload = JSON.parse(raw) as { expiresAt?: string; resumes?: Resume[] };
  assert(
    Date.parse(payload.expiresAt ?? "") > Date.now(),
    "recovery payload must have a future expiry",
  );
  assert(payload.resumes?.[0]?.id === resume.id, "recovery payload must contain the local resume");
  assert(
    readConsentedSessionRecovery()[0]?.id === resume.id,
    "consented recovery must restore the local resume",
  );

  setSessionRecoveryConsent(false);
  assert(!hasSessionRecoveryConsent(), "revocation must clear recovery consent");
  assert(
    sessionStorage.getItem("seerati.session-recovery") === null,
    "revocation must clear the retained recovery payload",
  );

  setSessionRecoveryConsent(true);
  sessionStorage.setItem(
    "seerati.session-recovery",
    JSON.stringify({ expiresAt: new Date(Date.now() - 1).toISOString(), resumes: [resume] }),
  );
  assert(readConsentedSessionRecovery().length === 0, "expired recovery payload must not restore");
  assert(!hasSessionRecoveryConsent(), "expired recovery payload must revoke stale consent");

  console.log("Guest recovery smoke passed: explicit consent, expiry, restore, and revocation.");
} finally {
  if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
  else Reflect.deleteProperty(globalThis, "window");
}
