import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { emptyResumeData, RESUME_LIMIT, type Profile, type Resume, type ResumeData } from "./types";
import { demoResumeData } from "./demo-data";
import {
  clearGuestResumes,
  GUEST_RESUME_LIMIT,
  isGuestResumeId,
  makeGuestResume,
  readGuestResumes,
  writeGuestResumes,
} from "./guest-store";

/**
 * Authenticated account data uses Lovable Cloud. Anonymous resume content is
 * deliberately kept in memory only and is never migrated or autosaved remotely.
 */

type Ctx = {
  ready: boolean;
  user: Profile | null;
  resumes: Resume[];
  loadingResumes: boolean;
  signIn: (email: string, password: string) => Promise<Profile | { error: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsConfirmation: boolean } | { error: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  createResume: (input: {
    title: string;
    templateId: string;
    language: "ar" | "en";
    seed?: boolean;
    jobTitle?: string;
  }) => Promise<Resume | null>;
  updateResume: (id: string, patch: Partial<Resume>) => Promise<void>;
  duplicateResume: (id: string) => Promise<Resume | null>;
  deleteResume: (id: string) => Promise<void>;
  getResume: (id: string) => Resume | undefined;
  atLimit: boolean;
  maxResumes: number;
  /** True when the visitor has no account and is working on a local resume. */
  isGuest: boolean;
  /** Delete all anonymous resume data from the current in-memory session. */
  clearGuestSession: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  language: string;
  data: unknown;
  status?: string | null;
  completion_score?: number | null;
  ats_score?: number | null;
  last_viewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

const toResume = (row: ResumeRow): Resume => ({
  id: row.id,
  ownerId: row.user_id,
  title: row.title,
  templateId: row.template_id ?? "classic-ats",
  language: row.language === "en" ? "en" : "ar",
  data: { ...emptyResumeData(), ...((row.data as ResumeData) ?? {}) },
  status: (row.status === "complete" ? "complete" : "draft") as Resume["status"],
  completionScore: row.completion_score ?? 0,
  atsScore: row.ats_score ?? 0,
  lastViewedAt: row.last_viewed_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Immediately after sign-up Supabase can expose a React-side user before the
 * browser client has a usable JWT attached to PostgREST calls. Mirror the
 * refresh used by auth-attacher.ts so store mutations do not 401.
 */
async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session;
  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session?.access_token) {
    throw new Error(error?.message ?? "Not authenticated");
  }
  return refreshed.session;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [guestResumes, setGuestResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [maxResumes, setMaxResumes] = useState(RESUME_LIMIT);

  /**
   * Refs mirror the lists synchronously so back-to-back mutations
   * (create → update in the same tick) never read a stale closure snapshot.
   */
  const guestRef = useRef<Resume[]>([]);
  const resumesRef = useRef<Resume[]>([]);

  const persistGuest = useCallback((update: Resume[] | ((prev: Resume[]) => Resume[])) => {
    const next = typeof update === "function" ? update(guestRef.current) : update;
    guestRef.current = next;
    setGuestResumes(next);
    writeGuestResumes(next);
  }, []);

  const setResumesState = useCallback((update: Resume[] | ((prev: Resume[]) => Resume[])) => {
    const next = typeof update === "function" ? update(resumesRef.current) : update;
    resumesRef.current = next;
    setResumes(next);
  }, []);

  useEffect(() => {
    const stored = readGuestResumes();
    guestRef.current = stored;
    setGuestResumes(stored);
  }, []);

  useEffect(() => {
    if (user || guestResumes.length === 0 || typeof window === "undefined") return;
    let timeout = window.setTimeout(
      () => {
        clearGuestResumes();
        guestRef.current = [];
        setGuestResumes([]);
      },
      20 * 60 * 1000,
    );
    const reset = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(
        () => {
          clearGuestResumes();
          guestRef.current = [];
          setGuestResumes([]);
        },
        20 * 60 * 1000,
      );
    };
    window.addEventListener("pointerdown", reset, { passive: true });
    window.addEventListener("keydown", reset, { passive: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [user, guestResumes.length]);

  useEffect(() => {
    void supabase
      .from("app_settings")
      .select("max_resumes")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.max_resumes) setMaxResumes(data.max_resumes);
      });
  }, []);

  const loadProfile = useCallback(async (userId: string, email: string) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    setUser({
      id: userId,
      email: profile?.email ?? email,
      fullName: profile?.full_name ?? "",
      role: isAdmin ? "admin" : "user",
      onboarded: profile?.onboarded ?? false,
      targetRole: profile?.target_role ?? "",
      yearsExperience: profile?.years_experience ?? "",
      industry: profile?.industry ?? "",
      createdAt: profile?.created_at ?? new Date().toISOString(),
    });
  }, []);

  const loadResumes = useCallback(async () => {
    setLoadingResumes(true);
    // Admins can read every resume via RLS, so scope the dashboard to the signed-in owner.
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setResumesState([]);
      setLoadingResumes(false);
      return;
    }
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    setResumesState(((data as ResumeRow[] | null) ?? []).map(toResume));
    setLoadingResumes(false);
  }, []);

  useEffect(() => {
    let active = true;

    const hydrate = async (session: { user: { id: string; email?: string } } | null) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        setResumesState([]);
        setReady(true);
        return;
      }
      await loadProfile(session.user.id, session.user.email ?? "");
      await loadResumes();
      if (active) setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void hydrate(session);
      }
    });

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, loadResumes]);

  const signIn = useCallback<Ctx["signIn"]>(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) return { error: error?.message ?? "sign_in_failed" };
      await loadProfile(data.user.id, data.user.email ?? email);
      await loadResumes();
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      return {
        id: data.user.id,
        email: data.user.email ?? email,
        fullName: profile?.full_name ?? "",
        role: (roles ?? []).some((r) => r.role === "admin") ? "admin" : "user",
        onboarded: profile?.onboarded ?? false,
        createdAt: profile?.created_at ?? new Date().toISOString(),
      };
    },
    [loadProfile, loadResumes],
  );

  const signUp = useCallback<Ctx["signUp"]>(
    async (email, password, fullName) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      if (error) return { error: error.message };
      if (data.session?.user) {
        // Close the post-signup JWT race before the first RLS-backed reads.
        try {
          await ensureSession();
        } catch {
          // Session was returned by signUp; continue even if refresh is a no-op.
        }
        await loadProfile(data.session.user.id, data.session.user.email ?? email);
        await loadResumes();
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    },
    [loadProfile, loadResumes],
  );

  const clearGuestSession = useCallback(() => {
    clearGuestResumes();
    guestRef.current = [];
    setGuestResumes([]);
  }, []);

  const value = useMemo<Ctx>(() => {
    const isGuest = !user;
    const list = isGuest ? guestResumes : resumes;
    const effectiveMax = isGuest ? GUEST_RESUME_LIMIT : maxResumes;
    const atLimit = list.length >= effectiveMax;
    return {
      ready,
      user,
      resumes: list,
      loadingResumes,
      atLimit,
      maxResumes: effectiveMax,
      isGuest,
      clearGuestSession,

      signIn,
      signUp,
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return error ? { error: error.message } : {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
        setResumesState([]);
      },
      updateProfile: async (patch) => {
        if (!user) return;
        await ensureSession();
        setUser({ ...user, ...patch });
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: patch.fullName ?? user.fullName,
            target_role: patch.targetRole ?? user.targetRole ?? null,
            years_experience: patch.yearsExperience ?? user.yearsExperience ?? null,
            industry: patch.industry ?? user.industry ?? null,
            onboarded: patch.onboarded ?? user.onboarded,
          })
          .eq("id", user.id);
        if (error) throw new Error(error.message);
      },
      createResume: async ({ title, templateId, language, seed, jobTitle }) => {
        if (atLimit) return null;
        const base = seed
          ? demoResumeData()
          : {
              ...emptyResumeData(),
              personal: {
                ...emptyResumeData().personal,
                fullName: user?.fullName ?? "",
                email: user?.email ?? "",
                jobTitle: jobTitle ?? "",
              },
            };
        if (isGuest) {
          const resume = makeGuestResume({ title, templateId, language, data: base });
          persistGuest((prev) => [resume, ...prev]);
          return resume;
        }
        await ensureSession();
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user!.id,
            title,
            template_id: templateId,
            language,
            data: base as never,
          })
          .select("*")
          .single();
        if (error || !data) return null;
        const resume = toResume(data as ResumeRow);
        setResumesState((rows) => [resume, ...rows]);
        return resume;
      },
      updateResume: async (id, patch) => {
        if (isGuest || isGuestResumeId(id)) {
          persistGuest((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
            ),
          );
          return;
        }
        await ensureSession();
        setResumesState((rows) =>
          rows.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
        );
        const current = resumesRef.current.find((r) => r.id === id);
        const { error } = await supabase
          .from("resumes")
          .update({
            title: patch.title ?? current?.title ?? "",
            template_id: patch.templateId ?? current?.templateId ?? "classic-ats",
            language: patch.language ?? current?.language ?? "ar",
            data: (patch.data ?? current?.data ?? emptyResumeData()) as never,
            status: patch.status ?? current?.status ?? "draft",
            completion_score: patch.completionScore ?? current?.completionScore ?? 0,
            ats_score: patch.atsScore ?? current?.atsScore ?? 0,
          })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },

      duplicateResume: async (id) => {
        const src = list.find((r) => r.id === id);
        if (!src || atLimit) return null;
        if (isGuest) {
          const copy = makeGuestResume({
            title: `${src.title} — نسخة`,
            templateId: src.templateId,
            language: src.language,
            data: src.data,
          });
          persistGuest((prev) => [copy, ...prev]);
          return copy;
        }
        await ensureSession();
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user!.id,
            title: `${src.title} — نسخة`,
            template_id: src.templateId,
            language: src.language,
            data: src.data as never,
          })
          .select("*")
          .single();
        if (error || !data) return null;
        const copy = toResume(data as ResumeRow);
        setResumesState((rows) => [copy, ...rows]);
        return copy;
      },
      deleteResume: async (id) => {
        if (isGuest || isGuestResumeId(id)) {
          persistGuest((prev) => prev.filter((r) => r.id !== id));
          return;
        }
        await ensureSession();
        setResumesState((rows) => rows.filter((r) => r.id !== id));
        const { error } = await supabase.from("resumes").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
      getResume: (id) => list.find((r) => r.id === id),
    };
  }, [
    ready,
    user,
    resumes,
    guestResumes,
    persistGuest,
    loadingResumes,
    maxResumes,
    signIn,
    signUp,
    clearGuestSession,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * Redirects to /auth only after confirming there is really no cloud session.
 * Pass `{ allowGuest: true }` on surfaces that work without an account.
 */
export function useAuthGuard(options?: { allowGuest?: boolean }) {
  const { ready, user } = useStore();
  const navigate = useNavigate();
  const allowGuest = options?.allowGuest ?? false;
  useEffect(() => {
    if (allowGuest || !ready || user) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && !data.session) navigate({ to: "/auth" });
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [allowGuest, ready, user, navigate]);
  return { ready, user };
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
