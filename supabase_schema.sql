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

-- Create users table for admin access
create table users (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  password text not null,
  is_admin boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default admin user (password: admin123)
insert into users (username, password, is_admin)
values ('admin', 'admin123', true);

-- Enable Row Level Security (RLS)
alter table fields enable row level security;
alter table players enable row level security;
alter table events enable row level security;
alter table users enable row level security;

-- Create policies (Allow public access for now for simplicity, restrict in production)
create policy "Public fields access" on fields for all using (true);
create policy "Public players access" on players for all using (true);
create policy "Public events access" on events for all using (true);
create policy "Public users access" on users for all using (true);
