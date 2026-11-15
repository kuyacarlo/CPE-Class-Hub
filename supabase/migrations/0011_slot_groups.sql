-- A weekly class's lab group switched for one day only (for example, G1 takes the G2 lab that week). Set by officers
-- from a class's details; no row means the class keeps its usual group.
create table slot_groups (
  slot_id uuid not null references class_slots on delete cascade,
  on_date date not null,
  lab_group text not null check (lab_group in ('', 'G1', 'G2')),
  updated_at timestamptz not null default now(),
  primary key (slot_id, on_date)
);
alter table slot_groups enable row level security;
create policy read_all on slot_groups for select using (true);
create policy officer_write on slot_groups for all using (is_officer()) with check (is_officer());
create trigger touch_updated_at before update on slot_groups for each row execute function touch_updated_at();
