import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
 * Data layer backed by Lovable Cloud (profiles / resumes / user_roles).
 * All reads and writes go through RLS-protected tables; the 3-resume limit is
 * also enforced server-side by a database trigger.
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

  useEffect(() => {
    setGuestResumes(readGuestResumes());
  }, []);

  const persistGuest = useCallback((list: Resume[]) => {
    setGuestResumes(list);
    writeGuestResumes(list);
  }, []);


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
      setResumes([]);
      setLoadingResumes(false);
      return;
    }
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    setResumes(((data as ResumeRow[] | null) ?? []).map(toResume));
    setLoadingResumes(false);
  }, []);

  /** Move a guest's locally stored resume into the cloud right after sign-in. */
  const migrateGuestResumes = useCallback(async (userId: string) => {
    const pending = readGuestResumes();
    if (!pending.length) return;
    clearGuestResumes();
    setGuestResumes([]);
    for (const item of pending) {
      await supabase.from("resumes").insert({
        user_id: userId,
        title: item.title,
        template_id: item.templateId,
        language: item.language,
        data: item.data as never,
      });
    }
  }, []);

  useEffect(() => {
    let active = true;

    const hydrate = async (session: { user: { id: string; email?: string } } | null) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        setResumes([]);
        setReady(true);
        return;
      }
      await loadProfile(session.user.id, session.user.email ?? "");
      try {
        await migrateGuestResumes(session.user.id);
      } catch {
        // Keep sign-in working even if the local draft cannot be uploaded.
      }
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

  const value = useMemo<Ctx>(() => {
    const atLimit = resumes.length >= maxResumes;
    return {
      ready,
      user,
      resumes,
      loadingResumes,
      atLimit,
      maxResumes,
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
        setResumes([]);
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
        if (!user || atLimit) return null;
        await ensureSession();
        const base = seed
          ? demoResumeData()
          : {
              ...emptyResumeData(),
              personal: {
                ...emptyResumeData().personal,
                fullName: user.fullName,
                email: user.email,
                jobTitle: jobTitle ?? "",
              },
            };
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            title,
            template_id: templateId,
            language,
            data: base as never,
          })
          .select("*")
          .single();
        if (error || !data) return null;
        const resume = toResume(data as ResumeRow);
        setResumes((list) => [resume, ...list]);
        return resume;
      },
      updateResume: async (id, patch) => {
        await ensureSession();
        setResumes((list) =>
          list.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
        );
        const current = resumes.find((r) => r.id === id);
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
        const src = resumes.find((r) => r.id === id);
        if (!src || !user || atLimit) return null;
        await ensureSession();
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            title: `${src.title} — نسخة`,
            template_id: src.templateId,
            language: src.language,
            data: src.data as never,
          })
          .select("*")
          .single();
        if (error || !data) return null;
        const copy = toResume(data as ResumeRow);
        setResumes((list) => [copy, ...list]);
        return copy;
      },
      deleteResume: async (id) => {
        await ensureSession();
        setResumes((list) => list.filter((r) => r.id !== id));
        const { error } = await supabase.from("resumes").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
      getResume: (id) => resumes.find((r) => r.id === id),
    };
  }, [ready, user, resumes, loadingResumes, maxResumes, signIn, signUp]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Redirects to /auth only after confirming there is really no cloud session. */
export function useAuthGuard() {
  const { ready, user } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready || user) return;
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
  }, [ready, user, navigate]);
  return { ready, user };
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
