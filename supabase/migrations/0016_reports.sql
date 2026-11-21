-- Classmates report a mistake (a wrong room or time) from a class's or calendar item's details; officers read them in
-- Admin, Reports. A closed table: only officers read, update and delete, through RLS. Nobody inserts directly: the
-- public server action calls add_report as the service role, after building `about` from the database itself.
-- course_id cascades, so starting a new semester clears last semester's reports.
create table reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  course_id uuid not null references courses on delete cascade,
  about text not null check (char_length(about) between 1 and 120),
  message text not null check (char_length(message) between 3 and 500),
  done boolean not null default false
);
alter table reports enable row level security;
revoke all on reports from anon, authenticated;
grant select, update (done), delete on reports to authenticated;
create policy officer_read on reports for select using (is_officer());
create policy officer_update on reports for update using (is_officer()) with check (is_officer());
create policy officer_delete on reports for delete using (is_officer());

-- Adds a report unless 50 are already open, so a flood fills the inbox once instead of forever. The lock makes two
-- requests at the same moment count one after the other. Returns false when full.
create function add_report(course uuid, about text, message text) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('reports'));
  if (select count(*) from reports where not done) >= 50 then
    return false;
  end if;
  insert into reports (course_id, about, message) values (course, about, message);
  return true;
end;
$$;

revoke execute on function add_report(uuid, text, text) from public, anon, authenticated;
grant execute on function add_report(uuid, text, text) to service_role;
