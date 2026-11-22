"use client";
import { useEffect, useState } from "react";
import s from "./Footer.module.css";

type Theme = "auto" | "light" | "dark";
const KEY = "classhub.theme";
// The phone's title bar: the header's colour in each theme (also set per scheme in layout.tsx's viewport).
const BAR = { light: "#ffffff", dark: "#262626" };

/** Applies a theme: <html data-theme> (none = follow the device) and the title-bar colour to match. */
function apply(t: Theme) {
  const root = document.documentElement;
  if (t === "auto") delete root.dataset.theme;
  else root.dataset.theme = t;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = t === "auto" ? (m.media.includes("dark") ? BAR.dark : BAR.light) : BAR[t];
  });
}

/** Auto / Light / Dark, in the footer. Auto follows the device; a choice is kept in this browser. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("auto");
  useEffect(() => {
    let t: Theme = "auto";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") t = v;
    } catch {}
    setTheme(t);
    apply(t);
  }, []);
  const pick = (t: Theme) => {
    try {
      if (t === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {}
    setTheme(t);
    apply(t);
  };
  return (
    <span className={`seg ${s.theme}`} role="group" aria-label="Theme">
      {(["auto", "light", "dark"] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => pick(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
      ))}
    </span>
  );
}
