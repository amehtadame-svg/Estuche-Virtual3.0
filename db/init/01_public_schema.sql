-- ============================================================
-- Esquema `public` de Estuche Virtual (migrado desde Supabase)
-- Generado automáticamente desde supabase_completo.sql
-- PostgreSQL 17 (Docker). Contiene: schema + datos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- --- TYPE: DespatchStatus ---
CREATE TYPE public."DespatchStatus" AS ENUM (
    'in_transit',
    'delivered',
    'returned',
    'canceled'
);


--

-- --- TYPE: MovementType ---
CREATE TYPE public."MovementType" AS ENUM (
    'in',
    'out',
    'adjustment'
);


--

-- --- TYPE: OrderStatus ---
CREATE TYPE public."OrderStatus" AS ENUM (
    'pending',
    'paid',
    'preparing',
    'shipped',
    'delivered',
    'canceled',
    'returned'
);


--

-- --- TYPE: PaymentStatus ---
CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'refunded'
);


--

-- --- TYPE: PromotionalCodeType ---
CREATE TYPE public."PromotionalCodeType" AS ENUM (
    'percentage',
    'fixed'
);


--

-- --- TYPE: ReceiptStatus ---
CREATE TYPE public."ReceiptStatus" AS ENUM (
    'pending',
    'paid',
    'partial',
    'overdue',
    'voided'
);


--

-- --- TYPE: ReturnStatus ---
CREATE TYPE public."ReturnStatus" AS ENUM (
    'requested',
    'approved',
    'rejected',
    'refunded'
);


--

-- --- TYPE: Role ---
CREATE TYPE public."Role" AS ENUM (
    'client',
    'employee',
    'delivery',
    'admin',
    'superadmin'
);


--

-- --- FUNCTION: uuid_generate_v7() ---
CREATE FUNCTION public.uuid_generate_v7() RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE ts bytea; bytes bytea;
    BEGIN
      ts := substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
      bytes := ts || gen_random_bytes(10);
      bytes := set_byte(bytes, 6, (b'0111' || get_byte(bytes, 6)::bit(4))::bit(8)::int);
      bytes := set_byte(bytes, 8, (b'10'   || get_byte(bytes, 8)::bit(6))::bit(8)::int);
      RETURN encode(bytes, 'hex')::uuid;
    END; $$;


--

-- --- TABLE: categories ---
CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(150) NOT NULL,
    description character varying(500)
);


--

-- --- TABLE: delivery_addresses ---
CREATE TABLE public.delivery_addresses (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid NOT NULL,
    contact_name character varying(150),
    phone character varying(30),
    address character varying(255) NOT NULL,
    city character varying(150),
    state character varying(150),
    is_primary boolean DEFAULT false
);


--

-- --- TABLE: despatches ---
CREATE TABLE public.despatches (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    order_id uuid NOT NULL,
    ship_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    delivered_at timestamp(3) without time zone,
    status public."DespatchStatus" DEFAULT 'in_transit'::public."DespatchStatus" NOT NULL,
    driver_id uuid,
    address character varying(255)
);


--

-- --- TABLE: inventory_movements ---
CREATE TABLE public.inventory_movements (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    product_id uuid NOT NULL,
    type public."MovementType" NOT NULL,
    quantity integer NOT NULL,
    reason character varying(500),
    user_id uuid,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: notifications ---
CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    message character varying(500) NOT NULL,
    type character varying(50) NOT NULL,
    is_read boolean DEFAULT false,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: order_details ---
CREATE TABLE public.order_details (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    subtotal numeric(14,2)
);


--

-- --- TABLE: orders ---
CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    customer_id uuid,
    driver_id uuid,
    promotional_code_id uuid,
    delivery_address_id uuid,
    order_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    total numeric(14,2) DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: payouts ---
CREATE TABLE public.payouts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    receipt_id uuid NOT NULL,
    user_id uuid NOT NULL,
    gateway character varying(50) NOT NULL,
    transaction_id character varying(255) NOT NULL,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    method character varying(50),
    amount numeric(14,2) NOT NULL,
    currency character varying(10) DEFAULT 'COP'::character varying NOT NULL,
    paid_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    confirmed_at timestamp(3) without time zone,
    gateway_token character varying(255)
);


--

-- --- TABLE: price_history ---
CREATE TABLE public.price_history (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    product_id uuid NOT NULL,
    previous_price numeric(14,2) NOT NULL,
    new_price numeric(14,2) NOT NULL,
    changed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid
);


--

-- --- TABLE: product_images ---
CREATE TABLE public.product_images (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    product_id uuid NOT NULL,
    url character varying(500) NOT NULL,
    name character varying(150),
    is_primary boolean DEFAULT false,
    sort_order integer DEFAULT 1
);


--

