"use server";
import { withOfficer, type ActionResult } from "@/lib/auth";
import { hoursSchema, slotSchema } from "@/lib/schemas";
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

type SlotRow = { weekday: number; lab_group: string; starts_at: string; ends_at: string; online: boolean; room: string | null };
type Change = { lab_group?: string | null; starts_at?: string | null; ends_at?: string | null; online?: boolean | null; room?: string | null; agenda?: string | null };

/** Saves part of one class's one-day change. `change` gets the class and returns null for "back to usual"; a row left
 * with nothing changed is removed. */
async function saveChange(slotId: string, date: string, change: (slot: SlotRow) => Change): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Pick a valid date" };
  return withOfficer(async () => {
    const db = await serverClient();
    const { data: slot, error } = await db.from("class_slots").select("weekday, lab_group, starts_at, ends_at, online, room").eq("id", slotId).single();
    if (error) throw error;
    if (slot.weekday !== weekdayOf(date)) throw new Error("Date is not on the class's weekday");
    const { error: e2 } = await db.from("slot_groups").upsert({ slot_id: slotId, on_date: date, ...change(slot) });
    if (e2) throw e2;
    const { error: e3 } = await db.from("slot_groups").delete().eq("slot_id", slotId).eq("on_date", date)
      .is("lab_group", null).is("starts_at", null).is("ends_at", null).is("online", null).is("room", null).is("agenda", null);
    if (e3) throw e3;
  });
}

/** Switches one class's lab group for one day only. Picking the class's usual group removes the switch. */
export async function setSlotGroupOn(slotId: string, date: string, group: string): Promise<ActionResult> {
  if (!["", "G1", "G2"].includes(group)) return { ok: false, message: "Pick Both, G1 or G2" };
  return saveChange(slotId, date, (slot) => ({ lab_group: group === slot.lab_group ? null : group }));
}

/** Changes one class's hours for one day only, for example "3:00 PM" to "5:00 PM". The usual hours remove the change. */
export async function setSlotHoursOn(slotId: string, date: string, starts: string, ends: string): Promise<ActionResult> {
  const p = hoursSchema.safeParse({ starts_at: starts, ends_at: ends });
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const { starts_at, ends_at } = p.data;
  return saveChange(slotId, date, (slot) =>
    starts_at === slot.starts_at && ends_at === slot.ends_at ? { starts_at: null, ends_at: null } : { starts_at, ends_at });
}

/** Makes one class online, or in person, for one day only. The class's usual mode removes the change. */
export async function setSlotOnlineOn(slotId: string, date: string, online: boolean): Promise<ActionResult> {
  if (typeof online !== "boolean") return { ok: false, message: "Pick In person or Online" };
  return saveChange(slotId, date, (slot) => ({ online: online === slot.online ? null : online }));
}

/** Sets one class's room and agenda for one day only. A blank or usual room keeps the usual room; a blank agenda means none. */
export async function setSlotRoomAgendaOn(slotId: string, date: string, room: string, agenda: string): Promise<ActionResult> {
  const r = String(room ?? "").trim(), a = String(agenda ?? "").trim();
  if (r.length > 40) return { ok: false, message: "Rooms are up to 40 characters" };
  if (a.length > 40) return { ok: false, message: "Agendas are up to 40 characters" };
  return saveChange(slotId, date, (slot) => ({ room: !r || r === slot.room ? null : r, agenda: a || null }));
}
