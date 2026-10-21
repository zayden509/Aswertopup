-- =====================================================================
-- Aswer Top Up — baz done Supabase
--
-- Kijan pou itilize l: Supabase → SQL Editor → New query → kole tout
-- fichye sa a → Run. Ou ka relanse l san danje si w modifye l.
--
-- Prensip sekirite: kliyan yo ka LI pwòp done yo sèlman. Tout sa ki touche
-- kòb (achte, depo, transfè, ranbousman) pase nan fonksyon sèvè ki anba yo
-- (SECURITY DEFINER), ki tcheke pri a ak solde a nan baz done a, jamè sa
-- navigatè a voye.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TAB YO
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  wallet_code text unique not null,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  total_spent numeric(12, 2) not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Pri yo rete isit la: se sèlman sa sèvè a itilize pou fè kliyan an peye
create table if not exists public.packages (
  id text primary key,
  product_name text not null,
  label text not null,
  price numeric(12, 2) not null check (price > 0),
  needs_id boolean not null default false,
  available boolean not null default true,
  sort int not null default 0
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id text not null references public.packages (id),
  product_name text not null,
  package_label text not null,
  price numeric(12, 2) not null,
  player_id text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'refused')),
  delivery_code text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('moncash', 'natcash')),
  reference text not null,
  sender_phone text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'refused')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Menm nimewo tranzaksyon an pa ka sèvi de fwa
  unique (method, reference)
);
create index if not exists deposits_user_idx on public.deposits (user_id, created_at desc);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists transfers_from_idx on public.transfers (from_user, created_at desc);
create index if not exists transfers_to_idx on public.transfers (to_user, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info' check (kind in ('order', 'deposit', 'transfer', 'info')),
  title text not null,
  body text,
  ref text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. ZOUTI
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.random_code(len int)
returns text
language sql
volatile
as $$
  -- San 0/O/1/I pou kliyan yo pa konfonn yo
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, len);
$$;

-- 1550 -> "1 550 HTG", 1059.5 -> "1 059,50 HTG"
create or replace function public.format_htg(amount numeric)
returns text
language sql
immutable
as $$
  select case
    when amount = trunc(amount) then replace(to_char(amount, 'FM999,999,990'), ',', ' ')
    else replace(replace(replace(to_char(amount, 'FM999,999,990.00'), ',', ' '), '.', ','), ' ,', ',')
  end || ' HTG';
$$;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_ref text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, ref) values (p_user, p_kind, p_title, p_body, p_ref);
$$;

-- ---------------------------------------------------------------------
-- 3. NOUVO KLIYAN: kreye pwofil li otomatikman
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code := public.random_code(8);
    exit when not exists (select 1 from public.profiles where wallet_code = code);
  end loop;

  insert into public.profiles (id, email, full_name, wallet_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    code
  )
  on conflict (id) do nothing;

  perform public.notify(new.id, 'info', 'Byenvini sou Aswer Top Up 🎉',
    'Ajoute kòb nan Wallet ou ak MonCash oswa NatCash, epi achte an kèk segonn.', null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. NOTIFIKASYON OTOMATIK lè yon kòmand oswa yon depo chanje
-- ---------------------------------------------------------------------

create or replace function public.order_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  what text := new.product_name || ' · ' || new.package_label;
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.user_id, 'order', 'Kòmand ' || new.code || ' resevwa',
      what || ' (' || public.format_htg(new.price) || '). N ap trete l kounye a.', new.code);
  elsif new.status is distinct from old.status then
    if new.status = 'processing' then
      perform public.notify(new.user_id, 'order', 'Kòmand ' || new.code || ' an kou',
        'N ap trete ' || what || '.', new.code);
    elsif new.status = 'delivered' then
      perform public.notify(new.user_id, 'order', 'Kòmand ' || new.code || ' livre ✅',
        what || case when new.delivery_code is not null then '. Kòd ou a nan Historique.' else ' sou kont ou.' end, new.code);
    elsif new.status = 'refused' then
      perform public.notify(new.user_id, 'order', 'Kòmand ' || new.code || ' refize',
        public.format_htg(new.price) || ' retounen nan Wallet ou.' || coalesce(' ' || new.admin_note, ''), new.code);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify on public.orders;