-- --- TABLE: products ---
CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(150) NOT NULL,
    description character varying(500),
    price numeric(14,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    stock_min integer DEFAULT 5 NOT NULL,
    category_id uuid,
    supplier_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- --- TABLE: promotional_codes ---
CREATE TABLE public.promotional_codes (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(500),
    type public."PromotionalCodeType" NOT NULL,
    value numeric(14,2) NOT NULL,
    min_purchase numeric(14,2) DEFAULT 0,
    start_date date NOT NULL,
    end_date date NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0,
    active boolean DEFAULT true,
    version integer DEFAULT 0 NOT NULL
);


--

-- --- TABLE: provider_categories ---
CREATE TABLE public.provider_categories (
    provider_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--

-- --- TABLE: providers ---
CREATE TABLE public.providers (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(30),
    email character varying(255),
    address character varying(255)
);


--

-- --- TABLE: receipt_items ---
CREATE TABLE public.receipt_items (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    receipt_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(14,2) NOT NULL,
    subtotal numeric(14,2)
);


--

-- --- TABLE: receipts ---
CREATE TABLE public.receipts (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    receipt_number integer NOT NULL,
    customer_id uuid,
    employee_id uuid,
    order_id uuid,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(14,2) DEFAULT 0 NOT NULL,
    payment_status public."ReceiptStatus" DEFAULT 'pending'::public."ReceiptStatus" NOT NULL
);


--

-- --- SEQUENCE: receipts_receipt_number_seq ---
CREATE SEQUENCE public.receipts_receipt_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--

-- --- SEQUENCE OWNED BY: receipts_receipt_number_seq ---
ALTER SEQUENCE public.receipts_receipt_number_seq OWNED BY public.receipts.receipt_number;


--

-- --- TABLE: reports ---
CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    date date NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    delivered_orders integer DEFAULT 0 NOT NULL,
    canceled_orders integer DEFAULT 0 NOT NULL,
    total_sold numeric(14,2) DEFAULT 0 NOT NULL,
    total_paid numeric(14,2) DEFAULT 0 NOT NULL,
    total_refunded numeric(14,2) DEFAULT 0 NOT NULL,
    products_sold integer DEFAULT 0 NOT NULL,
    new_customers integer DEFAULT 0 NOT NULL,
    generated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: returns ---
CREATE TABLE public.returns (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    reason character varying(500) NOT NULL,
    status public."ReturnStatus" DEFAULT 'requested'::public."ReturnStatus" NOT NULL,
    product_condition character varying(30) DEFAULT 'good'::character varying NOT NULL,
    refund numeric(14,2) DEFAULT 0,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: reviews ---
CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment character varying(1000),
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: security_events ---
CREATE TABLE public.security_events (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    ip character varying(45),
    user_agent character varying(255),
    detail jsonb,
    success boolean DEFAULT true NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- --- TABLE: shopping ---
CREATE TABLE public.shopping (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- TABLE: users ---
CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    password_updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    must_change_password boolean DEFAULT false NOT NULL,
    phone character varying(30),
    address character varying(255),
    role public."Role" DEFAULT 'client'::public."Role" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret character varying(255),
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp(3) without time zone,
    last_login timestamp(3) without time zone,
    data_consent_at timestamp(3) without time zone,
    deleted_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- --- TABLE: wishlist ---
CREATE TABLE public.wishlist (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--

-- --- DEFAULT: receipts receipt_number ---
ALTER TABLE ONLY public.receipts ALTER COLUMN receipt_number SET DEFAULT nextval('public.receipts_receipt_number_seq'::regclass);


--

-- --- TABLE DATA: categories ---
COPY public.categories (id, name, description) FROM stdin;
01a00219-b5cb-77f4-8f0b-dd8b1e74211b	Categoría 1	Descripción de la categoría 1
01a00219-b630-75c9-a6df-e0cfc85be1a4	Categoría 2	Descripción de la categoría 2
01a00219-b683-781b-9a79-f062bb7413a9	Categoría 3	Descripción de la categoría 3
01a00219-b6d5-7597-83a8-400ef1e95ce6	Categoría 4	Descripción de la categoría 4
01a00219-b728-7453-9594-09fff2dd869d	Categoría 5	Descripción de la categoría 5
01a00219-b77b-7f4e-94c6-88cb608fef33	Categoría 6	Descripción de la categoría 6
01a00219-b7cd-761b-8a8a-d11c28a5e514	Categoría 7	Descripción de la categoría 7
01a00219-b820-7506-b76c-ea765e2b8d47	Categoría 8	Descripción de la categoría 8
01a00219-b873-7264-a1b2-9fd4f9426c2b	Categoría 9	Descripción de la categoría 9
01a00219-b8c5-7296-b391-54da1f129616	Categoría 10	Descripción de la categoría 10
\.


--

-- --- TABLE DATA: delivery_addresses ---
COPY public.delivery_addresses (id, user_id, contact_name, phone, address, city, state, is_primary) FROM stdin;
01a00219-cbb9-7bb1-9633-5bfe027ab5ee	01a00219-c0f9-7e75-a64b-7590d4829a1d	Usuario Demo 1	+57 320 000 0000	Calle 1 # 30-40	Bogotá	Cundinamarca	t
01a00219-cc13-7334-b46f-a79b6c8eb6f8	01a00219-c152-79e2-91e3-02c87876d483	Usuario Demo 2	+57 320 000 0000	Calle 2 # 30-40	Bogotá	Cundinamarca	f
01a00219-cc66-7fc9-a399-784635e2badf	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	Usuario Demo 3	+57 320 000 0000	Calle 3 # 30-40	Bogotá	Cundinamarca	f
01a00219-ccb9-736c-aa68-b334c15e1d7a	01a00219-c1f8-7ee0-ac34-1bb3843daff0	Usuario Demo 4	+57 320 000 0000	Calle 4 # 30-40	Bogotá	Cundinamarca	f
01a00219-cd0c-73b5-8db3-615db2e3b652	01a00219-c24b-708d-b2ee-b6395488d938	Usuario Demo 5	+57 320 000 0000	Calle 5 # 30-40	Bogotá	Cundinamarca	f
01a00219-cd5e-7a71-a3b7-4e683c6d6e1a	01a00219-c29e-7f39-b4ba-f227c01445a4	Usuario Demo 6	+57 320 000 0000	Calle 6 # 30-40	Bogotá	Cundinamarca	f
01a00219-cdb1-730b-a571-24ef6199556a	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Usuario Demo 7	+57 320 000 0000	Calle 7 # 30-40	Bogotá	Cundinamarca	f
01a00219-ce04-7e37-b37d-a992a8bd4b79	01a00219-c344-7e01-9fea-947f6b87da21	Usuario Demo 8	+57 320 000 0000	Calle 8 # 30-40	Bogotá	Cundinamarca	f
01a00219-ce57-7294-aad6-827bb4a93fc9	01a00219-c397-7962-8987-d09685c40037	Usuario Demo 9	+57 320 000 0000	Calle 9 # 30-40	Bogotá	Cundinamarca	f
01a00219-ceaa-799e-b957-b82831d45d41	01a00219-c3ea-7ac8-af3f-25df88be36ab	Usuario Demo 10	+57 320 000 0000	Calle 10 # 30-40	Bogotá	Cundinamarca	f
\.


--

-- --- TABLE DATA: despatches ---
COPY public.despatches (id, order_id, ship_date, delivered_at, status, driver_id, address) FROM stdin;
01a00219-dda6-7c78-a4a7-ec473de778fd	01a00219-d67a-70c3-80c2-6c9b555fa512	2026-08-14 21:07:24.633	\N	in_transit	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Calle 1 # 50-60
01a00219-ddfb-7578-8395-1226ed0df26e	01a00219-d6d7-7290-ba0d-4b20849a6093	2026-08-14 21:07:24.8	2026-08-14 21:07:24.8	delivered	01a00219-c344-7e01-9fea-947f6b87da21	Calle 2 # 50-60
01a00219-de4e-795e-8558-0b3c5c0e45b2	01a00219-d72b-7b60-925c-ebb3e1ae0d26	2026-08-14 21:07:24.883	\N	returned	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Calle 3 # 50-60
01a00219-dea1-70f2-a809-d9d25b18fedf	01a00219-d77e-7a62-a374-e8ba67c17eb5	2026-08-14 21:07:24.966	2026-08-14 21:07:24.966	canceled	01a00219-c344-7e01-9fea-947f6b87da21	Calle 4 # 50-60
01a00219-def4-7302-8686-bbd971a5b84c	01a00219-d7d1-70a7-85a4-6029cf1415cb	2026-08-14 21:07:25.049	\N	in_transit	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Calle 5 # 50-60
01a00219-df48-75ce-83a2-f8984431d43d	01a00219-d824-7fff-a2f3-d351ab28b13b	2026-08-14 21:07:25.132	2026-08-14 21:07:25.132	delivered	01a00219-c344-7e01-9fea-947f6b87da21	Calle 6 # 50-60
01a00219-df9a-74ea-be0d-3f06c1495ddd	01a00219-d877-7c7d-9b2b-54c212d698d4	2026-08-14 21:07:25.215	\N	returned	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Calle 7 # 50-60
01a00219-dfed-7713-967d-f09f9b159606	01a00219-d8ca-7e0d-886b-9041e40e06d6	2026-08-14 21:07:25.298	2026-08-14 21:07:25.298	canceled	01a00219-c344-7e01-9fea-947f6b87da21	Calle 8 # 50-60
01a00219-e040-7ade-981f-56d4a94e48a0	01a00219-d91c-7a98-bba7-d887cd06e85e	2026-08-14 21:07:25.381	\N	in_transit	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Calle 9 # 50-60
01a00219-e093-7bc9-95a8-14a31601e519	01a00219-d96f-7f58-8543-9e1b970f6128	2026-08-14 21:07:25.464	2026-08-14 21:07:25.464	delivered	01a00219-c344-7e01-9fea-947f6b87da21	Calle 10 # 50-60
\.


--

-- --- TABLE DATA: inventory_movements ---
COPY public.inventory_movements (id, product_id, type, quantity, reason, user_id, date) FROM stdin;
01a00219-ec05-76c0-8449-2f67bfd067c3	01a00219-c48e-7df1-898e-200a951946d8	in	1	Movimiento demo 1	01a00219-c0f9-7e75-a64b-7590d4829a1d	2026-08-14 21:07:28.313
01a00219-ec5e-789d-897c-ffef8ccc6c57	01a00219-c4e7-7661-b482-cf51677f36e3	out	2	Movimiento demo 2	01a00219-c152-79e2-91e3-02c87876d483	2026-08-14 21:07:28.482
01a00219-ecb1-780d-b0a0-3ef23ad9078c	01a00219-c53a-7176-bfa4-f57104f80dcf	adjustment	3	Movimiento demo 3	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	2026-08-14 21:07:28.565
01a00219-ed55-7be7-823e-274307a9fcda	01a00219-c58d-79b0-936d-b27e31a7072a	in	4	Movimiento demo 4	01a00219-c1f8-7ee0-ac34-1bb3843daff0	2026-08-14 21:07:28.649
01a00219-eda9-705e-a3a2-25e1102f86dd	01a00219-c5e0-75fc-8a32-9c344969be98	out	5	Movimiento demo 5	01a00219-c24b-708d-b2ee-b6395488d938	2026-08-14 21:07:28.813
01a00219-edfc-72ad-a4a4-ced7bd03a74e	01a00219-c633-78e5-b21c-3e1ebeaa12a9	adjustment	6	Movimiento demo 6	01a00219-c29e-7f39-b4ba-f227c01445a4	2026-08-14 21:07:28.897
01a00219-ee4f-78d5-9b2a-6f04f69728a4	01a00219-c687-7efa-9e1a-605be946171d	in	7	Movimiento demo 7	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	2026-08-14 21:07:28.98
01a00219-eea1-7143-89d0-e05c01be0fa6	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	out	8	Movimiento demo 8	01a00219-c344-7e01-9fea-947f6b87da21	2026-08-14 21:07:29.062
01a00219-eef5-7387-b937-c096e57d0d65	01a00219-c72d-712c-b41c-f0209fa72d96	adjustment	9	Movimiento demo 9	01a00219-c397-7962-8987-d09685c40037	2026-08-14 21:07:29.145
01a00219-ef48-7832-8e54-1063e65d6902	01a00219-c780-7ac4-9a0c-4d49adde5342	in	10	Movimiento demo 10	01a00219-c3ea-7ac8-af3f-25df88be36ab	2026-08-14 21:07:29.229
\.


--

-- --- TABLE DATA: notifications ---
COPY public.notifications (id, user_id, title, message, type, is_read, date) FROM stdin;
01a0021a-155b-7144-9c47-0a4c379802ed	01a00219-c0f9-7e75-a64b-7590d4829a1d	Notificación 1	Mensaje de prueba número 1	info	t	2026-08-14 21:07:38.895
01a0021a-15af-7450-9f0f-857424a19827	01a00219-c152-79e2-91e3-02c87876d483	Notificación 2	Mensaje de prueba número 2	info	f	2026-08-14 21:07:39.06
01a0021a-1602-74b8-84c0-5272a5db86b5	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	Notificación 3	Mensaje de prueba número 3	info	t	2026-08-14 21:07:39.143
01a0021a-1655-761f-ab15-b803c952711e	01a00219-c1f8-7ee0-ac34-1bb3843daff0	Notificación 4	Mensaje de prueba número 4	info	f	2026-08-14 21:07:39.226
01a0021a-16a9-7359-8653-326b44dd5616	01a00219-c24b-708d-b2ee-b6395488d938	Notificación 5	Mensaje de prueba número 5	info	t	2026-08-14 21:07:39.309
01a0021a-16fc-71b7-8ae7-e9c1ed08adb7	01a00219-c29e-7f39-b4ba-f227c01445a4	Notificación 6	Mensaje de prueba número 6	info	f	2026-08-14 21:07:39.393
01a0021a-174f-79b5-89ac-48218746a437	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	Notificación 7	Mensaje de prueba número 7	info	t	2026-08-14 21:07:39.476
01a0021a-17a1-7499-8206-65bf97a72010	01a00219-c344-7e01-9fea-947f6b87da21	Notificación 8	Mensaje de prueba número 8	info	f	2026-08-14 21:07:39.558
01a0021a-17f4-7a73-9298-b2e3ad3a63ce	01a00219-c397-7962-8987-d09685c40037	Notificación 9	Mensaje de prueba número 9	info	t	2026-08-14 21:07:39.641
01a0021a-1847-762d-adc2-25348db99f01	01a00219-c3ea-7ac8-af3f-25df88be36ab	Notificación 10	Mensaje de prueba número 10	info	f	2026-08-14 21:07:39.724
\.


--

-- --- TABLE DATA: order_details ---
COPY public.order_details (id, order_id, product_id, quantity, unit_price, subtotal) FROM stdin;
01a00219-da13-7fee-9f88-240757b4250b	01a00219-d67a-70c3-80c2-6c9b555fa512	01a00219-c48e-7df1-898e-200a951946d8	1	1000.00	1000.00
01a00219-da6a-7ca4-bc10-1c15a12bf496	01a00219-d6d7-7290-ba0d-4b20849a6093	01a00219-c4e7-7661-b482-cf51677f36e3	2	2000.00	4000.00
01a00219-dabd-7699-be07-2a7ce2bfba26	01a00219-d72b-7b60-925c-ebb3e1ae0d26	01a00219-c53a-7176-bfa4-f57104f80dcf	3	3000.00	9000.00
01a00219-db10-7c47-9d7b-e6ac80e33a6a	01a00219-d77e-7a62-a374-e8ba67c17eb5	01a00219-c58d-79b0-936d-b27e31a7072a	4	4000.00	16000.00
01a00219-db63-79bc-b795-17a7fecf629a	01a00219-d7d1-70a7-85a4-6029cf1415cb	01a00219-c5e0-75fc-8a32-9c344969be98	5	5000.00	25000.00
01a00219-dbb6-7f2b-af30-3db7338c9a7e	01a00219-d824-7fff-a2f3-d351ab28b13b	01a00219-c633-78e5-b21c-3e1ebeaa12a9	6	6000.00	36000.00
01a00219-dc09-7744-971b-d61fd112011d	01a00219-d877-7c7d-9b2b-54c212d698d4	01a00219-c687-7efa-9e1a-605be946171d	7	7000.00	49000.00
01a00219-dc5c-7050-b87f-a83937657791	01a00219-d8ca-7e0d-886b-9041e40e06d6	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	8	8000.00	64000.00
01a00219-dcaf-74ac-a4a5-deba27ea2b16	01a00219-d91c-7a98-bba7-d887cd06e85e	01a00219-c72d-712c-b41c-f0209fa72d96	9	9000.00	81000.00
01a00219-dd01-7752-963f-1922096d1b49	01a00219-d96f-7f58-8543-9e1b970f6128	01a00219-c780-7ac4-9a0c-4d49adde5342	10	10000.00	100000.00
\.


--

-- --- TABLE DATA: orders ---
COPY public.orders (id, customer_id, driver_id, promotional_code_id, delivery_address_id, order_date, status, total, updated_at) FROM stdin;
01a00219-d67a-70c3-80c2-6c9b555fa512	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	\N	\N	2026-08-14 21:07:22.798	pending	10000.00	2026-08-14 21:07:22.798
01a00219-d6d7-7290-ba0d-4b20849a6093	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c344-7e01-9fea-947f6b87da21	\N	\N	2026-08-14 21:07:22.972	paid	20000.00	2026-08-14 21:07:22.972
01a00219-d72b-7b60-925c-ebb3e1ae0d26	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	\N	\N	2026-08-14 21:07:23.056	preparing	30000.00	2026-08-14 21:07:23.056
01a00219-d77e-7a62-a374-e8ba67c17eb5	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c344-7e01-9fea-947f6b87da21	\N	\N	2026-08-14 21:07:23.139	shipped	40000.00	2026-08-14 21:07:23.139
01a00219-d7d1-70a7-85a4-6029cf1415cb	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	\N	\N	2026-08-14 21:07:23.222	delivered	50000.00	2026-08-14 21:07:23.222
01a00219-d824-7fff-a2f3-d351ab28b13b	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c344-7e01-9fea-947f6b87da21	\N	\N	2026-08-14 21:07:23.305	canceled	60000.00	2026-08-14 21:07:23.305
01a00219-d877-7c7d-9b2b-54c212d698d4	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	\N	\N	2026-08-14 21:07:23.388	returned	70000.00	2026-08-14 21:07:23.388
01a00219-d8ca-7e0d-886b-9041e40e06d6	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c344-7e01-9fea-947f6b87da21	\N	\N	2026-08-14 21:07:23.471	pending	80000.00	2026-08-14 21:07:23.471
01a00219-d91c-7a98-bba7-d887cd06e85e	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	\N	\N	2026-08-14 21:07:23.554	paid	90000.00	2026-08-14 21:07:23.554
01a00219-d96f-7f58-8543-9e1b970f6128	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c344-7e01-9fea-947f6b87da21	\N	\N	2026-08-14 21:07:23.637	preparing	100000.00	2026-08-14 21:07:23.637
\.


--

-- --- TABLE DATA: payouts ---
COPY public.payouts (id, receipt_id, user_id, gateway, transaction_id, status, method, amount, currency, paid_at, confirmed_at, gateway_token) FROM stdin;
01a00219-e86b-7752-9406-3f2b9d6f0ced	01a00219-e138-7a04-bb64-16113b48014d	01a00219-c0f9-7e75-a64b-7590d4829a1d	simulado	TXN-DEMO-1-1786741647390	pending	tarjeta	10000.00	COP	2026-08-14 21:07:27.39	\N	\N
01a00219-e8c7-7b31-a996-45b891db7b0c	01a00219-e19a-7cb5-94e2-085f1f130bb8	01a00219-c152-79e2-91e3-02c87876d483	simulado	TXN-DEMO-2-1786741647390	approved	tarjeta	20000.00	COP	2026-08-14 21:07:27.563	2026-08-14 21:07:27.563	\N
01a00219-e91b-7b5f-bf7c-70dd57d3dc83	01a00219-e1ed-7373-aecd-8f41ac606c97	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	simulado	TXN-DEMO-3-1786741647390	rejected	tarjeta	30000.00	COP	2026-08-14 21:07:27.647	\N	\N
01a00219-e96e-712c-96c6-4c0be44ec875	01a00219-e240-7817-a368-ef12c6edae77	01a00219-c1f8-7ee0-ac34-1bb3843daff0	simulado	TXN-DEMO-4-1786741647390	refunded	tarjeta	40000.00	COP	2026-08-14 21:07:27.731	2026-08-14 21:07:27.731	\N
01a00219-e9c1-70ad-8508-05e9609eff5c	01a00219-e294-7938-86b1-38c7f8f9a661	01a00219-c0f9-7e75-a64b-7590d4829a1d	simulado	TXN-DEMO-5-1786741647390	pending	tarjeta	50000.00	COP	2026-08-14 21:07:27.814	\N	\N
01a00219-ea14-787d-a4e4-1384d06a05d4	01a00219-e2e7-7bc7-b315-378a59378fc7	01a00219-c152-79e2-91e3-02c87876d483	simulado	TXN-DEMO-6-1786741647390	approved	tarjeta	60000.00	COP	2026-08-14 21:07:27.897	2026-08-14 21:07:27.897	\N
01a00219-ea68-7b8a-896f-e68890592590	01a00219-e33a-79b0-973c-bee11c90e0a4	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	simulado	TXN-DEMO-7-1786741647390	rejected	tarjeta	70000.00	COP	2026-08-14 21:07:27.98	\N	\N
01a00219-eaba-7f51-b1a7-389faafd5037	01a00219-e38d-7916-b25a-e2636b3580ac	01a00219-c1f8-7ee0-ac34-1bb3843daff0	simulado	TXN-DEMO-8-1786741647390	refunded	tarjeta	80000.00	COP	2026-08-14 21:07:28.063	2026-08-14 21:07:28.063	\N
01a00219-eb0e-7fa9-9c22-f02c4dc64fca	01a00219-e3e0-7ec2-8583-33b1778b35b9	01a00219-c0f9-7e75-a64b-7590d4829a1d	simulado	TXN-DEMO-9-1786741647390	pending	tarjeta	90000.00	COP	2026-08-14 21:07:28.146	\N	\N
01a00219-eb61-7943-b6c8-6ccead0a6027	01a00219-e432-7e6f-9c91-51036d7b0f5c	01a00219-c152-79e2-91e3-02c87876d483	simulado	TXN-DEMO-10-1786741647390	approved	tarjeta	100000.00	COP	2026-08-14 21:07:28.229	2026-08-14 21:07:28.229	\N
\.


--

-- --- TABLE DATA: price_history ---
COPY public.price_history (id, product_id, previous_price, new_price, changed_at, user_id) FROM stdin;
01a00219-cf4f-74b3-ac27-2be2633ea974	01a00219-c48e-7df1-898e-200a951946d8	0.00	1000.00	2026-08-14 21:07:20.962	01a00219-c0f9-7e75-a64b-7590d4829a1d
01a00219-cfa9-78c3-8726-a948e0d2bb54	01a00219-c4e7-7661-b482-cf51677f36e3	1000.00	2000.00	2026-08-14 21:07:21.133	01a00219-c152-79e2-91e3-02c87876d483
01a00219-cffc-72e6-8ef7-2895f639a639	01a00219-c53a-7176-bfa4-f57104f80dcf	2000.00	3000.00	2026-08-14 21:07:21.216	01a00219-c1a5-7fe8-b0cc-81ce093c89ac
01a00219-d04f-7588-bc6b-0b772e3e807b	01a00219-c58d-79b0-936d-b27e31a7072a	3000.00	4000.00	2026-08-14 21:07:21.299	01a00219-c1f8-7ee0-ac34-1bb3843daff0
01a00219-d0a2-7613-af47-94aa8f0614cf	01a00219-c5e0-75fc-8a32-9c344969be98	4000.00	5000.00	2026-08-14 21:07:21.382	01a00219-c24b-708d-b2ee-b6395488d938
01a00219-d0f5-758f-aeb9-3b3e38fc2763	01a00219-c633-78e5-b21c-3e1ebeaa12a9	5000.00	6000.00	2026-08-14 21:07:21.465	01a00219-c29e-7f39-b4ba-f227c01445a4
01a00219-d148-7f06-959f-41dcc5aa53d4	01a00219-c687-7efa-9e1a-605be946171d	6000.00	7000.00	2026-08-14 21:07:21.549	01a00219-c2f1-7a93-a1bc-f2aef5a399cb
01a00219-d19b-716a-a4aa-72126fe4d61f	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	7000.00	8000.00	2026-08-14 21:07:21.632	01a00219-c344-7e01-9fea-947f6b87da21
01a00219-d1ee-753a-955e-c79fc75b7e77	01a00219-c72d-712c-b41c-f0209fa72d96	8000.00	9000.00	2026-08-14 21:07:21.715	01a00219-c397-7962-8987-d09685c40037
01a00219-d241-7a9b-929c-199977f67514	01a00219-c780-7ac4-9a0c-4d49adde5342	9000.00	10000.00	2026-08-14 21:07:21.797	01a00219-c3ea-7ac8-af3f-25df88be36ab
\.


--

-- --- TABLE DATA: product_images ---
COPY public.product_images (id, product_id, url, name, is_primary, sort_order) FROM stdin;
01a00219-c825-7181-8449-603bde4d9da3	01a00219-c48e-7df1-898e-200a951946d8	https://picsum.photos/seed/1/400/400	imagen-1.jpg	t	1
01a00219-c87e-718b-b7d3-b52f6b5d6a18	01a00219-c4e7-7661-b482-cf51677f36e3	https://picsum.photos/seed/2/400/400	imagen-2.jpg	t	1
01a00219-c8d1-73a3-a6e6-e08f491efb2c	01a00219-c53a-7176-bfa4-f57104f80dcf	https://picsum.photos/seed/3/400/400	imagen-3.jpg	t	1
01a00219-c924-73d7-b3f9-3260dd0a26bf	01a00219-c58d-79b0-936d-b27e31a7072a	https://picsum.photos/seed/4/400/400	imagen-4.jpg	t	1
01a00219-c977-77c2-a813-871ba14ae065	01a00219-c5e0-75fc-8a32-9c344969be98	https://picsum.photos/seed/5/400/400	imagen-5.jpg	t	1
01a00219-c9ca-7c0f-98da-0fd6ef9fcf1c	01a00219-c633-78e5-b21c-3e1ebeaa12a9	https://picsum.photos/seed/6/400/400	imagen-6.jpg	t	1
01a00219-ca1d-7181-90be-6354d4b6dcd0	01a00219-c687-7efa-9e1a-605be946171d	https://picsum.photos/seed/7/400/400	imagen-7.jpg	t	1
01a00219-ca6f-780a-9e2e-4722745e13b4	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	https://picsum.photos/seed/8/400/400	imagen-8.jpg	t	1
01a00219-cac2-762d-83cf-3c0088b6fc58	01a00219-c72d-712c-b41c-f0209fa72d96	https://picsum.photos/seed/9/400/400	imagen-9.jpg	t	1
01a00219-cb15-7900-85ae-34512e9a1407	01a00219-c780-7ac4-9a0c-4d49adde5342	https://picsum.photos/seed/10/400/400	imagen-10.jpg	t	1
\.


--

-- --- TABLE DATA: products ---
COPY public.products (id, name, description, price, stock, stock_min, category_id, supplier_id, created_at) FROM stdin;
01a00219-c48e-7df1-898e-200a951946d8	Demo Product 1	Descripción del producto demo 1	1000.00	50	5	01a00219-b5cb-77f4-8f0b-dd8b1e74211b	01a00219-b969-7d66-babe-9aa97de1efd3	2026-08-14 21:07:18.211
01a00219-c4e7-7661-b482-cf51677f36e3	Demo Product 2	Descripción del producto demo 2	2000.00	51	5	01a00219-b630-75c9-a6df-e0cfc85be1a4	01a00219-b9be-7003-98cb-d4f8a0da4b82	2026-08-14 21:07:18.38
01a00219-c53a-7176-bfa4-f57104f80dcf	Demo Product 3	Descripción del producto demo 3	3000.00	52	5	01a00219-b683-781b-9a79-f062bb7413a9	01a00219-ba11-7de0-a923-002ce77c8620	2026-08-14 21:07:18.463
01a00219-c58d-79b0-936d-b27e31a7072a	Demo Product 4	Descripción del producto demo 4	4000.00	53	5	01a00219-b6d5-7597-83a8-400ef1e95ce6	01a00219-ba64-7885-912f-42d35706ea1a	2026-08-14 21:07:18.546
01a00219-c5e0-75fc-8a32-9c344969be98	Demo Product 5	Descripción del producto demo 5	5000.00	54	5	01a00219-b728-7453-9594-09fff2dd869d	01a00219-bab7-736d-887e-252e66a2bd83	2026-08-14 21:07:18.63
01a00219-c633-78e5-b21c-3e1ebeaa12a9	Demo Product 6	Descripción del producto demo 6	6000.00	55	5	01a00219-b77b-7f4e-94c6-88cb608fef33	01a00219-bb0a-7666-ac50-53052d24b32c	2026-08-14 21:07:18.713
01a00219-c687-7efa-9e1a-605be946171d	Demo Product 7	Descripción del producto demo 7	7000.00	56	5	01a00219-b7cd-761b-8a8a-d11c28a5e514	01a00219-bb5c-72b2-968e-d82209da3ada	2026-08-14 21:07:18.796
01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	Demo Product 8	Descripción del producto demo 8	8000.00	57	5	01a00219-b820-7506-b76c-ea765e2b8d47	01a00219-bbaf-7b0f-a5f9-73d0f11ec4dc	2026-08-14 21:07:18.879
01a00219-c72d-712c-b41c-f0209fa72d96	Demo Product 9	Descripción del producto demo 9	9000.00	58	5	01a00219-b873-7264-a1b2-9fd4f9426c2b	01a00219-bc02-71b6-a6b1-7181d5af9e21	2026-08-14 21:07:18.962
01a00219-c780-7ac4-9a0c-4d49adde5342	Demo Product 10	Descripción del producto demo 10	10000.00	59	5	01a00219-b8c5-7296-b391-54da1f129616	01a00219-bc54-7dc1-8208-342899f34258	2026-08-14 21:07:19.045
\.


--

-- --- TABLE DATA: promotional_codes ---
COPY public.promotional_codes (id, code, description, type, value, min_purchase, start_date, end_date, max_uses, current_uses, active, version) FROM stdin;
01a00219-d2e5-7249-9317-748d6cd4581a	DEMO1	Código promocional demo 1	percentage	10.00	0.00	2026-08-14	2026-09-13	100	0	t	0
01a00219-d33d-7152-8c6f-a24518d1c2e4	DEMO2	Código promocional demo 2	fixed	5000.00	0.00	2026-08-14	2026-09-13	100	1	t	0
01a00219-d390-70bb-b271-42b0ffdd4c89	DEMO3	Código promocional demo 3	percentage	10.00	0.00	2026-08-14	2026-09-13	100	2	t	0
01a00219-d3e3-75ad-bc27-ab39ebd954a9	DEMO4	Código promocional demo 4	fixed	5000.00	0.00	2026-08-14	2026-09-13	100	3	t	0
01a00219-d436-7c1c-bb37-bdd066c63621	DEMO5	Código promocional demo 5	percentage	10.00	0.00	2026-08-14	2026-09-13	100	4	t	0
01a00219-d489-7a94-bc7c-27c38d156a10	DEMO6	Código promocional demo 6	fixed	5000.00	0.00	2026-08-14	2026-09-13	100	5	t	0
01a00219-d4dc-74d1-b7bc-d9a781199d72	DEMO7	Código promocional demo 7	percentage	10.00	0.00	2026-08-14	2026-09-13	100	6	t	0
01a00219-d52e-7a80-917b-7cc4519259d3	DEMO8	Código promocional demo 8	fixed	5000.00	0.00	2026-08-14	2026-09-13	100	7	t	0
01a00219-d582-7664-9026-43bcabb59c51	DEMO9	Código promocional demo 9	percentage	10.00	0.00	2026-08-14	2026-09-13	100	8	t	0
01a00219-d5d5-7441-8972-cab04834ef63	DEMO10	Código promocional demo 10	fixed	5000.00	0.00	2026-08-14	2026-09-13	100	9	t	0
\.


--

-- --- TABLE DATA: provider_categories ---
COPY public.provider_categories (provider_id, category_id) FROM stdin;
01a00219-b969-7d66-babe-9aa97de1efd3	01a00219-b5cb-77f4-8f0b-dd8b1e74211b
01a00219-b9be-7003-98cb-d4f8a0da4b82	01a00219-b630-75c9-a6df-e0cfc85be1a4
01a00219-ba11-7de0-a923-002ce77c8620	01a00219-b683-781b-9a79-f062bb7413a9
01a00219-ba64-7885-912f-42d35706ea1a	01a00219-b6d5-7597-83a8-400ef1e95ce6
01a00219-bab7-736d-887e-252e66a2bd83	01a00219-b728-7453-9594-09fff2dd869d
01a00219-bb0a-7666-ac50-53052d24b32c	01a00219-b77b-7f4e-94c6-88cb608fef33
01a00219-bb5c-72b2-968e-d82209da3ada	01a00219-b7cd-761b-8a8a-d11c28a5e514
01a00219-bbaf-7b0f-a5f9-73d0f11ec4dc	01a00219-b820-7506-b76c-ea765e2b8d47
01a00219-bc02-71b6-a6b1-7181d5af9e21	01a00219-b873-7264-a1b2-9fd4f9426c2b
01a00219-bc54-7dc1-8208-342899f34258	01a00219-b8c5-7296-b391-54da1f129616
\.


--

-- --- TABLE DATA: providers ---
COPY public.providers (id, name, phone, email, address) FROM stdin;
01a00219-b969-7d66-babe-9aa97de1efd3	Proveedor 1	+57 300 000 0001	proveedor1@demo.com	Calle 1 # 1-2, Bogotá
01a00219-b9be-7003-98cb-d4f8a0da4b82	Proveedor 2	+57 300 000 0002	proveedor2@demo.com	Calle 2 # 1-2, Bogotá
01a00219-ba11-7de0-a923-002ce77c8620	Proveedor 3	+57 300 000 0003	proveedor3@demo.com	Calle 3 # 1-2, Bogotá
01a00219-ba64-7885-912f-42d35706ea1a	Proveedor 4	+57 300 000 0004	proveedor4@demo.com	Calle 4 # 1-2, Bogotá
01a00219-bab7-736d-887e-252e66a2bd83	Proveedor 5	+57 300 000 0005	proveedor5@demo.com	Calle 5 # 1-2, Bogotá
01a00219-bb0a-7666-ac50-53052d24b32c	Proveedor 6	+57 300 000 0006	proveedor6@demo.com	Calle 6 # 1-2, Bogotá
01a00219-bb5c-72b2-968e-d82209da3ada	Proveedor 7	+57 300 000 0007	proveedor7@demo.com	Calle 7 # 1-2, Bogotá
01a00219-bbaf-7b0f-a5f9-73d0f11ec4dc	Proveedor 8	+57 300 000 0008	proveedor8@demo.com	Calle 8 # 1-2, Bogotá
01a00219-bc02-71b6-a6b1-7181d5af9e21	Proveedor 9	+57 300 000 0009	proveedor9@demo.com	Calle 9 # 1-2, Bogotá
01a00219-bc54-7dc1-8208-342899f34258	Proveedor 10	+57 300 000 0010	proveedor10@demo.com	Calle 10 # 1-2, Bogotá
\.


--

-- --- TABLE DATA: receipt_items ---
COPY public.receipt_items (id, receipt_id, product_id, quantity, unit_price, subtotal) FROM stdin;
01a00219-e4d7-7a40-8efe-c36b98b495ae	01a00219-e138-7a04-bb64-16113b48014d	01a00219-c48e-7df1-898e-200a951946d8	1	1000.00	1000.00
01a00219-e52f-73d7-ba9a-97d032578b6b	01a00219-e19a-7cb5-94e2-085f1f130bb8	01a00219-c4e7-7661-b482-cf51677f36e3	2	2000.00	4000.00
01a00219-e582-74e3-a5cd-4bc0f901aecb	01a00219-e1ed-7373-aecd-8f41ac606c97	01a00219-c53a-7176-bfa4-f57104f80dcf	3	3000.00	9000.00
01a00219-e5d5-75aa-b3dd-87cee21306bb	01a00219-e240-7817-a368-ef12c6edae77	01a00219-c58d-79b0-936d-b27e31a7072a	4	4000.00	16000.00
01a00219-e628-726d-a0f3-49f660706250	01a00219-e294-7938-86b1-38c7f8f9a661	01a00219-c5e0-75fc-8a32-9c344969be98	5	5000.00	25000.00
01a00219-e67b-715a-8982-d6ca9d34438a	01a00219-e2e7-7bc7-b315-378a59378fc7	01a00219-c633-78e5-b21c-3e1ebeaa12a9	6	6000.00	36000.00
01a00219-e6ce-780c-9dc2-521ccc6fa801	01a00219-e33a-79b0-973c-bee11c90e0a4	01a00219-c687-7efa-9e1a-605be946171d	7	7000.00	49000.00
01a00219-e720-755f-8b4d-6d2f5ad29958	01a00219-e38d-7916-b25a-e2636b3580ac	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	8	8000.00	64000.00
01a00219-e773-71db-bce3-bdea32e59012	01a00219-e3e0-7ec2-8583-33b1778b35b9	01a00219-c72d-712c-b41c-f0209fa72d96	9	9000.00	81000.00
01a00219-e7c6-7bcd-b145-6a6b9d1866ca	01a00219-e432-7e6f-9c91-51036d7b0f5c	01a00219-c780-7ac4-9a0c-4d49adde5342	10	10000.00	100000.00
\.


--

-- --- TABLE DATA: receipts ---
COPY public.receipts (id, receipt_number, customer_id, employee_id, order_id, date, total, payment_status) FROM stdin;
01a00219-e138-7a04-bb64-16113b48014d	1	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c24b-708d-b2ee-b6395488d938	01a00219-d67a-70c3-80c2-6c9b555fa512	2026-08-14 21:07:25.548	10000.00	pending
01a00219-e19a-7cb5-94e2-085f1f130bb8	2	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c29e-7f39-b4ba-f227c01445a4	01a00219-d6d7-7290-ba0d-4b20849a6093	2026-08-14 21:07:25.727	20000.00	paid
01a00219-e1ed-7373-aecd-8f41ac606c97	3	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c397-7962-8987-d09685c40037	01a00219-d72b-7b60-925c-ebb3e1ae0d26	2026-08-14 21:07:25.81	30000.00	partial
01a00219-e240-7817-a368-ef12c6edae77	4	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c3ea-7ac8-af3f-25df88be36ab	01a00219-d77e-7a62-a374-e8ba67c17eb5	2026-08-14 21:07:25.894	40000.00	overdue
01a00219-e294-7938-86b1-38c7f8f9a661	5	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c24b-708d-b2ee-b6395488d938	01a00219-d7d1-70a7-85a4-6029cf1415cb	2026-08-14 21:07:25.977	50000.00	voided
01a00219-e2e7-7bc7-b315-378a59378fc7	6	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c29e-7f39-b4ba-f227c01445a4	01a00219-d824-7fff-a2f3-d351ab28b13b	2026-08-14 21:07:26.06	60000.00	pending
01a00219-e33a-79b0-973c-bee11c90e0a4	7	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c397-7962-8987-d09685c40037	01a00219-d877-7c7d-9b2b-54c212d698d4	2026-08-14 21:07:26.143	70000.00	paid
01a00219-e38d-7916-b25a-e2636b3580ac	8	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c3ea-7ac8-af3f-25df88be36ab	01a00219-d8ca-7e0d-886b-9041e40e06d6	2026-08-14 21:07:26.226	80000.00	partial
01a00219-e3e0-7ec2-8583-33b1778b35b9	9	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c24b-708d-b2ee-b6395488d938	01a00219-d91c-7a98-bba7-d887cd06e85e	2026-08-14 21:07:26.309	90000.00	overdue
01a00219-e432-7e6f-9c91-51036d7b0f5c	10	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c29e-7f39-b4ba-f227c01445a4	01a00219-d96f-7f58-8543-9e1b970f6128	2026-08-14 21:07:26.392	100000.00	voided
\.


--

-- --- TABLE DATA: reports ---
COPY public.reports (id, date, total_orders, delivered_orders, canceled_orders, total_sold, total_paid, total_refunded, products_sold, new_customers, generated_at) FROM stdin;
01a0021a-2a2d-7e6b-b93a-113e76b28ba4	2026-08-14	10	5	0	100000.00	90000.00	0.00	20	1	2026-08-14 21:07:44.224
01a0021a-2a85-7b88-aa8d-60faf3611fcf	2026-08-13	11	6	1	200000.00	180000.00	1000.00	21	2	2026-08-14 21:07:44.394
01a0021a-2ad8-7816-bbb7-d15c3c65c41e	2026-08-12	12	7	2	300000.00	270000.00	2000.00	22	3	2026-08-14 21:07:44.477
01a0021a-2b2a-7d08-a3ce-22b65869839a	2026-08-11	13	8	3	400000.00	360000.00	3000.00	23	4	2026-08-14 21:07:44.56
01a0021a-2b7d-732c-8a93-d20d75f5d4ee	2026-08-10	14	9	4	500000.00	450000.00	4000.00	24	5	2026-08-14 21:07:44.643
01a0021a-2bd0-79cb-baa3-bec3092cd732	2026-08-09	15	10	5	600000.00	540000.00	5000.00	25	6	2026-08-14 21:07:44.726
01a0021a-2c22-78e5-a88e-e1277c2dd3df	2026-08-08	16	11	6	700000.00	630000.00	6000.00	26	7	2026-08-14 21:07:44.808
01a0021a-2c75-7435-a3e6-475466cd8ffa	2026-08-07	17	12	7	800000.00	720000.00	7000.00	27	8	2026-08-14 21:07:44.891
01a0021a-2cc8-738f-84ac-a053b43a38a1	2026-08-06	18	13	8	900000.00	810000.00	8000.00	28	9	2026-08-14 21:07:44.974
01a0021a-2d1b-708f-a119-0a683a92e113	2026-08-05	19	14	9	1000000.00	900000.00	9000.00	29	10	2026-08-14 21:07:45.057
\.


--

-- --- TABLE DATA: returns ---
COPY public.returns (id, order_id, customer_id, product_id, quantity, reason, status, product_condition, refund, requested_at, resolved_at, updated_at) FROM stdin;
01a00219-efec-72cf-a47a-dfe5f20791fc	01a00219-d67a-70c3-80c2-6c9b555fa512	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c48e-7df1-898e-200a951946d8	1	Devolución demo 1	requested	good	0.00	2026-08-14 21:07:29.311	\N	2026-08-14 21:07:29.312
01a00219-f045-7ec7-91a4-a622d8904027	01a00219-d6d7-7290-ba0d-4b20849a6093	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c4e7-7661-b482-cf51677f36e3	1	Devolución demo 2	approved	good	5000.00	2026-08-14 21:07:29.481	2026-08-14 21:07:29.481	2026-08-14 21:07:29.482
01a00219-f098-7e76-9b38-c1f4ff9b8db5	01a00219-d72b-7b60-925c-ebb3e1ae0d26	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c53a-7176-bfa4-f57104f80dcf	1	Devolución demo 3	rejected	good	0.00	2026-08-14 21:07:29.564	\N	2026-08-14 21:07:29.565
01a00219-f0eb-7fc8-91c9-ae0987e5869e	01a00219-d77e-7a62-a374-e8ba67c17eb5	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c58d-79b0-936d-b27e31a7072a	1	Devolución demo 4	refunded	good	5000.00	2026-08-14 21:07:29.648	2026-08-14 21:07:29.648	2026-08-14 21:07:29.649
01a00219-f13e-75f9-9e4f-6c631edc0454	01a00219-d7d1-70a7-85a4-6029cf1415cb	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c5e0-75fc-8a32-9c344969be98	1	Devolución demo 5	requested	good	0.00	2026-08-14 21:07:29.731	\N	2026-08-14 21:07:29.732
01a00219-f191-7c8c-9ebb-1fde651e7d24	01a00219-d824-7fff-a2f3-d351ab28b13b	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c633-78e5-b21c-3e1ebeaa12a9	1	Devolución demo 6	approved	good	5000.00	2026-08-14 21:07:29.814	2026-08-14 21:07:29.814	2026-08-14 21:07:29.815
01a00219-f1e5-76bd-acfd-418128714982	01a00219-d877-7c7d-9b2b-54c212d698d4	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c687-7efa-9e1a-605be946171d	1	Devolución demo 7	rejected	good	0.00	2026-08-14 21:07:29.897	\N	2026-08-14 21:07:29.898
01a00219-f238-7f28-bfa8-b68a2b4ee9b0	01a00219-d8ca-7e0d-886b-9041e40e06d6	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	1	Devolución demo 8	refunded	good	5000.00	2026-08-14 21:07:29.98	2026-08-14 21:07:29.98	2026-08-14 21:07:29.981
01a00219-f28a-74a8-aa01-eb7235dd3107	01a00219-d91c-7a98-bba7-d887cd06e85e	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c72d-712c-b41c-f0209fa72d96	1	Devolución demo 9	requested	good	0.00	2026-08-14 21:07:30.063	\N	2026-08-14 21:07:30.064
01a00219-f2dd-7a2b-a335-969e43c5bbd3	01a00219-d96f-7f58-8543-9e1b970f6128	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c780-7ac4-9a0c-4d49adde5342	1	Devolución demo 10	approved	good	5000.00	2026-08-14 21:07:30.146	2026-08-14 21:07:30.146	2026-08-14 21:07:30.147
\.


--

-- --- TABLE DATA: reviews ---
COPY public.reviews (id, product_id, user_id, rating, comment, date) FROM stdin;
01a0021a-19e3-7236-a405-257f8f6a9017	01a00219-c48e-7df1-898e-200a951946d8	01a00219-c0f9-7e75-a64b-7590d4829a1d	1	Comentario demo 1	2026-08-14 21:07:39.807
01a0021a-1bce-722b-8c7b-ad202f3ab6f8	01a00219-c4e7-7661-b482-cf51677f36e3	01a00219-c152-79e2-91e3-02c87876d483	2	Comentario demo 2	2026-08-14 21:07:40.464
01a0021a-1d66-7a6e-a2d0-55abd22317b5	01a00219-c53a-7176-bfa4-f57104f80dcf	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	3	Comentario demo 3	2026-08-14 21:07:40.872
01a0021a-1f01-7329-bdf6-509aae362fd3	01a00219-c58d-79b0-936d-b27e31a7072a	01a00219-c1f8-7ee0-ac34-1bb3843daff0	4	Comentario demo 4	2026-08-14 21:07:41.283
01a0021a-2099-7925-aa4d-53ce9453b183	01a00219-c5e0-75fc-8a32-9c344969be98	01a00219-c24b-708d-b2ee-b6395488d938	5	Comentario demo 5	2026-08-14 21:07:41.692
01a0021a-2232-771e-8ca3-f2d36dac1b97	01a00219-c633-78e5-b21c-3e1ebeaa12a9	01a00219-c29e-7f39-b4ba-f227c01445a4	1	Comentario demo 6	2026-08-14 21:07:42.1
01a0021a-23ca-7b5a-a1ad-53fc544c286b	01a00219-c687-7efa-9e1a-605be946171d	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	2	Comentario demo 7	2026-08-14 21:07:42.509
01a0021a-2562-726f-bc42-70d3f6e38485	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	01a00219-c344-7e01-9fea-947f6b87da21	3	Comentario demo 8	2026-08-14 21:07:42.917
01a0021a-26fa-7bf5-b02a-b15704444604	01a00219-c72d-712c-b41c-f0209fa72d96	01a00219-c397-7962-8987-d09685c40037	4	Comentario demo 9	2026-08-14 21:07:43.324
01a0021a-28e3-7cc1-b0cb-1dd44a931687	01a00219-c780-7ac4-9a0c-4d49adde5342	01a00219-c3ea-7ac8-af3f-25df88be36ab	5	Comentario demo 10	2026-08-14 21:07:43.732
\.


--

-- --- TABLE DATA: security_events ---
COPY public.security_events (id, user_id, type, ip, user_agent, detail, success, date) FROM stdin;
01a0021a-2dbf-7510-8f96-0660a2fab1fe	01a00219-c0f9-7e75-a64b-7590d4829a1d	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.139
01a0021a-2e14-7079-b022-fc603dbc3ff6	01a00219-c152-79e2-91e3-02c87876d483	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.305
01a0021a-2e67-76f5-b288-104d2d7ca4dd	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.388
01a0021a-2eba-7aef-aac8-5981b7dd55db	01a00219-c1f8-7ee0-ac34-1bb3843daff0	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.471
01a0021a-2f0d-7a2a-a594-0b8923a586e1	01a00219-c24b-708d-b2ee-b6395488d938	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.554
01a0021a-2f5f-7fa3-941b-e014a5993678	01a00219-c29e-7f39-b4ba-f227c01445a4	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.637
01a0021a-2fb2-782e-95da-5b634bc1c228	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.719
01a0021a-3005-7997-ad9a-f3417ba44bc1	01a00219-c344-7e01-9fea-947f6b87da21	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.802
01a0021a-3058-7612-a4be-268c9bf166a2	01a00219-c397-7962-8987-d09685c40037	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.885
01a0021a-30ab-7a7d-902c-66343af23826	01a00219-c3ea-7ac8-af3f-25df88be36ab	login_ok	127.0.0.1	seed-script	\N	t	2026-08-14 21:07:45.968
01a0021d-acec-771c-a7ba-1af339413d4a	01a00219-c0f9-7e75-a64b-7590d4829a1d	login_fail	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 1, "shouldLock": false}	f	2026-08-14 21:11:34.301
01a0021d-af09-79a9-a970-0f691fb6dbe2	01a00219-c0f9-7e75-a64b-7590d4829a1d	login_fail	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 2, "shouldLock": false}	f	2026-08-14 21:11:34.848
01a0021e-7ab2-7333-acfb-4f7279fcecc7	01a00219-c0f9-7e75-a64b-7590d4829a1d	login_ok	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-14 21:12:26.996
01a00228-f08c-7d2a-bc9b-76ada002aae2	01a00219-c3ea-7ac8-af3f-25df88be36ab	login_fail	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 1, "shouldLock": false}	f	2026-08-14 21:23:52.535
01a00228-f282-7f96-af2d-d9e964c982d0	01a00219-c3ea-7ac8-af3f-25df88be36ab	login_fail	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 2, "shouldLock": false}	f	2026-08-14 21:23:53.116
01a00229-3460-744d-b878-b0cb69e9a380	01a00219-c3ea-7ac8-af3f-25df88be36ab	login_ok	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-14 21:24:09.899
01a0022a-f056-7bd6-a1dc-1b38ad36b9ba	01a00219-c397-7962-8987-d09685c40037	login_ok	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-14 21:26:03.548
01a01385-3943-7b77-9f40-884a20a43a43	\N	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "user_not_found"}	f	2026-08-18 06:18:12.979
01a01385-bed6-7e53-81b1-b65196f86ae1	\N	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "user_not_found"}	f	2026-08-18 06:18:47.258
01a01387-eb99-7c66-8611-eacd6e59b838	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	register	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 06:21:09.708
01a01388-dc74-7bff-a1ef-8718408325e5	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 06:22:11.443
01a01389-0926-7530-a665-a3a744b0d8ae	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 06:22:22.882
01a01389-a393-74b5-96ac-7d5f46d5a13d	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 06:23:02.417
01a01389-b55b-70a8-973b-d04dcd995c5c	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 06:23:06.969
01a013c2-0c55-7a22-a820-49952c02b064	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:24:39.095
01a013c2-4e23-7ef0-bed5-0fbdb770c5e3	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset_request	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:24:56.022
01a013c3-4427-7bfb-9a17-4b5174f463ba	\N	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "No hay ningún código activo para este correo. Solicita uno nuevo."}	f	2026-08-18 07:25:58.842
01a013c3-52a6-7e8f-9efd-9e823fb65c8c	\N	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "No hay ningún código activo para este correo. Solicita uno nuevo."}	f	2026-08-18 07:26:02.712
01a013c3-9079-7d0c-be75-adeda8ada0de	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset_request	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:26:18.538
01a013c4-155d-7da5-aa3c-2c9b090665ba	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:26:52.557
01a013c4-2876-71a3-9e55-d1c5452334f1	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:26:57.446
01a013c4-76bc-7718-a4d9-36b1be091621	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 1, "shouldLock": false}	f	2026-08-18 07:27:17.484
01a013c4-7f63-7cd8-9a40-2fb9a14ee155	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 2, "shouldLock": false}	f	2026-08-18 07:27:19.699
01a013c4-84ce-77e2-8fbb-4f4d207ffe7b	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 3, "shouldLock": true}	f	2026-08-18 07:27:21.086
01a013c4-899e-7965-a984-1c7faacbafb2	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset_request	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:27:22.317
01a013c4-fb57-70ca-8840-bdfff904f987	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:27:51.43
01a013d4-b2ef-7ae3-8c69-05b60d5c8337	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 1, "shouldLock": false}	f	2026-08-18 07:45:01.563
01a013d4-bcc5-72e6-9ed7-04ee1744b9e2	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 2, "shouldLock": false}	f	2026-08-18 07:45:04.167
01a013d4-c1c2-7d41-821d-554b816bb974	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_fail	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"attempts": 3, "shouldLock": true}	f	2026-08-18 07:45:05.444
01a013d4-c9c9-7e4d-a711-72d8230c254a	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset_request	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:45:07.421
01a013d5-4520-7a52-b046-b5e2f01256fa	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-18 07:45:39.074
01a01840-f818-774e-a298-6becd23a02f1	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 04:21:46
01a01882-5386-7551-a610-7ea202ff7e1c	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	password_reset_request	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 05:33:08.461
01a01884-074b-7f75-a87e-4571408a22f9	\N	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "No hay ningún código activo para este correo. Solicita uno nuevo."}	f	2026-08-19 05:34:59.942
01a01884-1e33-71cc-982d-147a2868f23a	\N	password_reset	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	{"email": "alvaradocristian1027@gmail.com", "reason": "No hay ningún código activo para este correo. Solicita uno nuevo."}	f	2026-08-19 05:35:05.946
01a01884-fb47-7211-8067-9a0f1edb44e2	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	186.86.110.151	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 05:36:02.552
01a01b25-36fd-7bb0-a94d-5fa98f11cdd7	01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	login_ok	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:50:18.757
01a01b27-6fdb-7713-b513-d93bd1c0b914	01a01b27-6f22-7181-b542-231010db068c	register	191.156.227.193	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:52:44.425
01a01b27-9768-7c7a-b9e4-5acd18ec7483	01a01b27-6f22-7181-b542-231010db068c	password_reset_request	191.156.227.193	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:52:54.628
01a01b28-016f-76a5-ad11-10c80b14296f	01a01b27-6f22-7181-b542-231010db068c	password_reset	191.156.227.193	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:53:21.772
01a01b28-9f85-72eb-a60b-6cdf8b9e77ae	01a01b27-6f22-7181-b542-231010db068c	login_ok	191.156.227.193	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:54:02.242
01a01b2a-b67a-76f4-9f82-80df8bc40d15	01a00219-c397-7962-8987-d09685c40037	login_ok	179.1.226.200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N	t	2026-08-19 17:56:19.087
01a01d37-10bd-7984-8dde-d77878b1f051	01a00219-c0f9-7e75-a64b-7590d4829a1d	login_ok	::1	curl/8.5.0	\N	t	2026-08-20 03:29:03.263
\.


