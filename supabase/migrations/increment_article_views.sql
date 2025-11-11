-- Create RPC function to increment article views safely
-- Uses security definer to bypass RLS while enforcing published check
-- Minimal, no table renames or schema changes beyond function creation

create or replace function public.increment_article_views(
  target_article_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := null;
begin
  -- Increment views only for published articles
  update public.articles
  set total_views = coalesce(total_views, 0) + 1,
      updated_at = now()
  where id = target_article_id
    and published = true
  returning total_views into v_total;

  -- If no row was updated (e.g., not published), return current value or 0
  if v_total is null then
    select coalesce(total_views, 0) into v_total from public.articles where id = target_article_id;
    if v_total is null then
      v_total := 0;
    end if;
  end if;

  return v_total;
end;
$$;

-- Grant execute to anon and authenticated so public route can call it
grant execute on function public.increment_article_views(uuid) to anon, authenticated;