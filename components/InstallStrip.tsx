"use client";
import { useEffect, useRef, useState } from "react";
import { installed } from "@/lib/installed";
import { takeInstallPrompt } from "./InstallPrompt";
import s from "./InstallStrip.module.css";

const KEY = "classhub.installDismissed";

/** Touch phones in a browser tab: a one-line invitation to add Class Hub to the home screen, dismissed for good. */
export default function InstallStrip() {
  const [show, setShow] = useState(false);
  const how = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    setShow(!dismissed && !installed() && matchMedia("(max-width: 900px) and (pointer: coarse)").matches);
    // Installed from the browser's own prompt: the invitation has done its job.
    const done = () => {
      try {
        localStorage.setItem(KEY, "1");
      } catch {}
      setShow(false);
    };
    window.addEventListener("appinstalled", done);
    return () => window.removeEventListener("appinstalled", done);
  }, []);
  if (!show) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };
  const open = () => {
    const offer = takeInstallPrompt();
    if (offer) offer.prompt().catch(() => how.current?.showModal());
    else how.current?.showModal();
  };
  return (
    <section className={s.strip} aria-label="Add to Home Screen">
      <p>Add Class Hub to your Home Screen</p>
      <button type="button" className={s.how} onClick={open}>How</button>
      <button type="button" className={s.x} aria-label="Dismiss" onClick={dismiss}>✕</button>
      <dialog ref={how} className={s.dlg} aria-labelledby="ins" onClick={(e) => e.target === how.current && how.current.close()}>
        <h2 id="ins">Add to Home Screen</h2>
        <p><b>iPhone or iPad:</b> in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>, and open Class Hub from there.</p>
        <p><b>Android:</b> in Chrome, open the <b>⋮</b> menu, then <b>Add to Home screen</b> or <b>Install app</b>.</p>
        <p>Opened this from Messenger? Open the link in Safari or Chrome first.</p>
        <button type="button" className="btn s" onClick={() => how.current?.close()}>Done</button>
      </dialog>
    </section>
  );
}
