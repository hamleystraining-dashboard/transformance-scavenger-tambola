-- Transformer Scavenger Tambola — Schema
-- Run this in Supabase SQL Editor

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_code text not null unique,
  business_unit text not null,
  ticket_numbers int[] not null,
  ticket_grid jsonb not null,
  registered_at timestamptz not null default now()
);

create table game_state (
  id int primary key default 1,
  status text not null default 'lobby' check (status in ('lobby','live','ended')),
  started_at timestamptz,
  duration_seconds int not null default 1800,
  constraint single_row check (id = 1)
);
insert into game_state (id, status) values (1, 'lobby');

create table prizes (
  category text primary key,
  label text not null,
  won_by_player_id uuid references players(id),
  won_at timestamptz
);
insert into prizes (category, label) values
  ('fast_five', 'Fast Five'),
  ('four_corners', 'Four Corners'),
  ('top_line', 'Top Line'),
  ('middle_line', 'Middle Line'),
  ('bottom_line', 'Bottom Line'),
  ('full_house', 'Full House');

create table claims (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  category text not null references prizes(category),
  claimed_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','certified','rejected','expired')),
  resolved_at timestamptz
);

create index claims_category_status_idx on claims (category, status, claimed_at);

-- Enable realtime
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_state;
alter publication supabase_realtime add table prizes;
alter publication supabase_realtime add table claims;

-- RLS: open for this event's simplicity (single-office, short-lived game)
alter table players enable row level security;
alter table game_state enable row level security;
alter table prizes enable row level security;
alter table claims enable row level security;

create policy "public read players" on players for select using (true);
create policy "public insert players" on players for insert with check (true);

create policy "public read game_state" on game_state for select using (true);
create policy "public update game_state" on game_state for update using (true);

create policy "public read prizes" on prizes for select using (true);
create policy "public update prizes" on prizes for update using (true);

create policy "public read claims" on claims for select using (true);
create policy "public insert claims" on claims for insert with check (true);
create policy "public update claims" on claims for update using (true);
