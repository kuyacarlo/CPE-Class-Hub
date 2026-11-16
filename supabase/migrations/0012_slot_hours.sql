-- One-day hours for a class (for example, the instructor moves Monday's 2 PM class to 3 PM, that day only), stored
-- with the one-day group switch. A null column keeps the class's usual value; a row with nothing changed is removed.
-- The table keeps its name so the site already deployed keeps working until this version replaces it.
alter table slot_groups alter column lab_group drop not null;
alter table slot_groups add column starts_at time, add column ends_at time,
  add constraint slot_groups_hours check ((starts_at is null) = (ends_at is null) and (ends_at is null or ends_at > starts_at));
