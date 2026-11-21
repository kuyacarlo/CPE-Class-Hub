import { GENERAL, type Course, type FileRow } from "@/lib/types";
import s from "./FileRows.module.css";

/** Phones: files as two-line rows in one box; `grouped` puts a header over each course, General last. */
export default function FileRows({ files, courses, grouped }: { files: FileRow[]; courses: Course[]; grouped: boolean }) {
  const groups = grouped
    ? [...courses.map((c) => ({ c, fs: files.filter((f) => f.course_id === c.id) })), { c: null, fs: files.filter((f) => f.course_id === null) }].filter((g) => g.fs.length)
    : [{ c: null, fs: files }];
  const row = (f: FileRow) => (
    <li key={f.id}>
      {f.url ? (
        <a className={s.f} href={f.url} target="_blank" rel="noopener"><b>{f.title}</b><span className={s.go}>Open ↗</span><small>{f.file_type}</small></a>
      ) : (
        <span className={s.f}><b>{f.title}</b><span className={s.go}>No file attached</span><small>{f.file_type}</small></span>
      )}
    </li>
  );
  return (
    <ul className={`box rows ${s.list}`} aria-label="Files">
      {groups.map(({ c, fs }) => [
        grouped && (
          <li key={c?.id ?? "general"} className={s.gh}>
            <h3><span className="tag" style={{ "--c": c?.color ?? GENERAL } as React.CSSProperties}>{c?.code ?? "General"}</span> {c?.name ?? "Class-wide files"}</h3>
          </li>
        ),
        ...fs.map(row),
      ])}
    </ul>
  );
}
