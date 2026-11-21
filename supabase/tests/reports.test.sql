begin;
select plan(10);

-- Setup as superuser: an officer, and a course to report about.
insert into officers (email, role) values ('officer@test.local', 'officer');
create temp table ctx as select (select id from courses where code = 'PM') as course_id;
grant select on ctx to anon, authenticated, service_role;

-- Visitors and signed-in classmates can neither read nor write reports, nor call add_report: only the server can.
set local role anon;
select throws_ok($$select * from reports$$, '42501', null, 'anon cannot read reports');
select throws_ok($$insert into reports (course_id, about, message) values ((select course_id from ctx), 'a', 'wrong room')$$,
  '42501', null, 'anon cannot insert a report');
select throws_ok($$select add_report((select course_id from ctx), 'a', 'wrong room')$$, '42501', null, 'anon cannot call add_report');
set local role authenticated;
set local request.jwt.claims = '{"email":"someone@test.local"}';
select throws_ok($$insert into reports (course_id, about, message) values ((select course_id from ctx), 'a', 'wrong room')$$,
  '42501', null, 'a signed-in classmate cannot insert a report');

-- The server (service role) adds one; a message that is too short or long is refused by the table.
set local role service_role;
select is(add_report((select course_id from ctx), 'PM class, Tue 17 Nov', 'The room is ER 204 now'), true, 'the server adds a report');
select throws_ok($$select add_report((select course_id from ctx), 'a', repeat('x', 501))$$, '23514', null, 'a message over 500 characters is refused');

-- An officer reads it and marks it done; a classmate reads nothing.
set local role authenticated;
set local request.jwt.claims = '{"email":"officer@test.local"}';
select is((select count(*)::int from reports), 1, 'an officer reads reports');
select lives_ok($$update reports set done = true$$, 'an officer marks a report done');
set local request.jwt.claims = '{"email":"someone@test.local"}';
select is((select count(*)::int from reports), 0, 'a classmate who is not an officer reads none');

-- Once 50 reports are open, the server's add_report says no instead of adding more.
reset role;
insert into reports (course_id, about, message) select (select course_id from ctx), 'a', 'spam ' || g from generate_series(1, 50) g;
set local role service_role;
select is(add_report((select course_id from ctx), 'a', 'one more'), false, 'no more reports once 50 are open');

select * from finish();
rollback;
