"use server";
// Public: anyone may send a report, so this builds what the report is about from the database (never from the
// browser), writes only through add_report (capped at 50 open), and triggers nothing else (no revalidate, no push).
import type { ActionResult } from "@/lib/auth";
import { reportSchema } from "@/lib/schemas";
import { adminClient } from "@/lib/supabase/admin";
import { formatShort, weekdayOf } from "@/lib/time";
import { KIND } from "@/lib/types";

const FAILED: ActionResult = { ok: false, message: "Couldn't send. Try again." };

export async function sendReport(input: unknown): Promise<ActionResult> {
  const p = reportSchema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const { slot_id, date, item_id, message } = p.data;
  try {
    const db = adminClient();
    let course: string, about: string;
    if (slot_id && date) {
      const { data: s } = await db.from("class_slots").select("course_id, weekday, courses(code)").eq("id", slot_id).maybeSingle();
      if (!s || s.weekday !== weekdayOf(date)) return FAILED;
      course = s.course_id;
      about = `${(s.courses as unknown as { code: string } | null)?.code ?? ""} class, ${formatShort(date)}`;
    } else {
      const { data: i } = await db.from("calendar_items").select("course_id, kind, title, on_date, courses(code)").eq("id", item_id!).maybeSingle();
      if (!i) return FAILED;
      course = i.course_id;
      about = `${(i.courses as unknown as { code: string } | null)?.code ?? ""} ${KIND[i.kind as keyof typeof KIND]}: ${i.title}, ${formatShort(i.on_date)}`.slice(0, 120);
    }
    const { data: added, error } = await db.rpc("add_report", { course, about, message });
    if (error) return FAILED;
    return added ? { ok: true } : { ok: false, message: "The officers have many reports to read. Message an officer directly." };
  } catch {
    return FAILED;
  }
}