--

-- --- TABLE DATA: shopping ---
COPY public.shopping (id, user_id, product_id, quantity, added_at) FROM stdin;
01a00219-f47a-7743-bbb1-0b4c95b21ca2	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c48e-7df1-898e-200a951946d8	1	2026-08-14 21:07:30.23
01a00219-f668-75b1-8de1-82890b1c5324	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c4e7-7661-b482-cf51677f36e3	2	2026-08-14 21:07:30.891
01a00219-f801-7b0d-85ed-8d6130b1d86f	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c53a-7176-bfa4-f57104f80dcf	3	2026-08-14 21:07:31.299
01a00219-f999-76b6-98f1-524a97b4afbc	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c58d-79b0-936d-b27e31a7072a	4	2026-08-14 21:07:31.708
01a00219-fb32-7dce-a6e6-e2296d85be13	01a00219-c24b-708d-b2ee-b6395488d938	01a00219-c5e0-75fc-8a32-9c344969be98	5	2026-08-14 21:07:32.117
01a00219-fcca-7e6a-998e-ca4da38ac48a	01a00219-c29e-7f39-b4ba-f227c01445a4	01a00219-c633-78e5-b21c-3e1ebeaa12a9	6	2026-08-14 21:07:32.525
01a00219-fe63-7dbc-8588-993cdf4a8712	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	01a00219-c687-7efa-9e1a-605be946171d	7	2026-08-14 21:07:32.934
01a00219-fffb-7ad2-882b-e9385216db5f	01a00219-c344-7e01-9fea-947f6b87da21	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	8	2026-08-14 21:07:33.342
01a0021a-0193-75e3-b084-895fec9cf2ee	01a00219-c397-7962-8987-d09685c40037	01a00219-c72d-712c-b41c-f0209fa72d96	9	2026-08-14 21:07:33.75
01a0021a-032a-7774-8c15-3b5cb685f14e	01a00219-c3ea-7ac8-af3f-25df88be36ab	01a00219-c780-7ac4-9a0c-4d49adde5342	10	2026-08-14 21:07:34.158
\.


