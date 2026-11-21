"use client";
import { useLayoutEffect } from "react";

/**
 * Marks which way the week just moved (<html data-dir="next|prev">), so the week's content (.wk-in, keyed by week)
 * slides in from that side. Nothing on the first visit or a reload of the same week.
 */
export default function WeekDir({ weekStart }: { weekStart: string }) {
  useLayoutEffect(() => {
    let prev: string | null = null;
    try {
      prev = sessionStorage.getItem("classhub.week");
      sessionStorage.setItem("classhub.week", weekStart);
    } catch {}
    const root = document.documentElement;
    if (prev && prev !== weekStart) root.dataset.dir = weekStart > prev ? "next" : "prev";
    else delete root.dataset.dir;
    // Cleared after the slide, so showing the Day or Week view again later doesn't replay it.
    const t = setTimeout(() => delete root.dataset.dir, 400);
    return () => clearTimeout(t);
  }, [weekStart]);
  return null;
}
