-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade,
  email text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  subscription_id text,
  subscription_status text,
  current_period_end timestamp with time zone,
  words_remaining integer not null default 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to call handle_new_user function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column(); 