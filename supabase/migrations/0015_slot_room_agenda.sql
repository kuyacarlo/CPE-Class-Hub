-- One-day room and agenda for a weekly class (for example, Lab 3 instead of ER 204, and "Orientation"), stored with the
-- other one-day changes. Null keeps the usual room and means no agenda.
alter table slot_groups add column room text check (char_length(room) between 1 and 40),
  add column agenda text check (char_length(agenda) between 1 and 40);
