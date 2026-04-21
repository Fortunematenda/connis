--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2026-04-21 09:30:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 289608)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 245 (class 1259 OID 291438)
-- Name: bandwidth_aggregate_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bandwidth_aggregate_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    total_upload_mbps numeric(10,2) DEFAULT 0,
    total_download_mbps numeric(10,2) DEFAULT 0,
    active_users integer DEFAULT 0,
    sampled_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bandwidth_aggregate_log OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 291415)
-- Name: bandwidth_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bandwidth_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    upload_threshold_mbps numeric(6,2) DEFAULT 1.5,
    sustained_minutes integer DEFAULT 5,
    throttle_download character varying(20) DEFAULT '5M'::character varying,
    throttle_upload character varying(20) DEFAULT '1M'::character varying,
    auto_recover boolean DEFAULT true,
    recover_minutes integer DEFAULT 30,
    monitor_interval_sec integer DEFAULT 120,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bandwidth_settings OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 291390)
-- Name: bandwidth_usage_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bandwidth_usage_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    username character varying(100) NOT NULL,
    upload_bytes bigint DEFAULT 0,
    download_bytes bigint DEFAULT 0,
    upload_rate numeric(10,2) DEFAULT 0,
    download_rate numeric(10,2) DEFAULT 0,
    source character varying(20) DEFAULT 'radacct'::character varying,
    sampled_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bandwidth_usage_log OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 291233)
-- Name: billable_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billable_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    type character varying(30) DEFAULT 'service'::character varying,
    taxable boolean DEFAULT false,
    active boolean DEFAULT true,
    plan_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billable_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 290722)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(200) NOT NULL,
    phone character varying(50),
    address text,
    subscription_status character varying(20) DEFAULT 'active'::character varying,
    subscription_plan character varying(50) DEFAULT 'trial'::character varying,
    expires_at timestamp without time zone DEFAULT (now() + '14 days'::interval),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    bank_details text
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 290737)
-- Name: company_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_admins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    email character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(200),
    role character varying(30) DEFAULT 'admin'::character varying,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    phone character varying(50)
);


ALTER TABLE public.company_admins OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 291370)
-- Name: credit_note_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_note_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    credit_note_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.credit_note_items OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 291326)
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credit_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    credit_number character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'issued'::character varying,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'ZAR'::character varying,
    notes text,
    invoice_id uuid,
    transaction_id uuid,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.credit_notes OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 291027)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    ticket_id uuid,
    name character varying(300) NOT NULL,
    file_path text NOT NULL,
    file_size bigint DEFAULT 0,
    mime_type character varying(100),
    uploaded_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 291215)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 291173)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'paid'::character varying,
    type character varying(30) DEFAULT 'subscription'::character varying,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'ZAR'::character varying,
    notes text,
    due_date date,
    paid_at timestamp without time zone,
    period_start date,
    period_end date,
    transaction_id uuid,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 289716)
-- Name: lead_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    author character varying(200) DEFAULT 'Admin'::character varying,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_comments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 289683)
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(200) NOT NULL,
    phone character varying(50),
    email character varying(200),
    address text,
    status character varying(30) DEFAULT 'new'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    converted_to uuid,
    company_id uuid,
    created_by uuid
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 291141)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    ticket_id uuid,
    content text NOT NULL,
    sender_type character varying(10) NOT NULL,
    sender_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    attachment_url character varying(500),
    is_delivered boolean DEFAULT false,
    CONSTRAINT messages_sender_type_check CHECK (((sender_type)::text = ANY ((ARRAY['admin'::character varying, 'customer'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 291124)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(300) NOT NULL,
    body text,
    link character varying(500),
    is_read boolean DEFAULT false,
    ref_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 289695)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    method character varying(50) DEFAULT 'manual'::character varying,
    reference character varying(200),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 289633)
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    download_speed character varying(20) NOT NULL,
    upload_speed character varying(20) NOT NULL,
    price numeric(12,2) NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mikrotik_profile character varying(100),
    company_id uuid,
    radius_rate_limit character varying(100),
    billing_type character varying(20) DEFAULT 'postpaid'::character varying
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 291303)
-- Name: quote_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quote_id uuid NOT NULL,
    item_id uuid,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.quote_items OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 291258)
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    quote_number character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'ZAR'::character varying,
    notes text,
    valid_until date,
    customer_name character varying(200),
    customer_email character varying(200),
    customer_phone character varying(50),
    customer_address text,
    converted_to uuid,
    lead_id uuid,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 290757)
-- Name: routers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    ip_address character varying(100) NOT NULL,
    username character varying(100) DEFAULT 'admin'::character varying NOT NULL,
    password_enc text NOT NULL,
    port integer DEFAULT 8728 NOT NULL,
    is_default boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    auth_type character varying(10) DEFAULT 'radius'::character varying NOT NULL
);


ALTER TABLE public.routers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 289666)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    nas_ip character varying(45),
    framed_ip character varying(45),
    session_id character varying(100),
    start_time timestamp without time zone DEFAULT now(),
    stop_time timestamp without time zone,
    upload_bytes bigint DEFAULT 0,
    download_bytes bigint DEFAULT 0,
    terminate_cause character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    company_id uuid
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 290988)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    ticket_id uuid,
    title character varying(300) NOT NULL,
    description text,
    status character varying(30) DEFAULT 'todo'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    assigned_to uuid,
    due_date date,
    created_by uuid,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 290968)
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    author_id uuid,
    author_name character varying(200),
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_customer boolean DEFAULT false
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 290933)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    subject character varying(300) NOT NULL,
    description text,
    status character varying(30) DEFAULT 'open'::character varying,
    priority character varying(20) DEFAULT 'medium'::character varying,
    assigned_to uuid,
    created_by uuid,
    closed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 291069)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    type character varying(10) NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    category character varying(30) DEFAULT 'manual'::character varying,
    reference character varying(200),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 289646)
-- Name: user_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    changed_by uuid
);


ALTER TABLE public.user_plans OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 289619)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(200),
    email character varying(200),
    phone character varying(50),
    address text,
    balance numeric(12,2) DEFAULT 0.00,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    company_id uuid,
    created_by uuid,
    seq_id integer,
    is_flagged boolean DEFAULT false,
    flagged_at timestamp without time zone,
    flag_reason character varying(200),
    original_rate_limit character varying(100),
    throttled_rate_limit character varying(100)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 291096)
-- Name: vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vouchers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    is_used boolean DEFAULT false,
    used_by uuid,
    used_at timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vouchers OWNER TO postgres;

--
-- TOC entry 5366 (class 0 OID 291438)
-- Dependencies: 245
-- Data for Name: bandwidth_aggregate_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bandwidth_aggregate_log (id, company_id, total_upload_mbps, total_download_mbps, active_users, sampled_at) FROM stdin;
7bb7decf-9ab6-4d1a-8c43-35be271557b0	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-07 23:51:16.163237
350b8efe-1d22-4dc7-bd60-d4290c097c95	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-07 23:53:16.181773
81f58c70-4233-4f05-bdc9-a250b8a71431	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-07 23:55:16.180872
bc39540a-07b3-4c98-820a-bb7296264b3e	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-07 23:57:16.173142
37971a6c-2046-4532-a00c-1f8e832660f6	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-07 23:59:16.25046
c1b739a5-0cbc-4f1a-978b-4fe8ada977d8	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:01:16.202539
fdc411d2-0c7b-4905-b6bb-894835c215cd	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:03:16.204953
8ab27f5f-2b4e-4f1c-9ac0-6585accbd552	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:05:16.236483
0f0bc968-804b-4bd7-a924-fedd3f3810fc	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:06:01.026319
22211121-fb54-482c-83c1-657516552c42	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:06:12.180755
635a4b30-5a8b-4127-9f84-f1f103ade718	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:06:32.28455
f415e118-5797-432c-89cd-501ac5c4b0a7	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:08:29.117389
f53216ec-6628-4cc9-941d-c1773fb9c297	0ce4ec60-8454-459f-8ada-b540758b3877	1.79	28.35	35	2026-04-08 00:10:29.151478
03e6d638-33b4-40e1-83b4-5b32fadd0e4e	0ce4ec60-8454-459f-8ada-b540758b3877	1.89	29.15	35	2026-04-08 00:12:29.187134
86595c74-ff47-4afd-bf92-ee6a37989da6	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:12:44.862187
d0479060-889e-4906-82f5-272de2e4d46d	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	35	2026-04-08 00:13:05.624783
f1535304-51c6-4036-9903-8be2f5cf7117	0ce4ec60-8454-459f-8ada-b540758b3877	1.84	32.44	35	2026-04-08 00:15:05.71517
f59a2247-6265-46e0-b32e-6a6e190ae2e7	0ce4ec60-8454-459f-8ada-b540758b3877	2.05	28.12	35	2026-04-08 00:17:05.769005
f70c372a-d2e8-43db-a8a1-0fcb70d067c0	0ce4ec60-8454-459f-8ada-b540758b3877	2.53	24.48	34	2026-04-08 00:19:05.642525
67bbc5c3-c58b-4ca9-a99d-1ecf6723442d	0ce4ec60-8454-459f-8ada-b540758b3877	3.27	25.83	34	2026-04-08 00:21:05.647097
a3eaf05c-5db7-4f4a-b1c6-d555dac2412a	0ce4ec60-8454-459f-8ada-b540758b3877	3.01	23.82	34	2026-04-08 00:23:05.63807
cc040023-e652-4a45-b0b8-08fce82b3756	0ce4ec60-8454-459f-8ada-b540758b3877	1.70	22.82	34	2026-04-08 00:25:05.695353
634d171d-c5fc-42db-a0d5-659836a8d665	0ce4ec60-8454-459f-8ada-b540758b3877	1.45	19.62	34	2026-04-08 00:27:05.655572
71c34672-5073-4404-8ade-7bef5612c0d0	0ce4ec60-8454-459f-8ada-b540758b3877	1.70	25.95	34	2026-04-08 00:29:05.675398
087aa0c7-4d38-4075-95af-a394683b403f	0ce4ec60-8454-459f-8ada-b540758b3877	1.54	20.25	34	2026-04-08 00:31:05.667006
e27a2af4-b58c-4c4f-89c8-38f8e28c4364	0ce4ec60-8454-459f-8ada-b540758b3877	1.48	22.22	34	2026-04-08 00:33:05.685028
40a2b8f5-5262-4d83-a247-2e93233c1cbb	0ce4ec60-8454-459f-8ada-b540758b3877	1.19	19.32	34	2026-04-08 00:35:05.696957
a75a176c-0c6f-4240-97cc-56d243da11ce	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	34	2026-04-08 00:35:31.145879
74b77b06-c582-483e-a98f-83f6a42d560c	0ce4ec60-8454-459f-8ada-b540758b3877	1.04	18.07	34	2026-04-08 00:37:31.164934
ab062405-0dc4-4b5e-b486-cee48e48944d	0ce4ec60-8454-459f-8ada-b540758b3877	1.72	22.33	34	2026-04-08 00:39:31.20624
f511462b-b43e-45f1-8885-8cacdc59f875	0ce4ec60-8454-459f-8ada-b540758b3877	1.21	21.42	34	2026-04-08 00:41:31.212613
197f25c7-ccd1-4243-ad25-ba13f2c56b39	0ce4ec60-8454-459f-8ada-b540758b3877	0.00	0.00	34	2026-04-08 00:41:49.353994
830ca42a-fcd7-4de6-972c-7c55e07460cb	0ce4ec60-8454-459f-8ada-b540758b3877	0.98	17.24	34	2026-04-08 00:43:49.356821
36f8f1ba-dcd4-4284-b0b7-2ca35a2b2c3e	0ce4ec60-8454-459f-8ada-b540758b3877	1.14	18.41	34	2026-04-08 00:45:49.410371
9e7dd3be-3cdf-427e-a234-759f0dae42da	0ce4ec60-8454-459f-8ada-b540758b3877	1.22	22.04	34	2026-04-08 00:47:49.502128
fd590299-3e88-4ee9-a44b-0b2b6f37c961	0ce4ec60-8454-459f-8ada-b540758b3877	0.97	20.34	34	2026-04-08 00:49:49.546708
3365f780-7d9c-4498-8f37-73e263a7b426	0ce4ec60-8454-459f-8ada-b540758b3877	1.93	22.45	34	2026-04-08 00:51:49.503292
59af0d19-85f0-48fc-9998-870b85c275b8	0ce4ec60-8454-459f-8ada-b540758b3877	1.94	26.16	34	2026-04-08 00:53:49.420114
fdca0bf6-6222-4d77-a509-a4308712ced7	0ce4ec60-8454-459f-8ada-b540758b3877	1.63	21.53	34	2026-04-08 00:55:49.49607
9cf10a6e-bb90-4a51-b6da-38c1e84b41de	0ce4ec60-8454-459f-8ada-b540758b3877	1.21	23.55	34	2026-04-08 00:57:49.468474
ba360131-0077-4349-aabb-fbf0569ff115	0ce4ec60-8454-459f-8ada-b540758b3877	1.00	26.40	34	2026-04-08 00:59:49.471071
0abf0186-9476-4457-83b4-c1caaf70350c	0ce4ec60-8454-459f-8ada-b540758b3877	1.01	19.39	34	2026-04-08 01:01:49.594718
acfc908e-cfad-4edc-9f02-8f66a31b5100	0ce4ec60-8454-459f-8ada-b540758b3877	0.99	21.22	33	2026-04-08 01:03:49.480932
92bd7759-78b5-4eb8-8a7e-a423670337ec	0ce4ec60-8454-459f-8ada-b540758b3877	1.77	16.50	33	2026-04-08 01:05:49.506038
3d5c2caa-8bb8-48a2-a5bc-ee6f6000a971	0ce4ec60-8454-459f-8ada-b540758b3877	4.72	17.60	32	2026-04-08 01:07:49.489671
af414b63-c33f-442d-9eec-a91b1d5b4d1e	0ce4ec60-8454-459f-8ada-b540758b3877	5.00	17.24	32	2026-04-08 01:09:49.532763
69514649-1d4a-46fc-b623-5854284ee874	0ce4ec60-8454-459f-8ada-b540758b3877	0.95	20.89	32	2026-04-08 01:11:49.508857
96f35f10-f158-4e09-a0be-3cdfe592f0c1	0ce4ec60-8454-459f-8ada-b540758b3877	2.16	23.72	32	2026-04-08 01:13:49.506869
f06b9941-6c73-47e9-be28-7c27779b907b	0ce4ec60-8454-459f-8ada-b540758b3877	2.07	16.38	32	2026-04-08 01:15:49.523916
319f029e-4d96-49cf-8ff2-074814149cbb	0ce4ec60-8454-459f-8ada-b540758b3877	1.46	17.05	32	2026-04-08 01:17:49.519678
\.


--
-- TOC entry 5365 (class 0 OID 291415)
-- Dependencies: 244
-- Data for Name: bandwidth_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bandwidth_settings (id, company_id, upload_threshold_mbps, sustained_minutes, throttle_download, throttle_upload, auto_recover, recover_minutes, monitor_interval_sec, enabled, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5364 (class 0 OID 291390)
-- Dependencies: 243
-- Data for Name: bandwidth_usage_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bandwidth_usage_log (id, company_id, user_id, username, upload_bytes, download_bytes, upload_rate, download_rate, source, sampled_at) FROM stdin;
99fb7bff-c4f3-49e5-a5c8-a07fc724c502	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.39568
113fc51b-c923-492c-b400-e008509d4c9f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.470557
8f3230f6-b5fb-4a8c-a5b6-035a6288c581	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.472939
df4588ae-6006-4153-996b-bd97d96501fb	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.47487
0f92d9b8-8f0f-48d2-b4cf-89e21b31ce6d	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.477763
651cbde6-1d62-475a-90af-c161c6196a1e	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.48069
2546b44f-de47-41f2-a968-c62fec3c1ca8	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.48296
1b9049dd-4e17-445e-9167-37bc6b15fc17	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.484754
41cc7700-2260-4df5-90a4-2779d3b3dd85	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.486926
97362bfd-4afc-44f8-beb1-ff921bb443bb	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.488832
14fd3001-01b2-4aca-967e-f5b49c11ee26	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.490888
62f92484-ce9c-4f38-8279-aae228f48140	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.493182
b3370fb3-9e17-4104-b350-c6e0a9423d63	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.496103
af2cb8d4-f8a3-42d2-bac2-a93c8cfe2f85	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.498154
6b602f2c-8561-4f1d-b811-d03a0539d941	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.500283
09eb462e-8eb5-466f-9653-452b09dc1fb1	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.502283
a60b7492-de95-4347-a3e9-2e5acaebeea8	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.50431
71f32ecf-f04b-4da0-a097-438da3ab4d17	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.506246
5f5a3cc5-cec7-4ded-9c7f-30b3b6f5620f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.508606
d358817c-a869-4509-b7d5-0d45c295a927	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.511276
ff07fe02-a789-4869-b911-18b1d15c7629	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.513503
616ee432-6af1-4d47-9b66-84703ae2a012	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.515601
03c38de1-0f98-41e9-8b89-cf080f7e3280	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.517541
c27341a0-8aeb-474c-a31c-83f905f5e095	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.519541
90aa58fe-a2f1-4fb3-97b8-ea19bebc1990	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.521279
0ffbc14e-a0e0-4c9d-a464-f504c3216b7b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.522826
25256e5a-6459-4480-a9a5-a3233184a27d	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.524345
596f5b22-5676-4263-bf84-0101c55c8e0b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.526013
bb76e800-c7e6-494d-8f32-17699bb6f35d	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.52836
ec44206f-3c0d-4f83-81e8-ed8ed035cc46	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.530256
d7de22b6-b52f-4206-94f8-61b926bd619c	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.532226
9222aa50-dcbe-4818-a1e3-8e9d0613c90b	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.534009
501e37cb-277d-4f8d-8301-59f0f362ee83	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.53577
5a1019eb-e079-4318-94e0-20b1c12ac2a7	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.537317
5f6e6e28-50eb-46c6-aede-607f4de9aac1	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:06:56.539192
0a07b172-c62b-400b-91ce-8df567aaa1bd	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.430562
de8e8079-efb6-4421-838c-9bb3580ac230	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.437225
1d078c01-2d14-48b7-bf54-63e547b45eac	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.439347
17eae88f-a85c-4c5d-be1a-c34fdec76e90	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.441767
7e0f8055-57ee-4711-b271-e4d13f99e989	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.444608
fd1cd40c-022d-46b1-89f2-cf4127eea641	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.446806
cf7e8cbe-c188-4f7d-9d88-3a1587f6f9e1	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.448783
41dbbe41-9e86-4d01-a80b-e87f1ae90583	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.450655
20ba60bb-c339-4798-9ad1-7423f66863a7	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.452499
571076f0-7fdf-480d-9e8f-e9e59822be51	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.454397
02d71df1-8869-4e0e-a6d6-4cc46f0d2eb7	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.45632
4570d127-f132-45d1-9b7a-c630d8ad943d	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.458599
a8ca36bd-932f-4e6a-a592-e18ddb1f8588	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.461226
4cb6d31b-49ff-4dda-b064-379b5018fe02	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.4633
7206974a-9d05-4dd5-acf4-eb94e058b5b3	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.465287
29b7dcce-b246-45f6-91a5-8332866a9461	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.467248
f6920a3f-a015-4568-a30c-a73a16525fef	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.469284
0d0ce470-a414-440c-b4ed-9688e46a4f16	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.471506
0ed5f273-f4e6-4286-bd46-61b89be0c01b	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.473566
c0f105e0-c471-4487-9260-654687125f09	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.47669
8a7815fb-0fc0-4897-9dc6-4ddda60aca44	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.478836
e6302526-10ac-4ca7-a8f5-894befd5b221	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.480885
13805018-101b-4b35-8729-eca743c4810c	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.482809
3eec8623-6af5-4da9-96e7-44423d53f622	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.485401
0b8494d1-4400-487c-bea8-5a5e24e4c7c8	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.487226
b756381e-5950-4dcd-8520-41391c183531	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.489079
f75bef17-ad9b-44d0-874d-d81a809f4583	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.490946
0d5f6055-e21d-4d7e-88a4-f0b878853d5b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.493578
6882c4f9-ba1e-4bc8-86fc-af49493a2a6a	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.495658
247e0bea-4711-4263-bd8e-71740cdf00c0	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.497686
ac519ddc-61e0-42af-bf32-ae496d57c690	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.499592
98876177-c77a-4a32-8a4f-30e0e52e7365	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.501382
02c9b27e-eab3-42fb-a343-ca4c3a4eaf1f	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.503116
aee1560c-b509-42dd-a768-3917b9b14c6e	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.504912
865a1060-5cb6-4fe1-a328-9eb94e75a41e	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:08:56.506765
ce9b97bb-8838-4fac-a6aa-f1a7cb65a6ca	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.476295
860ce549-b9f1-4727-8b7c-9e98fe79bee2	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.484051
4478efba-1646-44ab-9f5a-14f280d89bfb	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.486289
75c077f5-3ccd-4cc9-b5f6-2477cbf3db27	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.488467
24e40e0f-7924-487a-8a8e-092ce211e4b7	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.490839
79b55784-c9d0-4cca-ba5e-af81b45fb4a6	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.493271
d7d1173d-ac9e-4fa6-a6c3-c32415528fe7	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.495563
8e1f4be9-78c5-4b46-a7cd-26d2f83e2bcf	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.497744
b4f0f39b-f611-4737-a77b-6e7ec344bd23	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.499619
6389cb6f-2549-47ac-b43f-29b1508c8b87	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.501479
6140f612-3b34-4725-8e27-60591fc8da4d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.503307
c69da049-8e32-4b79-8e28-c979c2aabb82	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.505218
84506989-29aa-47bf-a59e-0d2657f86432	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.507331
fbb5f62e-5b07-4a92-b3f2-1159df07a8bf	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.509616
60677c75-f39d-43fe-ab64-26c76cacc780	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.511897
56921f3d-853e-4f79-b686-225faa3437e4	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.514
f284cdd5-f6a1-4bc0-bf25-fdd12c942a86	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.516238
725ce4ef-d568-4420-868b-4070451835de	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.518216
85556ca4-b8f1-49f0-9922-20cf6b50795c	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.520369
1068b82a-f982-4f56-80d6-d0eac3c8fb80	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.522491
4c7e2a0c-ca4d-4827-b29d-d86db91ef351	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.524867
dde51623-a241-436c-8886-781ce21c3491	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.527357
174772aa-d08b-489e-9689-483272ff465a	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.529616
75355660-1e8a-4f7a-902d-3974e2753e9e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.531647
b69a3171-677b-4bad-afc1-d83ee700eb03	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.533649
cf557f20-29f3-42af-a957-6a663b75e0b2	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.535614
6c8b3eb9-5f6f-4b54-8b99-3d8690fd806a	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.537617
00996677-92cc-4a09-8f58-0e4617f6a09c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.539719
e934e884-6bca-4016-b1cf-12597d412562	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.543595
3bcdc080-caac-4fcc-a61a-700449267d9b	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.54634
dd8b1fc4-9d22-49bc-9d4c-46b66b196ab0	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.548711
bdd6ea07-2115-4598-98bd-db22ca3087ab	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.551307
2649d059-7fff-4c08-8ffd-e28def9cbb7a	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.553225
f8771955-1679-4ff0-865b-7f6fd6270269	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.555369
6c6641a4-1e73-432c-8168-db6676b38477	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:10:56.557892
406b114e-644a-4703-bffe-4f51e71c1082	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.443756
264665cd-06af-4387-8a24-736a75f613af	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.450293
6d5d9f2b-7777-4b19-bef8-9ed88d4b1965	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.452401
fab5b366-859f-43cd-8577-10dc2eb1155d	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.454522
fdc8e247-4bdc-4d66-b02d-4994a3beb9d8	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.457066
2d927312-a7af-4b16-bfec-350a0bca1fbb	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.45938
b167242c-493f-4585-a294-1af3d4217431	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.461459
58561566-aa37-4003-9b3e-7505d21bc5e5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.463294
6e744421-ff10-431d-999d-c81ab2653ef4	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.465026
d3b66f4e-10a4-479a-a5ca-ee2d98437e9a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.466758
ae8f2cf8-9a70-4c04-bedd-31c54f2af205	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.468761
2ccbfef3-4a80-4d26-bbe1-67187e8a2280	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.470536
29e3e075-c884-4af9-8853-8bdf14f65f80	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.47227
2fbf92ec-c2e1-4546-ac31-dabf13992e98	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.474665
9f5b632a-4884-4461-8db9-17a316432e58	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.476747
af8143d4-641e-4c97-b61a-d61b81b5f962	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.478674
4c8bd1ca-831b-4c2d-8548-fb1ee0d7b4cc	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.480596
834f5b54-7a88-4410-894c-298fdc1aed5c	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.482365
b1f9ef9b-a364-4f51-83e4-24b4e874eca4	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.484121
98a37653-5152-4c4c-891d-c50dda28d5e1	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.48589
4f8f8058-2e8a-4f49-80e5-4a99d9a8db43	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.48788
64121855-7d2e-4914-b5a8-884aed673258	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.490356
c884821a-b7b6-47f1-9453-04601f4e3fa7	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.49276
b2697814-9898-4651-bab0-f5695ab1b90e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.494907
e12e6149-2393-48cd-9bd1-b204514c46fd	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.496872
841b6bb7-8397-4d25-b694-b3fddbe4d901	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.498874
1913ef88-470d-4040-923c-064a7c1bb9ec	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.500801
7bbd3828-b83a-4b9c-a298-579efaed2487	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.502682
7961dc10-6642-49c0-88aa-f4e67a9a3a98	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.504679
8da3d0e8-6601-435f-bec4-7c25ab78072f	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.507182
730974a6-444d-4d7a-93c8-cd03d2c37954	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.509595
b6b0a873-ac33-4612-9f9e-35a0b4ffb914	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.511698
8f2d6856-f749-47d0-bca8-bd52d138b49a	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.513469
ae0c9a43-bc82-4ec0-8419-5b3e75d9ccf8	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.515185
8d5ab4ff-7d42-4aed-b58a-5f3f1f83d805	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:12:56.516964
bbad796d-1ef7-4014-ab59-6e9e502f320c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.461174
808aeb65-f136-47ab-8beb-d26ea8bf806a	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.468956
63d0da0a-5775-492e-aef9-6b1be840744d	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.471792
b5b1ec49-9419-4ab6-b19b-d3afeba8651b	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.475265
141e3f58-b13d-4a3d-92c2-5b720203f214	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.478014
13d1b4c2-306c-4569-a3ce-e39e297e5f04	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.480514
a09d21e6-9c01-4a6c-b69e-cd96eab0ee2d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.483085
92da0e0a-e8df-43c5-b457-379833fe808e	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.485603
7ada3266-f684-415c-a3f4-87b13c3d2a0b	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.48834
74648237-9b03-4503-86c4-8c2d0a3ba9e3	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.491021
854ed3b7-714f-45f2-935f-221b6fdc2e57	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.49349
bb0a5cf0-f85f-4a4a-80da-5e73a9ff06ed	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.495931
751faac8-9066-4bf1-bc0c-cccb33fa1f0a	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.498679
dac285ab-4121-4b09-abab-f7c268e30200	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.501193
736c6519-b6e1-459b-8679-bbfb7e477051	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.503755
7d171f5a-23ea-4788-9bb5-d661352ac25a	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.506716
cd749e30-e7dd-41f1-a2fa-fbe1e029f267	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.5093
e7d99c0e-fe55-4a3c-a4c5-24636f92f4d9	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.512468
5eb7ba09-aac6-441f-a4f6-059ec71761eb	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.515543
85ba8cbd-32c6-4fa5-9198-5feb91469d9f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.517819
2617323b-1515-4181-90c2-df177d43a3b5	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.520237
703ee4c4-7d5a-451f-b50b-1e8b96c8bf2f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.522842
82482b23-b013-45a5-8c59-8038906ceb5a	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.525278
3c0bccfb-8d4a-4e20-a790-1b0f0c4b0ffe	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.527494
8f3b5345-b72e-4e05-8d70-a26296ff4a0f	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.529914
1ec07697-c287-4d63-9a44-4e212f4d372f	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.532387
2449ecf9-5dda-49fc-a9d9-0002b2fef500	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.534666
21e2a91c-2eed-4237-9692-9151fb92b3de	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.536923
129ce74e-df4a-4261-9a3b-7ad59f257a6f	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.539516
a296ac24-1b8a-4e28-8cf6-f2c9bb7d4c09	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.541844
5eccc721-6471-4760-b9f9-5e290c1f9d21	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.544093
b44aed29-ae3d-4568-bf20-3f58a79273ee	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.546413
9404b21a-0fee-4945-9964-8385f1912673	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.548778
b3cdaf16-3194-42be-a0bc-b997ee2bb40f	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.55105
0225a530-1e2a-49d3-afd7-0d81c509036e	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:14:57.553159
7054566a-4fc7-451f-a4f8-085d69c3b26c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.374324
bc10f5c0-1236-4eac-907e-ff60f3880ec9	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.3825
9fc822e9-c78f-4d33-a926-b54bb1aac5b4	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.386843
c4dd9cfd-a3a4-4590-89af-4fe396973fec	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.390149
986e1e99-d271-4a54-b995-93c9cc6d4b98	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.393524
3912cc6a-010c-448a-b1e6-931aa16c3418	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.396691
be48b33a-23fc-490c-a66c-70fab851488b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.400712
ce483071-b55f-4a3c-a8b2-89b4fcad9366	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.403381
3e09aabd-9e4c-417b-9ef0-ff4fcbef884b	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.406134
ee4bf50f-5afe-4f23-9817-4832edfabca2	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.408502
3a0eacbe-75c4-422b-b6d6-087e2fcb590f	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.410994
e8c15c70-c926-4c85-a46f-b65a403ae663	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.413871
96392cc6-aa88-4f69-9d63-ff077550d460	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.416521
d7793820-e6a5-4f71-a0b7-5f1cde8bd2ca	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.418975
07eee93e-6ae6-4521-9c0e-977b2bcdcb59	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.421408
9834e0b2-8c98-40a6-937f-b8c6fdc72ac2	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.424083
378a43a3-2752-4841-9844-cd70be5759e6	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.42671
6929dd22-f816-46f5-ad84-b0ed16347fd9	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.429628
e32ac0b8-798e-404d-b45a-da02afa63229	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.432137
1e2e1acc-92ed-4de1-850c-ddf40cec41a6	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.434793
401ee848-2472-40bc-94b0-f82a70b48edf	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.43747
7b1a4823-a8fa-4ebf-912a-5ab348a6baf9	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.440247
04918822-59ec-426a-a03a-60c106ef5739	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.442677
840f31ec-1b8d-423d-b591-d0afcf09433d	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.444926
10686368-4b7f-49e0-9ec7-c9179e8a042c	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.447196
c03e448e-0464-4aff-86d5-82513df11e62	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.449482
63c560e4-07e5-4341-a638-c34372eb3788	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.451636
dc606b1c-9c94-4fdc-80ff-faf3c0d6c0af	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.453994
95807fe4-3eab-446a-aa81-c4992d8f423b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.456734
e293a8bd-efb3-4882-95fe-f837edc981cd	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.459568
3e47a57a-137b-487f-9b26-6f08e40d4ff5	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.462028
ec2cd844-4a4b-4a31-9323-a3b1ee80e6c2	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.464673
eb735932-994d-46c7-b2e4-9a2775608156	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.46704
1b645178-98fc-44f6-9916-c16d81b7b9da	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.468806
a79be389-9071-43f7-8971-a2708197b71e	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-07 23:15:16.470878
70ec12ab-8863-4a8d-9b0f-bfb71e0bc7bb	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	924465087	19462331624	0.00	0.00	radacct	2026-04-07 23:16:22.40753
f856b756-cded-4c47-8121-f12daeae6c1e	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2379070988	19521564744	0.00	0.00	radacct	2026-04-07 23:16:22.413777
2784f8ec-967d-41e5-b09d-cca6791f9df8	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1752852518	40282048951	0.00	0.00	radacct	2026-04-07 23:16:22.415841
e9b35d24-eb15-4544-999f-46ca6c689304	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	485225577	3803229364	0.00	0.00	radacct	2026-04-07 23:16:22.418073
2a37d5ce-50e7-4b8c-88ed-71e03eab682b	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	856931276	14089855614	0.00	0.00	radacct	2026-04-07 23:16:22.420272
b80a5aa6-f63f-4f12-9662-e5bd75714ec8	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1109756977	14694259149	0.00	0.00	radacct	2026-04-07 23:16:22.422527
288ae4b7-7d00-4d06-9510-16ece9893fa8	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	749998389	12712456234	0.00	0.00	radacct	2026-04-07 23:16:22.424573
e162fbb2-eeb1-40da-bc30-68fc2abc98f4	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	689763517	13898398441	0.00	0.00	radacct	2026-04-07 23:16:22.426499
1fc199df-eccc-4ca4-9157-55d4a204adb1	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2744240759	20367911272	0.00	0.00	radacct	2026-04-07 23:16:22.428484
46f73394-9eab-47a0-8818-f55f511b9ecc	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406433363	10337672159	0.00	0.00	radacct	2026-04-07 23:16:22.430429
d0d763f3-07ac-4696-8b3a-98455322733e	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3360976060	17367324681	0.00	0.00	radacct	2026-04-07 23:16:22.432404
f419894a-5e61-4729-b0f0-da0db76ee3e2	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	716600968	5084860718	0.00	0.00	radacct	2026-04-07 23:16:22.434302
656aa6e0-ee1b-4f22-b315-a54cf8369336	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2428099388	16888178476	0.00	0.00	radacct	2026-04-07 23:16:22.43641
8892c741-ecbd-4161-bc00-1314235e5164	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1649990049	35032128271	0.00	0.00	radacct	2026-04-07 23:16:22.438741
67415baf-c2e7-421b-b0e9-f8a14ffc72c2	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2487398237	19565818401	0.00	0.00	radacct	2026-04-07 23:16:22.440711
2f3bd22b-79b9-4732-98c4-8513d661167c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772398148	12073392994	0.00	0.00	radacct	2026-04-07 23:16:22.442645
5a1f4085-64ba-4bdb-81f6-29aa456f57b3	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1346642868	12510158799	0.00	0.00	radacct	2026-04-07 23:16:22.444783
f86293c7-d83f-4cd4-94ad-258a13638530	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	586887476	13511668430	0.00	0.00	radacct	2026-04-07 23:16:22.44677
496e280f-35d8-4243-86db-2bf20b960337	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	582595022	8814603937	0.00	0.00	radacct	2026-04-07 23:16:22.4489
958dec37-fad6-4345-b84f-441c97742367	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618291825	10539951095	0.00	0.00	radacct	2026-04-07 23:16:22.451145
4fd8ffc2-6b8f-498f-ac09-938357e9e6bb	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1330820846	23490745444	0.00	0.00	radacct	2026-04-07 23:16:22.453097
5eff5062-e7c0-4a92-98ab-f9b98abbe77f	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2564825452	11223029869	0.00	0.00	radacct	2026-04-07 23:16:22.455365
6f92ec06-2e2f-49ff-83d0-ff65712f0b16	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3158229673	10546409755	0.00	0.00	radacct	2026-04-07 23:16:22.457298
0f7eb411-d5eb-4572-94fe-62091ea01da3	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2850993072	16092123463	0.00	0.00	radacct	2026-04-07 23:16:22.459326
47b0ff2d-819f-42db-bcce-343e9afb1086	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2507656582	14017029960	0.00	0.00	radacct	2026-04-07 23:16:22.461251
8b34e827-45ce-491c-bd8b-16609ab13004	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2172497454	18081723484	0.00	0.00	radacct	2026-04-07 23:16:22.463203
3f0f6eb8-39a4-436d-910f-5400423d35ed	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	567808927	6890258040	0.00	0.00	radacct	2026-04-07 23:16:22.465084
00959ba2-6ad4-44a0-881f-ec6ca080297d	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60772382	1880759708	0.00	0.00	radacct	2026-04-07 23:16:22.466924
c1964e87-82f3-4f61-acba-6cfa61cda023	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161546801	2955772731	0.00	0.00	radacct	2026-04-07 23:16:22.468877
c8a235e4-2304-44d9-a881-254fd7efa142	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	157301709	1215525478	0.00	0.00	radacct	2026-04-07 23:16:22.471003
46d550c3-d2e2-49d0-b54a-275f8af7831f	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	144921927	2423784281	0.00	0.00	radacct	2026-04-07 23:16:22.473274
e6e183e9-d2fc-4b54-8d5b-c4b5d3cad7bf	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	160346107	4210501472	0.00	0.00	radacct	2026-04-07 23:16:22.475205
e12d6ea7-8dd0-4a96-b367-8e49103d4af4	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	39042230	726885449	0.00	0.00	radacct	2026-04-07 23:16:22.477019
0332d96d-288a-4849-b455-f041d446a013	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64151818	1835988453	0.00	0.00	radacct	2026-04-07 23:16:22.478682
a3d86450-1795-41ad-9c99-7e1e1387e0c5	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	29391946	1075510532	0.00	0.00	radacct	2026-04-07 23:16:22.480443
a45bc02b-da54-430e-b087-b2f2ebee5bfa	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	925467684	19501090085	0.07	2.59	radacct	2026-04-07 23:18:22.26043
ebacb0e5-8eee-43b9-8704-8cde26fdfae5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2382468871	19560497029	0.23	2.60	radacct	2026-04-07 23:18:22.269593
65fd7499-20a3-49d1-8962-41fd2eedce90	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1754207300	40315543233	0.09	2.24	radacct	2026-04-07 23:18:22.271922
feb78cf2-2ce1-43b9-a683-d8606404fec5	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	485766806	3827516141	0.04	1.62	radacct	2026-04-07 23:18:22.274392
ed657dc4-5e01-43b9-8969-9e50edccebed	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857143184	14093634162	0.01	0.25	radacct	2026-04-07 23:18:22.276742
e70c209e-4793-4a01-abc3-1d7cb03d8a3e	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1112767067	14809625391	0.20	7.70	radacct	2026-04-07 23:18:22.279026
01eb548e-1066-4818-a577-667ed55da6ef	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	750187201	12712826364	0.01	0.02	radacct	2026-04-07 23:18:22.281416
df431ca5-3530-4b5d-b203-903ecc1f4d7c	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	689915752	13898739250	0.01	0.02	radacct	2026-04-07 23:18:22.28357
efe15570-1b2c-4df2-a42f-3a90a2803ae7	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2744274075	20368140260	0.00	0.02	radacct	2026-04-07 23:18:22.285644
432523d9-0f5d-46b6-bd4c-5d2307f3cc64	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406524433	10337754611	0.01	0.01	radacct	2026-04-07 23:18:22.287726
744b863c-098b-4ead-935f-9454ef9a4385	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3365936968	17375073045	0.33	0.52	radacct	2026-04-07 23:18:22.289931
2a8c82f0-05b7-4352-beee-cb9cda06ca6a	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	717026039	5099822629	0.03	1.00	radacct	2026-04-07 23:18:22.292241
79552100-c70d-40e0-94a9-84c511599c52	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2428804461	16915497190	0.05	1.82	radacct	2026-04-07 23:18:22.294768
ca8fa399-fcbe-43d2-abbb-2d92629088f6	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1650372989	35041951749	0.03	0.66	radacct	2026-04-07 23:18:22.296961
1e08fe13-d7e9-47ac-9cb0-5c2b2a2f6b95	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2487908686	19584943317	0.03	1.28	radacct	2026-04-07 23:18:22.299192
562c4ef6-c6ed-48df-982d-be2ea826ac8c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772401298	12073394514	0.00	0.00	radacct	2026-04-07 23:18:22.301464
7ae4c7bf-d549-4175-8b08-3cd0baaa71ed	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1347724043	12527938950	0.07	1.19	radacct	2026-04-07 23:18:22.303538
f1c1a2f0-8d48-4025-8c27-fd2d7468969b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	587441671	13535990419	0.04	1.62	radacct	2026-04-07 23:18:22.305594
7c488219-2dab-4404-a70e-4c2600fb8ef3	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	582853941	8815339219	0.02	0.05	radacct	2026-04-07 23:18:22.307826
1c9b92f4-4efc-4e01-bcfa-85be0a391cd9	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618332048	10540039929	0.00	0.01	radacct	2026-04-07 23:18:22.310038
cc07cc42-bc9c-4adf-bf83-a423c659e3aa	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1333323472	23544984456	0.17	3.62	radacct	2026-04-07 23:18:22.312205
68e74059-d7e1-49bb-ab17-5dd20f5dafeb	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2584638956	11236682694	1.32	0.91	radacct	2026-04-07 23:18:22.314346
765e29d6-eefd-4289-83ca-029973a801ce	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3160849241	10577266148	0.17	2.06	radacct	2026-04-07 23:18:22.316488
9745260c-7c05-4dc0-acb6-fc68c42af4b2	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851060190	16092185529	0.00	0.00	radacct	2026-04-07 23:18:22.318533
61408902-145f-4d13-9c84-3d92a5fd410c	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2508185934	14025850710	0.04	0.59	radacct	2026-04-07 23:18:22.320657
997aa438-8955-4d9d-8ca0-0b049b5be4e8	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2176826491	18101413142	0.29	1.31	radacct	2026-04-07 23:18:22.322954
96f60c4f-45cb-4eff-9881-9152f23298a6	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	570128850	6923127470	0.15	2.19	radacct	2026-04-07 23:18:22.325067
f62beba1-0822-4b19-9a44-2c55b4cf444b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60805111	1880820164	0.00	0.00	radacct	2026-04-07 23:18:22.327255
b1751ff2-ec63-4e76-9175-3e36f3a3a8ea	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161581939	2955810184	0.00	0.00	radacct	2026-04-07 23:18:22.329448
dae62dc9-e387-4d33-9abd-0ef61aeeaff4	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	161768536	1243150024	0.30	1.84	radacct	2026-04-07 23:18:22.331507
0f80085a-24f8-4355-b73a-f88fc1766ebe	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	145988740	2444543151	0.07	1.39	radacct	2026-04-07 23:18:22.333453
9fd304df-abe0-4d03-bd51-68215c8edd78	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	163629588	4267933454	0.22	3.83	radacct	2026-04-07 23:18:22.335391
5909fcf2-ac37-4988-81ee-420ab765eaae	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	39153697	728897304	0.01	0.13	radacct	2026-04-07 23:18:22.337458
01232db2-8e5e-48e8-bafd-f56460a83341	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64333779	1836291734	0.01	0.02	radacct	2026-04-07 23:18:22.339857
d0f0fb6d-ec71-4df8-a8f9-576b99fc709f	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	29980954	1117361199	0.04	2.79	radacct	2026-04-07 23:18:22.341906
4d27cbb4-09c3-4611-9e99-d737022f2cc3	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	925947191	19511407902	0.03	0.69	radacct	2026-04-07 23:20:22.406657
45d054aa-6c76-49c3-82ed-f18a92b11cc9	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2387696975	19619423652	0.35	3.92	radacct	2026-04-07 23:20:22.41604
931c73e1-8f73-457d-a707-0ef2e4890f01	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1757841457	40370511302	0.24	3.66	radacct	2026-04-07 23:20:22.418666
d88ab33f-75c9-4273-8803-39b9b875cc24	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	486367500	3866487174	0.04	2.59	radacct	2026-04-07 23:20:22.42129
a1451f78-8238-4e7a-ad45-8199bed9bf2d	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857167251	14093652752	0.00	0.00	radacct	2026-04-07 23:20:22.424373
84df97eb-3cff-468b-a356-81ed659fd442	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1113485626	14820326784	0.05	0.71	radacct	2026-04-07 23:20:22.427151
af3077e8-edb9-4db0-912d-e03fbdd10c02	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	750357398	12714633296	0.01	0.12	radacct	2026-04-07 23:20:22.42981
27a7c492-5c98-4103-a3b8-3d3881767b2f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	689965161	13898749293	0.00	0.00	radacct	2026-04-07 23:20:22.432414
d48f4796-0ffe-490c-9ae4-ee9d8eb5d51a	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2744329713	20368244040	0.00	0.01	radacct	2026-04-07 23:20:22.434882
66286d76-e5ee-44b4-b88d-d0f6d5c4faff	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406540152	10337775928	0.00	0.00	radacct	2026-04-07 23:20:22.437353
4850af2a-cb26-4ee5-88ee-70742baeba41	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3370893507	17380408440	0.33	0.36	radacct	2026-04-07 23:20:22.440068
8328df7c-67ae-4758-85b0-eb71239cc77b	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	717203192	5103035115	0.01	0.21	radacct	2026-04-07 23:20:22.442785
37090a5e-9e0d-49c1-813f-c1344896154d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2428992433	16919255899	0.01	0.25	radacct	2026-04-07 23:20:22.446327
958baa1c-b44d-42a0-b81d-aa845ad6b0b1	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1650930732	35052899762	0.04	0.73	radacct	2026-04-07 23:20:22.448911
2df47cc1-21c8-48d2-b0e1-fd3ea9783a34	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2488087777	19598552600	0.01	0.91	radacct	2026-04-07 23:20:22.45158
d7590158-eb3a-4ae8-b3f7-8bb362c0737f	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772406227	12073403725	0.00	0.00	radacct	2026-04-07 23:20:22.454038
b1ffea83-fd12-4d66-bcbd-4c81abd6035a	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1348453378	12547609632	0.05	1.31	radacct	2026-04-07 23:20:22.456545
4732224e-77a5-4516-8e03-a0916d357f90	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	588005219	13552369419	0.04	1.09	radacct	2026-04-07 23:20:22.459053
0630f428-19e3-420a-ab37-59af9eccad75	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	582862909	8815352312	0.00	0.00	radacct	2026-04-07 23:20:22.464821
4a439ba3-b22f-48dc-9b5e-bebff49aaf78	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618359841	10540097253	0.00	0.00	radacct	2026-04-07 23:20:22.4682
c180c853-eb06-488e-937a-2c0c4f4a471f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1335314660	23588317609	0.13	2.89	radacct	2026-04-07 23:20:22.470497
6458d25e-2c9e-4507-b1df-ffb699943fb3	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2625314042	11250066017	2.71	0.89	radacct	2026-04-07 23:20:22.47249
78494733-9321-4164-b0f6-d974ead90221	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3162733776	10607116626	0.13	1.99	radacct	2026-04-07 23:20:22.474478
635f8029-6700-4c91-aa61-0776e9f04ff2	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851066764	16092194511	0.00	0.00	radacct	2026-04-07 23:20:22.476659
e6c6d1fd-43d2-4fe9-8e46-7d32e4120f9f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2508687112	14035645646	0.03	0.65	radacct	2026-04-07 23:20:22.478888
b35ee159-071e-4d77-addc-fc617702d3c8	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2184008274	18160859712	0.48	3.96	radacct	2026-04-07 23:20:22.481408
0605fcc1-881e-46d9-af7e-2b9a2f74fed5	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	572034740	6960829181	0.13	2.51	radacct	2026-04-07 23:20:22.483995
aaf26aa5-2864-4bf9-a0c2-3d9dd82bebfd	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60824467	1880849354	0.00	0.00	radacct	2026-04-07 23:20:22.486652
c7769bfe-d4df-4357-9898-230f364152d4	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161652883	2956096574	0.00	0.02	radacct	2026-04-07 23:20:22.489172
6b3e26b5-ef3f-41bc-ab0d-350543c5c21b	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	163210435	1275833785	0.10	2.18	radacct	2026-04-07 23:20:22.492037
8e76dd26-ced7-4cdc-87ab-459d9d9d728d	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	162842463	2484739870	1.12	2.68	radacct	2026-04-07 23:20:22.494762
840cc016-5db5-4bd0-8cec-fbf22f8d976f	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	165913577	4338689762	0.15	4.71	radacct	2026-04-07 23:20:22.497079
ef59403a-c5fe-4b4f-9a5e-aacc53857f8d	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	39337648	729928926	0.01	0.07	radacct	2026-04-07 23:20:22.499206
04ca255b-8e44-4698-b554-3273bbe70d3e	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64372564	1836338473	0.00	0.00	radacct	2026-04-07 23:20:22.501182
63921e34-07a1-470a-af84-9d97f9ab09e5	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	30396096	1154779103	0.03	2.49	radacct	2026-04-07 23:20:22.503338
36301068-43af-4a29-80d2-6ef89d26a518	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3164075372	10627355734	0.00	0.00	radacct	2026-04-07 23:21:44.530429
ec254d04-b172-4b3d-98f7-02810da2d0d0	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	30714945	1189891004	0.00	0.00	radacct	2026-04-07 23:21:44.537623
9f9d185d-ad7c-47ec-b91a-5c6bbaca17b2	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	39372302	730630628	0.00	0.00	radacct	2026-04-07 23:21:44.539889
b8b4dbc7-cc9a-4342-81ba-09be042fa802	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851224646	16092230120	0.00	0.00	radacct	2026-04-07 23:21:44.541866
65c89879-d752-4b64-ab50-5680cc0b1c2e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	582874229	8815367517	0.00	0.00	radacct	2026-04-07 23:21:44.543603
444c4ff2-9165-489e-8873-824f304656a6	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64411437	1836391326	0.00	0.00	radacct	2026-04-07 23:21:44.545293
faf71fb4-6b3a-4255-b110-070512e9b334	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2389637868	19664384765	0.00	0.00	radacct	2026-04-07 23:21:44.547348
a8774c47-dbb6-419f-926c-b198be02f288	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618371094	10540116684	0.00	0.00	radacct	2026-04-07 23:21:44.549007
a354b517-237f-4ab0-ba17-bc1157ce6342	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1348862842	12558904665	0.00	0.00	radacct	2026-04-07 23:21:44.550792
e895a97b-8acc-48ff-9a4f-2dc921b4085e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	926523214	19532409757	0.00	0.00	radacct	2026-04-07 23:21:44.55313
d37d0b98-fe12-446c-b543-d7b0d16c562a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	487020261	3895315019	0.00	0.00	radacct	2026-04-07 23:21:44.555477
af690c25-a430-4908-871c-9e2708f39289	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	178941461	2518695855	0.00	0.00	radacct	2026-04-07 23:21:44.557408
7d2da933-fd50-4198-8627-6126a58a1bf5	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60825576	1880849933	0.00	0.00	radacct	2026-04-07 23:21:44.560229
5c20a4b4-6eb4-4c21-9504-13a7ea14a56e	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	589167656	13590289443	0.00	0.00	radacct	2026-04-07 23:21:44.561988
92d61faf-6611-42cc-af20-1c878e3c90ea	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	164251896	1288731052	0.00	0.00	radacct	2026-04-07 23:21:44.563752
acb05d27-7f3d-416a-bc4c-c8e0da799964	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2642886812	11257796941	0.00	0.00	radacct	2026-04-07 23:21:44.56532
6d9fe5b8-ab46-4e1e-bb11-cf40e80e351f	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161653801	2956097107	0.00	0.00	radacct	2026-04-07 23:21:44.566855
98358a9b-c279-4bfa-8676-0ad1a887d15d	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	717573449	5119907221	0.00	0.00	radacct	2026-04-07 23:21:44.569341
829f0ddc-244a-40e0-9fb0-07d277ae6cc9	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3375611803	17386316291	0.00	0.00	radacct	2026-04-07 23:21:44.571527
479e79ad-7c7f-4efa-9a8b-cf1d9ef465a0	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429040930	16919286435	0.00	0.00	radacct	2026-04-07 23:21:44.573491
720b067c-1a06-4b16-af09-5282f1a261db	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857230087	14093733632	0.00	0.00	radacct	2026-04-07 23:21:44.575111
64b3f6e8-fb40-420f-801c-9c2ec9bd7d35	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2509322783	14048693729	0.00	0.00	radacct	2026-04-07 23:21:44.576699
ea3d7e2c-7ad9-4edd-9184-b619b2405b89	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1113560810	14821362648	0.00	0.00	radacct	2026-04-07 23:21:44.578375
7ad53db8-e108-4675-bcd0-68e320fcb991	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690237920	13899585604	0.00	0.00	radacct	2026-04-07 23:21:44.579978
67f8acc3-5ec0-42bc-934f-36496f6c9eca	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406542413	10337781292	0.00	0.00	radacct	2026-04-07 23:21:44.58153
c18220cb-d224-43bd-87ef-35939ce24112	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	751350780	12725655494	0.00	0.00	radacct	2026-04-07 23:21:44.583197
41d6da54-4434-49a4-b799-ec2666fee91d	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1651411811	35059749985	0.00	0.00	radacct	2026-04-07 23:21:44.585372
315fc8ae-4494-4f27-9275-cfcd3f3f6c11	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1336223209	23602092943	0.00	0.00	radacct	2026-04-07 23:21:44.588196
b0878f8c-e304-49aa-b31c-ca33bdbd783f	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772434132	12073438221	0.00	0.00	radacct	2026-04-07 23:21:44.590165
b9ded76a-e3cf-460a-9bc4-65bce401fc05	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1759456156	40408590117	0.00	0.00	radacct	2026-04-07 23:21:44.591698
1db3efae-bc29-447d-9bcc-d21a2c046ea8	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	167218091	4371103859	0.00	0.00	radacct	2026-04-07 23:21:44.593317
9e5797b2-51a5-43fc-9308-117fef4c0f96	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2488438284	19607546626	0.00	0.00	radacct	2026-04-07 23:21:44.59485
b983d71a-68a1-4d78-88fb-24deac85fbfc	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2187087575	18189908858	0.00	0.00	radacct	2026-04-07 23:21:44.596384
d05cb75a-17df-478d-813d-c59c8b75fdf0	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2744348872	20368262654	0.00	0.00	radacct	2026-04-07 23:21:44.597871
13cd1fb1-bc1c-41a2-9e3c-35f8bdebf3e3	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	573022483	6979819986	0.00	0.00	radacct	2026-04-07 23:21:44.599373
1d6b93d2-2031-4c14-84d2-373b32f66729	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3165385576	10653426763	0.09	1.74	radacct	2026-04-07 23:23:44.443073
b1282811-0891-4f45-9c0f-240c82cff0be	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	32325385	1248677179	0.11	3.92	radacct	2026-04-07 23:23:44.450266
29846630-aea5-46db-8f6e-302ab16d45ac	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	40150132	738940152	0.05	0.55	radacct	2026-04-07 23:23:44.453094
272468ab-24e5-41e2-b1ce-dbcf41859a57	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851325029	16092378572	0.01	0.01	radacct	2026-04-07 23:23:44.455773
a6a6cf96-65cf-4540-8e32-c2fd4efa03dc	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583358896	8815524872	0.03	0.01	radacct	2026-04-07 23:23:44.458608
1381c12b-f4e9-4fb1-b59c-d79f836bc8e9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64433029	1836652341	0.00	0.02	radacct	2026-04-07 23:23:44.461263
3a135303-506a-48b8-97e1-6f56edfde580	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2393129424	19737121456	0.23	4.85	radacct	2026-04-07 23:23:44.463903
b0d6d533-db62-401e-80d8-c8c4fff0fc41	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618399010	10540145031	0.00	0.00	radacct	2026-04-07 23:23:44.466639
f888ae2f-b710-4880-a634-1c0f81a546a1	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1349104367	12569644492	0.02	0.72	radacct	2026-04-07 23:23:44.469383
2e26d9c4-718b-4a3c-a7c4-017b38171a3e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	927818501	19584864382	0.09	3.50	radacct	2026-04-07 23:23:44.47195
da5f1bbf-2aba-4d18-89db-8d2614102485	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	487693890	3933483414	0.04	2.55	radacct	2026-04-07 23:23:44.474539
b18e17bb-a272-4cbe-af89-aa1b637c87e3	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	179896573	2540115621	0.06	1.43	radacct	2026-04-07 23:23:44.477371
eab8e16f-0552-457d-bde1-8dbff98a5460	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60826759	1880851143	0.00	0.00	radacct	2026-04-07 23:23:44.480193
442b3413-89e6-4a73-96aa-fa8556744577	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	589865215	13619166985	0.05	1.93	radacct	2026-04-07 23:23:44.483112
8570766c-c2d5-4f96-a20e-fe53313006dc	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	164750289	1297887443	0.03	0.61	radacct	2026-04-07 23:23:44.485778
b33318e8-bc8d-45f3-825a-6b2014d084a6	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2650498091	11266047609	0.51	0.55	radacct	2026-04-07 23:23:44.488548
8f09d3d3-44ac-4e2e-a16e-6ef7db57f2ff	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161655157	2956099346	0.00	0.00	radacct	2026-04-07 23:23:44.491166
ba540aad-f340-4412-98e8-762d94d00ddc	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	717870306	5122121147	0.02	0.15	radacct	2026-04-07 23:23:44.493781
5139916b-b4e9-48e3-92b5-168f520290ec	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3381981692	17389952932	0.42	0.24	radacct	2026-04-07 23:23:44.496396
8d299ff5-bee9-4311-820a-dcecdc803993	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429090162	16919334830	0.00	0.00	radacct	2026-04-07 23:23:44.499198
9cac7b46-9f0a-47de-9249-152159b4ef0b	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857313668	14093889932	0.01	0.01	radacct	2026-04-07 23:23:44.501751
fc5e7683-0e84-4b34-8139-15f24cdc447f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2510540322	14079149898	0.08	2.03	radacct	2026-04-07 23:23:44.504382
c5c63b11-ce90-4e4d-abf8-146feacd7538	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1114598716	14847661426	0.07	1.75	radacct	2026-04-07 23:23:44.507012
0f5b6595-4d61-46b5-b32a-00d9b3af5b06	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690280083	13899594371	0.00	0.00	radacct	2026-04-07 23:23:44.509541
7dda1483-7ddc-4895-85ce-d22a781c9b75	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406547764	10337788483	0.00	0.00	radacct	2026-04-07 23:23:44.512139
763ae709-cd56-4172-8368-6dd9e875d18e	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	751815573	12728444419	0.03	0.19	radacct	2026-04-07 23:23:44.51471
b2451cd8-bab2-4b06-8d31-a867267ffa54	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1651893060	35068806022	0.03	0.60	radacct	2026-04-07 23:23:44.517332
dfacf1ee-37a8-4c8e-a5b8-e2f336b0222d	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1338051608	23638614953	0.12	2.44	radacct	2026-04-07 23:23:44.519853
8ad0675d-8df5-4ab8-908b-4464af48d7e3	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772448397	12073454760	0.00	0.00	radacct	2026-04-07 23:23:44.522378
efda54e8-dcf0-4f2b-9772-0950ba85a7c9	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1761297021	40443106733	0.12	2.30	radacct	2026-04-07 23:23:44.524857
1c1ad67d-0dcc-43b8-b342-f60ea2c17454	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	169482568	4439793060	0.15	4.58	radacct	2026-04-07 23:23:44.527345
cd64bb92-033c-481e-a512-fa891cdded21	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2488628018	19620026609	0.01	0.83	radacct	2026-04-07 23:23:44.529888
b65107f2-dc97-409c-bbf0-9a714e298db6	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2190195090	18234026916	0.21	2.94	radacct	2026-04-07 23:23:44.532396
0d2a7d61-bb65-4dae-a888-69489c9ba361	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2744795853	20369841812	0.03	0.11	radacct	2026-04-07 23:23:44.53483
ea3872ae-4d87-4adb-9a62-4468383f3251	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	574522173	7011136279	0.10	2.09	radacct	2026-04-07 23:23:44.537229
d7d87df2-b7eb-4406-8a42-18bf46e339e6	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3167607570	10681218639	0.15	1.85	radacct	2026-04-07 23:25:44.491541
e962f4ce-2873-4618-85f5-2d2f7639c1c7	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	33401174	1303630626	0.07	3.66	radacct	2026-04-07 23:25:44.501979
9d3ac815-2eef-4884-99f5-b586b96ff745	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	40659281	747978883	0.03	0.60	radacct	2026-04-07 23:25:44.504629
b1319868-8e92-4a73-97fe-debc36b63e57	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851354165	16092415878	0.00	0.00	radacct	2026-04-07 23:25:44.507309
15a313e5-4376-4267-9c71-eb263931f924	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583361125	8815534090	0.00	0.00	radacct	2026-04-07 23:25:44.510286
07699ce6-924c-4913-b033-fd3c188ba38a	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64495433	1836734795	0.00	0.01	radacct	2026-04-07 23:25:44.513099
ff16be4f-7d1f-4126-9c97-2ac6fa7a9a62	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2395606187	19803089499	0.17	4.40	radacct	2026-04-07 23:25:44.516119
4e545b03-7ea8-4204-815c-b5c7ae6e658f	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618403592	10540148549	0.00	0.00	radacct	2026-04-07 23:25:44.518794
9b428b45-68d3-4a02-bee6-58c393a5ded4	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1349900198	12588410691	0.05	1.25	radacct	2026-04-07 23:25:44.52138
1d746b2b-c88e-457b-8ae6-6e16559bbf53	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	928624536	19619531077	0.05	2.31	radacct	2026-04-07 23:25:44.524071
25c696dc-e060-47a8-8fe4-9aac686b6bef	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	488494010	3948306882	0.05	0.99	radacct	2026-04-07 23:25:44.527135
4a088dbe-68ff-4ce6-bf8a-6b2b00fe0333	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	181493625	2566858208	0.11	1.78	radacct	2026-04-07 23:25:44.529923
20c2fbb4-301d-46b8-abb2-4efd714087e2	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60843189	1880876056	0.00	0.00	radacct	2026-04-07 23:25:44.532693
dcecfe12-e566-4d7f-b261-0a4db22d9141	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	590541210	13643308349	0.05	1.61	radacct	2026-04-07 23:25:44.535205
b11ce9b4-f564-413c-88c6-a067150f73c9	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	166368703	1361591061	0.11	4.25	radacct	2026-04-07 23:25:44.537949
d36d4b11-bb35-4b24-bc64-f54bb36d7221	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2658318183	11281571687	0.52	1.03	radacct	2026-04-07 23:25:44.540899
e0c1d228-b4a6-4654-8cbf-51d8dcbc89de	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161918495	2956301736	0.02	0.01	radacct	2026-04-07 23:25:44.543834
e36a33a8-a738-483a-86f0-f505e878ec3d	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718350144	5129429647	0.03	0.49	radacct	2026-04-07 23:25:44.546541
4efd8f68-08e8-424e-ba66-31a341ae8e00	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3387085925	17397008490	0.34	0.47	radacct	2026-04-07 23:25:44.549334
7a6135d1-7324-4855-9c2b-b5143ec78260	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429252789	16922472289	0.01	0.21	radacct	2026-04-07 23:25:44.551866
cd8a5a45-515c-4c83-9fae-497bc97a947d	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857357944	14093939731	0.00	0.00	radacct	2026-04-07 23:25:44.554576
4c4bb47e-efd0-44f9-8125-5837e800b9f8	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2511552905	14095830223	0.07	1.11	radacct	2026-04-07 23:25:44.557206
c03fd2d5-c102-42f7-ab5c-b8d9f4511ed8	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1115879674	14877455858	0.09	1.99	radacct	2026-04-07 23:25:44.559747
7fd2512f-bd1c-4252-b1e9-4a0a170e9adb	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690332971	13899605473	0.00	0.00	radacct	2026-04-07 23:25:44.562702
d26c0c9a-c27e-4f64-8907-97cd23950fac	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406559027	10337806618	0.00	0.00	radacct	2026-04-07 23:25:44.564794
32add980-9a98-4f19-bad2-2dec9756ad95	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	752785813	12763569872	0.06	2.34	radacct	2026-04-07 23:25:44.567093
1c4b154c-2d71-4e94-bdf6-646b8486a537	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1652593983	35079997403	0.05	0.75	radacct	2026-04-07 23:25:44.569238
5ecd2640-346c-4445-8cbd-dab331a4599d	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1339437903	23653164029	0.09	0.97	radacct	2026-04-07 23:25:44.571565
b36f281c-f364-4f59-a741-a06b637eefe5	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772476730	12073502517	0.00	0.00	radacct	2026-04-07 23:25:44.573687
818988c4-6a42-47c0-9aa6-0ec86d40b25e	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1762167331	40468467947	0.06	1.69	radacct	2026-04-07 23:25:44.575816
44aaf704-25b3-4136-b415-5c1686551b12	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	170984988	4488362797	0.10	3.24	radacct	2026-04-07 23:25:44.578079
8fb0ba6b-a831-471b-af05-44ed3405da89	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2488787137	19632296276	0.01	0.82	radacct	2026-04-07 23:25:44.580194
78507bbb-7553-49c2-be80-fa4fc52087a5	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2193138640	18274306788	0.20	2.68	radacct	2026-04-07 23:25:44.582412
06cfa8ca-8d4f-46c3-bac7-cd02de4eb7d2	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2745179880	20372896964	0.03	0.20	radacct	2026-04-07 23:25:44.585254
c4f69eee-1696-4a86-814d-dbe9694db129	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	576265837	7028353228	0.12	1.15	radacct	2026-04-07 23:25:44.587569
e91f875d-9abb-47cf-8def-2a87ac9e8199	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3168931783	10706261154	0.00	0.00	radacct	2026-04-07 23:27:46.176738
2172e64b-deb7-460e-a23e-4b2748ff8a8f	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	34212555	1352063203	0.00	0.00	radacct	2026-04-07 23:27:46.184409
4b35d525-8c81-40d6-a208-c72fd21631c2	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	41250206	757619464	0.00	0.00	radacct	2026-04-07 23:27:46.186497
7ef49893-15e0-4077-8141-ea7fc9676a93	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851421608	16092479985	0.00	0.00	radacct	2026-04-07 23:27:46.188446
cf654f1d-740b-4bed-bf4f-bf3b28cd4154	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583377075	8815551741	0.00	0.00	radacct	2026-04-07 23:27:46.190865
4c70ddec-347d-4be8-9f75-a7e80cbed667	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64542547	1836831219	0.00	0.00	radacct	2026-04-07 23:27:46.19265
94bcfaef-5cb0-421f-9341-2bc1ea5d07f6	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2397608049	19851619142	0.00	0.00	radacct	2026-04-07 23:27:46.194729
8b2de3d3-5f79-4ea0-8bcb-153354ec2e0e	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618438633	10540199779	0.00	0.00	radacct	2026-04-07 23:27:46.196464
513c3386-9d5e-46a0-a2ba-80e5b38869a0	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1350185324	12598365302	0.00	0.00	radacct	2026-04-07 23:27:46.199027
f9d2835f-85c0-4a9d-b3fb-eb72611d334f	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	928686985	19621207288	0.00	0.00	radacct	2026-04-07 23:27:46.201007
c4b95490-5bdc-4efe-8355-1835c560d100	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	489186925	3960970251	0.00	0.00	radacct	2026-04-07 23:27:46.203083
5093bd03-91dd-4663-b055-2e1b7fa7c632	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	182277674	2582421140	0.00	0.00	radacct	2026-04-07 23:27:46.204773
c6db8637-08a1-43f2-b63f-acac1b06dfab	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60856915	1880890306	0.00	0.00	radacct	2026-04-07 23:27:46.206933
5d9ccd90-68e7-40fd-acb9-c61f22fc7b86	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	591430074	13677727440	0.00	0.00	radacct	2026-04-07 23:27:46.208694
61933d72-ef7a-4a2b-90b8-0e8875c8dbbf	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	167828409	1429816410	0.00	0.00	radacct	2026-04-07 23:27:46.21031
cbb16dbf-0534-49b5-866d-04f97b129cb5	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2665765061	11308854279	0.00	0.00	radacct	2026-04-07 23:27:46.211878
f5d96006-5a12-45d2-be82-440a5d871329	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161922038	2956308363	0.00	0.00	radacct	2026-04-07 23:27:46.213533
3390c67e-5745-47bf-8951-38df811e7200	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718585076	5131050969	0.00	0.00	radacct	2026-04-07 23:27:46.215832
5fd22478-2f98-4bf6-aba5-2df18ecaccc6	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3391017826	17404130536	0.00	0.00	radacct	2026-04-07 23:27:46.217925
8ddd4975-16a6-4766-a7e0-d17e8cd4f2b5	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429337969	16922593672	0.00	0.00	radacct	2026-04-07 23:27:46.220106
ce8ea52b-2915-4514-b11f-057d85007d17	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857601400	14094209588	0.00	0.00	radacct	2026-04-07 23:27:46.222001
abd140f0-09c0-4407-98a9-3c375db0feb6	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2512798315	14121203696	0.00	0.00	radacct	2026-04-07 23:27:46.223703
2ff327ee-f16e-4481-b399-a9825f67f80c	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1116802267	14896971277	0.00	0.00	radacct	2026-04-07 23:27:46.225256
6940a217-737d-4364-a64c-f894b3a14449	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690381994	13899614719	0.00	0.00	radacct	2026-04-07 23:27:46.226894
cfdca0ec-caca-455c-b09b-57052e8e743c	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406586470	10337894726	0.00	0.00	radacct	2026-04-07 23:27:46.228436
e1593954-c30e-478c-9f13-e6e5a0515be7	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	753204141	12765562185	0.00	0.00	radacct	2026-04-07 23:27:46.230021
99c44535-3c62-49f4-ab1c-76645cc831a5	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1653033613	35092727519	0.00	0.00	radacct	2026-04-07 23:27:46.232126
24d109e5-6e51-4ca6-9736-fb5c293b0290	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1340538658	23669917986	0.00	0.00	radacct	2026-04-07 23:27:46.234191
2091b46c-435b-4c68-bc8b-3a15f1513292	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772488714	12073510835	0.00	0.00	radacct	2026-04-07 23:27:46.236009
2e5980eb-5b0c-4456-9634-a37fd83e8d21	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1764606321	40512530050	0.00	0.00	radacct	2026-04-07 23:27:46.23787
e9ccfe2d-60d0-4e62-8534-e912b51e25c3	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	172853574	4533707623	0.00	0.00	radacct	2026-04-07 23:27:46.239404
a8ad6ea7-7359-40a9-84a2-28c73944c076	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2489222408	19646004005	0.00	0.00	radacct	2026-04-07 23:27:46.241077
d108b857-8d60-47da-ab1e-c8127323ce3e	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2198041411	18330106138	0.00	0.00	radacct	2026-04-07 23:27:46.242636
2786668a-07b5-411e-b939-841096bd7f48	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2745390421	20375310814	0.00	0.00	radacct	2026-04-07 23:27:46.244172
0bd94b67-6d9b-40ae-bfc5-cbc05f201b4c	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	578045826	7047822155	0.00	0.00	radacct	2026-04-07 23:27:46.245704
ac29193b-a447-4848-a5e5-ad7f3f0b4cfd	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3170074918	10731320497	0.08	1.67	radacct	2026-04-07 23:29:46.170236
153e2130-f876-4c4d-a5db-14c0e8d9bb8e	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	34822863	1374333169	0.04	1.48	radacct	2026-04-07 23:29:46.177885
5e7c1113-c531-4f3b-9eeb-b683a7fa5e39	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	41946494	770054951	0.05	0.83	radacct	2026-04-07 23:29:46.180763
6c7ac4d4-5a84-4f78-b0b5-0c0e798631e2	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851484316	16092651990	0.00	0.01	radacct	2026-04-07 23:29:46.183153
e7867efa-1b96-4b2c-9772-7b642e812739	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583377404	8815552934	0.00	0.00	radacct	2026-04-07 23:29:46.185423
216643e5-3fda-4cea-bddc-b59e377f05cb	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64680576	1837124392	0.01	0.02	radacct	2026-04-07 23:29:46.1877
75d205a2-63af-4b55-ab7b-23cbfa68df3b	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2397999237	19860573866	0.03	0.60	radacct	2026-04-07 23:29:46.190922
f0581ccf-5627-4d1b-9774-354e2b500785	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618460264	10540228292	0.00	0.00	radacct	2026-04-07 23:29:46.193619
acaf4d09-1a3d-4b99-a488-186b7e2673fb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1350282030	12598581636	0.01	0.01	radacct	2026-04-07 23:29:46.196119
24ce2b60-6f88-4d18-89eb-d3ba7ddb706a	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	929227908	19627541332	0.04	0.42	radacct	2026-04-07 23:29:46.199301
032b3543-54e5-47b8-af75-2749f7756fc2	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	490101655	3971662614	0.06	0.71	radacct	2026-04-07 23:29:46.201462
3398f22f-56b7-496c-89fa-1c53a182517c	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	182839840	2590025399	0.04	0.51	radacct	2026-04-07 23:29:46.203608
f2ebfddd-51b0-4123-9851-ee4c245dee24	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60867302	1880895559	0.00	0.00	radacct	2026-04-07 23:29:46.206182
cb81106d-4963-4ca0-a5f6-308a61834262	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	592606510	13717229875	0.08	2.63	radacct	2026-04-07 23:29:46.20843
549e744d-9e15-4b16-8a91-6348290e5f44	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	168334426	1441740808	0.03	0.80	radacct	2026-04-07 23:29:46.210761
cabbfe70-1364-4dec-b577-b1ee912b87d7	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2678922803	11331351164	0.88	1.50	radacct	2026-04-07 23:29:46.212872
25b8070e-86c2-4243-81f0-a76a47167b9a	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161946430	2956330862	0.00	0.00	radacct	2026-04-07 23:29:46.215803
9bd99c5d-1f4f-4c22-ad1e-548c49057ce3	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718665970	5131932765	0.01	0.06	radacct	2026-04-07 23:29:46.217974
1e98af01-1ad9-45d4-8e59-e7ea226e1b4a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3393821339	17407160766	0.19	0.20	radacct	2026-04-07 23:29:46.220399
a5c7d2a2-5718-447f-ab2c-059211b2a952	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429374051	16922618719	0.00	0.00	radacct	2026-04-07 23:29:46.222864
d91ca7d8-d455-4962-a7e1-23d23694b69f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857799659	14094461518	0.01	0.02	radacct	2026-04-07 23:29:46.225275
8396e864-1865-4f47-ba2c-d109b864a4ff	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2514417193	14154495254	0.11	2.22	radacct	2026-04-07 23:29:46.228301
70b180a5-5729-4154-8b51-ba97d16ab170	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1117799194	14916079887	0.07	1.27	radacct	2026-04-07 23:29:46.231118
7ce31b72-1e61-448c-af58-f79302dea0e8	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690426828	13899625180	0.00	0.00	radacct	2026-04-07 23:29:46.233565
7c58da10-ac1b-4d95-9c06-890645227643	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406826482	10341263765	0.02	0.22	radacct	2026-04-07 23:29:46.23582
2a3359d6-1b08-40f9-a522-85d8ed24d440	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	754984369	12811169647	0.12	3.04	radacct	2026-04-07 23:29:46.238005
071699e1-1ed8-498c-a9e3-7f1803e04b1c	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1653716927	35109572159	0.05	1.12	radacct	2026-04-07 23:29:46.24006
d4ff788c-379b-450b-bcb3-04a0d48d784c	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1341245706	23680694834	0.05	0.72	radacct	2026-04-07 23:29:46.242141
6b85351b-9210-49e6-acd7-54715e2fa232	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772619431	12073658783	0.01	0.01	radacct	2026-04-07 23:29:46.244515
3880073a-dfec-4520-8852-5307da1ab0c2	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1766013751	40542204814	0.09	1.98	radacct	2026-04-07 23:29:46.246741
ae7a2762-e5e1-470b-bd05-241be27c0afc	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	175692766	4593712274	0.19	4.00	radacct	2026-04-07 23:29:46.249356
e3df92ad-9d86-44f8-af78-623103edb5e1	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2489450128	19659560145	0.02	0.90	radacct	2026-04-07 23:29:46.251691
ee86e95e-42ec-4fd7-b8ed-6b9c0a239de3	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2201620597	18369646667	0.24	2.64	radacct	2026-04-07 23:29:46.254364
068a7934-fc79-4455-869d-3c26ebc71de0	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2746130237	20382387205	0.05	0.47	radacct	2026-04-07 23:29:46.256899
437afc3a-46e8-4605-886b-996f2c32e177	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	580386662	7083341140	0.16	2.37	radacct	2026-04-07 23:29:46.259199
d859da8a-7289-4dd4-882d-9db82eecdf8d	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3170621842	10742850008	0.04	0.77	radacct	2026-04-07 23:31:46.178593
c5263651-f50e-43d4-a6ca-e6b957f6550d	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	35035866	1383372575	0.01	0.60	radacct	2026-04-07 23:31:46.18581
759727d1-df75-4ea3-b6f9-3ac87f7a9c35	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	43036217	796286971	0.07	1.75	radacct	2026-04-07 23:31:46.188402
88e1bbff-21c2-4aec-a221-04a286a7a0ad	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851491334	16092672058	0.00	0.00	radacct	2026-04-07 23:31:46.191056
e65f6353-09db-4e3f-87df-a2fe3daf0c4a	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583377894	8815553951	0.00	0.00	radacct	2026-04-07 23:31:46.193772
f3be019e-c7ca-4c8a-a2f8-66ac13e006a6	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64702658	1837145043	0.00	0.00	radacct	2026-04-07 23:31:46.196709
8fd57766-47a5-431b-ad32-e9f102ea9229	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2398469912	19870900748	0.03	0.69	radacct	2026-04-07 23:31:46.199424
ba162d14-1fc7-406e-92bf-c0c65dfba69b	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618463426	10540231201	0.00	0.00	radacct	2026-04-07 23:31:46.202114
a3455ad0-8bd9-4219-82b2-4af1835a77da	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1355838901	12615325211	0.37	1.12	radacct	2026-04-07 23:31:46.20486
98ab4d0f-af80-4e21-8407-725370e18319	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	930063428	19659391819	0.06	2.12	radacct	2026-04-07 23:31:46.207426
16807a66-d267-40f8-9c94-b1f20063ed87	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	490823726	3984719410	0.05	0.87	radacct	2026-04-07 23:31:46.209962
f53691be-1462-4585-97c1-ee08b7a836b0	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	183554821	2599029951	0.05	0.60	radacct	2026-04-07 23:31:46.212888
7fb5d007-982d-479b-b95e-2a9609a93747	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60929559	1880978819	0.00	0.01	radacct	2026-04-07 23:31:46.2154
fb8ff3b7-2619-4e36-b23a-e6629d576b02	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	593609876	13753866308	0.07	2.44	radacct	2026-04-07 23:31:46.218033
bfbb4264-251a-410f-9bec-c9ebc9ab6284	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	168374467	1441791366	0.00	0.00	radacct	2026-04-07 23:31:46.220772
fb15394a-1c57-4641-b4ac-712753b186d1	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2701051695	11331962292	1.48	0.04	radacct	2026-04-07 23:31:46.223271
79dfab18-7446-4f50-8e1d-1af644bc2360	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161965470	2956362540	0.00	0.00	radacct	2026-04-07 23:31:46.225939
ea87240f-fd1e-485a-b647-7033c7423bad	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718677851	5131952000	0.00	0.00	radacct	2026-04-07 23:31:46.228543
a7852465-ba14-4951-95cf-90d39f698f17	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3397499680	17410812496	0.25	0.24	radacct	2026-04-07 23:31:46.231041
f15061e8-cfa0-4340-9175-688066cf69ef	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429420660	16922888682	0.00	0.02	radacct	2026-04-07 23:31:46.233469
42ec2657-2c3a-4823-998b-3bfcace8d817	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	857843838	14094520823	0.00	0.00	radacct	2026-04-07 23:31:46.236087
9df0ae81-1a54-4b55-97d4-545d580c2bfe	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515344382	14174425688	0.06	1.33	radacct	2026-04-07 23:31:46.23939
4957d6ac-faa8-475b-b601-c57c29ddabe4	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1120244742	14955500286	0.16	2.63	radacct	2026-04-07 23:31:46.242044
88b44aee-75a1-4971-bdcb-4af90b94a5e7	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690490608	13899650341	0.00	0.00	radacct	2026-04-07 23:31:46.244522
ab42a4c5-1cc4-40f9-b82c-da07bd0afe2c	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	406985177	10341454440	0.01	0.01	radacct	2026-04-07 23:31:46.246886
c4e93bcc-6400-4194-84e9-98f8839cc3b0	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755191723	12821645911	0.01	0.70	radacct	2026-04-07 23:31:46.249237
7e8e1bb2-2074-4198-a38a-a4188f47292b	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1654467985	35128424531	0.05	1.26	radacct	2026-04-07 23:31:46.251595
d8d86351-dead-43d0-8209-493412343fd7	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1342215514	23690778002	0.06	0.67	radacct	2026-04-07 23:31:46.253984
963b5b1d-c530-4706-8a6c-8a666d72cd83	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772636942	12073678647	0.00	0.00	radacct	2026-04-07 23:31:46.25637
a3f8a7e6-d92f-44a0-bb21-61a405451deb	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1767712037	40558926335	0.11	1.11	radacct	2026-04-07 23:31:46.25873
488c1236-bc12-40fb-b8e0-74db7b84b75a	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	177670764	4641511509	0.13	3.19	radacct	2026-04-07 23:31:46.261138
b8f69081-48de-4d14-8b25-d9139a14752b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2489617057	19672706311	0.01	0.88	radacct	2026-04-07 23:31:46.263437
60f3f421-a687-4bfd-92ff-f1f13fa22126	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2206501041	18396178706	0.33	1.77	radacct	2026-04-07 23:31:46.265754
8739387a-a307-4667-93b9-84367ee227ea	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2746693882	20389711201	0.04	0.49	radacct	2026-04-07 23:31:46.268133
51cc6509-7486-4631-83d4-8f5bf69776b4	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	582544962	7112396460	0.14	1.94	radacct	2026-04-07 23:31:46.270771
96c08b2a-eb48-413c-b46a-0ba708a21dbc	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3170965083	10751628478	0.02	0.59	radacct	2026-04-07 23:33:46.185383
225d002e-2cbf-4cfa-9060-6a8e46fc05f4	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	35267622	1393603737	0.02	0.68	radacct	2026-04-07 23:33:46.192557
9d27ce1d-7741-4123-bb00-e0031de5ee69	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	43764848	805564674	0.05	0.62	radacct	2026-04-07 23:33:46.195478
00e61c4e-70e2-4b73-8958-c83cdf86a7c6	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851537167	16092706131	0.00	0.00	radacct	2026-04-07 23:33:46.198038
124487ca-65fd-43b5-bfc6-24f34d1786ac	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583432656	8816402996	0.00	0.06	radacct	2026-04-07 23:33:46.200115
ec92cc4c-8f81-43b5-8c68-6f55c314be0e	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64708763	1837154669	0.00	0.00	radacct	2026-04-07 23:33:46.202216
64061571-66d7-47be-930d-1ce3faf9e7a8	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2398817607	19880881390	0.02	0.67	radacct	2026-04-07 23:33:46.204434
a6764aa3-018e-44b0-b04f-1a4bbdac33ff	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618466242	10540234054	0.00	0.00	radacct	2026-04-07 23:33:46.206563
e70d2de7-2c85-42be-8d61-c24fd035234c	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1357045483	12629462929	0.08	0.94	radacct	2026-04-07 23:33:46.209034
01e6dc7e-20fa-4bb8-b055-f91f1e82d8ea	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	930503058	19678367274	0.03	1.26	radacct	2026-04-07 23:33:46.211153
bdeba50e-6ba6-47e6-9eb7-a473b81b9b5d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	491493522	4016137971	0.04	2.09	radacct	2026-04-07 23:33:46.213211
8bfc4b3d-a322-4ccc-a8d2-0d2a0fdfd6b2	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	184422299	2604827225	0.06	0.39	radacct	2026-04-07 23:33:46.215229
ba7c4041-6bdd-49cf-954e-3119366952c1	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60930674	1880993076	0.00	0.00	radacct	2026-04-07 23:33:46.217318
9a2576c8-eb3b-4402-a91d-e41ded95054d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	594508000	13789484780	0.06	2.37	radacct	2026-04-07 23:33:46.219681
7c3a205f-d2ea-45dc-82f2-fe3023a7cff0	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	168498398	1442681554	0.01	0.06	radacct	2026-04-07 23:33:46.22175
37da0d48-ad3c-4c8f-81a7-b6e1a9342d26	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2716886326	11408768709	1.06	5.12	radacct	2026-04-07 23:33:46.224138
022e9187-ab77-44eb-8356-7861338cbc4b	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	161971080	2956374284	0.00	0.00	radacct	2026-04-07 23:33:46.226607
276e3fe6-ff9c-4339-99b7-29c75330c1b1	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718681731	5131957848	0.00	0.00	radacct	2026-04-07 23:33:46.228864
351df2ac-f300-4f5f-b706-cafd1c03d295	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3399908602	17413218142	0.16	0.16	radacct	2026-04-07 23:33:46.230917
1cfb854c-dae4-4de9-a21a-ac13466176d0	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429502783	16922943543	0.01	0.00	radacct	2026-04-07 23:33:46.232939
04d767d3-684a-48ab-8670-b29eb962ecc1	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858025618	14095516657	0.01	0.07	radacct	2026-04-07 23:33:46.235132
b631d5c7-611c-46e1-b566-a13e31101ebb	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515756545	14180058488	0.03	0.38	radacct	2026-04-07 23:33:46.237218
68063a3a-e396-4d06-aa3e-373ba3dadd0a	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1121066378	14973098269	0.05	1.17	radacct	2026-04-07 23:33:46.239426
e6e5f950-d64c-4a3f-a81e-778dcff6a6ec	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690548136	13899759009	0.00	0.01	radacct	2026-04-07 23:33:46.242024
fbae2bf3-0767-47da-b1f6-d45316dd4d83	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407018570	10341511777	0.00	0.00	radacct	2026-04-07 23:33:46.244008
58274a63-0d20-4606-b1a9-851b8bddfba2	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755326310	12823532361	0.01	0.13	radacct	2026-04-07 23:33:46.246117
82018467-b695-41f9-bca8-738f4a5bc87c	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655314607	35140560952	0.06	0.81	radacct	2026-04-07 23:33:46.24831
f721c27a-1198-4837-b298-ff26bcd9e6a7	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1342743132	23701960849	0.04	0.75	radacct	2026-04-07 23:33:46.25025
57e04f68-b48e-48a8-80d9-3555d440e5a2	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772642244	12073686764	0.00	0.00	radacct	2026-04-07 23:33:46.252188
9a9fcde1-1efe-41e8-b93e-4b6921bc54a8	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1769999790	40595620309	0.15	2.45	radacct	2026-04-07 23:33:46.254121
8d2d308c-cc21-4026-b748-ef4629122410	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	179855625	4694690031	0.15	3.54	radacct	2026-04-07 23:33:46.256202
a559f8bd-9698-4add-b4f3-482d8ac4682f	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2489826532	19685683209	0.01	0.87	radacct	2026-04-07 23:33:46.258185
e828388f-2b14-4c10-a3f0-b009a13cdf0c	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2212275222	18416539168	0.38	1.36	radacct	2026-04-07 23:33:46.260084
88de818a-5494-4c54-8c9a-e718ee3fd9fc	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2746864170	20389855795	0.01	0.01	radacct	2026-04-07 23:33:46.262107
f5eb3dd8-e5aa-4438-a0db-b1cf12ff41c4	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	584370069	7139279822	0.12	1.79	radacct	2026-04-07 23:33:46.264132
a4862d8c-f2cc-4427-8efd-d610a4d98242	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3171569827	10761905787	0.04	0.68	radacct	2026-04-07 23:35:46.23793
064e3052-8d5c-4534-8435-a95f17584391	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	35604712	1401100699	0.02	0.50	radacct	2026-04-07 23:35:46.248413
83dc1ff3-9721-4d66-92ea-0faf47a30067	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	44123963	813288774	0.02	0.51	radacct	2026-04-07 23:35:46.251059
00a6cdd2-e865-4876-a018-5b729a23b175	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851556171	16092733627	0.00	0.00	radacct	2026-04-07 23:35:46.253644
21c306b2-bd03-4668-adaf-3b45ffe7753b	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583447105	8816422061	0.00	0.00	radacct	2026-04-07 23:35:46.25622
519fa53f-b464-4972-8d1d-8cfdef762eb9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64723312	1837185412	0.00	0.00	radacct	2026-04-07 23:35:46.258864
d183d226-30c1-4fbb-989c-4c1545213c77	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2399139475	19887937260	0.02	0.47	radacct	2026-04-07 23:35:46.26226
fdf7d6ad-ce31-4448-9581-f558bfc3046d	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618491960	10540261285	0.00	0.00	radacct	2026-04-07 23:35:46.264746
8de1b9ca-cdf3-4db2-b326-85c70baffe73	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1361375965	12657262203	0.29	1.85	radacct	2026-04-07 23:35:46.267342
02a09ee9-1c99-44a8-8177-a7d606e97817	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	930538666	19678533759	0.00	0.01	radacct	2026-04-07 23:35:46.270156
713f6136-7c86-4ebc-b5fe-1a7e65ccdf3a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	491921193	4027460941	0.03	0.75	radacct	2026-04-07 23:35:46.27323
9a2fea77-575f-4090-9cfd-524678238f50	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	185245916	2618356797	0.05	0.90	radacct	2026-04-07 23:35:46.275808
1838bf10-2a72-47af-b899-aed604805439	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60933605	1880997456	0.00	0.00	radacct	2026-04-07 23:35:46.279442
10ad4afa-7229-46aa-8362-8a4ebeb2631f	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	595241630	13821995795	0.05	2.17	radacct	2026-04-07 23:35:46.281846
2a4f6cc0-055d-440c-89d6-e27d4b65a9e1	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	168853641	1443962016	0.02	0.09	radacct	2026-04-07 23:35:46.284146
0d56a5ef-e1a2-4b53-b36d-9f5d79b561a3	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2732334457	11409417664	1.03	0.04	radacct	2026-04-07 23:35:46.286584
78ffe9d3-594c-4148-9826-5aabbc225b84	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162071025	2956849896	0.01	0.03	radacct	2026-04-07 23:35:46.289033
92990c79-33c1-4ce2-8e52-001aadb8d8a3	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718692737	5131978616	0.00	0.00	radacct	2026-04-07 23:35:46.291447
7874a9ed-ac3d-422d-92e6-5ce09edc9913	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3402262838	17415836176	0.16	0.17	radacct	2026-04-07 23:35:46.29459
3cdaa935-3b63-45b6-b959-b0ebb0cab22e	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429552455	16922976673	0.00	0.00	radacct	2026-04-07 23:35:46.297229
d0b5985b-4ff4-4c7a-a28f-33fc3444cb44	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858073788	14095565107	0.00	0.00	radacct	2026-04-07 23:35:46.299723
a055930a-fde5-4b82-83e8-9db84d725f9f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515810067	14180114969	0.00	0.00	radacct	2026-04-07 23:35:46.302495
aaec1744-bb05-415e-8998-b51bf8309c50	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1123315776	15042547673	0.15	4.63	radacct	2026-04-07 23:35:46.304909
f6fbfc27-de0a-46e2-bc7e-e19a8a4a70bb	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690754187	13900017020	0.01	0.02	radacct	2026-04-07 23:35:46.30735
5d8844f0-6022-4c72-a3aa-9645cbac5f90	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407216149	10341813796	0.01	0.02	radacct	2026-04-07 23:35:46.310095
7493dae2-c7b5-4a39-b1f8-1b5bcea7dbdd	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755376814	12823640890	0.00	0.01	radacct	2026-04-07 23:35:46.312803
0eacc41b-476e-46c2-acd7-dd52d2c2e994	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655405546	35140798370	0.01	0.02	radacct	2026-04-07 23:35:46.315074
8d544882-9517-40ad-b034-dea8488cc7ae	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1343505855	23713152297	0.05	0.75	radacct	2026-04-07 23:35:46.317473
9e9b5471-447b-4541-9adc-751ce794113e	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772673623	12073740959	0.00	0.00	radacct	2026-04-07 23:35:46.319902
7d656070-8fe8-4a77-850b-49e75005ff0f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1771625458	40613398535	0.11	1.18	radacct	2026-04-07 23:35:46.322358
dce272a7-3c3f-4093-97cf-7e2fd8dc4381	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	181798293	4741320268	0.13	3.11	radacct	2026-04-07 23:35:46.324812
d5ca68fc-fcec-4902-b1e7-cca6908ed516	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2490043520	19698283343	0.01	0.84	radacct	2026-04-07 23:35:46.328066
474b7667-9158-424f-85b5-5f0713026392	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2217948112	18435878977	0.38	1.29	radacct	2026-04-07 23:35:46.330321
46b5a425-4a36-41cc-9b3f-9b1e7dbbb08c	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2746880690	20389878639	0.00	0.00	radacct	2026-04-07 23:35:46.332226
fa8a56a4-959a-4d53-90b3-271660d995fa	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	586527419	7178442708	0.14	2.61	radacct	2026-04-07 23:35:46.33416
bd243265-6ce6-4367-8156-f43702b7c4ca	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3171922929	10772852689	0.02	0.73	radacct	2026-04-07 23:37:46.24746
03b0db64-e5c2-46a4-8ccb-e9408b036ae3	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	35845153	1411532627	0.02	0.70	radacct	2026-04-07 23:37:46.25796
d7150fa4-e89c-42c8-b080-0539577f5ff5	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	44821965	827603183	0.05	0.95	radacct	2026-04-07 23:37:46.260743
8e894cde-3fe7-4503-b1be-136d16dd3794	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851708470	16092964874	0.01	0.02	radacct	2026-04-07 23:37:46.26313
fd41770f-6d11-400d-b122-bd06ee6bec7b	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583458357	8816432021	0.00	0.00	radacct	2026-04-07 23:37:46.265189
e5911226-ef8c-4302-a4d4-b208757ea230	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64764814	1837522121	0.00	0.02	radacct	2026-04-07 23:37:46.268153
2c6c137c-2081-4678-943d-3df28d93b9b8	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2399897183	19895720068	0.05	0.52	radacct	2026-04-07 23:37:46.270932
36ba55c9-19e5-4628-bb07-988facec3ad2	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618504242	10540275649	0.00	0.00	radacct	2026-04-07 23:37:46.27375
343525c6-c0b2-44e7-b896-05bac6b33e37	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1372589778	12667908413	0.75	0.71	radacct	2026-04-07 23:37:46.276834
d49b7662-a599-4796-aa76-a10a962a5a42	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	931274608	19692656618	0.05	0.94	radacct	2026-04-07 23:37:46.27907
012c4fab-4174-45f1-ba88-8b676f6b7b7a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	492249357	4047334375	0.02	1.32	radacct	2026-04-07 23:37:46.281841
2af3b5c3-1b07-4efe-a645-e25755487f9a	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	185813392	2621504326	0.04	0.21	radacct	2026-04-07 23:37:46.28455
3213048f-b247-4794-aeaa-0f1926cfc2e6	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60934785	1880998711	0.00	0.00	radacct	2026-04-07 23:37:46.287123
378fe95a-577e-4c9c-a4c0-6de3a9ef697e	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	596074069	13855684694	0.06	2.25	radacct	2026-04-07 23:37:46.289666
46572a6b-fbcc-412e-ad4b-a697f40af7bc	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	169310999	1447923601	0.03	0.26	radacct	2026-04-07 23:37:46.291735
9357b7fd-5654-4a51-9f22-637ccf70dc3c	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2747635819	11409713732	1.02	0.02	radacct	2026-04-07 23:37:46.294241
44a74fa9-272a-45c9-b825-27dedfe515be	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162131550	2956917638	0.00	0.00	radacct	2026-04-07 23:37:46.296385
a1db7997-8883-4034-8fa9-240cb11ee3fa	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718694246	5131980344	0.00	0.00	radacct	2026-04-07 23:37:46.298396
9c7e2a0d-acc5-407a-b287-277f513c1d86	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3404511479	17418369645	0.15	0.17	radacct	2026-04-07 23:37:46.30121
aa3eb80c-d448-454a-bf5a-21da6314aff9	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429633777	16923046752	0.01	0.00	radacct	2026-04-07 23:37:46.303593
313d23d5-8e99-4bc8-bc70-20b19a0ed694	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858143614	14095665989	0.00	0.01	radacct	2026-04-07 23:37:46.306042
0c66ca34-45d0-4714-b238-4065e5e6cb27	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515842863	14180134742	0.00	0.00	radacct	2026-04-07 23:37:46.308484
e89c1ac7-7237-4505-bd12-523db00f3b86	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1125076946	15106247116	0.12	4.25	radacct	2026-04-07 23:37:46.310797
25b54a75-92b9-43d6-b135-cf2c9759afe8	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690841398	13900092763	0.01	0.01	radacct	2026-04-07 23:37:46.312793
7825ab03-81da-44d0-b0b9-6fe6498a77fe	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407311834	10341985944	0.01	0.01	radacct	2026-04-07 23:37:46.31472
6ab051cf-b8b0-493b-8f26-f6e90323b9bc	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755404277	12823679520	0.00	0.00	radacct	2026-04-07 23:37:46.317789
702f1d87-5bcf-4c30-893a-c66b3bdb1f1f	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655489597	35140974485	0.01	0.01	radacct	2026-04-07 23:37:46.320326
286de20f-8038-4a84-a71d-7e34fc03b89e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1344909434	23753893910	0.09	2.72	radacct	2026-04-07 23:37:46.322321
0089d18e-9d34-44f2-bfc9-d6623193467c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772674510	12073741585	0.00	0.00	radacct	2026-04-07 23:37:46.324512
068c98e0-0ffe-4cdc-8b7f-c98b6b5d980f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1774820961	40663287276	0.21	3.33	radacct	2026-04-07 23:37:46.326916
406c5d61-0b18-402d-8710-1775ab445db2	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	185343384	4865668332	0.24	8.29	radacct	2026-04-07 23:37:46.328921
8019063b-2ddc-4302-8dc0-7eee5867941c	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2490250804	19711452477	0.01	0.88	radacct	2026-04-07 23:37:46.330844
2df2b4a3-6813-4037-9026-b2a6f3180cc9	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2224476148	18467631553	0.44	2.12	radacct	2026-04-07 23:37:46.333529
23d48a55-fbb8-4116-bdeb-1c2dd9b81007	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2747652585	20390006700	0.05	0.01	radacct	2026-04-07 23:37:46.335976
7b6bb6e1-092f-4cb6-80d3-0f2ce7b66694	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	590140530	7224759774	0.24	3.09	radacct	2026-04-07 23:37:46.338252
820a0ead-39a0-4804-93d9-cd9d89f294ae	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3172123049	10773748586	0.01	0.06	radacct	2026-04-07 23:39:46.264644
67bad71a-d0af-470c-bfb9-e8058fd0a840	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	35969434	1419404477	0.01	0.52	radacct	2026-04-07 23:39:46.274385
20bd051c-6d2c-4515-b1db-c4d6da7b279c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45496545	840092846	0.04	0.83	radacct	2026-04-07 23:39:46.277076
ad3d29f2-dbcb-4726-bb32-946cae5660c3	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851819084	16093520140	0.01	0.04	radacct	2026-04-07 23:39:46.279834
c18ec70a-9b82-45bc-a650-7f675c85ed50	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583458873	8816432545	0.00	0.00	radacct	2026-04-07 23:39:46.282384
9b234d45-5a64-4b19-a6f6-d329c4d46766	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64776843	1837539141	0.00	0.00	radacct	2026-04-07 23:39:46.284893
3689d211-6843-4791-a41f-ccc620a7a7a6	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2400967789	19917622215	0.07	1.46	radacct	2026-04-07 23:39:46.288178
ce23731d-c664-4432-b565-940e54cd6c5b	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618528403	10540337137	0.00	0.00	radacct	2026-04-07 23:39:46.290809
d6716ddc-8e6c-45aa-9ad9-5559aa604ab5	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1378039367	12679417201	0.36	0.77	radacct	2026-04-07 23:39:46.293465
2f2190f2-effa-42ab-baf3-9c34d90d71bd	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	931513036	19693931654	0.02	0.08	radacct	2026-04-07 23:39:46.296003
3eadcc69-f1af-4dc0-979e-1240b2a5156d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	493210222	4095159634	0.06	3.19	radacct	2026-04-07 23:39:46.298659
71b12a8f-c81c-47e7-83be-c095c828a062	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	186498603	2630206020	0.05	0.58	radacct	2026-04-07 23:39:46.301128
5732375b-0edf-43be-9436-29fd88ea0a67	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60935900	1880999884	0.00	0.00	radacct	2026-04-07 23:39:46.304055
7aa966cd-9a46-4dd9-9780-fbe5261d0a33	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	597388765	13896026815	0.09	2.69	radacct	2026-04-07 23:39:46.306365
63904824-41be-408e-9955-42c1db153f31	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	169527731	1448516575	0.01	0.04	radacct	2026-04-07 23:39:46.308912
3e64b00e-c00f-4c30-b8a2-62851b7a7711	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2760095719	11410062810	0.83	0.02	radacct	2026-04-07 23:39:46.311146
2fdbbdc4-7ffa-4fd7-84a1-8ceefbd49126	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162163724	2956944141	0.00	0.00	radacct	2026-04-07 23:39:46.313407
47e701fd-fef0-4036-a0e6-d2de8d8e2de1	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718699935	5131984331	0.00	0.00	radacct	2026-04-07 23:39:46.315649
c75ec72f-0d2d-41ad-a01b-20dfc56169dc	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3407894289	17422472520	0.23	0.27	radacct	2026-04-07 23:39:46.318221
dd5fc8ba-0423-4083-8943-97af41b2c966	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429691968	16923147928	0.00	0.01	radacct	2026-04-07 23:39:46.320553
1b74b58e-64a9-42f3-a428-c14b8ccb4759	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858196946	14095967932	0.00	0.02	radacct	2026-04-07 23:39:46.323021
198174cf-8e5f-4c15-a5b7-9c5300afce86	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515908030	14180197209	0.00	0.00	radacct	2026-04-07 23:39:46.325768
b59418d1-fc89-4e95-9f06-9839e8bdd1ac	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1125692599	15122819950	0.04	1.10	radacct	2026-04-07 23:39:46.328194
104bd95a-fdf3-42cc-93d7-dce719e293b5	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690899622	13900118997	0.00	0.00	radacct	2026-04-07 23:39:46.33051
2fba166e-2a8b-4d87-b162-9b93c9acba96	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407312412	10341986710	0.00	0.00	radacct	2026-04-07 23:39:46.3328
ae634991-7f3c-4986-b305-9d2e9e37f9ea	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755413698	12823694432	0.00	0.00	radacct	2026-04-07 23:39:46.335217
c7a2e71c-c164-48b3-a0cc-dfafe52d81b4	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655676512	35141201325	0.01	0.02	radacct	2026-04-07 23:39:46.337488
b2468992-2f5e-4c14-ad56-5b1abb570000	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1346110591	23790794325	0.08	2.46	radacct	2026-04-07 23:39:46.339769
cac74495-1b38-439a-81dc-c6aeb58b1939	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772732175	12073837262	0.00	0.01	radacct	2026-04-07 23:39:46.342102
b949ece4-7fd8-4c84-ab68-4dee1a778b0c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1776961570	40712498333	0.14	3.28	radacct	2026-04-07 23:39:46.344582
cd2230d4-4ff4-455d-b453-a11a976facab	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	187870888	4936142426	0.17	4.70	radacct	2026-04-07 23:39:46.346984
8c0cfd10-1daf-4359-9b41-3a970e10060b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2490544687	19725588367	0.02	0.94	radacct	2026-04-07 23:39:46.34947
9bdb6011-42db-447e-8d84-eb2a1ad498f7	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2228989140	18521574104	0.30	3.60	radacct	2026-04-07 23:39:46.351805
08e49df3-0855-4515-922d-6c8dbf3761de	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2747739959	20390128965	0.01	0.01	radacct	2026-04-07 23:39:46.354139
ce57b1c1-b38e-4fe5-8d45-1b60e011ea7a	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	593355275	7257681620	0.21	2.19	radacct	2026-04-07 23:39:46.356433
f451152e-9156-4091-a550-e918b36ce010	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3173175165	10796124770	0.07	1.49	radacct	2026-04-07 23:41:46.262106
413ca064-b53b-4c6a-a315-5915faa55ab4	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	36241613	1425722572	0.02	0.42	radacct	2026-04-07 23:41:46.272639
a1e921e4-1702-49c3-8b91-a6290d1c5157	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45525072	840113590	0.00	0.00	radacct	2026-04-07 23:41:46.274852
7b02d583-92d6-4717-a2b9-fc80b822c9b2	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851831287	16093548249	0.00	0.00	radacct	2026-04-07 23:41:46.277186
40c904b8-da43-49a5-b348-fb39cafb58fe	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583495517	8816495446	0.00	0.00	radacct	2026-04-07 23:41:46.279497
959494db-8759-4e6e-9c56-706b4ebabdd4	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	64870257	1837630884	0.01	0.01	radacct	2026-04-07 23:41:46.281837
f4323e0d-370c-4981-b8fe-148339342dcf	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2402059803	19930198647	0.07	0.84	radacct	2026-04-07 23:41:46.283912
cb3bd5a6-408b-4967-bcfe-10119fbe8866	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618531589	10540339366	0.00	0.00	radacct	2026-04-07 23:41:46.28603
9d110e58-9b21-42e3-a559-fc2c4c289beb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1386557294	12690700168	0.57	0.75	radacct	2026-04-07 23:41:46.288493
fdc8fb4f-ecce-4e0a-9250-0fe99bfc872f	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	932014820	19709527215	0.03	1.04	radacct	2026-04-07 23:41:46.290644
e6d7f95e-a149-4691-b6f7-e34e5b44d5c5	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	493503800	4106550989	0.02	0.76	radacct	2026-04-07 23:41:46.292704
b6ead30c-f303-41b5-bed5-ba416a64199e	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	187454356	2648062395	0.06	1.19	radacct	2026-04-07 23:41:46.2952
31a3e095-743c-41e7-ac73-ee02e6efde66	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60941609	1881006582	0.00	0.00	radacct	2026-04-07 23:41:46.297408
b4033fcd-fa13-485d-a4af-b833c8fdffca	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	598566883	13917971115	0.08	1.46	radacct	2026-04-07 23:41:46.299405
bbd125e9-507c-42dd-814a-ad3bf8520cb7	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	170038381	1450618867	0.03	0.14	radacct	2026-04-07 23:41:46.30164
9de41b84-3f75-4c43-87c5-2a11cec3312f	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2770253619	11411710996	0.68	0.11	radacct	2026-04-07 23:41:46.303988
1ca59fde-e66e-4375-9203-2a74ee2a80bb	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162220415	2957017314	0.00	0.00	radacct	2026-04-07 23:41:46.306087
843ba01a-7f4e-4fa7-8389-6e9e8a78ca47	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718717016	5132173041	0.00	0.01	radacct	2026-04-07 23:41:46.308441
6f433faf-e9d6-4e9c-8414-34ad79b04567	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3410619649	17425714789	0.18	0.22	radacct	2026-04-07 23:41:46.310492
2cb36a40-6250-415c-8af2-ecd0dd174a72	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429729194	16923176349	0.00	0.00	radacct	2026-04-07 23:41:46.312461
dcdf0df5-aa11-4897-bcb7-2f961a3aa406	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858661198	14096913821	0.03	0.06	radacct	2026-04-07 23:41:46.314697
38a735fa-9310-482b-b2c1-4142eb374f2a	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515962022	14180276140	0.00	0.01	radacct	2026-04-07 23:41:46.316849
b3615b28-c797-43d8-8739-6655f29c34c5	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1129018441	15142890613	0.22	1.34	radacct	2026-04-07 23:41:46.318785
31e0114b-c07f-4579-b19f-1e577806575d	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690943539	13900129966	0.00	0.00	radacct	2026-04-07 23:41:46.320738
0fcccb02-2f50-4e30-9360-6f34c942f3f4	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407312764	10341986994	0.00	0.00	radacct	2026-04-07 23:41:46.322729
98684cae-f23e-4625-a1c1-23f2c101ac2f	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755430052	12823715391	0.00	0.00	radacct	2026-04-07 23:41:46.324819
58fbe056-dd11-4fdf-bdd1-3382d8d9075f	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655742596	35141324406	0.00	0.01	radacct	2026-04-07 23:41:46.326953
b48d6c43-dfa4-4f26-af75-389f186ec8ad	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1348096853	23816047772	0.13	1.68	radacct	2026-04-07 23:41:46.328856
0b449fba-d887-4948-8ea9-51fff9098cb6	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772733953	12073838888	0.00	0.00	radacct	2026-04-07 23:41:46.330819
f2fd7f84-503d-4648-a34b-f3687983d301	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1778231756	40735556302	0.08	1.54	radacct	2026-04-07 23:41:46.332713
d487c77a-1ea8-4177-8a5c-fd61bf38812c	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	189657796	4986790972	0.12	3.38	radacct	2026-04-07 23:41:46.334587
e8c245b2-9d07-499f-bf16-0c1cba71d894	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491028534	19747504881	0.03	1.46	radacct	2026-04-07 23:41:46.33654
eea16d89-7971-4c7f-b6fd-5b8d2f3dc24e	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2233990972	18550290352	0.33	1.91	radacct	2026-04-07 23:41:46.33884
f18e9404-03d3-4d60-b4b1-580c1f862175	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2747809507	20390426717	0.00	0.02	radacct	2026-04-07 23:41:46.340987
5b15d211-a794-476c-9478-0457ac349dc5	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	597403010	7319436090	0.27	4.12	radacct	2026-04-07 23:41:46.342881
fb027f84-9f66-4231-9421-096ed3c2a946	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3174064776	10812679250	0.06	1.10	radacct	2026-04-07 23:43:46.263584
bd878b43-a07e-47fe-8c2e-00d568e21a81	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	36575632	1437229702	0.02	0.77	radacct	2026-04-07 23:43:46.274283
b9662e54-2090-4e16-8e02-84624aae8d85	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45562264	840141591	0.00	0.00	radacct	2026-04-07 23:43:46.276509
8abfdb3e-8173-4b2d-a848-a39e0acc0c52	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851858578	16093583857	0.00	0.00	radacct	2026-04-07 23:43:46.278609
9fe38de1-ca91-4e18-b14d-ef1ef712b324	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583495838	8816495895	0.00	0.00	radacct	2026-04-07 23:43:46.281577
75cf14a1-9124-42a3-ae3e-bc1e9d7f31d9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65436493	1838262298	0.04	0.04	radacct	2026-04-07 23:43:46.284641
a3186c07-2fa4-4a9b-8fd3-bdfd1a5456f5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2402366784	19936144105	0.02	0.40	radacct	2026-04-07 23:43:46.286923
606ba4b3-f41d-495a-8e22-58173c694544	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618552224	10540364503	0.00	0.00	radacct	2026-04-07 23:43:46.289744
cdbe5a19-dcd6-4256-a826-58423c25b0f3	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1395728599	12701346634	0.61	0.71	radacct	2026-04-07 23:43:46.292583
dc93a9b2-9369-4788-8287-588d69da0683	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	932632334	19725708939	0.04	1.08	radacct	2026-04-07 23:43:46.294756
287fc4b3-e6d4-4667-b5d3-aa6cb9c3b64a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	493947076	4123439916	0.03	1.13	radacct	2026-04-07 23:43:46.297649
7a3a01ab-a590-424c-9a5f-66db15dd9dc5	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	188437592	2677983260	0.07	1.99	radacct	2026-04-07 23:43:46.300336
6e59d66d-d314-47fe-997c-44cc5912a9dd	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60942962	1881008056	0.00	0.00	radacct	2026-04-07 23:43:46.302402
8f65a2f2-c13a-4c96-bc7b-e4a9c05e4e58	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	599716371	13956318843	0.08	2.56	radacct	2026-04-07 23:43:46.304786
6fda9e0d-e22b-48c8-839f-dddbebdb1f84	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	170128597	1450998273	0.01	0.03	radacct	2026-04-07 23:43:46.307504
d431cf77-b83f-4936-9063-f2a9fcf9dc12	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2776197648	11467754451	0.40	3.74	radacct	2026-04-07 23:43:46.309886
22ecbb80-e931-4f15-8a99-3a132dc597c2	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162266808	2957051519	0.00	0.00	radacct	2026-04-07 23:43:46.312607
de7bd6e7-b43c-4079-9aac-9e26709c83da	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718718070	5132174179	0.00	0.00	radacct	2026-04-07 23:43:46.3158
961bc54f-46e5-4c0f-a035-5f57a5c4ea38	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3413031107	17428990263	0.16	0.22	radacct	2026-04-07 23:43:46.318322
e92322e7-04e4-496c-a103-78a1a1070ca3	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429802638	16923297551	0.00	0.01	radacct	2026-04-07 23:43:46.320515
8ea1d39d-88b0-4847-8c8c-037e82302211	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858682943	14096948414	0.00	0.00	radacct	2026-04-07 23:43:46.323216
b07fcb2d-dffe-4d8d-8495-8e23d69c039e	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2515977323	14180298995	0.00	0.00	radacct	2026-04-07 23:43:46.326346
80139f6c-fa37-4b7c-bfc1-ee5c79f05a3a	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1134958973	15164247996	0.40	1.42	radacct	2026-04-07 23:43:46.329057
4436b629-0e01-40eb-b39f-9f86a3e4fdaa	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	690992954	13900139344	0.00	0.00	radacct	2026-04-07 23:43:46.332244
e4f6d4ce-fcb7-45a5-a072-6a9271b6d5de	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407312873	10341987103	0.00	0.00	radacct	2026-04-07 23:43:46.335426
46bf6fd8-cccd-47f7-9b84-0a79da4217d2	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755457762	12823778239	0.00	0.00	radacct	2026-04-07 23:43:46.338174
30abf708-ff65-4d29-800f-8a4550504cfa	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655789677	35141380117	0.00	0.00	radacct	2026-04-07 23:43:46.340697
ea8c66dd-1984-4340-a41a-d937ee96d576	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1348854828	23846455599	0.05	2.03	radacct	2026-04-07 23:43:46.34314
eeabb5dd-e8a3-4623-8fa8-069a375418a4	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772734840	12073839514	0.00	0.00	radacct	2026-04-07 23:43:46.345349
32624a68-96b6-4bff-9fac-c32401eb0db1	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1781485050	40735941247	0.22	0.03	radacct	2026-04-07 23:43:46.348705
0804bcea-c132-4051-865d-e3010a0fe7e7	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	192008369	5059423957	0.16	4.84	radacct	2026-04-07 23:43:46.351771
b7ae598b-5131-4e94-8cb0-1520eb9b7eb2	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491332829	19763589890	0.02	1.07	radacct	2026-04-07 23:43:46.355512
84b6c2c6-0ff7-4964-8f1a-06a329349372	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2237574070	18562993112	0.24	0.85	radacct	2026-04-07 23:43:46.357877
057f5769-ac86-425c-8135-8751ca599c1d	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2747889371	20390600467	0.01	0.01	radacct	2026-04-07 23:43:46.360096
321e49a4-7879-4f91-a5e3-b4f620ddc03c	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	601147601	7382885282	0.25	4.23	radacct	2026-04-07 23:43:46.363301
f794635e-6be4-4b32-af15-6b9ba2d5cc50	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3175043757	10832399897	0.07	1.31	radacct	2026-04-07 23:45:46.387036
71f1c8f4-62bc-49fa-b6af-5e269f97ff90	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37059280	1446529692	0.03	0.62	radacct	2026-04-07 23:45:46.397048
e2bfe24a-c760-4f80-8ab4-0f610d62a988	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45572095	840145768	0.00	0.00	radacct	2026-04-07 23:45:46.39909
b59b414d-c443-42fa-81ad-3467b8c01a72	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851871354	16093605811	0.00	0.00	radacct	2026-04-07 23:45:46.401142
c1510c5c-bedf-4e19-99ac-70e8bc3c1779	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583503257	8816508377	0.00	0.00	radacct	2026-04-07 23:45:46.403674
a949e069-a475-468f-907f-9c01cbb4f8b6	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65451307	1838270733	0.00	0.00	radacct	2026-04-07 23:45:46.406489
faea2407-466a-4102-99a3-bcb98c44f7a6	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2403424499	19946214643	0.07	0.67	radacct	2026-04-07 23:45:46.408573
a60b2ec4-87e8-4687-96f0-837f9b5a9301	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618575739	10540383078	0.00	0.00	radacct	2026-04-07 23:45:46.410658
ade45340-8d8a-4661-916c-10b3b1fddef8	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1407467152	12711833948	0.78	0.70	radacct	2026-04-07 23:45:46.412631
8423eb8a-8b5a-4977-8a37-4a0499696253	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	933548010	19747369020	0.06	1.44	radacct	2026-04-07 23:45:46.414675
97f50197-acf8-4d07-94da-9792ccbb9c5a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	495075250	4172484129	0.08	3.27	radacct	2026-04-07 23:45:46.416821
fd3a7c61-6a2b-4cfd-992d-59cf51da5730	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	189118065	2691391339	0.05	0.89	radacct	2026-04-07 23:45:46.41921
a66ba1ce-5bfd-461c-8f3c-90a3b73b437b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	60943767	1881008971	0.00	0.00	radacct	2026-04-07 23:45:46.421769
c3a1359a-10ee-4c8e-991a-10e28be61147	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	600372185	13984012421	0.04	1.84	radacct	2026-04-07 23:45:46.423762
f9edd577-1acd-4cf4-9e44-566f40c68ff0	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	170375035	1451594294	0.02	0.04	radacct	2026-04-07 23:45:46.425789
3bdb31d6-0691-4693-9d32-054d3ebed467	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2778986079	11494157009	0.19	1.76	radacct	2026-04-07 23:45:46.427827
623c8761-1b25-42f6-a4a9-be3b24c5b48b	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162282985	2957063749	0.00	0.00	radacct	2026-04-07 23:45:46.4299
7bfa198e-3aa4-48a1-b753-f839fa884888	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718719710	5132175361	0.00	0.00	radacct	2026-04-07 23:45:46.431991
4390b743-77fb-4dfd-8fdf-75c595e32011	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3415984796	17432184735	0.20	0.21	radacct	2026-04-07 23:45:46.434133
08739a78-b7a8-4551-bfe7-e3d6256663c4	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429847185	16923333224	0.00	0.00	radacct	2026-04-07 23:45:46.43668
4aadd478-cfec-4cf9-b920-beb3f575e147	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858751278	14099097461	0.00	0.14	radacct	2026-04-07 23:45:46.438755
97c950ba-cff8-4342-bfb3-b45b625dffa9	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516013070	14180341015	0.00	0.00	radacct	2026-04-07 23:45:46.440773
8fd80974-63f0-4602-a795-793300d08030	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1135470317	15170473066	0.03	0.41	radacct	2026-04-07 23:45:46.442966
c70eb96e-fdf2-4c58-9894-af0ce2f8e12f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691078099	13900260920	0.01	0.01	radacct	2026-04-07 23:45:46.444945
860367e9-736d-4eef-92e1-f09888ac17eb	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313150	10341987392	0.00	0.00	radacct	2026-04-07 23:45:46.446892
e6832596-d6f9-4c9d-9903-5f9d34216e45	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755539667	12823902505	0.01	0.01	radacct	2026-04-07 23:45:46.448788
37ee9f28-7fc4-4f57-b83c-31c979895ae8	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655917354	35149323458	0.01	0.53	radacct	2026-04-07 23:45:46.451394
ae7a37bf-e35a-4491-8678-549455cf92bd	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1350595675	23894899779	0.12	3.23	radacct	2026-04-07 23:45:46.45346
185026ee-3ad1-467c-9cff-1e6b2785b5e8	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772769872	12073885702	0.00	0.00	radacct	2026-04-07 23:45:46.455853
88888148-bd5e-43df-9e02-f1ac927a0a49	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1792704874	40736275843	0.75	0.02	radacct	2026-04-07 23:45:46.457948
5c27a813-24aa-4293-94c6-01266f0b4dbe	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	194256973	5106294978	0.15	3.12	radacct	2026-04-07 23:45:46.45988
49bd6b22-3006-49cd-93b5-83ccfedd3940	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491550065	19776784872	0.01	0.88	radacct	2026-04-07 23:45:46.461788
1653186c-d2c5-4ea8-85be-c5d269e0127c	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2241605595	18581821686	0.27	1.25	radacct	2026-04-07 23:45:46.46418
c6dee3a1-123b-4aeb-93b6-410eeda8e2fa	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2747926778	20390662141	0.00	0.00	radacct	2026-04-07 23:45:46.466401
4aa388d5-cf38-4877-860e-a7348953799b	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	603477759	7453615335	0.16	4.71	radacct	2026-04-07 23:45:46.468316
82edc255-c77c-4bd1-9985-e28f163ce049	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3175444471	10845231826	0.03	0.86	radacct	2026-04-07 23:47:46.29385
ef7d4fe4-b19a-4b75-8a2e-060b5bec8da6	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37250996	1456478220	0.01	0.66	radacct	2026-04-07 23:47:46.304163
fad4c43a-5262-4231-837b-9f52d5477190	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45592757	840157670	0.00	0.00	radacct	2026-04-07 23:47:46.306444
5ccfe81a-6337-456d-a55c-a20c2dd86a7c	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851888705	16093648985	0.00	0.00	radacct	2026-04-07 23:47:46.308967
d13e91a2-8e4f-4cb5-991f-dc6cc3898337	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583531179	8816554556	0.00	0.00	radacct	2026-04-07 23:47:46.311847
95e9c0b4-9d1d-4a67-80b9-e6fa620d070d	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65465265	1838284454	0.00	0.00	radacct	2026-04-07 23:47:46.314011
678e1946-561b-47b6-beea-62bf5468c632	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2404888696	19984152620	0.10	2.53	radacct	2026-04-07 23:47:46.316176
22355384-ebbf-4569-b971-e39c78431eca	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618579507	10540386651	0.00	0.00	radacct	2026-04-07 23:47:46.318686
eebb8346-cd3b-455a-9db5-c51760f403bd	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1419010786	12722502544	0.77	0.71	radacct	2026-04-07 23:47:46.321047
2d84e22d-6386-4c17-a957-4e78050475e3	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	934049602	19760657541	0.03	0.89	radacct	2026-04-07 23:47:46.323173
75a8c6fd-662d-4389-bdfc-53d82e95605c	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	495902410	4186652417	0.06	0.95	radacct	2026-04-07 23:47:46.32588
6647176f-f948-4b60-a529-871564d5e905	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	189573438	2695228578	0.03	0.26	radacct	2026-04-07 23:47:46.328114
ac8069e4-5342-4138-a24e-5ab5c62e01c4	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61013474	1881337285	0.00	0.02	radacct	2026-04-07 23:47:46.33025
b01161a7-5b48-4f18-a1d3-d4718b596e4d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	601117201	14019316752	0.05	2.36	radacct	2026-04-07 23:47:46.332299
cf6c2006-557a-485d-b24d-9c187b0a53a5	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	170738545	1452007224	0.02	0.03	radacct	2026-04-07 23:47:46.334565
74554634-8ad4-45b5-b413-c06329170b23	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2779706234	11517151991	0.05	1.53	radacct	2026-04-07 23:47:46.336737
5e7deb95-758f-41a3-86e8-c023ee654cf6	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162308934	2957084127	0.00	0.00	radacct	2026-04-07 23:47:46.339015
882968bd-9d81-4ba8-bf92-252127796100	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718796139	5132182057	0.01	0.00	radacct	2026-04-07 23:47:46.341359
b903370a-80d6-4661-b244-1fe59fab2977	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3417050805	17433186625	0.07	0.07	radacct	2026-04-07 23:47:46.343715
206cd672-c754-4ec0-a2e0-d5754beae970	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429913080	16923383076	0.00	0.00	radacct	2026-04-07 23:47:46.3457
59768c90-7923-4e80-8410-0fe411e1fd7d	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858823801	14099253504	0.00	0.01	radacct	2026-04-07 23:47:46.347702
7761ff7c-1c16-4dfd-b7b7-1f8f67a87610	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516045121	14180467755	0.00	0.01	radacct	2026-04-07 23:47:46.349889
558d7c04-ebba-4780-9b51-f332b9d08a2f	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1138135157	15195907947	0.18	1.70	radacct	2026-04-07 23:47:46.352065
4155772b-0e12-4f4e-bd06-9c9eb24d1dd0	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691118707	13900273114	0.00	0.00	radacct	2026-04-07 23:47:46.354505
5625bb32-d680-4a2a-aab0-bf3e6941bcce	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313323	10341987639	0.00	0.00	radacct	2026-04-07 23:47:46.356505
b8e1bd8f-427a-4548-a661-1f37904ca5ca	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755543389	12823912506	0.00	0.00	radacct	2026-04-07 23:47:46.358694
7caed6c7-36cd-403f-b02a-b88f9f676313	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1655997913	35149424343	0.01	0.01	radacct	2026-04-07 23:47:46.360663
5a4e97af-0bc7-472a-b876-1ec0f21c43f2	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1351739008	23931295073	0.08	2.43	radacct	2026-04-07 23:47:46.362633
f2e9c612-c52a-40fc-94a5-2c4207bcef39	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772809649	12073927616	0.00	0.00	radacct	2026-04-07 23:47:46.364534
fa84ecc5-8c63-43dd-b02d-feb1443eba08	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1794012137	40763323954	0.09	1.80	radacct	2026-04-07 23:47:46.366637
67b1d0f2-472f-4f98-9f35-b7838660f8e8	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	195788864	5136299668	0.10	2.00	radacct	2026-04-07 23:47:46.368602
56d8b25f-ac85-44d1-a746-4c5bd655aa8a	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491700838	19789094336	0.01	0.82	radacct	2026-04-07 23:47:46.37114
b353dd7d-e9c9-4c7f-a974-1805d6fdf95c	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2243953897	18591011155	0.16	0.61	radacct	2026-04-07 23:47:46.37327
8f7fe76e-69bd-4552-af5b-bd8bc4cd7524	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748083902	20391249921	0.01	0.04	radacct	2026-04-07 23:47:46.375388
64edc486-4ef7-43fa-8edb-2ca94b239ffd	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	606507756	7526686901	0.20	4.88	radacct	2026-04-07 23:47:46.377337
eb359366-1f90-434b-9226-09264a60ce34	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3175826571	10856566824	0.03	0.76	radacct	2026-04-07 23:49:46.299131
85deb17e-695e-4380-9c19-927625cd77e8	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37460802	1462037817	0.01	0.37	radacct	2026-04-07 23:49:46.314417
cdb3ae03-e8ae-4969-9186-ffab3e3e810b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45604972	840165262	0.00	0.00	radacct	2026-04-07 23:49:46.317687
c1c7756c-f47b-4b84-b2bf-73b80ad50dcc	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851894852	16093656869	0.00	0.00	radacct	2026-04-07 23:49:46.321444
32a634dc-b3c8-419a-bc75-a8b0beb87adf	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583531797	8816555265	0.00	0.00	radacct	2026-04-07 23:49:46.32509
39da61e0-f11d-47ef-977e-7cef43282605	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65489957	1838321631	0.00	0.00	radacct	2026-04-07 23:49:46.327911
ddf1a985-089b-49d8-a816-a60a91ac3721	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2405142399	19989732104	0.02	0.37	radacct	2026-04-07 23:49:46.330646
43e3b3e4-ec95-4002-a3e9-b8e7570831e7	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618582277	10540388821	0.00	0.00	radacct	2026-04-07 23:49:46.333411
9ef86452-c7ce-46c0-a34a-81003388c6d7	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1429888149	12732951590	0.73	0.70	radacct	2026-04-07 23:49:46.337144
362601af-15fc-480d-85b0-7dcabdb13b4d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	935145381	19790371953	0.07	1.98	radacct	2026-04-07 23:49:46.340599
a4918b65-6a42-481b-ae17-38680bd35241	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	496910527	4216749137	0.07	2.01	radacct	2026-04-07 23:49:46.343505
f3b945b2-3d09-4398-ab44-e757ae84fc63	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	191316888	2710993634	0.12	1.05	radacct	2026-04-07 23:49:46.346337
1481982a-9ee3-48b4-ae92-2707660dbe08	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61087548	1882326285	0.00	0.07	radacct	2026-04-07 23:49:46.348794
670a456b-b4b3-410e-baf5-6da61df429e5	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	601767289	14050625055	0.04	2.09	radacct	2026-04-07 23:49:46.351888
ca03643c-8d90-4520-aa27-d4e8afb3901b	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	170985194	1462601279	0.02	0.71	radacct	2026-04-07 23:49:46.355507
f2fe4c67-00b0-41c5-8625-d7cccb59e6c7	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2780873761	11546743614	0.08	1.97	radacct	2026-04-07 23:49:46.358392
ae758a89-b066-4f64-9259-392dbfbe2e6d	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162429023	2957756337	0.01	0.04	radacct	2026-04-07 23:49:46.360983
a14bbe5f-cac3-418e-bafe-d99d435c81ea	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718801199	5132205130	0.00	0.00	radacct	2026-04-07 23:49:46.363438
e05d226d-a2a5-48e8-9c95-7009a6d3e5c8	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3418717668	17439287496	0.11	0.41	radacct	2026-04-07 23:49:46.367007
787a18cf-549a-4f2c-b15b-71f54d033f4d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429958590	16923432909	0.00	0.00	radacct	2026-04-07 23:49:46.371219
658c5d17-5f40-4332-b4c0-0819fd653c8f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858879367	14099352403	0.00	0.01	radacct	2026-04-07 23:49:46.375323
36ff6d02-2bcc-4393-833d-7e0024b04ede	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516083181	14180527382	0.00	0.00	radacct	2026-04-07 23:49:46.378148
f113e64f-64cc-4730-a670-15e4d2194931	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1139117522	15242783991	0.07	3.12	radacct	2026-04-07 23:49:46.380925
ede6ec25-7b9e-4001-ac72-3596b7180528	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691189502	13900319958	0.00	0.00	radacct	2026-04-07 23:49:46.383359
4b5251f1-f4ec-450d-9d95-d0e4c92f38cb	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313432	10341987748	0.00	0.00	radacct	2026-04-07 23:49:46.385946
209c86c3-660e-44bb-b5d5-2d705da90c93	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755585613	12823961560	0.00	0.00	radacct	2026-04-07 23:49:46.388777
37772954-46b3-4ab6-a3be-910fa65f4fa1	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1656341268	35154970549	0.02	0.37	radacct	2026-04-07 23:49:46.391146
7f025e9c-f0ee-4873-bdc0-e89585425ecd	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1353701048	23990016815	0.13	3.91	radacct	2026-04-07 23:49:46.393386
26556858-7353-4b05-aeab-bdcca1b6cf65	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772902391	12074217327	0.01	0.02	radacct	2026-04-07 23:49:46.395594
b73dea3f-4765-4a34-a402-eac0852faad3	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1794592441	40778785077	0.04	1.03	radacct	2026-04-07 23:49:46.397808
3cad531c-c4dc-4bb6-a6d8-7ec575e83279	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	196866788	5164995055	0.07	1.91	radacct	2026-04-07 23:49:46.400271
574c18c8-764e-4aff-ba3c-bffb4f6815a1	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491879303	19801631644	0.01	0.84	radacct	2026-04-07 23:49:46.403062
5bdbb4a9-a2a5-4698-8fa8-89f7d53c046f	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2246705367	18613625353	0.18	1.51	radacct	2026-04-07 23:49:46.40661
22bf0fe2-99ee-4bdd-8fac-599582dc883d	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748103332	20391269885	0.00	0.00	radacct	2026-04-07 23:49:46.40867
1fa30879-0938-4dae-a33c-8c169ca7d783	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	610164393	7599558518	0.24	4.86	radacct	2026-04-07 23:49:46.410544
cd955689-1c7c-4775-a9a9-c41b675d71e0	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3176006556	10861107969	0.00	0.00	radacct	2026-04-07 23:50:33.603834
53351a8b-1c62-446a-bb0d-0e657a772ab6	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37487971	1463248649	0.00	0.00	radacct	2026-04-07 23:50:33.610934
e7e774c3-2ecb-49b4-a7af-84497fa926a2	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45626069	840178220	0.00	0.00	radacct	2026-04-07 23:50:33.612839
88c3b3dd-1502-4a50-ac62-addd5fb6a84a	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851895483	16093657216	0.00	0.00	radacct	2026-04-07 23:50:33.614856
6145ee92-7e23-4a39-8d3e-a27d11f55f2a	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583532021	8816555567	0.00	0.00	radacct	2026-04-07 23:50:33.616662
282d8390-4863-4adf-8737-7a6e9ad7fef3	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65516977	1838351671	0.00	0.00	radacct	2026-04-07 23:50:33.618822
127d0aa9-7b90-453e-afd0-14fe28307722	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2405235864	19990035362	0.00	0.00	radacct	2026-04-07 23:50:33.621308
10b8fa90-287b-455b-89af-7cc677453ab3	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618583232	10540389678	0.00	0.00	radacct	2026-04-07 23:50:33.623527
5d3fff7d-d543-4140-96aa-a4c63fb808d1	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1433277520	12736352994	0.00	0.00	radacct	2026-04-07 23:50:33.625308
0434a684-c5ed-423d-924c-add36b5754f1	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	935339698	19794161364	0.00	0.00	radacct	2026-04-07 23:50:33.62689
489f6e12-9608-4429-ba49-cdb49f67cca7	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	497117633	4220288675	0.00	0.00	radacct	2026-04-07 23:50:33.628452
bec9708d-0abe-4723-a555-b86f6d009029	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	191408257	2711367748	0.00	0.00	radacct	2026-04-07 23:50:33.630271
59f8a465-c169-4fe1-8c83-e73c8981b276	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61087800	1882337565	0.00	0.00	radacct	2026-04-07 23:50:33.631982
f1410c67-d022-4c2f-a124-9403df884a32	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	601990892	14063387950	0.00	0.00	radacct	2026-04-07 23:50:33.633699
c1d4a563-1d7f-4051-95b3-624c082d3288	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	171089709	1462749911	0.00	0.00	radacct	2026-04-07 23:50:33.636286
679cc719-9d71-4496-bf25-d7195975394d	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2781039433	11552039752	0.00	0.00	radacct	2026-04-07 23:50:33.638474
50117374-19de-448c-ad4f-92e330260ae0	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162563960	2957860198	0.00	0.00	radacct	2026-04-07 23:50:33.640401
08444435-dc8d-4d2d-a9ff-931deacd5b9e	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718803795	5132208340	0.00	0.00	radacct	2026-04-07 23:50:33.642325
7c957d01-ddbb-4523-b06c-1ceee032cdaa	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3418974742	17439538212	0.00	0.00	radacct	2026-04-07 23:50:33.644329
2c751030-dfeb-41e5-b92a-87843d1119dc	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2429972420	16923444706	0.00	0.00	radacct	2026-04-07 23:50:33.645951
e1115375-e8de-4ce4-a074-0db72c291967	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858915015	14099446363	0.00	0.00	radacct	2026-04-07 23:50:33.647484
0ccfc4cb-96b1-4eb1-b5b2-86c19edcb732	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516087742	14180530969	0.00	0.00	radacct	2026-04-07 23:50:33.648994
8f400733-96ae-4147-bf22-95284616f95d	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1142411454	15254733064	0.00	0.00	radacct	2026-04-07 23:50:33.650775
a9e5f55b-bc1a-47ad-864f-76344fd1687f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691201921	13900321857	0.00	0.00	radacct	2026-04-07 23:50:33.653076
63f0e56a-25de-4e4b-9429-458669a9a16b	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313432	10341987748	0.00	0.00	radacct	2026-04-07 23:50:33.655015
1eddf694-640c-40a3-b5f0-3e09ffe778bf	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755585803	12823961942	0.00	0.00	radacct	2026-04-07 23:50:33.656943
1b732a39-880a-408f-a962-cbb612d5274e	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1656582896	35155509998	0.00	0.00	radacct	2026-04-07 23:50:33.658688
8f9d85a7-abc3-4f73-8ed9-dbb4144b8d8a	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1354200358	24004662297	0.00	0.00	radacct	2026-04-07 23:50:33.660268
e3edcf78-c79b-4069-831b-974c083abc0c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772915507	12074229875	0.00	0.00	radacct	2026-04-07 23:50:33.661768
e73fa50e-1ade-4469-b786-70bb431ae631	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1794597188	40778788600	0.00	0.00	radacct	2026-04-07 23:50:33.663362
0820ed8f-d4a5-476a-8760-ab25c1c0e462	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	197244692	5175994684	0.00	0.00	radacct	2026-04-07 23:50:33.664907
cb7ecddb-484e-4929-9bab-9d2f2f9dbdbe	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2491969820	19805727383	0.00	0.00	radacct	2026-04-07 23:50:33.666564
74049ded-52ab-4262-91bc-3abc932f849b	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2247518918	18615904622	0.00	0.00	radacct	2026-04-07 23:50:33.668254
d07a4eba-05cd-4edc-9b5c-90131fc1b58e	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748105699	20391271671	0.00	0.00	radacct	2026-04-07 23:50:33.6707
2a677e76-c6f6-4986-89a2-eea23d969247	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	610985610	7623971432	0.00	0.00	radacct	2026-04-07 23:50:33.672791
399de57b-4051-46a8-8304-d4764c76827a	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3176336145	10866100671	0.00	0.00	radacct	2026-04-07 23:51:16.083001
72444a99-afde-4cdb-ab45-59111b5512e0	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37538572	1466291899	0.00	0.00	radacct	2026-04-07 23:51:16.091159
e2903daf-ea0f-49df-84ec-615d92209369	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	45627153	840179161	0.00	0.00	radacct	2026-04-07 23:51:16.093225
fee733fc-d1c6-42a0-a6a3-7bb3deb7f355	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851905488	16093665510	0.00	0.00	radacct	2026-04-07 23:51:16.095295
1574d2d0-51e5-49ae-baa6-d3829fa377ea	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583906365	8818957399	0.00	0.00	radacct	2026-04-07 23:51:16.097505
e2ad28ad-bccc-46b1-9d42-9c9c81d084a9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65537711	1838386975	0.00	0.00	radacct	2026-04-07 23:51:16.099724
469eb44a-2a34-4cec-9191-ea48de719091	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2405820678	19996334459	0.00	0.00	radacct	2026-04-07 23:51:16.103375
b56bc8df-c4f7-45b9-896b-cdb6ce6c32cf	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618584200	10540390166	0.00	0.00	radacct	2026-04-07 23:51:16.105515
85ff0f27-ffb4-41f0-9777-6a8dc9f6066e	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1436624601	12744672611	0.00	0.00	radacct	2026-04-07 23:51:16.108577
1890f6fc-5668-4aef-a622-768fa11c0590	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	935812366	19806785916	0.00	0.00	radacct	2026-04-07 23:51:16.111054
54bda39b-6736-4df7-866f-efcbfda1ab51	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	497452766	4223131579	0.00	0.00	radacct	2026-04-07 23:51:16.113345
d20a110f-8734-4ae6-af32-20a531d9c5c8	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	191543673	2711754159	0.00	0.00	radacct	2026-04-07 23:51:16.115537
629ee21f-bb80-43b0-aadc-c183dfe0eb5c	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61088422	1882340785	0.00	0.00	radacct	2026-04-07 23:51:16.118297
5189a20b-f2fd-4cf7-94f1-23e5c6adc32a	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	602724325	14084815653	0.00	0.00	radacct	2026-04-07 23:51:16.121151
96e3343e-3734-44ce-9586-108d8ed828cc	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	171237026	1462999004	0.00	0.00	radacct	2026-04-07 23:51:16.123523
497fbdaa-567c-4ed3-9b3e-abcdf3529d4a	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2781270039	11559124815	0.00	0.00	radacct	2026-04-07 23:51:16.125645
1e6df6af-7683-4427-8bc7-0a25fcfc670c	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162639080	2957909113	0.00	0.00	radacct	2026-04-07 23:51:16.127734
cd4dc4d5-37bb-4297-be72-8adf38eacc6d	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718833487	5132258489	0.00	0.00	radacct	2026-04-07 23:51:16.129848
34489a2c-66b6-4f0a-9c4c-e9277abc5844	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3419550390	17440073621	0.00	0.00	radacct	2026-04-07 23:51:16.132077
e439e582-45b4-44f4-9f25-43325f6fae86	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430019776	16923510375	0.00	0.00	radacct	2026-04-07 23:51:16.134295
b223a781-78a4-4ad1-84c2-888a45c91f81	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858915965	14099447702	0.00	0.00	radacct	2026-04-07 23:51:16.13705
72a88055-e86f-47f2-bad7-8f80a4f5e9bf	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516094958	14180549819	0.00	0.00	radacct	2026-04-07 23:51:16.138968
2fc5c032-7d11-4be8-a5dd-5288655a2eaa	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1143256352	15258445038	0.00	0.00	radacct	2026-04-07 23:51:16.140772
3ed86c33-d33f-4047-947f-bcdce701d925	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691219798	13900325628	0.00	0.00	radacct	2026-04-07 23:51:16.142345
56b582c6-a751-49b7-9b4e-5912f3f42034	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313432	10341987748	0.00	0.00	radacct	2026-04-07 23:51:16.143885
c76cf244-1a75-4e7e-ad2a-9343761514bf	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755592038	12823969456	0.00	0.00	radacct	2026-04-07 23:51:16.145436
8a8a77b7-c70e-4016-83a8-d853bce82c64	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1656738887	35156021203	0.00	0.00	radacct	2026-04-07 23:51:16.146962
991e1284-443c-47e9-b8d7-1be386e98879	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1354910397	24016710282	0.00	0.00	radacct	2026-04-07 23:51:16.148461
8d5bb009-0678-4548-b7d9-14ec0928b9e7	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	772921731	12074238806	0.00	0.00	radacct	2026-04-07 23:51:16.149967
62ecdcff-662f-4281-81bc-e505d93d83c1	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1794617060	40778896822	0.00	0.00	radacct	2026-04-07 23:51:16.15249
bbf24ca4-2c9b-49fc-9e19-ec2b231824a7	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	197919679	5191044922	0.00	0.00	radacct	2026-04-07 23:51:16.154543
25173f17-0ffa-4d09-ab51-3c57a05d0553	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2492052979	19811033850	0.00	0.00	radacct	2026-04-07 23:51:16.156856
03847822-df13-4253-ba9f-153024462a21	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2276962130	18625298308	0.00	0.00	radacct	2026-04-07 23:51:16.158544
734133f8-659e-49eb-9aa5-b88ce8e6a550	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748223545	20391408527	0.00	0.00	radacct	2026-04-07 23:51:16.160087
5c06665c-f667-46ae-b847-b4aef1a4239c	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	611880343	7655513173	0.00	0.00	radacct	2026-04-07 23:51:16.161639
cc50ebb1-50a9-41e8-b608-3a54f11f616c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3176691938	10877509504	0.02	0.76	radacct	2026-04-07 23:53:16.070102
ab9fcae0-1953-494e-9fd4-9c348cf43680	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37661788	1473102501	0.01	0.45	radacct	2026-04-07 23:53:16.07945
2da2a2f2-5273-43a5-bfd9-c54d016156cc	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	46060157	840974562	0.03	0.05	radacct	2026-04-07 23:53:16.082575
b43997d6-8761-4cd1-8585-71b5081a5d47	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2851906715	16093665940	0.00	0.00	radacct	2026-04-07 23:53:16.086254
c9ce5c8b-f544-41c8-bacf-abddd5695b12	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583913897	8818970547	0.00	0.00	radacct	2026-04-07 23:53:16.08945
e8aff027-38af-4728-8c46-00137c1fc88a	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65574297	1838418652	0.00	0.00	radacct	2026-04-07 23:53:16.092343
bed85079-180a-41c7-aaa2-b3d53ffef9d5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2408440231	20065169435	0.17	4.59	radacct	2026-04-07 23:53:16.095723
4934644f-3b33-4c57-9193-5d00e69f5aa8	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618659538	10540535306	0.01	0.01	radacct	2026-04-07 23:53:16.099044
0d8cb882-b72c-417f-8230-fed53a99fabf	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1437374445	12755863796	0.05	0.75	radacct	2026-04-07 23:53:16.102324
9868a6da-7dba-43a3-966d-0617f091794e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	936633016	19837478910	0.05	2.05	radacct	2026-04-07 23:53:16.105258
8303f8ec-35d6-459e-af37-11ef6f20dc61	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	497839741	4235189411	0.03	0.80	radacct	2026-04-07 23:53:16.108463
e3627c61-c75b-4d9c-b9f6-1b810ef9099d	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	192051253	2714724371	0.03	0.20	radacct	2026-04-07 23:53:16.111482
8f96a384-b447-459b-a658-22da59f8c02b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61090258	1882342974	0.00	0.00	radacct	2026-04-07 23:53:16.114391
5141b223-4f9b-45dc-9d18-57bc167708dc	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	604233167	14134942810	0.10	3.34	radacct	2026-04-07 23:53:16.11709
04615034-e8b8-4d3d-bd39-a341c8773389	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	171362873	1463166838	0.01	0.01	radacct	2026-04-07 23:53:16.120163
efc55d4e-a854-4765-9d47-051fc7da77ad	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2781760455	11575827671	0.03	1.11	radacct	2026-04-07 23:53:16.12303
d63bae86-c47f-444b-a042-5d93d5a0477a	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162693495	2957964463	0.00	0.00	radacct	2026-04-07 23:53:16.12613
b887fac5-4103-42a7-be25-e97abc9b20cd	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718835344	5132261006	0.00	0.00	radacct	2026-04-07 23:53:16.128892
92a934c9-ab82-447d-b638-dec4cdd1ae64	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3423014637	17444631438	0.23	0.30	radacct	2026-04-07 23:53:16.131758
e2f0138a-d57f-4fd1-be90-e511492609a0	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430111915	16923588012	0.01	0.01	radacct	2026-04-07 23:53:16.135053
14bd246f-8e57-433e-b7d2-73d17da9e088	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858936885	14099504243	0.00	0.00	radacct	2026-04-07 23:53:16.137688
46297f54-09f0-4a14-ab66-ae2fbff9754d	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516131520	14180584168	0.00	0.00	radacct	2026-04-07 23:53:16.140639
699f3486-4388-404c-9973-f71b4a3d7da4	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1143464116	15259598590	0.01	0.08	radacct	2026-04-07 23:53:16.143228
1c32ffcb-f70e-4b59-951c-a0cbf4fde954	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691273625	13900339412	0.00	0.00	radacct	2026-04-07 23:53:16.146082
8e7c5784-123b-49c2-968d-4b3b35c788d2	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313832	10341988094	0.00	0.00	radacct	2026-04-07 23:53:16.148752
c4409b28-e523-42f7-bef3-4a9a1c687199	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755593361	12823971175	0.00	0.00	radacct	2026-04-07 23:53:16.152148
f3aa375c-a290-432c-bdae-a87937e61802	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1657350876	35156732425	0.04	0.05	radacct	2026-04-07 23:53:16.155116
06f8e46c-5129-4a92-a75c-a31b343b3324	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1356088217	24052180320	0.08	2.36	radacct	2026-04-07 23:53:16.159649
a354b483-425a-4945-82bd-e53b0b3297d4	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773162235	12076790278	0.02	0.17	radacct	2026-04-07 23:53:16.162967
bd34f11d-0432-4054-9702-f3cc3ea465eb	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1794640147	40778918251	0.00	0.00	radacct	2026-04-07 23:53:16.165583
b4fd6155-846b-4b61-bf60-660f817226cb	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	199541151	5223191338	0.11	2.14	radacct	2026-04-07 23:53:16.168541
a0ea9d96-0b95-4c4f-b19a-c8578881ffb9	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2492419967	19828533268	0.02	1.17	radacct	2026-04-07 23:53:16.171245
45d33e54-017f-4b05-aa67-89a308cb78d1	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2283110663	18646838582	0.41	1.44	radacct	2026-04-07 23:53:16.173772
e4260e8e-da44-4264-8685-fba91e29d8dc	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748233750	20391415706	0.00	0.00	radacct	2026-04-07 23:53:16.176261
0681da72-2b3b-48c2-93ef-34a4cae60615	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	615337248	7724200339	0.23	4.58	radacct	2026-04-07 23:53:16.179178
6d522f76-5148-448e-86a8-0348bbca7528	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3177017005	10888303786	0.02	0.72	radacct	2026-04-07 23:55:16.084744
1c7dc3ea-3ddd-4f37-8400-ca261a0df966	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37821817	1480175766	0.01	0.47	radacct	2026-04-07 23:55:16.092183
e54be274-9dbe-4f74-95c6-76ef7d4a6092	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	46636746	841368080	0.04	0.03	radacct	2026-04-07 23:55:16.094496
1e2bda1a-af23-40c9-bd0d-ea5e255520a5	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852013969	16093789900	0.01	0.01	radacct	2026-04-07 23:55:16.096711
f5b9d92b-b5fb-4801-a176-de277bcc0d2c	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	583916788	8818973769	0.00	0.00	radacct	2026-04-07 23:55:16.099101
19ef91bd-6a68-48cf-83ee-2bb6620dbfd2	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65643407	1838500758	0.00	0.01	radacct	2026-04-07 23:55:16.102155
1bd9086d-5a0f-4639-9dbf-2764f992469e	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2410197365	20110163772	0.12	3.00	radacct	2026-04-07 23:55:16.104842
ff77f201-0704-4b75-9c30-15cbc32908ea	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618740930	10540579612	0.01	0.00	radacct	2026-04-07 23:55:16.107466
e151ba79-b657-4825-80f4-1b9b2d904902	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1438165016	12770329414	0.05	0.96	radacct	2026-04-07 23:55:16.110061
382c449e-b011-4b22-a30e-157d50d9753e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	937091276	19847473456	0.03	0.67	radacct	2026-04-07 23:55:16.112676
97501514-8ae3-4efa-9c85-a19fdef51828	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	497963165	4237781142	0.01	0.17	radacct	2026-04-07 23:55:16.115482
d581513b-22a0-4a04-80cb-504196b3c769	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	192291136	2715722406	0.02	0.07	radacct	2026-04-07 23:55:16.118213
ddb819de-6834-4eb1-b31b-8e3f0f4835ae	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61092023	1882345156	0.00	0.00	radacct	2026-04-07 23:55:16.12079
756a7cd7-f21c-4d3f-90d3-26d264ec85ab	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	605343022	14184196012	0.07	3.28	radacct	2026-04-07 23:55:16.123827
11656b01-1ea2-4e1b-bed1-44943d87ddc8	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	171415317	1463235874	0.00	0.00	radacct	2026-04-07 23:55:16.126733
8d4bde5e-30f7-4213-ad2a-85818898fc21	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2782404158	11594012193	0.04	1.21	radacct	2026-04-07 23:55:16.129048
a0fe270a-08ef-4633-aad1-fcabcbf2a22f	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162720166	2957995588	0.00	0.00	radacct	2026-04-07 23:55:16.131212
4d2e7a47-bf1d-464b-a6ac-ff4fd8dfd572	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718843288	5132471168	0.00	0.01	radacct	2026-04-07 23:55:16.134418
dde1dc47-f2f2-423c-a2ae-fade980f52c9	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3427512937	17448245197	0.30	0.24	radacct	2026-04-07 23:55:16.136915
8788db28-6740-42bc-9060-86fa34d488b5	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430186329	16923629503	0.00	0.00	radacct	2026-04-07 23:55:16.139554
499e422d-7bb7-4b19-a4ca-585267d6e21f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	858981676	14099578546	0.00	0.00	radacct	2026-04-07 23:55:16.142301
21fcdd5f-3aa6-4717-a9f5-4ca85a884eb4	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516163826	14180845772	0.00	0.02	radacct	2026-04-07 23:55:16.144854
9c02d30e-558c-4caf-b2a7-2193f8a95754	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1147333846	15291365523	0.26	2.12	radacct	2026-04-07 23:55:16.147361
f40a129f-0409-4d9d-90ef-dcb3ddb18cc6	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691334684	13900431714	0.00	0.01	radacct	2026-04-07 23:55:16.150438
bc4f7fac-7e62-42be-8048-ca0a503fc115	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313832	10341988094	0.00	0.00	radacct	2026-04-07 23:55:16.152948
cf2aa9d5-8840-461c-914d-5e3e146858fb	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755602795	12823976832	0.00	0.00	radacct	2026-04-07 23:55:16.154938
49e270e2-e367-4352-affe-dd50588fc908	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1657473456	35158864622	0.01	0.14	radacct	2026-04-07 23:55:16.157534
aab3d582-9ee2-4b9f-a570-594b560a6327	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1357589899	24077822359	0.10	1.71	radacct	2026-04-07 23:55:16.160118
ffa3ea2b-10ba-4a70-96aa-49cc1e8d68a1	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773233728	12076882876	0.00	0.01	radacct	2026-04-07 23:55:16.162749
d6ae26df-9a23-4689-8aa8-4f3fcf3b529e	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1796158502	40806943846	0.10	1.87	radacct	2026-04-07 23:55:16.165314
2252dea9-51ee-4dfd-ba57-58ac8e9b53de	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	201004015	5240570862	0.10	1.16	radacct	2026-04-07 23:55:16.168167
43d93faa-c644-4010-b6b6-fa991b54f111	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2492906411	19842562378	0.03	0.94	radacct	2026-04-07 23:55:16.170809
2446cf06-f170-4456-a17c-05969da9ec2d	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2290434111	18665024875	0.49	1.21	radacct	2026-04-07 23:55:16.173372
d4934ce4-aea8-4911-9733-66cbebd15483	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748245841	20391423745	0.00	0.00	radacct	2026-04-07 23:55:16.175832
df5c6d08-1f0a-4aaf-b4da-0c81e3ca4a98	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	617710740	7785970625	0.16	4.12	radacct	2026-04-07 23:55:16.178327
6ff9e69d-0ad4-432e-91fc-a7a783f42577	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3177581886	10909758022	0.04	1.43	radacct	2026-04-07 23:57:16.091339
b5f599f0-9c73-46ae-bb6e-c62e19fed172	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	37979030	1487856317	0.01	0.51	radacct	2026-04-07 23:57:16.093885
a3e642ab-2fd7-47f5-9f1e-a8f23905964a	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	46663176	841393485	0.00	0.00	radacct	2026-04-07 23:57:16.096102
e9143497-2417-4650-8fc2-0aa2bd040225	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852065050	16093829439	0.00	0.00	radacct	2026-04-07 23:57:16.098718
7f9c40fb-2289-42cb-9f88-cbd1f463d1ed	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584003270	8819416464	0.01	0.03	radacct	2026-04-07 23:57:16.100739
9bff17e2-53c5-406e-ad89-adcd890eb0b1	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65679247	1838549234	0.00	0.00	radacct	2026-04-07 23:57:16.103453
14dd6504-a67c-4b9a-85c5-55bf83e1635b	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2410938758	20119284182	0.05	0.61	radacct	2026-04-07 23:57:16.106151
a3a39467-1c52-4d07-ad45-7ae191eb92c8	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618786613	10540651277	0.00	0.00	radacct	2026-04-07 23:57:16.108441
b84c1e4b-0df5-4dfd-a296-5648f8a42d53	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1441107337	12777646884	0.20	0.49	radacct	2026-04-07 23:57:16.110486
dcf77424-704c-4ddd-be8b-e4ead8193683	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	937872446	19868269458	0.05	1.39	radacct	2026-04-07 23:57:16.112642
89c39ff0-4282-4528-b34d-f6af1bb2f849	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498049773	4237842649	0.01	0.00	radacct	2026-04-07 23:57:16.115076
12a88a31-5781-4fbc-b504-971fd1adb9ec	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	192716791	2716839100	0.03	0.07	radacct	2026-04-07 23:57:16.117135
1bc5faa6-7c3a-4901-aaba-15f80d8c3d04	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61103466	1882357981	0.00	0.00	radacct	2026-04-07 23:57:16.119146
a1c7a957-053b-42bf-8451-e14ab71874fd	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	606600184	14235370260	0.08	3.41	radacct	2026-04-07 23:57:16.12121
70434d81-fb4a-45b9-a6ab-388e2d91fee8	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	171535634	1463374806	0.01	0.01	radacct	2026-04-07 23:57:16.123305
fe3ac988-00c1-4a6f-93ea-4e6c29a911f4	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2783417684	11612339571	0.07	1.22	radacct	2026-04-07 23:57:16.125545
99753e89-fe3d-472f-81a6-650c4464de55	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162750038	2958020306	0.00	0.00	radacct	2026-04-07 23:57:16.127541
025eb380-f5a0-4694-8251-6591960d964a	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718849999	5132484867	0.00	0.00	radacct	2026-04-07 23:57:16.129544
fffd0fe0-43ef-4971-a957-47c04747bbd0	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3431422516	17451460180	0.26	0.21	radacct	2026-04-07 23:57:16.132137
e6aa0ac8-3730-4741-b297-d5db311fb5bf	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430254513	16923721557	0.00	0.01	radacct	2026-04-07 23:57:16.134374
522e1a73-8223-488d-850f-5bb7e40913f8	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859025974	14099680026	0.00	0.01	radacct	2026-04-07 23:57:16.136866
701a6503-8920-45d6-b676-d6029c8c7117	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516218792	14180899754	0.00	0.00	radacct	2026-04-07 23:57:16.13952
a6bb8f8a-2a1b-4794-b61c-2f6e589afbca	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1148745483	15304438077	0.09	0.87	radacct	2026-04-07 23:57:16.142053
2c973b49-cb5a-42d3-a05a-9343e01dbc4f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691376566	13900444285	0.00	0.00	radacct	2026-04-07 23:57:16.144456
176f1c77-4810-4a79-9bbb-ea587f193995	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407313941	10341988203	0.00	0.00	radacct	2026-04-07 23:57:16.146865
ca34e9ee-4805-4a8e-b110-6b8b8dc47f2a	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755618536	12823996942	0.00	0.00	radacct	2026-04-07 23:57:16.149317
58c5017c-1964-4e5b-9d16-eb033adaf502	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1657627995	35161232450	0.01	0.16	radacct	2026-04-07 23:57:16.151676
d92054dd-256f-45ae-abac-40794693c51f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1360178910	24131920625	0.17	3.61	radacct	2026-04-07 23:57:16.153983
0a3a01da-91b7-4a95-830f-5ff101260fd9	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773238369	12076886775	0.00	0.00	radacct	2026-04-07 23:57:16.156251
ac5d7115-ac23-4e09-9695-ee64e318a2fe	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1797080904	40817238264	0.06	0.69	radacct	2026-04-07 23:57:16.158557
530e0bda-be4c-440b-827b-3bcbae058622	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	205534861	5278405920	0.30	2.52	radacct	2026-04-07 23:57:16.160884
b87c088e-9ffb-4e97-a48d-1387627aa199	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2493129789	19855472881	0.01	0.86	radacct	2026-04-07 23:57:16.163466
e0ca6d39-1429-465d-be49-8c03c0fc9406	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2293185426	18690284907	0.18	1.68	radacct	2026-04-07 23:57:16.166104
7669c080-3303-457d-b941-d5abffd26a71	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748298072	20391502250	0.00	0.01	radacct	2026-04-07 23:57:16.168475
f111e751-94b4-46a7-9e86-c3002a7bf717	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	620174875	7812486843	0.16	1.77	radacct	2026-04-07 23:57:16.170816
18f7e8d9-9e15-46fb-8e74-b7a191a48e63	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3178287424	10927461853	0.05	1.18	radacct	2026-04-07 23:59:16.162103
5a88f205-f158-4509-ae54-9543a4e0fb1f	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	38125128	1496541133	0.01	0.58	radacct	2026-04-07 23:59:16.169728
b8313416-1201-4780-8c9b-03d5be9b0b28	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	46835442	841494073	0.01	0.01	radacct	2026-04-07 23:59:16.172124
bc135021-7b36-4403-879b-a767045b3380	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852103939	16093872171	0.00	0.00	radacct	2026-04-07 23:59:16.174246
96ee368d-08a0-4d9f-918c-eea3fba344f6	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584016467	8819433411	0.00	0.00	radacct	2026-04-07 23:59:16.176729
e96291c6-cbf4-4f9a-bdc4-30414038b145	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65895782	1838747823	0.01	0.01	radacct	2026-04-07 23:59:16.179133
2d6b73c7-1e5c-4d0a-9b76-0099c5ec9007	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2412836045	20144972917	0.13	1.71	radacct	2026-04-07 23:59:16.182499
6397a805-33dc-4d75-90f1-1a61d7454a2a	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618798985	10540666680	0.00	0.00	radacct	2026-04-07 23:59:16.184954
85786fbc-3d1f-4f61-86f8-de7eba2f1630	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1451127207	12780815363	0.67	0.21	radacct	2026-04-07 23:59:16.187071
f5824fce-c8c7-47d4-b5ef-33ba4f3f5b38	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	938498137	19881865406	0.04	0.91	radacct	2026-04-07 23:59:16.18935
81d953af-b500-42e2-9e6f-1c60ffdef429	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498165287	4237926054	0.01	0.01	radacct	2026-04-07 23:59:16.191516
26562786-6248-40f5-9af6-9ca6121dcd0c	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	192900290	2716947808	0.01	0.01	radacct	2026-04-07 23:59:16.1942
89a564b4-78f7-42c6-aa3b-184d1cb07e78	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61124141	1882397014	0.00	0.00	radacct	2026-04-07 23:59:16.196794
fa500990-ebe7-4bb0-8bef-ad482eb84bbb	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	608201315	14290130066	0.11	3.65	radacct	2026-04-07 23:59:16.199956
6cc3a5f3-6eed-4eef-9a65-2b286e8acb63	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	172081721	1466291730	0.04	0.19	radacct	2026-04-07 23:59:16.202358
660d7abf-ceb9-4662-a621-ce11987876bf	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2783950887	11627946224	0.04	1.04	radacct	2026-04-07 23:59:16.204588
fe193017-d693-415a-828b-397876236d63	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162783262	2958219790	0.00	0.01	radacct	2026-04-07 23:59:16.206906
79a9e658-e0b9-4434-859b-169318cb4999	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718851285	5132486641	0.00	0.00	radacct	2026-04-07 23:59:16.209293
cedf6cd1-5fca-405b-a5ac-2f14bd0edd53	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3435307075	17462347543	0.26	0.73	radacct	2026-04-07 23:59:16.211493
e8fe80d6-d8e5-40e7-aa86-99a73532a846	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430296379	16923751544	0.00	0.00	radacct	2026-04-07 23:59:16.213813
dd6c94a0-51c0-4421-9765-3ee7d856f148	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859048507	14099708352	0.00	0.00	radacct	2026-04-07 23:59:16.216595
a5a8d617-1435-4d5a-a21b-9c26539db6ea	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516291480	14181013367	0.00	0.01	radacct	2026-04-07 23:59:16.218603
5c54486d-0d71-4c69-b50a-8e734e9189b2	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1149717734	15326471784	0.06	1.47	radacct	2026-04-07 23:59:16.220525
dd5944dd-9bc5-4361-b392-2900a0716bc8	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691425543	13900455568	0.00	0.00	radacct	2026-04-07 23:59:16.22263
2ce54dd3-9645-4ebe-b957-6fab88402a17	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407331892	10342020757	0.00	0.00	radacct	2026-04-07 23:59:16.224866
bfb1553c-c028-419d-b161-46b484815841	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	755864516	12824370871	0.02	0.02	radacct	2026-04-07 23:59:16.226758
0b56a02d-abe5-4295-a7d7-a10eaa961644	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1657747991	35161361402	0.01	0.01	radacct	2026-04-07 23:59:16.228586
c75732ac-8d85-41c4-b19f-3deee5e2a200	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1363390413	24186419633	0.21	3.63	radacct	2026-04-07 23:59:16.231301
a92992ba-98e5-46d0-9cd3-cb6c0e24f3b9	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773288338	12076936998	0.00	0.00	radacct	2026-04-07 23:59:16.233905
7a1371dc-75d1-4b00-8227-5b4c42d97c44	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1798705708	40836591167	0.11	1.29	radacct	2026-04-07 23:59:16.236144
3ab31a72-aab8-4765-988f-417c21e4cd6f	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	210565095	5317194610	0.34	2.58	radacct	2026-04-07 23:59:16.238264
f29ec3b5-23f5-4cd6-8ba2-ea07f7b86bc2	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2493577748	19863668047	0.03	0.55	radacct	2026-04-07 23:59:16.240251
3b07e57b-593a-49fd-987e-d05b02474e46	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2296283900	18711476347	0.21	1.41	radacct	2026-04-07 23:59:16.242265
7c5d8d05-e96b-451e-9742-c231bf06c1bc	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748317390	20391517740	0.00	0.00	radacct	2026-04-07 23:59:16.244572
6c57213e-7374-4046-8b3e-bed702e891a7	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	622937095	7871998327	0.18	3.97	radacct	2026-04-07 23:59:16.247411
346db7b5-0568-4c6c-9656-10fd12d979f9	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3178618204	10930212513	0.02	0.18	radacct	2026-04-08 00:01:16.117451
099e3984-7ef7-4a33-af57-c4f05d09e4c1	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	38558179	1508686115	0.03	0.81	radacct	2026-04-08 00:01:16.124091
53800580-1d3e-4cc3-a998-b92820e780a4	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49010441	841779772	0.15	0.02	radacct	2026-04-08 00:01:16.126215
ac40dd74-436f-4e98-8306-cc63caaed5d1	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852396188	16095820823	0.02	0.13	radacct	2026-04-08 00:01:16.128357
021e7f11-46ab-4591-877f-286f4ff00691	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584121509	8819869378	0.01	0.03	radacct	2026-04-08 00:01:16.131729
02fc8590-127c-46d6-b575-17323b56a762	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	65971418	1839094923	0.01	0.02	radacct	2026-04-08 00:01:16.133865
479957dc-e147-4061-86ca-6aa1ee243b27	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2413559801	20153516930	0.05	0.57	radacct	2026-04-08 00:01:16.135939
dafed2c4-97d8-43a1-99be-9c6b8b1cd3bb	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	618825128	10540706363	0.00	0.00	radacct	2026-04-08 00:01:16.138535
daf26818-1b0e-4b59-b76b-ad3062cf4360	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1460676745	12785640491	0.64	0.32	radacct	2026-04-08 00:01:16.140609
8565949b-4c10-4e83-bf1b-6bae4980cb1c	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939112916	19894830848	0.04	0.86	radacct	2026-04-08 00:01:16.142678
481f28a9-c99c-476c-9366-126e6c5bf076	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498311527	4238376187	0.01	0.03	radacct	2026-04-08 00:01:16.144623
6b50e9f1-d3ee-4bfd-899a-f7c390e168fe	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193238881	2717343534	0.02	0.03	radacct	2026-04-08 00:01:16.147925
cd7fd95c-8aff-44f0-986c-2686cf68ae57	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61137631	1882439448	0.00	0.00	radacct	2026-04-08 00:01:16.150246
b33a4770-d6c0-4548-83cf-3f578f55cd93	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	609428527	14334861918	0.08	2.98	radacct	2026-04-08 00:01:16.15225
42c2bcba-6978-4186-a6a6-7c9964b399f9	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	172814081	1467242863	0.05	0.06	radacct	2026-04-08 00:01:16.154741
46d6c068-b815-47b4-8b86-0d689cfe0b14	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2784931930	11655041361	0.07	1.81	radacct	2026-04-08 00:01:16.157406
6a0ada16-7530-4f57-b51a-071b80b1bcb0	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162825427	2958283328	0.00	0.00	radacct	2026-04-08 00:01:16.159661
c4ef2d25-a881-42a5-8877-398837a761e4	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718881449	5133153686	0.00	0.04	radacct	2026-04-08 00:01:16.161776
a12a324a-bcc7-4dca-98c6-9675052b8a23	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3439779923	17503294939	0.30	2.73	radacct	2026-04-08 00:01:16.164589
e228014e-9098-41fa-bbd1-6e2932d4260c	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430344291	16923807710	0.00	0.00	radacct	2026-04-08 00:01:16.166619
c5b946ed-271f-4215-995a-494780851c64	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859350205	14101502218	0.02	0.12	radacct	2026-04-08 00:01:16.168615
7ddc854d-0589-41b9-a7bb-ec53a5103fc1	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516378132	14181718878	0.01	0.05	radacct	2026-04-08 00:01:16.171339
d93d56d9-3ab2-4095-a1da-cd6783187cb2	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1150478530	15340580867	0.05	0.94	radacct	2026-04-08 00:01:16.173422
3b86a924-a142-4329-836d-ca91ebb91dfe	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691481364	13900476679	0.00	0.00	radacct	2026-04-08 00:01:16.175492
112db409-76c7-4b00-ad00-2ca98a928b00	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407486112	10345079641	0.01	0.20	radacct	2026-04-08 00:01:16.177516
a8a8643e-d322-4144-b7f1-a8cf47d19b7e	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756029676	12826402378	0.01	0.14	radacct	2026-04-08 00:01:16.180331
7cfe6651-f7f3-4e96-a88e-f2702f6cff92	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658207440	35164377234	0.03	0.20	radacct	2026-04-08 00:01:16.1827
0bde419f-c1ec-4a23-9152-412443590138	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1365230473	24238009281	0.12	3.44	radacct	2026-04-08 00:01:16.184747
41c016ff-0bbd-4982-82f8-adf3069436fb	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773295490	12076948387	0.00	0.00	radacct	2026-04-08 00:01:16.187181
d535afe3-a3d8-4609-ac90-aaac7c2355dd	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1799615656	40843722768	0.06	0.48	radacct	2026-04-08 00:01:16.189158
4d4fdcb0-41b2-4244-8adb-367235de52da	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	213916139	5347898975	0.22	2.05	radacct	2026-04-08 00:01:16.191241
956f798f-2c03-47a1-82cd-22164a619fba	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2493830280	19871947895	0.02	0.55	radacct	2026-04-08 00:01:16.193299
0771d48a-6a5f-4fb1-8a83-e1eaed159454	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2299575008	18724942482	0.22	0.90	radacct	2026-04-08 00:01:16.195651
f6ccf6ad-615b-41f5-bac4-898260569d3f	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748379784	20392155049	0.00	0.04	radacct	2026-04-08 00:01:16.198171
8672cc5f-edea-4f41-b146-60a75bf0b3a5	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	624495926	7897499774	0.10	1.70	radacct	2026-04-08 00:01:16.200063
d947187a-acc5-43eb-b816-28b2a8137e00	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3179445863	10952232318	0.06	1.47	radacct	2026-04-08 00:03:16.126545
fa10c663-0b24-417c-863d-e98c61275f53	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	39519437	1521209747	0.06	0.83	radacct	2026-04-08 00:03:16.133078
48d61091-8a4a-444f-9e78-c3e4080215b7	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49283762	844893129	0.02	0.21	radacct	2026-04-08 00:03:16.135127
dd851b8e-c1fb-49f4-ad95-b808fb1461ab	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852439135	16095867538	0.00	0.00	radacct	2026-04-08 00:03:16.137202
8c2a0c3a-11dc-42d1-852e-a6448588596d	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584139061	8819899189	0.00	0.00	radacct	2026-04-08 00:03:16.139244
64bf3f93-3bac-4d06-9662-66392b311185	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66020298	1839423709	0.00	0.02	radacct	2026-04-08 00:03:16.141438
1d6e45f6-4f61-48f0-bb89-d1e64361a3a3	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2416718566	20163158772	0.21	0.64	radacct	2026-04-08 00:03:16.143557
ec046d58-ec35-4233-a9fc-92e5028fe412	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619001447	10541165435	0.01	0.03	radacct	2026-04-08 00:03:16.145801
29ca3b62-a674-45b9-a17f-46cc4b5385b4	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1467820231	12790126719	0.48	0.30	radacct	2026-04-08 00:03:16.148098
ac49a96a-e673-4101-816c-f2c991361c24	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939527668	19914247152	0.03	1.29	radacct	2026-04-08 00:03:16.150051
cf643e3d-52bf-4df1-8eb4-a8db960eff4a	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498463954	4238589944	0.01	0.01	radacct	2026-04-08 00:03:16.152055
9b212deb-c519-41e7-b36f-6da4c2c3a50e	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193414275	2717614938	0.01	0.02	radacct	2026-04-08 00:03:16.154012
3c505eb1-293d-4d50-8c0c-5c3802b4748a	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61139279	1882441186	0.00	0.00	radacct	2026-04-08 00:03:16.156037
93afdaeb-a6b8-4379-af90-9b79eb80062b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	613088123	14401501273	0.24	4.44	radacct	2026-04-08 00:03:16.158025
dddebfc4-be86-4342-971d-d187fb10ff2d	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	172889991	1467348484	0.01	0.01	radacct	2026-04-08 00:03:16.159996
6d76d585-1753-4d56-8e6a-58a18fb7d24c	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2786397936	11705054617	0.10	3.33	radacct	2026-04-08 00:03:16.16259
257e38ef-9fc6-4cc8-884c-bed4a22d7953	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162994311	2958553027	0.01	0.02	radacct	2026-04-08 00:03:16.164589
17870d17-3881-4f9f-8224-ff87c880ff14	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718882584	5133154914	0.00	0.00	radacct	2026-04-08 00:03:16.166566
ce39adee-958b-4a3f-a59f-6419287bb221	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3445365769	17553894480	0.37	3.37	radacct	2026-04-08 00:03:16.168558
16fb5d62-c829-4020-a36f-a71b2d6e8489	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430390669	16923848918	0.00	0.00	radacct	2026-04-08 00:03:16.17092
fe98dc6b-1ac4-407c-a13a-e475ea33e8b6	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859380398	14101535159	0.00	0.00	radacct	2026-04-08 00:03:16.17295
1b206d26-ecc1-4d31-a274-30d1b9713ff8	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516411860	14181959345	0.00	0.02	radacct	2026-04-08 00:03:16.174927
79767189-f008-4057-950b-a396fe5f8a94	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1151165299	15356374565	0.05	1.05	radacct	2026-04-08 00:03:16.177276
aa5fe0d8-8479-4ac2-8e35-7da460a22091	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691595781	13901606768	0.01	0.08	radacct	2026-04-08 00:03:16.179396
c027ce58-2a30-48dc-b915-70700dd5ae37	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407497583	10345097268	0.00	0.00	radacct	2026-04-08 00:03:16.18149
223ecd9f-9a3c-477e-ad5c-c8b33b929cec	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756066412	12826439977	0.00	0.00	radacct	2026-04-08 00:03:16.183517
8f6cc6cb-f3e9-46b3-9a4c-90b91ec9802a	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658476477	35165644122	0.02	0.08	radacct	2026-04-08 00:03:16.185733
0bd87eac-715c-4f44-92cb-25b9f4407465	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1367263813	24299346884	0.14	4.09	radacct	2026-04-08 00:03:16.187728
23703f4b-61cc-40a1-baf9-2c6f9b98619b	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773299376	12076955639	0.00	0.00	radacct	2026-04-08 00:03:16.189759
4965acf8-7cac-43bc-887f-536ef75301e0	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1801164254	40867649345	0.10	1.59	radacct	2026-04-08 00:03:16.191972
6cb39f41-9f49-4909-923e-8861cedd8c28	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	218346115	5387638248	0.30	2.65	radacct	2026-04-08 00:03:16.194082
ada9f4d9-17dc-47d8-bb04-804caedb01b6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494109226	19876812554	0.02	0.32	radacct	2026-04-08 00:03:16.196191
01df9211-5a20-45d6-81c2-bef1b6373c46	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2302218504	18736860432	0.18	0.79	radacct	2026-04-08 00:03:16.19834
54886674-76ab-49ee-9c94-d27f719c5b6a	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748494058	20392277049	0.01	0.01	radacct	2026-04-08 00:03:16.200859
7e0bb3cb-7b66-4c1e-838a-b37a9fa1a1d1	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	625609317	7915841793	0.07	1.22	radacct	2026-04-08 00:03:16.203118
b60e220b-07e0-463a-8f71-8fcda93280d5	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3180414354	10981576458	0.06	1.96	radacct	2026-04-08 00:05:16.138928
310abce0-a5c9-4496-af13-04fd8d72cb4d	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	39725406	1529238092	0.01	0.54	radacct	2026-04-08 00:05:16.147137
acd67936-f863-4aeb-881a-0c241f6e935c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49450224	846771258	0.01	0.13	radacct	2026-04-08 00:05:16.149886
af304923-f1f4-4d05-96b8-82fc4631d735	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852473397	16095923374	0.00	0.00	radacct	2026-04-08 00:05:16.152404
fd6ef8ee-a1ed-4c98-843c-51c398c6e6d0	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584145602	8819910107	0.00	0.00	radacct	2026-04-08 00:05:16.154475
831c69a8-a337-4f1a-add2-15b9db342a11	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66054223	1839473577	0.00	0.00	radacct	2026-04-08 00:05:16.156606
16c99232-bc84-4e43-8096-f1e9d4c64ab4	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2416838240	20163283537	0.01	0.01	radacct	2026-04-08 00:05:16.158732
0ab18a26-9a05-4971-90f5-e796dbe3e4af	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619005705	10541168891	0.00	0.00	radacct	2026-04-08 00:05:16.162138
f23f5c95-8cf7-48c7-93d9-ce40046165e7	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1470739299	12792802825	0.19	0.18	radacct	2026-04-08 00:05:16.165106
c11c5d03-edd8-4777-884f-8486373f24f2	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939536825	19914254614	0.00	0.00	radacct	2026-04-08 00:05:16.16772
49a2ce6e-82bf-441a-9fe2-f43c041bbb93	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498532286	4238695012	0.00	0.01	radacct	2026-04-08 00:05:16.170219
cd3f2e2a-8643-4a89-8e14-9dbd65d97172	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193494198	2717915933	0.01	0.02	radacct	2026-04-08 00:05:16.172655
b9acf085-dbb7-4a2e-87ae-1c955737cabf	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61148696	1882452622	0.00	0.00	radacct	2026-04-08 00:05:16.175212
e2c299ec-0dc9-4b82-9650-63d9c6f8c318	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	614505701	14459035674	0.09	3.84	radacct	2026-04-08 00:05:16.178565
7bc58901-53b9-4b01-947d-6d789e7b7fd4	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	173142582	1467623971	0.02	0.02	radacct	2026-04-08 00:05:16.18171
39780623-43b5-473f-8f90-28eefec14d74	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2787879448	11717362329	0.10	0.82	radacct	2026-04-08 00:05:16.184341
9011b449-2d08-4411-9301-fbbf474ca7bb	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162995215	2958553941	0.00	0.00	radacct	2026-04-08 00:05:16.187137
26bf4e4a-8899-489f-8f72-8026d8342a37	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718884598	5133157908	0.00	0.00	radacct	2026-04-08 00:05:16.189563
de157a9c-644d-498e-bf89-29647441320a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3449474240	17577306607	0.27	1.56	radacct	2026-04-08 00:05:16.191985
c25c64dd-2247-4453-bed6-398da3afcc1e	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430426255	16923874034	0.00	0.00	radacct	2026-04-08 00:05:16.195236
25f4319b-b69a-41c5-9311-18664ab52a81	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859493104	14101778230	0.01	0.02	radacct	2026-04-08 00:05:16.198324
1af200c4-6d1a-42d0-9054-2dee1e3bfbe2	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516456984	14182012156	0.00	0.00	radacct	2026-04-08 00:05:16.200996
913c94ad-5473-4146-b607-fe5f02a9211c	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1156003160	15375651439	0.32	1.28	radacct	2026-04-08 00:05:16.203374
12456ea1-b778-416b-aa5c-d8fbb40e23f4	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691942909	13902037617	0.02	0.03	radacct	2026-04-08 00:05:16.205651
5f9325df-39b7-4675-9366-cdfd5b898f59	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407497719	10345097396	0.00	0.00	radacct	2026-04-08 00:05:16.208439
666932e5-863a-4df2-b5df-9b1040f0de74	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756076165	12826469647	0.00	0.00	radacct	2026-04-08 00:05:16.212059
3256bd33-040d-40bb-87c6-e3a5ff5d88e0	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658804736	35178081694	0.02	0.83	radacct	2026-04-08 00:05:16.214705
db81cbd3-13f0-4ae3-bd7a-f7659e14e0f3	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1369031179	24353019399	0.12	3.58	radacct	2026-04-08 00:05:16.217169
0858730a-7954-40ef-9b9f-d22f83b543a0	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773352134	12077064953	0.00	0.01	radacct	2026-04-08 00:05:16.219505
2f9a1d03-0351-41ce-9951-622c199609a0	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1802925450	40900169043	0.12	2.17	radacct	2026-04-08 00:05:16.221809
79f3b9a2-476a-48f1-bfb0-cec913ac8855	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	221400528	5415477426	0.20	1.86	radacct	2026-04-08 00:05:16.224096
2d041537-9b11-4dbe-9dca-9c63b2b51a05	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494215593	19881275665	0.01	0.30	radacct	2026-04-08 00:05:16.22646
e0e55e96-a7b0-4929-a7ce-a66927d1f22e	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2304813171	18762077124	0.17	1.68	radacct	2026-04-08 00:05:16.229554
ed58a4a0-adee-4b55-96a6-7a9add223837	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748602425	20392579999	0.01	0.02	radacct	2026-04-08 00:05:16.231934
78cc4a09-2ea9-40da-a0e5-9bfbf149103f	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	627512874	7936368326	0.13	1.37	radacct	2026-04-08 00:05:16.234209
f2cfec5d-a888-4ef5-9422-302404b40716	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3180673792	10990020873	0.00	0.00	radacct	2026-04-08 00:06:00.938972
d2299654-e00f-4026-8d24-e6a1225ecf18	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	39760872	1531543240	0.00	0.00	radacct	2026-04-08 00:06:00.948512
93a40a30-b828-4c2a-8058-6eff55d8fda4	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49458533	846827810	0.00	0.00	radacct	2026-04-08 00:06:00.951111
98dc66b2-ccda-4d23-af26-4701d80ff393	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852483801	16095969737	0.00	0.00	radacct	2026-04-08 00:06:00.953659
8e46d4ac-8512-4a3c-99b4-dd64038594ed	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584146258	8819911316	0.00	0.00	radacct	2026-04-08 00:06:00.955888
86f18267-7119-4782-8b8c-bc6bf6af51c1	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66065351	1839480823	0.00	0.00	radacct	2026-04-08 00:06:00.957887
60aa529d-ba6f-458d-b1bf-2f97c508b8b1	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2417166585	20167980810	0.00	0.00	radacct	2026-04-08 00:06:00.96034
61a5a728-0711-4a02-8302-e440a1616c85	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619016950	10541182092	0.00	0.00	radacct	2026-04-08 00:06:00.962835
2b59a7d5-27c2-4089-b38f-87e210a82e24	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1471733636	12793969236	0.00	0.00	radacct	2026-04-08 00:06:00.965329
c36b2562-371b-4717-b2fa-cad929edde4d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939546599	19914279796	0.00	0.00	radacct	2026-04-08 00:06:00.967927
02286881-aa1a-4187-b513-41735a98b08b	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498565697	4238770750	0.00	0.00	radacct	2026-04-08 00:06:00.970217
f8cff530-af8f-4990-85c6-d7a204d6f00a	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193512969	2717939118	0.00	0.00	radacct	2026-04-08 00:06:00.972803
de4e03da-56aa-4c5a-aa3f-b61b175d7d22	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61149190	1882453172	0.00	0.00	radacct	2026-04-08 00:06:00.975044
cd14cc5b-675b-4f25-b246-c3c34ca3339a	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	615032283	14484213978	0.00	0.00	radacct	2026-04-08 00:06:00.977557
84f5776f-d622-40ea-8210-751855a9bd8d	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	173785682	1468512173	0.00	0.00	radacct	2026-04-08 00:06:00.979818
f1da14dc-4996-42a3-9a83-d4bdbe376f3b	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2788380026	11756085238	0.00	0.00	radacct	2026-04-08 00:06:00.982244
35d20749-d42c-4116-9db6-0284f4b12e56	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162995527	2958553941	0.00	0.00	radacct	2026-04-08 00:06:00.984502
0894ccd8-0d30-43ed-9356-ec2c87160be4	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718902924	5133178351	0.00	0.00	radacct	2026-04-08 00:06:00.986529
904ab140-1280-4478-94e7-945ffbe143f3	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3450685259	17578512473	0.00	0.00	radacct	2026-04-08 00:06:00.988808
3b3d8df1-c38b-49e0-a97b-40b02af31638	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430449603	16923885940	0.00	0.00	radacct	2026-04-08 00:06:00.990891
60dc2748-6398-4bcb-b345-116cc7cd0945	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859529123	14101826397	0.00	0.00	radacct	2026-04-08 00:06:00.994269
eaa6569c-cf29-46b6-a124-e40b17a6ca2d	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516464072	14182020570	0.00	0.00	radacct	2026-04-08 00:06:00.996586
1ae800b4-34bb-417b-a713-f04a07e12422	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1156272335	15386008694	0.00	0.00	radacct	2026-04-08 00:06:00.999017
116a7573-6623-4f33-b5c1-79be33295cc7	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691955951	13902040258	0.00	0.00	radacct	2026-04-08 00:06:01.001448
a321cc2f-88a4-400d-9513-49c20eeb6360	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407497719	10345097396	0.00	0.00	radacct	2026-04-08 00:06:01.003431
454c707a-4fd3-4499-82c4-f811becd6f03	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756081635	12826475019	0.00	0.00	radacct	2026-04-08 00:06:01.005472
6d20181b-7a78-405e-bf7a-bb1526acc769	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658885291	35178210388	0.00	0.00	radacct	2026-04-08 00:06:01.00736
497b4b98-49d7-410d-845c-291f217ba587	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1369569301	24365391467	0.00	0.00	radacct	2026-04-08 00:06:01.009313
c6dff33e-5dc6-4844-8bb2-c4f3c8b4f702	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773352818	12077065390	0.00	0.00	radacct	2026-04-08 00:06:01.0119
4815f4d4-36fa-4bd3-a7ac-ebc14230fa0c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1803750685	40910700691	0.00	0.00	radacct	2026-04-08 00:06:01.014064
53a69edc-0ea6-440f-ad92-c75810674072	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	221699792	5421859645	0.00	0.00	radacct	2026-04-08 00:06:01.016056
eea62e3b-574d-4db1-b297-461c3b0b9a8e	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494246827	19882890234	0.00	0.00	radacct	2026-04-08 00:06:01.018123
19a7cffb-9bef-401f-a1d7-2588dce8c855	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2306480225	18800158660	0.00	0.00	radacct	2026-04-08 00:06:01.020123
f03713e1-d8d1-48e0-ba33-d2603c7db2ff	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748604415	20392582399	0.00	0.00	radacct	2026-04-08 00:06:01.022145
7366c9eb-40f7-4b00-b136-74116dcdd444	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	627656037	7938149430	0.00	0.00	radacct	2026-04-08 00:06:01.024081
3cdabacc-ef40-4313-bac7-6b0ac2026947	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3180708247	10991238537	0.00	0.00	radacct	2026-04-08 00:06:12.084909
ea510cbb-4495-4af3-8d3a-77fe09bb7650	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	39830970	1532324729	0.00	0.00	radacct	2026-04-08 00:06:12.093089
8e2a0729-5792-4c04-a335-b6423550074d	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49458942	846828159	0.00	0.00	radacct	2026-04-08 00:06:12.09603
e37f3045-f52c-4936-bf66-a5c70c8a2eef	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852484033	16095970868	0.00	0.00	radacct	2026-04-08 00:06:12.09861
77b0f339-c295-492b-9a87-620f594f8caa	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584146258	8819911316	0.00	0.00	radacct	2026-04-08 00:06:12.10142
b3d044c9-cbfa-4e57-b00e-d727c569f704	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66065545	1839481167	0.00	0.00	radacct	2026-04-08 00:06:12.103939
d4a78467-1de6-40bc-9b46-686323a6d106	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2417192975	20167983398	0.00	0.00	radacct	2026-04-08 00:06:12.106743
de4a77dd-0aea-47e1-b4e7-63f6cb6d4b15	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619017226	10541182304	0.00	0.00	radacct	2026-04-08 00:06:12.109792
448d4988-b148-4a73-bd90-09df1662ade5	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1471816922	12794042836	0.00	0.00	radacct	2026-04-08 00:06:12.112287
d789de20-e6da-4f15-84ae-87e0875c2d2a	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939550261	19914288399	0.00	0.00	radacct	2026-04-08 00:06:12.114402
bab23416-d992-463f-be9d-0c503f94772f	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498565781	4238770834	0.00	0.00	radacct	2026-04-08 00:06:12.117039
6482c5e9-483a-4a96-b5d2-13a3ee5636a8	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193513494	2717939629	0.00	0.00	radacct	2026-04-08 00:06:12.119206
99229662-2503-412e-8e7d-cba00f6d7918	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61149617	1882453594	0.00	0.00	radacct	2026-04-08 00:06:12.121778
9584d1eb-5d41-423b-bc59-bd65ccb1ca9b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	615110682	14487980507	0.00	0.00	radacct	2026-04-08 00:06:12.124119
6f754f76-75f9-4685-8007-594f74958bbd	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	173957424	1468871016	0.00	0.00	radacct	2026-04-08 00:06:12.127062
88a095d8-9d6f-45d0-b3bc-58f77f3ef8be	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2788418164	11758255150	0.00	0.00	radacct	2026-04-08 00:06:12.129633
8d006edb-ae48-4c89-b04b-c04ff3db537a	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	162995579	2958553941	0.00	0.00	radacct	2026-04-08 00:06:12.132157
0aae5637-1b5d-49db-94e5-916bd64e6eff	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718908008	5133184886	0.00	0.00	radacct	2026-04-08 00:06:12.134457
c859f81b-5ca6-46ac-8344-1dce15011b15	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3451470293	17579317805	0.00	0.00	radacct	2026-04-08 00:06:12.137223
94ebb994-f55d-489c-b18a-c4f4b68d1316	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430451902	16923886885	0.00	0.00	radacct	2026-04-08 00:06:12.140767
830d3288-4431-44ed-a9a3-cb64c192c196	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859530121	14101827653	0.00	0.00	radacct	2026-04-08 00:06:12.143665
18a9721f-7e9c-4e12-bcb5-dc3d25562e94	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516464304	14182020698	0.00	0.00	radacct	2026-04-08 00:06:12.146232
3b6eeeb4-bc0a-4f93-91c7-aaf37e7b9158	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1156406794	15395406401	0.00	0.00	radacct	2026-04-08 00:06:12.148703
ace8f730-2546-4824-a067-0c363b91b75a	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691959249	13902040587	0.00	0.00	radacct	2026-04-08 00:06:12.151086
dcfbdfcb-6deb-44f8-b25d-8963b0bbc0e5	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407497880	10345097574	0.00	0.00	radacct	2026-04-08 00:06:12.153448
700ca9bd-0695-4ede-8a0c-d7f8f8524af4	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756081673	12826475047	0.00	0.00	radacct	2026-04-08 00:06:12.155897
23077de7-cf81-4a3b-80f6-8b8397eceb44	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658958170	35178276670	0.00	0.00	radacct	2026-04-08 00:06:12.158518
cab48c7b-f82b-4577-bb69-d41b5389a7b1	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1369613933	24366672416	0.00	0.00	radacct	2026-04-08 00:06:12.161291
db17657a-86a8-4b34-995a-d0e0f8cb0927	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773352932	12077065494	0.00	0.00	radacct	2026-04-08 00:06:12.163346
eb4e507e-304e-4ba9-adf5-a70b065a686f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1803855581	40914300040	0.00	0.00	radacct	2026-04-08 00:06:12.1656
541e7788-7d89-4509-a3d5-07d049c45cd2	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	221759440	5423964411	0.00	0.00	radacct	2026-04-08 00:06:12.167846
9d1673eb-b590-493f-b685-401cb333e226	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494259666	19883433037	0.00	0.00	radacct	2026-04-08 00:06:12.170168
27df852e-ada0-4ecb-8767-d1f94c4ed08c	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2306922774	18800676036	0.00	0.00	radacct	2026-04-08 00:06:12.172631
26cd58e1-8463-49b6-8df1-4f29821c3425	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748604455	20392582498	0.00	0.00	radacct	2026-04-08 00:06:12.175348
7cc001f6-39f6-4d61-8ade-adf02736cdc4	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	627813547	7939088214	0.00	0.00	radacct	2026-04-08 00:06:12.178213
1f418405-dc52-4e3f-8cc8-f0b96e72c741	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3180778160	10993159674	0.00	0.00	radacct	2026-04-08 00:06:32.212467
5f7c7771-2a6f-4b84-8c0c-20089bec9521	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	39963958	1534815631	0.00	0.00	radacct	2026-04-08 00:06:32.218976
75fa1761-91d8-4052-906b-78ff8e9077d6	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49483228	846848474	0.00	0.00	radacct	2026-04-08 00:06:32.220811
1883dd4c-9a49-48d5-9aa8-67f824141659	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852484600	16095971176	0.00	0.00	radacct	2026-04-08 00:06:32.222673
6e449840-1fb5-4f84-931c-ce4531341b36	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584146322	8819911396	0.00	0.00	radacct	2026-04-08 00:06:32.224446
ff715dde-09ca-4d1c-8f5e-bf742c38b4d7	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66081102	1839494678	0.00	0.00	radacct	2026-04-08 00:06:32.226598
ee7bdd47-ba66-46b5-bb7c-b73919548a9d	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2417411989	20173151556	0.00	0.00	radacct	2026-04-08 00:06:32.229211
e3d00380-75c0-463c-b74f-0b464908cc9b	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619017865	10541182729	0.00	0.00	radacct	2026-04-08 00:06:32.231327
0069250a-6efc-4398-9c2e-0404078d0d91	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1472447209	12794330236	0.00	0.00	radacct	2026-04-08 00:06:32.232909
162123b4-ecfc-47db-aed8-2519028df50f	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	939582870	19914319565	0.00	0.00	radacct	2026-04-08 00:06:32.234448
22502a82-a50f-4da4-a393-77ffa27f61c3	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498577723	4238789620	0.00	0.00	radacct	2026-04-08 00:06:32.236093
97e7db8c-2de8-446b-8787-e9519e642a32	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193517956	2717945916	0.00	0.00	radacct	2026-04-08 00:06:32.237638
94376cf4-227c-4e13-90f5-e98caf5a786c	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61149701	1882453678	0.00	0.00	radacct	2026-04-08 00:06:32.239227
a20d80cc-9ed6-432e-b4f2-12ef12f1033c	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	615281126	14494467463	0.00	0.00	radacct	2026-04-08 00:06:32.241002
a8ab8229-cf1a-43fb-8eef-e498fdbd8855	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	174716039	1470318779	0.00	0.00	radacct	2026-04-08 00:06:32.242861
92bf7c2e-14e8-4f1d-92b9-7ae295c4f719	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2788443550	11758924580	0.00	0.00	radacct	2026-04-08 00:06:32.245727
9c4be8dd-d083-457a-9b7d-ea863a596648	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163043373	2958876097	0.00	0.00	radacct	2026-04-08 00:06:32.247939
d6362b9d-d01b-414e-8e09-93ab492463ef	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718908176	5133185054	0.00	0.00	radacct	2026-04-08 00:06:32.249872
21228d31-335b-4c6e-988c-fadcabe0d9bd	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3452152419	17582843981	0.00	0.00	radacct	2026-04-08 00:06:32.251687
3cbaf5e0-e61d-474c-a13f-7071a307a297	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430455822	16923888144	0.00	0.00	radacct	2026-04-08 00:06:32.253504
727150bd-f277-4dcb-bd64-5faa2b9cdef7	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859530764	14101828795	0.00	0.00	radacct	2026-04-08 00:06:32.25532
e427b771-1a24-4c77-8963-0f76e4ea9e66	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516471242	14182029290	0.00	0.00	radacct	2026-04-08 00:06:32.257148
3ffe842b-70b5-41f8-b8ed-9ece617d372d	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1156525220	15402845864	0.00	0.00	radacct	2026-04-08 00:06:32.258982
daae80e7-53f6-4ee2-bd7a-af06c0f66a15	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	691974085	13902043632	0.00	0.00	radacct	2026-04-08 00:06:32.261169
c443f3e0-a0f3-4501-b22f-68577b5fa230	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407498125	10345097813	0.00	0.00	radacct	2026-04-08 00:06:32.262921
57e0de0e-5995-4ae1-bebf-476d142a7342	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756081787	12826475103	0.00	0.00	radacct	2026-04-08 00:06:32.264777
28446298-bba6-48bb-a410-30775534bec7	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1658967365	35178289511	0.00	0.00	radacct	2026-04-08 00:06:32.266669
8e20a3fa-8435-4427-886a-c8d356df0d1f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1369852248	24372016823	0.00	0.00	radacct	2026-04-08 00:06:32.268703
6385a48d-97ff-42c8-ad83-9dd40925fecb	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773409832	12077152315	0.00	0.00	radacct	2026-04-08 00:06:32.270825
fa309386-7e50-4a12-bc86-4e1296ae47b8	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1803902450	40915979840	0.00	0.00	radacct	2026-04-08 00:06:32.272952
d38aae5d-3770-4aba-ba6b-88b721bb1ebe	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	221979045	5432603171	0.00	0.00	radacct	2026-04-08 00:06:32.275116
14f39deb-7e95-4926-9f7b-9bbf8a5068ba	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494271402	19884119968	0.00	0.00	radacct	2026-04-08 00:06:32.277441
b8521680-fbef-43ee-bfbe-f788f9418f58	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2307700424	18803425506	0.00	0.00	radacct	2026-04-08 00:06:32.279514
3d927324-0974-49ee-b6bf-5e2f00990936	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748626255	20392598606	0.00	0.00	radacct	2026-04-08 00:06:32.281485
bf5468a0-3901-464d-a71e-ac26fd6c630b	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	627854042	7939679359	0.00	0.00	radacct	2026-04-08 00:06:32.283085
99181394-ce24-451c-8c01-0b4711bdfe9b	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3181224400	11006845682	0.00	0.00	radacct	2026-04-08 00:08:29.037692
f1a46c6f-746f-4a33-888d-a859061360e3	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	41254060	1573334134	0.00	0.00	radacct	2026-04-08 00:08:29.047762
1d30fd05-7fae-4f11-9b80-a8e34a7fb71c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49554903	846912708	0.00	0.00	radacct	2026-04-08 00:08:29.050182
9d3bbde0-6cca-4832-825f-836437cd3f52	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852505532	16096015772	0.00	0.00	radacct	2026-04-08 00:08:29.052349
363608c3-4ca6-4f52-8566-9c748f683221	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584147321	8819913338	0.00	0.00	radacct	2026-04-08 00:08:29.05429
8143cb60-92e4-4115-8af3-4a29f9051e2a	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66087726	1839500829	0.00	0.00	radacct	2026-04-08 00:08:29.056324
98c280ed-3671-4730-b4e8-fc23ba257e14	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2418096566	20183734982	0.00	0.00	radacct	2026-04-08 00:08:29.05842
df1f359c-1609-4d18-ac60-a76158c475b3	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619049623	10541232828	0.00	0.00	radacct	2026-04-08 00:08:29.060983
a573d4f5-25b6-421a-bfa3-61fdb64653a0	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1478810986	12798470838	0.00	0.00	radacct	2026-04-08 00:08:29.063943
d898415d-bfaf-461b-bde3-8d6b623fe62d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940423239	19935531111	0.00	0.00	radacct	2026-04-08 00:08:29.066281
7a2f64ce-e1fd-467e-84af-899d059268f7	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	498637285	4239260455	0.00	0.00	radacct	2026-04-08 00:08:29.068103
6835abb4-6b31-4f45-bb68-23fcdee669d2	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193601218	2718166731	0.00	0.00	radacct	2026-04-08 00:08:29.069702
63a03a98-0219-4dae-98ce-f21cf85061a2	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61213577	1882532682	0.00	0.00	radacct	2026-04-08 00:08:29.071281
089dbdc6-c843-4932-a705-865273bd5845	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	616552321	14548995933	0.00	0.00	radacct	2026-04-08 00:08:29.073126
ebdd670f-59b3-4d81-a161-355624befdb1	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175076844	1470926537	0.00	0.00	radacct	2026-04-08 00:08:29.075416
ec6b9c30-1bf8-4215-a02e-b2200fc6f7f4	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2790521260	11794912769	0.00	0.00	radacct	2026-04-08 00:08:29.078122
07931abe-3990-43b6-975c-669fb3337c29	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163121204	2958978372	0.00	0.00	radacct	2026-04-08 00:08:29.080699
0afa4a9d-88dd-413b-be29-0839d5a133ba	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718911210	5133188752	0.00	0.00	radacct	2026-04-08 00:08:29.082674
eb033801-2f35-4f6a-ab58-b4f073d5f2f0	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3457234083	17650287050	0.00	0.00	radacct	2026-04-08 00:08:29.084387
8332417e-a171-43f6-80dd-e5a99231ebfa	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430582385	16924065923	0.00	0.00	radacct	2026-04-08 00:08:29.085907
3d46fc7b-86e4-4521-8780-8e48ef4fbfa4	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859581073	14101910629	0.00	0.00	radacct	2026-04-08 00:08:29.087693
0119ead8-4e7f-4f7b-b24e-ae954c833a27	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516487604	14182042882	0.00	0.00	radacct	2026-04-08 00:08:29.08946
7ef25db8-0b84-4892-84da-875c92f29b53	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1156940220	15425476803	0.00	0.00	radacct	2026-04-08 00:08:29.091003
4d8b485b-81de-4ad1-8385-bf1dab441ab1	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692015194	13902053502	0.00	0.00	radacct	2026-04-08 00:08:29.093585
d764d556-af7e-4110-8e7c-86c7bcf889cc	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407498125	10345097813	0.00	0.00	radacct	2026-04-08 00:08:29.097131
5dc3fa2b-3e7e-4e0d-93ec-d79bcbf4b503	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756091371	12826485145	0.00	0.00	radacct	2026-04-08 00:08:29.099018
6cb9099f-ba1d-4e52-b84d-5699322f6b2b	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1659122299	35181899585	0.00	0.00	radacct	2026-04-08 00:08:29.10057
3d2653f8-f077-41d0-8417-4d9019ee240b	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1371612024	24403834923	0.00	0.00	radacct	2026-04-08 00:08:29.102053
bdf8fac1-d940-40f5-ae3a-b288dc6a2b4d	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773451175	12077188833	0.00	0.00	radacct	2026-04-08 00:08:29.104007
9e0f068a-91f8-4279-b49c-5e617690948a	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1804728157	40922847193	0.00	0.00	radacct	2026-04-08 00:08:29.105495
47cff5d1-50c9-4c12-a404-7a2556beb413	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	223268396	5479233328	0.00	0.00	radacct	2026-04-08 00:08:29.10706
5f4b5932-4b87-4b72-b834-cf5ceb8a1c37	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494567747	19890662743	0.00	0.00	radacct	2026-04-08 00:08:29.109544
9e05a9fa-0f33-4ac6-92a0-85ea98f84804	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2311481344	18820205387	0.00	0.00	radacct	2026-04-08 00:08:29.111771
bce69d5a-48bf-42f4-a820-72d4957f1838	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748657132	20392645672	0.00	0.00	radacct	2026-04-08 00:08:29.114001
fde417dd-a7e6-46df-8caa-46a42c324e5b	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	628616812	7945996469	0.00	0.00	radacct	2026-04-08 00:08:29.115796
380c5fa3-53db-4bd5-98fc-767cfe585d01	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3181697701	11021406774	0.03	0.97	radacct	2026-04-08 00:10:29.054996
3d4806b2-8917-4960-bd77-01583e8c77dd	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	42518407	1582563036	0.08	0.62	radacct	2026-04-08 00:10:29.062444
17bdfd96-a064-4d07-a2dd-4cbdb9348ae5	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49603594	846945850	0.00	0.00	radacct	2026-04-08 00:10:29.064764
880c2cb9-c59d-4e2b-a161-a205f77624bb	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852543460	16096064769	0.00	0.00	radacct	2026-04-08 00:10:29.067192
da0d468d-4a6f-444d-89c4-d5290ef0223e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584160881	8819930538	0.00	0.00	radacct	2026-04-08 00:10:29.069419
af89fc55-c2fe-4db9-b21e-fa27a7d71dc2	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66128705	1839529679	0.00	0.00	radacct	2026-04-08 00:10:29.071979
e7ef34b7-3372-4c66-8aad-587d56acf785	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2418568387	20190667837	0.03	0.46	radacct	2026-04-08 00:10:29.075184
f6d08c9c-65ac-47c2-a180-0e2dd71a2838	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619072502	10541256338	0.00	0.00	radacct	2026-04-08 00:10:29.077408
d4f1e118-e60a-4c43-8f32-e28b2040b288	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1483974937	12800404742	0.34	0.13	radacct	2026-04-08 00:10:29.079715
6b2ccd51-fade-4500-bb30-9631b9ac50a0	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940432792	19935547238	0.00	0.00	radacct	2026-04-08 00:10:29.082084
8fe304b7-75d8-4e2a-9355-87183e750d5c	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499061111	4242189390	0.03	0.20	radacct	2026-04-08 00:10:29.084902
791099da-270d-4eb2-827a-7eac11ec7490	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193792462	2718633168	0.01	0.03	radacct	2026-04-08 00:10:29.087652
1fd3b70d-1dd8-4b45-b22a-f50f00c0d986	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61214515	1882534176	0.00	0.00	radacct	2026-04-08 00:10:29.0906
a406defd-0509-42a9-8152-6c5401c0f91e	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	617717451	14589599738	0.08	2.71	radacct	2026-04-08 00:10:29.09336
67e7a995-98e7-4645-8eca-3c7f9414bae9	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175131919	1470984938	0.00	0.00	radacct	2026-04-08 00:10:29.095893
ab238916-3160-4910-8f24-1c65d167d853	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2793934121	11892117318	0.23	6.48	radacct	2026-04-08 00:10:29.098419
fa08cab2-6722-409b-b379-3a4b0143453a	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163126743	2958983180	0.00	0.00	radacct	2026-04-08 00:10:29.101567
0680f1d7-a1bd-461b-bb74-e42403dadc6b	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718916537	5133199439	0.00	0.00	radacct	2026-04-08 00:10:29.10462
0702adc4-933c-4823-87ff-8c4c47c78655	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3459837903	17678376064	0.17	1.87	radacct	2026-04-08 00:10:29.107421
ea7a0dab-8b0e-4864-8a4c-bf16092924ce	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430630598	16924099180	0.00	0.00	radacct	2026-04-08 00:10:29.110206
cb1095b7-4081-45d9-883a-b67fbfe655fa	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859657088	14102010334	0.01	0.01	radacct	2026-04-08 00:10:29.112924
f493e73e-9489-4a74-acbc-a38d814b18d8	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516518887	14182062049	0.00	0.00	radacct	2026-04-08 00:10:29.115402
da9fb6af-831a-4819-95b7-2e40c2e17a06	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1158228825	15457823852	0.09	2.16	radacct	2026-04-08 00:10:29.117933
08ed382d-3f9d-4303-8a3e-440309cece4f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692065311	13902065072	0.00	0.00	radacct	2026-04-08 00:10:29.120469
8b62f7b5-59c2-4c06-bfd7-37eb39e931b2	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407757922	10345330023	0.02	0.02	radacct	2026-04-08 00:10:29.122884
506471e6-c3da-4437-8ab3-fcae0ca405ee	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756111403	12826521117	0.00	0.00	radacct	2026-04-08 00:10:29.125664
06c5f339-ae07-48d7-bb5e-b6c1c0fc1267	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1659389453	35186372850	0.02	0.30	radacct	2026-04-08 00:10:29.12815
56c1b6dc-3021-417f-970a-2892672da6e6	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1373011288	24429970505	0.09	1.74	radacct	2026-04-08 00:10:29.130863
0041e590-1984-436e-ab65-ea4646a4b1e3	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773495543	12077242459	0.00	0.00	radacct	2026-04-08 00:10:29.133972
88fe1edf-f08a-435d-b389-2da1e697275b	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1805412904	40946619224	0.05	1.58	radacct	2026-04-08 00:10:29.136411
292ff443-e74a-42e3-a4f8-bca3b60a27f7	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	224846169	5534265841	0.11	3.67	radacct	2026-04-08 00:10:29.138879
f6c32c42-1274-4d9b-ac93-c1eaf8e2aa4b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2494738990	19896027794	0.01	0.36	radacct	2026-04-08 00:10:29.141668
3a2252ad-d148-404a-ba60-62bdfc753494	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2315594752	18875168181	0.27	3.66	radacct	2026-04-08 00:10:29.144069
95871f29-d2bc-48aa-b564-3e28c9fe6075	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2748833247	20393187862	0.01	0.04	radacct	2026-04-08 00:10:29.146728
0c2310cb-7193-4e2f-9b7c-8ae85d8cafe8	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	629813151	7966036080	0.08	1.34	radacct	2026-04-08 00:10:29.149147
9e8b8f09-defe-4b96-969f-06b8d80960b6	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3182178183	11036133721	0.03	0.98	radacct	2026-04-08 00:12:29.054096
c5b14e37-43f3-45eb-a41a-25d4549358a7	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	43256694	1604608139	0.05	1.47	radacct	2026-04-08 00:12:29.058977
9b581cc6-0222-40fa-9eae-910927c99bdb	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49639345	846993642	0.00	0.00	radacct	2026-04-08 00:12:29.062333
47e69a20-597f-4062-8f49-20e0a27e69f4	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852630061	16096163512	0.01	0.01	radacct	2026-04-08 00:12:29.065814
8e97215b-cb4b-49cc-855f-f69a7e0bd9a8	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584173250	8819945487	0.00	0.00	radacct	2026-04-08 00:12:29.069768
cfc4e85e-1db4-425f-814e-da1e4ae7e9eb	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66185395	1839687976	0.00	0.01	radacct	2026-04-08 00:12:29.073663
68d478b5-dc7d-459d-830b-5b0407d0c946	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2419633418	20198913734	0.07	0.55	radacct	2026-04-08 00:12:29.077535
4f92b6a4-31f6-4c91-a8e2-b0434cb4a6d5	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619087563	10541274511	0.00	0.00	radacct	2026-04-08 00:12:29.081993
91140c94-6759-41fd-a0ad-458986afed24	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1490096482	12803707368	0.41	0.22	radacct	2026-04-08 00:12:29.086441
de9f2e66-cdae-47c6-a5c3-9de2b53b21e5	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940438359	19935552737	0.00	0.00	radacct	2026-04-08 00:12:29.090406
5e18352e-339f-43c9-b04b-650e1d1419fe	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499119057	4242240412	0.00	0.00	radacct	2026-04-08 00:12:29.094136
e1997cb9-3bc1-4897-992e-5fd4e1bdabe3	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193986085	2718996729	0.01	0.02	radacct	2026-04-08 00:12:29.097712
78245ac8-b31d-4897-9f93-af06e0e87ed5	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61218423	1882538124	0.00	0.00	radacct	2026-04-08 00:12:29.100533
dcf37b4e-1dbf-4ea8-9a10-a4673b6ac5be	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	620783621	14667817094	0.20	5.21	radacct	2026-04-08 00:12:29.103685
c0c71e11-f23e-44a6-b5d1-05d9b67e320f	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175218239	1471091630	0.01	0.01	radacct	2026-04-08 00:12:29.107823
f2883116-97f4-4d8b-a40c-57cfb55f361c	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2794917454	11941693785	0.07	3.31	radacct	2026-04-08 00:12:29.111303
b0693524-8971-47d3-ae70-63fc46c1d864	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163142990	2958994801	0.00	0.00	radacct	2026-04-08 00:12:29.115046
00c9de5d-5b62-4dd3-bbdc-89e6428fdc5e	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718924957	5133214274	0.00	0.00	radacct	2026-04-08 00:12:29.118052
91417dc5-a858-4f61-aaee-2c83e1eee9ae	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3461841788	17700159672	0.13	1.45	radacct	2026-04-08 00:12:29.121058
d7879032-3401-4eb1-b54c-45a00dc9613d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430672223	16924131773	0.00	0.00	radacct	2026-04-08 00:12:29.124545
a8feb971-7b35-4832-b752-e15f4b5133e6	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859702453	14102076780	0.00	0.00	radacct	2026-04-08 00:12:29.12787
ed49f88d-14c3-4fbb-87a4-19603c717b3a	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516601829	14182136056	0.01	0.00	radacct	2026-04-08 00:12:29.131532
c008b3e2-fb65-4168-97fd-7f8fc31ed3fc	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1159342531	15507665952	0.07	3.32	radacct	2026-04-08 00:12:29.134902
886c7719-e333-4a28-bcb1-6ce50b60014e	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692125796	13902097450	0.00	0.00	radacct	2026-04-08 00:12:29.138331
40fbb8fa-1515-42fc-aacd-c411322262df	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407758376	10345331553	0.00	0.00	radacct	2026-04-08 00:12:29.143582
911195d2-8713-4592-8d1c-0baf6f7bab0f	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756133468	12826553940	0.00	0.00	radacct	2026-04-08 00:12:29.147692
f444cbb0-9f9b-460b-883a-182b1b0c7536	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1659830370	35189270376	0.03	0.19	radacct	2026-04-08 00:12:29.154883
4f6ea4ea-6c20-4cb9-9222-e0d80eadece4	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1373778212	24444674140	0.05	0.98	radacct	2026-04-08 00:12:29.160008
46433faa-68d2-4249-a281-822de311c7a3	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773507488	12077248994	0.00	0.00	radacct	2026-04-08 00:12:29.164752
30088805-aa55-48fc-b61c-56826741b56f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1807343288	40976272093	0.13	1.98	radacct	2026-04-08 00:12:29.167887
6cadca4c-dd38-4a67-a173-f2f64338a9b5	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	226580061	5593494477	0.12	3.95	radacct	2026-04-08 00:12:29.170855
a2220ba5-990f-47d8-b5dd-a6dfea6fc1e5	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2495132536	19901414465	0.03	0.36	radacct	2026-04-08 00:12:29.174417
3dcd1061-1b6c-4931-bbb7-10d08b1a6034	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2321333065	18936123849	0.38	4.06	radacct	2026-04-08 00:12:29.177899
ced567c5-5c89-4a08-915c-46d1513cb40a	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2749301516	20403351375	0.03	0.68	radacct	2026-04-08 00:12:29.180893
aa69dc49-8bce-4b44-bde2-81899c324be0	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	630334008	7971405499	0.03	0.36	radacct	2026-04-08 00:12:29.184227
962afbec-a966-4daf-becb-93c288196333	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3182239135	11038032832	0.00	0.00	radacct	2026-04-08 00:12:44.775305
397381e9-fa3e-4402-b38d-56d2c52d2351	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	43337376	1610645409	0.00	0.00	radacct	2026-04-08 00:12:44.783115
859e267e-620e-48b6-8926-a4f27038783f	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49639487	846994686	0.00	0.00	radacct	2026-04-08 00:12:44.785636
c99a3253-81d3-473e-bc36-21a838dcc949	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852644140	16096173968	0.00	0.00	radacct	2026-04-08 00:12:44.78785
7b35212e-28f1-44db-a71b-7c30ff2dd9d1	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584173495	8819945684	0.00	0.00	radacct	2026-04-08 00:12:44.790449
41028dc0-3bf3-4481-ba04-213a00b600aa	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66186376	1839688962	0.00	0.00	radacct	2026-04-08 00:12:44.792907
73ad39b1-47f4-4e64-aa2d-58b319ed9d8a	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2420347648	20207130921	0.00	0.00	radacct	2026-04-08 00:12:44.795231
ecd569f8-28b9-464a-a829-7b775dd037ed	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619087875	10541274663	0.00	0.00	radacct	2026-04-08 00:12:44.797249
41e13466-8c42-422f-b062-8b2f812f0c53	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1490304838	12804169321	0.00	0.00	radacct	2026-04-08 00:12:44.799077
b5656543-67ee-4a40-aa17-9f101cc99964	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940438628	19935553016	0.00	0.00	radacct	2026-04-08 00:12:44.800802
67255c54-ea02-45d4-8883-4a41b717cf3d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499119386	4242240934	0.00	0.00	radacct	2026-04-08 00:12:44.802984
3071ad47-5847-43a0-83c4-2a8cf1e4197c	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	193987185	2718997820	0.00	0.00	radacct	2026-04-08 00:12:44.804939
d4ebeaa9-a763-4f85-be58-cb7169aaad9e	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61218507	1882538208	0.00	0.00	radacct	2026-04-08 00:12:44.807196
fd0e8810-57df-4bc2-b529-29a645ab2f38	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	621011599	14674976126	0.00	0.00	radacct	2026-04-08 00:12:44.809467
b8259d79-d0eb-4190-ac45-e9247c639b31	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175270747	1471216214	0.00	0.00	radacct	2026-04-08 00:12:44.81165
70f23709-f51c-4091-8368-e0536f2a32e0	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2794929473	11941721343	0.00	0.00	radacct	2026-04-08 00:12:44.814058
9ece8947-e48b-4c6f-b4b1-db181d51b986	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163142990	2958994801	0.00	0.00	radacct	2026-04-08 00:12:44.816109
6526df9e-bcaa-44ad-a775-e76fc00e368e	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718925041	5133214358	0.00	0.00	radacct	2026-04-08 00:12:44.818255
19a2fa4e-39e9-4a86-b358-c4275d045c3c	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3461977883	17701549485	0.00	0.00	radacct	2026-04-08 00:12:44.820242
478ffcfe-eafb-4bfa-8fe7-23a9692f561b	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430673905	16924132219	0.00	0.00	radacct	2026-04-08 00:12:44.822191
5c4b6c0d-d848-465c-acf3-7931b066a87d	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	859706685	14102078626	0.00	0.00	radacct	2026-04-08 00:12:44.824779
d9a5540a-8661-40b2-8215-21b56aa96be8	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516605884	14182139084	0.00	0.00	radacct	2026-04-08 00:12:44.827052
3f422ab6-98cf-46b4-897e-df0ab720f1ea	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1159504797	15516676366	0.00	0.00	radacct	2026-04-08 00:12:44.829245
845ec5fa-c9b7-4a41-aaa7-872ec05c9b85	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692132510	13902098970	0.00	0.00	radacct	2026-04-08 00:12:44.831199
462fa5f3-fefc-48ea-9305-a6eb8d665fdd	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407758485	10345331662	0.00	0.00	radacct	2026-04-08 00:12:44.833175
582bd2fe-8cc6-4267-9a26-9de7b885b837	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756136860	12826577254	0.00	0.00	radacct	2026-04-08 00:12:44.83519
67171889-e560-41fa-956b-b045d4e0d481	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1659838154	35189279245	0.00	0.00	radacct	2026-04-08 00:12:44.837413
d9e8307d-be50-439d-b648-f2124d538a5f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1373789043	24444708463	0.00	0.00	radacct	2026-04-08 00:12:44.842804
2ff53ef8-74e3-4121-b00f-f9399aa14f98	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773507526	12077249022	0.00	0.00	radacct	2026-04-08 00:12:44.846591
0897bfae-aa53-4753-ae4f-e8c10577868a	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1807465266	40983241550	0.00	0.00	radacct	2026-04-08 00:12:44.848983
9f9c58e5-c468-4734-ba5b-c1e72130ba71	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	226647551	5594573439	0.00	0.00	radacct	2026-04-08 00:12:44.851026
7881bdf9-1ba1-4a1b-9ca6-b3fa8ffaa6aa	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2495578309	19902459690	0.00	0.00	radacct	2026-04-08 00:12:44.853069
3baa52f0-38e8-41df-b1a1-d945a0459622	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2321749688	18936746596	0.00	0.00	radacct	2026-04-08 00:12:44.855144
1b716297-cc7f-4903-9f5f-6b6ea2dfeb75	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2749305354	20403370520	0.00	0.00	radacct	2026-04-08 00:12:44.857941
d2a471ee-b505-4fed-b5ca-66c46f431fd2	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	630383023	7971434663	0.00	0.00	radacct	2026-04-08 00:12:44.860084
b0362f4f-038e-4790-a670-f969ca4b8fad	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3182308112	11040374467	0.00	0.00	radacct	2026-04-08 00:13:05.547518
a2b69b45-66ba-4a9e-a136-2564206409ce	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	43369472	1614337868	0.00	0.00	radacct	2026-04-08 00:13:05.55404
f7f64c1a-ca3c-423a-b1e1-4f61f5743be4	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49639836	846995660	0.00	0.00	radacct	2026-04-08 00:13:05.556448
582196d5-57a2-40ea-8a1f-16b40d597553	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852655807	16096193282	0.00	0.00	radacct	2026-04-08 00:13:05.558876
a47db074-540f-4ba2-b699-18d0753b1726	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584173755	8819945968	0.00	0.00	radacct	2026-04-08 00:13:05.561157
39301093-5a42-45b2-bdc2-9eff7e3c9bd8	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66195526	1839725908	0.00	0.00	radacct	2026-04-08 00:13:05.56334
8dd2a661-1a6d-423f-9d2b-06abfd5788a3	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2421091549	20216182212	0.00	0.00	radacct	2026-04-08 00:13:05.565452
cb0e922c-aea4-4b4a-b07a-ea64df49cfa3	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619088651	10541275555	0.00	0.00	radacct	2026-04-08 00:13:05.567566
b14af642-62e6-4ade-b6fc-470cf1522e2e	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1490572168	12804769900	0.00	0.00	radacct	2026-04-08 00:13:05.569648
c1a96809-603a-444f-b52a-9d16ecaae205	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940439053	19935553425	0.00	0.00	radacct	2026-04-08 00:13:05.57154
9c664059-9e22-4b16-b976-4748857e3fe7	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499119987	4242241747	0.00	0.00	radacct	2026-04-08 00:13:05.573799
bfc16dfb-bdca-412b-907e-47ec750a9a33	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	194008952	2719016948	0.00	0.00	radacct	2026-04-08 00:13:05.576012
acc25056-be76-40c0-8251-8c8945afa0d8	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61220811	1882538690	0.00	0.00	radacct	2026-04-08 00:13:05.578036
a4a7fb07-7f05-4872-8c35-37c46de881c4	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	621343004	14686488411	0.00	0.00	radacct	2026-04-08 00:13:05.580001
c97bf1ba-f695-42b1-b2b0-ecd827086ddb	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175282448	1471252940	0.00	0.00	radacct	2026-04-08 00:13:05.581874
8264001d-e3da-4da2-afb4-08ee15db81f4	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2795311942	11960809154	0.00	0.00	radacct	2026-04-08 00:13:05.583873
01b73124-4985-426d-b0df-36414f0d4b91	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163143430	2958995147	0.00	0.00	radacct	2026-04-08 00:13:05.585864
04e3eec4-e121-482c-b248-9968a9ab6ebf	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718928298	5133217482	0.00	0.00	radacct	2026-04-08 00:13:05.588073
bb3d83fa-1f6a-4858-8fbc-c5fbbba76c4e	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3462260229	17703054845	0.00	0.00	radacct	2026-04-08 00:13:05.59042
cc6dc256-993e-491a-8321-d1139caa284d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430685108	16924143145	0.00	0.00	radacct	2026-04-08 00:13:05.59259
26d7b5dd-29ec-4894-92d8-b8c23d6299d6	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	860459457	14116145771	0.00	0.00	radacct	2026-04-08 00:13:05.594665
fb7eafdf-f5d7-4102-8978-926b64c8acb8	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516610892	14182140206	0.00	0.00	radacct	2026-04-08 00:13:05.596632
4d04f7e4-bcdc-44f2-ad34-acc7cea1d1e8	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1159728749	15516688414	0.00	0.00	radacct	2026-04-08 00:13:05.598495
03fb5da9-c6b9-4fc0-9040-31102155a31e	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692137693	13902099511	0.00	0.00	radacct	2026-04-08 00:13:05.600349
6aba7e31-0477-4aed-85f6-f53af90d5db2	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407758833	10345332211	0.00	0.00	radacct	2026-04-08 00:13:05.602308
8f83fa25-57f5-4f5c-af46-990dc0f55942	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756137402	12826577754	0.00	0.00	radacct	2026-04-08 00:13:05.604398
9c551393-0f71-4160-a605-36606427d976	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1660140244	35193202213	0.00	0.00	radacct	2026-04-08 00:13:05.60653
97d23e05-2061-4d31-bea8-debe4c61955e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1373800858	24444724549	0.00	0.00	radacct	2026-04-08 00:13:05.608685
88a103ae-caf5-410a-85b7-bcc761b59e40	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773667579	12077283363	0.00	0.00	radacct	2026-04-08 00:13:05.610819
d4eb793a-17f0-4555-ade6-6d9d94249a2e	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1807985186	40994919706	0.00	0.00	radacct	2026-04-08 00:13:05.612846
c75b1413-76c4-4fce-a5a0-c99b5883209d	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	226782243	5600185493	0.00	0.00	radacct	2026-04-08 00:13:05.614821
d2683099-0445-4ab2-ae50-d3a5a0659efb	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2496355234	19907560855	0.00	0.00	radacct	2026-04-08 00:13:05.616791
f74c5400-d2a1-44a1-8723-f83989801430	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2322631396	18941514440	0.00	0.00	radacct	2026-04-08 00:13:05.618766
a540be22-1d2d-489d-97aa-2c1fee074890	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2749623542	20412737664	0.00	0.00	radacct	2026-04-08 00:13:05.620741
dee0f2e2-90b3-41b1-bd4d-c696b9dafb6c	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	630477373	7972350649	0.00	0.00	radacct	2026-04-08 00:13:05.622674
5c2c2694-ce07-41f8-b852-f510dfd34ef0	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3182735851	11053780921	0.03	0.89	radacct	2026-04-08 00:15:05.558883
524ba005-0801-471a-9600-4dc364f56a78	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	43589985	1626701882	0.01	0.82	radacct	2026-04-08 00:15:05.571507
da856729-7299-444c-bbd3-759b6d678331	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49642910	846997536	0.00	0.00	radacct	2026-04-08 00:15:05.575793
23c9b934-ee81-48ef-b1e3-b55c2db3bf38	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852689674	16096210716	0.00	0.00	radacct	2026-04-08 00:15:05.579374
dd563a99-3620-4766-816f-0f2e6bbef3a0	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584261784	8820072369	0.01	0.01	radacct	2026-04-08 00:15:05.583373
61f1e71f-f0d6-4066-a65e-148d3135656c	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66209258	1839740752	0.00	0.00	radacct	2026-04-08 00:15:05.590552
4f6368f2-e27c-46e5-be06-c6e357d724e2	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2424696226	20248713577	0.24	2.17	radacct	2026-04-08 00:15:05.595944
bb01c774-5df2-40f9-9d5b-97ff7e8944f3	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619317350	10541463572	0.02	0.01	radacct	2026-04-08 00:15:05.600148
64f77acb-3593-4522-b301-41fca8a96bab	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1494382737	12818547591	0.25	0.92	radacct	2026-04-08 00:15:05.604782
69b07bdd-aae5-4384-98f8-4c0ad552ea5c	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940444711	19935560984	0.00	0.00	radacct	2026-04-08 00:15:05.609605
0e6e83b6-d8dd-45e7-a6e4-f20453b87eb6	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499219072	4243336976	0.01	0.07	radacct	2026-04-08 00:15:05.613196
dbb71db3-1b00-4a5f-902b-18291079698c	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	194186183	2719234033	0.01	0.01	radacct	2026-04-08 00:15:05.617159
1f571830-19d8-4953-8442-aaa8761bbd2b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61232076	1882565387	0.00	0.00	radacct	2026-04-08 00:15:05.621849
784ada51-d03c-4e98-969f-743e2fa4608d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	623217264	14747541779	0.12	4.07	radacct	2026-04-08 00:15:05.626164
a6df8b7a-05d8-4006-800c-1e442d813074	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175364612	1472376914	0.01	0.07	radacct	2026-04-08 00:15:05.631408
cbc49977-0686-448b-a89c-89a32ae106c1	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2796147725	11998025336	0.06	2.48	radacct	2026-04-08 00:15:05.634866
f554a508-1c65-4272-9c63-36a9b8b26832	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163195828	2959083910	0.00	0.01	radacct	2026-04-08 00:15:05.640225
55b469da-5510-4999-8fbc-392d471bbd0c	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	718943700	5133453948	0.00	0.02	radacct	2026-04-08 00:15:05.643949
a75c21bc-c142-4de7-a6f8-bf59e7964c25	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3464050601	17722101598	0.12	1.27	radacct	2026-04-08 00:15:05.647323
a16b46fb-519b-436c-9645-db5d4d9c9ca4	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430724935	16924167515	0.00	0.00	radacct	2026-04-08 00:15:05.651642
16b02918-270e-4086-81ec-2f6032c12cd5	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	861163080	14127864804	0.05	0.78	radacct	2026-04-08 00:15:05.655598
cd31cd2a-8d61-4e55-b8cd-898f32286b1c	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516619022	14182148144	0.00	0.00	radacct	2026-04-08 00:15:05.660285
9446a65c-9096-4de7-866b-d659843b1909	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1160500244	15552090469	0.05	2.36	radacct	2026-04-08 00:15:05.66433
885694ae-9d2f-4cd0-9e30-8c7341a0b0e6	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692192402	13902117285	0.00	0.00	radacct	2026-04-08 00:15:05.668222
ccfac1c3-161c-494b-9046-b32119ceec07	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407758833	10345332211	0.00	0.00	radacct	2026-04-08 00:15:05.673112
f29335a5-33bd-458d-a416-20b90e94aac9	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756142859	12826585423	0.00	0.00	radacct	2026-04-08 00:15:05.67603
804b4b80-c411-40af-89d3-195097d087e6	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1660204707	35194213438	0.00	0.07	radacct	2026-04-08 00:15:05.679787
3574569b-3851-4e6f-9db0-80ff333b7755	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1374516425	24459102727	0.05	0.96	radacct	2026-04-08 00:15:05.683564
9d7040e7-6f7b-45e3-9c1e-03bdaebddefe	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773727062	12077305839	0.00	0.00	radacct	2026-04-08 00:15:05.687624
325ee5b3-13ab-4658-aa26-93e8cc135b30	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1809315607	41024887842	0.09	2.00	radacct	2026-04-08 00:15:05.691601
d80e4c5f-d72b-4e30-8e23-15db69990c80	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	227851298	5633654780	0.07	2.23	radacct	2026-04-08 00:15:05.695845
d48f618b-bf0a-4819-a690-a32c2dd85ad4	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2496787194	19917939758	0.03	0.69	radacct	2026-04-08 00:15:05.699642
1da1dfde-52bf-433a-8ab6-bfe16236e79f	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2327891020	19011869058	0.35	4.69	radacct	2026-04-08 00:15:05.703642
f37c9bcc-954c-43f8-82ae-903a984d387f	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2752007664	20486600277	0.16	4.92	radacct	2026-04-08 00:15:05.707895
0bf520ff-494c-4da7-861d-7bbddbf85131	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	631745797	7985865514	0.08	0.90	radacct	2026-04-08 00:15:05.711342
977c4fe2-d591-403b-9ffe-243c2e5597a6	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183210298	11065693402	0.03	0.79	radacct	2026-04-08 00:17:05.62055
f085429b-c8e6-47b5-8176-9e4af2a99b93	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	43731771	1640344691	0.01	0.91	radacct	2026-04-08 00:17:05.631881
28137f44-4a20-4824-8806-9e50169f055d	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49644299	846998335	0.00	0.00	radacct	2026-04-08 00:17:05.635271
ff7dfd11-d1bc-4d1d-a66f-f57754f2e252	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852729772	16096281061	0.00	0.00	radacct	2026-04-08 00:17:05.639327
1f304fd5-effd-4a10-bf0d-48953d3cb9e7	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584290862	8820423567	0.00	0.02	radacct	2026-04-08 00:17:05.64234
687c54ad-9f71-4aca-a55c-ea42f10f3ea5	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66242671	1839799651	0.00	0.00	radacct	2026-04-08 00:17:05.64555
2774700c-e3d8-40f3-af0e-5921e9d4078a	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2426427751	20258370831	0.12	0.64	radacct	2026-04-08 00:17:05.648357
22ddfce7-a0d9-45d1-982c-0054a19eec2d	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619383922	10541601168	0.00	0.01	radacct	2026-04-08 00:17:05.651264
cb12233e-7e8a-4ac6-8942-01b54b31d822	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1503187484	12828160453	0.59	0.64	radacct	2026-04-08 00:17:05.654968
bf156756-92d2-4885-81a8-0bdec1b7b4ae	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940469312	19935599029	0.00	0.00	radacct	2026-04-08 00:17:05.658419
9d92289d-a974-4ae5-acad-ce4d020f7de7	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499278908	4243422282	0.00	0.01	radacct	2026-04-08 00:17:05.66239
08438289-1634-4f94-9620-cdda99c9b3ee	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	194253166	2719317169	0.00	0.01	radacct	2026-04-08 00:17:05.667377
642ab3a2-66d9-4685-b7de-f1999addd1c4	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61263446	1882636522	0.00	0.00	radacct	2026-04-08 00:17:05.671761
71e89e6e-f222-4860-aef9-2820dc20e437	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	624992311	14801853125	0.12	3.62	radacct	2026-04-08 00:17:05.679439
1c3d3499-ce65-4fa1-8586-3c63e4571c61	0ce4ec60-8454-459f-8ada-b540758b3877	63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	175440069	1472493979	0.01	0.01	radacct	2026-04-08 00:17:05.683599
2e35b678-2cea-4d8b-8539-729267ea8b25	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2797278196	12053257602	0.08	3.68	radacct	2026-04-08 00:17:05.688057
e1cad502-1e63-41b9-a5ed-6064c684a866	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	163226704	2959118921	0.00	0.00	radacct	2026-04-08 00:17:05.692126
01180a9c-6eaa-433e-abb5-536184b21b4f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719020730	5135344328	0.01	0.13	radacct	2026-04-08 00:17:05.696067
139ba0ac-c70c-4ab8-9785-86daa38bedd3	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3466484623	17748239699	0.16	1.74	radacct	2026-04-08 00:17:05.699928
35345815-70e8-4535-8b95-49d8815ca761	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430783704	16924209617	0.00	0.00	radacct	2026-04-08 00:17:05.704133
3fe2233d-0752-4d01-a230-247ea10e57df	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	861644100	14130908506	0.03	0.20	radacct	2026-04-08 00:17:05.708124
499a4fec-1ddd-46c6-9dcb-828e26e50fad	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516646564	14182173267	0.00	0.00	radacct	2026-04-08 00:17:05.711935
d86d54e5-3f70-4f62-911e-a271a0e7a987	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1161629034	15597638813	0.08	3.03	radacct	2026-04-08 00:17:05.71568
e39e21b8-62d4-4900-916a-a42500950c4b	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692256624	13902133464	0.00	0.00	radacct	2026-04-08 00:17:05.72017
6cb1220d-ede3-468a-a08b-a914e2e521d9	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761103	10345335031	0.00	0.00	radacct	2026-04-08 00:17:05.725106
1aa846e3-07cf-4765-8714-e97d6f737190	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756260101	12826914132	0.01	0.02	radacct	2026-04-08 00:17:05.729012
59176791-3c7e-4675-9646-f0df7e470ea0	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1660386545	35198127643	0.01	0.26	radacct	2026-04-08 00:17:05.73294
1ae98b2a-07a0-492c-b4de-be641b5b63e3	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1375792828	24496245711	0.09	2.47	radacct	2026-04-08 00:17:05.737216
ae8b4989-953a-4cf4-89b1-da31d145182d	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773851512	12077520967	0.01	0.01	radacct	2026-04-08 00:17:05.741319
5c8cab2a-e763-4400-a5ca-f4e429a99cb7	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1810522225	41041142358	0.08	1.08	radacct	2026-04-08 00:17:05.74524
96506038-a70e-41b4-b9ce-31480fa187d4	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	228815600	5653947324	0.06	1.35	radacct	2026-04-08 00:17:05.749046
b7ea2c1d-58e4-49bb-b177-3940e0f3c86d	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2498136628	19961072003	0.09	2.87	radacct	2026-04-08 00:17:05.753283
ba7ac9c8-e50b-405e-9261-8ee37734a132	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2332667220	19044561146	0.32	2.18	radacct	2026-04-08 00:17:05.757533
9bf296f0-a10c-4ee6-bd7e-3f78cd1540e5	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2753184178	20511756990	0.08	1.68	radacct	2026-04-08 00:17:05.761391
e327d693-2188-4f5c-8144-73bc745ff0ed	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	632508260	7996617208	0.05	0.72	radacct	2026-04-08 00:17:05.765143
8a98c8fa-dedb-43f2-96ee-08ff140f9597	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183396533	11066206544	0.01	0.03	radacct	2026-04-08 00:19:05.554571
03400d33-ba6e-4026-8070-c19f2e3bae52	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	44251230	1655863423	0.03	1.04	radacct	2026-04-08 00:19:05.562356
da843ff6-7fbb-42f7-8e08-a5204c351d53	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49657144	847056095	0.00	0.00	radacct	2026-04-08 00:19:05.564994
4f4e1022-b368-4850-b915-feea0050e91f	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852736876	16096288083	0.00	0.00	radacct	2026-04-08 00:19:05.567317
19173c56-0506-4cce-89b9-ece30cb9685e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584292063	8820425471	0.00	0.00	radacct	2026-04-08 00:19:05.570817
ebf7840f-c4ef-4820-9e01-9c91631e8854	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66339990	1840118667	0.01	0.02	radacct	2026-04-08 00:19:05.573799
c20e42ab-44b3-4633-b1e4-1f5e6a2cd5f5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2428043374	20283733258	0.11	1.69	radacct	2026-04-08 00:19:05.576681
36c21671-f9f2-40d1-8bad-40808dedc4df	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619402509	10541627373	0.00	0.00	radacct	2026-04-08 00:19:05.578893
f8b73432-207b-4a72-8098-7b3631740219	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1515371769	12831495988	0.81	0.22	radacct	2026-04-08 00:19:05.581004
c8d3066e-2167-4a6b-be23-7f5d0e1eb0e7	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940477425	19935606639	0.00	0.00	radacct	2026-04-08 00:19:05.583297
f9d89303-3820-4d0c-a5a0-a63261cdf30b	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499347511	4243507807	0.00	0.01	radacct	2026-04-08 00:19:05.586386
3e1da364-42b9-411c-8d9e-8ae3d5359a05	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	9325	12619	0.00	0.00	radacct	2026-04-08 00:19:05.589266
f20c7ac2-588f-4d31-860e-ae39b9b4d7f9	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61495199	1883239885	0.02	0.04	radacct	2026-04-08 00:19:05.59122
9ce8a0b3-fb47-4875-984e-86b1bd086c5f	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	626146534	14840786014	0.08	2.60	radacct	2026-04-08 00:19:05.593647
18596b88-eb58-4701-9ca7-37e1e3ad9c6b	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2798023413	12095140333	0.05	2.79	radacct	2026-04-08 00:19:05.595612
a03e2f4f-5122-4f8e-a4d9-774ffd09b9c4	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	0	0	0.00	0.00	radacct	2026-04-08 00:19:05.59746
63f8cf66-788e-4750-b080-ba5078a38353	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719124476	5142466885	0.01	0.48	radacct	2026-04-08 00:19:05.599331
c226a41e-a34e-4ee1-8c7f-b03ba302bccb	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3473760835	17775586215	0.49	1.82	radacct	2026-04-08 00:19:05.601674
4f2e535f-8149-4bec-a721-ad88eba05db6	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430839763	16924250067	0.00	0.00	radacct	2026-04-08 00:19:05.604724
450d8046-3380-47fa-be0a-d3fe098eded1	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	862235701	14133986794	0.04	0.21	radacct	2026-04-08 00:19:05.607383
16ea5f2c-8312-4bab-8299-55595927f1d9	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516677703	14182330197	0.00	0.01	radacct	2026-04-08 00:19:05.609542
8f201c45-8ef5-4913-912a-535bfa4e67c6	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1162497901	15630558291	0.06	2.20	radacct	2026-04-08 00:19:05.611612
0aa88453-21fa-4eb7-9f35-3c18ad1b4c67	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692306335	13902145298	0.00	0.00	radacct	2026-04-08 00:19:05.613774
aaf505d9-6491-462a-bdcb-0cd0eac3d237	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761207	10345335135	0.00	0.00	radacct	2026-04-08 00:19:05.616156
c1a70c67-190c-481e-83eb-ca47e629b436	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	756715220	12830951661	0.03	0.27	radacct	2026-04-08 00:19:05.618258
6f0549c6-7cc3-46a0-afea-93fd797a2408	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1660897600	35214448784	0.03	1.09	radacct	2026-04-08 00:19:05.621566
6732bda3-ace7-47f9-a1c2-596bfa562979	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1376548553	24520966084	0.05	1.65	radacct	2026-04-08 00:19:05.624573
918b041f-9eb9-43b1-9e47-e501a15e5d8b	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773875395	12077622972	0.00	0.01	radacct	2026-04-08 00:19:05.626811
d3946331-284f-4d90-aa4d-ff497103e68c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1812301621	41062684649	0.12	1.44	radacct	2026-04-08 00:19:05.628684
261a0b70-6dee-43ac-acd6-29e96d9846e4	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	229887850	5675913501	0.07	1.47	radacct	2026-04-08 00:19:05.630523
07ab3fae-8cf4-49a2-b716-3cb0d8b7ff96	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2498788430	19969657406	0.04	0.57	radacct	2026-04-08 00:19:05.632794
bcecacef-7ed0-41e8-bf99-63124b6d6b17	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2338221720	19089394571	0.37	2.99	radacct	2026-04-08 00:19:05.63482
b3f9008b-1409-42da-9cad-2b6b046dad50	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2753934266	20532307829	0.05	1.37	radacct	2026-04-08 00:19:05.637733
0917a0ce-b325-48d5-9a0d-d04afd17cb2a	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	633087091	8003669727	0.04	0.47	radacct	2026-04-08 00:19:05.640399
fa21f3ac-51bf-4502-a5eb-20246ebcf37f	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183426023	11066238366	0.00	0.00	radacct	2026-04-08 00:21:05.560083
f3406120-d753-4dc2-81ec-cc496b93d978	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	44717176	1675604681	0.03	1.32	radacct	2026-04-08 00:21:05.567661
0ad92217-4d5f-42c9-9ed4-529d6b25ac9f	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49658605	847057072	0.00	0.00	radacct	2026-04-08 00:21:05.571478
4b9a01f3-8c8e-4e2d-84f1-cb25f1b6588a	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852767185	16096339887	0.00	0.00	radacct	2026-04-08 00:21:05.573896
03611301-a941-458c-972a-3e53722edb1e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584292818	8820426201	0.00	0.00	radacct	2026-04-08 00:21:05.575994
dbb5c836-c632-4bfd-9527-963e8973f628	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66355026	1840130899	0.00	0.00	radacct	2026-04-08 00:21:05.57796
a99f5656-dd05-441b-94a9-dd5db8348434	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2428205506	20284800107	0.01	0.07	radacct	2026-04-08 00:21:05.580085
76d0ea0c-ab67-416b-9ba5-cd88145cd066	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619424703	10541671046	0.00	0.00	radacct	2026-04-08 00:21:05.582083
9bdb16e0-088f-488e-8feb-9ee3dbe05070	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1525491133	12834712546	0.67	0.21	radacct	2026-04-08 00:21:05.584076
ea2a4fd5-e97e-453b-8575-19cd134b9df0	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940496960	19935641504	0.00	0.00	radacct	2026-04-08 00:21:05.587328
510d38b1-8ff2-485f-9d5a-d3f7dba82689	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499392351	4243552480	0.00	0.00	radacct	2026-04-08 00:21:05.58949
59d6349f-0ecd-484a-89e8-cc032ebf1604	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	198597	812350	0.01	0.05	radacct	2026-04-08 00:21:05.591522
31390a69-4860-4792-9f4e-589f1da92c6d	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61518460	1883403732	0.00	0.01	radacct	2026-04-08 00:21:05.59378
df7d080e-841d-42c0-a594-08683e3f19ee	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	627895963	14890837058	0.12	3.34	radacct	2026-04-08 00:21:05.596112
ec146fd2-58b6-4804-9ac6-ba078b644872	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2799256338	12151097855	0.08	3.73	radacct	2026-04-08 00:21:05.598431
1783ca93-c3c0-49ef-a3c7-1f73b6dc5fa5	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	37533	467336	0.00	0.03	radacct	2026-04-08 00:21:05.60073
5fcbab2c-607c-41d2-ac53-f1bef74b2303	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719125907	5142468569	0.00	0.00	radacct	2026-04-08 00:21:05.604017
7a3a0ff3-0cd7-4166-9e45-da92494e2c16	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3482388623	17807265474	0.58	2.11	radacct	2026-04-08 00:21:05.606544
8d3ac874-3fef-4916-83c8-fd719c04cef2	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430878407	16924279444	0.00	0.00	radacct	2026-04-08 00:21:05.608968
fff8cdd9-5ad0-4419-9256-4d6bca73728e	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	863026304	14138083314	0.05	0.27	radacct	2026-04-08 00:21:05.611235
ea58a86f-b958-48d5-9119-f783eb82fdb7	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516694206	14182566085	0.00	0.02	radacct	2026-04-08 00:21:05.613545
2e0aec7e-cfef-4c9d-9649-c2a7e95503bd	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1162957401	15653369292	0.03	1.52	radacct	2026-04-08 00:21:05.615861
2e64a791-80f3-4e8c-81a8-0cee2bb50c8c	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692361144	13902191219	0.00	0.00	radacct	2026-04-08 00:21:05.618514
bf3ad652-9e33-46de-9b1c-f8f270a94856	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761609	10345335483	0.00	0.00	radacct	2026-04-08 00:21:05.621076
745c8ed2-c52c-4349-8308-68e65ba1b4a2	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757083920	12831612474	0.02	0.04	radacct	2026-04-08 00:21:05.623294
fd63f661-3031-4555-8bc2-36ed32c4d095	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1661063479	35215890019	0.01	0.10	radacct	2026-04-08 00:21:05.62578
e35b8e8c-f254-47d5-952b-288d0a5dff97	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1378367740	24578832788	0.12	3.86	radacct	2026-04-08 00:21:05.628148
a7788ecb-c2b6-4f90-94cc-3c1d767d2854	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773896973	12077649951	0.00	0.00	radacct	2026-04-08 00:21:05.630456
b25b06b6-90dd-4292-8c42-b508f5ac0b19	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1813363579	41089516694	0.07	1.79	radacct	2026-04-08 00:21:05.632825
1cb19c65-60ea-463c-9239-3c972c96d1a5	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	231616920	5733837014	0.12	3.86	radacct	2026-04-08 00:21:05.635744
c1832ff1-5df0-4a11-aebc-e388a64558f6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2514171403	19991210186	1.03	1.44	radacct	2026-04-08 00:21:05.638346
e251fe67-cef5-43dc-a46f-affb9033f1e0	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2341374637	19101943777	0.21	0.84	radacct	2026-04-08 00:21:05.640623
16d361f0-e6ef-4167-a4a0-e8f608d6b375	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2753944434	20532316980	0.00	0.00	radacct	2026-04-08 00:21:05.642947
5540c8af-671f-4eb9-a1c3-750a3684207d	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	634239211	8021679072	0.08	1.20	radacct	2026-04-08 00:21:05.645226
04f94d77-944a-4ccc-b25c-0dee4508a7f1	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183445591	11066287753	0.00	0.00	radacct	2026-04-08 00:23:05.55576
eed9c910-eba3-4edb-aa1d-61496a5aa6e3	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	44974611	1690155479	0.02	0.97	radacct	2026-04-08 00:23:05.562342
b6c406c3-d90e-442f-aa1d-68b00a96ac21	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49688553	848027993	0.00	0.06	radacct	2026-04-08 00:23:05.564361
070333bf-b251-408a-9be8-319c377f7be8	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852788575	16096359233	0.00	0.00	radacct	2026-04-08 00:23:05.567883
297cc05c-72eb-4c47-bd17-c03f8b28b903	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584303185	8820441514	0.00	0.00	radacct	2026-04-08 00:23:05.570986
7021158d-a722-476a-9b30-7f7fd53ece2a	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66387558	1840169085	0.00	0.00	radacct	2026-04-08 00:23:05.573724
4d1578d1-47e6-4060-8ebd-69639c9eebeb	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2429341235	20298672164	0.08	0.92	radacct	2026-04-08 00:23:05.575773
ba4435f6-87e9-4489-998d-02af4f6d49f7	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619435279	10541689702	0.00	0.00	radacct	2026-04-08 00:23:05.577626
a73fa588-4f60-4b76-a7e0-dcfc820810c1	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1533220645	12838967172	0.52	0.28	radacct	2026-04-08 00:23:05.579498
9faf2324-9508-4d4c-af74-8764f7ba1059	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940558004	19935741068	0.00	0.01	radacct	2026-04-08 00:23:05.582137
e7f5856d-a04d-4666-b356-955f216f8544	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499435729	4243623038	0.00	0.00	radacct	2026-04-08 00:23:05.585396
488a5c67-2aa0-4d6e-86c6-4533d4939a6d	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	593692	2015543	0.03	0.08	radacct	2026-04-08 00:23:05.587958
4dd14c4c-9b06-4df5-a789-10466f266974	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61659863	1885389985	0.01	0.13	radacct	2026-04-08 00:23:05.590315
7fa38560-412a-411c-8452-688be4e83a2b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	629866590	14920357719	0.13	1.97	radacct	2026-04-08 00:23:05.592278
060ece2c-a2cf-428b-8b9a-aa549126ef80	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2800308376	12207061770	0.07	3.73	radacct	2026-04-08 00:23:05.59422
39748b7a-7c3d-4c07-bc9a-c77c2c3638aa	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	88413	520340	0.00	0.00	radacct	2026-04-08 00:23:05.596207
a4bb734e-3f91-4b9b-a891-087342129841	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719126815	5142470038	0.00	0.00	radacct	2026-04-08 00:23:05.598668
f5dcd43e-8487-4f92-8aa9-80102e1779be	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3491026067	17847012649	0.58	2.65	radacct	2026-04-08 00:23:05.601361
50726eea-2bec-431c-963f-ea97f86ef29a	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2430982432	16924394106	0.01	0.01	radacct	2026-04-08 00:23:05.60409
77510d46-7b37-4690-a1c6-bb951bbcf2c6	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	863676901	14142092079	0.04	0.27	radacct	2026-04-08 00:23:05.606557
078b59d9-a8ce-42de-b3ae-942bccdc9050	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516715810	14182596484	0.00	0.00	radacct	2026-04-08 00:23:05.608393
3c312517-7ba6-41ec-a5df-9833aa361085	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1163580147	15684605218	0.04	2.08	radacct	2026-04-08 00:23:05.610145
18f20bae-4eaa-4a4e-b514-7a89537374d7	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692578451	13903021299	0.01	0.06	radacct	2026-04-08 00:23:05.611882
a416b577-0bda-43ce-a35a-d2e63f81a3bb	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761718	10345335592	0.00	0.00	radacct	2026-04-08 00:23:05.614027
1199d97f-08cf-4b47-86f1-2aad5a5e8873	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757180151	12831712974	0.01	0.01	radacct	2026-04-08 00:23:05.61588
effc16cc-4ac8-494b-bd32-4ca1c34c6cd4	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1661451012	35218634480	0.03	0.18	radacct	2026-04-08 00:23:05.618741
11952831-4c6f-4b3e-8286-4bffb0a2727c	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1380126980	24622561313	0.12	2.92	radacct	2026-04-08 00:23:05.621614
3d60ac0a-711c-42cf-862a-b3feba733a41	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773908887	12077670606	0.00	0.00	radacct	2026-04-08 00:23:05.623831
1ee79daf-2161-4248-8fde-57a1cd733dfb	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1814230860	41110213442	0.06	1.38	radacct	2026-04-08 00:23:05.6256
14b2f351-8864-4134-9377-cd0b2793d421	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	233967741	5782710444	0.16	3.26	radacct	2026-04-08 00:23:05.627368
0ebd137e-0703-4648-89e4-a0733c6e2bf2	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2525876018	20010822204	0.78	1.31	radacct	2026-04-08 00:23:05.629255
5c8e90ae-5bca-4461-99d4-b7a555933d20	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2344577788	19107801072	0.21	0.39	radacct	2026-04-08 00:23:05.631163
dad54d53-5684-43cc-9970-f58c52f06ce7	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2754472315	20536421609	0.04	0.27	radacct	2026-04-08 00:23:05.632994
4a9f0e18-dea1-4dbd-9d5f-53520e893e56	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	635275588	8034615155	0.07	0.86	radacct	2026-04-08 00:23:05.635965
4619a872-1d89-47c4-80b4-e3743f8eb00e	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183446552	11066292608	0.00	0.00	radacct	2026-04-08 00:25:05.59217
81cceaf1-4248-4e41-8ca7-6e225b1f4445	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	45408223	1702926542	0.03	0.85	radacct	2026-04-08 00:25:05.608122
efaca448-39fa-4e3b-91fa-d876d7e28dd2	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49691239	848029071	0.00	0.00	radacct	2026-04-08 00:25:05.610864
d88ee657-0976-42d2-9755-013b41282634	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852799868	16096373150	0.00	0.00	radacct	2026-04-08 00:25:05.613337
131c85c3-b0ac-4c4b-9a87-54c0fbb38e2c	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584303812	8820442165	0.00	0.00	radacct	2026-04-08 00:25:05.616093
bb576f95-cc6f-4962-9335-715c2c836f88	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66392830	1840179184	0.00	0.00	radacct	2026-04-08 00:25:05.619774
69b14779-f3ad-4ad0-b570-9092da47250b	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2430052554	20303602053	0.05	0.33	radacct	2026-04-08 00:25:05.62256
42055807-4fc9-4084-852d-4d6566442a1c	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619441392	10541696397	0.00	0.00	radacct	2026-04-08 00:25:05.624844
cc701768-dafb-463c-bbdb-a304297ffb4b	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1535098716	12844470382	0.13	0.37	radacct	2026-04-08 00:25:05.627416
0f63bdda-4a00-4dd3-a59c-85476a28ad22	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940566115	19935750560	0.00	0.00	radacct	2026-04-08 00:25:05.62953
e00fc219-3635-4d40-8c3b-e34e4f517853	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499627512	4243778179	0.01	0.01	radacct	2026-04-08 00:25:05.631554
f3afd0d9-67f4-438d-aa3d-11ecefd33fbc	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	640653	2072345	0.00	0.00	radacct	2026-04-08 00:25:05.635336
cf1d5104-ddf5-49c6-bad9-138a6cfe4800	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61819448	1889598775	0.01	0.28	radacct	2026-04-08 00:25:05.63842
ddb28863-416a-44f9-adba-36eb0560c680	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	630769882	14936536840	0.06	1.08	radacct	2026-04-08 00:25:05.64085
349d2478-d189-485c-ab48-3cb3571a5983	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2801064798	12246653501	0.05	2.64	radacct	2026-04-08 00:25:05.643427
1de9ca41-fd2f-4e69-8ae0-db576c7b96aa	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	362221	5121706	0.02	0.31	radacct	2026-04-08 00:25:05.645832
f862cc9b-16ad-4d62-af48-fadcb5fd144b	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719127977	5142471225	0.00	0.00	radacct	2026-04-08 00:25:05.647747
d107937c-b1d7-4c2c-ab48-c865332a22db	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3495390638	17867726708	0.29	1.38	radacct	2026-04-08 00:25:05.651246
c2beb89d-d513-4820-8ad9-d60087ad151f	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431032473	16924437877	0.00	0.00	radacct	2026-04-08 00:25:05.653797
d6c45d6d-4346-4a5d-bc6a-41697a48b79c	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	864602892	14148196820	0.06	0.41	radacct	2026-04-08 00:25:05.656172
c2781c5f-db55-47b3-b4eb-c8763c5e46e5	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516775955	14182982938	0.00	0.03	radacct	2026-04-08 00:25:05.658262
53d1e4cf-511f-476d-a139-e726ff2203fb	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1166941858	15726769907	0.22	2.81	radacct	2026-04-08 00:25:05.660365
260f455b-e8f0-47d6-8d37-93192b93a7ae	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692634155	13903033923	0.00	0.00	radacct	2026-04-08 00:25:05.66229
1208e021-7cfd-4585-a70b-34f7a3cdb43e	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761718	10345335592	0.00	0.00	radacct	2026-04-08 00:25:05.66415
d2a7d5fd-d808-4ce0-b750-79c677fdfeb7	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757188545	12831721142	0.00	0.00	radacct	2026-04-08 00:25:05.666345
aa9a0b00-95db-4254-96fa-62b1fb7d7894	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1661688834	35233086566	0.02	0.96	radacct	2026-04-08 00:25:05.67001
b49caaf0-d936-4be2-bd65-c026c4c1385f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1380744479	24638102192	0.04	1.04	radacct	2026-04-08 00:25:05.672787
d4195273-a8b1-4a52-9256-34321112d0e5	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773951901	12077708996	0.00	0.00	radacct	2026-04-08 00:25:05.677727
dea9a680-2cf0-4b95-bccf-608cab928b68	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1816517315	41126243888	0.15	1.07	radacct	2026-04-08 00:25:05.680056
98488121-f059-418b-902b-d6b63662057d	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	236677297	5867772297	0.18	5.67	radacct	2026-04-08 00:25:05.682043
f45bbb3f-3963-46a4-a5c9-3297c354a5c0	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2527697920	20055824770	0.12	3.00	radacct	2026-04-08 00:25:05.685782
115bebe0-2656-4f7d-ab17-5083fcfcfe1e	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2347523211	19107862328	0.20	0.00	radacct	2026-04-08 00:25:05.688377
5b5d6bf0-7356-4d51-b469-3a83b9f5bb1e	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2754500349	20536459785	0.00	0.00	radacct	2026-04-08 00:25:05.690619
2143691f-95c8-4aab-a87c-70445eb476b7	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	635835277	8043378982	0.04	0.58	radacct	2026-04-08 00:25:05.693028
01a39875-7d67-48ff-9cf4-94ce6da95b30	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183447082	11066294644	0.00	0.00	radacct	2026-04-08 00:27:05.575654
dd3d8cc9-297d-4f19-a19c-3662f6c2efb6	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	45675983	1717827337	0.02	0.99	radacct	2026-04-08 00:27:05.582985
e033b082-d7b4-4112-9109-594c3d2c83ae	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49702746	848038662	0.00	0.00	radacct	2026-04-08 00:27:05.585946
71715bd0-56d8-4ae1-b956-35d748d2b461	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852858782	16096453657	0.00	0.01	radacct	2026-04-08 00:27:05.588144
e467b9b9-d7cf-4575-a498-83b855a177bf	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584366966	8820513219	0.00	0.00	radacct	2026-04-08 00:27:05.590247
d6a76ce4-b458-482d-9994-6c57d2d127fd	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66406744	1840192766	0.00	0.00	radacct	2026-04-08 00:27:05.592251
add348f3-aec3-4698-a474-b2c4aed0541b	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2431033155	20312477690	0.07	0.59	radacct	2026-04-08 00:27:05.594365
3e89ac0c-4030-4d72-ba9f-984d17a4f5f6	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619448826	10541701830	0.00	0.00	radacct	2026-04-08 00:27:05.596325
065793a2-08e9-4fe9-9a03-0fdea745e65d	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1535734825	12847424166	0.04	0.20	radacct	2026-04-08 00:27:05.598946
4e1d59a6-b337-4753-a2f6-ad3db23bb2d5	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940577374	19935781299	0.00	0.00	radacct	2026-04-08 00:27:05.601968
e165cf23-d355-4b3f-852e-827cbc9dabbe	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	499814521	4244731999	0.01	0.06	radacct	2026-04-08 00:27:05.604031
63b7a7bb-90e4-420a-a9ba-7adba5f4dc30	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	671444	2111986	0.00	0.00	radacct	2026-04-08 00:27:05.606023
c7454e3a-bd95-4613-9edd-645960cef2e5	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	61937702	1893942587	0.01	0.29	radacct	2026-04-08 00:27:05.607955
3d7b479c-6507-4863-b328-c9fd92e1af15	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	631099637	14950098615	0.02	0.90	radacct	2026-04-08 00:27:05.609857
63a2ab10-bacf-442b-8af8-ed84064ead47	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2801780594	12287288073	0.05	2.71	radacct	2026-04-08 00:27:05.611745
0ee9ce3a-630d-4378-91c4-fcc2aaaab143	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	371790	5131518	0.00	0.00	radacct	2026-04-08 00:27:05.6138
e58a0863-56d9-45b2-b14f-9b91d8103caa	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719132071	5142475416	0.00	0.00	radacct	2026-04-08 00:27:05.616862
3e701986-3b13-4637-8df5-d201544c904a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3499267059	17895684240	0.26	1.86	radacct	2026-04-08 00:27:05.61914
c7723e30-6b7d-4754-98d3-7ef917843621	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431087304	16924482217	0.00	0.00	radacct	2026-04-08 00:27:05.621033
54c332f8-b7b9-43b3-95c9-afd8981e5d5f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	865892833	14154564805	0.09	0.42	radacct	2026-04-08 00:27:05.622959
ae1e5a56-6747-4a9b-b2b0-649befacb57d	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516823053	14183042419	0.00	0.00	radacct	2026-04-08 00:27:05.624988
bd52f92f-a378-4a66-8066-39a6c583bfeb	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1169492751	15770228602	0.17	2.90	radacct	2026-04-08 00:27:05.626973
e869a863-b8a9-4b19-b2ce-15a4dc344969	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692686070	13903063825	0.00	0.00	radacct	2026-04-08 00:27:05.629018
44dae65a-c1ca-4836-9e1d-39d4b5c8f61a	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407761827	10345335701	0.00	0.00	radacct	2026-04-08 00:27:05.631123
7f6781f0-4c5f-44b4-b492-7afd8ba6d221	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757229889	12831768071	0.00	0.00	radacct	2026-04-08 00:27:05.634377
a31ea46c-3b2b-43d6-b5c9-a38272407bf1	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1661889476	35241601757	0.01	0.57	radacct	2026-04-08 00:27:05.63636
a1cd8f5e-1c3d-4c82-a30c-a8a693b8406b	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1381917666	24674021461	0.08	2.39	radacct	2026-04-08 00:27:05.638463
74aab600-19b2-4e4e-a01d-bb83b5f9e4bf	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773969891	12077725610	0.00	0.00	radacct	2026-04-08 00:27:05.640417
5be52e6b-6e9b-44a0-80e7-a1ed5fa5f44c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1818792492	41135658035	0.15	0.63	radacct	2026-04-08 00:27:05.642331
dd59865b-2a40-4aa9-b0de-01e4737be8a1	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	237801769	5886336554	0.07	1.24	radacct	2026-04-08 00:27:05.644331
1a003194-d738-40fd-9ab0-a09335e8a15c	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2529169979	20096082653	0.10	2.68	radacct	2026-04-08 00:27:05.646419
f4d374c5-6ebd-4d34-9e05-d1ddbda7d171	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2350511543	19108748092	0.20	0.06	radacct	2026-04-08 00:27:05.649525
043bcc07-4138-44c4-b88c-cef7779344dc	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2754678296	20537853471	0.01	0.09	radacct	2026-04-08 00:27:05.651903
cc1667a3-bf08-47ec-93c2-004ea66e3cb3	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	636823252	8058165953	0.07	0.99	radacct	2026-04-08 00:27:05.653708
6f981559-2586-43fe-9a0f-5063c6845264	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183447550	11066295205	0.00	0.00	radacct	2026-04-08 00:29:05.582187
16f4e993-752d-4991-848f-b5d4faffa18b	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	45919599	1728382351	0.02	0.70	radacct	2026-04-08 00:29:05.592296
dd3ec800-29f6-4b6f-994a-0562325e80fd	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49705757	848039919	0.00	0.00	radacct	2026-04-08 00:29:05.594734
f581065d-36fb-4a0d-9f68-cb0b42d555fe	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852886688	16096475741	0.00	0.00	radacct	2026-04-08 00:29:05.598431
54f19ee2-868c-4e39-906f-c55b1a03cb39	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584373642	8820522012	0.00	0.00	radacct	2026-04-08 00:29:05.601288
c34bb8ce-69d2-4dfc-b66d-bbeb3cac5c7b	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66501824	1840335673	0.01	0.01	radacct	2026-04-08 00:29:05.603746
60ccb531-f5ba-4197-8185-24a23e3f2e26	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2431465747	20314373997	0.03	0.13	radacct	2026-04-08 00:29:05.606268
503caf7c-8a4c-4d23-b06d-a8e4360cf972	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619449998	10541701938	0.00	0.00	radacct	2026-04-08 00:29:05.608706
415c7790-61a0-427b-934f-67f63524e862	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1537880218	12893393233	0.14	3.06	radacct	2026-04-08 00:29:05.611086
ab9278b1-3cb6-4f2a-a841-c26f03216217	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940587512	19935820958	0.00	0.00	radacct	2026-04-08 00:29:05.614576
81f1d8ec-7867-430e-b09b-8067da77e50c	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501200027	4257207633	0.09	0.83	radacct	2026-04-08 00:29:05.617841
6a8088e0-6e2a-45f8-8b9e-3fb05c882751	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	753328	2755962	0.01	0.04	radacct	2026-04-08 00:29:05.620197
eb09bda0-4865-4bea-bd54-55b5fef2c1fd	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	62128690	1894687007	0.01	0.05	radacct	2026-04-08 00:29:05.622691
98e9c6bf-9909-4b28-9d49-24e0226a221c	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	631634383	14967351805	0.04	1.15	radacct	2026-04-08 00:29:05.625015
9dcb8fdd-a9ea-4e93-8a7b-6ffd9dae295a	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2802793621	12342196463	0.07	3.66	radacct	2026-04-08 00:29:05.627027
10ee8974-a375-4bd2-97c3-d173858c1807	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	391045	5161885	0.00	0.00	radacct	2026-04-08 00:29:05.629565
b7a9c26f-0c54-437c-a259-0431bd00e2eb	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719139594	5142494260	0.00	0.00	radacct	2026-04-08 00:29:05.632765
d57971f9-f189-4796-b4de-34b78012faae	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3503712784	17928472565	0.30	2.19	radacct	2026-04-08 00:29:05.634828
1b62d423-3579-42b4-80e7-b8ca620302ce	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431210012	16927120810	0.01	0.18	radacct	2026-04-08 00:29:05.636812
5c62397d-f411-46f6-8e9b-249ad857ea67	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	866714010	14160622985	0.05	0.40	radacct	2026-04-08 00:29:05.638763
d1ccacae-5d04-448a-8885-5826bd0d6ab5	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516841734	14183058384	0.00	0.00	radacct	2026-04-08 00:29:05.640731
2a82b96f-4aef-41c8-96e2-965865f612ab	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1171303716	15841579980	0.12	4.76	radacct	2026-04-08 00:29:05.642714
e07e9a01-c435-46bb-bc5b-0a88ab7bf607	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692738986	13903077625	0.00	0.00	radacct	2026-04-08 00:29:05.644713
83b613d6-1e42-4def-9501-14748090bccf	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407762120	10345335938	0.00	0.00	radacct	2026-04-08 00:29:05.6479
52b22387-327a-46fe-b4ef-305a663a5331	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757404478	12831957072	0.01	0.01	radacct	2026-04-08 00:29:05.650767
ec7384e1-048b-4eff-834a-433e6c46a2e0	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662170403	35242705498	0.02	0.07	radacct	2026-04-08 00:29:05.653178
6111c380-2c51-4bc7-8c95-c937eb429633	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1382859359	24697998399	0.06	1.60	radacct	2026-04-08 00:29:05.655589
6e471678-254e-4fee-8480-9ca052e3a106	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	773980136	12077745004	0.00	0.00	radacct	2026-04-08 00:29:05.657931
967170db-b7a7-4a51-877c-e7616de0901b	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1821177421	41143663105	0.16	0.53	radacct	2026-04-08 00:29:05.660386
8cdfca45-13e0-4001-b1ab-d14776d4ea83	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	239872697	5947915337	0.14	4.11	radacct	2026-04-08 00:29:05.66541
c0d1f392-ac52-4613-b091-d27c9b477dfd	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2530916916	20127148560	0.12	2.07	radacct	2026-04-08 00:29:05.667884
988c5aba-556a-4257-a021-351d1b65b586	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2354028898	19108970031	0.23	0.01	radacct	2026-04-08 00:29:05.669802
38b6760e-8e91-41a9-82e0-cdaa38808d3b	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755056087	20538149600	0.03	0.02	radacct	2026-04-08 00:29:05.671678
e9e6a4d7-6e4b-4573-80d3-60513895f467	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	637401934	8063470522	0.04	0.35	radacct	2026-04-08 00:29:05.673538
73a4759e-1219-4286-951b-7000944ba16e	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183493445	11066606067	0.00	0.02	radacct	2026-04-08 00:31:05.577425
49d3efc3-9e89-4b76-8184-ae8e1e3a0adc	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46081507	1738846782	0.01	0.70	radacct	2026-04-08 00:31:05.588003
f19de52a-7e57-450d-b1fc-98f3d242a991	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49707010	848040640	0.00	0.00	radacct	2026-04-08 00:31:05.590278
5ab14d77-3b54-4f0d-88fa-1c61982a72bd	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852888205	16096477019	0.00	0.00	radacct	2026-04-08 00:31:05.592535
448dedb5-912a-4b34-a527-4dca326c0af8	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584423387	8821615334	0.00	0.07	radacct	2026-04-08 00:31:05.594632
1e2a81c4-174b-495e-ab7f-279d1d0cfa43	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66528966	1840358800	0.00	0.00	radacct	2026-04-08 00:31:05.597997
365edc3d-2a5e-44a6-ac42-853eeb1a09e1	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2431975177	20325009780	0.03	0.71	radacct	2026-04-08 00:31:05.600721
e0ece49d-04bc-4f77-b9a7-4cd7935a1180	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619451062	10541701938	0.00	0.00	radacct	2026-04-08 00:31:05.602938
e13610a2-acaa-4191-855f-a1c429b377cb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1539711216	12919837206	0.12	1.76	radacct	2026-04-08 00:31:05.605097
5fa92dbd-0160-4b5d-87a1-ed220acd8218	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940686330	19935865285	0.01	0.00	radacct	2026-04-08 00:31:05.607227
acb829b2-0a08-43e3-bebf-3c43e959ed4b	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501237146	4257262208	0.00	0.00	radacct	2026-04-08 00:31:05.609373
5a2179c0-09da-4c20-8755-c586e2d578a0	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	945377	3014803	0.01	0.02	radacct	2026-04-08 00:31:05.611586
9c9771a7-fc19-4540-a4e0-37addd4eaf80	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	62228881	1904676194	0.01	0.67	radacct	2026-04-08 00:31:05.614968
3148e59d-e045-4076-8ae2-b4570e26a15d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	632052258	14993418713	0.03	1.74	radacct	2026-04-08 00:31:05.618285
d3b5937a-6df1-4fa8-ada0-45745d6385b6	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2803441953	12376334471	0.04	2.28	radacct	2026-04-08 00:31:05.620398
ff126f42-1d36-4af3-a59a-e1650e2b5a89	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	391638	5163577	0.00	0.00	radacct	2026-04-08 00:31:05.622587
2242be87-d20f-486f-9459-9ab9c660cb22	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719142306	5142508178	0.00	0.00	radacct	2026-04-08 00:31:05.624716
3d8d9cfc-fdee-4948-9b74-d20fd40eab85	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3508789351	17949234615	0.34	1.38	radacct	2026-04-08 00:31:05.626873
c794a771-6914-46ec-8d5d-e4478246be87	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431275056	16928440367	0.00	0.09	radacct	2026-04-08 00:31:05.629758
73c90c9c-d14f-4135-98e6-931837bb42f7	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867318707	14164021255	0.04	0.23	radacct	2026-04-08 00:31:05.632841
66cde79a-fa93-4644-bb24-8902d6cf9aa6	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516858233	14183157223	0.00	0.01	radacct	2026-04-08 00:31:05.634925
4b6ffe45-a0f6-4c30-a123-f9eef95eb3fa	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1173201951	15904213259	0.13	4.18	radacct	2026-04-08 00:31:05.637005
01048a31-d509-45a4-a458-6bca8d9460dc	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	692826698	13903153100	0.01	0.01	radacct	2026-04-08 00:31:05.639297
9d791ebe-5152-436c-958e-925665a537aa	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407768551	10345351805	0.00	0.00	radacct	2026-04-08 00:31:05.641813
8944bd61-c863-4ade-9714-ff691a4c6b29	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757427182	12831988920	0.00	0.00	radacct	2026-04-08 00:31:05.644284
5d95b6b2-fbc7-4776-8558-a418d76d2346	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662205151	35242762064	0.00	0.00	radacct	2026-04-08 00:31:05.647582
45f31fbe-cde3-439b-a109-97e65138af8f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1383994535	24724978964	0.08	1.80	radacct	2026-04-08 00:31:05.650056
c61482ae-e57d-42b5-abe0-7e9caba640b3	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774002206	12077755856	0.00	0.00	radacct	2026-04-08 00:31:05.652273
e279402c-24dd-41a6-85c5-bf68e3ad619c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1824680709	41153170769	0.23	0.63	radacct	2026-04-08 00:31:05.65448
612d1991-5337-4237-8a96-518ff179e810	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	241274959	5978015913	0.09	2.01	radacct	2026-04-08 00:31:05.656541
42320ccd-e514-4ba8-8086-55ad7b26e8d6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2532167191	20152261886	0.08	1.67	radacct	2026-04-08 00:31:05.658453
de0ef754-0d29-45d1-bdca-f1550e614508	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2357383601	19109433695	0.22	0.03	radacct	2026-04-08 00:31:05.660349
eb7a3941-481d-4864-a20f-fa68ebc53176	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755106960	20538226774	0.00	0.01	radacct	2026-04-08 00:31:05.662366
28993aeb-27bd-4f0b-9c5d-16cd3fcfc7dd	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	637893710	8067026850	0.03	0.24	radacct	2026-04-08 00:31:05.665085
ff754f06-0f59-4f92-a94e-e3dfcfafc2f8	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183495365	11066607611	0.00	0.00	radacct	2026-04-08 00:33:05.607783
cac20f2b-7cb5-46c5-b8b1-f25198749b61	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46236499	1751829345	0.01	0.87	radacct	2026-04-08 00:33:05.617175
a1719d9f-6e15-4093-a19c-579052f1ad37	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49729034	848098647	0.00	0.00	radacct	2026-04-08 00:33:05.619111
96f1ef7b-810d-48f9-a5d6-c0301a1f3a2f	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852912810	16096508509	0.00	0.00	radacct	2026-04-08 00:33:05.621295
ef829d98-aca7-4226-93aa-4cade82de22d	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584435178	8821630445	0.00	0.00	radacct	2026-04-08 00:33:05.62383
d85ce04e-e1ba-4c34-9102-9fac2c8bc128	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66578364	1840444679	0.00	0.01	radacct	2026-04-08 00:33:05.62604
ee01bb47-f41b-46f1-aa85-e3b77e421951	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2433074666	20339811165	0.07	0.99	radacct	2026-04-08 00:33:05.628504
d82dd6dc-3539-40d0-9a8b-1c1ab09dca43	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619452320	10541703283	0.00	0.00	radacct	2026-04-08 00:33:05.631535
24eb6f0d-6954-46fb-be61-866b90602214	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1540406033	12934542010	0.05	0.98	radacct	2026-04-08 00:33:05.633421
bcf6a464-7286-4f5f-bafc-36c9103f30c7	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940688102	19935867525	0.00	0.00	radacct	2026-04-08 00:33:05.635228
43fd8172-269c-40d0-a921-76fb55c164a9	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501326705	4257758117	0.01	0.03	radacct	2026-04-08 00:33:05.637017
ad704c03-b7e6-4e39-820d-4b96be0cb8ab	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	966411	3314726	0.00	0.02	radacct	2026-04-08 00:33:05.63882
dfc09384-e4de-4a5a-897d-452e616c6ccb	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	62283361	1912318548	0.00	0.51	radacct	2026-04-08 00:33:05.6407
6e48c749-2dc4-475a-942f-7d75bf58b91a	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	632518112	15013486918	0.03	1.34	radacct	2026-04-08 00:33:05.642482
3cc69f66-33ec-40ab-98c8-6fef76491b3a	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2807022179	12471219341	0.24	6.32	radacct	2026-04-08 00:33:05.645614
99769b7b-8bb9-46a4-ac48-8bac5bb18c9b	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	438547	5216788	0.00	0.00	radacct	2026-04-08 00:33:05.647922
af2c3c33-86f8-4eb6-991b-5c1b2688528f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719144829	5142509674	0.00	0.00	radacct	2026-04-08 00:33:05.649709
537fd17a-f8c0-4710-8dec-b177ec98fb33	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3511843962	17968954573	0.20	1.31	radacct	2026-04-08 00:33:05.65174
d5369c06-6a12-492b-bc09-2dd9f38f3888	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431316333	16928470811	0.00	0.00	radacct	2026-04-08 00:33:05.653524
20885f84-26e1-4b34-bc73-5ee5ff41d000	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867330107	14164080890	0.00	0.00	radacct	2026-04-08 00:33:05.655316
a4ded7c2-e22a-43b6-9802-070a98015e44	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516876825	14183186254	0.00	0.00	radacct	2026-04-08 00:33:05.657109
159b46ee-621c-44e0-bdaa-b06c5be5fcce	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1173939671	15928136391	0.05	1.59	radacct	2026-04-08 00:33:05.659003
ba85fb8d-2dd4-4020-94fb-a08d7d501547	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693275383	13907256828	0.03	0.27	radacct	2026-04-08 00:33:05.660886
96167219-5232-43c7-8f57-f0e564beac82	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407768660	10345351914	0.00	0.00	radacct	2026-04-08 00:33:05.663344
f93e7e38-5e7d-4ddb-a002-0443939cde1e	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757433811	12831997048	0.00	0.00	radacct	2026-04-08 00:33:05.665388
f2cb6a78-3f7b-435f-8f2b-040b2ce150e1	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662322089	35243020810	0.01	0.02	radacct	2026-04-08 00:33:05.66728
514f2264-91ab-47b2-b155-19a660583b77	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1385748241	24760235503	0.12	2.35	radacct	2026-04-08 00:33:05.669067
0c40d633-e206-464e-a6e2-311911b7d4bc	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774003978	12077757185	0.00	0.00	radacct	2026-04-08 00:33:05.670891
6aaeb3e6-e78b-46dc-84f9-73366a7fb874	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1827187936	41158394519	0.17	0.35	radacct	2026-04-08 00:33:05.672713
25b00b44-fd76-4b90-99ae-0fc02c651dd8	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	242277117	6002519302	0.07	1.63	radacct	2026-04-08 00:33:05.674533
82360923-fa44-4abf-97d5-2e62fd01107d	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2533126699	20167348274	0.06	1.01	radacct	2026-04-08 00:33:05.676563
d9f57649-ae0d-4ff2-9ec1-3a9facc928a7	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2361528882	19128362312	0.28	1.26	radacct	2026-04-08 00:33:05.6789
da90cc3c-3065-4942-91e1-c066b8367ddc	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755156659	20538336204	0.00	0.01	radacct	2026-04-08 00:33:05.681216
534c11b7-285d-4c16-b201-5a13e446cb83	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	638949623	8087040961	0.07	1.33	radacct	2026-04-08 00:33:05.683058
e5872432-acb2-457a-98a7-6fd45fada8ba	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183505368	11066627177	0.00	0.00	radacct	2026-04-08 00:35:05.599776
8ddf2591-8d7f-43f8-8ec5-619ed153f5a9	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46388871	1763501349	0.01	0.78	radacct	2026-04-08 00:35:05.602769
b082dea7-e542-4f14-810a-c1c1e910f912	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49734544	848099868	0.00	0.00	radacct	2026-04-08 00:35:05.605434
1db1f936-c9f7-49d7-8c3c-4e699160fe0d	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852919597	16096516353	0.00	0.00	radacct	2026-04-08 00:35:05.608199
c4a865ef-6731-447b-8611-8c81c3db6952	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584435821	8821631118	0.00	0.00	radacct	2026-04-08 00:35:05.612001
7a01f734-6a89-48b4-9212-3015d8a08c2a	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66612101	1840477369	0.00	0.00	radacct	2026-04-08 00:35:05.615434
2d73afdd-b46f-46c2-8d99-fbaad5863382	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2433862089	20343416217	0.05	0.24	radacct	2026-04-08 00:35:05.618222
d547d559-1401-445c-a499-5b71cb96fa18	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619453516	10541703411	0.00	0.00	radacct	2026-04-08 00:35:05.620385
999e818e-5827-4e55-a7d8-b191da5ba7b1	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1540848493	12943924152	0.03	0.63	radacct	2026-04-08 00:35:05.622547
3f848d63-a5b3-4ee0-965c-0bce7ca83faf	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940860633	19941999691	0.01	0.41	radacct	2026-04-08 00:35:05.625141
26e39bda-c350-4d69-a29b-bb100e05771d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501339774	4257774135	0.00	0.00	radacct	2026-04-08 00:35:05.629219
6102c101-1a74-4a4c-b6e7-307e112f830e	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1274720	3788584	0.02	0.03	radacct	2026-04-08 00:35:05.632392
99741fe8-3ef0-40b4-aa0b-c6fa0f2792db	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	62332383	1914177906	0.00	0.12	radacct	2026-04-08 00:35:05.635075
556d2319-2d74-4477-80bb-69b0c46c1f48	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	632894313	15036741684	0.03	1.55	radacct	2026-04-08 00:35:05.637414
d43db258-16f2-4325-b4c2-dd9f9cf91067	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2808308735	12531199180	0.09	4.00	radacct	2026-04-08 00:35:05.639705
7495e5cf-8742-460c-8a28-d97b20b708be	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	457975	5225814	0.00	0.00	radacct	2026-04-08 00:35:05.642152
e0f9b37e-5f28-4047-9e33-e3cefedd3fc5	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719150275	5142524503	0.00	0.00	radacct	2026-04-08 00:35:05.64632
a7cc90c8-4f38-4b43-8a2b-056f6c9cd1a6	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3513017133	17981146630	0.08	0.81	radacct	2026-04-08 00:35:05.649489
cbc430f3-fdb9-4bb3-9119-844c4274a8c8	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431380525	16928521122	0.00	0.00	radacct	2026-04-08 00:35:05.652035
f6da5af9-dc0d-4594-9384-cc3d1850286e	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867392119	14165085467	0.00	0.07	radacct	2026-04-08 00:35:05.6544
8e464c23-40ac-47ac-995b-c4f2d5e8bd1d	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516884777	14183193270	0.00	0.00	radacct	2026-04-08 00:35:05.656864
a965005a-c2e2-47a4-a140-d66b75bb2c03	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1174872990	15949098892	0.06	1.40	radacct	2026-04-08 00:35:05.659417
5fd04a32-b66c-40fa-abd9-571741c234d5	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693402304	13907314840	0.01	0.00	radacct	2026-04-08 00:35:05.663484
55728154-7391-45e3-84b4-6af392aae21a	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407781392	10345366253	0.00	0.00	radacct	2026-04-08 00:35:05.666799
5038778a-d3de-4f3e-9e80-d52e05e81ebc	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757434997	12831997743	0.00	0.00	radacct	2026-04-08 00:35:05.669472
02af4e9a-4e0f-45a2-8518-9225d89f5857	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662555479	35243261244	0.02	0.02	radacct	2026-04-08 00:35:05.672194
4bea2009-113c-48ec-9184-da17b103c5f6	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1387022478	24795051960	0.08	2.32	radacct	2026-04-08 00:35:05.67455
e74b03f7-c139-4472-b737-f81c61a789f4	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774007822	12077759942	0.00	0.00	radacct	2026-04-08 00:35:05.677736
645d1d07-7de4-4b5c-b4aa-67f53479cfef	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1830404572	41168739275	0.21	0.69	radacct	2026-04-08 00:35:05.681541
fca71eb1-c47d-48c6-8e85-fdc0b7354adb	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	243678722	6047726374	0.09	3.01	radacct	2026-04-08 00:35:05.684067
dc29a2c7-b6c1-421b-b787-f6e92b0b3e10	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2534489902	20205256008	0.09	2.53	radacct	2026-04-08 00:35:05.68629
3f1e6595-c33a-4320-a02a-97ce67820b67	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2365381294	19132747167	0.26	0.29	radacct	2026-04-08 00:35:05.688389
4c321634-9377-40dd-aaf7-1c74d54d1873	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755267025	20538663751	0.01	0.02	radacct	2026-04-08 00:35:05.690529
54552d74-d832-4acc-bc20-758030f7de26	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	639311617	8092903297	0.02	0.39	radacct	2026-04-08 00:35:05.692641
40e52324-64fd-430c-bfc3-97e8bf7ae41c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183516952	11066644774	0.00	0.00	radacct	2026-04-08 00:35:31.077283
1eb3398a-b8a6-48d3-a02e-d10b7421942d	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46436620	1766673682	0.00	0.00	radacct	2026-04-08 00:35:31.085117
59230684-47cd-47c8-af5f-d954c64cad13	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49778703	848654520	0.00	0.00	radacct	2026-04-08 00:35:31.086801
0a2d6912-29bd-4b0c-92be-167f8e16a308	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2852920022	16096516496	0.00	0.00	radacct	2026-04-08 00:35:31.088425
c13e0555-26ce-40d3-98fb-55846564e1d3	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584437895	8821632300	0.00	0.00	radacct	2026-04-08 00:35:31.09008
f33606b4-5db7-4415-8375-e5f7d44a058d	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66622811	1840484457	0.00	0.00	radacct	2026-04-08 00:35:31.091771
04b54b47-a2a2-4630-acb7-a1cdc4a86f61	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2433878191	20343419408	0.00	0.00	radacct	2026-04-08 00:35:31.093946
27ddf77b-9354-4eaf-97a9-26a1589e9fff	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619453706	10541704187	0.00	0.00	radacct	2026-04-08 00:35:31.096278
d6eca323-662a-4c41-a861-6dec51554ae6	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1540912342	12946367984	0.00	0.00	radacct	2026-04-08 00:35:31.09844
5c01cc00-5c6b-4ab8-8829-99d91107a932	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940940951	19945408587	0.00	0.00	radacct	2026-04-08 00:35:31.100427
5255e062-16c5-456b-9ea9-e50d6d4f5c22	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501341030	4257775469	0.00	0.00	radacct	2026-04-08 00:35:31.10202
b840d000-bb83-43d2-a900-2673403c22b4	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1276098	3789449	0.00	0.00	radacct	2026-04-08 00:35:31.103967
89796cd8-9662-42a7-a431-df0561118844	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	62529951	1915632759	0.00	0.00	radacct	2026-04-08 00:35:31.105636
4cd76856-fa1c-478d-837a-81dd08b7081e	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	632913939	15036748163	0.00	0.00	radacct	2026-04-08 00:35:31.107169
2bb74a69-e5f0-44fc-9f39-fd07da78168c	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2808321190	12531231549	0.00	0.00	radacct	2026-04-08 00:35:31.108788
03ba47cf-f457-4998-b2b2-62b5f548c87b	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	464648	5227288	0.00	0.00	radacct	2026-04-08 00:35:31.111321
3e812733-dc70-40d8-8813-ee469d8a0fbb	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719150443	5142524671	0.00	0.00	radacct	2026-04-08 00:35:31.113356
6265d90b-8348-4f1d-98ae-1b050dee5ad3	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3513491425	17982005523	0.00	0.00	radacct	2026-04-08 00:35:31.115706
729fa6fe-6e55-4a5e-8563-b1bb0b6e4570	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431393249	16928525318	0.00	0.00	radacct	2026-04-08 00:35:31.117386
50b49151-771c-408a-8b4d-4e04b4324f0c	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867530345	14168358785	0.00	0.00	radacct	2026-04-08 00:35:31.119044
36ced3b9-03f7-421e-90b6-347e2ff76112	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516887815	14183200419	0.00	0.00	radacct	2026-04-08 00:35:31.120817
8a9692e0-87eb-4d3e-b423-887b07e09943	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1175030587	15953301299	0.00	0.00	radacct	2026-04-08 00:35:31.122394
16f09470-88a9-41a6-bf60-d7f7b35ac418	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693411307	13907316507	0.00	0.00	radacct	2026-04-08 00:35:31.124101
4c1c15a8-ab82-4e62-adc9-c45184bef606	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407781392	10345366253	0.00	0.00	radacct	2026-04-08 00:35:31.125723
6956d44d-ce38-4689-b537-4727c489b4a4	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757435149	12831997827	0.00	0.00	radacct	2026-04-08 00:35:31.128044
55c32df8-a730-492f-8803-c9038f9264dc	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662578321	35243304818	0.00	0.00	radacct	2026-04-08 00:35:31.130043
59344b50-bcf2-4973-9c8c-c2493497adb8	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1387073542	24799043838	0.00	0.00	radacct	2026-04-08 00:35:31.132278
677b9a5d-3676-42c2-885e-41111062c8d4	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774053069	12077861315	0.00	0.00	radacct	2026-04-08 00:35:31.133915
59f39446-bc43-4a7b-b7c2-dfba06d4771c	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1831732235	41170461091	0.00	0.00	radacct	2026-04-08 00:35:31.135441
cde8c0e1-23f1-44d7-851f-12f4a823bcb2	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	244226713	6057471481	0.00	0.00	radacct	2026-04-08 00:35:31.136952
194ce360-5b79-4a1c-ab14-9f707ee3235f	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2535147001	20219091557	0.00	0.00	radacct	2026-04-08 00:35:31.138463
ea4d6e20-5494-40b1-ac54-66481ae0d1a8	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2365804582	19134989820	0.00	0.00	radacct	2026-04-08 00:35:31.139943
2a35df81-36ef-4a70-b4b8-63d266e82bf7	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755272860	20538670898	0.00	0.00	radacct	2026-04-08 00:35:31.141538
a3741c2f-367a-49c2-b08f-4f0e060533c5	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	639498157	8097321746	0.00	0.00	radacct	2026-04-08 00:35:31.143592
3426e24d-2ea2-4a0f-b169-22b5c6fce839	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183517297	11066645309	0.00	0.00	radacct	2026-04-08 00:37:31.085773
dd7d1e29-7cbd-4567-aee1-5b97ae09d749	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46572722	1778308093	0.01	0.78	radacct	2026-04-08 00:37:31.088576
fe3fcf22-b58b-4d38-ad38-e9ed5f068e54	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49779956	848655189	0.00	0.00	radacct	2026-04-08 00:37:31.09113
7fbebc5f-6685-4646-8e93-d3e5280f4d0c	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853013341	16096686475	0.01	0.01	radacct	2026-04-08 00:37:31.094694
a965bd22-5fd1-4d4c-a1b3-27445d204e58	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584447893	8821641446	0.00	0.00	radacct	2026-04-08 00:37:31.097099
cea1eabc-b175-4a8b-855a-fb0a925288fc	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66634881	1840497288	0.00	0.00	radacct	2026-04-08 00:37:31.099098
14720220-447c-4d04-acaf-80c1b0051e6a	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2434271443	20345767618	0.03	0.16	radacct	2026-04-08 00:37:31.101155
0bbdfccf-74e9-4e12-8353-11622ac8b3e2	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619454770	10541704284	0.00	0.00	radacct	2026-04-08 00:37:31.103176
bb081f31-de71-4ad2-b28a-17b3aff50ff9	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1541753353	12983083701	0.06	2.45	radacct	2026-04-08 00:37:31.105188
7b3959f8-8729-4608-9c0e-fe7e047acfe2	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	940989869	19946105685	0.00	0.05	radacct	2026-04-08 00:37:31.107982
78dd5d22-0617-4254-90d7-1da27705e823	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501520713	4257918131	0.01	0.01	radacct	2026-04-08 00:37:31.111463
e412fd9d-75a0-4b24-bcfe-3dbd7b4b6d6b	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1352299	3880193	0.01	0.01	radacct	2026-04-08 00:37:31.113742
246926a8-614d-4199-b1a5-c0c7ac72c3cb	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	63061459	1930031107	0.04	0.96	radacct	2026-04-08 00:37:31.115758
97a42ff4-3db1-44c4-ab39-8a8b91980520	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633039841	15039586653	0.01	0.19	radacct	2026-04-08 00:37:31.117826
85a32103-fc8f-4b05-bf6f-b4654fe513fd	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2809255613	12586347129	0.06	3.67	radacct	2026-04-08 00:37:31.119812
6ae9b422-94d0-4f2c-a009-eb75024ec1ec	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	476936	5235643	0.00	0.00	radacct	2026-04-08 00:37:31.121833
f46559b5-f7d0-413d-bea0-a0c1f7874e83	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719173288	5142542533	0.00	0.00	radacct	2026-04-08 00:37:31.12437
48bce5c5-3242-46be-a4d1-2e0c319e5c2a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3513636486	17982254483	0.01	0.02	radacct	2026-04-08 00:37:31.127769
6545591e-20c8-445f-a9dc-f76abca65c2d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431461134	16928580892	0.00	0.00	radacct	2026-04-08 00:37:31.130087
c16ca6d3-5de7-497f-83cf-dfb60670dbe0	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867533275	14168361215	0.00	0.00	radacct	2026-04-08 00:37:31.132032
8438da25-e048-4fc6-953a-f2f947aec00c	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2516905133	14183211427	0.00	0.00	radacct	2026-04-08 00:37:31.133953
45b14290-82e0-43fd-a553-769bbda6dd2d	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1175805717	15968738094	0.05	1.03	radacct	2026-04-08 00:37:31.135905
e1d0a77f-5d3d-4e4a-a467-035f777a78d2	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693685400	13907362807	0.02	0.00	radacct	2026-04-08 00:37:31.137784
a78bc7be-1498-44fd-a67e-3dcc58507087	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407900316	10345510173	0.01	0.01	radacct	2026-04-08 00:37:31.140098
a6489806-a4d0-40c3-b3fb-61597da76fe6	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757436411	12831998614	0.00	0.00	radacct	2026-04-08 00:37:31.142313
79867de6-7711-42a8-ac2c-65cc42419947	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1662707023	35243516246	0.01	0.01	radacct	2026-04-08 00:37:31.145398
a0d48cf3-1e85-40b0-bd71-e339ec5b615d	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1388434990	24832603510	0.09	2.24	radacct	2026-04-08 00:37:31.14742
0fe93b77-09c7-454e-bcfb-bec0f9d189e4	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774054685	12077862422	0.00	0.00	radacct	2026-04-08 00:37:31.149772
187f944e-5043-40e2-86f3-42d689115b24	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1831836112	41174027323	0.01	0.24	radacct	2026-04-08 00:37:31.151949
37c408be-a086-4c95-816b-82568d953f1c	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	245916745	6093617514	0.11	2.41	radacct	2026-04-08 00:37:31.153907
deff6ff5-f8a4-48d6-8b3b-e8adb768a353	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2536886985	20261165107	0.12	2.80	radacct	2026-04-08 00:37:31.155787
7646bd87-09ec-49ef-9a4c-17c3f9599b31	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2371119966	19140407964	0.35	0.36	radacct	2026-04-08 00:37:31.157675
e91509b8-9197-40f4-89ec-c2409f7d1ca0	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755316145	20538704247	0.00	0.00	radacct	2026-04-08 00:37:31.160851
7c33359e-d430-4596-bb3a-313618f262b8	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	639913954	8107257134	0.03	0.66	radacct	2026-04-08 00:37:31.163051
38e3e98e-1dcd-4ab0-beba-0a6d09f6fbd8	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183519940	11066651120	0.00	0.00	radacct	2026-04-08 00:39:31.106666
c40b89a0-0a29-4289-b246-fd439a3344a3	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	46940133	1799566899	0.02	1.42	radacct	2026-04-08 00:39:31.117036
b128cf62-a8fb-4d40-9a10-016d862eee43	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49782951	848656580	0.00	0.00	radacct	2026-04-08 00:39:31.119784
e4681515-0ba1-426b-a461-a4dec9ea2868	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853063163	16096726009	0.00	0.00	radacct	2026-04-08 00:39:31.123115
cf041658-86d0-4126-b7b5-f0e13440b160	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584448149	8821641766	0.00	0.00	radacct	2026-04-08 00:39:31.126153
d6baa194-579d-4887-8181-eb24db9aac83	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66681387	1840557495	0.00	0.00	radacct	2026-04-08 00:39:31.128814
de4a9e95-f0d9-43fd-8d03-2b5208f5320d	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2434835935	20350610814	0.04	0.32	radacct	2026-04-08 00:39:31.131799
573b244d-0a7e-42a9-a401-47cabce4169d	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619461176	10541710393	0.00	0.00	radacct	2026-04-08 00:39:31.134274
823e8b2a-ca02-4c22-b87b-ab52c63163eb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1542411622	13003278914	0.04	1.35	radacct	2026-04-08 00:39:31.1369
35dfaa89-2f16-4e17-8460-3e4678373d30	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941001328	19946122257	0.00	0.00	radacct	2026-04-08 00:39:31.139899
40a3bb26-5e16-4779-a088-f33667d6c9c9	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501540269	4257943932	0.00	0.00	radacct	2026-04-08 00:39:31.142689
126c71f2-014f-4960-b52e-7686eeaf3363	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1412435	4040812	0.00	0.01	radacct	2026-04-08 00:39:31.145288
7486b077-f934-4784-9435-9fcbad0bc379	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	64924510	1996848994	0.12	4.45	radacct	2026-04-08 00:39:31.147811
5683abc4-c68d-4c42-949a-310fbf7c4ed1	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633043873	15039598039	0.00	0.00	radacct	2026-04-08 00:39:31.150371
a9493ec6-0c84-4272-a5be-34805165ec65	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2810085735	12619680658	0.06	2.22	radacct	2026-04-08 00:39:31.153042
5655e220-3c9d-4bc7-a8cd-e722c97bcd2c	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	544129	5343863	0.00	0.01	radacct	2026-04-08 00:39:31.156134
61077773-71e2-438a-a032-c0d557dbfc44	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719183312	5142554266	0.00	0.00	radacct	2026-04-08 00:39:31.159854
d5462df2-ae87-49d4-894e-510ecab8e57f	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3515228811	17987111684	0.11	0.32	radacct	2026-04-08 00:39:31.162462
6d816409-abf8-4e68-9cd5-1b6197c7bbb5	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431525247	16928687577	0.00	0.01	radacct	2026-04-08 00:39:31.164958
57470be4-4abc-4b77-b289-a07a543f61ef	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867549623	14168384185	0.00	0.00	radacct	2026-04-08 00:39:31.167522
256d09be-70cd-47f3-bd77-b87e55168851	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518242991	14196093325	0.09	0.86	radacct	2026-04-08 00:39:31.170016
35de68f9-1b9a-4661-9220-91a9e09aef2f	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1180795911	15998140002	0.33	1.96	radacct	2026-04-08 00:39:31.172463
00ea7cbd-05cc-4cb4-a593-b2729d04159f	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693736142	13907376870	0.00	0.00	radacct	2026-04-08 00:39:31.175212
d3da6a05-751a-4c8f-a391-61ec6d4f4c96	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	407955669	10345633078	0.00	0.01	radacct	2026-04-08 00:39:31.177916
4bb6bda1-2c42-48b6-b096-353bcaa9ecda	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757437506	12831999272	0.00	0.00	radacct	2026-04-08 00:39:31.180765
64be2865-b1c9-4cf9-8a9f-4466b26c6802	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1663137207	35243970934	0.03	0.03	radacct	2026-04-08 00:39:31.183393
70024ec7-b9d0-48c8-876d-24175fd3ec63	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1389437526	24854040516	0.07	1.43	radacct	2026-04-08 00:39:31.185864
72905036-bc82-42c8-9f3f-e97c1dac7767	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774062984	12077870628	0.00	0.00	radacct	2026-04-08 00:39:31.188394
4b717efa-7bae-4398-bae8-a734fc75cfe4	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1833423291	41191305805	0.11	1.15	radacct	2026-04-08 00:39:31.190919
d4fe5231-ff21-4fed-93a8-18ea2daae1ad	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	247687723	6139863403	0.12	3.08	radacct	2026-04-08 00:39:31.193622
fb211597-cb27-4682-8da8-9ef791d4426b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2538700467	20302567211	0.12	2.76	radacct	2026-04-08 00:39:31.196051
70221c9e-b8a1-4f13-ac3b-f02aa7311642	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2376689069	19142210488	0.37	0.12	radacct	2026-04-08 00:39:31.198432
a46099bd-ad14-4dd2-9aef-acd29e8d4833	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755318558	20538706062	0.00	0.00	radacct	2026-04-08 00:39:31.201098
5a199b70-e515-4604-ad91-a48a33a45b8a	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	640799724	8119365053	0.06	0.81	radacct	2026-04-08 00:39:31.203673
81c5848e-c21d-488a-bf69-dc0ad32cf29b	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183521235	11066652210	0.00	0.00	radacct	2026-04-08 00:41:31.097235
22cbd4b1-ba23-4a96-bd90-64216a3e4c41	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	47485333	1825268376	0.04	1.71	radacct	2026-04-08 00:41:31.107032
7ca13ed9-334e-4829-97e8-2b830947bff5	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49784466	848657507	0.00	0.00	radacct	2026-04-08 00:41:31.110693
9a193479-fe52-43eb-b4de-5324a3c4e472	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853077708	16096739226	0.00	0.00	radacct	2026-04-08 00:41:31.113329
1cb5d97f-0679-4973-916a-0a197c5e4cab	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584448651	8821642288	0.00	0.00	radacct	2026-04-08 00:41:31.11595
2d666188-5c01-4e3f-88b6-102d48034d26	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66702048	1840567968	0.00	0.00	radacct	2026-04-08 00:41:31.1191
6c932618-bacb-4e45-a26e-000c8b6102ea	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2435730818	20355882905	0.06	0.35	radacct	2026-04-08 00:41:31.121863
141f6d39-2cba-4e98-84bb-eb7409831917	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619462356	10541711767	0.00	0.00	radacct	2026-04-08 00:41:31.125488
503ac045-c694-43b7-9b4f-1ab6eccb9eed	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1542730534	13006270866	0.02	0.20	radacct	2026-04-08 00:41:31.128259
632eed69-510e-4aa5-8866-0af77bb15dbc	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941011526	19946136790	0.00	0.00	radacct	2026-04-08 00:41:31.131638
965f7d92-3b47-4ce4-9732-84804afdf356	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501554552	4257961700	0.00	0.00	radacct	2026-04-08 00:41:31.134535
84aa8fe8-f67b-482c-9408-42c63e6dabda	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1483811	4138799	0.00	0.01	radacct	2026-04-08 00:41:31.13764
cdf1f84c-4954-49da-b1bf-19349ded8939	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	67199586	2078607030	0.15	5.45	radacct	2026-04-08 00:41:31.142274
d6efe9f4-b1ed-4be8-a494-8bdfe9c39025	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633058668	15039649262	0.00	0.00	radacct	2026-04-08 00:41:31.14665
482dd67d-dc8e-4a58-93b0-e71eedfbed96	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2810988694	12673772576	0.06	3.61	radacct	2026-04-08 00:41:31.149886
ad787ebe-4688-4a57-9182-a5a1d4ba3d50	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	557099	5363897	0.00	0.00	radacct	2026-04-08 00:41:31.152577
1ff02e6b-48e8-4ccb-b10a-7e6e3f6c571f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719184956	5142555755	0.00	0.00	radacct	2026-04-08 00:41:31.155325
a8571c22-d6b3-468e-bb36-38be8ec887ce	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3516506145	18006401434	0.09	1.29	radacct	2026-04-08 00:41:31.159363
92cd469e-c4e0-48e0-b09e-962b7692cbd9	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431572938	16928717309	0.00	0.00	radacct	2026-04-08 00:41:31.162102
4bebe86b-4475-442a-a341-209dc82d077f	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867577954	14168421363	0.00	0.00	radacct	2026-04-08 00:41:31.164798
15aeb808-4344-4c52-aae5-270abf42208f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518344923	14196371358	0.01	0.02	radacct	2026-04-08 00:41:31.16745
957880d6-6f70-4326-b2a9-7da8df331dd1	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183127740	16006047683	0.16	0.53	radacct	2026-04-08 00:41:31.170329
d352211a-d2b7-4ae4-9297-9d06d413ba7c	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693786543	13907433140	0.00	0.00	radacct	2026-04-08 00:41:31.172971
549f8430-d57f-402d-aee8-268768cecab8	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408005857	10346926537	0.00	0.09	radacct	2026-04-08 00:41:31.176351
f6829d6f-da55-4a2e-aa60-673629bce21f	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757448051	12832017822	0.00	0.00	radacct	2026-04-08 00:41:31.179195
2abd89a1-ec87-4bba-9390-42b8ae201ede	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1663194322	35244533732	0.00	0.04	radacct	2026-04-08 00:41:31.181889
6be6acc4-8ecc-428e-a40a-5a3c26e3094f	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1390613722	24874996573	0.08	1.40	radacct	2026-04-08 00:41:31.185048
4c255ad1-707c-4287-8316-b6a3d8920f69	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774072964	12077882028	0.00	0.00	radacct	2026-04-08 00:41:31.188244
6eb85e7c-d7fd-48db-bdd1-b1cd99959a9a	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1834267640	41207810805	0.06	1.10	radacct	2026-04-08 00:41:31.19189
f500b28f-57a8-4ff0-8951-dacaa520a3d9	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	248953991	6175452501	0.08	2.37	radacct	2026-04-08 00:41:31.195269
b277968d-9ef5-42f5-9ac7-de99a035226a	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2540174654	20343562908	0.10	2.73	radacct	2026-04-08 00:41:31.198801
6010518d-59bb-48a2-928a-7e2be28e0213	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2380511718	19142976263	0.25	0.05	radacct	2026-04-08 00:41:31.202059
b9d1824c-8686-4156-82f1-83aaba343d0f	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755383418	20538852635	0.00	0.01	radacct	2026-04-08 00:41:31.20523
a3184b0e-764c-4d36-919b-53f592567eb7	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	641279631	8126154210	0.03	0.45	radacct	2026-04-08 00:41:31.209113
781eed36-93ec-4ba0-b7a2-53f996008c7e	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183521273	11066652210	0.00	0.00	radacct	2026-04-08 00:41:49.282163
59897d11-0bb3-4049-8b61-fad71f7575c3	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	47510830	1827250544	0.00	0.00	radacct	2026-04-08 00:41:49.288583
0515be6c-8f16-462c-8684-f838bdea43f3	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49784673	848657620	0.00	0.00	radacct	2026-04-08 00:41:49.291065
fe276447-4288-471b-bfda-efae92f1cdb3	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853079040	16096740054	0.00	0.00	radacct	2026-04-08 00:41:49.293372
82bf89df-6451-4678-9eda-60cfc558d288	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584448715	8821642368	0.00	0.00	radacct	2026-04-08 00:41:49.295298
348231cb-c5a1-4130-8e2e-beec2cf2c354	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66716214	1840579183	0.00	0.00	radacct	2026-04-08 00:41:49.297211
54e8b08b-3546-428b-b824-57c269bdb95e	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2435841254	20359902273	0.00	0.00	radacct	2026-04-08 00:41:49.299124
1bef05e0-b16c-4ac3-aca6-4841608ae139	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619462546	10541711927	0.00	0.00	radacct	2026-04-08 00:41:49.300751
0697f4a1-eb18-4130-9d0d-35e25220dce9	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1542735165	13006273586	0.00	0.00	radacct	2026-04-08 00:41:49.302719
5eb62198-f744-441c-b1ef-c3c082132b6d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941019320	19946142436	0.00	0.00	radacct	2026-04-08 00:41:49.304584
84cc04da-9eac-49a1-9817-51ed79889c72	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501556576	4257962685	0.00	0.00	radacct	2026-04-08 00:41:49.306543
d5687465-6873-47d2-a4e2-d5ccc7fcb289	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1501110	4383956	0.00	0.00	radacct	2026-04-08 00:41:49.308752
67285649-b95b-4b17-94bf-a1314eb01adb	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	67571689	2090317637	0.00	0.00	radacct	2026-04-08 00:41:49.310629
9d51ce48-5061-49d8-8b4c-0529a3eb4cee	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633083959	15039672635	0.00	0.00	radacct	2026-04-08 00:41:49.312579
18ad801c-b405-4fcb-b30d-c8497c22f43b	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2811003248	12673791919	0.00	0.00	radacct	2026-04-08 00:41:49.31437
000232e7-4f01-4398-b8b9-6e1a882297f3	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	557099	5364153	0.00	0.00	radacct	2026-04-08 00:41:49.316313
f04dc0ab-d620-46ba-9655-2ac9180fa540	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719185173	5142555982	0.00	0.00	radacct	2026-04-08 00:41:49.318043
fa361b85-1c37-45e2-acbb-e1894447d7ae	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3516660684	18007327043	0.00	0.00	radacct	2026-04-08 00:41:49.320141
49582af9-06ae-4071-a2b5-2bfe7d9b7f76	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431579795	16928719581	0.00	0.00	radacct	2026-04-08 00:41:49.321729
7a1e790a-8724-4e7b-a08a-7a9e8482397b	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867586813	14168436454	0.00	0.00	radacct	2026-04-08 00:41:49.32403
7ac68972-8961-4830-8284-1b480c2ece30	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518346550	14196372717	0.00	0.00	radacct	2026-04-08 00:41:49.326163
08c78190-0934-430e-b410-93304729b3a5	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183131123	16006054635	0.00	0.00	radacct	2026-04-08 00:41:49.327955
e0e91f81-2293-476c-8719-6169d0e2b9ea	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693795060	13907436536	0.00	0.00	radacct	2026-04-08 00:41:49.329742
4f6e3eb5-9113-492c-8ff0-802be62cf976	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408005857	10346926537	0.00	0.00	radacct	2026-04-08 00:41:49.331506
9b9a94e2-a792-4bd0-9647-b2064ff039bb	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757451645	12832022900	0.00	0.00	radacct	2026-04-08 00:41:49.333505
04e9919c-f36d-4aa4-b005-9a885eb7500e	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1663219763	35244657643	0.00	0.00	radacct	2026-04-08 00:41:49.335368
81d736c9-9f43-4c92-9131-b92f0d60a2a9	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1390817836	24879545789	0.00	0.00	radacct	2026-04-08 00:41:49.337234
bfcffc4d-64e8-4e64-8f13-0b2b0949af14	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774073542	12077882572	0.00	0.00	radacct	2026-04-08 00:41:49.339402
867ac6cd-8499-4716-a807-80cd681c6e17	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1834269221	41207812165	0.00	0.00	radacct	2026-04-08 00:41:49.342059
bca1add6-a391-4de9-a796-7f8297afa1f1	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	249212014	6179874709	0.00	0.00	radacct	2026-04-08 00:41:49.344051
019ce61f-75ea-479d-9623-df808b301c35	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2540447687	20348024326	0.00	0.00	radacct	2026-04-08 00:41:49.345925
52710115-03de-4689-96fa-6f19f3482129	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2380877157	19143019306	0.00	0.00	radacct	2026-04-08 00:41:49.347883
0ba3ece6-7d26-4656-acc4-9f914398693e	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755383676	20538852874	0.00	0.00	radacct	2026-04-08 00:41:49.349767
7cee87fb-1d0d-4e88-aa18-291c08d045d5	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	641361232	8126845657	0.00	0.00	radacct	2026-04-08 00:41:49.351781
34fda8b1-1a78-427e-a4c7-ef93a9a9402e	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183531206	11066665948	0.00	0.00	radacct	2026-04-08 00:43:49.265234
6b018a23-dce1-4f94-a34c-e133696e8528	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	47814436	1839211937	0.02	0.80	radacct	2026-04-08 00:43:49.27597
abfab322-f5b2-4481-b34b-f583d780a49b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49785926	848658289	0.00	0.00	radacct	2026-04-08 00:43:49.278424
68218eb8-e57f-4d8a-baf6-1544dbf59f06	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853087200	16096747339	0.00	0.00	radacct	2026-04-08 00:43:49.280541
8368e8e2-01c3-4c16-b299-a0910ad232b1	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584470484	8821664246	0.00	0.00	radacct	2026-04-08 00:43:49.282763
657ecc5a-3c90-46ea-b8ea-633e2f2b7d07	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66729619	1840593136	0.00	0.00	radacct	2026-04-08 00:43:49.285127
bced4dad-c0c8-4b9d-bdea-ac949a7503be	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2436170177	20374046143	0.02	0.94	radacct	2026-04-08 00:43:49.287382
f68757bb-f141-477e-8b9a-77a499c4f018	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619463496	10541711927	0.00	0.00	radacct	2026-04-08 00:43:49.290195
ee80fec0-ad5a-4b79-b3fb-b3e3d27536cb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1543293869	13011842488	0.04	0.37	radacct	2026-04-08 00:43:49.293226
974483d7-4a87-4842-acf2-a394bf73ea18	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941040693	19946168206	0.00	0.00	radacct	2026-04-08 00:43:49.295827
a227580f-cb45-49c0-8f64-21757c36e2b1	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501675549	4258077603	0.01	0.01	radacct	2026-04-08 00:43:49.298025
4c4de65e-333a-4be7-a71b-29412450a361	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1555763	4921601	0.00	0.04	radacct	2026-04-08 00:43:49.300183
d48370cc-376f-43ad-9a79-15d368938ffa	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	68939866	2161660809	0.09	4.76	radacct	2026-04-08 00:43:49.302397
2943ed4d-f95f-4e80-b6a1-bccb5ba56166	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633112970	15039740650	0.00	0.00	radacct	2026-04-08 00:43:49.304921
46dbc693-3eef-4c4a-926a-9204fc995236	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2812079959	12730113070	0.07	3.76	radacct	2026-04-08 00:43:49.307859
658368d7-12d4-49a4-9a86-6b798a18da1c	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	620002	5476628	0.00	0.01	radacct	2026-04-08 00:43:49.310934
3f23f4b0-2242-4618-8b40-621c62ed6856	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719186366	5142557072	0.00	0.00	radacct	2026-04-08 00:43:49.313275
44f0edf9-f943-45b1-8d26-bb638b067ff5	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3518290855	18021244489	0.11	0.93	radacct	2026-04-08 00:43:49.315392
0bdd839d-df84-417a-adde-3b9d795d3c43	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431613393	16928744584	0.00	0.00	radacct	2026-04-08 00:43:49.31764
6bc09243-f1c3-4d6a-ae6d-190612292b40	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867643369	14168497276	0.00	0.00	radacct	2026-04-08 00:43:49.320021
81715c5a-083c-405c-8037-6c0857c2cb04	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518368039	14196386514	0.00	0.00	radacct	2026-04-08 00:43:49.322772
6793c8f2-0d8b-4516-a17c-87e89c47d4be	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183181486	16006139906	0.00	0.01	radacct	2026-04-08 00:43:49.326018
54c8d2c1-9135-4d57-a7fe-72c404f56174	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693839115	13907444084	0.00	0.00	radacct	2026-04-08 00:43:49.328524
eababe43-0ca0-4c39-b662-4972729a531b	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408006755	10346929141	0.00	0.00	radacct	2026-04-08 00:43:49.330607
9c5067f4-fdf9-4cf1-8f0d-711fe21ac8c7	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757480681	12832083033	0.00	0.00	radacct	2026-04-08 00:43:49.332869
d8ba51d4-49e1-4fa6-98f7-d0f51bd4bb22	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1663321028	35245122328	0.01	0.03	radacct	2026-04-08 00:43:49.33533
f35436a3-4ded-4173-91b2-c06e9dad484c	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1391702528	24894760367	0.06	1.01	radacct	2026-04-08 00:43:49.337684
74879cd2-b13e-4be6-b1ab-2d50de3b560e	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774075022	12077883520	0.00	0.00	radacct	2026-04-08 00:43:49.340695
17eac6fd-bd20-4746-b8e7-8aae7db15afa	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1834657081	41210912314	0.03	0.21	radacct	2026-04-08 00:43:49.34332
eefdee51-2304-4589-a846-17fec8e2bf63	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	250457186	6201727425	0.08	1.46	radacct	2026-04-08 00:43:49.345426
472946ff-a05c-4058-bc1c-382ce07b66c6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2543210174	20375603382	0.18	1.84	radacct	2026-04-08 00:43:49.347477
23cc078e-d4c9-4ad4-accb-b1b53e65da33	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2383570313	19143162216	0.18	0.01	radacct	2026-04-08 00:43:49.349793
34f13669-565a-4f91-97b6-b2a561378120	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755441418	20538978089	0.00	0.01	radacct	2026-04-08 00:43:49.352086
09d22c39-4bd2-499b-ace1-eb9e42a66609	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	642041044	8142502276	0.05	1.04	radacct	2026-04-08 00:43:49.354193
e81c4e0c-8e0a-422d-8f30-9ee0eb1d65c6	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183616447	11066963072	0.01	0.02	radacct	2026-04-08 00:45:49.320749
86a929ae-acd2-4d68-a1e0-b56e69e55750	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	47966766	1851203935	0.01	0.80	radacct	2026-04-08 00:45:49.331346
c4f5f300-6c62-4a44-bc07-4fbf4cf98b92	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49799210	848714755	0.00	0.00	radacct	2026-04-08 00:45:49.333778
c367e838-7396-4c7a-b371-4629076681d6	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853097347	16096762622	0.00	0.00	radacct	2026-04-08 00:45:49.33589
419b7911-ab20-4e73-8cb8-43934e4846dc	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584471698	8821666259	0.00	0.00	radacct	2026-04-08 00:45:49.339214
765f9667-9699-482a-8c03-3df0c73c705f	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66734815	1840598716	0.00	0.00	radacct	2026-04-08 00:45:49.342039
9ff0f0f8-5a96-4b3a-8859-122319a6faa8	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2436887832	20392576932	0.05	1.23	radacct	2026-04-08 00:45:49.344537
a4ada126-55ef-44b1-9b3a-5ac8f57ac03d	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619464692	10541713780	0.00	0.00	radacct	2026-04-08 00:45:49.346596
da25c587-c301-4683-a388-f8951790584b	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1544068753	13028027205	0.05	1.08	radacct	2026-04-08 00:45:49.348583
26f588b1-e9b3-412a-bb89-ac55ef5a78aa	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941074957	19946417667	0.00	0.02	radacct	2026-04-08 00:45:49.350562
603f8e53-1bf8-44b7-9fec-8919d15dcce9	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501704315	4258123471	0.00	0.00	radacct	2026-04-08 00:45:49.352639
4acc3cd1-f589-4a59-8312-6ec9e1615763	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	1962062	5605021	0.03	0.05	radacct	2026-04-08 00:45:49.355886
62740e8f-00f2-4149-a402-3f9b71988de5	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	70234912	2238529646	0.09	5.12	radacct	2026-04-08 00:45:49.358732
98eac587-c0eb-4bdd-a60e-a80d93edc7e0	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633117189	15039751049	0.00	0.00	radacct	2026-04-08 00:45:49.361039
a1edb0f9-b262-422f-be1d-f2252d9a2fd5	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2812723377	12766049754	0.04	2.39	radacct	2026-04-08 00:45:49.363043
2eec9f8e-524d-4086-8dcd-ecda80ee1ee1	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	634335	5489452	0.00	0.00	radacct	2026-04-08 00:45:49.3652
48912bb3-43ab-4d8f-98b9-24247edfb51a	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719190420	5142559803	0.00	0.00	radacct	2026-04-08 00:45:49.367555
dd41ad2c-3c29-42fb-8cea-c4c38227e2a2	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3521701524	18043232613	0.23	1.47	radacct	2026-04-08 00:45:49.369639
ad4d4900-a79c-4a7c-b842-a2e856876cdd	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431660448	16928805995	0.00	0.00	radacct	2026-04-08 00:45:49.37305
f78054bc-da87-4e23-91f8-46d048471658	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867672512	14168549799	0.00	0.00	radacct	2026-04-08 00:45:49.375977
de56fb38-5d0f-4ae5-8e9e-7cf25c07c30b	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518408655	14196421446	0.00	0.00	radacct	2026-04-08 00:45:49.378117
cb4a9313-b104-441d-9bf8-3624cf79ad74	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183200023	16006176917	0.00	0.00	radacct	2026-04-08 00:45:49.380058
a74ee92f-d198-4eb1-a4c0-bba5946da98c	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693898951	13907458789	0.00	0.00	radacct	2026-04-08 00:45:49.381954
0a1dd126-ba5e-4b6d-8eb7-826f6d20a308	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408006975	10346929449	0.00	0.00	radacct	2026-04-08 00:45:49.383845
8ed42d7c-c263-4516-87ff-fd4213eb77d4	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757491879	12832097845	0.00	0.00	radacct	2026-04-08 00:45:49.385822
0fe3f44b-1992-4a3a-bf09-679f75a2550c	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664005139	35257471009	0.05	0.82	radacct	2026-04-08 00:45:49.388961
6d136aec-292e-4c89-8b9b-a6c7c65743a8	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1392247763	24912110973	0.04	1.16	radacct	2026-04-08 00:45:49.391907
58d28004-8c02-4525-85fe-f97cc0a2869a	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774078228	12077889160	0.00	0.00	radacct	2026-04-08 00:45:49.394051
52852df3-8e03-445e-b464-a1547242d10f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1835347262	41219331887	0.05	0.56	radacct	2026-04-08 00:45:49.395948
51ad07b8-5768-4ced-90ba-4d31988f5c63	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	251380461	6211136959	0.06	0.63	radacct	2026-04-08 00:45:49.39789
2e9c55d8-9789-4f42-8413-4c0ddd9557cf	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2546140874	20419293321	0.20	2.91	radacct	2026-04-08 00:45:49.400082
53219070-78c1-4610-a640-42f74409892c	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2386502947	19143468490	0.20	0.02	radacct	2026-04-08 00:45:49.402333
b06d4fc2-5907-4899-b46d-7ff3324d10b7	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755543151	20539254520	0.01	0.02	radacct	2026-04-08 00:45:49.404825
9c1aeca3-6ad2-4119-a993-a3b0ebe7b0bf	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	642525993	8143861692	0.03	0.09	radacct	2026-04-08 00:45:49.40807
0b669c1a-1553-4c5a-88a6-91afd1b79114	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183619094	11066965258	0.00	0.00	radacct	2026-04-08 00:47:49.368572
85237af2-a9de-48d4-a18f-9bab27e65493	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	48255400	1867789592	0.02	1.11	radacct	2026-04-08 00:47:49.41917
fb75dc5c-7623-4d4d-9de1-f8d217a8062f	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49800515	848715552	0.00	0.00	radacct	2026-04-08 00:47:49.423236
0a2b60eb-9370-4e82-9c56-253f7c140d00	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853112415	16096797049	0.00	0.00	radacct	2026-04-08 00:47:49.425608
11ec279e-7337-4277-a443-aa53d6aad665	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584480868	8821693331	0.00	0.00	radacct	2026-04-08 00:47:49.42772
1c82f6a6-b60f-489f-ac07-6a3cd69c0546	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66756694	1840620106	0.00	0.00	radacct	2026-04-08 00:47:49.430122
69094601-9874-4250-8976-8eb5f0856ae6	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2437949198	20426444164	0.07	2.26	radacct	2026-04-08 00:47:49.432245
c25ed541-35e7-475a-8a01-3fd0a767da80	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619465756	10541713780	0.00	0.00	radacct	2026-04-08 00:47:49.434288
50fe1ac7-7198-4c19-bd65-5cffcaa9ba0b	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1545359290	13042512955	0.09	0.97	radacct	2026-04-08 00:47:49.436526
e22ff20c-baa1-407e-a308-c1598d72258e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941077299	19946421061	0.00	0.00	radacct	2026-04-08 00:47:49.43939
c94aa97c-f366-4f2b-b66a-0e569bb1bda6	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501767462	4258303122	0.00	0.01	radacct	2026-04-08 00:47:49.441955
5ced0a93-fcd4-40e2-8e46-d0a8bdf7850a	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	2496059	7587825	0.04	0.13	radacct	2026-04-08 00:47:49.444033
3a05a126-c084-4873-9761-d40b1f96b571	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	71366383	2311921017	0.08	4.89	radacct	2026-04-08 00:47:49.446076
6c768a8c-5793-46ac-8f94-c219e0d6c653	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633121028	15039760439	0.00	0.00	radacct	2026-04-08 00:47:49.448079
a64017bc-dd46-4f2c-8fe7-e5c49522b084	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2813552999	12813360631	0.06	3.15	radacct	2026-04-08 00:47:49.450048
7eeccd8e-0831-4187-94d5-bbbefef001fd	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	960200	7179749	0.02	0.11	radacct	2026-04-08 00:47:49.452046
6eef8793-5e3e-44f2-9886-5b5ed5b4232b	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719192717	5142561685	0.00	0.00	radacct	2026-04-08 00:47:49.454874
444e65c7-0695-4bd1-bef9-8e573ba44890	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3524262062	18063177139	0.17	1.33	radacct	2026-04-08 00:47:49.457718
bac66674-0de0-438e-a663-4c9e1e7917af	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431757024	16928898757	0.01	0.01	radacct	2026-04-08 00:47:49.460144
200f94b9-49b9-417e-b74b-81362ee63a5e	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867701418	14168585438	0.00	0.00	radacct	2026-04-08 00:47:49.462514
76a4d8fa-c430-442c-982e-07b4e7e82b7c	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518448864	14196446940	0.00	0.00	radacct	2026-04-08 00:47:49.464909
853e01c0-7a65-41a3-92d6-dc48aec8984b	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183235524	16006210413	0.00	0.00	radacct	2026-04-08 00:47:49.467305
20171dcb-b5a1-49f4-a02c-18d6cc73da58	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693936846	13907464109	0.00	0.00	radacct	2026-04-08 00:47:49.470302
8076a5fb-81f5-4d4e-aa83-394d18b148e8	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408013781	10346944155	0.00	0.00	radacct	2026-04-08 00:47:49.473674
2849bea4-eaa2-4952-b68e-b701ddb932d2	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757493986	12832099716	0.00	0.00	radacct	2026-04-08 00:47:49.476221
f8720fb1-9e21-423b-bf6b-d7a3ad104013	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664062578	35257870692	0.00	0.03	radacct	2026-04-08 00:47:49.478712
63b5272d-0d90-4d4b-a12f-229ca255b695	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1393326809	24935814001	0.07	1.58	radacct	2026-04-08 00:47:49.481187
892a5dd0-8434-403c-8671-89a2d391718d	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774089117	12077898635	0.00	0.00	radacct	2026-04-08 00:47:49.4837
9c992d14-3e78-4f7b-8748-a5681032f24e	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1836876749	41241555279	0.10	1.48	radacct	2026-04-08 00:47:49.486589
e7012456-2d69-4f58-ae59-f0ea8ef46a17	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	253021315	6241885042	0.11	2.05	radacct	2026-04-08 00:47:49.489983
c599cd93-6f6d-4d47-ad53-66a832e9f792	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2547462682	20462292902	0.09	2.87	radacct	2026-04-08 00:47:49.492456
b9308e8b-9da7-4052-aa49-33a608583b74	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2390406399	19143771001	0.26	0.02	radacct	2026-04-08 00:47:49.494853
53578ed2-bd0b-4e5d-9577-118e9e869149	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755605378	20539449061	0.00	0.01	radacct	2026-04-08 00:47:49.497246
a50a884e-3e45-4e53-82fa-2c091a723ab0	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	642804082	8144219249	0.02	0.02	radacct	2026-04-08 00:47:49.499645
188a5355-6482-4cde-9ad4-c51ab4256c2c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183634225	11067003307	0.00	0.00	radacct	2026-04-08 00:49:49.45812
8030b881-5580-45b0-b0fa-b98494b5c7c7	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	48520555	1883421226	0.02	1.04	radacct	2026-04-08 00:49:49.467307
2b1d7028-24ac-45b7-b289-c39a1efa3802	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49803045	848716470	0.00	0.00	radacct	2026-04-08 00:49:49.470856
8f0aa241-a8b7-46b2-b043-a597f9d2ba27	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853132364	16096802755	0.00	0.00	radacct	2026-04-08 00:49:49.473592
e55ba5dc-d944-4145-b400-c7ef6ba9b7fe	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584481278	8821693651	0.00	0.00	radacct	2026-04-08 00:49:49.476321
7b6679a3-2791-4fa3-8b92-1355d9448a10	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66765895	1840634807	0.00	0.00	radacct	2026-04-08 00:49:49.478598
b04e9fd5-7245-40bd-a23d-381c54b5b44c	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2438273971	20430901769	0.02	0.30	radacct	2026-04-08 00:49:49.480802
8f7e8e73-43b8-45bc-abc0-b3130766075e	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619466820	10541713780	0.00	0.00	radacct	2026-04-08 00:49:49.483102
34fe8daf-940d-4693-8c99-6e796e79e70e	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1545720424	13043912661	0.02	0.09	radacct	2026-04-08 00:49:49.485776
a9832249-e9a7-4937-9aff-3abea16b454a	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941090293	19946442572	0.00	0.00	radacct	2026-04-08 00:49:49.488777
b1317c63-80df-4164-8ea1-cd6d4fc4eb2d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501860526	4258460313	0.01	0.01	radacct	2026-04-08 00:49:49.491156
e704002e-c5d7-4da3-8ffe-013705b93344	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	3252297	28059747	0.05	1.36	radacct	2026-04-08 00:49:49.49342
f501e3a4-da93-4445-b806-b0b5297b665b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	72707505	2393022395	0.09	5.40	radacct	2026-04-08 00:49:49.495449
b6b45b57-a48c-4642-ad24-7f4dc2bab2d2	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633125053	15039770285	0.00	0.00	radacct	2026-04-08 00:49:49.49748
43debd70-21fb-47ac-814d-97cbba7a7738	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2814508313	12861411927	0.06	3.20	radacct	2026-04-08 00:49:49.499462
73fc6110-9c64-474f-b25b-06814ac32225	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1026384	7392440	0.00	0.01	radacct	2026-04-08 00:49:49.501876
de934ae0-d08b-4ef0-ba8f-44b5b19b084a	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719193707	5142562695	0.00	0.00	radacct	2026-04-08 00:49:49.505366
ed2e98fa-c5d9-45f1-ab91-a37f42b6df5b	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3525998708	18077272574	0.12	0.94	radacct	2026-04-08 00:49:49.507923
c8fe5e8a-c453-4855-a5d8-6e92ae1bcb4c	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431807175	16928959279	0.00	0.00	radacct	2026-04-08 00:49:49.510313
80db9f53-2088-41b5-838a-6d7300abb638	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867703632	14168587420	0.00	0.00	radacct	2026-04-08 00:49:49.512409
3a025313-e98e-4c16-b1f1-d9f1e84a1988	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518595688	14196985439	0.01	0.04	radacct	2026-04-08 00:49:49.514431
b4e274b2-e7eb-49cf-a97d-29945b238531	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183247138	16006239296	0.00	0.00	radacct	2026-04-08 00:49:49.516547
c7695853-18c8-4b0c-b479-e23ad3ed798d	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	693990046	13907478396	0.00	0.00	radacct	2026-04-08 00:49:49.518692
1f1a85d0-af5c-4242-a3f2-8db2909ecfa1	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408014505	10346947462	0.00	0.00	radacct	2026-04-08 00:49:49.521829
af6e035b-f747-49d3-a1a4-7a199b99e1dc	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757498366	12832104076	0.00	0.00	radacct	2026-04-08 00:49:49.524416
6adfa072-46d7-4492-8ff9-1ceaf12abab3	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664113137	35257939720	0.00	0.00	radacct	2026-04-08 00:49:49.526532
bdeda33d-916e-431c-ae5d-08e7e4c245ef	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1394455870	24956882218	0.08	1.40	radacct	2026-04-08 00:49:49.52871
06a0f62a-2e16-43c2-8db1-ad3f453f230c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774090004	12077899157	0.00	0.00	radacct	2026-04-08 00:49:49.530652
fb7c275c-6b77-46c0-b673-934e53ff1f3b	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1837046748	41242297425	0.01	0.05	radacct	2026-04-08 00:49:49.532524
25c2c21f-09f1-4d5c-bf99-df5f5574fc0f	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	254342179	6275850913	0.09	2.26	radacct	2026-04-08 00:49:49.53449
a3dba2a4-d9e8-427f-a647-6656e6ee32d3	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2548574980	20506774132	0.07	2.96	radacct	2026-04-08 00:49:49.538095
841f0ce2-4c5f-43c3-88c4-0500231602b9	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2393868073	19153755138	0.23	0.67	radacct	2026-04-08 00:49:49.540836
7623ef8c-8150-43ea-b0f3-d6d41f359c13	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755621060	20539460254	0.00	0.00	radacct	2026-04-08 00:49:49.542834
86c8d135-2629-418e-a02f-c451c9a982c9	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	643801670	8152830597	0.07	0.57	radacct	2026-04-08 00:49:49.544829
0b623fa5-2cac-406b-b020-c4c6a86e5b99	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183653344	11067067871	0.00	0.00	radacct	2026-04-08 00:51:49.406342
580877ff-2585-4d6f-9b68-5736e7ba77de	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	48763025	1900304880	0.02	1.13	radacct	2026-04-08 00:51:49.416782
114beb12-3285-44b2-8b03-e44f9d70280b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	49819284	848725927	0.00	0.00	radacct	2026-04-08 00:51:49.419932
b428f653-fcac-46ae-a8cf-26bb6059fc8f	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853136463	16096804124	0.00	0.00	radacct	2026-04-08 00:51:49.422818
328e1efa-9d38-4567-975f-f0bc9c69e6de	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584482126	8821694693	0.00	0.00	radacct	2026-04-08 00:51:49.425511
c6c3a77f-d4cb-42a4-a3e2-c6e8166a59e9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66802538	1840663811	0.00	0.00	radacct	2026-04-08 00:51:49.428437
cb62ce42-e146-49a2-a9ba-b16f5d06a73b	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2439066265	20441447256	0.05	0.70	radacct	2026-04-08 00:51:49.431316
8ece3485-899d-4608-849f-10e22b616a5a	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619467940	10541713908	0.00	0.00	radacct	2026-04-08 00:51:49.43377
3e3d4abf-540a-41de-a428-50c2721cc481	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1545844795	13044500076	0.01	0.04	radacct	2026-04-08 00:51:49.437292
339b3f54-1305-41ab-bd3f-3556141dc60b	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941228519	19946595661	0.01	0.01	radacct	2026-04-08 00:51:49.440492
7f5a9193-f1f4-4017-ba5b-2239e4a0cd5f	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	501927649	4259538968	0.00	0.07	radacct	2026-04-08 00:51:49.442594
ea90cb2d-3326-4983-9fac-197102492e0e	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	5557883	93744309	0.15	4.38	radacct	2026-04-08 00:51:49.444651
d84d1bba-8300-4190-975d-15c534cf6e7a	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	74065622	2459217719	0.09	4.41	radacct	2026-04-08 00:51:49.446738
30ad4ea0-b265-41c4-8537-609d49c8df74	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633166361	15039964137	0.00	0.01	radacct	2026-04-08 00:51:49.448717
ab3cf7bc-2f1b-47d6-a303-db037b5e2364	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2815104099	12897221284	0.04	2.39	radacct	2026-04-08 00:51:49.451239
3980ff4e-1ed8-45f2-956a-f65be3bb3b99	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1051037	7436309	0.00	0.00	radacct	2026-04-08 00:51:49.454093
d0191182-ec9c-41e8-91d4-5eea9c950abd	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719195645	5142563714	0.00	0.00	radacct	2026-04-08 00:51:49.456774
17cd07a1-52d9-4b60-a1b0-5128ef6d54fb	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3538347728	18089851233	0.82	0.84	radacct	2026-04-08 00:51:49.459589
df21c522-8bd2-42a1-baea-4402a1cbb4d8	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431849586	16929008759	0.00	0.00	radacct	2026-04-08 00:51:49.461997
b2133afe-2053-4124-a91a-1762482fbd82	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867705695	14168589521	0.00	0.00	radacct	2026-04-08 00:51:49.464472
9a039ab4-047e-491a-a71e-1f4f75a64a63	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518615010	14196999073	0.00	0.00	radacct	2026-04-08 00:51:49.466963
af401035-326b-40ef-ab4d-9f241e6fc330	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183301815	16006353034	0.00	0.01	radacct	2026-04-08 00:51:49.470122
e0360df2-cf9e-47d8-a54f-5ada2cbd287c	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694057809	13907521152	0.00	0.00	radacct	2026-04-08 00:51:49.47278
162f56b6-020c-44e6-ba6b-f3afe1def4c7	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408014673	10346947799	0.00	0.00	radacct	2026-04-08 00:51:49.475404
c0b33f3d-dfec-408f-8e51-04149ff272fe	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757538076	12832147934	0.00	0.00	radacct	2026-04-08 00:51:49.477827
6184d2ca-b7cc-45fd-b8c1-556250209bc3	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664425143	35262031930	0.02	0.27	radacct	2026-04-08 00:51:49.480235
e0d2159a-453c-4d7b-b375-8171c69abfdd	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1396243687	24977630008	0.12	1.38	radacct	2026-04-08 00:51:49.482568
24dbb52d-88b0-46bc-bc80-07e6e90c7410	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774114345	12077936632	0.00	0.00	radacct	2026-04-08 00:51:49.485665
8735d29d-7e4b-4139-ac14-0fc69259d0ad	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1837588886	41256924847	0.04	0.98	radacct	2026-04-08 00:51:49.488337
ce10114d-9610-42cf-8d2c-094028eb4c72	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	256086798	6311995602	0.12	2.41	radacct	2026-04-08 00:51:49.490733
a9e092fe-1b70-4b12-8a48-c9b1a18af40f	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2549501679	20543794081	0.06	2.47	radacct	2026-04-08 00:51:49.493059
dcb0cc41-22c1-4437-8b9a-e192b9b0cb76	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2398074064	19159356815	0.28	0.37	radacct	2026-04-08 00:51:49.495404
2ad531ac-f20b-44a3-aba6-f5ff7cf62821	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755715958	20539580058	0.01	0.01	radacct	2026-04-08 00:51:49.497862
22ce9701-cd44-49cb-a891-1e4b422c12f6	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	644728062	8160868138	0.06	0.54	radacct	2026-04-08 00:51:49.500295
0c9556cf-a85b-481e-8af3-eaa8aed90b53	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183655408	11067069619	0.00	0.00	radacct	2026-04-08 00:53:49.323541
ba13f1c0-2b96-4f98-9b7d-b1640f9835ce	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	49087700	1916528235	0.02	1.08	radacct	2026-04-08 00:53:49.333559
33466b7e-cfd8-4da7-a492-9b8bffe736d3	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	50106053	854339280	0.02	0.37	radacct	2026-04-08 00:53:49.336638
bdffc0a1-dc28-4203-9a41-21586fbe85a4	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853142245	16096807070	0.00	0.00	radacct	2026-04-08 00:53:49.339163
4d83e2ea-7634-4f9e-83af-06af0512237c	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584482962	8821699535	0.00	0.00	radacct	2026-04-08 00:53:49.341548
6ca936eb-1734-4e7f-afe0-0fd25abbd1ac	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66852470	1840693348	0.00	0.00	radacct	2026-04-08 00:53:49.343959
9e9c9a6e-9242-439f-801e-86acbeec20cd	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2439493371	20449781329	0.03	0.56	radacct	2026-04-08 00:53:49.346384
dbfcc2f0-cf0c-49f8-b82b-afe5b7305457	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619469198	10541715330	0.00	0.00	radacct	2026-04-08 00:53:49.349018
450c0f92-079d-466f-b2cc-8ed661e92395	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1545876128	13044526392	0.00	0.00	radacct	2026-04-08 00:53:49.351954
792e27b2-253e-4293-aac3-3094595e4633	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941232994	19946603716	0.00	0.00	radacct	2026-04-08 00:53:49.354501
6487e907-1e29-45a5-a8b9-07a7294b1a89	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502012390	4259675639	0.01	0.01	radacct	2026-04-08 00:53:49.35697
057525c4-42f1-4e1e-917c-d05794a1160d	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	6962353	168622300	0.09	5.00	radacct	2026-04-08 00:53:49.359564
acb531de-705b-424a-b1d3-cfc5cc966901	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	76295731	2535815312	0.15	5.11	radacct	2026-04-08 00:53:49.362147
bbe34979-1e36-424c-b114-3dcf11333536	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633175881	15039978444	0.00	0.00	radacct	2026-04-08 00:53:49.365273
38a77592-65b4-46f7-9eb9-a2829fca965e	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2816080208	12952261601	0.07	3.67	radacct	2026-04-08 00:53:49.368424
6da7449a-d67d-464a-9e44-e05ff16441fd	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1098122	7493827	0.00	0.00	radacct	2026-04-08 00:53:49.371318
ecd9f5a3-1d63-4682-bdc4-d5e4a5aa8c02	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719323456	5144955645	0.01	0.16	radacct	2026-04-08 00:53:49.373924
ee280284-e823-4cf7-b97f-7beee8ae656d	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3552199141	18103175498	0.92	0.89	radacct	2026-04-08 00:53:49.376238
74095692-80a6-4ec4-8f9f-314e0d567931	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431918708	16929058840	0.00	0.00	radacct	2026-04-08 00:53:49.378221
51756c96-47a4-4d79-afd4-814b3146849b	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867707083	14168596586	0.00	0.00	radacct	2026-04-08 00:53:49.38022
6e1aed77-c373-4024-8a94-f18338719d4c	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518665372	14197316843	0.00	0.02	radacct	2026-04-08 00:53:49.382301
46350486-a265-4ad4-ac4e-b104338dad23	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183319924	16006382615	0.00	0.00	radacct	2026-04-08 00:53:49.385672
c8f13398-15aa-4df6-a0d5-57c64135bea8	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694099247	13907530462	0.00	0.00	radacct	2026-04-08 00:53:49.388222
03073496-9f44-47b9-b608-7e856a212a16	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408014782	10346947908	0.00	0.00	radacct	2026-04-08 00:53:49.391054
1f273437-a1e6-4758-b443-cf2499c78d94	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757541018	12832149863	0.00	0.00	radacct	2026-04-08 00:53:49.393536
0f4e5ef2-9359-4423-93cc-e58b6178af7b	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664561471	35262140497	0.01	0.01	radacct	2026-04-08 00:53:49.396028
76a0c199-f399-4f60-8c88-cc419fd2e77b	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1398030290	24992169087	0.12	0.97	radacct	2026-04-08 00:53:49.398431
8d990071-a807-46ff-b6de-95d7195bf325	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774128399	12077958582	0.00	0.00	radacct	2026-04-08 00:53:49.401737
a170722b-a7c9-415a-a4f6-4eb6118ea430	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1838260640	41273053189	0.04	1.08	radacct	2026-04-08 00:53:49.404499
3cd6471c-ebc2-43e1-adaa-a860b33ec0e9	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	257368756	6354987955	0.09	2.87	radacct	2026-04-08 00:53:49.406934
874204f6-16ab-4502-ac3e-301dfe983a2b	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2550392325	20578968187	0.06	2.35	radacct	2026-04-08 00:53:49.409367
bf00233d-0e5f-4121-912a-fb738e8dee69	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2401396608	19177550189	0.22	1.21	radacct	2026-04-08 00:53:49.411745
0efb352c-7f4c-4afa-8f47-b89a51eb7c0d	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755875510	20539763586	0.01	0.01	radacct	2026-04-08 00:53:49.414347
c9f743eb-eb9a-4a80-b567-19cc91c33d17	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	645505739	8172492749	0.05	0.78	radacct	2026-04-08 00:53:49.417298
6a64e405-3ff9-4f53-b033-5718afed2ae8	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183655859	11067069949	0.00	0.00	radacct	2026-04-08 00:55:49.380331
dd046671-91c3-43d5-ae18-518b47a5968b	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	49250250	1924080118	0.01	0.50	radacct	2026-04-08 00:55:49.393651
159ea380-0c22-4c23-9c40-0cb0b3438749	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51423465	882689399	0.09	1.89	radacct	2026-04-08 00:55:49.396522
eddbda24-23bf-46f4-9ddb-54f9b4883c7b	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853202244	16096844194	0.00	0.00	radacct	2026-04-08 00:55:49.400406
ed7f0215-07b3-4d34-970b-f7f6c0bc44f0	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584483528	8821699897	0.00	0.00	radacct	2026-04-08 00:55:49.404701
281dd13c-3098-4a42-96f9-abf10ee5c48b	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66856717	1840698454	0.00	0.00	radacct	2026-04-08 00:55:49.408813
dfd94666-3116-419b-944e-39ae44a8b773	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2448814560	20460531412	0.62	0.72	radacct	2026-04-08 00:55:49.413343
946c1679-d8e7-4274-8c57-4115821a4398	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619470691	10541715650	0.00	0.00	radacct	2026-04-08 00:55:49.417699
7b912f5b-d4e8-4342-a102-9527613b1449	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1545957317	13044672348	0.01	0.01	radacct	2026-04-08 00:55:49.420586
8f64f371-5f74-4787-9327-64ee688276bc	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941263270	19946917145	0.00	0.02	radacct	2026-04-08 00:55:49.423535
c8b4688d-288e-4b25-bad8-ce696660631b	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502042876	4259750127	0.00	0.00	radacct	2026-04-08 00:55:49.426167
2c149fa0-a771-45f0-934e-3bc883ce21f7	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	7839226	203602707	0.06	2.33	radacct	2026-04-08 00:55:49.42867
9816f510-1109-4347-ab59-b15cc3072698	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	78580037	2612373445	0.15	5.10	radacct	2026-04-08 00:55:49.431313
e54f079f-3f57-4506-ab24-d93a97cc991b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633186259	15039999511	0.00	0.00	radacct	2026-04-08 00:55:49.434409
21e42abb-0dad-4001-8a60-ff807ded53be	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2816702044	12983886989	0.04	2.11	radacct	2026-04-08 00:55:49.437501
37b145d5-5d5e-4266-a131-ff7937a57961	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1216100	7569345	0.01	0.01	radacct	2026-04-08 00:55:49.440173
65b156b4-69f7-4b6b-9405-aa86bb67eeb4	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719325744	5144956396	0.00	0.00	radacct	2026-04-08 00:55:49.442875
e6f78a01-79c0-415e-84a3-6f9a205dfbe1	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3553525066	18115396842	0.09	0.81	radacct	2026-04-08 00:55:49.445717
52e0c4ce-1a2d-4d6d-8ded-ea8e83c82f9c	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2431970168	16929089278	0.00	0.00	radacct	2026-04-08 00:55:49.448464
c9ea5dc3-4007-49d9-a79a-deeed9fa09b1	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867717277	14168616447	0.00	0.00	radacct	2026-04-08 00:55:49.451625
40e05921-5f80-41a2-af2e-6debbae47662	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518683492	14197338005	0.00	0.00	radacct	2026-04-08 00:55:49.454171
be6006ca-fc6d-44d5-87cc-fc03f67f9412	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183406297	16006525060	0.01	0.01	radacct	2026-04-08 00:55:49.456699
f9cc5c88-7130-4b04-95db-9659fe8706c3	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694154693	13907542141	0.00	0.00	radacct	2026-04-08 00:55:49.459387
5d6acd3a-f599-4f29-b2d9-cbdcaa6f8a01	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408015190	10346948332	0.00	0.00	radacct	2026-04-08 00:55:49.461933
562678dd-bacc-400d-8f64-def50966ee16	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757542113	12832150521	0.00	0.00	radacct	2026-04-08 00:55:49.46461
eea5463d-10bf-4e4e-88ef-817a256ecb73	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664610728	35262304530	0.00	0.01	radacct	2026-04-08 00:55:49.467825
efe839b1-015f-481e-8cdb-40927d692784	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1399327911	25023919694	0.09	2.12	radacct	2026-04-08 00:55:49.471206
66d05cc0-0686-4e81-b9d9-b84d8e324889	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774131307	12077966001	0.00	0.00	radacct	2026-04-08 00:55:49.474085
896b4484-069b-464c-9577-24fdeeac5621	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1839832182	41273088471	0.10	0.00	radacct	2026-04-08 00:55:49.476891
a6ab9c55-6fc7-415a-a013-a2ab76a19555	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	258706613	6382673556	0.09	1.84	radacct	2026-04-08 00:55:49.47963
ad0e7023-827f-4ce8-aee4-6be881999206	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2551502373	20616420847	0.07	2.50	radacct	2026-04-08 00:55:49.482725
2676768b-4e52-4201-8895-b7562c52d7f8	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2403737306	19199129356	0.16	1.44	radacct	2026-04-08 00:55:49.485609
01b50041-f47d-46dd-ba31-29b6146c17d6	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755930370	20539834252	0.00	0.00	radacct	2026-04-08 00:55:49.48815
e99d94b4-c87e-4016-b050-7f5a21a00956	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	645735507	8173942830	0.02	0.10	radacct	2026-04-08 00:55:49.491896
24bf9b8b-ca9c-4111-804e-9375f188223c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183668306	11067087000	0.00	0.00	radacct	2026-04-08 00:57:49.385752
9a2cad5f-65fe-4036-9ddd-7f5d1cacfa50	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	49428961	1931798780	0.01	0.51	radacct	2026-04-08 00:57:49.394595
d2f1b30e-9bfe-449b-b6f9-e040dac969ab	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51813913	886689523	0.03	0.27	radacct	2026-04-08 00:57:49.397096
fe44c9f1-88c4-4003-aa43-31f96eb0a029	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853234224	16096895422	0.00	0.00	radacct	2026-04-08 00:57:49.400307
ab9aae62-c8e9-416a-b2d4-4dc66d7c9eb3	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584497994	8821707329	0.00	0.00	radacct	2026-04-08 00:57:49.402384
5e4411fb-2fac-47b4-94f6-4fc90a90c9ae	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	66870583	1840713977	0.00	0.00	radacct	2026-04-08 00:57:49.404525
34c76417-21b7-4ec5-9f95-7c817cd4ffb1	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2449136554	20462909836	0.02	0.16	radacct	2026-04-08 00:57:49.406543
b4a2b134-e9fe-416d-b909-8d4f49c03676	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619471897	10541716415	0.00	0.00	radacct	2026-04-08 00:57:49.408473
159cd7ad-7c57-4960-bb7c-f7a729ea82bb	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546044691	13044917578	0.01	0.02	radacct	2026-04-08 00:57:49.410369
51dde1bd-3ff6-4a68-a8ba-4f57d4fcd77e	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941310890	19946984816	0.00	0.00	radacct	2026-04-08 00:57:49.412431
bd12ac4e-050c-4465-b9c1-5f34b635e4d0	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502249003	4259942355	0.01	0.01	radacct	2026-04-08 00:57:49.416161
0fed02d3-5b0a-48a9-a598-62d0d854b59b	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	9365339	230570970	0.10	1.80	radacct	2026-04-08 00:57:49.419095
08fea330-429c-470f-b481-4af78bd94b39	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	80005119	2690669424	0.10	5.22	radacct	2026-04-08 00:57:49.421123
18cac12a-3719-4077-9b92-2a78c4e2e1be	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633204051	15040064304	0.00	0.00	radacct	2026-04-08 00:57:49.423086
492cdf04-8134-4270-a3ae-ba40e0fe45b1	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2817614396	13034681492	0.06	3.39	radacct	2026-04-08 00:57:49.425047
6a8ba7be-c38a-41e4-b0c0-2af3e54429ed	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1218951	7575464	0.00	0.00	radacct	2026-04-08 00:57:49.427015
5655f058-df18-47b0-b0c9-1102fa83a8c9	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719339191	5145003135	0.00	0.00	radacct	2026-04-08 00:57:49.429067
cf7f2be8-4bd2-40d4-b5ca-67f046b10c1e	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3558755437	18134343336	0.35	1.26	radacct	2026-04-08 00:57:49.431605
1ab8ef6c-3597-43bb-93a5-b0385d819dca	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432028910	16929135511	0.00	0.00	radacct	2026-04-08 00:57:49.434498
646245bf-2cf4-4c4e-9a10-69ccebccdd50	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867718753	14168617111	0.00	0.00	radacct	2026-04-08 00:57:49.436935
e8eceb8f-78dd-413f-a257-cfe84c97297f	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518839118	14197465789	0.01	0.01	radacct	2026-04-08 00:57:49.438835
89e93c9d-a299-479d-951d-4503e19ac40e	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183435111	16006580677	0.00	0.00	radacct	2026-04-08 00:57:49.440801
bbf6c554-fdaa-4a87-aba8-8bce7bc80d83	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694214865	13907573236	0.00	0.00	radacct	2026-04-08 00:57:49.442642
fa64d37c-24e0-45e7-9bb0-0d072e52743a	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408015670	10346948884	0.00	0.00	radacct	2026-04-08 00:57:49.444635
f0cfde8e-a91c-432c-b8b8-743386e4c380	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757548608	12832156509	0.00	0.00	radacct	2026-04-08 00:57:49.446499
4215c287-2b2e-4ec3-bc3d-3e3e5d9add55	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664657409	35262369345	0.00	0.00	radacct	2026-04-08 00:57:49.449342
c9215aae-3d2e-4844-af93-890b3c7e4591	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1400195030	25054428152	0.06	2.03	radacct	2026-04-08 00:57:49.451658
a9c4abac-08d2-4aeb-a460-51f0c3532032	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774144990	12077969000	0.00	0.00	radacct	2026-04-08 00:57:49.453518
7ce30769-5e2e-4dca-94b6-12c4ab48c9d5	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1840108070	41274847730	0.02	0.12	radacct	2026-04-08 00:57:49.455336
98939578-a877-4073-a8dc-536f5b4d7cc2	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	260004696	6421352205	0.09	2.58	radacct	2026-04-08 00:57:49.457199
d0e9d52f-6b2c-4c7e-9e5c-9ae035c9539e	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2552409311	20657560579	0.06	2.74	radacct	2026-04-08 00:57:49.459112
5bf2ff77-ba30-4574-8447-c75fdacbdbfa	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2406888846	19244370377	0.21	3.02	radacct	2026-04-08 00:57:49.460971
b1bdd762-6026-45a7-979b-e8007823af55	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2755983202	20539950683	0.00	0.01	radacct	2026-04-08 00:57:49.462818
73850062-cd29-46db-804c-b01345b41dff	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	646597043	8179578500	0.06	0.38	radacct	2026-04-08 00:57:49.465816
fc5676dd-7a3c-4fc9-beac-860ea05f5f6e	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183668736	11067087579	0.00	0.00	radacct	2026-04-08 00:59:49.386878
e5fe40f7-0b63-451e-bbbc-557eeccc5abc	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	49764384	1947601568	0.02	1.05	radacct	2026-04-08 00:59:49.395997
a07ed307-c7aa-4625-8a01-b53865665011	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51827497	886753795	0.00	0.00	radacct	2026-04-08 00:59:49.399245
3f1fbe25-ca5d-4142-bb05-1c868548bf97	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853365926	16097194779	0.01	0.02	radacct	2026-04-08 00:59:49.401423
1b0c7ba7-6179-464f-906c-68324827002b	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584498363	8821707721	0.00	0.00	radacct	2026-04-08 00:59:49.403533
d22c131a-60eb-4596-800d-50bff996b3e9	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67232916	1841035097	0.02	0.02	radacct	2026-04-08 00:59:49.405596
d5b03901-105f-4765-bd18-9ae512def4a5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2449698736	20470713146	0.04	0.52	radacct	2026-04-08 00:59:49.407961
18a565f8-bd15-4f15-92d2-66d789c3ec40	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619473069	10541716523	0.00	0.00	radacct	2026-04-08 00:59:49.409967
25b07f69-b12c-4683-8661-bffe00483904	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546117035	13045929747	0.00	0.07	radacct	2026-04-08 00:59:49.412732
9ae1026e-0e0c-446d-820a-86449984494d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941319266	19947008836	0.00	0.00	radacct	2026-04-08 00:59:49.416476
a4857749-d405-4fef-956f-c1b7d6295f36	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502257963	4259997438	0.00	0.00	radacct	2026-04-08 00:59:49.418584
e8790522-3f7f-4a97-9c09-4c675906e217	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	9483097	230603046	0.01	0.00	radacct	2026-04-08 00:59:49.420544
721cf515-8678-4c02-abe9-5e1245748c78	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	81182698	2768185120	0.08	5.17	radacct	2026-04-08 00:59:49.422681
f052c9d8-e09a-4325-9cf1-93ce3ecae335	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633241468	15040103478	0.00	0.00	radacct	2026-04-08 00:59:49.424673
b27b9579-8494-4e69-9eb1-618652ba0046	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2820552371	13096893505	0.20	4.15	radacct	2026-04-08 00:59:49.42662
52cb9a0b-6cf6-49cc-ae09-a40e6a5ad225	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1244543	7651111	0.00	0.01	radacct	2026-04-08 00:59:49.428882
65253c28-e45c-4e3f-a127-904d452302f9	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719347873	5145013237	0.00	0.00	radacct	2026-04-08 00:59:49.432151
eb462318-1f62-4c60-aeb2-47aedd7ac81c	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3559606568	18146967392	0.06	0.84	radacct	2026-04-08 00:59:49.434187
01573044-2561-4879-a2c7-4321daf6b2fa	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432075799	16929167222	0.00	0.00	radacct	2026-04-08 00:59:49.43615
fd6abe6e-49bf-43f3-bf97-039752f52cfe	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867719759	14168617996	0.00	0.00	radacct	2026-04-08 00:59:49.438172
fb6370be-a1f5-4228-b348-1295e0025389	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518950201	14197955401	0.01	0.03	radacct	2026-04-08 00:59:49.440144
f891acc8-672e-42e2-b444-4574d42c7b35	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183488365	16006701899	0.00	0.01	radacct	2026-04-08 00:59:49.442251
07eaeac5-522c-444f-ac54-754473e6befc	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694257189	13907584876	0.00	0.00	radacct	2026-04-08 00:59:49.444346
93f423a4-cc01-4790-94c3-7de5ac1eeb34	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408015779	10346948993	0.00	0.00	radacct	2026-04-08 00:59:49.4464
71a5e021-a9db-46c1-bc61-97bbded5e159	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	757666944	12832272182	0.01	0.01	radacct	2026-04-08 00:59:49.449429
bf9a9fbb-fd6d-4891-b820-3f3399bf0134	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1664761318	35262502187	0.01	0.01	radacct	2026-04-08 00:59:49.451528
546a09c6-4fc2-4ec4-9615-1eb41530679e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1400957513	25076096714	0.05	1.44	radacct	2026-04-08 00:59:49.453538
8f1101d5-1e75-45f6-aebe-40ab0b63a699	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774146348	12077969882	0.00	0.00	radacct	2026-04-08 00:59:49.455507
5826aa07-fc9f-4ac5-bc5d-9a070d405715	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1840285477	41275173996	0.01	0.02	radacct	2026-04-08 00:59:49.457559
57a37f5d-9e0a-406b-a2e8-591031238013	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	261883869	6470033377	0.13	3.25	radacct	2026-04-08 00:59:49.459524
e76372f0-2c64-437b-a94a-0bbf12131ce9	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2553349838	20691789459	0.06	2.28	radacct	2026-04-08 00:59:49.461564
f24c875d-1cc1-45cb-97f1-cacc376cc097	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2410443523	19349190788	0.24	6.99	radacct	2026-04-08 00:59:49.464138
333ba828-dffa-4692-bde6-f55c7a55f484	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756000185	20539983351	0.00	0.00	radacct	2026-04-08 00:59:49.46724
63cee907-96ab-4169-b745-e0af5f4df7f4	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	647132037	8187033510	0.04	0.50	radacct	2026-04-08 00:59:49.4692
8a4d355e-1849-4acb-829b-42fcf122a52f	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183682504	11067102885	0.00	0.00	radacct	2026-04-08 01:01:49.502137
f6795a7d-9b74-4c5f-ab84-fdf3dcc29a47	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	49895281	1953318632	0.01	0.38	radacct	2026-04-08 01:01:49.512552
774dbe2b-4687-4a9c-8c9e-72b8367f4cc9	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51829053	886755528	0.00	0.00	radacct	2026-04-08 01:01:49.515517
e35b2018-2d92-4882-a9e9-2130af1e534f	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853921292	16105222357	0.04	0.53	radacct	2026-04-08 01:01:49.518019
aadc22b0-3cc9-4bd0-a7d5-6d3be33817c3	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584498920	8821708473	0.00	0.00	radacct	2026-04-08 01:01:49.520593
d8c45dd4-ada6-48ae-b732-f48f41c71266	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67267022	1841065393	0.00	0.00	radacct	2026-04-08 01:01:49.523083
6d2f8be2-ffd9-414a-835e-60f7898f8954	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2450400159	20485486743	0.05	0.98	radacct	2026-04-08 01:01:49.525654
c4c6360d-f601-4594-b380-4d918073d00c	0ce4ec60-8454-459f-8ada-b540758b3877	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	619474133	10541716523	0.00	0.00	radacct	2026-04-08 01:01:49.527871
d16a0f86-5fb8-4c2e-a8a5-7abcd4958937	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546179943	13046024452	0.00	0.01	radacct	2026-04-08 01:01:49.531242
9c359ba2-3d23-4a18-90e4-60ffc5e841ae	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941352390	19947065197	0.00	0.00	radacct	2026-04-08 01:01:49.533719
66e8d81e-14b4-42c4-a20d-0c58541a8244	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502471213	4264679453	0.01	0.31	radacct	2026-04-08 01:01:49.536136
6981ee2d-ebed-431d-b0f7-03d2da3479d0	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	9708821	231143432	0.02	0.04	radacct	2026-04-08 01:01:49.538516
8a9129fb-5cba-454a-9a0b-8afc01d792be	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	82298417	2844388142	0.07	5.08	radacct	2026-04-08 01:01:49.541055
99af44c9-2440-4345-8cfa-ee314e990e9c	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633255868	15040320475	0.00	0.01	radacct	2026-04-08 01:01:49.543539
67cad95f-2ae1-4b7f-a1e0-28c158189024	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2821334523	13123883223	0.05	1.80	radacct	2026-04-08 01:01:49.546704
1826a07d-59a4-4982-a85e-8d894a9d4af7	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	1283573	7693990	0.00	0.00	radacct	2026-04-08 01:01:49.549353
b50e5945-48c0-46ea-a6c7-91488da34915	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719349527	5145015019	0.00	0.00	radacct	2026-04-08 01:01:49.551903
12e468bd-5555-45ee-9c61-801ce02387fb	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3560921842	18159308840	0.09	0.82	radacct	2026-04-08 01:01:49.554498
addf7df9-74e0-4d44-a413-354411271260	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432142676	16929403361	0.00	0.02	radacct	2026-04-08 01:01:49.556608
07a40f2b-9332-44f7-b166-aeadf547f713	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867829398	14168705934	0.01	0.01	radacct	2026-04-08 01:01:49.558568
19dce0f5-cc46-48e6-83b8-4498ba721b69	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518965198	14197965446	0.00	0.00	radacct	2026-04-08 01:01:49.560592
fcf7ed96-afae-4e37-a24f-d1ee6f228646	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183496581	16006721573	0.00	0.00	radacct	2026-04-08 01:01:49.563237
f2a5ca23-6080-4e73-a4c8-66a226b642c1	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694307677	13907595341	0.00	0.00	radacct	2026-04-08 01:01:49.565897
74f336d2-ac6f-40bc-a1fd-bae353280886	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408015779	10346948993	0.00	0.00	radacct	2026-04-08 01:01:49.568471
dab58986-f831-4d47-8366-615407a2d1a5	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758924783	12832411439	0.08	0.01	radacct	2026-04-08 01:01:49.570255
78e58256-8fbd-4568-adb5-b59fe027f29f	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665158148	35262896934	0.03	0.03	radacct	2026-04-08 01:01:49.572572
bad8018c-b5bd-4be2-9ad1-e03bdd352e34	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1401964059	25102966998	0.07	1.79	radacct	2026-04-08 01:01:49.574807
00c8edfa-4cb4-47cc-9a0a-3cd26a90cf9c	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774175923	12078057873	0.00	0.01	radacct	2026-04-08 01:01:49.577086
031ad3b1-b32e-48e6-9f01-9fc8942d6fbd	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1840446959	41275965152	0.01	0.05	radacct	2026-04-08 01:01:49.579978
280e017b-8af9-4b8c-aa2e-3207ad750017	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	264069318	6512512878	0.15	2.83	radacct	2026-04-08 01:01:49.58267
50eff40d-6ceb-4629-8818-a5e5cf253fc6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2554439496	20733186062	0.07	2.76	radacct	2026-04-08 01:01:49.585173
c368be08-20d9-4313-b026-93148e5377dd	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2413560407	19372045407	0.21	1.52	radacct	2026-04-08 01:01:49.587544
8512386c-52ac-45df-bd84-a5d4611247bf	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756111091	20540227291	0.01	0.02	radacct	2026-04-08 01:01:49.589859
b6a2f31b-0ae2-4434-9056-26ae92047950	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	647449485	8192863889	0.02	0.39	radacct	2026-04-08 01:01:49.592191
a077303c-2a54-43ee-a33d-0bb74885c444	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183682877	11067103078	0.00	0.00	radacct	2026-04-08 01:03:49.392166
0c900cc3-b4a9-4fa6-b808-d302c114a44d	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	50032401	1964735230	0.01	0.76	radacct	2026-04-08 01:03:49.402923
a7da6075-9b82-4cd2-a514-8a2478ddb61b	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51886307	886803949	0.00	0.00	radacct	2026-04-08 01:03:49.405049
b0a04f2b-2062-401d-974b-499028b61522	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853935524	16105233500	0.00	0.00	radacct	2026-04-08 01:03:49.407796
bbfd4857-a5b1-42fd-8cdc-29a714c42926	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584499176	8821708793	0.00	0.00	radacct	2026-04-08 01:03:49.410325
2494030f-09be-426d-a9ba-a38b3bb8f5c4	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67279319	1841085390	0.00	0.00	radacct	2026-04-08 01:03:49.413819
c28e4e0a-b4a4-40b2-b30b-e1c861892724	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2451502113	20501117858	0.07	1.04	radacct	2026-04-08 01:03:49.416547
6bde5df2-bfd1-4781-bc99-bae6867a6985	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546208495	13046054336	0.00	0.00	radacct	2026-04-08 01:03:49.418978
b6ae5bdf-abf8-401f-b971-2efff23350ea	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941395642	19947155216	0.00	0.01	radacct	2026-04-08 01:03:49.421732
4e180e7b-096d-43dd-9ac1-ea487b5eba2d	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502545073	4264861559	0.00	0.01	radacct	2026-04-08 01:03:49.424254
1b3b5ef3-5f73-4e33-9652-e59b2f8c70c7	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	135351	731386	0.00	0.00	radacct	2026-04-08 01:03:49.426933
cc63e69b-8805-42a0-90f0-a44b3fe74959	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	83503341	2921841807	0.08	5.17	radacct	2026-04-08 01:03:49.42915
cc397a4b-6d60-42b6-ae40-07336db4056b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633321007	15040376991	0.00	0.00	radacct	2026-04-08 01:03:49.431919
ecb81fc2-06fc-4a20-95e4-9b2dceeb6abd	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2824339830	13188805148	0.20	4.33	radacct	2026-04-08 01:03:49.434319
76318e25-cef4-4b20-8150-26e5d43fb0c2	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	22583	10616	0.00	0.00	radacct	2026-04-08 01:03:49.436899
4aa6b3f6-2a5e-45aa-86bc-b13b0debfc62	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719353665	5145017850	0.00	0.00	radacct	2026-04-08 01:03:49.438807
e0ad3d4a-aea6-48c0-a965-8b8d5b21f8b9	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3563193487	18174029208	0.15	0.98	radacct	2026-04-08 01:03:49.44114
214aa4fa-f4b0-4eae-82e1-872fa5f85d11	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432197376	16929470058	0.00	0.00	radacct	2026-04-08 01:03:49.443617
52491b33-f613-4add-8e25-0eebb6979f0e	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867945156	14168838692	0.01	0.01	radacct	2026-04-08 01:03:49.446514
b536bef5-4345-4279-9173-70bc93d87387	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2518976847	14197975360	0.00	0.00	radacct	2026-04-08 01:03:49.449042
525e4d43-cc57-40d2-9a8a-063a3faa69f1	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183532578	16006792251	0.00	0.00	radacct	2026-04-08 01:03:49.450971
ccc9c1cf-5e68-46e4-8efa-8f3ef80cc3ef	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694372807	13907626090	0.00	0.00	radacct	2026-04-08 01:03:49.452876
9de1e69a-a63e-42ee-baa3-e3bb15b532a9	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408017242	10346949482	0.00	0.00	radacct	2026-04-08 01:03:49.454729
afd7c8bf-90cf-47af-9097-e7bb06420884	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758958426	12832443709	0.00	0.00	radacct	2026-04-08 01:03:49.456801
63953448-3969-498a-9750-cf79ea745daf	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665263045	35263527146	0.01	0.04	radacct	2026-04-08 01:03:49.458718
06c82bdf-b20c-48ff-a32d-e2f2a8281212	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1402460010	25126547234	0.03	1.57	radacct	2026-04-08 01:03:49.460809
4ae479aa-83e8-498b-8de2-157197e0c4e2	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774200048	12078096811	0.00	0.00	radacct	2026-04-08 01:03:49.463727
8c94392e-844d-4b2d-8051-18f01d0da83f	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1840824232	41277831871	0.03	0.12	radacct	2026-04-08 01:03:49.466489
81d09682-e7fa-4fe9-8a8d-e72335c9eac0	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	265632865	6548122432	0.10	2.38	radacct	2026-04-08 01:03:49.469329
66478a6e-cb46-4ba0-8f31-2aae8f16a82d	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2555550719	20772071977	0.07	2.59	radacct	2026-04-08 01:03:49.471306
10658d8a-0d34-4c2d-b791-8d6b92158b21	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2415769151	19397847721	0.15	1.72	radacct	2026-04-08 01:03:49.473251
b579ade8-33b3-4be3-83ab-df1b17466c1b	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756136248	20540269379	0.00	0.00	radacct	2026-04-08 01:03:49.475238
3d93c6f5-5509-4c13-89fe-052171a14c82	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	647969872	8199536588	0.03	0.45	radacct	2026-04-08 01:03:49.478084
c9901a9b-5210-4e8a-9a02-8134cbbea9ee	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183683199	11067103356	0.00	0.00	radacct	2026-04-08 01:05:49.424276
9faa4436-8930-4437-b80a-83e853fadb54	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	50180925	1975163216	0.01	0.70	radacct	2026-04-08 01:05:49.434574
c4b924ae-cc5a-4721-a9d9-35ceed8b6e62	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	51894061	886808446	0.00	0.00	radacct	2026-04-08 01:05:49.436742
369eaed1-26ff-4cd2-b730-b9132d293bdc	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853958142	16105279236	0.00	0.00	radacct	2026-04-08 01:05:49.438793
ed8037bd-9d39-4915-bbd1-ed37a6cbd793	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584513843	8821724687	0.00	0.00	radacct	2026-04-08 01:05:49.44087
58054f11-b22f-4859-9ecd-6fe96e496388	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67301152	1841108426	0.00	0.00	radacct	2026-04-08 01:05:49.44366
7025746c-05ba-436d-b18e-2889d6cf00c5	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2452180470	20508972128	0.05	0.52	radacct	2026-04-08 01:05:49.446824
e4638a8a-4318-47be-aa02-15d87bd879b1	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546449470	13046494723	0.02	0.03	radacct	2026-04-08 01:05:49.44881
638543fb-afe8-42e3-b0be-13dc095a7394	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941407304	19947163135	0.00	0.00	radacct	2026-04-08 01:05:49.450788
f98eff53-c7f1-4ef3-8e40-9f6c29654697	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502612614	4264963868	0.00	0.01	radacct	2026-04-08 01:05:49.452743
d8163442-7429-4628-acc5-f1c2186c994b	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	191072	779731	0.00	0.00	radacct	2026-04-08 01:05:49.454694
ad17c1c1-14b6-4e6d-9982-06d087c3ebbb	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	85433752	2995343543	0.13	4.90	radacct	2026-04-08 01:05:49.456626
9143a4f0-74f0-4e5f-b8ec-ed9fa415f05a	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633329891	15040396723	0.00	0.00	radacct	2026-04-08 01:05:49.458698
e5d67ad2-d5f9-43f4-8a0e-2d1b9a2c56de	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2825197204	13215286260	0.06	1.76	radacct	2026-04-08 01:05:49.461808
16848149-73ea-4786-a417-2aa6c536b904	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	53311	36733	0.00	0.00	radacct	2026-04-08 01:05:49.464069
6306ef9f-85ee-4e62-8f0c-f7c90706415f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719361236	5145024898	0.00	0.00	radacct	2026-04-08 01:05:49.466099
d68361b0-dea3-472e-a585-f5d5ce23b8e9	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3578272959	18182558343	1.01	0.57	radacct	2026-04-08 01:05:49.46806
f61dad08-c21d-4b72-a41c-dbd48962db36	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432253806	16929659220	0.00	0.01	radacct	2026-04-08 01:05:49.470093
b3e8f4fe-93cc-4767-98e3-959a1ade67de	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867962579	14168864244	0.00	0.00	radacct	2026-04-08 01:05:49.472138
d4f701d8-3ffa-4213-acc0-3e8758a12960	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519041131	14198041654	0.00	0.00	radacct	2026-04-08 01:05:49.474447
619050f6-1c61-41e6-b3b6-bf7a6d4436b2	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183564182	16006865683	0.00	0.00	radacct	2026-04-08 01:05:49.477526
c1f3d5e1-da6b-4b12-ade4-59fa6d06ec55	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694440922	13907663340	0.00	0.00	radacct	2026-04-08 01:05:49.480273
f01a4410-6bf2-4601-b474-9f00a910b8cf	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408017242	10346949482	0.00	0.00	radacct	2026-04-08 01:05:49.482342
3d7eca81-6b04-48a3-aaaa-a95216a8aba2	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758960302	12832444325	0.00	0.00	radacct	2026-04-08 01:05:49.483849
03123f0a-0511-4dee-9a3f-7f507a405c29	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665359646	35263659273	0.01	0.01	radacct	2026-04-08 01:05:49.485885
b62d09e4-e70e-452e-9847-562bc1bdb3a3	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1403314801	25152192848	0.06	1.71	radacct	2026-04-08 01:05:49.487929
104a7fdd-f392-4942-93ba-4424be33f2c2	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774201155	12078097670	0.00	0.00	radacct	2026-04-08 01:05:49.490122
3401d762-cd11-4455-8809-94e28f13c0fe	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1840925792	41277906865	0.01	0.00	radacct	2026-04-08 01:05:49.492825
63325a88-accb-4ed6-9eed-f9c79a2368d5	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	267885746	6593915143	0.15	3.05	radacct	2026-04-08 01:05:49.495781
ef3e681c-b008-40f5-b59c-cdb79d9b1fc6	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2556134950	20800275104	0.04	1.88	radacct	2026-04-08 01:05:49.497789
059bf30b-d909-4724-bb54-6d1132a52676	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2418276516	19409648561	0.17	0.79	radacct	2026-04-08 01:05:49.500054
6da20f22-3c05-4002-9941-9efede9c3b56	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756206529	20540348649	0.00	0.01	radacct	2026-04-08 01:05:49.50197
a5894211-7992-4e05-a093-5a16e15206ff	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	648702960	8207467869	0.05	0.53	radacct	2026-04-08 01:05:49.504064
5f065119-2d25-4629-a498-9cc5cc23cbd9	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183830582	11068090921	0.01	0.07	radacct	2026-04-08 01:07:49.404745
bf2f6b10-3c07-4ddd-bfec-49a814095c11	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	50418572	1988069964	0.02	0.86	radacct	2026-04-08 01:07:49.415813
b9bc445e-d224-4213-ac80-98bffb2d747c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	169	113	0.00	0.00	radacct	2026-04-08 01:07:49.417899
ad687cea-c63f-4594-854f-3e518d4bb87b	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2853990567	16105312886	0.00	0.00	radacct	2026-04-08 01:07:49.419577
7abe44b5-9222-4e32-980e-6256bec25a3e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584527342	8821749515	0.00	0.00	radacct	2026-04-08 01:07:49.4217
e24e9005-0212-47c0-b6d9-07c056dd6482	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67303882	1841111158	0.00	0.00	radacct	2026-04-08 01:07:49.423829
4ef77d27-d02f-4159-b700-1bea54df3e3c	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2452468651	20517116892	0.02	0.54	radacct	2026-04-08 01:07:49.426952
c278dca5-765c-4128-affc-d8f70cae4c74	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546628116	13047012988	0.01	0.03	radacct	2026-04-08 01:07:49.429487
21d5efb7-8faf-4438-884d-19bbe47d1285	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941420836	19947180766	0.00	0.00	radacct	2026-04-08 01:07:49.431942
334a1b47-7aad-443f-8295-dd0e3e286de5	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502640226	4265019878	0.00	0.00	radacct	2026-04-08 01:07:49.434344
9928f955-0fde-4810-ab01-2ad72df17c65	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	238593	1041791	0.00	0.02	radacct	2026-04-08 01:07:49.436939
bb2f1ab9-2f09-4eab-90ed-a0c972db5fb0	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	87561539	3080433353	0.14	5.67	radacct	2026-04-08 01:07:49.439368
99fd3657-8491-40e8-bfca-23ce3907147b	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633337266	15040408755	0.00	0.00	radacct	2026-04-08 01:07:49.442157
85303c08-230c-44d8-b432-a9c5622eaaa7	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2826667967	13264496632	0.10	3.28	radacct	2026-04-08 01:07:49.445531
9a10ce68-23a2-4e3c-8d4f-9feca5a4a4e2	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	85031	89933	0.00	0.00	radacct	2026-04-08 01:07:49.447913
ac343d12-c62b-4602-b3ec-c296d1c74069	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719362713	5145025829	0.00	0.00	radacct	2026-04-08 01:07:49.450182
08a58621-7d07-4b2c-9d34-d24457e5de01	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3637621356	18200895679	3.96	1.22	radacct	2026-04-08 01:07:49.452489
99ea354f-7ca8-45f5-806f-ef771fe36b23	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432359945	16929765651	0.01	0.01	radacct	2026-04-08 01:07:49.454837
ffd8a9d1-42a9-4360-b691-e91580a5b189	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	867992084	14168896338	0.00	0.00	radacct	2026-04-08 01:07:49.457109
b3dbc587-31b3-481e-a375-41d55fc37677	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519075318	14198064025	0.00	0.00	radacct	2026-04-08 01:07:49.460106
eea6e92b-d1a7-4aae-8d3c-cb8e1305df4a	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183592397	16006915941	0.00	0.00	radacct	2026-04-08 01:07:49.462743
33f855f7-f3e7-4ee0-bda0-dda1c2b53d96	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694490773	13907749534	0.00	0.01	radacct	2026-04-08 01:07:49.46502
6e53c407-9906-42f1-997f-498dfcf1da9e	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408017592	10346949828	0.00	0.00	radacct	2026-04-08 01:07:49.467301
2ba1e1ed-72a6-43f9-9ef0-82088cfc528b	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758962503	12832446061	0.00	0.00	radacct	2026-04-08 01:07:49.469669
89c727b8-8709-4543-87c3-63dac4099a08	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665774704	35267028259	0.03	0.22	radacct	2026-04-08 01:07:49.471994
e485073c-2dc3-4bbf-80c9-c63ea3301f1e	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1404551229	25172844657	0.08	1.38	radacct	2026-04-08 01:07:49.474295
e556e3ca-01a3-4aa2-9040-acf7632cec0b	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774210625	12078105787	0.00	0.00	radacct	2026-04-08 01:07:49.477664
4959e38d-07f9-46a0-8283-c2d2c5a1e9f2	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1841149883	41278495711	0.01	0.04	radacct	2026-04-08 01:07:49.480116
6e7b763b-1cb8-43b7-a045-ce72325e790b	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	269608099	6621102673	0.11	1.81	radacct	2026-04-08 01:07:49.482049
c9725193-1544-4181-b2d5-db93dfdd1b10	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2556778577	20824211802	0.04	1.60	radacct	2026-04-08 01:07:49.483901
39760ee1-3048-4840-8eb2-ef0128e79a0f	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2420513077	19421844347	0.15	0.81	radacct	2026-04-08 01:07:49.48581
18ea30db-a73b-42f5-958c-4e04e2f5c8a2	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756233629	20540374776	0.00	0.00	radacct	2026-04-08 01:07:49.487746
645590dc-9a7f-4cb3-a83e-b6d1d0731b88	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183832985	11068093280	0.00	0.00	radacct	2026-04-08 01:09:49.444104
207b8c0c-8044-403f-b52f-b425e941fcca	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	50595284	2000628921	0.01	0.84	radacct	2026-04-08 01:09:49.454124
f440695b-0699-4b3f-96bf-689f6f446b6c	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	3998	1572	0.00	0.00	radacct	2026-04-08 01:09:49.45658
1194fbee-be75-4f43-9869-3e7ae9d28454	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2854089136	16105466698	0.01	0.01	radacct	2026-04-08 01:09:49.459819
9e5f968a-d838-462d-9926-7b53d383ca09	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584528102	8821750238	0.00	0.00	radacct	2026-04-08 01:09:49.462392
2722182e-9dde-4b02-b3b6-a8e671a20d3c	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67312417	1841120861	0.00	0.00	radacct	2026-04-08 01:09:49.465155
07e5e8d0-473b-4698-9a61-87ea97033c70	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2452763515	20524635280	0.02	0.50	radacct	2026-04-08 01:09:49.467301
9013dc3a-5713-4587-920d-e6d309f3f57a	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546630823	13047015744	0.00	0.00	radacct	2026-04-08 01:09:49.469971
fb5a7169-e0e5-42f7-8f0b-0372f98d79c3	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941440714	19947214166	0.00	0.00	radacct	2026-04-08 01:09:49.47241
dff9c0b2-801a-454a-87b4-3356f648fe7e	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	502744228	4265175092	0.01	0.01	radacct	2026-04-08 01:09:49.475286
0f72244a-3d37-421b-bbeb-4823ba6cfb1e	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	259883	1054576	0.00	0.00	radacct	2026-04-08 01:09:49.477999
bd165c09-85d9-49ea-81ec-37995a5a02dc	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	89815826	3165351628	0.15	5.66	radacct	2026-04-08 01:09:49.480417
5fd77f89-fc7a-4bea-bf63-a26d485988f9	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633362509	15040445268	0.00	0.00	radacct	2026-04-08 01:09:49.482868
dc7b579c-6c11-4c5f-add1-c0fa529e327e	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2828079864	13316190461	0.09	3.45	radacct	2026-04-08 01:09:49.485394
17c6035e-fdaa-4ece-8fb2-61d3d08f0e73	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	117646	131201	0.00	0.00	radacct	2026-04-08 01:09:49.4874
39e6fafd-9365-4227-99c1-ac8484f90256	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719364039	5145026671	0.00	0.00	radacct	2026-04-08 01:09:49.489791
caa38b6d-4d68-4b83-9ec9-25789ac06626	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	3701889779	18212651942	4.28	0.78	radacct	2026-04-08 01:09:49.492846
e91cfcc2-eeca-472c-9d75-9dd86ac952c8	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432414070	16929978918	0.00	0.01	radacct	2026-04-08 01:09:49.495191
597133e6-b07e-4dd0-ae59-d28dfb18e985	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	868050723	14168986561	0.00	0.01	radacct	2026-04-08 01:09:49.497522
21d932f4-7ac5-4ad5-baf7-5e316c59405b	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519096274	14198077008	0.00	0.00	radacct	2026-04-08 01:09:49.499829
e1fc1894-d9f5-4102-a261-8dea378a37ee	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183669654	16008058763	0.01	0.08	radacct	2026-04-08 01:09:49.502045
3699c1df-04f7-474f-9460-92bf469b5361	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	694543881	13907765287	0.00	0.00	radacct	2026-04-08 01:09:49.504456
3127690c-f2d1-49ab-a5b6-0e93a6312039	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408029910	10346964258	0.00	0.00	radacct	2026-04-08 01:09:49.506883
58286761-30c1-4daf-8521-212deb3265b0	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758978292	12832493121	0.00	0.00	radacct	2026-04-08 01:09:49.509951
6797f2a8-963f-43d8-b1b6-53a1144a15fe	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665833924	35267560869	0.00	0.04	radacct	2026-04-08 01:09:49.512395
54d78c2a-dffe-45e8-a17b-1fb6d59289b8	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1405662788	25189135394	0.07	1.09	radacct	2026-04-08 01:09:49.514976
3dc6640d-7210-4cb5-9065-abace039b2f1	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774214061	12078111505	0.00	0.00	radacct	2026-04-08 01:09:49.517463
8548073b-02eb-43d2-b5b4-96ad2f440d63	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1841942291	41281807348	0.05	0.22	radacct	2026-04-08 01:09:49.519929
f7782ad6-f11e-4e0e-b941-a4db4e02d420	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	271276931	6649403493	0.11	1.89	radacct	2026-04-08 01:09:49.522402
7b0918da-56fa-48a5-a799-d33f843955ae	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2557881536	20851804613	0.07	1.84	radacct	2026-04-08 01:09:49.525541
d5713d97-0321-41aa-a5fc-b1f75229d8ec	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2421836531	19434056236	0.09	0.81	radacct	2026-04-08 01:09:49.528076
2bbc83da-fc87-40fc-889a-34a1766ca33c	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756246420	20540381332	0.00	0.00	radacct	2026-04-08 01:09:49.530447
f6db628b-2b50-47a7-8515-6772eb6e31cb	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183855910	11068126181	0.00	0.00	radacct	2026-04-08 01:11:49.433067
a2e1fbfa-bfd1-4642-8389-a6a2bf272d16	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	50932787	2011238548	0.02	0.71	radacct	2026-04-08 01:11:49.44386
b9f4e537-67ec-410b-a365-88437d913d23	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	18174	66838	0.00	0.00	radacct	2026-04-08 01:11:49.445927
43ac84ff-47ec-40d1-8af8-6fcc2e5dac96	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2854273976	16105652261	0.01	0.01	radacct	2026-04-08 01:11:49.447939
4d3e9d59-40fb-41f7-98c8-2139d655d14e	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584544057	8821986874	0.00	0.02	radacct	2026-04-08 01:11:49.449921
f7f2627c-0ae1-4568-bcbf-30d01b4b7ecf	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67323947	1841126806	0.00	0.00	radacct	2026-04-08 01:11:49.451933
a7a24118-7e27-4ad6-8dbd-fed846090403	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2453123616	20532429309	0.02	0.52	radacct	2026-04-08 01:11:49.454176
0f7cb7ad-d062-4b06-b3fc-708278feca49	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546675253	13047422961	0.00	0.03	radacct	2026-04-08 01:11:49.456545
6acb9818-dc8d-465b-9ffa-a6bce30c3b4d	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941443136	19947215587	0.00	0.00	radacct	2026-04-08 01:11:49.459509
184f4ca7-1e81-4b18-a627-5d4eca14353e	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	503099284	4265428721	0.02	0.02	radacct	2026-04-08 01:11:49.461527
27dd73cf-92b1-45ad-8ba1-0b25442b2d13	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	339324	1371096	0.01	0.02	radacct	2026-04-08 01:11:49.463481
f6a1e1dc-07cc-4f55-b2d5-788230bede8b	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	91888596	3243633038	0.14	5.22	radacct	2026-04-08 01:11:49.4654
a1870e40-b01f-45c9-8f6f-41f9e3b8a107	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633372669	15040461277	0.00	0.00	radacct	2026-04-08 01:11:49.46731
0c47574c-cabe-4287-8a40-e473955ff1e3	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2829632725	13363862651	0.10	3.18	radacct	2026-04-08 01:11:49.469277
e5f5c2ff-0c0f-40cc-a8a1-019fd2d8a838	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	167274	438334	0.00	0.02	radacct	2026-04-08 01:11:49.471214
0a579de2-9f82-42d5-8b05-c3caf2c9cd77	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719373117	5145035706	0.00	0.00	radacct	2026-04-08 01:11:49.473783
8cc2eef3-f5a0-4c80-8cf7-f83f8aeb570a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	7038215	8446837	0.00	0.00	radacct	2026-04-08 01:11:49.476535
1f64c5f0-a89a-4ea7-b4bc-afbd6a74fd66	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432494753	16930048099	0.01	0.00	radacct	2026-04-08 01:11:49.478349
fd226458-29a3-48e1-9d70-42bf287fd558	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	868151578	14169067249	0.01	0.01	radacct	2026-04-08 01:11:49.480373
ff893c26-d616-4930-b761-aa8e5affccfc	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519144366	14198111994	0.00	0.00	radacct	2026-04-08 01:11:49.482289
394c4572-646b-4555-883d-ec8ada1ab44a	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183680834	16008082787	0.00	0.00	radacct	2026-04-08 01:11:49.484339
facb27fa-2c1b-4ec2-b1a9-e66ef6896c7e	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	695688355	13961117765	0.08	3.56	radacct	2026-04-08 01:11:49.486309
082c5665-70ca-4a6e-b9b6-4d5cc5129aaf	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408030370	10346964734	0.00	0.00	radacct	2026-04-08 01:11:49.488223
faa8baa5-e6b5-4143-9e56-9f41b7709364	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	758988966	12832508246	0.00	0.00	radacct	2026-04-08 01:11:49.490917
f70cd761-a885-49b6-bd6e-a9e9159f5b9d	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1665959675	35267923464	0.01	0.02	radacct	2026-04-08 01:11:49.493427
d8512601-0330-4721-a91b-662cd3afff73	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1406634410	25198256408	0.06	0.61	radacct	2026-04-08 01:11:49.49536
07900fcc-fe79-4966-9474-7df6121162fb	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774399795	12078770208	0.01	0.04	radacct	2026-04-08 01:11:49.497239
95790c18-43d3-4db9-aa5e-2722d1ba7106	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1843803183	41303606535	0.12	1.45	radacct	2026-04-08 01:11:49.499077
cd6a0600-06a6-4028-9f1e-ab3fa6b1cc8b	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	273095435	6681834666	0.12	2.16	radacct	2026-04-08 01:11:49.500872
af7a9345-8102-4a83-b11c-da5329ed1e33	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2558720088	20886542903	0.06	2.32	radacct	2026-04-08 01:11:49.502723
a6365df7-0677-4af6-ad45-d1b93c89b398	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2423576076	19448208283	0.12	0.94	radacct	2026-04-08 01:11:49.504678
626d172b-6f89-4003-b327-2d8f05794f4d	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756390116	20540606679	0.01	0.02	radacct	2026-04-08 01:11:49.506631
377f6f06-e600-456e-9a52-83ae8bc63e2c	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183864236	11068138189	0.00	0.00	radacct	2026-04-08 01:13:49.431947
72fd20db-5b7d-4000-a7cc-cd5af5a7cb1a	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	51331597	2022209894	0.03	0.73	radacct	2026-04-08 01:13:49.441138
ebb052d1-0aee-4cea-86c1-66b7bc0cfb06	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	19914	68046	0.00	0.00	radacct	2026-04-08 01:13:49.443705
0971e30d-93b6-40dc-884f-0b957683e3dc	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2854322873	16105688174	0.00	0.00	radacct	2026-04-08 01:13:49.445722
fffcc35c-b36d-4716-9613-5344a9d6d1b4	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584546385	8821989863	0.00	0.00	radacct	2026-04-08 01:13:49.447734
b8791d95-12e8-4d34-ac01-6d63c7d75135	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67340451	1841139819	0.00	0.00	radacct	2026-04-08 01:13:49.449733
0a30edb0-ade8-490e-b1ee-60dbd3128f75	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2453361697	20538582594	0.02	0.41	radacct	2026-04-08 01:13:49.451879
96cd8e5e-508e-4575-a55c-682cb5ff857a	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546824945	13048607963	0.01	0.08	radacct	2026-04-08 01:13:49.453802
4784a631-ecc3-4ada-bed2-e1344bccf1aa	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941449074	19947226075	0.00	0.00	radacct	2026-04-08 01:13:49.456177
1d918757-2c7c-4811-bd95-56fbc79b5436	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	503198948	4265615890	0.01	0.01	radacct	2026-04-08 01:13:49.458901
3805ea76-d3cc-439a-9885-c0ea7f19a917	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	395193	1448586	0.00	0.01	radacct	2026-04-08 01:13:49.460895
df668788-2017-4241-88ea-d8bbd7cdf066	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	93380629	3336885303	0.10	6.22	radacct	2026-04-08 01:13:49.463291
c0a1e487-32ec-4b58-9728-fbd7acfc96d4	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633379325	15040476100	0.00	0.00	radacct	2026-04-08 01:13:49.465228
3637b253-e48d-4ca2-b4f6-9cd69e2dbc8d	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2830812187	13404142147	0.08	2.69	radacct	2026-04-08 01:13:49.467196
6d4f2984-64b7-40a2-897e-1e7e27061e04	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	178866	448796	0.00	0.00	radacct	2026-04-08 01:13:49.469207
2b2c6303-2298-43c0-814e-a937c8c98d74	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719374055	5145036664	0.00	0.00	radacct	2026-04-08 01:13:49.471146
134f61bc-f3c6-4ee9-a6f9-510241d6307a	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	22485521	24663465	1.03	1.08	radacct	2026-04-08 01:13:49.474025
c8553015-a915-4e9f-974b-94d43e4c529d	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432547288	16930085100	0.00	0.00	radacct	2026-04-08 01:13:49.476607
d562cc3a-a38d-4ad5-972a-9ea2a1c58aa7	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	868209614	14169155283	0.00	0.01	radacct	2026-04-08 01:13:49.478895
23bf9a69-2830-4899-9f15-3bb1909dc138	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519208222	14198252872	0.00	0.01	radacct	2026-04-08 01:13:49.480703
f1e36c39-c7a5-4304-8b2e-f3f8e756676e	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183697975	16008124131	0.00	0.00	radacct	2026-04-08 01:13:49.482551
b35b832b-d4e9-421b-a56f-9f229710d873	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	695747060	13961145554	0.00	0.00	radacct	2026-04-08 01:13:49.484343
62e7db3b-b609-443c-90c7-5d39df2c20dc	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408032074	10346965462	0.00	0.00	radacct	2026-04-08 01:13:49.486169
15ae7d40-7356-4491-8e7a-8a04eb21abe1	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	759005064	12832539733	0.00	0.00	radacct	2026-04-08 01:13:49.488227
0f3f86f8-f994-4581-b419-f8597b6caaed	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1666397065	35268339945	0.03	0.03	radacct	2026-04-08 01:13:49.490672
ba79f68b-decf-4f38-88ac-e89eb9d0b385	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1413651211	25210385566	0.47	0.81	radacct	2026-04-08 01:13:49.492746
f3f96b1e-9dc3-41ba-999c-63e90333a351	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774407252	12078782821	0.00	0.00	radacct	2026-04-08 01:13:49.494782
f10eb64a-4f0b-42a7-8ee9-db5c6d2414e1	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1843876388	41303677887	0.00	0.00	radacct	2026-04-08 01:13:49.496602
3132dd0f-71f8-4985-9d92-08c5784038fa	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	275510758	6794934708	0.16	7.54	radacct	2026-04-08 01:13:49.498403
badd2a3a-f34b-4fab-abed-bfc0d3d3aa36	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2559519271	20912787351	0.05	1.75	radacct	2026-04-08 01:13:49.500571
491ed7c2-6274-4146-8b54-41e70a2327e7	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2425677674	19483205801	0.14	2.33	radacct	2026-04-08 01:13:49.502438
cf7673a5-1fb8-4577-bae5-5ed895adc587	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756449498	20540654482	0.00	0.00	radacct	2026-04-08 01:13:49.504539
eeec31bd-72df-4119-9f23-2ab9852c4cd6	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183866156	11068139709	0.00	0.00	radacct	2026-04-08 01:15:49.436633
10dcef71-f51c-41d1-a167-86d4649611fd	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	51447090	2029798215	0.01	0.51	radacct	2026-04-08 01:15:49.447031
18c5e20d-414f-4e12-9b20-eb9467cd844e	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	27282	78756	0.00	0.00	radacct	2026-04-08 01:15:49.449492
54e0816e-8084-497d-bdd1-a7a45c602629	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2854334830	16105705179	0.00	0.00	radacct	2026-04-08 01:15:49.451968
64e03b46-db56-43ca-a78e-1132ec500109	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584549886	8821996475	0.00	0.00	radacct	2026-04-08 01:15:49.454788
da968506-61ae-4d39-90b3-0c350000b3b3	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67345265	1841147367	0.00	0.00	radacct	2026-04-08 01:15:49.457487
641a5940-cbcf-4d6d-ac6e-84d253b37eee	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2453693705	20539311902	0.02	0.05	radacct	2026-04-08 01:15:49.460119
183b1a1f-b817-4dca-8412-6ba1c9837a9f	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1546865131	13048650999	0.00	0.00	radacct	2026-04-08 01:15:49.462538
fa153931-16d8-403c-97e1-bde96f01a746	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941450539	19947227057	0.00	0.00	radacct	2026-04-08 01:15:49.464922
23bb1b23-7dcd-4246-92ad-db4569e1b23b	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	503251439	4265697874	0.00	0.01	radacct	2026-04-08 01:15:49.467345
b8eec763-5f18-4b35-b9d1-a3c8fd1b4cce	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	438122	1480672	0.00	0.00	radacct	2026-04-08 01:15:49.4694
bec1f57d-2fbf-4637-a88a-d9d91c38ce80	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	95152163	3428349798	0.12	6.10	radacct	2026-04-08 01:15:49.471861
5af7037c-4fb7-412a-a6d0-007a5bf71e3d	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633426839	15040799319	0.00	0.02	radacct	2026-04-08 01:15:49.474791
99023439-8605-4cd2-ae6a-67053232a53e	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2831799161	13441767355	0.07	2.51	radacct	2026-04-08 01:15:49.477197
074bf1e9-973c-4820-8228-aa863036c27e	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	198515	465202	0.00	0.00	radacct	2026-04-08 01:15:49.479606
bd054d6b-6b9c-44a0-a863-7ea1176ef3c4	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719409229	5145080157	0.00	0.00	radacct	2026-04-08 01:15:49.481951
2a52ae88-c040-4c86-9524-81b2db2ee6c8	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	41675995	41687350	1.28	1.13	radacct	2026-04-08 01:15:49.484345
1267f20b-faff-407b-aa6d-431258815b09	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432626748	16930135282	0.01	0.00	radacct	2026-04-08 01:15:49.486779
878e29df-cd99-4645-98f1-459def827c8a	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	868250074	14169210067	0.00	0.00	radacct	2026-04-08 01:15:49.489701
7f2f5898-2602-4e74-b829-956b31b8d3ff	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519226658	14198267920	0.00	0.00	radacct	2026-04-08 01:15:49.492207
7551881a-4204-4180-a9ad-534d36f526b0	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1183703764	16008134259	0.00	0.00	radacct	2026-04-08 01:15:49.494709
12e63474-9273-43d1-a80d-40f3c2c724c9	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	695810151	13961158440	0.00	0.00	radacct	2026-04-08 01:15:49.497142
036736fb-358b-46a8-aff7-e3ed17b6cb60	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408177960	10347172807	0.01	0.01	radacct	2026-04-08 01:15:49.49948
b7be67b2-1ec0-4f4d-a117-9cd9d8706a9f	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	759015586	12832553820	0.00	0.00	radacct	2026-04-08 01:15:49.501922
1a5c1a1f-3e97-4f55-8e05-6fb210566892	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1666466214	35268426325	0.00	0.01	radacct	2026-04-08 01:15:49.504533
df8113ff-d0a4-4cff-ba47-41a0ff97bb60	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1417297798	25216216035	0.24	0.39	radacct	2026-04-08 01:15:49.507214
5b43c9bd-549a-43b6-b8ac-7f401170fa98	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774543986	12078923091	0.01	0.01	radacct	2026-04-08 01:15:49.509437
60617e37-6ce2-405f-88dc-1a118c3cb560	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1844939040	41332682208	0.07	1.93	radacct	2026-04-08 01:15:49.511555
e6c5b123-8b81-4dfd-ab39-eca8defdf1a0	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	275887139	6803911152	0.03	0.60	radacct	2026-04-08 01:15:49.513975
588e76e6-ca2e-4154-80a7-6298b73f491d	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2560800237	20938261938	0.09	1.70	radacct	2026-04-08 01:15:49.516377
ca115758-836c-4329-8a65-4d38750865b8	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2427168907	19504047604	0.10	1.39	radacct	2026-04-08 01:15:49.518719
0cbc32be-e69b-480b-b3bf-95ae3128dc51	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756476689	20540689986	0.00	0.00	radacct	2026-04-08 01:15:49.521337
5451d283-c7e8-4f38-8fdb-25b8606bf58a	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	3183877065	11068155812	0.00	0.00	radacct	2026-04-08 01:17:49.445025
8e4bc0ab-d315-4fe8-a402-5e1aedbdda0c	0ce4ec60-8454-459f-8ada-b540758b3877	3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	51588391	2040336613	0.01	0.70	radacct	2026-04-08 01:17:49.453833
4ecf2b39-086f-4079-b9fc-b3163f789884	0ce4ec60-8454-459f-8ada-b540758b3877	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	206200	1147336	0.01	0.07	radacct	2026-04-08 01:17:49.456813
3f1d8c0b-afa2-416b-9bfb-14220cadff65	0ce4ec60-8454-459f-8ada-b540758b3877	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	2854341603	16105712714	0.00	0.00	radacct	2026-04-08 01:17:49.459115
9f014df8-4958-4d7d-ade0-4a8c95ba7d72	0ce4ec60-8454-459f-8ada-b540758b3877	27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	584555903	8822008311	0.00	0.00	radacct	2026-04-08 01:17:49.461118
fd139d8f-ec29-4cb5-b36c-2f32b1f9bc4e	0ce4ec60-8454-459f-8ada-b540758b3877	c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	67427235	1841193497	0.01	0.00	radacct	2026-04-08 01:17:49.463087
edb413af-e6fc-4608-aba8-3aa1e0f2cd70	0ce4ec60-8454-459f-8ada-b540758b3877	638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	2453776620	20539425562	0.01	0.01	radacct	2026-04-08 01:17:49.465152
280e9112-f38a-4b16-80c5-a2ab6bf2d9e2	0ce4ec60-8454-459f-8ada-b540758b3877	85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	1547232767	13055930566	0.02	0.49	radacct	2026-04-08 01:17:49.467099
68794298-060b-46c9-9378-659197c3aafd	0ce4ec60-8454-459f-8ada-b540758b3877	40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	941451687	19947228223	0.00	0.00	radacct	2026-04-08 01:17:49.469382
9a73e3d4-6a94-4e34-8719-bc57182817c0	0ce4ec60-8454-459f-8ada-b540758b3877	8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	503262424	4265720705	0.00	0.00	radacct	2026-04-08 01:17:49.472404
7856b115-2055-4112-b6a7-08fbc3d799b1	0ce4ec60-8454-459f-8ada-b540758b3877	9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	458271	1498675	0.00	0.00	radacct	2026-04-08 01:17:49.474827
741bf66e-a022-427f-9a2e-6767964aa499	0ce4ec60-8454-459f-8ada-b540758b3877	d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	97484029	3517618778	0.16	5.95	radacct	2026-04-08 01:17:49.476857
7f613a91-d9bd-41b4-8e2f-a3c7236d6377	0ce4ec60-8454-459f-8ada-b540758b3877	62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	633430862	15040809186	0.00	0.00	radacct	2026-04-08 01:17:49.478842
e0a273d9-bbf5-4a7a-ac42-f136389642f6	0ce4ec60-8454-459f-8ada-b540758b3877	25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	2833172122	13490198513	0.09	3.23	radacct	2026-04-08 01:17:49.48079
3af19a81-0afa-4c83-9594-a39bbcaf3435	0ce4ec60-8454-459f-8ada-b540758b3877	89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	219803	478906	0.00	0.00	radacct	2026-04-08 01:17:49.482734
23b9c610-9f16-46b9-b154-084c47c8382f	0ce4ec60-8454-459f-8ada-b540758b3877	851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	719490914	5146350669	0.01	0.08	radacct	2026-04-08 01:17:49.484714
e1bc61d2-bc24-4497-93e1-9922154bb2c4	0ce4ec60-8454-459f-8ada-b540758b3877	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	49644645	59668769	0.53	1.20	radacct	2026-04-08 01:17:49.486956
50c4f223-1122-4548-97d9-32cd9d2d89df	0ce4ec60-8454-459f-8ada-b540758b3877	a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	2432711591	16930187815	0.01	0.00	radacct	2026-04-08 01:17:49.489695
c9f352f0-9103-4f94-aa64-be6df79811e0	0ce4ec60-8454-459f-8ada-b540758b3877	149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	868276324	14169245058	0.00	0.00	radacct	2026-04-08 01:17:49.491675
5274cde4-ce67-4b79-912f-fcef8d747d30	0ce4ec60-8454-459f-8ada-b540758b3877	bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	2519253208	14198280006	0.00	0.00	radacct	2026-04-08 01:17:49.493534
9483d237-9aae-4bdb-84ba-e7d6e8110a4d	0ce4ec60-8454-459f-8ada-b540758b3877	1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	1184319497	16009498891	0.04	0.09	radacct	2026-04-08 01:17:49.495411
82b60921-e849-466e-b394-f6c2c9b2f422	0ce4ec60-8454-459f-8ada-b540758b3877	f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	695860154	13961186872	0.00	0.00	radacct	2026-04-08 01:17:49.497651
b5a07331-2e28-4e44-b984-96936d4e3495	0ce4ec60-8454-459f-8ada-b540758b3877	0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	408471876	10347608784	0.02	0.03	radacct	2026-04-08 01:17:49.499489
d56e538a-ac90-43d4-ad08-1a2e03186554	0ce4ec60-8454-459f-8ada-b540758b3877	5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	759031889	12832578243	0.00	0.00	radacct	2026-04-08 01:17:49.501314
155aec15-2bdf-45b9-9e29-1946241517c4	0ce4ec60-8454-459f-8ada-b540758b3877	9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	1666713332	35271646622	0.02	0.21	radacct	2026-04-08 01:17:49.503305
b0ca5143-8a96-46be-b370-e3e96b59b422	0ce4ec60-8454-459f-8ada-b540758b3877	36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	1417521203	25221642049	0.01	0.36	radacct	2026-04-08 01:17:49.506124
ff132739-b9f8-4968-b970-eab507f6044f	0ce4ec60-8454-459f-8ada-b540758b3877	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	774583572	12079363535	0.00	0.03	radacct	2026-04-08 01:17:49.508145
5c527be8-5a34-4cb8-9f87-a1e52ec885ef	0ce4ec60-8454-459f-8ada-b540758b3877	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	1845043199	41332783110	0.01	0.01	radacct	2026-04-08 01:17:49.510017
1700930d-3272-4f73-b81b-78dadf8e7097	0ce4ec60-8454-459f-8ada-b540758b3877	27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	276563973	6822097107	0.05	1.21	radacct	2026-04-08 01:17:49.511889
9a47b130-366c-41fb-b3f4-62704a5ced60	0ce4ec60-8454-459f-8ada-b540758b3877	e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	2561514365	20963120496	0.05	1.66	radacct	2026-04-08 01:17:49.513808
96a067d1-a99c-404c-94b8-5bf15a276d47	0ce4ec60-8454-459f-8ada-b540758b3877	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	2433208048	19529383075	0.40	1.69	radacct	2026-04-08 01:17:49.515696
f5af648d-51db-4f54-9577-e77945d5a72e	0ce4ec60-8454-459f-8ada-b540758b3877	60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	2756597422	20540781970	0.01	0.01	radacct	2026-04-08 01:17:49.517573
\.


--
-- TOC entry 5359 (class 0 OID 291233)
-- Dependencies: 238
-- Data for Name: billable_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billable_items (id, company_id, name, description, price, type, taxable, active, plan_id, created_at, updated_at) FROM stdin;
ce1c960e-0b0e-44fd-9157-1b023d8788f1	0ce4ec60-8454-459f-8ada-b540758b3877	10/5Mbps Buddy1	15M/5M Internet Plan	365.00	recurring	f	t	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-07 01:16:55.225712	2026-04-07 01:16:55.225712
b64de0c3-cf8a-4aab-bb54-3a96db33b43a	0ce4ec60-8454-459f-8ada-b540758b3877	20/10Mbps Buddy	20M/10M Internet Plan	465.00	recurring	f	t	5960e26b-6619-4a41-ad59-a57dd28f3b87	2026-04-07 01:16:55.269053	2026-04-07 01:16:55.269053
\.


--
-- TOC entry 5346 (class 0 OID 290722)
-- Dependencies: 225
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, email, phone, address, subscription_status, subscription_plan, expires_at, created_at, updated_at, bank_details) FROM stdin;
1b23c50b-c2da-4aca-9bbf-dd08682e1b4e	TestISP	admin@testisp.com	\N	\N	active	trial	2026-04-19 18:49:58.247164	2026-04-05 18:49:58.247164	2026-04-05 18:49:58.247164	\N
0ce4ec60-8454-459f-8ada-b540758b3877	CONNIS	admin@connis.co.za	\N	\N	active	trial	2026-04-19 18:59:44.434883	2026-04-05 18:59:44.434883	2026-04-05 18:59:44.434883	\N
\.


--
-- TOC entry 5347 (class 0 OID 290737)
-- Dependencies: 226
-- Data for Name: company_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_admins (id, company_id, email, password_hash, full_name, role, active, created_at, updated_at, phone) FROM stdin;
c69f9463-1c03-4a4f-b652-043d423b78de	1b23c50b-c2da-4aca-9bbf-dd08682e1b4e	admin@testisp.com	$2b$12$FZWA3Etv3IJRnVcC2oC2T.GJ1Hhb.7kP/swdYNBwBptHMSbdXl9l.	Admin User	owner	t	2026-04-05 18:49:58.247164	2026-04-05 18:49:58.247164	\N
8bd75f5f-1995-4409-9df6-62689a89a8d7	0ce4ec60-8454-459f-8ada-b540758b3877	admin@connis.co.za	$2b$12$bZIGj/Hm2IsO.G/aN7t8MOZ9ED.0O/gHpUQJzKMV93mDgQLTdJzi2	Admin	owner	t	2026-04-05 18:59:44.434883	2026-04-05 18:59:44.434883	\N
\.


--
-- TOC entry 5363 (class 0 OID 291370)
-- Dependencies: 242
-- Data for Name: credit_note_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_note_items (id, credit_note_id, description, quantity, unit_price, total, created_at) FROM stdin;
\.


--
-- TOC entry 5362 (class 0 OID 291326)
-- Dependencies: 241
-- Data for Name: credit_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credit_notes (id, company_id, user_id, credit_number, status, subtotal, tax, total, currency, notes, invoice_id, transaction_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5352 (class 0 OID 291027)
-- Dependencies: 231
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, company_id, user_id, ticket_id, name, file_path, file_size, mime_type, uploaded_by, created_at, description, updated_at) FROM stdin;
0db51276-07e0-404d-9f1f-fe0d3dd8be1a	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	\N	24v Charger.jpeg	D:\\Workspace\\connis\\backend\\uploads\\documents\\1775433918868-515595948.jpeg	154417	image/jpeg	\N	2026-04-06 02:05:18.873672	\N	2026-04-06 23:49:05.820986
\.


--
-- TOC entry 5358 (class 0 OID 291215)
-- Dependencies: 237
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at) FROM stdin;
\.


--
-- TOC entry 5357 (class 0 OID 291173)
-- Dependencies: 236
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, company_id, user_id, invoice_number, status, type, subtotal, tax, total, amount_paid, currency, notes, due_date, paid_at, period_start, period_end, transaction_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5345 (class 0 OID 289716)
-- Dependencies: 224
-- Data for Name: lead_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_comments (id, lead_id, author, content, created_at) FROM stdin;
effff84d-058e-472d-bd9c-15c81df2e6f9	99b8bee2-f62e-4d89-92c1-2135b81895d4	Admin	kj.bqDNJ.CKJCHKCV	2026-04-05 17:40:59.125534
3d63cab4-ead6-40e7-9c70-c546ccff2033	99b8bee2-f62e-4d89-92c1-2135b81895d4	Admin	HJCM JYTYYT	2026-04-05 17:41:35.112863
6f3a9e7d-4273-4ef0-96bb-552003d2a76d	99b8bee2-f62e-4d89-92c1-2135b81895d4	System	Lead converted to customer: f.matenda@fortai.co.za | Plan: 10/5Mbps Buddy (10M/5M)	2026-04-05 17:48:04.840623
5d3d6022-a96e-4073-9b8a-a5558dd01622	92f7adb1-4fcd-47ac-ac27-d5e9c4bbc764	System	Lead converted to customer: john_pppoe | Plan: 10Mbps Standard (10M/5M) | PPPoE created on router	2026-04-05 18:38:04.192624
4642df65-4f1f-4fd3-a4ff-860f0387e2e0	b3ffa9eb-5760-4c74-83ee-4f4c0082accb	System	Lead converted to customer: f.matenda3@fortai.co.za | Plan: 10/5Mbps Buddy1 (15M/5M) | RADIUS: RADIUS handles authentication	2026-04-05 19:47:22.350815
b86dcfa1-2916-485a-b742-36398c8e9e43	ea9612ef-3745-4a0f-a17c-26b0902303da	System	Lead converted to customer: test.radius@connis.co.za | Plan: 10/5Mbps Buddy1 (15M/5M) | RADIUS: synced	2026-04-05 20:04:27.220965
b95ee31a-dd85-4304-91be-7c8b8ac1ce85	be50825c-18bb-42be-aedd-2069ae1f8324	System	Lead converted to customer: m.mwatsika@fortai.co.za | Plan: 10/5Mbps Buddy1 (15M/5M) | RADIUS: synced	2026-04-05 20:24:26.501801
\.


--
-- TOC entry 5343 (class 0 OID 289683)
-- Dependencies: 222
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, full_name, phone, email, address, status, notes, created_at, updated_at, converted_to, company_id, created_by) FROM stdin;
99b8bee2-f62e-4d89-92c1-2135b81895d4	Fortune Matenda	0612685933	fortunematenda@gmail.com	134 kommitjie road Fishhoek	converted	\N	2026-04-05 17:35:50.271562	2026-04-05 17:48:04.840623	98b8a2ae-3c7e-4487-aafb-8e6a7ea3f3f0	\N	\N
92f7adb1-4fcd-47ac-ac27-d5e9c4bbc764	John Tester	0771234567	john@test.co.za	42 Main Street, Harare	converted	Test lead for PPPoE conversion	2026-04-05 18:21:14.95368	2026-04-05 18:38:04.192624	f6b261f3-3795-49a7-8fc3-e70de362dc9c	\N	\N
b3ffa9eb-5760-4c74-83ee-4f4c0082accb	Fortune Matenda	0612685933	fortunematenda@gmail.com	134 kommitjie road Fishhoek	converted	\N	2026-04-05 19:18:53.743306	2026-04-05 19:47:22.350815	1049d53f-7627-4f36-a7f6-2175b5a06b93	0ce4ec60-8454-459f-8ada-b540758b3877	\N
ea9612ef-3745-4a0f-a17c-26b0902303da	Test Radius User	0771234567	test.radius@connis.co.za	123 Test St	converted	\N	2026-04-05 20:04:10.783931	2026-04-05 20:04:27.220965	358da53e-f5f7-4f9d-96c0-5fe5e6675248	0ce4ec60-8454-459f-8ada-b540758b3877	\N
be50825c-18bb-42be-aedd-2069ae1f8324	Mighty Mwatsika	+27844104690	mwatsika@gmail.com	68 Myeza Rd, Masiphumelele, Cape Town, 7975	converted	\N	2026-04-05 20:23:29.802545	2026-04-06 23:39:16.712356	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	0ce4ec60-8454-459f-8ada-b540758b3877	\N
\.


--
-- TOC entry 5356 (class 0 OID 291141)
-- Dependencies: 235
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, company_id, user_id, ticket_id, content, sender_type, sender_id, is_read, created_at, attachment_url, is_delivered) FROM stdin;
\.


--
-- TOC entry 5355 (class 0 OID 291124)
-- Dependencies: 234
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, company_id, type, title, body, link, is_read, ref_id, created_at) FROM stdin;
\.


--
-- TOC entry 5344 (class 0 OID 289695)
-- Dependencies: 223
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, user_id, amount, method, reference, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5340 (class 0 OID 289633)
-- Dependencies: 219
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, name, download_speed, upload_speed, price, description, active, created_at, updated_at, mikrotik_profile, company_id, radius_rate_limit, billing_type) FROM stdin;
00ebf0e3-4b16-4859-9382-7fe1fa0b5e5a	10/5Mbps Buddy	10M	5M	365.00	10/5Mbps Buddy	t	2026-04-05 17:45:15.862989	2026-04-05 17:45:15.862989	\N	\N	\N	postpaid
ba31f666-a30e-42be-9683-b9f4ff481f9d	10Mbps Standard	10M	5M	29.99	Standard 10Mbps PPPoE plan	t	2026-04-05 18:20:36.767516	2026-04-05 18:20:36.767516	pppoe-10M	\N	\N	postpaid
5e238eca-da9a-4938-be66-3a584806abd4	10/5Mbps Buddy1	15M	5M	365.00	10/5Mbps Buddy	t	2026-04-05 19:45:04.775512	2026-04-05 19:45:04.775512	10/5Mbps Buddy	0ce4ec60-8454-459f-8ada-b540758b3877	5M/10M	postpaid
5960e26b-6619-4a41-ad59-a57dd28f3b87	20/10Mbps Buddy	20M	10M	465.00	20/10Mbps Buddy	t	2026-04-05 21:39:16.628248	2026-04-05 21:39:16.628248	20/10Mbps	0ce4ec60-8454-459f-8ada-b540758b3877	10M/20M	postpaid
\.


--
-- TOC entry 5361 (class 0 OID 291303)
-- Dependencies: 240
-- Data for Name: quote_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quote_items (id, quote_id, item_id, description, quantity, unit_price, total, created_at) FROM stdin;
\.


--
-- TOC entry 5360 (class 0 OID 291258)
-- Dependencies: 239
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotes (id, company_id, user_id, quote_number, status, subtotal, tax, total, currency, notes, valid_until, customer_name, customer_email, customer_phone, customer_address, converted_to, lead_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5348 (class 0 OID 290757)
-- Dependencies: 227
-- Data for Name: routers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routers (id, company_id, name, ip_address, username, password_enc, port, is_default, active, created_at, updated_at, auth_type) FROM stdin;
c10d4eb3-4630-4132-a87a-b0ee9bca9eb3	0ce4ec60-8454-459f-8ada-b540758b3877	Faerie Knowe	102.222.12.129	admin	2d033a4e4e055ae93271dd56b5f3c64b:0b7cbbbaebc95a9b499cb2c70a9e7d67	8728	t	t	2026-04-05 19:13:03.072844	2026-04-05 19:30:39.506199	radius
\.


--
-- TOC entry 5342 (class 0 OID 289666)
-- Dependencies: 221
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, nas_ip, framed_ip, session_id, start_time, stop_time, upload_bytes, download_bytes, terminate_cause, created_at, company_id) FROM stdin;
\.


--
-- TOC entry 5351 (class 0 OID 290988)
-- Dependencies: 230
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, company_id, user_id, ticket_id, title, description, status, priority, assigned_to, due_date, created_by, completed_at, created_at, updated_at) FROM stdin;
0ada8aab-e2c6-415b-8f34-d450653d6c27	0ce4ec60-8454-459f-8ada-b540758b3877	2f667b9d-ac5f-42ad-a6c7-5984ffba3483	\N	zsxdwd	dwc s	done	high	8bd75f5f-1995-4409-9df6-62689a89a8d7	2026-04-15	\N	2026-04-06 02:33:24.328181	2026-04-06 02:30:55.858081	2026-04-06 02:33:24.328181
\.


--
-- TOC entry 5350 (class 0 OID 290968)
-- Dependencies: 229
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (id, ticket_id, author_id, author_name, content, created_at, is_customer) FROM stdin;
6d60d464-e943-41ce-9120-50145324dacd	264518d4-5bb1-4598-96cb-401553212fcd	\N	Admin	sx S  DS CCCC	2026-04-06 02:05:04.381444	f
0e73ff5d-18fe-45cf-a80c-334c7d1e3f6e	f5c205f2-4b2e-42b5-97b3-7de8f23f71ce	\N	Admin	DONE	2026-04-06 02:29:52.643497	f
\.


--
-- TOC entry 5349 (class 0 OID 290933)
-- Dependencies: 228
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, company_id, user_id, subject, description, status, priority, assigned_to, created_by, closed_at, created_at, updated_at) FROM stdin;
264518d4-5bb1-4598-96cb-401553212fcd	0ce4ec60-8454-459f-8ada-b540758b3877	09961af8-e7c2-449a-b690-b730b5c526a9	ujhk jk	wdqdwd	open	medium	\N	\N	\N	2026-04-06 02:04:51.055653	2026-04-06 02:04:51.055653
f5c205f2-4b2e-42b5-97b3-7de8f23f71ce	0ce4ec60-8454-459f-8ada-b540758b3877	ca17101c-647a-407b-8221-4a73bb9a6f19	CWQ	DXXDFDFC	closed	high	8bd75f5f-1995-4409-9df6-62689a89a8d7	\N	2026-04-06 02:30:25.761832	2026-04-06 02:29:30.7203	2026-04-06 02:30:25.761832
\.


--
-- TOC entry 5353 (class 0 OID 291069)
-- Dependencies: 232
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, company_id, user_id, amount, type, description, created_by, created_at, category, reference) FROM stdin;
\.


--
-- TOC entry 5341 (class 0 OID 289646)
-- Dependencies: 220
-- Data for Name: user_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_plans (id, user_id, plan_id, start_date, end_date, active, created_at, changed_by) FROM stdin;
5102f71d-0797-49e0-9422-66a71fd67103	f6b261f3-3795-49a7-8fc3-e70de362dc9c	ba31f666-a30e-42be-9683-b9f4ff481f9d	2026-04-05	\N	t	2026-04-05 18:38:04.192624	\N
c673f92b-8762-44e6-a606-f45851983bc4	1049d53f-7627-4f36-a7f6-2175b5a06b93	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 19:47:22.350815	\N
f1f1db23-40ba-40ef-924a-9fb647a3ae9f	358da53e-f5f7-4f9d-96c0-5fe5e6675248	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:04:27.220965	\N
75640f74-25ee-4012-a258-3f3c8e43710e	abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:24:26.501801	\N
01e6cf19-c5f4-459b-8e84-349d39856da9	09961af8-e7c2-449a-b690-b730b5c526a9	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:34:30.437478	\N
5b2e9df9-12f2-46f1-b85b-5c906f97f979	ca17101c-647a-407b-8221-4a73bb9a6f19	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:34:37.916388	\N
83fdbf7f-7e33-4cbf-975a-619650f072f0	60382476-8f9e-4bce-9148-24707c743311	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:34:43.420869	\N
8ed115d5-08aa-45f4-9090-06af7ce4b02d	5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:34:48.943122	\N
e184a255-791d-47f1-b9ce-6a368ce1ba43	2f667b9d-ac5f-42ad-a6c7-5984ffba3483	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:34:55.038911	\N
60c1003a-eb11-4a0e-ab8a-2e947363a0f1	e17a3f1c-349d-400d-9234-c6fd44044528	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:00.086901	\N
5039f0e2-6d1c-4a37-ba8f-5e9f71980ac8	38df9356-144b-42b5-98a2-c9ea91060cca	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:10.888508	\N
218e09c9-81b0-4972-a73c-0cb6c59252dc	27a8aeaa-d008-444e-9df5-760e85ecf4cd	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	2026-04-05	f	2026-04-05 20:35:28.221917	\N
260e9dda-fb4c-4c45-826d-d9785076c7dd	27a8aeaa-d008-444e-9df5-760e85ecf4cd	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:32.555229	\N
f956dce3-71e8-4152-8852-a70f2e9afddd	3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:40.8932	\N
6478127c-2a7b-4916-b3b2-d97f89eea2fd	fc1911b9-4cd5-4fcb-8f66-7c93c64e8df9	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:47.566157	\N
452f6676-7de5-43d0-b9eb-cb9265a23c91	9688b69a-9b3c-4225-b59c-0eb6383fa4fa	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:35:52.998989	\N
e95f32cf-3e96-45a4-abb9-e0c540f0daed	36833ae8-04ab-45ec-a5d7-d684ac0071e1	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:02.637332	\N
b4d679a5-24c8-4052-817a-69fea8846b5c	9dca81b7-1fbd-4249-9187-987e60955901	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:11.61651	\N
8c79cf48-e81d-4025-8ee8-ee36bd19129b	5861bae2-6dda-467f-8e90-77271107b6d4	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:17.072219	\N
f17b3d3e-71d3-4500-91aa-0bc717d64720	0ac9325a-ce20-4f6a-8759-2e3855870353	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:23.427125	\N
48fc7cbc-6d71-407d-b40d-002e7388c77b	1ed99616-7b21-4c4a-a0ad-4d1521064625	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:31.810253	\N
55524f65-c822-4fd3-a6a9-30fd1e7d7fdb	f4d8762e-5dbd-4fd6-916a-e02a34045667	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:38.859308	\N
01212b4a-183f-4631-bf27-2717a947f946	bb15a236-714d-4efc-a598-7631f6ec2e15	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:36:46.300614	\N
09755c6a-0e53-47f1-a3ea-2c491e888ff8	3b736931-984c-4a01-8b5d-33933bc514ee	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:37:23.223986	\N
824c5bb1-9465-4557-b7c0-492942b2d449	851d4414-b861-4302-adb6-4244a91a98d2	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:37:30.457523	\N
363471b1-05b0-4342-9f18-80b6ce435a47	62b35c0d-9adf-493c-82c4-5bea0395a3a2	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:37:41.322326	\N
7fbcf872-e18f-4b1f-82b2-64ad0ef897e0	89d9a26b-8633-4b86-a199-90d67e2330a8	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:37:49.075173	\N
31daff26-fdf5-493e-8f8d-41f6ecccb03d	25266486-c06a-409a-aae3-c3e021cdc09e	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:37:54.452065	\N
32b36a17-1085-4024-9233-7e1023a03690	a6d6c899-25c2-4a98-bba4-3306ee156104	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:00.980644	\N
23773982-5388-4f8f-901d-edc3101b825f	63d85594-b4ba-4079-996c-6f6659f029f2	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:06.805058	\N
32c95524-7fdb-4a60-b0af-c24db8fab33f	149f3b23-ec79-405f-be19-dd3121371a40	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:14.638069	\N
576e5804-5abb-419b-858c-338b8a89c1d2	9a2e9029-b940-496e-9a1d-ecf4966437da	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:20.166805	\N
584d8d98-d9f8-46f4-adcd-8d7a4261cb41	8ca806e0-1b72-406e-8832-d011b6ef41fe	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:25.335559	\N
35fce3d5-1ee7-4da4-8479-d1a82f632ad0	85eb23ee-a238-42a5-89b6-b223506fd762	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:34.008393	\N
7e522f5f-1168-4313-a200-4efe20125af2	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	2026-04-05	f	2026-04-05 20:38:45.513991	\N
8b306320-b8f5-4b2b-84bc-6fecea4fc484	e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:47.226073	\N
b1c89ba7-eb7c-4a5b-9d6f-d0643d0a88d4	638b6384-2d23-4e99-a6fb-5a3b4abc8003	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:38:54.195353	\N
f6429c04-2dd1-4173-a131-32f30a0e5d2a	27c1aa13-854d-4b8c-a746-f64ce4e684e0	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:39:02.316187	\N
c17a3c11-934c-4b7e-8f35-ed760e149958	8756cada-e432-4ce0-9314-b65e7beccd57	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:39:08.653557	\N
3ffeafd3-7984-4eb8-8a47-bf6eea30674d	dab2a84d-e4de-4a27-9bc0-81e04e60c3da	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:39:19.774155	\N
26aeb938-8b0e-4cac-989b-7820f3c40786	d37fe61d-086f-4e30-83b5-fde16756eea8	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:39:26.566838	\N
c4b82145-8a26-455f-9cb9-a1d6d706e911	c76881a0-3a6f-4e7a-a427-124083434716	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-05	\N	t	2026-04-05 20:39:38.840889	\N
1571862b-1308-4975-80d1-1da366c3756b	09961af8-e7c2-449a-b690-b730b5c526a9	5960e26b-6619-4a41-ad59-a57dd28f3b87	2026-04-06	2026-05-05	f	2026-04-05 21:57:51.869777	\N
d4ef3752-6afd-49f5-87a1-ec12ca80e8a6	3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	5e238eca-da9a-4938-be66-3a584806abd4	2026-04-06	\N	t	2026-04-06 12:14:44.743083	\N
\.


--
-- TOC entry 5339 (class 0 OID 289619)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, full_name, email, phone, address, balance, active, created_at, updated_at, company_id, created_by, seq_id, is_flagged, flagged_at, flag_reason, original_rate_limit, throttled_rate_limit) FROM stdin;
f6b261f3-3795-49a7-8fc3-e70de362dc9c	john_pppoe	Test1234	John Tester	john@test.co.za	0771234567	42 Main Street, Harare	0.00	f	2026-04-05 18:38:04.192624	2026-04-06 14:24:51.710469	0ce4ec60-8454-459f-8ada-b540758b3877	\N	2	f	\N	\N	\N	\N
98b8a2ae-3c7e-4487-aafb-8e6a7ea3f3f0	f.matenda@fortai.co.za	FMF2026!	Fortune Matenda	fortunematenda@gmail.com	0612685933	134 kommitjie road Fishhoek	0.00	t	2026-04-05 17:48:04.840623	2026-04-05 17:53:19.301814	0ce4ec60-8454-459f-8ada-b540758b3877	\N	1	f	\N	\N	\N	\N
09961af8-e7c2-449a-b690-b730b5c526a9	a.kadere@rachfort.co.za	$2b$10$U0ZgWtg.6eh9/axcD7A0mu1SB.4RaN.dw00VQztxY0/l5nW625hga	A Kadere	a.kadere@rachfort.co.za	0612685933	68 Myeza Rd, Masiphumelele, Cape Town, 7975	0.00	t	2026-04-05 20:27:12.917622	2026-04-06 00:48:02.246979	0ce4ec60-8454-459f-8ada-b540758b3877	\N	6	f	\N	\N	\N	\N
1049d53f-7627-4f36-a7f6-2175b5a06b93	f.matenda3@fortai.co.za	FMF2026!	Fortune Matenda	fortunematenda@gmail.com	0612685933	134 kommitjie road Fishhoek	0.00	t	2026-04-05 19:47:22.350815	2026-04-05 19:47:22.350815	0ce4ec60-8454-459f-8ada-b540758b3877	\N	3	f	\N	\N	\N	\N
358da53e-f5f7-4f9d-96c0-5fe5e6675248	test.radius@connis.co.za	TestPass123	Test Radius User	test.radius@connis.co.za	0771234567	\N	0.00	t	2026-04-05 20:04:27.220965	2026-04-05 20:04:27.220965	0ce4ec60-8454-459f-8ada-b540758b3877	\N	4	f	\N	\N	\N	\N
abdbe1cd-1a97-4de3-bb79-dbd7c5d3ab17	m.mwatsika@fortai.co.za	MMF2025!	Mighty Mwatsika	mwatsika@gmail.com	+27844104690	68 Myeza Rd, Masiphumelele, Cape Town, 7975	0.00	t	2026-04-05 20:24:26.501801	2026-04-05 20:24:26.501801	0ce4ec60-8454-459f-8ada-b540758b3877	\N	5	f	\N	\N	\N	\N
3b736931-984c-4a01-8b5d-33933bc514ee	a.manuel@fortai.co.za	$2b$10$62swZ.eJSmyJgpj0qhD5.u1hHqParupR08decwi8D7iwHj169gyCe	A Manuel	a.manuel@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:27:12.988165	2026-04-05 20:27:12.988165	0ce4ec60-8454-459f-8ada-b540758b3877	\N	7	f	\N	\N	\N	\N
3ad451e1-e874-4fd9-88d9-6684fc1e5ac6	a.mauwo@fortai.co.za	$2b$10$INSxZtVtV5BfOGzB9apjRO3Cdd87PER2nW7NoA1qZJSb1pLMeR3bK	A Mauwo	a.mauwo@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.052529	2026-04-05 20:27:13.052529	0ce4ec60-8454-459f-8ada-b540758b3877	\N	8	f	\N	\N	\N	\N
dab2a84d-e4de-4a27-9bc0-81e04e60c3da	a.mvubu@network.co.za	$2b$10$9Hf0VzPVeKNEkMq8qMsfXuO/MMM/L3dvgI1ASsDNfBVx6rZCGbYRq	A Mvubu	a.mvubu@network.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.116696	2026-04-05 20:27:13.116696	0ce4ec60-8454-459f-8ada-b540758b3877	\N	9	f	\N	\N	\N	\N
fa62b783-2660-429f-8653-e8f39b4edfa3	p.muzorembashop@fortai.co.za	$2b$10$UxwuFQw.3hbXJ8bpksbA0.W7W1GwYec42LntLOSoMmzREv73FqaCu	P Muzorembashop	p.muzorembashop@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.239008	2026-04-05 20:28:17.239008	0ce4ec60-8454-459f-8ada-b540758b3877	\N	40	f	\N	\N	\N	\N
1cc59111-a3b1-4aa2-9cdb-82ba53309aa2	p.ndlovu@rachfort.co.za	$2b$10$bw3ONGn1pV7F2ZAhvumtBO/r/lzQmIJypbW7ZBIYmd.w6TRIXMyGe	P Ndlovu	p.ndlovu@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.303274	2026-04-05 20:28:17.303274	0ce4ec60-8454-459f-8ada-b540758b3877	\N	41	f	\N	\N	\N	\N
9688b69a-9b3c-4225-b59c-0eb6383fa4fa	s.makarutse@network.co.za	$2b$10$flBPRwdpixUJZzw3mUTqi.XqZuowmXMSzQqLqWHRtDMJgYVZXpy8i	S Makarutse	s.makarutse@network.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.368128	2026-04-05 20:28:17.368128	0ce4ec60-8454-459f-8ada-b540758b3877	\N	42	f	\N	\N	\N	\N
fc1911b9-4cd5-4fcb-8f66-7c93c64e8df9	s.ndlovu@rachfort.co.za	$2b$10$mSCvSGEaXeji7AsZXDzkHeEi3zNshmK89WfhPhnaUuuSIzFK3740u	S Ndlovu	s.ndlovu@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.434372	2026-04-05 20:28:17.434372	0ce4ec60-8454-459f-8ada-b540758b3877	\N	43	f	\N	\N	\N	\N
3a17ebf3-19ad-4f22-9eb7-593b60a92e5e	s.nzvimbo@rachfort.co.za	$2b$10$cvuC87oV.ASQL9L93AY/ue8X/4ViIvP6PqO.8TCd7MrVDkXXB3jh.	S Nzvimbo	s.nzvimbo@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.501122	2026-04-05 20:28:17.501122	0ce4ec60-8454-459f-8ada-b540758b3877	\N	44	f	\N	\N	\N	\N
27a8aeaa-d008-444e-9df5-760e85ecf4cd	s.tsoloane@rachfort.co.za	$2b$10$cKTtxl734uTQEVBJG8tlB.X7UVOK/dzOf3qooHiiQFiQVHnuc4ALq	S Tsoloane	s.tsoloane@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.567446	2026-04-05 20:28:17.567446	0ce4ec60-8454-459f-8ada-b540758b3877	\N	45	f	\N	\N	\N	\N
0296254e-f09e-42b8-ba96-9540e8383cb5	s.williams@rachfort.co.za	$2b$10$Fh4VkFbfZ/8HC0QHefqHPOfoHRqwn3rkxotPysIlxUl.r.bMsNsqO	S Williams	s.williams@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.632734	2026-04-05 20:28:17.632734	0ce4ec60-8454-459f-8ada-b540758b3877	\N	46	f	\N	\N	\N	\N
38df9356-144b-42b5-98a2-c9ea91060cca	s.zingwe	$2b$10$C.3BXQtYgUy.8AidSlSLfeXuIfVuvgB4hadi20tURR..N7X9IQBSC	S Zingwe	s.zingwe	\N	\N	0.00	t	2026-04-05 20:28:17.698598	2026-04-05 20:28:17.698598	0ce4ec60-8454-459f-8ada-b540758b3877	\N	47	f	\N	\N	\N	\N
87dc987e-4bd5-4925-888d-ab27818710c7	t.fuma@fortai.co.za	$2b$10$9Qg9L6YyiR2WRVUy8dCuS.AUux0plvbuzJuuFF8dNyTpHqA2AnA6y	T Fuma	t.fuma@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.762897	2026-04-05 20:28:17.762897	0ce4ec60-8454-459f-8ada-b540758b3877	\N	48	f	\N	\N	\N	\N
950c28b1-4444-4906-9ab0-f1bd844705c8	t.jebetwane@rachfort.co.za	$2b$10$2lxeGiJrcE5F340/87TJvORQFGsEeTC2zPBBDQQ1tg1VtbFonRfE.	T Jebetwane	t.jebetwane@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.828022	2026-04-05 20:28:17.828022	0ce4ec60-8454-459f-8ada-b540758b3877	\N	49	f	\N	\N	\N	\N
e17a3f1c-349d-400d-9234-c6fd44044528	t.kanyongo@fortai.co.za	$2b$10$lw3q7F9v9sI3bzA6PwvTm.HAgaQXSVb2nOiYAgAg7GWvJTkeT6kum	T Kanyongo	t.kanyongo@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.894067	2026-04-05 20:28:17.894067	0ce4ec60-8454-459f-8ada-b540758b3877	\N	50	f	\N	\N	\N	\N
2f667b9d-ac5f-42ad-a6c7-5984ffba3483	t.tavenga@rachfort.co.za	$2b$10$rUN4Egwskb.1XFEsjOuHCuXvgUWXyETm.JhOJAMKfz72HLW9vL9t.	T Tavenga	t.tavenga@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.95903	2026-04-05 20:28:17.95903	0ce4ec60-8454-459f-8ada-b540758b3877	\N	51	f	\N	\N	\N	\N
5c6cba6d-8ee9-4b5d-be64-3e1bc162e3c5	t.thlakala@fortai.co.za	$2b$10$nk8yo13ZnZ.V7.xWZFAJ6OsG1lIMnqj.48P8T68FNcPOzTxF1Ejmu	T Thlakala	t.thlakala@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:18.023487	2026-04-05 20:28:18.023487	0ce4ec60-8454-459f-8ada-b540758b3877	\N	52	f	\N	\N	\N	\N
60382476-8f9e-4bce-9148-24707c743311	w.gwemure@rachfort.co.za	$2b$10$h8Ni3gYAtmlTwokmcpq5SeAepTKikeo2mS0Y46SBZC0F6DIimWbeC	W Gwemure	w.gwemure@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:18.090276	2026-04-05 20:28:18.090276	0ce4ec60-8454-459f-8ada-b540758b3877	\N	53	f	\N	\N	\N	\N
ca17101c-647a-407b-8221-4a73bb9a6f19	w.gwese@rachfort.co.za	$2b$10$LUODUzq60rr5ogcgawVJmeNRCAFKDEkVTf3bA0qslV4ChhbEF50WK	W Gwese	w.gwese@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:18.155202	2026-04-05 20:28:18.155202	0ce4ec60-8454-459f-8ada-b540758b3877	\N	54	f	\N	\N	\N	\N
a6d6c899-25c2-4a98-bba4-3306ee156104	m.mwiwa@rachfort.co.za	$2b$10$CT2vtZerahOTxIg2kQkmbe4Tq8qpKrv5P5SFt3K9i7UR0GkkrRtHW	M Mwiwa	m.mwiwa@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.519315	2026-04-06 01:07:50.774536	0ce4ec60-8454-459f-8ada-b540758b3877	\N	29	f	\N	\N	\N	\N
27c1aa13-854d-4b8c-a746-f64ce4e684e0	a.ndaradzi@rachfort.co.za	$2b$10$n1YwXmJM2qNG/vm3XhdPke0jYgbU7EHu9IA9QJaWy7E1lxYivYBgC	A Ndaradzi	a.ndaradzi@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.181736	2026-04-05 20:27:13.181736	0ce4ec60-8454-459f-8ada-b540758b3877	\N	10	f	\N	\N	\N	\N
8756cada-e432-4ce0-9314-b65e7beccd57	andrew@rachfort.co.za	$2b$10$pzoJanumaQphnKk9zJOne.bzbuLXf/.HBYu8Vox7FH42FGBNaw8Yq	Andrew	andrew@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.247324	2026-04-05 20:27:13.247324	0ce4ec60-8454-459f-8ada-b540758b3877	\N	11	f	\N	\N	\N	\N
c76881a0-3a6f-4e7a-a427-124083434716	b.kaitano@rachfort.co.za	$2b$10$YfKaQCcJtCklXouhvLbim.boQFVkvuXDQky6kQTezfwEqu.yArW/m	B Kaitano	b.kaitano@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.314339	2026-04-05 20:27:13.314339	0ce4ec60-8454-459f-8ada-b540758b3877	\N	12	f	\N	\N	\N	\N
638b6384-2d23-4e99-a6fb-5a3b4abc8003	b.mafukidze@fortai.co.za	$2b$10$Boxea7p6as85u2VXIpTYZuzELpFLrxRmbQFF/V2wxvgzURQvPbn8i	B Mafukidze	b.mafukidze@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.378585	2026-04-05 20:27:13.378585	0ce4ec60-8454-459f-8ada-b540758b3877	\N	13	f	\N	\N	\N	\N
e39262df-dfeb-4c0a-aa6c-cc835f9ddb09	b.mapfumo@fortai.co.za	$2b$10$ZmD6gX8LVj5phYEG9JuAmOfNWGI/maWM2upgBx7ZZYaTfTsddq0Bi	B Mapfumo	b.mapfumo@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.456581	2026-04-05 20:27:13.456581	0ce4ec60-8454-459f-8ada-b540758b3877	\N	14	f	\N	\N	\N	\N
85eb23ee-a238-42a5-89b6-b223506fd762	b.ousmane@rachfort.co.za	$2b$10$o7FXaNCVMxJb0eijizjq9eheFhMqkwzpPFcZGnbit5oU.7WomMu6i	B Ousmane	b.ousmane@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.529223	2026-04-05 20:27:13.529223	0ce4ec60-8454-459f-8ada-b540758b3877	\N	15	f	\N	\N	\N	\N
cf5051d0-740b-4e2f-8633-56ced662b3cd	c.butchery@rachfort.co.za	$2b$10$0mVUIJe5GRzH6IRVZlVAZePQa.SvRGjFRUI23bnGzrmAbvYoJha4y	C Butchery	c.butchery@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.596359	2026-04-05 20:27:13.596359	0ce4ec60-8454-459f-8ada-b540758b3877	\N	16	f	\N	\N	\N	\N
21bf12c9-64d8-49aa-b962-f1461d7d7ac5	c.dube@rachfort.co.za	$2b$10$57VZ5HStFylut9hhJOapb.K/oIHJ2WBPiBY1DcJy5IknYpXp.3pf.	C Dube	c.dube@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.660623	2026-04-05 20:27:13.660623	0ce4ec60-8454-459f-8ada-b540758b3877	\N	17	f	\N	\N	\N	\N
20f1fca5-9513-460d-ae05-44ca147a7719	c.teya@network.co.za	$2b$10$nJcvu.5D.4iYJnFlFrn7nuwR4yP7KG5NHs1Rj6pr/tFzVvxua.Zai	C Teya	c.teya@network.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.725482	2026-04-05 20:27:13.725482	0ce4ec60-8454-459f-8ada-b540758b3877	\N	18	f	\N	\N	\N	\N
40aefa49-452e-4028-ac78-b9c007718d4c	d.naki@rachfort.co.za	$2b$10$.QRM3cdYr0Blg5guH0knROW2GmvK/Z87ITPjhpiBhhJNMBVm8rrv2	D Naki	d.naki@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.789907	2026-04-05 20:27:13.789907	0ce4ec60-8454-459f-8ada-b540758b3877	\N	19	f	\N	\N	\N	\N
8ca806e0-1b72-406e-8832-d011b6ef41fe	e.matenda@network.co.za	$2b$10$.D5mRCla89mUhORCoSXxretVMGvcBTWnugHNohgI8qTCtxSzNI1rK	E Matenda	e.matenda@network.co.za	\N	\N	0.00	t	2026-04-05 20:27:13.853612	2026-04-05 20:27:13.853612	0ce4ec60-8454-459f-8ada-b540758b3877	\N	20	f	\N	\N	\N	\N
9a2e9029-b940-496e-9a1d-ecf4966437da	f.saidi@rachfort.co.za	$2b$10$t6TkAU6fxoqAcTVL3H/sZuXeU9UqfF7u5XnA2sagihG7CMOgCw3eK	F Saidi	f.saidi@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:15.9891	2026-04-05 20:28:15.9891	0ce4ec60-8454-459f-8ada-b540758b3877	\N	21	f	\N	\N	\N	\N
d37fe61d-086f-4e30-83b5-fde16756eea8	g.laisi@fortai.co.za	$2b$10$hzetw56bHtZAW9VS8k8hieeyz/DnbXS03dsLA5ORnjzR2wUam1tQm	G Laisi	g.laisi@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.057519	2026-04-05 20:28:16.057519	0ce4ec60-8454-459f-8ada-b540758b3877	\N	22	f	\N	\N	\N	\N
62b35c0d-9adf-493c-82c4-5bea0395a3a2	g.magondo@rachfort.co.za	$2b$10$B4kAWPdR5B1C6z.vHHhrq.LcxmaewVAMQVZSpPExuRVQC49axWWAS	G Magondo	g.magondo@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.122726	2026-04-05 20:28:16.122726	0ce4ec60-8454-459f-8ada-b540758b3877	\N	23	f	\N	\N	\N	\N
63d85594-b4ba-4079-996c-6f6659f029f2	i.mugwagwa@fortai.co.za	$2b$10$s.LOv3viUJIrpa2PqXISo.olC8pWJN0yscBb8FSGzkzgtakr3cB7u	I Mugwagwa	i.mugwagwa@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.187647	2026-04-05 20:28:16.187647	0ce4ec60-8454-459f-8ada-b540758b3877	\N	24	f	\N	\N	\N	\N
25266486-c06a-409a-aae3-c3e021cdc09e	j.dzumbira@rachfort.co.za	$2b$10$wwkOwwEgh7C/3Rd2XNS.F.96L/ZQkTeXcue0fLSWqaTSLwncofLWa	J Dzumbira	j.dzumbira@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.252803	2026-04-05 20:28:16.252803	0ce4ec60-8454-459f-8ada-b540758b3877	\N	25	f	\N	\N	\N	\N
89d9a26b-8633-4b86-a199-90d67e2330a8	m.jera@fortai.co.za	$2b$10$lEM1VJwwGqPFhQO/FxZmzu6CecSUt60vbRnoy5M7NF9Z8vzDi/Kz2	M Jera	m.jera@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.318697	2026-04-05 20:28:16.318697	0ce4ec60-8454-459f-8ada-b540758b3877	\N	26	f	\N	\N	\N	\N
618b632f-881e-4932-acaa-d3124be7fcac	m.masike@fortai.co.za	$2b$10$8Ib6OC4a/pagboCUhIkEqegQJ4COCR4MIVoP45.H6mIMJJOKPvupa	M Masike	m.masike@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.385916	2026-04-05 20:28:16.385916	0ce4ec60-8454-459f-8ada-b540758b3877	\N	27	f	\N	\N	\N	\N
36a0847a-ced3-464d-b746-d835f93cfafc	p.cofa@rachfort.co.za	$2b$10$AUNpCuNtJDB3TjNdLONVteXB8lZmAUc66NwvIwFG4DRCKA7Lu/Cd.	P Cofa	p.cofa@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.914679	2026-04-05 20:28:16.914679	0ce4ec60-8454-459f-8ada-b540758b3877	\N	35	f	\N	\N	\N	\N
851d4414-b861-4302-adb6-4244a91a98d2	m.msweli@rachfort.co.za	$2b$10$fe52vPFZuELUcPnx2dUGcud9UEmghVQG7AtLYWo1P/1FiNk1MAIMe	M Msweli	m.msweli@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.452936	2026-04-05 20:28:16.452936	0ce4ec60-8454-459f-8ada-b540758b3877	\N	28	f	\N	\N	\N	\N
149f3b23-ec79-405f-be19-dd3121371a40	m.zingwe@rachfort.co.za	$2b$10$kCp4HLJvtRenDPuoNkoHA.AA4GTzuTqp5f/N5Pa4eEbn2iWNBUth6	M Zingwe	m.zingwe@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.586552	2026-04-05 20:28:16.586552	0ce4ec60-8454-459f-8ada-b540758b3877	\N	30	f	\N	\N	\N	\N
bb15a236-714d-4efc-a598-7631f6ec2e15	n.beza@rachfort.co.za	$2b$10$lLgJpi3WMu.FCT4hj/3NAO6iBXNAFWKdXgf1jtiq0U1iQWGYq31l.	N Beza	n.beza@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.652446	2026-04-05 20:28:16.652446	0ce4ec60-8454-459f-8ada-b540758b3877	\N	31	f	\N	\N	\N	\N
1ed99616-7b21-4c4a-a0ad-4d1521064625	n.njoli@fortai.co.za	$2b$10$TNt0WJkC8WurW1JrMg45m.3A92dohhJkXkKSr10A8MWMhtij.raQu	N Njoli	n.njoli@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.71918	2026-04-05 20:28:16.71918	0ce4ec60-8454-459f-8ada-b540758b3877	\N	32	f	\N	\N	\N	\N
171e059f-0bb2-4629-94c3-a63bd7a46695	n.norushu@rachfort.co.za	$2b$10$s1WrebCqUsYdliM1hfobEuLFAslvl8KHFkkUzfjinfi0pm6Gmwjzm	N Norushu	n.norushu@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.784822	2026-04-05 20:28:16.784822	0ce4ec60-8454-459f-8ada-b540758b3877	\N	33	f	\N	\N	\N	\N
f4d8762e-5dbd-4fd6-916a-e02a34045667	n.nuraan@rachfort.co.za	$2b$10$.6lPUSkpil61X.sEMcvP3eN38TSGWDhleNzHzoG4B2tBpuJUah1Oy	N Nuraan	n.nuraan@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.84961	2026-04-05 20:28:16.84961	0ce4ec60-8454-459f-8ada-b540758b3877	\N	34	f	\N	\N	\N	\N
0ac9325a-ce20-4f6a-8759-2e3855870353	p.kupemba@fortai.co.za	$2b$10$GYYF3.8s3IbrXViDmkqonO8WJ5Gt1HPuqqC/Gonb0JSt26josqvsW	P Kupemba	p.kupemba@fortai.co.za	\N	\N	0.00	t	2026-04-05 20:28:16.980375	2026-04-05 20:28:16.980375	0ce4ec60-8454-459f-8ada-b540758b3877	\N	36	f	\N	\N	\N	\N
5861bae2-6dda-467f-8e90-77271107b6d4	p.lafukani@rachfort.co.za	$2b$10$Q37220b7nCGGWAZB9Cf2gu5pc9hsR4A.enyLuYnfsOdQbLI0wqpXC	P Lafukani	p.lafukani@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.045675	2026-04-05 20:28:17.045675	0ce4ec60-8454-459f-8ada-b540758b3877	\N	37	f	\N	\N	\N	\N
9dca81b7-1fbd-4249-9187-987e60955901	p.manunure@rachfort.co.za	$2b$10$NeX3lOe7BI0MGZB7oNHOKeg6A7KHZ0xMIthP/AgFdeJ/ZwuCCvoEW	P Manunure	p.manunure@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.109674	2026-04-05 20:28:17.109674	0ce4ec60-8454-459f-8ada-b540758b3877	\N	38	f	\N	\N	\N	\N
36833ae8-04ab-45ec-a5d7-d684ac0071e1	p.muzoremba@rachfort.co.za	$2b$10$cTINYl2LzfwMHpOm.nmDcuqDhlo2./NcgF2yaAxq2TMN8UPXLlP7a	P Muzoremba	p.muzoremba@rachfort.co.za	\N	\N	0.00	t	2026-04-05 20:28:17.174842	2026-04-05 20:28:17.174842	0ce4ec60-8454-459f-8ada-b540758b3877	\N	39	f	\N	\N	\N	\N
\.


--
-- TOC entry 5354 (class 0 OID 291096)
-- Dependencies: 233
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vouchers (id, company_id, code, amount, is_used, used_by, used_at, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5128 (class 2606 OID 291447)
-- Name: bandwidth_aggregate_log bandwidth_aggregate_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_aggregate_log
    ADD CONSTRAINT bandwidth_aggregate_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 291432)
-- Name: bandwidth_settings bandwidth_settings_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_settings
    ADD CONSTRAINT bandwidth_settings_company_id_key UNIQUE (company_id);


--
-- TOC entry 5126 (class 2606 OID 291430)
-- Name: bandwidth_settings bandwidth_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_settings
    ADD CONSTRAINT bandwidth_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5119 (class 2606 OID 291401)
-- Name: bandwidth_usage_log bandwidth_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_usage_log
    ADD CONSTRAINT bandwidth_usage_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 291246)
-- Name: billable_items billable_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billable_items
    ADD CONSTRAINT billable_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5040 (class 2606 OID 290736)
-- Name: companies companies_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_email_key UNIQUE (email);


--
-- TOC entry 5042 (class 2606 OID 290734)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- TOC entry 5044 (class 2606 OID 290750)
-- Name: company_admins company_admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_email_key UNIQUE (email);


--
-- TOC entry 5046 (class 2606 OID 290748)
-- Name: company_admins company_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_pkey PRIMARY KEY (id);


--
-- TOC entry 5116 (class 2606 OID 291381)
-- Name: credit_note_items credit_note_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT credit_note_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5110 (class 2606 OID 291342)
-- Name: credit_notes credit_notes_company_id_credit_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_company_id_credit_number_key UNIQUE (company_id, credit_number);


--
-- TOC entry 5112 (class 2606 OID 291340)
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 291036)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 291226)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5090 (class 2606 OID 291191)
-- Name: invoices invoices_company_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_invoice_number_key UNIQUE (company_id, invoice_number);


--
-- TOC entry 5092 (class 2606 OID 291189)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 289725)
-- Name: lead_comments lead_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_comments
    ADD CONSTRAINT lead_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 289693)
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 291151)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5080 (class 2606 OID 291133)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 289704)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5019 (class 2606 OID 289645)
-- Name: plans plans_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_name_key UNIQUE (name);


--
-- TOC entry 5021 (class 2606 OID 289643)
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 291314)
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 291274)
-- Name: quotes quotes_company_id_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_company_id_quote_number_key UNIQUE (company_id, quote_number);


--
-- TOC entry 5105 (class 2606 OID 291272)
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- TOC entry 5050 (class 2606 OID 290770)
-- Name: routers routers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_pkey PRIMARY KEY (id);


--
-- TOC entry 5028 (class 2606 OID 289675)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5062 (class 2606 OID 290999)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 290976)
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 290944)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5070 (class 2606 OID 291078)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5024 (class 2606 OID 289654)
-- Name: user_plans user_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 2606 OID 291061)
-- Name: users users_company_seq_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_seq_id_unique UNIQUE (company_id, seq_id);


--
-- TOC entry 5016 (class 2606 OID 289630)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5074 (class 2606 OID 291105)
-- Name: vouchers vouchers_company_id_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_company_id_code_key UNIQUE (company_id, code);


--
-- TOC entry 5076 (class 2606 OID 291103)
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- TOC entry 5098 (class 1259 OID 291257)
-- Name: idx_billable_items_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billable_items_company ON public.billable_items USING btree (company_id);


--
-- TOC entry 5129 (class 1259 OID 291453)
-- Name: idx_bw_agg_company_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bw_agg_company_time ON public.bandwidth_aggregate_log USING btree (company_id, sampled_at DESC);


--
-- TOC entry 5120 (class 1259 OID 291413)
-- Name: idx_bw_log_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bw_log_company ON public.bandwidth_usage_log USING btree (company_id);


--
-- TOC entry 5121 (class 1259 OID 291414)
-- Name: idx_bw_log_sampled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bw_log_sampled ON public.bandwidth_usage_log USING btree (sampled_at);


--
-- TOC entry 5122 (class 1259 OID 291412)
-- Name: idx_bw_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bw_log_user ON public.bandwidth_usage_log USING btree (user_id);


--
-- TOC entry 5047 (class 1259 OID 290756)
-- Name: idx_company_admins_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_admins_company ON public.company_admins USING btree (company_id);


--
-- TOC entry 5117 (class 1259 OID 291387)
-- Name: idx_credit_note_items_cn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_note_items_cn ON public.credit_note_items USING btree (credit_note_id);


--
-- TOC entry 5113 (class 1259 OID 291368)
-- Name: idx_credit_notes_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_notes_company ON public.credit_notes USING btree (company_id);


--
-- TOC entry 5114 (class 1259 OID 291369)
-- Name: idx_credit_notes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_notes_user ON public.credit_notes USING btree (user_id);


--
-- TOC entry 5065 (class 1259 OID 291057)
-- Name: idx_documents_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_company ON public.documents USING btree (company_id);


--
-- TOC entry 5066 (class 1259 OID 291058)
-- Name: idx_documents_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_user ON public.documents USING btree (user_id);


--
-- TOC entry 5093 (class 1259 OID 291232)
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- TOC entry 5086 (class 1259 OID 291212)
-- Name: idx_invoices_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_company ON public.invoices USING btree (company_id);


--
-- TOC entry 5087 (class 1259 OID 291214)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 5088 (class 1259 OID 291213)
-- Name: idx_invoices_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_user ON public.invoices USING btree (user_id);


--
-- TOC entry 5036 (class 1259 OID 289731)
-- Name: idx_lead_comments_lead; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_comments_lead ON public.lead_comments USING btree (lead_id);


--
-- TOC entry 5029 (class 1259 OID 290799)
-- Name: idx_leads_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_company ON public.leads USING btree (company_id);


--
-- TOC entry 5030 (class 1259 OID 289694)
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- TOC entry 5081 (class 1259 OID 291168)
-- Name: idx_messages_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_company ON public.messages USING btree (company_id);


--
-- TOC entry 5082 (class 1259 OID 291169)
-- Name: idx_messages_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_ticket ON public.messages USING btree (ticket_id);


--
-- TOC entry 5083 (class 1259 OID 291167)
-- Name: idx_messages_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_user ON public.messages USING btree (user_id);


--
-- TOC entry 5077 (class 1259 OID 291139)
-- Name: idx_notifications_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_company ON public.notifications USING btree (company_id);


--
-- TOC entry 5078 (class 1259 OID 291140)
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (company_id, is_read) WHERE (is_read = false);


--
-- TOC entry 5033 (class 1259 OID 289710)
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- TOC entry 5017 (class 1259 OID 290798)
-- Name: idx_plans_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plans_company ON public.plans USING btree (company_id);


--
-- TOC entry 5106 (class 1259 OID 291325)
-- Name: idx_quote_items_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quote_items_quote ON public.quote_items USING btree (quote_id);


--
-- TOC entry 5099 (class 1259 OID 291300)
-- Name: idx_quotes_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_company ON public.quotes USING btree (company_id);


--
-- TOC entry 5100 (class 1259 OID 291302)
-- Name: idx_quotes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_status ON public.quotes USING btree (status);


--
-- TOC entry 5101 (class 1259 OID 291301)
-- Name: idx_quotes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_user ON public.quotes USING btree (user_id);


--
-- TOC entry 5048 (class 1259 OID 290776)
-- Name: idx_routers_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_routers_company ON public.routers USING btree (company_id);


--
-- TOC entry 5025 (class 1259 OID 289682)
-- Name: idx_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_active ON public.sessions USING btree (stop_time) WHERE (stop_time IS NULL);


--
-- TOC entry 5026 (class 1259 OID 289681)
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- TOC entry 5059 (class 1259 OID 291025)
-- Name: idx_tasks_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_company ON public.tasks USING btree (company_id);


--
-- TOC entry 5060 (class 1259 OID 291026)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 5056 (class 1259 OID 290987)
-- Name: idx_ticket_comments_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments USING btree (ticket_id);


--
-- TOC entry 5051 (class 1259 OID 290965)
-- Name: idx_tickets_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_company ON public.tickets USING btree (company_id);


--
-- TOC entry 5052 (class 1259 OID 290967)
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status);


--
-- TOC entry 5053 (class 1259 OID 290966)
-- Name: idx_tickets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_user ON public.tickets USING btree (user_id);


--
-- TOC entry 5067 (class 1259 OID 291095)
-- Name: idx_transactions_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_company ON public.transactions USING btree (company_id);


--
-- TOC entry 5068 (class 1259 OID 291094)
-- Name: idx_transactions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user ON public.transactions USING btree (user_id);


--
-- TOC entry 5022 (class 1259 OID 289665)
-- Name: idx_user_plans_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_plans_user ON public.user_plans USING btree (user_id);


--
-- TOC entry 5012 (class 1259 OID 290797)
-- Name: idx_users_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_company ON public.users USING btree (company_id);


--
-- TOC entry 5071 (class 1259 OID 291122)
-- Name: idx_vouchers_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vouchers_code ON public.vouchers USING btree (code);


--
-- TOC entry 5072 (class 1259 OID 291121)
-- Name: idx_vouchers_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vouchers_company ON public.vouchers USING btree (company_id);


--
-- TOC entry 5193 (class 2606 OID 291448)
-- Name: bandwidth_aggregate_log bandwidth_aggregate_log_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_aggregate_log
    ADD CONSTRAINT bandwidth_aggregate_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 291433)
-- Name: bandwidth_settings bandwidth_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_settings
    ADD CONSTRAINT bandwidth_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 291402)
-- Name: bandwidth_usage_log bandwidth_usage_log_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_usage_log
    ADD CONSTRAINT bandwidth_usage_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5191 (class 2606 OID 291407)
-- Name: bandwidth_usage_log bandwidth_usage_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bandwidth_usage_log
    ADD CONSTRAINT bandwidth_usage_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 291247)
-- Name: billable_items billable_items_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billable_items
    ADD CONSTRAINT billable_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 291252)
-- Name: billable_items billable_items_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billable_items
    ADD CONSTRAINT billable_items_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- TOC entry 5143 (class 2606 OID 290751)
-- Name: company_admins company_admins_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5189 (class 2606 OID 291382)
-- Name: credit_note_items credit_note_items_credit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT credit_note_items_credit_note_id_fkey FOREIGN KEY (credit_note_id) REFERENCES public.credit_notes(id) ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 291343)
-- Name: credit_notes credit_notes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5185 (class 2606 OID 291363)
-- Name: credit_notes credit_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5186 (class 2606 OID 291353)
-- Name: credit_notes credit_notes_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- TOC entry 5187 (class 2606 OID 291358)
-- Name: credit_notes credit_notes_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--
-- TOC entry 5188 (class 2606 OID 291348)
-- Name: credit_notes credit_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 291037)
-- Name: documents documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 291047)
-- Name: documents documents_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- TOC entry 5158 (class 2606 OID 291052)
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5159 (class 2606 OID 291042)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 291227)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 291192)
-- Name: invoices invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5171 (class 2606 OID 291207)
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5172 (class 2606 OID 291202)
-- Name: invoices invoices_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--
-- TOC entry 5173 (class 2606 OID 291197)
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 289726)
-- Name: lead_comments lead_comments_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_comments
    ADD CONSTRAINT lead_comments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 290787)
-- Name: leads leads_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 289711)
-- Name: leads leads_converted_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_converted_to_fkey FOREIGN KEY (converted_to) REFERENCES public.users(id);


--
-- TOC entry 5140 (class 2606 OID 291063)
-- Name: leads leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5167 (class 2606 OID 291152)
-- Name: messages messages_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 291162)
-- Name: messages messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- TOC entry 5169 (class 2606 OID 291157)
-- Name: messages messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 291134)
-- Name: notifications notifications_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 289705)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 290782)
-- Name: plans plans_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 291320)
-- Name: quote_items quote_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.billable_items(id) ON DELETE SET NULL;


--
-- TOC entry 5183 (class 2606 OID 291315)
-- Name: quote_items quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- TOC entry 5177 (class 2606 OID 291275)
-- Name: quotes quotes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5178 (class 2606 OID 291285)
-- Name: quotes quotes_converted_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_converted_to_fkey FOREIGN KEY (converted_to) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- TOC entry 5179 (class 2606 OID 291295)
-- Name: quotes quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5180 (class 2606 OID 291290)
-- Name: quotes quotes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- TOC entry 5181 (class 2606 OID 291280)
-- Name: quotes quotes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5144 (class 2606 OID 290771)
-- Name: routers routers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 290792)
-- Name: sessions sessions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 289676)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 291015)
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5152 (class 2606 OID 291000)
-- Name: tasks tasks_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 291020)
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5154 (class 2606 OID 291010)
-- Name: tasks tasks_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- TOC entry 5155 (class 2606 OID 291005)
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5149 (class 2606 OID 290982)
-- Name: ticket_comments ticket_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5150 (class 2606 OID 290977)
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 290955)
-- Name: tickets tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5146 (class 2606 OID 290945)
-- Name: tickets tickets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 290960)
-- Name: tickets tickets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5148 (class 2606 OID 290950)
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 291079)
-- Name: transactions transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 291089)
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5162 (class 2606 OID 291084)
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 290922)
-- Name: user_plans user_plans_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5134 (class 2606 OID 289660)
-- Name: user_plans user_plans_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE RESTRICT;


--
-- TOC entry 5135 (class 2606 OID 289655)
-- Name: user_plans user_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_plans
    ADD CONSTRAINT user_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 290777)
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 290928)
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5163 (class 2606 OID 291106)
-- Name: vouchers vouchers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 291116)
-- Name: vouchers vouchers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.company_admins(id) ON DELETE SET NULL;


--
-- TOC entry 5165 (class 2606 OID 291111)
-- Name: vouchers vouchers_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-04-21 09:30:08

--
-- PostgreSQL database dump complete
--

