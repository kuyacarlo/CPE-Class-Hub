"use client";
import { startSemester } from "@/app/admin/actions/term";
import { termSchema } from "@/lib/schemas";
import { formatLong } from "@/lib/time";
import s from "../Admin.module.css";
import { useAdminForm } from "./useAdminForm";

type Counts = { classes: number; items: number; notices: number; files: number; reports: number };
const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** Head officer only. Clears last semester in one step; asks first, naming what will be deleted. */
export default function NewSemesterForm({ weeks, counts }: { weeks: number; counts: Counts }) {
  const f = useAdminForm({
    schema: termSchema,
    action: async (fd) => {
      const what = [n(counts.classes, "weekly class", "weekly classes"), n(counts.items, "calendar item", "calendar items"),
        n(counts.notices, "notice", "notices"), n(counts.files, "course file", "course files"), n(counts.reports, "report", "reports")].join(", ");
      const ask = `Start the new semester on ${formatLong(String(fd.get("starts_on")))}?\n\nThis deletes ${what}, every one-day class change, last semester's breaks, and every course's instructor and course no. Classmates' saved course filters and daily-summary courses go back to all courses. General files stay. This can't be undone.`;
      return confirm(ask) ? startSemester(fd) : { ok: false, message: "Nothing was changed" };
    },
    done: () => "New semester started",
    base: "/admin/courses",
    editing: false,
  });
  return (
    <form className={`box ${s.panel}`} aria-label="Start a new semester" onSubmit={f.onSubmit} noValidate>
      <h2>Start a new semester</h2>
      <p className={s.hint}>
        Clears last semester: weekly classes, calendar items, notices, course files, reports and breaks. The courses keep their names,
        codes and colours for you to rename. General files stay.
      </p>
      <div className={s.f2}>
        <label>Week 1 starts<input type="date" name="starts_on" required /></label>
        <label>Number of weeks<input type="number" name="week_count" defaultValue={weeks} min={1} max={52} required /></label>
      </div>
      {f.err("starts_on")}
      {f.err("week_count")}
      <button className={`btn ${s.save}`} disabled={f.busy}>Start new semester</button>
    </form>
  );
}
