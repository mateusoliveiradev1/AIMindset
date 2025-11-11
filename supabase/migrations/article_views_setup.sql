-- Create article_views table for aggregated tracking (non-breaking addition)
create table if not exists public.article_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  total_views integer not null default 0,
  last_viewed_at timestamptz
);

-- Ensure one row per article for aggregation
create unique index if not exists article_views_article_id_key on public.article_views (article_id);

-- Replace RPC to also upsert into article_views and run with definer
create or replace function public.increment_article_views(target_article_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_total integer;
begin
  -- Increment on articles only when published
  update public.articles
  set total_views = coalesce(total_views, 0) + 1
  where id = target_article_id and published = true
  returning total_views into v_new_total;

  -- If not updated (unpublished or not found), return null
  if v_new_total is null then
    return null;
  end if;

  -- Upsert into aggregation table
  insert into public.article_views (article_id, total_views, last_viewed_at)
  values (target_article_id, 1, now())
  on conflict (article_id)
  do update set
    total_views = public.article_views.total_views + 1,
    last_viewed_at = now();

  return v_new_total;
end;
$$;

-- Grant execution to anon and authenticated (idempotent)
grant execute on function public.increment_article_views(uuid) to anon, authenticated;