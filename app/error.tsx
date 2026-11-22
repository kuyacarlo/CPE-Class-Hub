"use client";

import Link from "next/link";
import Plate from "@/components/Plate";

// Unhandled errors here are database outages (loaders catch per-block LoadErrors), e.g. a paused free project.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Plate title="Class Hub is waking up" actions={<><button className="btn p" onClick={reset}>Try again</button><Link href="/">Back to the schedule</Link></>}>
      <p>Its database rests when nobody has visited for a while. Give it a minute, then try again.</p>
    </Plate>
  );
}
