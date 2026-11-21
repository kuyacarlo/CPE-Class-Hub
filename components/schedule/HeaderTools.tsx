"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { setView, useView } from "./view";
import s from "../Header.module.css";

export const FILTER_EVENT = "classhub:filter";
export const NOTIFY_EVENT = "classhub:notify";

/**
 * Phones' header buttons, on the right beside the logo. Every page: a bell for the 9 PM summary settings. Schedule
 * also gets a labelled Day/Week switch and Filter (a sliders icon, so it isn't mistaken for a menu).
 */
export default function HeaderTools() {
  const path = usePathname();
  const course = useSearchParams().get("course");
  const view = useView();
  const n = course ? course.split(",").filter(Boolean).length : 0;
  const week = view === "week";
  return (
    <span className={`ph ${s.tools}`}>
      {path === "/" && (
        <>
          <button type="button" className={s.view} aria-label={week ? "Day summary" : "Week timetable"} onClick={() => setView(week ? "day" : "week")}>
            {week ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 9h6" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="9.5" y="4" width="5" height="16" rx="1.5" /><rect x="16" y="4" width="5" height="16" rx="1.5" /></svg>
            )}
            {week ? "Day" : "Week"}
          </button>
          <button type="button" className={s.tool} aria-label={n ? `Filter, ${n} ${n === 1 ? "course" : "courses"} picked` : "Filter"} onClick={() => window.dispatchEvent(new Event(FILTER_EVENT))}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" />
            </svg>
            {n > 0 && <span className={s.badge} aria-hidden="true">{n}</span>}
          </button>
        </>
      )}
      <button type="button" className={s.tool} aria-label="Notifications" onClick={() => window.dispatchEvent(new Event(NOTIFY_EVENT))}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
        </svg>
      </button>
    </span>
  );
}