--

-- --- TABLE DATA: users ---
COPY public.users (id, email, full_name, hashed_password, password_updated_at, must_change_password, phone, address, role, is_active, is_email_verified, mfa_enabled, mfa_secret, failed_attempts, locked_until, last_login, data_consent_at, deleted_at, created_at, updated_at) FROM stdin;
01a00219-c152-79e2-91e3-02c87876d483	user2@demo.com	Usuario Demo 2	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.462	f	+57 310 000 0002	Carrera 2 # 10-20	client	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.462	\N	2026-08-14 21:07:17.463	2026-08-14 21:07:17.463
01a00219-c1a5-7fe8-b0cc-81ce093c89ac	user3@demo.com	Usuario Demo 3	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.545	f	+57 310 000 0003	Carrera 3 # 10-20	client	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.545	\N	2026-08-14 21:07:17.546	2026-08-14 21:07:17.546
01a00219-c1f8-7ee0-ac34-1bb3843daff0	user4@demo.com	Usuario Demo 4	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.628	f	+57 310 000 0004	Carrera 4 # 10-20	client	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.628	\N	2026-08-14 21:07:17.629	2026-08-14 21:07:17.629
01a00219-c24b-708d-b2ee-b6395488d938	user5@demo.com	Usuario Demo 5	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.711	f	+57 310 000 0005	Carrera 5 # 10-20	employee	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.711	\N	2026-08-14 21:07:17.712	2026-08-14 21:07:17.712
01a00219-c29e-7f39-b4ba-f227c01445a4	user6@demo.com	Usuario Demo 6	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.794	f	+57 310 000 0006	Carrera 6 # 10-20	employee	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.794	\N	2026-08-14 21:07:17.795	2026-08-14 21:07:17.795
01a00219-c2f1-7a93-a1bc-f2aef5a399cb	user7@demo.com	Usuario Demo 7	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.878	f	+57 310 000 0007	Carrera 7 # 10-20	delivery	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.878	\N	2026-08-14 21:07:17.878	2026-08-14 21:07:17.878
01a00219-c344-7e01-9fea-947f6b87da21	user8@demo.com	Usuario Demo 8	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.961	f	+57 310 000 0008	Carrera 8 # 10-20	delivery	t	t	f	\N	0	\N	\N	2026-08-14 21:07:17.961	\N	2026-08-14 21:07:17.962	2026-08-14 21:07:17.962
01a01387-eaf8-79d9-9fb5-28bfa2a2cd08	alvaradocristian1027@gmail.com	Cristian Alvaradp	$2a$10$vgfa10XHeRGauMthJ06FxeYpFRyADHbiEJ1SMptGgH14MSOTCcu/6	2026-08-18 07:45:38.912	f	\N	\N	client	t	f	f	\N	0	\N	2026-08-19 17:50:18.576	2026-08-18 06:21:09.546	\N	2026-08-18 06:21:09.547	2026-08-18 06:21:09.547
01a00219-c3ea-7ac8-af3f-25df88be36ab	user10@demo.com	Usuario Demo 10	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:18.127	f	+57 310 000 0010	Carrera 10 # 10-20	superadmin	t	t	f	\N	0	\N	2026-08-14 21:24:09.737	2026-08-14 21:07:18.127	\N	2026-08-14 21:07:18.128	2026-08-14 21:07:18.128
01a01b27-6f22-7181-b542-231010db068c	amehtadame@gmail.com	ameht	$2a$10$EQPmgIM15VV8uQQAXiMOVOQMwwK.CZ8MmqnyfJchylB7bF4indspS	2026-08-19 17:53:21.613	f	\N	\N	client	t	f	f	\N	0	\N	2026-08-19 17:54:02.084	2026-08-19 17:52:44.223	\N	2026-08-19 17:52:44.224	2026-08-19 17:52:44.224
01a00219-c397-7962-8987-d09685c40037	user9@demo.com	Usuario Demo 9	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:18.044	f	+57 310 000 0009	Carrera 9 # 10-20	admin	t	t	f	\N	0	\N	2026-08-19 17:56:18.928	2026-08-14 21:07:18.044	\N	2026-08-14 21:07:18.045	2026-08-14 21:07:18.045
01a00219-c0f9-7e75-a64b-7590d4829a1d	user1@demo.com	Usuario Demo 1	$2a$10$GBe1HdgTNdoj.iY7/eIiYe4EUGjV61XZUquQWql2XLufXRMfY0tWO	2026-08-14 21:07:17.291	f	+57 310 000 0001	Carrera 1 # 10-20	client	t	t	f	\N	0	\N	2026-08-20 03:29:03.092	2026-08-14 21:07:17.291	\N	2026-08-14 21:07:17.292	2026-08-14 21:07:17.292
\.


