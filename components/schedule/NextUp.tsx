"use client";
import { useId } from "react";
import { formatShort } from "@/lib/time";
import type { Course, Item } from "@/lib/types";
import { openDetail } from "./DetailsDialog";
import { KIND, pgTime, Tag } from "./EventCard";
import { useGroup } from "./GroupSwitch";
import { otherGroup } from "@/lib/week";
import s from "./NextUp.module.css";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** A ticket's stub: weekday, date, and how far away ("today", "tmrw", "4 days"), or the month from a week away. */
const stub = (d: string, today: string) => {
  const t = new Date(`${d}T00:00:00Z`), n = Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  return { wd: WD[t.getUTCDay()], day: t.getUTCDate(), away: n === 0 ? "today" : n === 1 ? "tmrw" : n < 7 ? `${n} days` : formatShort(d).slice(-3) };
};

/**
 * The next three quizzes and due dates in the visitor's lab group (`all`: every upcoming candidate, in order), as tickets:
 * a date stub torn off by a dashed line. Phones (under the Week timetable): one list. `wide` (desktop, above the week):
 * three tickets side by side.
 */
export default function NextUp({ items: all, courses, today, wide }: { items: Item[]; courses: Course[]; today: string; wide?: boolean }) {
  const group = useGroup();
  const id = useId(); // both copies (desktop and phone) are on the page at once
  const items = all.filter((i) => !otherGroup(i.lab_group, group)).slice(0, 3);
  return (
    <section className={wide ? `${s.tk} ${s.wide}` : s.tk} aria-labelledby={id}>
      <h2 id={id} className={s.uph}>Next up</h2>
      {items.length ? (
        <div className={wide ? s.band : "box rows"}>
          {items.map((x) => {
            const c = courses.find((c) => c.id === x.course_id), d = stub(x.on_date, today);
            return (
              <button key={x.id} type="button" className={s.t} style={{ "--c": c?.color ?? "#ddd" } as React.CSSProperties}
                onClick={() => openDetail({ t: "item", id: x.id })}>
                <time dateTime={x.on_date}>{d.wd}<b>{d.day}</b>{d.away}</time>
                <span><span className={s.k}><Tag c={c} /><i>{KIND[x.kind]}</i></span><b>{x.title}</b><small>{x.at_time ? pgTime(x.at_time) : "All day"}</small></span>
              </button>
            );
          })}
        </div>
      ) : <p className="box empty">Nothing due or tested from today on.</p>}
    </section>
  );
}
