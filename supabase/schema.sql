-- RentHood MVP persistence for Render (or any Node host).
-- Run this once in the Supabase SQL editor.
--
-- Design choice:
--   * Metadata and bookings live in a single JSONB state document. This is the
--     cheapest way to get durable shared state for a small beta without
--     designing a normalized schema before the product settles.
--   * Listing photos are uploaded to Supabase Storage, not base64-inlined in
--     the database. The database only stores their public URLs.

create table if not exists public.renthood_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint renthood_state_data_is_object check (jsonb_typeof(data) = 'object')
);

-- Only the server's service-role key touches this table. No anon policies.
alter table public.renthood_state enable row level security;

insert into public.renthood_state (id, data)
values (
  'main',
  '{"listings": [], "orders": [], "bookings": []}'::jsonb
)
on conflict (id) do nothing;

-- Public read is intentional: these are marketplace listing photos.
-- Uploads/deletes are server-side with the service-role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'renthood-listing-images',
  'renthood-listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read RentHood listing images" on storage.objects;
create policy "Public read RentHood listing images"
on storage.objects
for select
to public
using (bucket_id = 'renthood-listing-images');