--

-- --- TABLE DATA: wishlist ---
COPY public.wishlist (id, user_id, product_id, added_at) FROM stdin;
01a0021a-0567-7773-ad63-cfc52d191090	01a00219-c0f9-7e75-a64b-7590d4829a1d	01a00219-c4e7-7661-b482-cf51677f36e3	2026-08-14 21:07:34.565
01a0021a-0754-76fa-8c94-d11ba6191fc6	01a00219-c152-79e2-91e3-02c87876d483	01a00219-c53a-7176-bfa4-f57104f80dcf	2026-08-14 21:07:35.223
01a0021a-08eb-7dbb-9838-9b41c0a4eeac	01a00219-c1a5-7fe8-b0cc-81ce093c89ac	01a00219-c58d-79b0-936d-b27e31a7072a	2026-08-14 21:07:35.631
01a0021a-0a83-79b2-b88f-d33991d1f1bb	01a00219-c1f8-7ee0-ac34-1bb3843daff0	01a00219-c5e0-75fc-8a32-9c344969be98	2026-08-14 21:07:36.039
01a0021a-0c1c-70d4-8f8c-1bd7ca5b171c	01a00219-c24b-708d-b2ee-b6395488d938	01a00219-c633-78e5-b21c-3e1ebeaa12a9	2026-08-14 21:07:36.447
01a0021a-0db4-7cf9-af68-8d70a4ab6203	01a00219-c29e-7f39-b4ba-f227c01445a4	01a00219-c687-7efa-9e1a-605be946171d	2026-08-14 21:07:36.855
01a0021a-0f4c-70b7-8e1b-31080aef2589	01a00219-c2f1-7a93-a1bc-f2aef5a399cb	01a00219-c6da-74e7-9d3d-bc92ce2ba7ff	2026-08-14 21:07:37.264
01a0021a-10e4-721c-8907-a9f2aa63febc	01a00219-c344-7e01-9fea-947f6b87da21	01a00219-c72d-712c-b41c-f0209fa72d96	2026-08-14 21:07:37.671
01a0021a-127b-75fb-aaa0-9b3bf5f627c5	01a00219-c397-7962-8987-d09685c40037	01a00219-c780-7ac4-9a0c-4d49adde5342	2026-08-14 21:07:38.079
01a0021a-1414-7e26-9c3a-a12588d9bafc	01a00219-c3ea-7ac8-af3f-25df88be36ab	01a00219-c48e-7df1-898e-200a951946d8	2026-08-14 21:07:38.487
\.


