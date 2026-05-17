import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="neu-card max-w-md text-center p-10">
        <div className="font-display text-7xl font-bold" style={{ background: "var(--gradient-cool)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</div>
        <h2 className="mt-2 font-display text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route doesn't exist in the portal.</p>
        <Link to="/" className="pill mt-6 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-cool)" }}>
          Take me home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="neu-card max-w-md text-center p-10">
        <h1 className="font-display text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="pill px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-cool)" }}
          >
            Try again
          </button>
          <a href="/" className="pill px-5 py-2.5 text-sm font-semibold bg-secondary text-secondary-foreground">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AtomQuest GoalPortal — Set, Track, Achieve" },
      { name: "description", content: "In-house Goal Setting & Tracking portal. Align goals, run quarterly check-ins, and track performance." },
      { property: "og:title", content: "AtomQuest GoalPortal — Set, Track, Achieve" },
      { property: "og:description", content: "In-house Goal Setting & Tracking portal. Align goals, run quarterly check-ins, and track performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AtomQuest GoalPortal — Set, Track, Achieve" },
      { name: "twitter:description", content: "In-house Goal Setting & Tracking portal. Align goals, run quarterly check-ins, and track performance." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf236d89-c41c-44ed-9e95-41b0b5dfdf46/id-preview-0ed6c756--bc9695a4-99d7-4e19-89cc-8ce38441da02.lovable.app-1778893575352.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf236d89-c41c-44ed-9e95-41b0b5dfdf46/id-preview-0ed6c756--bc9695a4-99d7-4e19-89cc-8ce38441da02.lovable.app-1778893575352.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
