import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO = {
  "demo.employee@atomquest.app": { role: "employee" as const, full_name: "Aarav Sharma",  department: "Sales" },
  "demo.manager@atomquest.app":  { role: "manager"  as const, full_name: "Preksha Iyer",  department: "Sales" },
  "demo.admin@atomquest.app":    { role: "admin"    as const, full_name: "Riya Mehta",    department: "People & Culture" },
};

/** Self-bootstrap demo personas: if signed-in email matches a demo persona, ensure profile + role + manager link. */
export const bootstrapDemoPersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims.email as string | undefined)?.toLowerCase();
    if (!email) return { ok: false, reason: "no email" };
    const cfg = (DEMO as Record<string, typeof DEMO[keyof typeof DEMO]>)[email];
    if (!cfg) return { ok: true, demo: false };

    // Update profile
    await supabaseAdmin.from("profiles").update({
      full_name: cfg.full_name, department: cfg.department,
    }).eq("id", userId);

    // Ensure role
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: cfg.role },
      { onConflict: "user_id,role" }
    );

    // Manager linkage: employee -> manager (if both exist)
    if (cfg.role === "employee") {
      const { data: mgr } = await supabaseAdmin.from("profiles").select("id").eq("email", "demo.manager@atomquest.app").maybeSingle();
      if (mgr?.id) {
        await supabaseAdmin.from("profiles").update({ manager_id: mgr.id }).eq("id", userId);
      }
    }
    return { ok: true, demo: true, role: cfg.role };
  });
