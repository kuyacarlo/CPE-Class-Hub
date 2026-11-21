import AdminPage from "@/components/AdminPage";
import AdminRow from "@/components/AdminRow";
import CourseForm from "@/components/forms/CourseForm";
import NewSemesterForm from "@/components/forms/NewSemesterForm";
import TermForm from "@/components/forms/TermForm";
import { requireOfficer } from "@/lib/auth";
import { loadCourses, loadFiles, loadItems, loadNotices, loadReports, loadSlots, loadTerm } from "@/lib/data";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function AdminCourses() {
  const [me, courses, slots, notices, files, items, reports, { term, breaks }] = await Promise.all([
    requireOfficer(), loadCourses(), loadSlots(), loadNotices(), loadFiles(), loadItems(), loadReports(), loadTerm(),
  ]);
  const counts = {
    classes: slots.length, items: items.length, notices: notices.length, files: files.filter((f) => f.course_id).length, reports: reports.length,
  };
  const of = (rows: { course_id: string | null }[], id: string) => rows.filter((r) => r.course_id === id).length;

  return (
    <AdminPage
      tab="courses"
      form={<>
        <CourseForm courses={courses} />
        <TermForm term={term} breaks={breaks} />
        {me.role === "head" && <NewSemesterForm weeks={term.week_count} counts={counts} />}
      </>}
      list="Courses"
      count={courses.length}
    >
      {courses.map((c) => (
        <AdminRow
          key={c.id}
          course={c}
          title={c.name}
          details={`${c.instructor ? `${c.instructor} · ` : ""}${plural(of(slots, c.id), "class a week", "classes a week")} · ${plural(of(notices, c.id), "notice", "notices")} · ${plural(of(files, c.id), "file", "files")}`}
          actions={null}
        />
      ))}
    </AdminPage>
  );
}
