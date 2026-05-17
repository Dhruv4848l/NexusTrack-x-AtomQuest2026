import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Admin only");
}

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "employee"|"manager"|"admin"; managerId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    // Add role if missing
    await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
    if (data.managerId !== undefined) {
      await supabaseAdmin.from("profiles").update({ manager_id: data.managerId }).eq("id", data.userId);
    }
    return { ok: true };
  });

export const removeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "employee"|"manager"|"admin" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; full_name?: string; department?: string; manager_id?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { userId, ...rest } = data;
    await supabaseAdmin.from("profiles").update(rest).eq("id", userId);
    return { ok: true };
  });
