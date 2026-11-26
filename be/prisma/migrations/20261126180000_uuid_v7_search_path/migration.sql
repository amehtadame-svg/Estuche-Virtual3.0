-- Compatible con Prisma (search_path=public) y Supabase (pgcrypto en extensions).
-- gen_random_uuid es nativo de PostgreSQL >= 13: no depende del esquema pgcrypto.
-- Reemplaza la implementación, sin reescribir IDs ni filas existentes.
CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SET search_path = pg_catalog
AS $$
DECLARE
  ts bytea;
  bytes bytea;
BEGIN
  ts := substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
  bytes := ts || substring(uuid_send(gen_random_uuid()) FROM 7 FOR 10);
  bytes := set_byte(bytes, 6, (get_byte(bytes, 6) & 15) | 112);
  bytes := set_byte(bytes, 8, (get_byte(bytes, 8) & 63) | 128);
  RETURN encode(bytes, 'hex')::uuid;
END;
$$;
