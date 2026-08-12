/** First-visit marketing intro — session-scoped so refresh within a tab skips it. */
export const INTRO_SESSION_KEY = "seerati:intro:v2";

export function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "seen";
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
  } catch {
    /* private mode */
  }
}
