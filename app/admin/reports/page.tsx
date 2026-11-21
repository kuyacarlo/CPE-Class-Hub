import { deleteReport, toggleReportDone } from "@/app/admin/actions/reports";
import AdminPage from "@/components/AdminPage";
import AdminRow from "@/components/AdminRow";
import s from "@/components/Admin.module.css";
import ConfirmDelete, { ActionButton } from "@/components/ConfirmDelete";
import { loadCourses, loadReports } from "@/lib/data";
import { formatShort, manilaToday } from "@/lib/time";

/** What classmates reported from a class's or item's details. Open ones first, newest first. */
export default async function AdminReports() {
  const [courses, reports] = await Promise.all([loadCourses(), loadReports()]);
  const open = reports.filter((r) => !r.done).length;
  return (
    <AdminPage
      tab="reports"
      form={
        <div className={`box ${s.panel}`}>
          <h2>Reports</h2>
          <p className={s.hint}>
            Classmates send these from &quot;Something wrong?&quot; in a class&apos;s or item&apos;s details. Fix the class or item, then
            mark the report done. {open ? `${open} open.` : "Nothing open."}
          </p>
        </div>
      }
      list="Reports"
      count={reports.length}
    >
      {reports.map((r) => (
        <AdminRow
          key={r.id}
          course={courses.find((c) => c.id === r.course_id)}
          title={<>{r.about}{r.done && <span className={s.st}>Done</span>}</>}
          details={<span className={s.msg}>{r.message} · sent {formatShort(manilaToday(new Date(r.created_at)))}</span>}
          past={r.done}
          actions={<>
            <ActionButton label={r.done ? "Undo done" : "Mark done"} action={toggleReportDone.bind(null, r.id)} done={r.done ? "Back to open" : "Marked as done"} />
            <ConfirmDelete title="this report" action={deleteReport.bind(null, r.id)} />
          </>}
        />
      ))}
    </AdminPage>
  );
}
