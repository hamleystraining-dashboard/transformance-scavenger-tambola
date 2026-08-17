-- Migration: add game_code so players/admin can confirm they're on the same round,
-- and support starting a fresh game (e.g. Day 2) without leftover data.
-- Run this in Supabase SQL Editor AFTER the original schema.sql.

alter table game_state add column if not exists game_code text;
alter table players add column if not exists game_code text;

-- allow the same employee_code to register again in a later game round
alter table players drop constraint if exists players_employee_code_key;
alter table players add constraint players_employee_code_game_code_key unique (employee_code, game_code);

-- set an initial code for the existing game_state row, and backfill existing players to it
update game_state set game_code = upper(substr(md5(random()::text), 1, 6)) where game_code is null;
update players set game_code = (select game_code from game_state where id = 1) where game_code is null;
