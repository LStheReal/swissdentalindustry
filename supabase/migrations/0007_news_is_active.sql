alter table public.news
  add column if not exists is_active boolean not null default true;

update public.news
set is_active = true
where is_active is null;

drop policy if exists news_public_read on public.news;
create policy news_public_read on public.news
  for select using (is_published and is_active);
