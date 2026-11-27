-- Một nguồn duy nhất cho danh sách trường hồ sơ, giới hạn tần suất lưu trong database
-- (dùng chung cho mọi instance) và hạn mức trích xuất OpenAI theo không gian.
begin;

create or replace function dns_private.profile_fields() returns text[]
language sql immutable set search_path='' as $$
  select array['name','role','company','bio','skills','experience','projects','goals','contact','avatar']
$$;

create table if not exists dns_private.rate_events (
  bucket text not null,
  at timestamptz not null default now()
);
alter table dns_private.rate_events enable row level security;
create index if not exists dns_rate_bucket on dns_private.rate_events(bucket, at);

-- Ghi nhận một lượt dùng; báo lỗi khi bucket đã đủ p_max lượt trong p_window.
create or replace function dns_private.take(p_bucket text, p_max integer, p_window interval) returns void
language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtext('dns_rate:' || p_bucket));
  delete from dns_private.rate_events where bucket = p_bucket and at < now() - p_window;
  if random() < 0.02 then delete from dns_private.rate_events where at < now() - interval '1 day'; end if;
  if (select count(*) from dns_private.rate_events where bucket = p_bucket) >= p_max then
    raise exception 'Bạn thao tác quá nhanh. Hãy thử lại sau ít phút.' using errcode = 'PT429';
  end if;
  insert into dns_private.rate_events(bucket) values (p_bucket);
end $$;

-- Mã băm địa chỉ IP do cổng API của Supabase chuyển tiếp; không lưu IP gốc.
create or replace function dns_private.client_bucket() returns text
language plpgsql stable set search_path='' as $$
declare h json; ip text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then h := null;
  end;
  ip := coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', trim(split_part(h->>'x-forwarded-for', ',', 1)));
  return 'ip:' || encode(sha256(convert_to(coalesce(nullif(ip, ''), 'unknown'), 'UTF8')), 'hex');
end $$;

create or replace function public.dns_save(p_key text,p_id uuid,p_revision integer,p_draft jsonb,p_sources jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare own bytea := dns_private.owner_hash(p_key); found_id uuid; client text := dns_private.client_bucket();
begin
  if jsonb_typeof(p_draft) is distinct from 'object' or jsonb_typeof(p_sources) is distinct from 'array'
     or length(trim(coalesce(p_draft->>'name',''))) not between 1 and 120
     or octet_length(p_draft::text)>60000 or octet_length(p_sources::text)>500000
     or jsonb_array_length(p_sources)>8 then raise exception 'Dữ liệu hồ sơ vượt giới hạn hoặc thiếu tên'; end if;
  if exists(select 1 from jsonb_each(p_draft) f where f.key <> all(dns_private.profile_fields()) or jsonb_typeof(f.value)<>'string') then raise exception 'Trường hồ sơ không hợp lệ'; end if;
  if exists(select 1 from jsonb_array_elements(p_sources) s where jsonb_typeof(s)<>'object' or jsonb_typeof(s->'text') is distinct from 'string' or jsonb_typeof(s->'label') is distinct from 'string') then raise exception 'Nguồn không hợp lệ'; end if;
  perform dns_private.take('save:' || client, 120, interval '1 hour');
  if p_id is null then
    perform dns_private.take('create:' || client, 20, interval '1 hour');
    perform dns_private.take('create:all', 400, interval '1 hour');
    perform pg_advisory_xact_lock(hashtext(encode(own,'hex')));
    if (select count(*) from dns_private.profiles where owner_hash=own)>=25 then raise exception 'Mỗi không gian chứa tối đa 25 hồ sơ'; end if;
    insert into dns_private.profiles(owner_hash,draft,sources) values(own,p_draft,p_sources) returning id into found_id;
  else
    update dns_private.profiles set draft=p_draft,sources=p_sources,revision=revision+1,updated_at=now()
    where id=p_id and owner_hash=own and revision=p_revision returning id into found_id;
    if found_id is null then raise exception 'Hồ sơ đã thay đổi hoặc không có quyền truy cập. Hãy mở lại hồ sơ.'; end if;
  end if;
  return public.dns_read(p_key,found_id);
end $$;

create or replace function public.dns_share(p_key text,p_id uuid,p_revision integer,p_fields text[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare found_id uuid; snap jsonb;
begin
  if p_fields is not null then
    if not ('name'=any(p_fields)) or not p_fields <@ dns_private.profile_fields() then raise exception 'Hãy chọn tên và các mục muốn công bố'; end if;
    select jsonb_object_agg(k,v) into snap from dns_private.profiles p cross join lateral jsonb_each(p.draft) f(k,v)
    where p.id=p_id and p.owner_hash=dns_private.owner_hash(p_key) and k=any(p_fields);
  end if;
  update dns_private.profiles set published=snap,share_id=case when snap is null then null else coalesce(share_id,gen_random_uuid()) end,
    revision=revision+1,updated_at=now() where id=p_id and revision=p_revision and owner_hash=dns_private.owner_hash(p_key) returning id into found_id;
  if found_id is null then raise exception 'Hồ sơ đã thay đổi hoặc không có quyền truy cập. Hãy mở lại hồ sơ.'; end if;
  return public.dns_read(p_key,found_id);
end $$;

-- Chỉ Edge Function (service_role) được gọi. Khóa OpenAI dùng chung cho mọi không gian nên giới hạn
-- theo không gian (p_hash), theo IP đã băm (p_client) và trần toàn hệ thống để chặn chi phí.
create or replace function public.dns_ai_quota(p_hash text, p_client text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' or p_client is null or p_client !~ '^[0-9a-f]{64}$' then
    raise exception 'Mã băm không hợp lệ';
  end if;
  perform dns_private.take('ai:burst:' || p_hash, 1, interval '5 seconds');
  perform dns_private.take('ai:' || p_hash, 20, interval '1 hour');
  perform dns_private.take('ai:ip:' || p_client, 30, interval '1 hour');
  perform dns_private.take('ai:all', 300, interval '1 day');
  return true;
end $$;

revoke all on all tables in schema dns_private from public, anon, authenticated;
revoke all on function dns_private.profile_fields(), dns_private.take(text,integer,interval), dns_private.client_bucket() from public;
revoke all on function public.dns_ai_quota(text,text) from public, anon, authenticated;
grant execute on function public.dns_ai_quota(text,text) to service_role;
commit;
