"use client";
import { useLinkStatus } from "next/link";

/** A moving hatch laid over a control while the page it asked for loads (styled by .pending in tokens.css). */
export const Busy = ({ on }: { on: boolean }) => (on ? <span className="pending" aria-hidden="true" /> : null);

/** Put inside a <Link>: shows Busy while the link's page is on its way. */
export function LinkPending() {
  return <Busy on={useLinkStatus().pending} />;
}
