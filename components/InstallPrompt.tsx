"use client";
import { useEffect } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };
let saved: InstallEvent | null = null;

/** Android Chrome's "install this app" offer, saved for the install strip's button; null elsewhere (iPhone). */
export const takeInstallPrompt = () => {
  const e = saved;
  saved = null;
  return e;
};

/** Mounted once in the layout: the offer can come before the strip is on screen, so it is caught from the first load. */
export default function InstallPrompt() {
  useEffect(() => {
    const keep = (e: Event) => {
      e.preventDefault();
      saved = e as InstallEvent;
    };
    window.addEventListener("beforeinstallprompt", keep);
    return () => window.removeEventListener("beforeinstallprompt", keep);
  }, []);
  return null;
}
