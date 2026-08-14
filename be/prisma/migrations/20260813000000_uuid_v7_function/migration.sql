-- Migración 1/2: generador de UUID v7
-- Se ejecuta PRIMERO para que las tablas puedan usar uuid_generate_v7() en sus DEFAULT.
-- Idempotente; se re-aplica solo con `prisma migrate reset`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  ts    bytea;
  bytes bytea;
BEGIN
  -- marca de tiempo Unix en milisegundos (48 bits)
  ts    := substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
  -- 74 bits aleatorios
  bytes := ts || gen_random_bytes(10);

  -- versión 7 (4 bits superiores del byte 6)
  bytes := set_byte(bytes, 6, (b'0111' || get_byte(bytes, 6)::bit(4))::bit(8)::int);

  -- variante 10xx (2 bits superiores del byte 8)
  bytes := set_byte(bytes, 8, (b'10'   || get_byte(bytes, 8)::bit(6))::bit(8)::int);

  RETURN encode(bytes, 'hex')::uuid;
END;
$$;
