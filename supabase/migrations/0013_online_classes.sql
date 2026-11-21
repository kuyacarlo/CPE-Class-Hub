-- Online classes: a weekly class can be online for the whole term, and any class can be switched online (or back in
-- person) for one day only. A null one-day value keeps the class's usual mode.
alter table class_slots add column online boolean not null default false;
alter table slot_groups add column online boolean;