--

-- --- SEQUENCE SET: receipts_receipt_number_seq ---
SELECT pg_catalog.setval('public.receipts_receipt_number_seq', 10, true);


--

-- --- CONSTRAINT: categories categories_pkey ---
ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: delivery_addresses delivery_addresses_pkey ---
ALTER TABLE ONLY public.delivery_addresses
    ADD CONSTRAINT delivery_addresses_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: despatches despatches_pkey ---
ALTER TABLE ONLY public.despatches
    ADD CONSTRAINT despatches_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: inventory_movements inventory_movements_pkey ---
ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: notifications notifications_pkey ---
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: order_details order_details_pkey ---
ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: orders orders_pkey ---
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: payouts payouts_pkey ---
ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: price_history price_history_pkey ---
ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: product_images product_images_pkey ---
ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: products products_pkey ---
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: promotional_codes promotional_codes_pkey ---
ALTER TABLE ONLY public.promotional_codes
    ADD CONSTRAINT promotional_codes_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: provider_categories provider_categories_pkey ---
ALTER TABLE ONLY public.provider_categories
    ADD CONSTRAINT provider_categories_pkey PRIMARY KEY (provider_id, category_id);


--

-- --- CONSTRAINT: providers providers_pkey ---
ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: receipt_items receipt_items_pkey ---
ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: receipts receipts_pkey ---
ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: reports reports_pkey ---
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: returns returns_pkey ---
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: reviews reviews_pkey ---
ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: security_events security_events_pkey ---
ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: shopping shopping_pkey ---
ALTER TABLE ONLY public.shopping
    ADD CONSTRAINT shopping_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: users users_pkey ---
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--

