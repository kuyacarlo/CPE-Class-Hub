"use client";
import { useSyncExternalStore } from "react";

// Phones: the day summary ("day") or the Week timetable ("week"). Saved in this browser.
export type View = "day" | "week";
export const VIEW_KEY = "classhub.calendarView";
const VIEW_EVENT = "classhub:calendarView";

export const readView = (): View => {
  try {
    // Phones open on the day summary unless the visitor picked Week.
    return localStorage.getItem(VIEW_KEY) === "week" ? "week" : "day";
  } catch {
    return "day";
  }
};
const onView = (cb: () => void) => {
  window.addEventListener(VIEW_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VIEW_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
export function setView(v: View) {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  document.documentElement.dataset.view = v;
  window.dispatchEvent(new Event(VIEW_EVENT));
}
export const useView = () => useSyncExternalStore(onView, readView, (): View => "day");
