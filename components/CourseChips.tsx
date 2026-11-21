"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Busy, LinkPending } from "./Pending";
import { savePicks } from "@/components/schedule/PicksSync";
import { codesParam, toggle } from "@/lib/picks";
import { GENERAL, type Course } from "@/lib/types";
import s from "./CourseChips.module.css";

const sw = (c: string) => ({ "--c": c }) as React.CSSProperties;

type Props = { label: string; base: string; courses: Course[]; counts: Record<string, number>; /** keep courses with a 0 count */ every?: boolean } & (
  | { multi: true; sel: string[]; keep?: Record<string, string> } // sel: course ids, [] = All; keep: other query params
  | { multi?: false; sel: string | null } // sel: a course code, "general", or null for All
);

/**
 * Phones' one way to pick courses: a sideways row of chips with counts. A course with nothing to count is left out
 * unless it is picked (so a filter can always be undone) or `every` is set. Multi: tap several, remembered. Single: one chip, a link.
 */
export default function CourseChips(p: Props) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [tapped, setTapped] = useState<string | null>(null); // the chip whose page is loading
  const shown = (c: Course, on: boolean) => p.every || on || (p.counts[c.id] ?? 0) > 0;
  if (p.multi) {
    const pick = (id: string | "all") => {
      const ids = toggle(p.sel, id, p.courses.length);
      savePicks(ids);
      const codes = codesParam(ids, p.courses);
      const q = new URLSearchParams({ ...p.keep, ...(codes && { course: codes }) }).toString();
      setTapped(id);
      start(() => router.push(q ? `${p.base}?${q}` : p.base, { scroll: false }));
    };
    return (
      <div className={s.chips} role="group" aria-label={p.label}>
        <button type="button" className={s.all} aria-pressed={!p.sel.length} onClick={() => pick("all")}>
          <i aria-hidden="true" />All <small>{p.counts.all ?? 0}</small><Busy on={busy && tapped === "all"} />
        </button>
        {p.courses.filter((c) => shown(c, p.sel.includes(c.id))).map((c) => (
          <button key={c.id} type="button" title={c.name} aria-pressed={p.sel.includes(c.id)} onClick={() => pick(c.id)}>
            <i style={sw(c.color)} aria-hidden="true" />{c.code} <small>{p.counts[c.id] ?? 0}</small><Busy on={busy && tapped === c.id} />
          </button>
        ))}
      </div>
    );
  }
  const cur = (on: boolean) => (on ? ("page" as const) : undefined);
  return (
    <nav className={s.chips} aria-label={p.label}>
      <Link href={p.base} className={s.all} aria-current={cur(!p.sel)}><i aria-hidden="true" />All <small>{p.counts.all ?? 0}</small><LinkPending /></Link>
      {p.courses.filter((c) => shown(c, p.sel === c.code)).map((c) => (
        <Link key={c.id} href={`${p.base}?course=${c.code}`} title={c.name} aria-current={cur(p.sel === c.code)}>
          <i style={sw(c.color)} aria-hidden="true" />{c.code} <small>{p.counts[c.id] ?? 0}</small><LinkPending />
        </Link>
      ))}
      {((p.counts.general ?? 0) > 0 || p.sel === "general") && (
        <Link href={`${p.base}?course=general`} aria-current={cur(p.sel === "general")}>
          <i style={sw(GENERAL)} aria-hidden="true" />General <small>{p.counts.general}</small><LinkPending />
        </Link>
      )}
    </nav>
  );
}
