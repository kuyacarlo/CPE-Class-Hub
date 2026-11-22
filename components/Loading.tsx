import s from "./Loading.module.css";

/** Shown at once while the next page is built on the server: the page's shape (a title, chips, rows), gently pulsing. */
export default function Loading() {
  return (
    <main aria-busy="true">
      <p className="sr" role="status">Loading…</p>
      <div className={s.sk} aria-hidden="true">
        <i className={s.h} />
        <div className={s.chips}>{[64, 84, 58, 76, 70].map((w, i) => <i key={i} style={{ width: w }} />)}</div>
        <div className={`box ${s.rows}`}>
          {[78, 62, 70, 54].map((w, i) => <div key={i}><i style={{ width: `${w}%` }} /><i style={{ width: `${w - 30}%` }} /></div>)}
        </div>
      </div>
    </main>
  );
}
