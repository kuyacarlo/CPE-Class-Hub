"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { codesParam, PICKS_KEY, resolvePicks } from "@/lib/picks";
import type { Course } from "@/lib/types";

type Picks = Pick<Course, "id" | "code" | "slot">[];

/** Saves the picked course ids for Schedule and Notices; [] (All) clears them. */
export function savePicks(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(PICKS_KEY, JSON.stringify(ids));
    else localStorage.removeItem(PICKS_KEY);
  } catch {}
}

function readPicks(): string[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(PICKS_KEY) ?? "null");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
}

/** A link with ?course= saves its picks; a plain link gets the saved picks put back into the URL. */
export default function PicksSync({ course, courses }: { course: string | null; courses: Picks }) {
  const router = useRouter();
  useEffect(() => {
    if (!courses.length) return;
    if (course !== null) {
      const ids = resolvePicks(course, null, courses).ids;
      savePicks(ids);
      // A link's codes may name courses that no longer exist (renamed, a new semester): keep only the ones that matched,
      // so the URL, the Filter badge and what is shown agree.
      const codes = codesParam(ids, courses);
      if (codes === course) return;
      const q = new URLSearchParams(window.location.search);
      if (codes) q.set("course", codes);
      else q.delete("course");
      router.replace(`${window.location.pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
      return;
    }
    const codes = codesParam(resolvePicks(null, readPicks(), courses).ids, courses);
    if (!codes) return;
    const q = new URLSearchParams(window.location.search);
    q.set("course", codes);
    router.replace(`${window.location.pathname}?${q}`, { scroll: false });
  }, [course, courses, router]);
  return null;
}
