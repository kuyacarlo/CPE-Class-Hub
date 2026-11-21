"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Busy } from "@/components/Pending";
import { codesParam, toggle } from "@/lib/picks";
import type { Course } from "@/lib/types";
import { courseCounts } from "@/lib/day";
import type { WeekData } from "@/lib/week";
import { useGroup } from "./GroupSwitch";
import { savePicks } from "./PicksSync";
import s from "./CourseFilter.module.css";

type Props = { courses: Course[]; sel: string[]; week: WeekData | null; weekStart: string; weekParam?: string };

export default function CourseFilter({ courses, sel, week, weekStart, weekParam }: Props) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [tapped, setTapped] = useState<string | null>(null);
  const group = useGroup();
  // Counts ignore the course filter so every course always shows its load this week
  const counts = week ? courseCounts(week, weekStart, group) : null;
  const pick = (id: string | "all") => {
    const ids = toggle(sel, id, courses.length);
    savePicks(ids);
    const codes = codesParam(ids, courses);
    setTapped(id);
    start(() => router.push(`/?${new URLSearchParams({ ...(weekParam && { week: weekParam }), ...(codes && { course: codes }) })}`, { scroll: false }));
  };
  return (
    <nav className={`box ${s.courses}`} aria-label="Your courses">
      <h2>Your courses</h2>
      <p className={s.chint}>Tap several to see them together</p>
      <button type="button" className={s.all} aria-pressed={!sel.length} onClick={() => pick("all")}>
        <span className="sw" aria-hidden="true" />
        <span className={s.nm}><b>All courses</b><small>{courses.length} this semester</small></span>
        {counts && <span className={s.n}>{counts.all}</span>}<Busy on={busy && tapped === "all"} />
      </button>
      {courses.map((c) => (
        <button key={c.id} type="button" aria-pressed={sel.includes(c.id)} onClick={() => pick(c.id)}>
          <span className="sw" style={{ "--c": c.color } as React.CSSProperties} aria-hidden="true" />
          <span className={s.nm}><b>{c.code}</b><small>{c.name}</small></span>
          {counts && <span className={s.n} title="Items this week">{counts[c.id] ?? 0}</span>}<Busy on={busy && tapped === c.id} />
        </button>
      ))}
    </nav>
  );
}
