"use client";
import { formatLong, formatShort } from "@/lib/time";
import type { Course, Item } from "@/lib/types";
import { openDetail } from "./DetailsDialog";
import { KIND, pgTime, Tag } from "./EventCard";
import { useGroup } from "./GroupSwitch";
import { otherGroup } from "@/lib/week";
import s from "./NextUp.module.css";

const when = (d: string, today: string) => {
  const n = Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n < 7 ? `In ${n} days` : formatShort(d);
};

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** A ticket's stub: weekday, date, and how far away ("today", "tmrw", "4 days"), or the month from a week away. */
const stub = (d: string, today: string) => {
  const t = new Date(`${d}T00:00:00Z`), n = Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  return { wd: WD[t.getUTCDay()], day: t.getUTCDate(), away: n === 0 ? "today" : n === 1 ? "tmrw" : n < 7 ? `${n} days` : formatShort(d).slice(-3) };
};

/**
 * `all`: every upcoming candidate in order; shows the first three in the visitor's lab group. Desktop: three cards.
 * `tickets` (phones' Week view, under the timetable): one box of rows, each with a date stub, like a strip of tickets.
 */
export default function NextUp({ items: all, courses, today, tickets }: { items: Item[]; courses: Course[]; today: string; tickets?: boolean }) {
  const group = useGroup();
  const items = all.filter((i) => !otherGroup(i.lab_group, group)).slice(0, 3);
  if (tickets) {
    return (
      <section className={s.tk} aria-labelledby="uph-t">
        <h2 id="uph-t" className={s.uph}>Next up</h2>
        {items.length ? (
          <div className="box rows">
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
  const empty = items.length ? "Nothing else due or tested yet" : "Nothing due or tested from today on";
  return (
    <section className={s.upnext} aria-labelledby="uph">
      <h2 id="uph" className={s.uph}>Next up</h2>
      <div className={s.band}>
        {items.map((x) => {
          const c = courses.find((c) => c.id === x.course_id);
          return (
            <article key={x.id} className={`box ${s.next}`} style={{ "--c": c?.color ?? "#fff" } as React.CSSProperties}>
              <p className={s.lbl}>{KIND[x.kind]} <span>{when(x.on_date, today)}</span></p>
              <h3>{x.title}</h3>
              <p>{c?.name}</p>
              <p className={s.nd}>{formatLong(x.on_date)}{x.at_time && ` at ${pgTime(x.at_time)}`}</p>
              <button type="button" className={s.lk} onClick={() => openDetail({ t: "item", id: x.id })}>See details</button>
            </article>
          );
        })}
        {Array.from({ length: 3 - items.length }, (_, i) => (
          <article key={i} className={`box ${s.next} ${s.none}`}>
            <p className={s.lbl}>Coming up</p>
            <h3>{empty}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
