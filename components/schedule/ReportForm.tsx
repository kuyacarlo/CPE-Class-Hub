"use client";
import { useState } from "react";
import { sendReport } from "@/app/actions/report";
import { toast } from "@/components/Toast";
import s from "./DetailsDialog.module.css";

/** "Something wrong?": a classmate tells the officers about a wrong room, time or anything else on this class or item. */
export default function ReportForm({ about }: { about: { slot_id: string; date: string } | { item_id: string } }) {
  const [busy, setBusy] = useState(false);
  return (
    <details className={s.report}>
      <summary>Something wrong?</summary>
      <form
        aria-label="Report a mistake"
        onSubmit={async (ev) => {
          ev.preventDefault();
          const form = ev.currentTarget;
          const message = String(new FormData(form).get("message") ?? "").trim();
          if (message.length < 3) return toast("Say what's wrong");
          setBusy(true);
          try {
            const r = await sendReport({ ...about, message });
            toast(r.ok ? "Sent to the officers. Thanks!" : r.message);
            if (r.ok) {
              form.reset();
              form.closest("details")?.removeAttribute("open");
            }
          } catch {
            toast("Couldn't send. Try again.");
          } finally {
            setBusy(false);
          }
        }}>
        <label>What should it say?<textarea name="message" rows={3} maxLength={500} required placeholder="The room is ER 204 now" /></label>
        <button className="btn s" disabled={busy}>Send to the officers</button>
      </form>
    </details>
  );
}
