import s from "./Calendar.module.css";

const KEY: [string, React.CSSProperties][] = [
  ["Class", {}],
  ["Quiz or exam", { background: "var(--ink)" }],
  ["Due", { borderStyle: "dashed" }],
  ["Online", { borderTopWidth: 6 }],
  ["No class", { background: "repeating-linear-gradient(135deg,var(--div) 0 2px,var(--card) 2px 6px)" }],
];

/** What the calendar's card styles mean. */
export default function Legend({ hint }: { hint?: boolean }) {
  return (
    <div className={s.key}>
      {KEY.map(([label, style]) => <span key={label}><i style={style} />{label}</span>)}
      {hint && <span>Tap any card for details</span>}
    </div>
  );
}