-- --- CONSTRAINT: wishlist wishlist_pkey ---
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--

-- --- INDEX: idx_delivery_addresses_user ---
CREATE INDEX idx_delivery_addresses_user ON public.delivery_addresses USING btree (user_id);


--

-- --- INDEX: idx_despatches_order ---
CREATE INDEX idx_despatches_order ON public.despatches USING btree (order_id);


--

-- --- INDEX: idx_inventory_movements_product ---
CREATE INDEX idx_inventory_movements_product ON public.inventory_movements USING btree (product_id);


--

-- --- INDEX: idx_notifications_user ---
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--

-- --- INDEX: idx_order_details_order ---
CREATE INDEX idx_order_details_order ON public.order_details USING btree (order_id);


--

-- --- INDEX: idx_orders_customer ---
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--

-- --- INDEX: idx_orders_driver ---
CREATE INDEX idx_orders_driver ON public.orders USING btree (driver_id);


--

-- --- INDEX: idx_payouts_receipt ---
CREATE INDEX idx_payouts_receipt ON public.payouts USING btree (receipt_id);


--

-- --- INDEX: idx_payouts_user ---
CREATE INDEX idx_payouts_user ON public.payouts USING btree (user_id);


--

-- --- INDEX: idx_price_history_product ---
CREATE INDEX idx_price_history_product ON public.price_history USING btree (product_id);


