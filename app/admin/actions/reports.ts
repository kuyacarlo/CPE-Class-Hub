"use server";
import { withOfficer, type ActionResult } from "@/lib/auth";
import { serverClient } from "@/lib/supabase/server";

export async function toggleReportDone(id: string): Promise<ActionResult> {
  return withOfficer(async () => {
    const db = await serverClient();
    const { data, error } = await db.from("reports").select("done").eq("id", id).single();
    if (error) throw error;
    const { error: e2 } = await db.from("reports").update({ done: !data.done }).eq("id", id);
    if (e2) throw e2;
  });
}

export async function deleteReport(id: string): Promise<ActionResult> {
  return withOfficer(async () => {
    const { error } = await (await serverClient()).from("reports").delete().eq("id", id);
    if (error) throw error;
  });
}
