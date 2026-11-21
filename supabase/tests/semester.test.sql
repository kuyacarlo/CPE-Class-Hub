begin;
select plan(17);

-- Setup as superuser: officers, a phone's push picks, a General file and a one-day change, so the reset has them to clear.
insert into officers (email, role) values ('head@test.local', 'head'), ('officer@test.local', 'officer');
insert into push_subscriptions (endpoint, p256dh, auth, courses) values
  ('https://push.test/1', 'k', 'a', array[(select id from courses where code = 'PM')]);
insert into files (course_id, title, file_type, url) values (null, 'Class list', 'Sheet', 'https://example.com/list');
insert into slot_groups (slot_id, on_date, lab_group) values ((select id from class_slots limit 1), '2026-11-17', 'G1');
create temp table before as select id, slot, name, code, color from courses;
create temp table n as select (select count(*) from class_slots)::int as slots, (select count(*) from files where course_id is null)::int as general;
grant select on before, n to authenticated;

set local role authenticated;

-- An officer who is not the head cannot start a semester.
set local request.jwt.claims = '{"email":"officer@test.local"}';
select throws_ok($$select start_semester('2027-01-17', 18)$$, '42501', null, 'an officer who is not the head is refused');

set local request.jwt.claims = '{"email":"head@test.local"}';
-- The new semester must start after the current one, so a typo or a second tap cannot wipe the term again.
select throws_ok($$select start_semester('2026-11-15', 18)$$, 'P0001', 'The new semester must start after the current one',
  'the same start date is refused');
select throws_ok($$select start_semester('2027-01-18', 18)$$, '23514', null, 'a start that is not a Sunday is refused');
select ok((select slots from n) > 0 and (select count(*)::int from class_slots) = (select slots from n), 'nothing was cleared by a refused start');

select lives_ok($$select start_semester('2027-01-17', 18)$$, 'the head officer starts the next semester');
select results_eq('select starts_on, week_count::int from term', $$values ('2027-01-17'::date, 18)$$, 'the term has the new dates');
select is((select count(*)::int from term_breaks), 0, 'last semester''s breaks are gone');
select is((select count(*)::int from courses), 9, 'still nine courses');
select results_eq('select slot, name, code, color from courses order by slot', 'select slot, name, code, color from before order by slot',
  'each course keeps its slot, name, code and colour');
select is((select count(*)::int from courses c join before b using (id)), 0, 'every course has a new id, so old saved picks match none');
select is((select count(*)::int from courses where instructor <> '' or course_no <> ''), 0, 'instructors and course nos. are cleared');
select is((select count(*)::int from class_slots), 0, 'weekly classes are gone');
select is((select count(*)::int from calendar_items), 0, 'calendar items are gone');
select is((select count(*)::int from notices), 0, 'notices are gone');
select is((select count(*)::int from files where course_id is not null), 0, 'course files are gone');
select is((select count(*)::int from files where course_id is null), (select general from n), 'General files stay');
reset role;
select is((select courses from push_subscriptions where endpoint = 'https://push.test/1'), '{}'::uuid[],
  'phones'' daily summaries go back to every course');

select * from finish();
rollback;
