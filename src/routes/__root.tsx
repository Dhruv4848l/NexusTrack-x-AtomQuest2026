import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

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
