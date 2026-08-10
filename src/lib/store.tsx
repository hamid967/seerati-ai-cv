import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { emptyResumeData, RESUME_LIMIT, type Profile, type Resume, type ResumeData } from "./types";
import { demoResumeData } from "./demo-data";

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
};

const StoreContext = createContext<Ctx | null>(null);

type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  language: string;
  data: unknown;
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
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

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
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .order("updated_at", { ascending: false });
    setResumes(((data as ResumeRow[] | null) ?? []).map(toResume));
    setLoadingResumes(false);
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

  const signUp = useCallback<Ctx["signUp"]>(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };
    return { needsConfirmation: !data.session };
  }, []);

  const value = useMemo<Ctx>(() => {
    const atLimit = resumes.length >= RESUME_LIMIT;
    return {
      ready,
      user,
      resumes,
      loadingResumes,
      atLimit,
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
        setUser({ ...user, ...patch });
        await supabase
          .from("profiles")
          .update({
            full_name: patch.fullName ?? user.fullName,
            target_role: patch.targetRole ?? user.targetRole ?? null,
            years_experience: patch.yearsExperience ?? user.yearsExperience ?? null,
            industry: patch.industry ?? user.industry ?? null,
            onboarded: patch.onboarded ?? user.onboarded,
          })
          .eq("id", user.id);
      },
      createResume: async ({ title, templateId, language, seed, jobTitle }) => {
        if (!user || atLimit) return null;
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
        setResumes((list) =>
          list.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)),
        );
        const current = resumes.find((r) => r.id === id);
        await supabase
          .from("resumes")
          .update({
            title: patch.title ?? current?.title ?? "",
            template_id: patch.templateId ?? current?.templateId ?? "classic-ats",
            language: patch.language ?? current?.language ?? "ar",
            data: (patch.data ?? current?.data ?? emptyResumeData()) as never,
          })
          .eq("id", id);
      },
      duplicateResume: async (id) => {
        const src = resumes.find((r) => r.id === id);
        if (!src || !user || atLimit) return null;
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
        setResumes((list) => list.filter((r) => r.id !== id));
        await supabase.from("resumes").delete().eq("id", id);
      },
      getResume: (id) => resumes.find((r) => r.id === id),
    };
  }, [ready, user, resumes, loadingResumes, signIn, signUp]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
