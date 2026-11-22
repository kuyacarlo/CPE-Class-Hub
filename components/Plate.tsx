import Image from "next/image";
import s from "./Plate.module.css";

/** A whole-page message (sign-in, errors, not found): the logo tile, a heading, a line or two, and what to do next. */
export default function Plate({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <main className={s.wrap}>
      <section className={`box ${s.plate}`} aria-labelledby="plate-h">
        <Image className={s.logo} src="/icon-192.png" width={64} height={64} alt="" priority />
        <h1 id="plate-h">{title}</h1>
        <div className={s.body}>{children}</div>
        <div className={s.acts}>{actions}</div>
      </section>
    </main>
  );
}
