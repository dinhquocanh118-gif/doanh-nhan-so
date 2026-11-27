begin;
create or replace function public.dns_save(p_key text,p_id uuid,p_revision integer,p_draft jsonb,p_sources jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare own bytea := dns_private.owner_hash(p_key); found_id uuid;
begin
  if jsonb_typeof(p_draft) is distinct from 'object' or jsonb_typeof(p_sources) is distinct from 'array'
     or length(trim(coalesce(p_draft->>'name',''))) not between 1 and 120
     or octet_length(p_draft::text)>60000 or octet_length(p_sources::text)>500000
     or jsonb_array_length(p_sources)>8 then raise exception 'Dữ liệu hồ sơ vượt giới hạn hoặc thiếu tên'; end if;
  if exists(select 1 from jsonb_each(p_draft) f where f.key not in ('name','role','company','bio','skills','experience','projects','goals','contact','avatar') or jsonb_typeof(f.value)<>'string') then raise exception 'Trường hồ sơ không hợp lệ'; end if;
  if exists(select 1 from jsonb_array_elements(p_sources) s where jsonb_typeof(s)<>'object' or jsonb_typeof(s->'text') is distinct from 'string' or jsonb_typeof(s->'label') is distinct from 'string') then raise exception 'Nguồn không hợp lệ'; end if;
  if p_id is null then
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
    if not ('name'=any(p_fields)) or not p_fields <@ array['name','role','company','bio','skills','experience','projects','goals','contact','avatar'] then raise exception 'Hãy chọn tên và các mục muốn công bố'; end if;
    select jsonb_object_agg(k,v) into snap from dns_private.profiles p cross join lateral jsonb_each(p.draft) f(k,v)
    where p.id=p_id and p.owner_hash=dns_private.owner_hash(p_key) and k=any(p_fields);
  end if;
  update dns_private.profiles set published=snap,share_id=case when snap is null then null else coalesce(share_id,gen_random_uuid()) end,
    revision=revision+1,updated_at=now() where id=p_id and revision=p_revision and owner_hash=dns_private.owner_hash(p_key) returning id into found_id;
  if found_id is null then raise exception 'Hồ sơ đã thay đổi hoặc không có quyền truy cập. Hãy mở lại hồ sơ.'; end if;
  return public.dns_read(p_key,found_id);
end $$;
commit;
