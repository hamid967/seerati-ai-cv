import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app/app-shell";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getPublicRuntimeConfig } from "@/lib/public-runtime-config.functions";
import { setSupabaseRuntimeConfig } from "@/integrations/supabase/client";

const FloatingSeeratiAssistant = lazy(() =>
  import("@/components/floating-seerati-assistant").then((module) => ({
    default: module.FloatingSeeratiAssistant,
  })),
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getPublicRuntimeConfig(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "سيرتي | Seerati — سيرة ذاتية بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "أنشئ سيرة ذاتية احترافية بالعربية أو الإنجليزية مع قوالب متوافقة مع أنظمة التوظيف ومساعد كتابة بالذكاء الاصطناعي.",
      },
      { name: "author", content: "Seerati" },
      { property: "og:title", content: "سيرتي | Seerati" },
      {
        property: "og:description",
        content: "منصة إنشاء السير الذاتية بالذكاء الاصطناعي للسوق السعودي والخليجي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "theme-color", content: "#0b3b2e" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "سيرتي" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/app-icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Signed-in product surfaces that get the App Shell instead of site chrome. */
const APP_PREFIXES = [
  "/dashboard",
  "/account",
  "/career-twin",
  "/career-evidence",
  "/jobs",
  "/resumes",
  "/admin",
  "/import",
  "/privacy-center",
  "/application-center",
  "/cover-letters",
  "/keyword-scanner",
];
/** Editor-style routes: chrome shrinks into focus mode. */
const FOCUS_PATTERN = /^\/resumes\/[^/]+\/(edit|preview)$/;

function AppFrame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isApp) return <Outlet />;

  return (
    <AppShell bare width="full" focus={FOCUS_PATTERN.test(pathname)}>
      <Outlet />
    </AppShell>
  );
}

function DeferredFloatingAssistant() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const activate = () => setReady(true);
    const timeoutId = window.setTimeout(activate, 5000);
    window.addEventListener("pointerdown", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true });
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
    };
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <FloatingSeeratiAssistant />
    </Suspense>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const runtimeConfig = Route.useLoaderData();

  // The Supabase proxy is lazy; inject browser-safe runtime metadata before
  // StoreProvider effects touch auth/database APIs during hydration.
  setSupabaseRuntimeConfig(runtimeConfig);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StoreProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <AppFrame />
          <DeferredFloatingAssistant />
          <Toaster position="top-center" richColors />
        </StoreProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
