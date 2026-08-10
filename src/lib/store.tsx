import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyResumeData, uid, RESUME_LIMIT, type Profile, type Resume } from "./types";
import { demoResume } from "./demo-data";

/**
 * Local data layer for the MVP. Mirrors the planned Supabase tables
 * (profiles / resumes) so it can be swapped for Cloud calls with RLS later —
 * see supabase/schema.sql.
 */

const KEY_USER = "seerati.user";
const KEY_RESUMES = "seerati.resumes";

type Ctx = {
  ready: boolean;
  user: Profile | null;
  resumes: Resume[];
  signIn: (email: string, name?: string) => Profile;
  signUp: (email: string, name: string) => Profile;
  signOut: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  createResume: (input: { title: string; templateId: string; language: "ar" | "en"; seed?: boolean }) => Resume | null;
  updateResume: (id: string, patch: Partial<Resume>) => void;
  duplicateResume: (id: string) => Resume | null;
  deleteResume: (id: string) => void;
  getResume: (id: string) => Resume | undefined;
  atLimit: boolean;
};

const StoreContext = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    setUser(read<Profile | null>(KEY_USER, null));
    setResumes(read<Resume[]>(KEY_RESUMES, []));
    setReady(true);
  }, []);

  const persistUser = useCallback((u: Profile | null) => {
    setUser(u);
    if (u) window.localStorage.setItem(KEY_USER, JSON.stringify(u));
    else window.localStorage.removeItem(KEY_USER);
  }, []);

  const persistResumes = useCallback((list: Resume[]) => {
    setResumes(list);
    window.localStorage.setItem(KEY_RESUMES, JSON.stringify(list));
  }, []);

  const signIn = useCallback(
    (email: string, name?: string) => {
      const isAdmin = email.trim().toLowerCase().startsWith("admin");
      const profile: Profile = {
        id: `u_${email.trim().toLowerCase()}`,
        email: email.trim(),
        fullName: name || email.split("@")[0] || "مستخدم",
        role: isAdmin ? "admin" : "user",
        onboarded: true,
        createdAt: new Date().toISOString(),
      };
      persistUser(profile);
      return profile;
    },
    [persistUser],
  );

  const signUp = useCallback(
    (email: string, name: string) => {
      const profile = signIn(email, name);
      const next: Profile = { ...profile, onboarded: false };
      persistUser(next);
      return next;
    },
    [signIn, persistUser],
  );

  const value = useMemo<Ctx>(() => {
    const mine = user ? resumes.filter((r) => r.ownerId === user.id) : [];
    return {
      ready,
      user,
      resumes: mine,
      atLimit: mine.length >= RESUME_LIMIT,
      signIn,
      signUp,
      signOut: () => persistUser(null),
      updateProfile: (patch) => {
        if (user) persistUser({ ...user, ...patch });
      },
      createResume: ({ title, templateId, language, seed }) => {
        if (!user || mine.length >= RESUME_LIMIT) return null;
        const now = new Date().toISOString();
        const base = seed ? demoResume(user.id) : null;
        const resume: Resume = {
          id: uid(),
          ownerId: user.id,
          title,
          templateId,
          language,
          data: base ? base.data : { ...emptyResumeData(), personal: { ...emptyResumeData().personal, fullName: user.fullName, email: user.email } },
          createdAt: now,
          updatedAt: now,
        };
        persistResumes([resume, ...resumes]);
        return resume;
      },
      updateResume: (id, patch) => {
        persistResumes(
          resumes.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)),
        );
      },
      duplicateResume: (id) => {
        const src = resumes.find((r) => r.id === id);
        if (!src || !user || mine.length >= RESUME_LIMIT) return null;
        const now = new Date().toISOString();
        const copy: Resume = { ...src, id: uid(), title: `${src.title} — نسخة`, createdAt: now, updatedAt: now };
        persistResumes([copy, ...resumes]);
        return copy;
      },
      deleteResume: (id) => persistResumes(resumes.filter((r) => r.id !== id)),
      getResume: (id) => resumes.find((r) => r.id === id),
    };
  }, [ready, user, resumes, signIn, signUp, persistUser, persistResumes]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