--

-- --- INDEX: idx_product_images_product ---
CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--

-- --- INDEX: idx_products_category ---
CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--

-- --- INDEX: idx_products_supplier ---
CREATE INDEX idx_products_supplier ON public.products USING btree (supplier_id);


--

-- --- INDEX: idx_receipt_items_receipt ---
CREATE INDEX idx_receipt_items_receipt ON public.receipt_items USING btree (receipt_id);


--

-- --- INDEX: idx_receipts_customer ---
CREATE INDEX idx_receipts_customer ON public.receipts USING btree (customer_id);


--

-- --- INDEX: idx_receipts_employee ---
CREATE INDEX idx_receipts_employee ON public.receipts USING btree (employee_id);


--

-- --- INDEX: idx_receipts_order ---
CREATE INDEX idx_receipts_order ON public.receipts USING btree (order_id);


--

-- --- INDEX: idx_reports_date ---
CREATE INDEX idx_reports_date ON public.reports USING btree (date);


--

-- --- INDEX: idx_returns_order ---
CREATE INDEX idx_returns_order ON public.returns USING btree (order_id);


--

-- --- INDEX: idx_reviews_product ---
CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--

-- --- INDEX: idx_security_events_ip_date ---
CREATE INDEX idx_security_events_ip_date ON public.security_events USING btree (ip, date);


--

-- --- INDEX: idx_security_events_type_date ---
CREATE INDEX idx_security_events_type_date ON public.security_events USING btree (type, date);


--

-- --- INDEX: idx_security_events_user ---
CREATE INDEX idx_security_events_user ON public.security_events USING btree (user_id);


--

-- --- INDEX: idx_shopping_user ---
CREATE INDEX idx_shopping_user ON public.shopping USING btree (user_id);


--

-- --- INDEX: idx_users_deleted_at ---
CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--

-- --- INDEX: idx_users_locked_until ---
CREATE INDEX idx_users_locked_until ON public.users USING btree (locked_until);


--

-- --- INDEX: idx_wishlist_user ---
CREATE INDEX idx_wishlist_user ON public.wishlist USING btree (user_id);


--

-- --- INDEX: payouts_transaction_id_key ---
CREATE UNIQUE INDEX payouts_transaction_id_key ON public.payouts USING btree (transaction_id);


--

-- --- INDEX: promotional_codes_code_key ---
CREATE UNIQUE INDEX promotional_codes_code_key ON public.promotional_codes USING btree (code);


--

-- --- INDEX: receipts_order_id_key ---
CREATE UNIQUE INDEX receipts_order_id_key ON public.receipts USING btree (order_id);


--

-- --- INDEX: receipts_receipt_number_key ---
CREATE UNIQUE INDEX receipts_receipt_number_key ON public.receipts USING btree (receipt_number);


--

-- --- INDEX: reports_date_key ---
CREATE UNIQUE INDEX reports_date_key ON public.reports USING btree (date);


--

-- --- INDEX: review_product_user_unique ---
CREATE UNIQUE INDEX review_product_user_unique ON public.reviews USING btree (product_id, user_id);


--

-- --- INDEX: shopping_user_product_unique ---
CREATE UNIQUE INDEX shopping_user_product_unique ON public.shopping USING btree (user_id, product_id);


--

-- --- INDEX: users_email_key ---
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--

-- --- INDEX: wishlist_user_product_unique ---
CREATE UNIQUE INDEX wishlist_user_product_unique ON public.wishlist USING btree (user_id, product_id);


--

-- --- FK CONSTRAINT: delivery_addresses delivery_addresses_user_id_fkey ---
ALTER TABLE ONLY public.delivery_addresses
    ADD CONSTRAINT delivery_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: despatches despatches_driver_id_fkey ---
ALTER TABLE ONLY public.despatches
    ADD CONSTRAINT despatches_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: despatches despatches_order_id_fkey ---
ALTER TABLE ONLY public.despatches
    ADD CONSTRAINT despatches_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--

-- --- FK CONSTRAINT: inventory_movements inventory_movements_product_id_fkey ---
ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: inventory_movements inventory_movements_user_id_fkey ---
ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: notifications notifications_user_id_fkey ---
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: order_details order_details_order_id_fkey ---
ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--

-- --- FK CONSTRAINT: order_details order_details_product_id_fkey ---
ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: orders orders_customer_id_fkey ---
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: orders orders_delivery_address_id_fkey ---
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.delivery_addresses(id);


--

-- --- FK CONSTRAINT: orders orders_driver_id_fkey ---
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: orders orders_promotional_code_id_fkey ---
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_promotional_code_id_fkey FOREIGN KEY (promotional_code_id) REFERENCES public.promotional_codes(id);


--

-- --- FK CONSTRAINT: payouts payouts_receipt_id_fkey ---
ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id);


--

-- --- FK CONSTRAINT: payouts payouts_user_id_fkey ---
ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: price_history price_history_product_id_fkey ---
ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: price_history price_history_user_id_fkey ---
ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: product_images product_images_product_id_fkey ---
ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: products products_category_id_fkey ---
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--

-- --- FK CONSTRAINT: products products_supplier_id_fkey ---
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.providers(id);


--

-- --- FK CONSTRAINT: provider_categories provider_categories_category_id_fkey ---
ALTER TABLE ONLY public.provider_categories
    ADD CONSTRAINT provider_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--

-- --- FK CONSTRAINT: provider_categories provider_categories_provider_id_fkey ---
ALTER TABLE ONLY public.provider_categories
    ADD CONSTRAINT provider_categories_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--

-- --- FK CONSTRAINT: receipt_items receipt_items_product_id_fkey ---
ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: receipt_items receipt_items_receipt_id_fkey ---
ALTER TABLE ONLY public.receipt_items
    ADD CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id);


--

-- --- FK CONSTRAINT: receipts receipts_customer_id_fkey ---
ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: receipts receipts_employee_id_fkey ---
ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: receipts receipts_order_id_fkey ---
ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--

-- --- FK CONSTRAINT: returns returns_customer_id_fkey ---
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: returns returns_order_id_fkey ---
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--

-- --- FK CONSTRAINT: returns returns_product_id_fkey ---
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: reviews reviews_product_id_fkey ---
ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: reviews reviews_user_id_fkey ---
ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: security_events security_events_user_id_fkey ---
ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: shopping shopping_product_id_fkey ---
ALTER TABLE ONLY public.shopping
    ADD CONSTRAINT shopping_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: shopping shopping_user_id_fkey ---
ALTER TABLE ONLY public.shopping
    ADD CONSTRAINT shopping_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- --- FK CONSTRAINT: wishlist wishlist_product_id_fkey ---
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--

-- --- FK CONSTRAINT: wishlist wishlist_user_id_fkey ---
ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

