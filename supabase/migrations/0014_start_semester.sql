-- Starts the next semester in one step (head officer only): new dates, no breaks, and the nine courses replaced by fresh
-- copies keeping their slot, name, code and colour. Deleting the old courses cascades to their weekly classes (and
-- one-day changes), calendar items, notices and files; General files (no course) stay. The new ids mean saved course
-- picks on phones match nothing, and the daily summaries go back to every course.
-- security definer: push_subscriptions is closed to officers, and courses only grant some columns; the head check
-- comes first. Every delete and update says `where true`, since the API refuses statements without a WHERE.
create function start_semester(new_start date, new_weeks int) returns void
language plpgsql security definer set search_path = public as $$
declare
  kept jsonb;
begin
  if not is_head_officer() then
    raise exception 'Only the head officer can start a semester' using errcode = '42501';
  end if;
  if new_start <= (select starts_on from term) then
    raise exception 'The new semester must start after the current one';
  end if;
  update term set starts_on = new_start, week_count = new_weeks where true;
  delete from term_breaks where true;
  select jsonb_agg(jsonb_build_object('slot', slot, 'name', name, 'code', code, 'color', color)) into kept from courses;
  delete from courses where true;
  insert into courses (slot, name, code, color)
    select slot, name, code, color from jsonb_to_recordset(kept) as x(slot smallint, name text, code text, color text);
  update push_subscriptions set courses = '{}' where true;
end;
$$;

revoke execute on function start_semester(date, int) from public, anon;
grant execute on function start_semester(date, int) to authenticated;
