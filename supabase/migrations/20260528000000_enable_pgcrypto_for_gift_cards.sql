create extension if not exists pgcrypto with schema extensions;

create or replace function public.gen_random_bytes(byte_length integer)
returns bytea
language sql
stable
as $$
  select extensions.gen_random_bytes(byte_length)
$$;

create or replace function public.generate_secure_token(byte_length integer default 16)
returns text
language sql
stable
as $$
  select encode(public.gen_random_bytes(byte_length), 'hex')
$$;

comment on function public.generate_secure_token(integer)
  is 'Generates hex tokens for workflows such as gift-card public tokens using pgcrypto.';
