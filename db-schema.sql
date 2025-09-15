--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

-- Started on 2025-09-14 20:37:12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 11580443)
-- Name: flats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flats (
    id bigint NOT NULL,
    company text,
    city text,
    investment text,
    address text,
    ident text,
    area numeric,
    rooms text,
    level integer,
    building text,
    apartment text,
    due_date text,
    price_m2 numeric,
    price_m2_discounted numeric,
    price_full numeric,
    price_full_discounted numeric,
    is_promo boolean,
    ts bigint,
    url text
);


--
-- TOC entry 214 (class 1259 OID 11580442)
-- Name: flats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3341 (class 0 OID 0)
-- Dependencies: 214
-- Name: flats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flats_id_seq OWNED BY public.flats.id;


--
-- TOC entry 221 (class 1259 OID 11580464)
-- Name: garages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garages (
    id bigint NOT NULL,
    company text,
    city text,
    investment text,
    address text,
    ident text,
    kind text,
    level integer,
    price numeric,
    price_discounted text,
    is_promo text,
    ts bigint,
    area text
);


--
-- TOC entry 219 (class 1259 OID 11580462)
-- Name: garages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.garages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3342 (class 0 OID 0)
-- Dependencies: 219
-- Name: garages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.garages_id_seq OWNED BY public.garages.id;


--
-- TOC entry 220 (class 1259 OID 11580463)
-- Name: garages_ts_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.garages_ts_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3343 (class 0 OID 0)
-- Dependencies: 220
-- Name: garages_ts_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.garages_ts_seq OWNED BY public.garages.ts;


--
-- TOC entry 218 (class 1259 OID 11580453)
-- Name: storages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storages (
    id bigint NOT NULL,
    company text,
    city text,
    investment text,
    address text,
    ident text,
    kind text,
    level integer,
    price numeric,
    price_discounted text,
    is_promo text,
    ts bigint,
    area text
);


--
-- TOC entry 216 (class 1259 OID 11580451)
-- Name: storages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.storages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3344 (class 0 OID 0)
-- Dependencies: 216
-- Name: storages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.storages_id_seq OWNED BY public.storages.id;


--
-- TOC entry 217 (class 1259 OID 11580452)
-- Name: storages_ts_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.storages_ts_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3345 (class 0 OID 0)
-- Dependencies: 217
-- Name: storages_ts_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.storages_ts_seq OWNED BY public.storages.ts;


--
-- TOC entry 3185 (class 2604 OID 11580446)
-- Name: flats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flats ALTER COLUMN id SET DEFAULT nextval('public.flats_id_seq'::regclass);


--
-- TOC entry 3187 (class 2604 OID 11580467)
-- Name: garages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garages ALTER COLUMN id SET DEFAULT nextval('public.garages_id_seq'::regclass);


--
-- TOC entry 3186 (class 2604 OID 11580456)
-- Name: storages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storages ALTER COLUMN id SET DEFAULT nextval('public.storages_id_seq'::regclass);


--
-- TOC entry 3189 (class 2606 OID 11580450)
-- Name: flats flats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flats
    ADD CONSTRAINT flats_pkey PRIMARY KEY (id);


--
-- TOC entry 3193 (class 2606 OID 11580472)
-- Name: garages garages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garages
    ADD CONSTRAINT garages_pkey PRIMARY KEY (id);


--
-- TOC entry 3191 (class 2606 OID 11580461)
-- Name: storages storages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storages
    ADD CONSTRAINT storages_pkey PRIMARY KEY (id);


-- Completed on 2025-09-14 20:37:12

--
-- PostgreSQL database dump complete
--