create trigger orders_notify
  after insert or update of status on public.orders
  for each row execute function public.order_notifications();

create or replace function public.deposit_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.user_id, 'deposit', 'Depo ' || public.format_htg(new.amount) || ' an atant',
      'N ap verifye peman ' || case new.method when 'moncash' then 'MonCash' else 'NatCash' end
        || ' ou a (' || new.reference || ').', new.id::text);
  elsif new.status is distinct from old.status then
    if new.status = 'completed' then
      perform public.notify(new.user_id, 'deposit', 'Depo ' || public.format_htg(new.amount) || ' konfime ✅',
        'Kòb la nan Wallet ou kounye a.', new.id::text);
    elsif new.status = 'refused' then
      perform public.notify(new.user_id, 'deposit', 'Depo ' || public.format_htg(new.amount) || ' refize',
        coalesce(new.admin_note, 'Nou pa jwenn peman sa a. Kontakte nou sou WhatsApp.'), new.id::text);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists deposits_notify on public.deposits;
create trigger deposits_notify
  after insert or update of status on public.deposits
  for each row execute function public.deposit_notifications();

-- ---------------------------------------------------------------------
-- 5. AKSYON KLIYAN YO
-- ---------------------------------------------------------------------

create or replace function public.place_order(p_package_id text, p_player_id text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
  pkg public.packages;
  pid text := nullif(trim(p_player_id), '');
  new_code text;
  result public.orders;
begin
  select * into me from public.profiles where id = auth.uid() for update;
  if me.id is null then
    raise exception 'Konekte anvan ou achte.';
  end if;

  select * into pkg from public.packages where id = p_package_id;
  if pkg.id is null or not pkg.available then
    raise exception 'Pake sa a pa disponib.';
  end if;
  if pid is not null and pid !~ '^[0-9]{6,15}$' then
    raise exception 'Player ID a dwe gen ant 6 ak 15 chif.';
  end if;
  if pkg.needs_id and pid is null then
    raise exception 'Mete Player ID ou pou pake sa a.';
  end if;
  if me.balance < pkg.price then
    raise exception 'Solde ou pa ase. Ajoute kòb nan Wallet ou.';
  end if;

  update public.profiles
  set balance = balance - pkg.price, total_spent = total_spent + pkg.price
  where id = me.id;

  loop
    new_code := 'AS-' || public.random_code(6);
    exit when not exists (select 1 from public.orders where code = new_code);
  end loop;

  insert into public.orders (code, user_id, package_id, product_name, package_label, price, player_id)
  values (new_code, me.id, pkg.id, pkg.product_name, pkg.label, pkg.price, pid)
  returning * into result;

  return result;
end;
$$;

create or replace function public.request_deposit(
  p_amount numeric,
  p_method text,
  p_reference text,
  p_sender_phone text default null
)
returns public.deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  ref text := upper(trim(p_reference));
  result public.deposits;
begin
  if auth.uid() is null then
    raise exception 'Konekte anvan ou fè yon depo.';
  end if;
  if p_amount is null or p_amount < 50 or p_amount > 100000 then
    raise exception 'Montan an dwe ant 50 ak 100 000 HTG.';
  end if;
  if p_method not in ('moncash', 'natcash') then
    raise exception 'Mòd peman sa a pa egziste.';
  end if;
  if ref is null or length(ref) < 4 then
    raise exception 'Mete nimewo tranzaksyon an (ID tranzaksyon an).';
  end if;
  if exists (select 1 from public.deposits where method = p_method and reference = ref) then
    raise exception 'Nimewo tranzaksyon sa a deja itilize.';
  end if;
  -- Pa plis pase 5 depo an atant alafwa pou yon kliyan
  if (select count(*) from public.deposits where user_id = auth.uid() and status = 'pending') >= 5 then
    raise exception 'Ou gen twòp depo an atant. Tann nou verifye yo.';
  end if;

  insert into public.deposits (user_id, amount, method, reference, sender_phone)
  values (auth.uid(), round(p_amount, 2), p_method, ref, nullif(trim(p_sender_phone), ''))
  returning * into result;
  return result;
end;
$$;

-- Montre non moun k ap resevwa a anvan transfè a, san bay imèl li
create or replace function public.lookup_wallet(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(full_name, ''), regexp_replace(split_part(email, '@', 1), '(^.{2}).*', '\1***'))
  from public.profiles
  where wallet_code = upper(trim(p_code)) and auth.uid() is not null;
$$;

create or replace function public.transfer_funds(p_to_code text, p_amount numeric)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  sender public.profiles;
  receiver public.profiles;
  result public.transfers;
begin
  if auth.uid() is null then
    raise exception 'Konekte anvan ou voye kòb.';
  end if;
  if p_amount is null or p_amount < 10 then
    raise exception 'Montan minimòm lan se 10 HTG.';
  end if;

  select * into receiver from public.profiles where wallet_code = upper(trim(p_to_code));
  if receiver.id is null then
    raise exception 'Nou pa jwenn ASWER-ID sa a.';
  end if;
  if receiver.id = auth.uid() then
    raise exception 'Ou pa ka voye kòb ba tèt ou.';
  end if;

  -- Bloke de pwofil yo nan menm lòd la toujou pou evite blokaj
  perform 1 from public.profiles where id in (auth.uid(), receiver.id) order by id for update;
  select * into sender from public.profiles where id = auth.uid();
  if sender.balance < p_amount then
    raise exception 'Solde ou pa ase.';
  end if;

  update public.profiles set balance = balance - round(p_amount, 2) where id = sender.id;
  update public.profiles set balance = balance + round(p_amount, 2) where id = receiver.id;

  insert into public.transfers (from_user, to_user, amount)
  values (sender.id, receiver.id, round(p_amount, 2))
  returning * into result;

  perform public.notify(sender.id, 'transfer', 'Ou voye ' || public.format_htg(result.amount),
    'Bay ' || coalesce(nullif(receiver.full_name, '') || ' (' || receiver.wallet_code || ')', 'ASWER-ID ' || receiver.wallet_code) || '.',
    result.id::text);
  perform public.notify(receiver.id, 'transfer', 'Ou resevwa ' || public.format_htg(result.amount),
    'Soti nan ' || coalesce(nullif(sender.full_name, '') || ' (' || sender.wallet_code || ')', 'ASWER-ID ' || sender.wallet_code) || '.',
    result.id::text);
  return result;
end;
$$;

create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
$$;

create or replace function public.update_my_name(p_name text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set full_name = nullif(left(trim(p_name), 60), '') where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 6. AKSYON ADMIN YO
-- ---------------------------------------------------------------------

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status text,
  p_delivery_code text default null,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  if not public.is_admin() then
    raise exception 'Ou pa admin.';
  end if;
  if p_status not in ('pending', 'processing', 'delivered', 'refused') then
    raise exception 'Estati sa a pa egziste.';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then
    raise exception 'Kòmand lan pa egziste.';
  end if;
  if o.status = 'refused' then
    raise exception 'Kòmand sa a deja refize e ranbouse.';
  end if;

  -- Refize = ranbouse kliyan an otomatikman
  if p_status = 'refused' then
    update public.profiles
    set balance = balance + o.price, total_spent = greatest(0, total_spent - o.price)
    where id = o.user_id;
  end if;

  update public.orders
  set status = p_status,
      delivery_code = coalesce(nullif(trim(p_delivery_code), ''), delivery_code),
      admin_note = coalesce(nullif(trim(p_note), ''), admin_note),
      updated_at = now()
  where id = o.id
  returning * into o;
  return o;
end;
$$;

create or replace function public.admin_review_deposit(p_deposit_id uuid, p_approve boolean, p_note text default null)
returns public.deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.deposits;
begin
  if not public.is_admin() then
    raise exception 'Ou pa admin.';
  end if;

  select * into d from public.deposits where id = p_deposit_id for update;
  if d.id is null then
    raise exception 'Depo a pa egziste.';
  end if;
  if d.status <> 'pending' then
    raise exception 'Depo sa a deja trete.';
  end if;

  if p_approve then
    update public.profiles set balance = balance + d.amount where id = d.user_id;
  end if;

  update public.deposits
  set status = case when p_approve then 'completed' else 'refused' end,
      admin_note = nullif(trim(p_note), ''),
      updated_at = now()
  where id = d.id
  returning * into d;
  return d;
end;
$$;

create or replace function public.admin_set_package(p_id text, p_price numeric, p_available boolean)
returns public.packages
language plpgsql
security definer
set search_path = public
as $$
declare
  pkg public.packages;
begin
  if not public.is_admin() then
    raise exception 'Ou pa admin.';
  end if;
  if p_price is null or p_price <= 0 then
    raise exception 'Pri a dwe pi gran pase 0.';
  end if;
  update public.packages set price = round(p_price, 2), available = p_available where id = p_id returning * into pkg;
  if pkg.id is null then
    raise exception 'Pake sa a pa egziste.';
  end if;
  return pkg;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. DWA (RLS): chak kliyan wè pwòp done li sèlman
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.orders enable row level security;
alter table public.deposits enable row level security;
alter table public.transfers enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "packages: read all" on public.packages;
create policy "packages: read all" on public.packages
  for select using (true);

drop policy if exists "orders: read own" on public.orders;
create policy "orders: read own" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "deposits: read own" on public.deposits;
create policy "deposits: read own" on public.deposits
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "transfers: read own" on public.transfers;
create policy "transfers: read own" on public.transfers
  for select using (from_user = auth.uid() or to_user = auth.uid() or public.is_admin());

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications
  for select using (user_id = auth.uid());

-- Pèsonn pa ka ekri dirèkteman nan tab yo depi navigatè a: se fonksyon yo sèlman
revoke insert, update, delete on public.profiles, public.packages, public.orders,
  public.deposits, public.transfers, public.notifications from anon, authenticated;

-- Fonksyon entèn yo: pèsonn pa ka rele yo depi navigatè a (Supabase bay
-- anon/authenticated dwa sou tout fonksyon nouvo, se pou sa nou retire yo)
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.order_notifications() from public, anon, authenticated;
revoke execute on function public.deposit_notifications() from public, anon, authenticated;
revoke execute on function public.random_code(int) from public, anon, authenticated;

-- Fonksyon kliyan yo: sèlman pou moun ki konekte
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.place_order(text, text)',
    'public.request_deposit(numeric, text, text, text)',
    'public.lookup_wallet(text)',
    'public.transfer_funds(text, numeric)',
    'public.mark_notifications_read()',
    'public.update_my_name(text)',
    'public.admin_update_order(uuid, text, text, text)',
    'public.admin_review_deposit(uuid, boolean, text)',
    'public.admin_set_package(text, numeric, boolean)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. TAN REYÈL: sit la resevwa chanjman yo touswit (solde, kòmand, notifikasyon)
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['profiles', 'orders', 'deposits', 'notifications'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. PRI YO (chanje yo isit la oswa nan paj Admin sou sit la)
-- ---------------------------------------------------------------------

insert into public.packages (id, product_name, label, price, needs_id, sort) values
  ('ff-100',     'Free Fire Pin USA/LATAM', '100 + BONUS 10',       155,  false, 1),
  ('ff-310',     'Free Fire Pin USA/LATAM', '310 + BONUS 31',       460,  false, 2),
  ('ff-1060',    'Free Fire Pin USA/LATAM', '1060 + BONUS 106',     1550, false, 3),
  ('ff-2180',    'Free Fire Pin USA/LATAM', '2180 + BONUS 218',     3100, false, 4),
  ('ff-5600',    'Free Fire Pin USA/LATAM', '5600 + BONUS 560',     7500, false, 5),
  ('ff-semaine', 'Abonnement Free Fire',    'SEMAINE',              350,  true,  10),
  ('ff-mois',    'Abonnement Free Fire',    'MOIS',                 1800, true,  11),
  ('ff-booyah',  'Abonnement Free Fire',    'BOOYAH PASS PAR ID',   600,  true,  12),
  ('ff-levelup', 'Abonnement Free Fire',    'LEVEL UP PASS 1355💎', 900,  true,  13)
on conflict (id) do nothing;

-- =====================================================================
-- APRE: pou w vin admin, kreye kont ou sou sit la, epi lanse:
--   update public.profiles set is_admin = true where email = 'imel-ou@gmail.com';
-- =====================================================================
