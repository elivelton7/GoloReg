-- Create fields table
create table fields (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  description text not null,
  password text not null default '9999',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create players table
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  roles text[] not null,
  field_id uuid references fields(id) not null,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create events table
create table events (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) not null,
  type text not null check (type in ('GOAL', 'ASSIST', 'SAVE', 'FOUL')),
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table fields enable row level security;
alter table players enable row level security;
alter table events enable row level security;

-- Create policies
create policy "Public contacts access" on contacts for all using (true);
