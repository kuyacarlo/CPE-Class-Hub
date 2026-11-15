"use server";
import { withOfficer, type ActionResult } from "@/lib/auth";
import { slotSchema } from "@/lib/schemas";
import { serverClient } from "@/lib/supabase/server";
import { weekdayOf } from "@/lib/time";

export async function saveSlot(fd: FormData): Promise<ActionResult> {
  const p = slotSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const id = String(fd.get("id") ?? "");
  return withOfficer(async () => {
    const db = await serverClient();
    const { error } = id ? await db.from("class_slots").update(p.data).eq("id", id) : await db.from("class_slots").insert(p.data);
    if (error) throw error;
  });
}

export async function deleteSlot(id: string): Promise<ActionResult> {
  return withOfficer(async () => {
    const { error } = await (await serverClient()).from("class_slots").delete().eq("id", id);
    if (error) throw error;
  });
}

/** Cancels one class on one day: a no_class item tied to the slot (the course comes from the database). */
export async function cancelSlotOn(slotId: string, date: string): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Pick a valid date" };
  return withOfficer(async () => {
    const db = await serverClient();
    const { data: slot, error } = await db.from("class_slots").select("course_id, weekday, lab_group").eq("id", slotId).single();
    if (error) throw error;
    if (slot.weekday !== weekdayOf(date)) throw new Error("Date is not on the class's weekday");
    // The No class item takes the group the class has that day, in case it was switched.
    const { data: sw, error: e1 } = await db.from("slot_groups").select("lab_group").eq("slot_id", slotId).eq("on_date", date).maybeSingle();
    if (e1) throw e1;
    const { error: e2 } = await db.from("calendar_items").insert({
      course_id: slot.course_id, kind: "no_class", title: "No class", on_date: date, class_slot_id: slotId, lab_group: sw?.lab_group ?? slot.lab_group,
    });
    if (e2 && e2.code !== "23505") throw e2; // already cancelled for that day
  });
}

export async function restoreSlotOn(itemId: string): Promise<ActionResult> {
  return withOfficer(async () => {
    const { error } = await (await serverClient()).from("calendar_items").delete().eq("id", itemId).eq("kind", "no_class").not("class_slot_id", "is", null);
    if (error) throw error;
  });
}

/** Switches one class's lab group for one day only. Picking the class's usual group removes the switch. */
export async function setSlotGroupOn(slotId: string, date: string, group: string): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Pick a valid date" };
  if (!["", "G1", "G2"].includes(group)) return { ok: false, message: "Pick Both, G1 or G2" };
  return withOfficer(async () => {
    const db = await serverClient();
    const { data: slot, error } = await db.from("class_slots").select("weekday, lab_group").eq("id", slotId).single();
    if (error) throw error;
    if (slot.weekday !== weekdayOf(date)) throw new Error("Date is not on the class's weekday");
    const { error: e2 } = group === slot.lab_group
      ? await db.from("slot_groups").delete().eq("slot_id", slotId).eq("on_date", date)
      : await db.from("slot_groups").upsert({ slot_id: slotId, on_date: date, lab_group: group });
    if (e2) throw e2;
  });
}
