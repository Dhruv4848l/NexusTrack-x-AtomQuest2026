import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authApi, type AQUser } from "@/lib/api";

export type AppRole = "employee" | "manager" | "admin" | "database_admin";

interface AuthCtx {
  user: AQUser | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (r: AppRole) => void;
  loading: boolean;
  signOut: () => void;
  refresh: () => Promise<void>;
  /** Set after login/register — stores token & user */
  setAuth: (token: string, user: AQUser) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AQUser | null>(null);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const roles: AppRole[] = (user?.roles ?? []) as AppRole[];

  const pickRole = (rls: AppRole[], stored: string | null): AppRole | null => {
    if (stored && rls.includes(stored as AppRole)) return stored as AppRole;
    return rls[0] ?? null;
  };

  const setAuth = useCallback((token: string, usr: AQUser) => {
    localStorage.setItem("aq_token", token);
    setUser(usr);
    const stored = typeof window !== "undefined" ? localStorage.getItem("activeRole") : null;
    const rls = (usr.roles ?? []) as AppRole[];
    setActiveRoleState(pickRole(rls, stored));
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("aq_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      const stored = localStorage.getItem("activeRole");
      setActiveRoleState(pickRole((data.user.roles ?? []) as AppRole[], stored));
    } catch {
      localStorage.removeItem("aq_token");
      setUser(null);
      setActiveRoleState(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setActiveRole = (r: AppRole) => {
    setActiveRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem("activeRole", r);
  };

  const signOut = () => {
    localStorage.removeItem("aq_token");
    localStorage.removeItem("activeRole");
    setUser(null);
    setActiveRoleState(null);
  };

  return (
    <Ctx.Provider value={{ user, roles, activeRole, setActiveRole, loading, signOut, refresh, setAuth }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
