"use client";
import { useState } from "react";
import { formatShort } from "@/lib/time";
import { otherGroup } from "@/lib/week";
import { useGroup } from "../schedule/GroupSwitch";
import type { Row } from "./NoticeCard";
import s from "./NoticeRows.module.css";

/** Phones: notices as flat rows in one box; tapping a title shows the whole notice. */
export default function NoticeRows({ rows: all, empty = "No notices yet." }: { rows: Row[]; empty?: string }) {
  const group = useGroup();
  const [open, setOpen] = useState<string[]>([]);
  const rows = all.filter((r) => !otherGroup(r.group, group));
  if (!rows.length) return <p className="box empty">{empty}</p>;
  return (
    <div className="box rows">
      {rows.map((r) => {
        const shown = open.includes(r.id);
        const past = r.status !== "Active";
        return (
          <article key={r.id} className={`${s.row}${past ? ` ${s.past}` : ""}`} style={{ "--c": r.color } as React.CSSProperties}>
            <p className={s.l1}>
              <span className="tag">{r.code}{r.group && ` ${r.group}`}</span>
              {past ? <span className={s.pill}>{r.status}</span> : r.pinned && <span className={s.pill}>Pinned</span>}
              <span className={s.date}>{formatShort(r.posted)}</span>
            </p>
            <button type="button" className={s.title} aria-expanded={shown}
              onClick={() => setOpen((o) => (o.includes(r.id) ? o.filter((x) => x !== r.id) : [...o, r.id]))}>
              {r.title}
            </button>
            <p className={shown ? s.full : s.body}>{r.body}</p>
            {shown && r.calendar && <p className={s.cal}>On the calendar: {r.calendar}</p>}
          </article>
        );
      })}
    </div>
  );
}
