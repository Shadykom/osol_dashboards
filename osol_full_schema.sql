--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE anon;
ALTER ROLE anon WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticated;
ALTER ROLE authenticated WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticator;
ALTER ROLE authenticator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE collection_admin;
ALTER ROLE collection_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE collection_read;
ALTER ROLE collection_read WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE collection_write;
ALTER ROLE collection_write WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE dashboard_user;
ALTER ROLE dashboard_user WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE pgbouncer;
ALTER ROLE pgbouncer WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE postgres;
ALTER ROLE postgres WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE service_role;
ALTER ROLE service_role WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_admin;
ALTER ROLE supabase_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;
CREATE ROLE supabase_auth_admin;
ALTER ROLE supabase_auth_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_read_only_user;
ALTER ROLE supabase_read_only_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_realtime_admin;
ALTER ROLE supabase_realtime_admin WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_replication_admin;
ALTER ROLE supabase_replication_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE supabase_storage_admin;
ALTER ROLE supabase_storage_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;

--
-- User Configurations
--

--
-- User Config "anon"
--

ALTER ROLE anon SET statement_timeout TO '3s';

--
-- User Config "authenticated"
--

ALTER ROLE authenticated SET statement_timeout TO '8s';

--
-- User Config "authenticator"
--

ALTER ROLE authenticator SET session_preload_libraries TO 'safeupdate';
ALTER ROLE authenticator SET statement_timeout TO '8s';
ALTER ROLE authenticator SET lock_timeout TO '8s';

--
-- User Config "postgres"
--

ALTER ROLE postgres SET search_path TO E'\\$user', 'public', 'extensions';

--
-- User Config "supabase_admin"
--

ALTER ROLE supabase_admin SET search_path TO '$user', 'public', 'auth', 'extensions';
ALTER ROLE supabase_admin SET log_statement TO 'none';

--
-- User Config "supabase_auth_admin"
--

ALTER ROLE supabase_auth_admin SET search_path TO 'auth';
ALTER ROLE supabase_auth_admin SET idle_in_transaction_session_timeout TO '60000';
ALTER ROLE supabase_auth_admin SET log_statement TO 'none';

--
-- User Config "supabase_storage_admin"
--

ALTER ROLE supabase_storage_admin SET search_path TO 'storage';
ALTER ROLE supabase_storage_admin SET log_statement TO 'none';


--
-- Role memberships
--

GRANT anon TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT anon TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticated TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT authenticated TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO supabase_storage_admin WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT collection_admin TO postgres WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY supabase_admin;
GRANT collection_read TO postgres WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY supabase_admin;
GRANT collection_write TO postgres WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY supabase_admin;
GRANT pg_create_subscription TO postgres WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO supabase_read_only_user WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_signal_backend TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT service_role TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT service_role TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT supabase_realtime_admin TO postgres WITH INHERIT TRUE GRANTED BY supabase_admin;






--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

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
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: kastle_banking; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA kastle_banking;


ALTER SCHEMA kastle_banking OWNER TO postgres;

--
-- Name: kastle_collection; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA kastle_collection;


ALTER SCHEMA kastle_collection OWNER TO postgres;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: check_data_lengths(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.check_data_lengths() RETURNS TABLE(table_name text, column_name text, max_length integer, sample_value text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check customer IDs
    RETURN QUERY
    SELECT 'customers'::TEXT, 'customer_id'::TEXT, 
           MAX(LENGTH('CUST001'))::INT, 'CUST001'::TEXT;
    
    -- Check branch IDs
    RETURN QUERY
    SELECT 'branches'::TEXT, 'branch_id'::TEXT, 
           MAX(LENGTH('BR001'))::INT, 'BR001'::TEXT;
    
    -- Check user IDs
    RETURN QUERY
    SELECT 'users'::TEXT, 'user_id'::TEXT, 
           MAX(LENGTH('USR001'))::INT, 'USR001'::TEXT;
    
    -- Check account numbers
    RETURN QUERY
    SELECT 'accounts'::TEXT, 'account_number'::TEXT, 
           MAX(LENGTH('SA0001234567890001'))::INT, 'SA0001234567890001'::TEXT;
END;
$$;


ALTER FUNCTION kastle_banking.check_data_lengths() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: transactions; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.transactions (
    transaction_id bigint NOT NULL,
    transaction_ref character varying(100) DEFAULT ((('TRN'::text || to_char(now(), 'YYYYMMDD'::text)) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    transaction_date timestamp with time zone DEFAULT now(),
    value_date date DEFAULT CURRENT_DATE,
    account_number character varying(20),
    transaction_type_id integer,
    debit_credit character varying(10),
    transaction_amount numeric(18,2) NOT NULL,
    currency_code character varying(3),
    running_balance numeric(18,2),
    contra_account character varying(20),
    channel character varying(30),
    reference_number character varying(100),
    cheque_number character varying(20),
    narration text,
    beneficiary_name character varying(200),
    beneficiary_account character varying(50),
    beneficiary_bank character varying(200),
    status character varying(20),
    approval_status character varying(20),
    approved_by character varying(20),
    reversal_ref character varying(50),
    branch_id character varying(10),
    teller_id character varying(20),
    device_id character varying(100),
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now(),
    posted_at timestamp with time zone,
    CONSTRAINT transactions_channel_check CHECK (((channel)::text = ANY (ARRAY[('BRANCH'::character varying)::text, ('ATM'::character varying)::text, ('INTERNET'::character varying)::text, ('MOBILE'::character varying)::text, ('POS'::character varying)::text, ('CHEQUE'::character varying)::text, ('STANDING_ORDER'::character varying)::text]))),
    CONSTRAINT transactions_debit_credit_check CHECK (((debit_credit)::text = ANY (ARRAY[('DEBIT'::character varying)::text, ('CREDIT'::character varying)::text]))),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text, ('REVERSED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE kastle_banking.transactions OWNER TO postgres;

--
-- Name: create_transaction_with_balance_update(character varying, integer, character varying, numeric, text, character varying); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying) RETURNS kastle_banking.transactions
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_transaction kastle_banking.transactions;
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
    v_customer_id VARCHAR;
BEGIN
    -- Get current balance and lock the row
    SELECT current_balance, customer_id 
    INTO v_current_balance, v_customer_id
    FROM kastle_banking.accounts 
    WHERE account_number = p_account_number 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found: %', p_account_number;
    END IF;
    
    -- Calculate new balance
    IF p_debit_credit = 'CREDIT' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSE
        v_new_balance := v_current_balance - p_amount;
    END IF;
    
    -- Check sufficient balance
    IF p_debit_credit = 'DEBIT' AND v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', v_current_balance, p_amount;
    END IF;
    
    -- Create transaction
    INSERT INTO kastle_banking.transactions (
        account_number, transaction_type_id, debit_credit, 
        transaction_amount, running_balance, narration, 
        channel, status, currency_code
    ) VALUES (
        p_account_number, p_transaction_type_id, p_debit_credit,
        p_amount, v_new_balance, p_narration,
        p_channel, 'COMPLETED', 'SAR'
    ) RETURNING * INTO v_transaction;
    
    -- Update account balance
    UPDATE kastle_banking.accounts 
    SET current_balance = v_new_balance,
        available_balance = v_new_balance,
        last_transaction_date = NOW()
    WHERE account_number = p_account_number;
    
    -- Create notification
    INSERT INTO kastle_banking.realtime_notifications (
        customer_id, notification_type, title, message, data
    ) VALUES (
        v_customer_id,
        'TRANSACTION',
        CASE WHEN p_debit_credit = 'CREDIT' THEN 'تم الإيداع' ELSE 'تم السحب' END,
        'مبلغ ' || p_amount || ' ريال - ' || p_narration,
        jsonb_build_object(
            'transaction_id', v_transaction.transaction_id,
            'amount', p_amount,
            'balance', v_new_balance
        )
    );
    
    RETURN v_transaction;
END;
$$;


ALTER FUNCTION kastle_banking.create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying) OWNER TO postgres;

--
-- Name: generate_collection_case_number(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.generate_collection_case_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := 'COLL' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION kastle_banking.generate_collection_case_number() OWNER TO postgres;

--
-- Name: generate_loan_application_number(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.generate_loan_application_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.application_number IS NULL THEN
        NEW.application_number := 'LOAN' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION kastle_banking.generate_loan_application_number() OWNER TO postgres;

--
-- Name: generate_transaction_ref(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.generate_transaction_ref() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.transaction_ref IS NULL THEN
        NEW.transaction_ref := 'TRN' || to_char(NOW(), 'YYYYMMDDHH24MISS') || floor(random() * 1000)::text;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION kastle_banking.generate_transaction_ref() OWNER TO postgres;

--
-- Name: get_current_customer_id(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.get_current_customer_id() RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id VARCHAR;
BEGIN
    SELECT customer_id INTO v_customer_id
    FROM kastle_banking.auth_user_profiles 
    WHERE auth_user_id = auth.uid();
    
    RETURN v_customer_id;
END;
$$;


ALTER FUNCTION kastle_banking.get_current_customer_id() OWNER TO postgres;

--
-- Name: get_customer_total_balance(character varying); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.get_customer_total_balance(p_customer_id character varying) RETURNS TABLE(total_deposit_balance numeric, total_loan_outstanding numeric, net_worth numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN a.account_type_id IN (
            SELECT type_id FROM kastle_banking.account_types 
            WHERE account_category IN ('SAVINGS', 'CURRENT', 'FIXED_DEPOSIT')
        ) THEN a.current_balance ELSE 0 END), 0)::DECIMAL as total_deposit_balance,
        COALESCE(SUM(CASE WHEN a.account_type_id IN (
            SELECT type_id FROM kastle_banking.account_types 
            WHERE account_category = 'LOAN'
        ) THEN a.current_balance ELSE 0 END), 0)::DECIMAL as total_loan_outstanding,
        COALESCE(SUM(CASE WHEN a.account_type_id IN (
            SELECT type_id FROM kastle_banking.account_types 
            WHERE account_category IN ('SAVINGS', 'CURRENT', 'FIXED_DEPOSIT')
        ) THEN a.current_balance ELSE -a.current_balance END), 0)::DECIMAL as net_worth
    FROM kastle_banking.accounts a
    WHERE a.customer_id = p_customer_id
    AND a.account_status = 'ACTIVE';
END;
$$;


ALTER FUNCTION kastle_banking.get_customer_total_balance(p_customer_id character varying) OWNER TO postgres;

--
-- Name: is_bank_employee(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.is_bank_employee() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM kastle_banking.auth_user_profiles 
        WHERE auth_user_id = auth.uid() 
        AND user_type IN ('EMPLOYEE', 'ADMIN')
    );
END;
$$;


ALTER FUNCTION kastle_banking.is_bank_employee() OWNER TO postgres;

--
-- Name: update_customer_full_name(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.update_customer_full_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.full_name = TRIM(CONCAT(
        NEW.first_name, 
        ' ', 
        COALESCE(NEW.middle_name, ''), 
        ' ', 
        NEW.last_name
    ));
    -- Remove extra spaces
    NEW.full_name = REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g');
    RETURN NEW;
END;
$$;


ALTER FUNCTION kastle_banking.update_customer_full_name() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: kastle_banking; Owner: postgres
--

CREATE FUNCTION kastle_banking.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION kastle_banking.update_updated_at_column() OWNER TO postgres;

--
-- Name: api_get_case_details(integer); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.api_get_case_details(p_case_id integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'case_info', to_jsonb(cc),
        'customer_info', to_jsonb(c),
        'bucket_info', to_jsonb(b),
        'assigned_officer', to_jsonb(o),
        'recent_contacts', (
            SELECT jsonb_agg(to_jsonb(ca))
            FROM kastle_collection.collection_contact_attempts ca
            WHERE ca.case_id = cc.case_id
            ORDER BY ca.attempt_datetime DESC
            LIMIT 10
        ),
        'risk_assessment', (
            SELECT to_jsonb(ra)
            FROM kastle_collection.collection_risk_assessment ra
            WHERE ra.case_id = cc.case_id
            ORDER BY ra.assessment_date DESC
            LIMIT 1
        ),
        'settlement_offers', (
            SELECT jsonb_agg(to_jsonb(so))
            FROM kastle_collection.collection_settlement_offers so
            WHERE so.case_id = cc.case_id
            ORDER BY so.offer_date DESC
        )
    ) INTO v_result
    FROM kastle_banking.collection_cases cc
    LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
    LEFT JOIN kastle_banking.collection_buckets b ON cc.bucket_id = b.bucket_id
    LEFT JOIN kastle_collection.collection_officers o ON cc.assigned_officer_id = o.officer_id
    WHERE cc.case_id = p_case_id;
    
    RETURN v_result;
END;$$;


ALTER FUNCTION kastle_collection.api_get_case_details(p_case_id integer) OWNER TO postgres;

--
-- Name: archive_old_data(integer); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.archive_old_data(p_days_to_keep integer DEFAULT 365) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_archive_date date;
    v_archived_count integer;
BEGIN
    v_archive_date := CURRENT_DATE - p_days_to_keep;
    
    -- Archive old contact attempts
    WITH archived AS (
        DELETE FROM kastle_collection.collection_contact_attempts
        WHERE created_at < v_archive_date
        RETURNING *
    )
    SELECT COUNT(*) INTO v_archived_count FROM archived;
    
    PERFORM kastle_collection.log_performance_metric(
        'archived_contact_attempts', 
        v_archived_count, 
        'records',
        jsonb_build_object('archive_date', v_archive_date)
    );
    
    -- Archive old audit logs
    WITH archived AS (
        DELETE FROM kastle_collection.audit_log
        WHERE created_at < v_archive_date
        RETURNING *
    )
    SELECT COUNT(*) INTO v_archived_count FROM archived;
    
    PERFORM kastle_collection.log_performance_metric(
        'archived_audit_logs', 
        v_archived_count, 
        'records',
        jsonb_build_object('archive_date', v_archive_date)
    );
END;
$$;


ALTER FUNCTION kastle_collection.archive_old_data(p_days_to_keep integer) OWNER TO postgres;

--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.audit_trigger_function() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    audit_user character varying;
    old_data jsonb;
    new_data jsonb;
    changed_fields jsonb = '{}';
    field text;
BEGIN
    -- Get current user (customize based on your auth system)
    audit_user := COALESCE(current_setting('app.current_user', true), session_user);
    
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        INSERT INTO kastle_collection.audit_log (
            table_name, operation, record_id, user_id, old_values
        ) VALUES (
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 
            TG_OP, 
            OLD.id::text, -- Adjust based on your primary key column name
            audit_user, 
            old_data
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields
        FOR field IN SELECT jsonb_object_keys(old_data) LOOP
            IF old_data->field IS DISTINCT FROM new_data->field THEN
                changed_fields := changed_fields || jsonb_build_object(field, true);
            END IF;
        END LOOP;
        
        INSERT INTO kastle_collection.audit_log (
            table_name, operation, record_id, user_id, 
            changed_fields, old_values, new_values
        ) VALUES (
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 
            TG_OP, 
            NEW.id::text, -- Adjust based on your primary key column name
            audit_user, 
            changed_fields, 
            old_data, 
            new_data
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        INSERT INTO kastle_collection.audit_log (
            table_name, operation, record_id, user_id, new_values
        ) VALUES (
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 
            TG_OP, 
            NEW.id::text, -- Adjust based on your primary key column name
            audit_user, 
            new_data
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION kastle_collection.audit_trigger_function() OWNER TO postgres;

--
-- Name: calculate_collection_forecast(integer, integer); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.calculate_collection_forecast(p_bucket_id integer, p_forecast_days integer DEFAULT 30) RETURNS TABLE(forecast_date date, expected_collections numeric, confidence_level numeric, lower_bound numeric, upper_bound numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_historical_rate numeric;
    v_volatility numeric;
    v_current_exposure numeric;
BEGIN
    -- Calculate historical collection rate
    SELECT 
        AVG(collection_rate),
        STDDEV(collection_rate)
    INTO v_historical_rate, v_volatility
    FROM (
        SELECT 
            DATE_TRUNC('month', movement_date) as month,
            SUM(amount_at_movement) / NULLIF(LAG(SUM(amount_at_movement)) OVER (ORDER BY DATE_TRUNC('month', movement_date)), 0) as collection_rate
        FROM kastle_collection.collection_bucket_movement
        WHERE from_bucket_id = p_bucket_id
        AND movement_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', movement_date)
    ) hist;
    
    -- Get current exposure
    SELECT SUM(outstanding_amount)
    INTO v_current_exposure
    FROM kastle_banking.collection_cases
    WHERE bucket_id = p_bucket_id;
    
    -- Generate forecast
    RETURN QUERY
    SELECT 
        CURRENT_DATE + i as forecast_date,
        ROUND(v_current_exposure * v_historical_rate / 30, 2) as expected_collections,
        ROUND(GREATEST(50, 100 - (v_volatility * 100)), 2) as confidence_level,
        ROUND(v_current_exposure * (v_historical_rate - v_volatility) / 30, 2) as lower_bound,
        ROUND(v_current_exposure * (v_historical_rate + v_volatility) / 30, 2) as upper_bound
    FROM generate_series(1, p_forecast_days) i;
END;
$$;


ALTER FUNCTION kastle_collection.calculate_collection_forecast(p_bucket_id integer, p_forecast_days integer) OWNER TO postgres;

--
-- Name: get_collection_efficiency_report(date, date); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.get_collection_efficiency_report(p_start_date date, p_end_date date) RETURNS TABLE(report_date date, total_cases integer, total_amount numeric, collected_amount numeric, collection_rate numeric, avg_days_to_collect numeric, contact_attempts integer, successful_contacts integer, contact_success_rate numeric, settlements_offered integer, settlements_accepted integer, settlement_acceptance_rate numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ca.attempt_datetime) as report_date,
        COUNT(DISTINCT cc.case_id)::integer as total_cases,
        SUM(cc.total_amount) as total_amount,
        SUM(CASE WHEN cc.case_status = 'CLOSED' THEN cc.total_amount - cc.outstanding_amount ELSE 0 END) as collected_amount,
        ROUND(SUM(CASE WHEN cc.case_status = 'CLOSED' THEN cc.total_amount - cc.outstanding_amount ELSE 0 END) / 
              NULLIF(SUM(cc.total_amount), 0) * 100, 2) as collection_rate,
        AVG(CASE WHEN cc.case_status = 'CLOSED' THEN cc.dpd ELSE NULL END) as avg_days_to_collect,
        COUNT(ca.attempt_id)::integer as contact_attempts,
        COUNT(CASE WHEN ca.contact_result = 'CONNECTED' THEN 1 END)::integer as successful_contacts,
        ROUND(COUNT(CASE WHEN ca.contact_result = 'CONNECTED' THEN 1 END)::numeric / 
              NULLIF(COUNT(ca.attempt_id), 0) * 100, 2) as contact_success_rate,
        COUNT(DISTINCT so.offer_id)::integer as settlements_offered,
        COUNT(DISTINCT CASE WHEN so.offer_status = 'ACCEPTED' THEN so.offer_id END)::integer as settlements_accepted,
        ROUND(COUNT(DISTINCT CASE WHEN so.offer_status = 'ACCEPTED' THEN so.offer_id END)::numeric / 
              NULLIF(COUNT(DISTINCT so.offer_id), 0) * 100, 2) as settlement_acceptance_rate
    FROM kastle_banking.collection_cases cc
    LEFT JOIN kastle_collection.collection_contact_attempts ca ON cc.case_id = ca.case_id
    LEFT JOIN kastle_collection.collection_settlement_offers so ON cc.case_id = so.case_id
    WHERE DATE(ca.attempt_datetime) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(ca.attempt_datetime)
    ORDER BY report_date;
END;
$$;


ALTER FUNCTION kastle_collection.get_collection_efficiency_report(p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: log_performance_metric(character varying, numeric, character varying, jsonb); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.log_performance_metric(p_metric_name character varying, p_metric_value numeric, p_metric_unit character varying DEFAULT NULL::character varying, p_additional_info jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO kastle_collection.performance_metrics (
        metric_name, metric_value, metric_unit, additional_info
    ) VALUES (
        p_metric_name, p_metric_value, p_metric_unit, p_additional_info
    );
END;
$$;


ALTER FUNCTION kastle_collection.log_performance_metric(p_metric_name character varying, p_metric_value numeric, p_metric_unit character varying, p_additional_info jsonb) OWNER TO postgres;

--
-- Name: refresh_officer_performance_summary(character varying, date); Type: FUNCTION; Schema: kastle_collection; Owner: postgres
--

CREATE FUNCTION kastle_collection.refresh_officer_performance_summary(p_officer_id character varying DEFAULT NULL::character varying, p_date date DEFAULT CURRENT_DATE) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete existing data for the date
    IF p_officer_id IS NOT NULL THEN
        DELETE FROM kastle_collection.officer_performance_summary 
        WHERE officer_id = p_officer_id AND summary_date = p_date;
    ELSE
        DELETE FROM kastle_collection.officer_performance_summary 
        WHERE summary_date = p_date;
    END IF;
    
    -- Insert new summary data
    INSERT INTO kastle_collection.officer_performance_summary (
        officer_id,
        summary_date,
        total_cases,
        total_portfolio_value,
        total_collected,
        collection_rate,
        total_calls,
        total_messages,
        successful_contacts,
        contact_rate,
        total_ptps,
        ptps_kept,
        ptp_keep_rate
    )
    SELECT 
        co.officer_id,
        p_date,
        COUNT(DISTINCT cc.case_id) as total_cases,
        COALESCE(SUM(cc.total_outstanding), 0) as total_portfolio_value,
        COALESCE(SUM(
            CASE 
                WHEN t.transaction_date::date = p_date 
                AND t.debit_credit = 'CREDIT' 
                THEN t.transaction_amount 
                ELSE 0 
            END
        ), 0) as total_collected,
        CASE 
            WHEN SUM(cc.total_outstanding) > 0 
            THEN (SUM(cc.total_outstanding - cc.total_outstanding) / SUM(cc.total_outstanding)) * 100
            ELSE 0 
        END as collection_rate,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'CALL' THEN ci.interaction_id END) as total_calls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type IN ('SMS', 'EMAIL', 'WHATSAPP') THEN ci.interaction_id END) as total_messages,
        COUNT(DISTINCT CASE WHEN ci.outcome IN ('CONNECTED', 'PROMISE_OBTAINED') THEN ci.interaction_id END) as successful_contacts,
        CASE 
            WHEN COUNT(DISTINCT ci.interaction_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ci.outcome IN ('CONNECTED', 'PROMISE_OBTAINED') THEN ci.interaction_id END)::NUMERIC / COUNT(DISTINCT ci.interaction_id)) * 100
            ELSE 0 
        END as contact_rate,
        COUNT(DISTINCT ptp.ptp_id) as total_ptps,
        COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END) as ptps_kept,
        CASE 
            WHEN COUNT(DISTINCT ptp.ptp_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END)::NUMERIC / COUNT(DISTINCT ptp.ptp_id)) * 100
            ELSE 0 
        END as ptp_keep_rate
    FROM kastle_collection.collection_officers co
    LEFT JOIN kastle_banking.collection_cases cc ON co.officer_id = cc.assigned_to
    LEFT JOIN kastle_collection.collection_interactions ci 
        ON cc.case_id = ci.case_id 
        AND ci.interaction_datetime::date = p_date
    LEFT JOIN kastle_banking.transactions t 
        ON cc.account_number = t.account_number
        AND t.transaction_date::date = p_date
    LEFT JOIN kastle_collection.promise_to_pay ptp 
        ON cc.case_id = ptp.case_id
        AND ptp.created_at::date = p_date
    WHERE (p_officer_id IS NULL OR co.officer_id = p_officer_id)
        AND co.status = 'ACTIVE'
    GROUP BY co.officer_id;
    
END;
$$;


ALTER FUNCTION kastle_collection.refresh_officer_performance_summary(p_officer_id character varying, p_date date) OWNER TO postgres;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: update_officer_performance_summary(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_officer_performance_summary() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO officer_performance_summary (
        officer_id,
        summary_date,
        total_cases,
        total_calls,
        total_messages,
        total_ptps,
        ptps_kept,
        collection_amount,
        collection_rate,
        contact_rate,
        ptp_keep_rate
    )
    SELECT 
        co.officer_id,
        CURRENT_DATE as summary_date,
        COUNT(DISTINCT cc.case_id) as total_cases,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'CALL' THEN ci.interaction_id END) as total_calls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type IN ('SMS', 'EMAIL') THEN ci.interaction_id END) as total_messages,
        COUNT(DISTINCT ptp.ptp_id) as total_ptps,
        COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END) as ptps_kept,
        COALESCE(SUM(p.payment_amount), 0) as collection_amount,
        CASE 
            WHEN SUM(cc.overdue_amount) > 0 
            THEN (SUM(p.payment_amount) / SUM(cc.overdue_amount) * 100)
            ELSE 0 
        END as collection_rate,
        CASE 
            WHEN COUNT(DISTINCT ci.case_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ci.response_received = true THEN ci.case_id END)::DECIMAL / COUNT(DISTINCT ci.case_id) * 100)
            ELSE 0 
        END as contact_rate,
        CASE 
            WHEN COUNT(DISTINCT ptp.ptp_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END)::DECIMAL / COUNT(DISTINCT ptp.ptp_id) * 100)
            ELSE 0 
        END as ptp_keep_rate
    FROM collection_officers co
    LEFT JOIN collection_cases cc ON cc.officer_id = co.officer_id
    LEFT JOIN collection_interactions ci ON ci.officer_id = co.officer_id 
        AND DATE(ci.interaction_datetime) = CURRENT_DATE
    LEFT JOIN promise_to_pay ptp ON ptp.officer_id = co.officer_id 
        AND DATE(ptp.created_at) = CURRENT_DATE
    LEFT JOIN payments p ON p.case_id = cc.case_id 
        AND DATE(p.payment_date) = CURRENT_DATE
    WHERE co.status = 'ACTIVE'
    GROUP BY co.officer_id
    ON CONFLICT (officer_id, summary_date) 
    DO UPDATE SET
        total_cases = EXCLUDED.total_cases,
        total_calls = EXCLUDED.total_calls,
        total_messages = EXCLUDED.total_messages,
        total_ptps = EXCLUDED.total_ptps,
        ptps_kept = EXCLUDED.ptps_kept,
        collection_amount = EXCLUDED.collection_amount,
        collection_rate = EXCLUDED.collection_rate,
        contact_rate = EXCLUDED.contact_rate,
        ptp_keep_rate = EXCLUDED.ptp_keep_rate,
        updated_at = CURRENT_TIMESTAMP;
END;
$$;


ALTER FUNCTION public.update_officer_performance_summary() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: account_types; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.account_types (
    type_id integer NOT NULL,
    type_code character varying(20) NOT NULL,
    type_name character varying(100) NOT NULL,
    account_category character varying(30),
    description text,
    CONSTRAINT account_types_account_category_check CHECK (((account_category)::text = ANY (ARRAY[('SAVINGS'::character varying)::text, ('CURRENT'::character varying)::text, ('FIXED_DEPOSIT'::character varying)::text, ('RECURRING_DEPOSIT'::character varying)::text, ('LOAN'::character varying)::text])))
);


ALTER TABLE kastle_banking.account_types OWNER TO postgres;

--
-- Name: account_types_type_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.account_types_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.account_types_type_id_seq OWNER TO postgres;

--
-- Name: account_types_type_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.account_types_type_id_seq OWNED BY kastle_banking.account_types.type_id;


--
-- Name: accounts; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.accounts (
    account_id integer NOT NULL,
    account_number character varying(20) NOT NULL,
    customer_id character varying(20),
    account_type_id integer,
    product_id integer,
    branch_id character varying(10),
    currency_code character varying(3) DEFAULT 'SAR'::character varying,
    account_status character varying(20),
    opening_date date DEFAULT CURRENT_DATE,
    closing_date date,
    current_balance numeric(18,2) DEFAULT 0,
    available_balance numeric(18,2) DEFAULT 0,
    hold_amount numeric(18,2) DEFAULT 0,
    unclear_balance numeric(18,2) DEFAULT 0,
    minimum_balance numeric(18,2) DEFAULT 0,
    overdraft_limit numeric(18,2) DEFAULT 0,
    interest_rate numeric(5,2),
    last_transaction_date timestamp with time zone,
    maturity_date date,
    joint_holder_ids jsonb,
    nominee_details jsonb,
    is_salary_account boolean DEFAULT false,
    is_minor_account boolean DEFAULT false,
    guardian_id character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT accounts_account_status_check CHECK (((account_status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('DORMANT'::character varying)::text, ('FROZEN'::character varying)::text, ('CLOSED'::character varying)::text, ('BLOCKED'::character varying)::text])))
);


ALTER TABLE kastle_banking.accounts OWNER TO postgres;

--
-- Name: accounts_account_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.accounts_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.accounts_account_id_seq OWNER TO postgres;

--
-- Name: accounts_account_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.accounts_account_id_seq OWNED BY kastle_banking.accounts.account_id;


--
-- Name: aging_buckets; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.aging_buckets (
    id integer NOT NULL,
    bucket_name character varying(100) NOT NULL,
    min_days integer NOT NULL,
    max_days integer,
    display_order integer NOT NULL,
    color_code character varying(7),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.aging_buckets OWNER TO postgres;

--
-- Name: aging_buckets_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.aging_buckets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.aging_buckets_id_seq OWNER TO postgres;

--
-- Name: aging_buckets_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.aging_buckets_id_seq OWNED BY kastle_banking.aging_buckets.id;


--
-- Name: delinquencies; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.delinquencies (
    id integer NOT NULL,
    loan_account_id integer,
    customer_id character varying(20),
    outstanding_amount numeric(15,2) NOT NULL,
    days_past_due integer NOT NULL,
    aging_bucket_id integer,
    last_payment_date date,
    last_payment_amount numeric(15,2),
    next_due_date date,
    collection_status character varying(50),
    risk_rating character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.delinquencies OWNER TO postgres;

--
-- Name: aging_distribution; Type: VIEW; Schema: kastle_banking; Owner: postgres
--

CREATE VIEW kastle_banking.aging_distribution AS
 SELECT ab.bucket_name,
    ab.display_order,
    ab.color_code,
    count(d.id) AS account_count,
    COALESCE(sum(d.outstanding_amount), (0)::numeric) AS total_amount,
    round(((COALESCE(sum(d.outstanding_amount), (0)::numeric) * 100.0) / NULLIF(sum(sum(d.outstanding_amount)) OVER (), (0)::numeric)), 2) AS percentage
   FROM (kastle_banking.aging_buckets ab
     LEFT JOIN kastle_banking.delinquencies d ON ((ab.id = d.aging_bucket_id)))
  GROUP BY ab.id, ab.bucket_name, ab.display_order, ab.color_code
  ORDER BY ab.display_order;


ALTER VIEW kastle_banking.aging_distribution OWNER TO postgres;

--
-- Name: audit_trail; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.audit_trail (
    audit_id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id character varying(100),
    action character varying(20),
    user_id character varying(20),
    auth_user_id uuid,
    user_ip character varying(45),
    old_values jsonb,
    new_values jsonb,
    action_timestamp timestamp with time zone DEFAULT now(),
    session_id character varying(100),
    remarks text,
    CONSTRAINT audit_trail_action_check CHECK (((action)::text = ANY (ARRAY[('INSERT'::character varying)::text, ('UPDATE'::character varying)::text, ('DELETE'::character varying)::text, ('SELECT'::character varying)::text])))
);


ALTER TABLE kastle_banking.audit_trail OWNER TO postgres;

--
-- Name: audit_trail_audit_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.audit_trail_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.audit_trail_audit_id_seq OWNER TO postgres;

--
-- Name: audit_trail_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.audit_trail_audit_id_seq OWNED BY kastle_banking.audit_trail.audit_id;


--
-- Name: auth_user_profiles; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.auth_user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auth_user_id uuid,
    bank_user_id character varying(20),
    customer_id character varying(20),
    user_type character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT auth_user_profiles_user_type_check CHECK (((user_type)::text = ANY (ARRAY[('CUSTOMER'::character varying)::text, ('EMPLOYEE'::character varying)::text, ('ADMIN'::character varying)::text])))
);


ALTER TABLE kastle_banking.auth_user_profiles OWNER TO postgres;

--
-- Name: bank_config; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.bank_config (
    config_id integer NOT NULL,
    bank_code character varying(20) NOT NULL,
    bank_name character varying(100) NOT NULL,
    head_office_address text,
    swift_code character varying(11),
    routing_number character varying(50),
    regulatory_license character varying(50),
    fiscal_year_start date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.bank_config OWNER TO postgres;

--
-- Name: bank_config_config_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.bank_config_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.bank_config_config_id_seq OWNER TO postgres;

--
-- Name: bank_config_config_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.bank_config_config_id_seq OWNED BY kastle_banking.bank_config.config_id;


--
-- Name: branch_collection_performance; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.branch_collection_performance (
    id integer NOT NULL,
    branch_id character varying(10),
    period_date date NOT NULL,
    total_delinquent_amount numeric(15,2) NOT NULL,
    total_collected_amount numeric(15,2) NOT NULL,
    collection_rate numeric(5,2) NOT NULL,
    number_of_accounts integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.branch_collection_performance OWNER TO postgres;

--
-- Name: branch_collection_performance_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.branch_collection_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.branch_collection_performance_id_seq OWNER TO postgres;

--
-- Name: branch_collection_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.branch_collection_performance_id_seq OWNED BY kastle_banking.branch_collection_performance.id;


--
-- Name: branches; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.branches (
    branch_id character varying(10) NOT NULL,
    branch_name character varying(100) NOT NULL,
    branch_type character varying(20),
    address text,
    city character varying(50),
    state character varying(50),
    country_code character varying(3),
    postal_code character varying(20),
    phone character varying(20),
    email character varying(100),
    manager_id character varying(20),
    opening_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT branches_branch_type_check CHECK (((branch_type)::text = ANY (ARRAY[('HEAD_OFFICE'::character varying)::text, ('MAIN'::character varying)::text, ('SUB'::character varying)::text, ('RURAL'::character varying)::text, ('URBAN'::character varying)::text])))
);


ALTER TABLE kastle_banking.branches OWNER TO postgres;

--
-- Name: collection_buckets; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.collection_buckets (
    bucket_id integer NOT NULL,
    bucket_code character varying(20) NOT NULL,
    bucket_name character varying(100) NOT NULL,
    min_dpd integer NOT NULL,
    max_dpd integer NOT NULL,
    priority_level integer NOT NULL,
    collection_strategy character varying(50),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.collection_buckets OWNER TO postgres;

--
-- Name: collection_buckets_bucket_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.collection_buckets_bucket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.collection_buckets_bucket_id_seq OWNER TO postgres;

--
-- Name: collection_buckets_bucket_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.collection_buckets_bucket_id_seq OWNED BY kastle_banking.collection_buckets.bucket_id;


--
-- Name: collection_cases; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.collection_cases (
    case_id integer NOT NULL,
    case_number character varying(50) DEFAULT ((('COLL'::text || to_char(now(), 'YYYYMMDD'::text)) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    customer_id character varying(20),
    account_number character varying(20),
    account_type character varying(30),
    loan_account_number character varying(20),
    card_number character varying(16),
    bucket_id integer,
    total_outstanding numeric(18,2) NOT NULL,
    principal_outstanding numeric(18,2),
    interest_outstanding numeric(18,2),
    penalty_outstanding numeric(18,2),
    other_charges numeric(18,2),
    days_past_due integer NOT NULL,
    last_payment_date date,
    last_payment_amount numeric(18,2),
    case_status character varying(30),
    assigned_to character varying(20),
    assignment_date date,
    priority character varying(20),
    branch_id character varying(10),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_amount bigint,
    CONSTRAINT collection_cases_account_type_check CHECK (((account_type)::text = ANY (ARRAY[('LOAN'::character varying)::text, ('CREDIT_CARD'::character varying)::text, ('OVERDRAFT'::character varying)::text, ('OTHER'::character varying)::text]))),
    CONSTRAINT collection_cases_case_status_check CHECK (((case_status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('RESOLVED'::character varying)::text, ('LEGAL'::character varying)::text, ('WRITTEN_OFF'::character varying)::text, ('SETTLED'::character varying)::text, ('CLOSED'::character varying)::text]))),
    CONSTRAINT collection_cases_priority_check CHECK (((priority)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text])))
);


ALTER TABLE kastle_banking.collection_cases OWNER TO postgres;

--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.collection_cases_case_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.collection_cases_case_id_seq OWNER TO postgres;

--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.collection_cases_case_id_seq OWNED BY kastle_banking.collection_cases.case_id;


--
-- Name: collection_rates; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.collection_rates (
    id integer NOT NULL,
    period_type character varying(20) NOT NULL,
    period_date date NOT NULL,
    total_delinquent_amount numeric(15,2) NOT NULL,
    total_collected_amount numeric(15,2) NOT NULL,
    collection_rate numeric(5,2) NOT NULL,
    number_of_accounts integer NOT NULL,
    number_of_accounts_collected integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.collection_rates OWNER TO postgres;

--
-- Name: collection_rates_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.collection_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.collection_rates_id_seq OWNER TO postgres;

--
-- Name: collection_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.collection_rates_id_seq OWNED BY kastle_banking.collection_rates.id;


--
-- Name: countries; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.countries (
    country_code character varying(3) NOT NULL,
    country_name character varying(100) NOT NULL,
    iso_code character varying(2),
    currency_code character varying(3),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.countries OWNER TO postgres;

--
-- Name: currencies; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.currencies (
    currency_code character varying(3) NOT NULL,
    currency_name character varying(50) NOT NULL,
    currency_symbol character varying(5),
    decimal_places integer DEFAULT 2,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.currencies OWNER TO postgres;

--
-- Name: customer_addresses; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.customer_addresses (
    address_id integer NOT NULL,
    customer_id character varying(20),
    address_type character varying(20),
    address_line1 character varying(200) NOT NULL,
    address_line2 character varying(200),
    city character varying(100) NOT NULL,
    state character varying(100),
    country_code character varying(3),
    postal_code character varying(20),
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT customer_addresses_address_type_check CHECK (((address_type)::text = ANY (ARRAY[('PERMANENT'::character varying)::text, ('CORRESPONDENCE'::character varying)::text, ('OFFICE'::character varying)::text, ('TEMPORARY'::character varying)::text])))
);


ALTER TABLE kastle_banking.customer_addresses OWNER TO postgres;

--
-- Name: customer_addresses_address_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.customer_addresses_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.customer_addresses_address_id_seq OWNER TO postgres;

--
-- Name: customer_addresses_address_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.customer_addresses_address_id_seq OWNED BY kastle_banking.customer_addresses.address_id;


--
-- Name: customer_contacts; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.customer_contacts (
    contact_id integer NOT NULL,
    customer_id character varying(20),
    contact_type character varying(20),
    contact_value character varying(100) NOT NULL,
    is_primary boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    verified_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT customer_contacts_contact_type_check CHECK (((contact_type)::text = ANY (ARRAY[('MOBILE'::character varying)::text, ('HOME'::character varying)::text, ('WORK'::character varying)::text, ('EMAIL'::character varying)::text, ('FAX'::character varying)::text])))
);


ALTER TABLE kastle_banking.customer_contacts OWNER TO postgres;

--
-- Name: customer_contacts_contact_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.customer_contacts_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.customer_contacts_contact_id_seq OWNER TO postgres;

--
-- Name: customer_contacts_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.customer_contacts_contact_id_seq OWNED BY kastle_banking.customer_contacts.contact_id;


--
-- Name: customer_documents; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.customer_documents (
    document_id integer NOT NULL,
    customer_id character varying(20),
    document_type character varying(50) NOT NULL,
    document_number character varying(100),
    issuing_authority character varying(200),
    issue_date date,
    expiry_date date,
    document_path character varying(500),
    document_url text,
    bucket_name character varying(100) DEFAULT 'customer-documents'::character varying,
    verification_status character varying(20) DEFAULT 'PENDING'::character varying,
    verified_by character varying(20),
    verified_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.customer_documents OWNER TO postgres;

--
-- Name: customer_documents_document_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.customer_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.customer_documents_document_id_seq OWNER TO postgres;

--
-- Name: customer_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.customer_documents_document_id_seq OWNED BY kastle_banking.customer_documents.document_id;


--
-- Name: customer_types; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.customer_types (
    type_id integer NOT NULL,
    type_code character varying(20) NOT NULL,
    type_name character varying(50) NOT NULL,
    description text
);


ALTER TABLE kastle_banking.customer_types OWNER TO postgres;

--
-- Name: customer_types_type_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.customer_types_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.customer_types_type_id_seq OWNER TO postgres;

--
-- Name: customer_types_type_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.customer_types_type_id_seq OWNED BY kastle_banking.customer_types.type_id;


--
-- Name: customers; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.customers (
    customer_id character varying(20) NOT NULL,
    auth_user_id uuid,
    customer_type_id integer,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    full_name character varying(300),
    gender character varying(10),
    date_of_birth date,
    nationality character varying(3),
    marital_status character varying(20),
    education_level character varying(50),
    occupation character varying(100),
    annual_income numeric(18,2),
    income_source character varying(100),
    tax_id character varying(50),
    employer_name character varying(200),
    employment_type character varying(50),
    preferred_language character varying(20) DEFAULT 'ENGLISH'::character varying,
    segment character varying(30),
    relationship_manager character varying(20),
    onboarding_branch character varying(10),
    onboarding_date date DEFAULT CURRENT_DATE,
    kyc_status character varying(20) DEFAULT 'PENDING'::character varying,
    risk_category character varying(20),
    is_active boolean DEFAULT true,
    is_pep boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT customers_gender_check CHECK (((gender)::text = ANY (ARRAY[('MALE'::character varying)::text, ('FEMALE'::character varying)::text, ('OTHER'::character varying)::text]))),
    CONSTRAINT customers_marital_status_check CHECK (((marital_status)::text = ANY (ARRAY[('SINGLE'::character varying)::text, ('MARRIED'::character varying)::text, ('DIVORCED'::character varying)::text, ('WIDOWED'::character varying)::text]))),
    CONSTRAINT customers_risk_category_check CHECK (((risk_category)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('VERY_HIGH'::character varying)::text]))),
    CONSTRAINT customers_segment_check CHECK (((segment)::text = ANY (ARRAY[('RETAIL'::character varying)::text, ('PREMIUM'::character varying)::text, ('HNI'::character varying)::text, ('CORPORATE'::character varying)::text, ('SME'::character varying)::text])))
);


ALTER TABLE kastle_banking.customers OWNER TO postgres;

--
-- Name: delinquencies_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.delinquencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.delinquencies_id_seq OWNER TO postgres;

--
-- Name: delinquencies_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.delinquencies_id_seq OWNED BY kastle_banking.delinquencies.id;


--
-- Name: delinquency_history; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.delinquency_history (
    id integer NOT NULL,
    delinquency_id integer,
    snapshot_date date NOT NULL,
    outstanding_amount numeric(15,2) NOT NULL,
    days_past_due integer NOT NULL,
    aging_bucket_id integer,
    collection_status character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.delinquency_history OWNER TO postgres;

--
-- Name: delinquency_history_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.delinquency_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.delinquency_history_id_seq OWNER TO postgres;

--
-- Name: delinquency_history_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.delinquency_history_id_seq OWNED BY kastle_banking.delinquency_history.id;


--
-- Name: portfolio_summary; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.portfolio_summary (
    id integer NOT NULL,
    snapshot_date date NOT NULL,
    total_portfolio_value numeric(15,2) NOT NULL,
    total_delinquent_value numeric(15,2) NOT NULL,
    delinquency_rate numeric(5,2) NOT NULL,
    total_loans integer NOT NULL,
    delinquent_loans integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE kastle_banking.portfolio_summary OWNER TO postgres;

--
-- Name: executive_delinquency_summary; Type: VIEW; Schema: kastle_banking; Owner: postgres
--

CREATE VIEW kastle_banking.executive_delinquency_summary AS
 SELECT ps.snapshot_date,
    ps.total_portfolio_value,
    ps.total_delinquent_value,
    ps.delinquency_rate,
    ps.total_loans,
    ps.delinquent_loans,
    cr.collection_rate AS monthly_collection_rate,
    lag(ps.delinquency_rate, 1) OVER (ORDER BY ps.snapshot_date) AS prev_month_delinquency_rate,
    lag(ps.delinquency_rate, 3) OVER (ORDER BY ps.snapshot_date) AS prev_quarter_delinquency_rate,
    lag(ps.delinquency_rate, 12) OVER (ORDER BY ps.snapshot_date) AS prev_year_delinquency_rate
   FROM (kastle_banking.portfolio_summary ps
     LEFT JOIN kastle_banking.collection_rates cr ON (((ps.snapshot_date = cr.period_date) AND ((cr.period_type)::text = 'MONTHLY'::text))))
  ORDER BY ps.snapshot_date DESC;


ALTER VIEW kastle_banking.executive_delinquency_summary OWNER TO postgres;

--
-- Name: loan_accounts; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.loan_accounts (
    loan_account_id integer NOT NULL,
    loan_account_number character varying(20) NOT NULL,
    application_id integer,
    customer_id character varying(20),
    product_id integer,
    principal_amount numeric(18,2) NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    tenure_months integer NOT NULL,
    emi_amount numeric(18,2),
    disbursement_date date,
    first_emi_date date,
    maturity_date date,
    outstanding_principal numeric(18,2),
    outstanding_interest numeric(18,2),
    total_interest_paid numeric(18,2) DEFAULT 0,
    total_principal_paid numeric(18,2) DEFAULT 0,
    overdue_amount numeric(18,2) DEFAULT 0,
    overdue_days integer DEFAULT 0,
    loan_status character varying(30),
    npa_date date,
    settlement_amount numeric(18,2),
    settlement_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    outstanding_balance bigint,
    CONSTRAINT loan_accounts_loan_status_check CHECK (((loan_status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('CLOSED'::character varying)::text, ('NPA'::character varying)::text, ('WRITTEN_OFF'::character varying)::text, ('RESTRUCTURED'::character varying)::text, ('FORECLOSED'::character varying)::text])))
);


ALTER TABLE kastle_banking.loan_accounts OWNER TO postgres;

--
-- Name: loan_accounts_loan_account_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq OWNER TO postgres;

--
-- Name: loan_accounts_loan_account_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq OWNED BY kastle_banking.loan_accounts.loan_account_id;


--
-- Name: loan_applications; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.loan_applications (
    application_id integer NOT NULL,
    application_number character varying(50) DEFAULT ((('LOAN'::text || to_char(now(), 'YYYYMMDD'::text)) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    customer_id character varying(20),
    product_id integer,
    requested_amount numeric(18,2) NOT NULL,
    approved_amount numeric(18,2),
    tenure_months integer NOT NULL,
    interest_rate numeric(5,2),
    purpose character varying(200),
    collateral_details jsonb,
    guarantor_details jsonb,
    application_date date DEFAULT CURRENT_DATE,
    application_status character varying(30),
    rejection_reason text,
    credit_score integer,
    risk_rating character varying(20),
    processing_fee numeric(18,2),
    insurance_premium numeric(18,2),
    branch_id character varying(10),
    relationship_officer character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loan_applications_application_status_check CHECK (((application_status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('SUBMITTED'::character varying)::text, ('UNDER_REVIEW'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('DISBURSED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE kastle_banking.loan_applications OWNER TO postgres;

--
-- Name: loan_applications_application_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.loan_applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.loan_applications_application_id_seq OWNER TO postgres;

--
-- Name: loan_applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.loan_applications_application_id_seq OWNED BY kastle_banking.loan_applications.application_id;


--
-- Name: portfolio_summary_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.portfolio_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.portfolio_summary_id_seq OWNER TO postgres;

--
-- Name: portfolio_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.portfolio_summary_id_seq OWNED BY kastle_banking.portfolio_summary.id;


--
-- Name: product_categories; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.product_categories (
    category_id integer NOT NULL,
    category_code character varying(20) NOT NULL,
    category_name character varying(100) NOT NULL,
    category_type character varying(30),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_categories_category_type_check CHECK (((category_type)::text = ANY (ARRAY[('DEPOSIT'::character varying)::text, ('LOAN'::character varying)::text, ('CARD'::character varying)::text, ('INVESTMENT'::character varying)::text, ('INSURANCE'::character varying)::text])))
);


ALTER TABLE kastle_banking.product_categories OWNER TO postgres;

--
-- Name: product_categories_category_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.product_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.product_categories_category_id_seq OWNER TO postgres;

--
-- Name: product_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.product_categories_category_id_seq OWNED BY kastle_banking.product_categories.category_id;


--
-- Name: products; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.products (
    product_id integer NOT NULL,
    product_code character varying(50) NOT NULL,
    product_name character varying(100) NOT NULL,
    category_id integer,
    product_type character varying(50),
    min_balance numeric(18,2) DEFAULT 0,
    max_balance numeric(18,2),
    interest_rate numeric(5,2),
    tenure_months integer,
    features jsonb,
    eligibility_criteria jsonb,
    documents_required jsonb,
    is_active boolean DEFAULT true,
    launch_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.products OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.products_product_id_seq OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.products_product_id_seq OWNED BY kastle_banking.products.product_id;


--
-- Name: realtime_notifications; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.realtime_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying(20),
    notification_type character varying(50),
    title character varying(200),
    message text,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_banking.realtime_notifications OWNER TO postgres;

--
-- Name: top_delinquent_customers; Type: VIEW; Schema: kastle_banking; Owner: postgres
--

CREATE VIEW kastle_banking.top_delinquent_customers AS
 SELECT c.customer_id,
    (((c.first_name)::text || ' '::text) || (COALESCE(c.last_name, ''::character varying))::text) AS customer_name,
    c.customer_id AS customer_number,
    count(DISTINCT d.loan_account_id) AS delinquent_accounts,
    sum(d.outstanding_amount) AS total_outstanding,
    max(d.days_past_due) AS max_days_past_due,
    string_agg(DISTINCT (d.collection_status)::text, ', '::text) AS collection_statuses
   FROM (kastle_banking.customers c
     JOIN kastle_banking.delinquencies d ON (((c.customer_id)::text = (d.customer_id)::text)))
  GROUP BY c.customer_id, c.first_name, c.last_name
  ORDER BY (sum(d.outstanding_amount)) DESC
 LIMIT 20;


ALTER VIEW kastle_banking.top_delinquent_customers OWNER TO postgres;

--
-- Name: transaction_types; Type: TABLE; Schema: kastle_banking; Owner: postgres
--

CREATE TABLE kastle_banking.transaction_types (
    type_id integer NOT NULL,
    type_code character varying(30) NOT NULL,
    type_name character varying(100) NOT NULL,
    transaction_category character varying(30),
    affects_balance boolean DEFAULT true,
    requires_approval boolean DEFAULT false,
    min_amount numeric(18,2),
    max_amount numeric(18,2),
    charge_applicable boolean DEFAULT false,
    CONSTRAINT transaction_types_transaction_category_check CHECK (((transaction_category)::text = ANY (ARRAY[('DEBIT'::character varying)::text, ('CREDIT'::character varying)::text, ('TRANSFER'::character varying)::text, ('CHARGE'::character varying)::text, ('INTEREST'::character varying)::text, ('REVERSAL'::character varying)::text])))
);


ALTER TABLE kastle_banking.transaction_types OWNER TO postgres;

--
-- Name: transaction_types_type_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.transaction_types_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.transaction_types_type_id_seq OWNER TO postgres;

--
-- Name: transaction_types_type_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.transaction_types_type_id_seq OWNED BY kastle_banking.transaction_types.type_id;


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: kastle_banking; Owner: postgres
--

CREATE SEQUENCE kastle_banking.transactions_transaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_banking.transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_banking; Owner: postgres
--

ALTER SEQUENCE kastle_banking.transactions_transaction_id_seq OWNED BY kastle_banking.transactions.transaction_id;


--
-- Name: vw_customer_dashboard; Type: VIEW; Schema: kastle_banking; Owner: postgres
--

CREATE VIEW kastle_banking.vw_customer_dashboard AS
 SELECT c.customer_id,
    c.full_name,
    c.segment,
    count(DISTINCT a.account_number) AS total_accounts,
    count(DISTINCT la.loan_account_number) AS total_loans,
    sum(
        CASE
            WHEN ((at.account_category)::text = ANY (ARRAY[('SAVINGS'::character varying)::text, ('CURRENT'::character varying)::text])) THEN a.current_balance
            ELSE (0)::numeric
        END) AS total_deposits,
    sum(
        CASE
            WHEN ((la.loan_status)::text = 'ACTIVE'::text) THEN la.outstanding_principal
            ELSE (0)::numeric
        END) AS total_loans_outstanding,
    max(t.transaction_date) AS last_transaction_date
   FROM ((((kastle_banking.customers c
     LEFT JOIN kastle_banking.accounts a ON (((c.customer_id)::text = (a.customer_id)::text)))
     LEFT JOIN kastle_banking.account_types at ON ((a.account_type_id = at.type_id)))
     LEFT JOIN kastle_banking.loan_accounts la ON (((c.customer_id)::text = (la.customer_id)::text)))
     LEFT JOIN kastle_banking.transactions t ON (((a.account_number)::text = (t.account_number)::text)))
  WHERE ((c.customer_id)::text = (kastle_banking.get_current_customer_id())::text)
  GROUP BY c.customer_id, c.full_name, c.segment;


ALTER VIEW kastle_banking.vw_customer_dashboard OWNER TO postgres;

--
-- Name: vw_recent_transactions; Type: VIEW; Schema: kastle_banking; Owner: postgres
--

CREATE VIEW kastle_banking.vw_recent_transactions AS
 SELECT t.transaction_id,
    t.transaction_date,
    t.account_number,
    a.customer_id,
    t.debit_credit,
    t.transaction_amount,
    t.narration,
    t.running_balance,
    t.channel,
    t.status
   FROM (kastle_banking.transactions t
     JOIN kastle_banking.accounts a ON (((t.account_number)::text = (a.account_number)::text)))
  WHERE ((a.customer_id)::text = (kastle_banking.get_current_customer_id())::text)
  ORDER BY t.transaction_date DESC
 LIMIT 50;


ALTER VIEW kastle_banking.vw_recent_transactions OWNER TO postgres;

--
-- Name: access_log; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.access_log (
    access_id bigint NOT NULL,
    user_id character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id character varying,
    action character varying NOT NULL,
    access_granted boolean DEFAULT true,
    denial_reason character varying,
    ip_address inet,
    session_id character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.access_log OWNER TO postgres;

--
-- Name: access_log_access_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.access_log_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.access_log_access_id_seq OWNER TO postgres;

--
-- Name: access_log_access_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.access_log_access_id_seq OWNED BY kastle_collection.access_log.access_id;


--
-- Name: audit_log; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.audit_log (
    audit_id bigint NOT NULL,
    table_name character varying NOT NULL,
    operation character varying,
    record_id character varying NOT NULL,
    user_id character varying NOT NULL,
    changed_fields jsonb,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_log_operation_check CHECK (((operation)::text = ANY (ARRAY[('INSERT'::character varying)::text, ('UPDATE'::character varying)::text, ('DELETE'::character varying)::text])))
);


ALTER TABLE kastle_collection.audit_log OWNER TO postgres;

--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.audit_log_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.audit_log_audit_id_seq OWNER TO postgres;

--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.audit_log_audit_id_seq OWNED BY kastle_collection.audit_log.audit_id;


--
-- Name: collection_audit_trail; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_audit_trail (
    audit_id integer NOT NULL,
    user_id character varying(20),
    action_type character varying(50),
    entity_type character varying(50),
    entity_id character varying(100),
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    action_timestamp timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_audit_trail OWNER TO postgres;

--
-- Name: collection_audit_trail_audit_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq OWNER TO postgres;

--
-- Name: collection_audit_trail_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq OWNED BY kastle_collection.collection_audit_trail.audit_id;


--
-- Name: collection_automation_metrics; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_automation_metrics (
    metric_id integer NOT NULL,
    metric_date date NOT NULL,
    automation_type character varying,
    total_attempts integer,
    successful_contacts integer,
    payments_collected integer,
    amount_collected numeric,
    cost_saved numeric,
    efficiency_gain numeric,
    error_rate numeric,
    customer_satisfaction_score numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_automation_metrics_automation_type_check CHECK (((automation_type)::text = ANY (ARRAY[('AUTO_DIALER'::character varying)::text, ('SMS_CAMPAIGN'::character varying)::text, ('EMAIL_CAMPAIGN'::character varying)::text, ('CHATBOT'::character varying)::text, ('IVR'::character varying)::text, ('PREDICTIVE_DIALER'::character varying)::text, ('AI_SCORING'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_automation_metrics OWNER TO postgres;

--
-- Name: collection_automation_metrics_metric_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq OWNER TO postgres;

--
-- Name: collection_automation_metrics_metric_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq OWNED BY kastle_collection.collection_automation_metrics.metric_id;


--
-- Name: collection_benchmarks; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_benchmarks (
    benchmark_id integer NOT NULL,
    benchmark_date date NOT NULL,
    benchmark_type character varying,
    metric_name character varying NOT NULL,
    internal_value numeric,
    industry_average numeric,
    best_in_class numeric,
    percentile_rank numeric,
    gap_to_average numeric,
    gap_to_best numeric,
    source character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_benchmarks OWNER TO postgres;

--
-- Name: collection_benchmarks_benchmark_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq OWNER TO postgres;

--
-- Name: collection_benchmarks_benchmark_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq OWNED BY kastle_collection.collection_benchmarks.benchmark_id;


--
-- Name: collection_bucket_movement; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_bucket_movement (
    movement_id integer NOT NULL,
    case_id integer,
    from_bucket_id integer,
    to_bucket_id integer,
    movement_date date NOT NULL,
    movement_reason character varying,
    days_in_previous_bucket integer,
    amount_at_movement numeric,
    officer_id character varying,
    automated_movement boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_bucket_movement OWNER TO postgres;

--
-- Name: collection_bucket_movement_movement_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq OWNER TO postgres;

--
-- Name: collection_bucket_movement_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq OWNED BY kastle_collection.collection_bucket_movement.movement_id;


--
-- Name: collection_call_records; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_call_records (
    call_id integer NOT NULL,
    interaction_id integer,
    phone_number character varying(20),
    officer_id character varying(20),
    call_datetime timestamp with time zone,
    call_duration_seconds integer,
    wait_time_seconds integer,
    hold_time_seconds integer,
    call_type character varying(20),
    call_disposition character varying(50),
    recording_url character varying(500),
    ivr_path character varying(200),
    transfer_count integer,
    quality_monitored boolean DEFAULT false,
    quality_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_call_records OWNER TO postgres;

--
-- Name: collection_call_records_call_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_call_records_call_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_call_records_call_id_seq OWNER TO postgres;

--
-- Name: collection_call_records_call_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_call_records_call_id_seq OWNED BY kastle_collection.collection_call_records.call_id;


--
-- Name: collection_campaigns; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_campaigns (
    campaign_id integer NOT NULL,
    campaign_name character varying(200) NOT NULL,
    campaign_type character varying(30),
    target_bucket integer,
    target_segment character varying(50),
    start_date date,
    end_date date,
    budget_amount numeric(18,2),
    target_recovery numeric(18,2),
    actual_recovery numeric(18,2),
    total_contacts integer,
    success_rate numeric(5,2),
    roi numeric(5,2),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_by character varying(20),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_campaigns OWNER TO postgres;

--
-- Name: collection_campaigns_campaign_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq OWNER TO postgres;

--
-- Name: collection_campaigns_campaign_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq OWNED BY kastle_collection.collection_campaigns.campaign_id;


--
-- Name: collection_case_details; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_case_details (
    case_detail_id integer NOT NULL,
    case_id integer,
    delinquency_reason character varying(50),
    customer_segment character varying(30),
    risk_score integer,
    collection_strategy character varying(50),
    skip_trace_status character varying(30),
    legal_status character varying(30),
    settlement_offered boolean DEFAULT false,
    settlement_amount numeric(18,2),
    restructure_requested boolean DEFAULT false,
    hardship_flag boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_case_details OWNER TO postgres;

--
-- Name: collection_case_details_case_detail_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq OWNER TO postgres;

--
-- Name: collection_case_details_case_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq OWNED BY kastle_collection.collection_case_details.case_detail_id;


--
-- Name: collection_compliance_violations; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_compliance_violations (
    violation_id integer NOT NULL,
    violation_date date NOT NULL,
    violation_type character varying,
    severity character varying,
    officer_id character varying,
    case_id integer,
    description text,
    corrective_action text,
    action_taken boolean DEFAULT false,
    action_date date,
    reviewed_by character varying,
    fine_amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_compliance_violations_severity_check CHECK (((severity)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text]))),
    CONSTRAINT collection_compliance_violations_violation_type_check CHECK (((violation_type)::text = ANY (ARRAY[('SAMA_REGULATION'::character varying)::text, ('SHARIA_COMPLIANCE'::character varying)::text, ('CUSTOMER_PROTECTION'::character varying)::text, ('DATA_PRIVACY'::character varying)::text, ('COLLECTION_PRACTICE'::character varying)::text, ('DOCUMENTATION'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_compliance_violations OWNER TO postgres;

--
-- Name: collection_compliance_violations_violation_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq OWNER TO postgres;

--
-- Name: collection_compliance_violations_violation_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq OWNED BY kastle_collection.collection_compliance_violations.violation_id;


--
-- Name: collection_contact_attempts; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_contact_attempts (
    attempt_id integer NOT NULL,
    case_id integer,
    customer_id character varying,
    contact_type character varying,
    contact_number character varying,
    contact_result character varying,
    attempt_datetime timestamp with time zone,
    officer_id character varying,
    best_time_to_contact character varying,
    contact_quality_score integer,
    is_valid boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    outstanding_amount bigint,
    CONSTRAINT collection_contact_attempts_contact_result_check CHECK (((contact_result)::text = ANY (ARRAY[('CONNECTED'::character varying)::text, ('NO_ANSWER'::character varying)::text, ('BUSY'::character varying)::text, ('WRONG_NUMBER'::character varying)::text, ('DISCONNECTED'::character varying)::text, ('VOICEMAIL'::character varying)::text]))),
    CONSTRAINT collection_contact_attempts_contact_type_check CHECK (((contact_type)::text = ANY (ARRAY[('PRIMARY'::character varying)::text, ('SECONDARY'::character varying)::text, ('EMERGENCY'::character varying)::text, ('WORK'::character varying)::text, ('REFERENCE'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_contact_attempts OWNER TO postgres;

--
-- Name: collection_contact_attempts_attempt_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq OWNER TO postgres;

--
-- Name: collection_contact_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq OWNED BY kastle_collection.collection_contact_attempts.attempt_id;


--
-- Name: collection_customer_segments; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_customer_segments (
    segment_id integer NOT NULL,
    segment_name character varying NOT NULL,
    segment_code character varying,
    segment_criteria jsonb NOT NULL,
    risk_profile character varying,
    collection_strategy character varying,
    target_recovery_rate numeric,
    actual_recovery_rate numeric,
    customers_count integer,
    total_exposure numeric,
    avg_ticket_size numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_customer_segments OWNER TO postgres;

--
-- Name: collection_customer_segments_segment_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq OWNER TO postgres;

--
-- Name: collection_customer_segments_segment_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq OWNED BY kastle_collection.collection_customer_segments.segment_id;


--
-- Name: collection_forecasts; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_forecasts (
    forecast_id integer NOT NULL,
    forecast_date date NOT NULL,
    forecast_period character varying,
    forecast_type character varying,
    product_id integer,
    bucket_id integer,
    predicted_amount numeric,
    confidence_level numeric,
    lower_bound numeric,
    upper_bound numeric,
    actual_amount numeric,
    variance numeric,
    model_used character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_forecasts_forecast_period_check CHECK (((forecast_period)::text = ANY (ARRAY[('DAILY'::character varying)::text, ('WEEKLY'::character varying)::text, ('MONTHLY'::character varying)::text, ('QUARTERLY'::character varying)::text, ('YEARLY'::character varying)::text]))),
    CONSTRAINT collection_forecasts_forecast_type_check CHECK (((forecast_type)::text = ANY (ARRAY[('RECOVERY'::character varying)::text, ('DEFAULT'::character varying)::text, ('ROLL_RATE'::character varying)::text, ('PROVISION'::character varying)::text, ('WRITE_OFF'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_forecasts OWNER TO postgres;

--
-- Name: collection_forecasts_forecast_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq OWNER TO postgres;

--
-- Name: collection_forecasts_forecast_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq OWNED BY kastle_collection.collection_forecasts.forecast_id;


--
-- Name: collection_interactions; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_interactions (
    interaction_id integer NOT NULL,
    case_id integer,
    customer_id character varying(20),
    interaction_type character varying(30),
    interaction_direction character varying(10),
    officer_id character varying(20),
    contact_number character varying(20),
    interaction_status character varying(30),
    duration_seconds integer,
    outcome character varying(50),
    promise_to_pay boolean DEFAULT false,
    ptp_amount numeric(18,2),
    ptp_date date,
    notes text,
    recording_reference character varying(100),
    interaction_datetime timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_interactions_interaction_direction_check CHECK (((interaction_direction)::text = ANY (ARRAY[('INBOUND'::character varying)::text, ('OUTBOUND'::character varying)::text]))),
    CONSTRAINT collection_interactions_interaction_type_check CHECK (((interaction_type)::text = ANY (ARRAY[('CALL'::character varying)::text, ('SMS'::character varying)::text, ('EMAIL'::character varying)::text, ('LETTER'::character varying)::text, ('VISIT'::character varying)::text, ('LEGAL_NOTICE'::character varying)::text, ('WHATSAPP'::character varying)::text, ('IVR'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_interactions OWNER TO postgres;

--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_interactions_interaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_interactions_interaction_id_seq OWNER TO postgres;

--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_interactions_interaction_id_seq OWNED BY kastle_collection.collection_interactions.interaction_id;


--
-- Name: collection_officers; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_officers (
    officer_id character varying(20) NOT NULL,
    employee_id character varying(20),
    officer_name character varying(200) NOT NULL,
    team_id integer,
    officer_type character varying(30),
    contact_number character varying(20),
    email character varying(100),
    language_skills character varying(100),
    collection_limit numeric(18,2),
    commission_rate numeric(5,2),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    joining_date date,
    last_active timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_officers_officer_type_check CHECK (((officer_type)::text = ANY (ARRAY[('CALL_AGENT'::character varying)::text, ('FIELD_AGENT'::character varying)::text, ('LEGAL_OFFICER'::character varying)::text, ('SENIOR_COLLECTOR'::character varying)::text, ('TEAM_LEAD'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_officers OWNER TO postgres;

--
-- Name: collection_provisions; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_provisions (
    provision_id integer NOT NULL,
    provision_date date NOT NULL,
    bucket_id integer,
    provision_rate numeric NOT NULL,
    total_exposure numeric,
    provision_amount numeric NOT NULL,
    ifrs9_stage character varying,
    ecl_amount numeric,
    regulatory_provision numeric,
    additional_provision numeric,
    provision_coverage_ratio numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_provisions_ifrs9_stage_check CHECK (((ifrs9_stage)::text = ANY (ARRAY[('STAGE1'::character varying)::text, ('STAGE2'::character varying)::text, ('STAGE3'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_provisions OWNER TO postgres;

--
-- Name: collection_provisions_provision_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_provisions_provision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_provisions_provision_id_seq OWNER TO postgres;

--
-- Name: collection_provisions_provision_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_provisions_provision_id_seq OWNED BY kastle_collection.collection_provisions.provision_id;


--
-- Name: collection_queue_management; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_queue_management (
    queue_id integer NOT NULL,
    queue_name character varying NOT NULL,
    queue_type character varying,
    priority_level integer,
    filter_criteria jsonb,
    assigned_officer_id character varying,
    assigned_team_id integer,
    cases_count integer DEFAULT 0,
    total_amount numeric DEFAULT 0,
    avg_dpd integer,
    last_refreshed timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_queue_management_queue_type_check CHECK (((queue_type)::text = ANY (ARRAY[('PRIORITY'::character varying)::text, ('NORMAL'::character varying)::text, ('AUTOMATED'::character varying)::text, ('MANUAL'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_queue_management OWNER TO postgres;

--
-- Name: collection_queue_management_queue_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_queue_management_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_queue_management_queue_id_seq OWNER TO postgres;

--
-- Name: collection_queue_management_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_queue_management_queue_id_seq OWNED BY kastle_collection.collection_queue_management.queue_id;


--
-- Name: collection_risk_assessment; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_risk_assessment (
    assessment_id integer NOT NULL,
    customer_id character varying,
    case_id integer,
    assessment_date date NOT NULL,
    risk_category character varying,
    default_probability numeric,
    loss_given_default numeric,
    expected_loss numeric,
    early_warning_flags jsonb,
    behavioral_score integer,
    payment_pattern_score integer,
    external_risk_factors jsonb,
    recommended_strategy character varying,
    next_review_date date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_risk_assessment_risk_category_check CHECK (((risk_category)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_risk_assessment OWNER TO postgres;

--
-- Name: collection_risk_assessment_assessment_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq OWNER TO postgres;

--
-- Name: collection_risk_assessment_assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq OWNED BY kastle_collection.collection_risk_assessment.assessment_id;


--
-- Name: collection_scores; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_scores (
    score_id integer NOT NULL,
    customer_id character varying(20),
    score_date date NOT NULL,
    payment_behavior_score integer,
    contact_score integer,
    response_score integer,
    risk_score integer,
    recovery_probability numeric(5,2),
    recommended_action character varying(100),
    score_factors jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_scores OWNER TO postgres;

--
-- Name: collection_scores_score_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_scores_score_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_scores_score_id_seq OWNER TO postgres;

--
-- Name: collection_scores_score_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_scores_score_id_seq OWNED BY kastle_collection.collection_scores.score_id;


--
-- Name: collection_settlement_offers; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_settlement_offers (
    offer_id integer NOT NULL,
    case_id integer,
    customer_id character varying,
    offer_date date NOT NULL,
    original_amount numeric NOT NULL,
    settlement_amount numeric NOT NULL,
    discount_percentage numeric,
    payment_terms character varying,
    installments integer,
    offer_valid_until date,
    offer_status character varying,
    approval_level character varying,
    approved_by character varying,
    customer_response character varying,
    response_date date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_settlement_offers_offer_status_check CHECK (((offer_status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('ACCEPTED'::character varying)::text, ('REJECTED'::character varying)::text, ('EXPIRED'::character varying)::text, ('WITHDRAWN'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_settlement_offers OWNER TO postgres;

--
-- Name: collection_settlement_offers_offer_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq OWNER TO postgres;

--
-- Name: collection_settlement_offers_offer_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq OWNED BY kastle_collection.collection_settlement_offers.offer_id;


--
-- Name: collection_strategies; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_strategies (
    strategy_id integer NOT NULL,
    strategy_code character varying(30) NOT NULL,
    strategy_name character varying(100) NOT NULL,
    bucket_id integer,
    customer_segment character varying(30),
    risk_category character varying(20),
    min_amount numeric(18,2),
    max_amount numeric(18,2),
    actions jsonb NOT NULL,
    escalation_days integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_strategies OWNER TO postgres;

--
-- Name: collection_strategies_strategy_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_strategies_strategy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_strategies_strategy_id_seq OWNER TO postgres;

--
-- Name: collection_strategies_strategy_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_strategies_strategy_id_seq OWNED BY kastle_collection.collection_strategies.strategy_id;


--
-- Name: collection_system_performance; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_system_performance (
    log_id integer NOT NULL,
    log_timestamp timestamp with time zone DEFAULT now(),
    system_component character varying(50),
    response_time_ms integer,
    cpu_usage_percent numeric(5,2),
    memory_usage_percent numeric(5,2),
    active_users integer,
    error_count integer,
    warning_count integer,
    api_calls integer,
    database_connections integer
);


ALTER TABLE kastle_collection.collection_system_performance OWNER TO postgres;

--
-- Name: collection_system_performance_log_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_system_performance_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_system_performance_log_id_seq OWNER TO postgres;

--
-- Name: collection_system_performance_log_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_system_performance_log_id_seq OWNED BY kastle_collection.collection_system_performance.log_id;


--
-- Name: collection_teams; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_teams (
    team_id integer NOT NULL,
    team_code character varying(20) NOT NULL,
    team_name character varying(100) NOT NULL,
    team_type character varying(30),
    branch_id character varying(10),
    manager_id character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT collection_teams_team_type_check CHECK (((team_type)::text = ANY (ARRAY[('CALL_CENTER'::character varying)::text, ('FIELD'::character varying)::text, ('LEGAL'::character varying)::text, ('DIGITAL'::character varying)::text, ('RECOVERY'::character varying)::text])))
);


ALTER TABLE kastle_collection.collection_teams OWNER TO postgres;

--
-- Name: collection_teams_team_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_teams_team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_teams_team_id_seq OWNER TO postgres;

--
-- Name: collection_teams_team_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_teams_team_id_seq OWNED BY kastle_collection.collection_teams.team_id;


--
-- Name: collection_vintage_analysis; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_vintage_analysis (
    vintage_id integer NOT NULL,
    origination_month character varying(7) NOT NULL,
    product_id integer,
    months_on_book integer NOT NULL,
    original_accounts integer,
    original_amount numeric,
    current_outstanding numeric,
    dpd_0_30_count integer,
    dpd_31_60_count integer,
    dpd_61_90_count integer,
    dpd_90_plus_count integer,
    written_off_count integer,
    written_off_amount numeric,
    recovery_amount numeric,
    flow_rate_30 numeric,
    flow_rate_60 numeric,
    flow_rate_90 numeric,
    loss_rate numeric,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_vintage_analysis OWNER TO postgres;

--
-- Name: collection_vintage_analysis_vintage_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq OWNER TO postgres;

--
-- Name: collection_vintage_analysis_vintage_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq OWNED BY kastle_collection.collection_vintage_analysis.vintage_id;


--
-- Name: collection_workflow_templates; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_workflow_templates (
    template_id integer NOT NULL,
    template_name character varying NOT NULL,
    workflow_type character varying,
    bucket_id integer,
    customer_segment character varying,
    workflow_steps jsonb NOT NULL,
    escalation_matrix jsonb,
    sla_hours integer,
    is_automated boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_workflow_templates OWNER TO postgres;

--
-- Name: collection_workflow_templates_template_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq OWNER TO postgres;

--
-- Name: collection_workflow_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq OWNED BY kastle_collection.collection_workflow_templates.template_id;


--
-- Name: collection_write_offs; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.collection_write_offs (
    write_off_id integer NOT NULL,
    case_id integer,
    account_number character varying,
    customer_id character varying,
    write_off_date date NOT NULL,
    write_off_amount numeric NOT NULL,
    principal_amount numeric,
    interest_amount numeric,
    penalty_amount numeric,
    write_off_reason character varying,
    approval_level character varying,
    approved_by character varying,
    recovery_attempts integer,
    last_payment_date date,
    documentation jsonb,
    is_recoverable boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.collection_write_offs OWNER TO postgres;

--
-- Name: collection_write_offs_write_off_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq OWNER TO postgres;

--
-- Name: collection_write_offs_write_off_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq OWNED BY kastle_collection.collection_write_offs.write_off_id;


--
-- Name: daily_collection_summary; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.daily_collection_summary (
    summary_id integer NOT NULL,
    summary_date date NOT NULL,
    branch_id character varying(10),
    team_id integer,
    total_due_amount numeric(18,2),
    total_collected numeric(18,2),
    collection_rate numeric(5,2),
    accounts_due integer,
    accounts_collected integer,
    calls_made integer,
    contacts_successful integer,
    ptps_obtained integer,
    ptps_kept integer,
    field_visits_done integer,
    legal_notices_sent integer,
    digital_payments integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.daily_collection_summary OWNER TO postgres;

--
-- Name: daily_collection_summary_summary_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq OWNER TO postgres;

--
-- Name: daily_collection_summary_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq OWNED BY kastle_collection.daily_collection_summary.summary_id;


--
-- Name: data_masking_rules; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.data_masking_rules (
    rule_id integer NOT NULL,
    table_name character varying NOT NULL,
    column_name character varying NOT NULL,
    masking_type character varying,
    masking_pattern character varying,
    role_exceptions text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT data_masking_rules_masking_type_check CHECK (((masking_type)::text = ANY (ARRAY[('PARTIAL'::character varying)::text, ('FULL'::character varying)::text, ('HASH'::character varying)::text, ('RANDOM'::character varying)::text])))
);


ALTER TABLE kastle_collection.data_masking_rules OWNER TO postgres;

--
-- Name: data_masking_rules_rule_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.data_masking_rules_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.data_masking_rules_rule_id_seq OWNER TO postgres;

--
-- Name: data_masking_rules_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.data_masking_rules_rule_id_seq OWNED BY kastle_collection.data_masking_rules.rule_id;


--
-- Name: digital_collection_attempts; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.digital_collection_attempts (
    attempt_id integer NOT NULL,
    case_id integer,
    customer_id character varying(20),
    channel_type character varying(30),
    campaign_id integer,
    message_template character varying(100),
    sent_datetime timestamp with time zone,
    delivered_datetime timestamp with time zone,
    read_datetime timestamp with time zone,
    response_datetime timestamp with time zone,
    response_type character varying(50),
    payment_made boolean DEFAULT false,
    payment_amount numeric(18,2),
    click_through_rate numeric(5,2),
    cost_per_message numeric(10,4),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT digital_collection_attempts_channel_type_check CHECK (((channel_type)::text = ANY (ARRAY[('IVR'::character varying)::text, ('SMS'::character varying)::text, ('EMAIL'::character varying)::text, ('WHATSAPP'::character varying)::text, ('MOBILE_APP'::character varying)::text, ('WEB_PORTAL'::character varying)::text, ('CHATBOT'::character varying)::text])))
);


ALTER TABLE kastle_collection.digital_collection_attempts OWNER TO postgres;

--
-- Name: digital_collection_attempts_attempt_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq OWNER TO postgres;

--
-- Name: digital_collection_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq OWNED BY kastle_collection.digital_collection_attempts.attempt_id;


--
-- Name: field_visits; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.field_visits (
    visit_id integer NOT NULL,
    case_id integer,
    customer_id character varying(20),
    officer_id character varying(20),
    visit_date date NOT NULL,
    scheduled_time time without time zone,
    actual_time time without time zone,
    visit_address text,
    visit_status character varying(30),
    customer_met character varying(100),
    amount_collected numeric(18,2),
    collection_mode character varying(30),
    receipt_number character varying(50),
    customer_behavior character varying(50),
    follow_up_required boolean DEFAULT false,
    geo_location point,
    distance_traveled numeric(10,2),
    expenses_claimed numeric(18,2),
    safety_concern boolean DEFAULT false,
    notes text,
    photo_references jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT field_visits_visit_status_check CHECK (((visit_status)::text = ANY (ARRAY[('SCHEDULED'::character varying)::text, ('COMPLETED'::character varying)::text, ('CUSTOMER_NOT_AVAILABLE'::character varying)::text, ('WRONG_ADDRESS'::character varying)::text, ('REFUSED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE kastle_collection.field_visits OWNER TO postgres;

--
-- Name: field_visits_visit_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.field_visits_visit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.field_visits_visit_id_seq OWNER TO postgres;

--
-- Name: field_visits_visit_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.field_visits_visit_id_seq OWNED BY kastle_collection.field_visits.visit_id;


--
-- Name: hardship_applications; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.hardship_applications (
    application_id integer NOT NULL,
    customer_id character varying(20),
    case_id integer,
    hardship_type character varying(50),
    application_date date,
    supporting_documents jsonb,
    requested_relief character varying(50),
    review_status character varying(30),
    approved_by character varying(20),
    approval_date date,
    relief_granted character varying(100),
    relief_start_date date,
    relief_end_date date,
    monitoring_required boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hardship_applications_hardship_type_check CHECK (((hardship_type)::text = ANY (ARRAY[('JOB_LOSS'::character varying)::text, ('MEDICAL'::character varying)::text, ('BUSINESS_CLOSURE'::character varying)::text, ('SALARY_REDUCTION'::character varying)::text, ('COVID_IMPACT'::character varying)::text, ('NATURAL_DISASTER'::character varying)::text, ('DEATH_IN_FAMILY'::character varying)::text])))
);


ALTER TABLE kastle_collection.hardship_applications OWNER TO postgres;

--
-- Name: hardship_applications_application_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.hardship_applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.hardship_applications_application_id_seq OWNER TO postgres;

--
-- Name: hardship_applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.hardship_applications_application_id_seq OWNED BY kastle_collection.hardship_applications.application_id;


--
-- Name: ivr_payment_attempts; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.ivr_payment_attempts (
    attempt_id integer NOT NULL,
    customer_id character varying(20),
    account_number character varying(20),
    call_datetime timestamp with time zone,
    ivr_menu_path character varying(500),
    payment_amount numeric(18,2),
    payment_method character varying(30),
    transaction_status character varying(30),
    failure_reason character varying(100),
    transaction_reference character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.ivr_payment_attempts OWNER TO postgres;

--
-- Name: ivr_payment_attempts_attempt_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq OWNER TO postgres;

--
-- Name: ivr_payment_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq OWNED BY kastle_collection.ivr_payment_attempts.attempt_id;


--
-- Name: legal_cases; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.legal_cases (
    legal_case_id integer NOT NULL,
    case_id integer,
    case_number character varying(50),
    court_name character varying(200),
    case_type character varying(50),
    filing_date date,
    lawyer_name character varying(200),
    lawyer_firm character varying(200),
    current_stage character varying(50),
    next_hearing_date date,
    judgment_date date,
    judgment_amount numeric(18,2),
    execution_status character varying(30),
    legal_costs numeric(18,2),
    recovered_amount numeric(18,2),
    case_status character varying(30) DEFAULT 'ACTIVE'::character varying,
    documents jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.legal_cases OWNER TO postgres;

--
-- Name: legal_cases_legal_case_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.legal_cases_legal_case_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.legal_cases_legal_case_id_seq OWNER TO postgres;

--
-- Name: legal_cases_legal_case_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.legal_cases_legal_case_id_seq OWNED BY kastle_collection.legal_cases.legal_case_id;


--
-- Name: loan_restructuring; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.loan_restructuring (
    restructure_id integer NOT NULL,
    loan_account_number character varying(20),
    customer_id character varying(20),
    original_loan_amount numeric(18,2),
    outstanding_amount numeric(18,2),
    original_tenure integer,
    remaining_tenure integer,
    original_interest_rate numeric(5,2),
    new_interest_rate numeric(5,2),
    new_tenure integer,
    new_emi numeric(18,2),
    moratorium_months integer,
    restructure_date date,
    restructure_reason character varying(100),
    approval_level character varying(50),
    impact_on_provision numeric(18,2),
    status character varying(30) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.loan_restructuring OWNER TO postgres;

--
-- Name: loan_restructuring_restructure_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq OWNER TO postgres;

--
-- Name: loan_restructuring_restructure_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq OWNED BY kastle_collection.loan_restructuring.restructure_id;


--
-- Name: officer_performance_metrics; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.officer_performance_metrics (
    metric_id integer NOT NULL,
    officer_id character varying(20),
    metric_date date NOT NULL,
    accounts_assigned integer,
    accounts_worked integer,
    calls_made integer,
    talk_time_minutes integer,
    contacts_successful integer,
    amount_collected numeric(18,2),
    ptps_obtained integer,
    ptps_kept_rate numeric(5,2),
    average_collection_days numeric(5,1),
    customer_complaints integer,
    quality_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.officer_performance_metrics OWNER TO postgres;

--
-- Name: officer_performance_metrics_metric_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq OWNER TO postgres;

--
-- Name: officer_performance_metrics_metric_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq OWNED BY kastle_collection.officer_performance_metrics.metric_id;


--
-- Name: officer_performance_summary; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.officer_performance_summary (
    summary_id integer NOT NULL,
    officer_id character varying,
    summary_date date NOT NULL,
    total_cases integer DEFAULT 0,
    total_portfolio_value numeric DEFAULT 0,
    total_collected numeric DEFAULT 0,
    collection_rate numeric DEFAULT 0,
    total_calls integer DEFAULT 0,
    total_messages integer DEFAULT 0,
    successful_contacts integer DEFAULT 0,
    contact_rate numeric DEFAULT 0,
    total_ptps integer DEFAULT 0,
    ptps_kept integer DEFAULT 0,
    ptp_keep_rate numeric DEFAULT 0,
    avg_response_time numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.officer_performance_summary OWNER TO postgres;

--
-- Name: officer_performance_summary_summary_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.officer_performance_summary_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.officer_performance_summary_summary_id_seq OWNER TO postgres;

--
-- Name: officer_performance_summary_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.officer_performance_summary_summary_id_seq OWNED BY kastle_collection.officer_performance_summary.summary_id;


--
-- Name: performance_metrics; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.performance_metrics (
    metric_id bigint NOT NULL,
    metric_name character varying NOT NULL,
    metric_value numeric NOT NULL,
    metric_unit character varying,
    metric_timestamp timestamp with time zone DEFAULT now(),
    additional_info jsonb
);


ALTER TABLE kastle_collection.performance_metrics OWNER TO postgres;

--
-- Name: performance_metrics_metric_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.performance_metrics_metric_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.performance_metrics_metric_id_seq OWNER TO postgres;

--
-- Name: performance_metrics_metric_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.performance_metrics_metric_id_seq OWNED BY kastle_collection.performance_metrics.metric_id;


--
-- Name: promise_to_pay; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.promise_to_pay (
    ptp_id integer NOT NULL,
    case_id integer,
    customer_id character varying(20),
    interaction_id integer,
    ptp_amount numeric(18,2) NOT NULL,
    ptp_date date NOT NULL,
    ptp_type character varying(20),
    installment_count integer,
    officer_id character varying(20),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    amount_received numeric(18,2) DEFAULT 0,
    kept_date date,
    broken_reason character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promise_to_pay_ptp_type_check CHECK (((ptp_type)::text = ANY (ARRAY[('FULL'::character varying)::text, ('PARTIAL'::character varying)::text, ('INSTALLMENT'::character varying)::text]))),
    CONSTRAINT promise_to_pay_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('KEPT'::character varying)::text, ('BROKEN'::character varying)::text, ('PARTIAL_KEPT'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE kastle_collection.promise_to_pay OWNER TO postgres;

--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq OWNER TO postgres;

--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq OWNED BY kastle_collection.promise_to_pay.ptp_id;


--
-- Name: repossessed_assets; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.repossessed_assets (
    asset_id integer NOT NULL,
    case_id integer,
    asset_type character varying(30),
    asset_description text,
    repossession_date date,
    storage_location character varying(200),
    estimated_value numeric(18,2),
    valuation_date date,
    valuation_agency character varying(200),
    auction_date date,
    sale_amount numeric(18,2),
    buyer_details jsonb,
    storage_costs numeric(18,2),
    legal_costs numeric(18,2),
    net_recovery numeric(18,2),
    asset_condition character varying(50),
    documents jsonb,
    photos jsonb,
    status character varying(30) DEFAULT 'IN_POSSESSION'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT repossessed_assets_asset_type_check CHECK (((asset_type)::text = ANY (ARRAY[('VEHICLE'::character varying)::text, ('PROPERTY'::character varying)::text, ('EQUIPMENT'::character varying)::text, ('OTHERS'::character varying)::text])))
);


ALTER TABLE kastle_collection.repossessed_assets OWNER TO postgres;

--
-- Name: repossessed_assets_asset_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.repossessed_assets_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.repossessed_assets_asset_id_seq OWNER TO postgres;

--
-- Name: repossessed_assets_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.repossessed_assets_asset_id_seq OWNED BY kastle_collection.repossessed_assets.asset_id;


--
-- Name: sharia_compliance_log; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.sharia_compliance_log (
    compliance_id integer NOT NULL,
    case_id integer,
    compliance_type character varying(50),
    late_payment_charges numeric(18,2),
    charity_amount numeric(18,2),
    charity_name character varying(200),
    distribution_date date,
    distribution_receipt character varying(100),
    compliance_status character varying(30),
    reviewed_by character varying(100),
    review_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.sharia_compliance_log OWNER TO postgres;

--
-- Name: sharia_compliance_log_compliance_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq OWNER TO postgres;

--
-- Name: sharia_compliance_log_compliance_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq OWNED BY kastle_collection.sharia_compliance_log.compliance_id;


--
-- Name: user_role_assignments; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.user_role_assignments (
    assignment_id integer NOT NULL,
    user_id character varying NOT NULL,
    role_id integer NOT NULL,
    assigned_by character varying,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.user_role_assignments OWNER TO postgres;

--
-- Name: user_role_assignments_assignment_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq OWNER TO postgres;

--
-- Name: user_role_assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq OWNED BY kastle_collection.user_role_assignments.assignment_id;


--
-- Name: user_roles; Type: TABLE; Schema: kastle_collection; Owner: postgres
--

CREATE TABLE kastle_collection.user_roles (
    role_id integer NOT NULL,
    role_name character varying NOT NULL,
    role_description text,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE kastle_collection.user_roles OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE; Schema: kastle_collection; Owner: postgres
--

CREATE SEQUENCE kastle_collection.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kastle_collection.user_roles_role_id_seq OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: kastle_collection; Owner: postgres
--

ALTER SEQUENCE kastle_collection.user_roles_role_id_seq OWNED BY kastle_collection.user_roles.role_id;


--
-- Name: v_first_payment_defaults; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_first_payment_defaults AS
 SELECT la.loan_account_id,
    la.loan_account_number,
    la.customer_id,
    c.full_name AS customer_name,
    la.principal_amount AS loan_amount,
    la.overdue_days AS days_overdue,
        CASE
            WHEN (la.overdue_days > 30) THEN 95
            WHEN (la.overdue_days > 15) THEN 85
            WHEN (la.overdue_days > 0) THEN 75
            ELSE 50
        END AS risk_score,
    (la.outstanding_principal + la.outstanding_interest) AS total_outstanding,
    la.disbursement_date,
    la.first_emi_date
   FROM (kastle_banking.loan_accounts la
     JOIN kastle_banking.customers c ON (((la.customer_id)::text = (c.customer_id)::text)))
  WHERE ((la.first_emi_date >= (CURRENT_DATE - '90 days'::interval)) AND (la.overdue_days > 0) AND ((la.loan_status)::text = 'ACTIVE'::text));


ALTER VIEW kastle_collection.v_first_payment_defaults OWNER TO postgres;

--
-- Name: v_high_dti_customers; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_high_dti_customers AS
 WITH customer_debt AS (
         SELECT la.customer_id,
            sum(la.emi_amount) AS total_monthly_debt
           FROM kastle_banking.loan_accounts la
          WHERE ((la.loan_status)::text = 'ACTIVE'::text)
          GROUP BY la.customer_id
        )
 SELECT cd.customer_id,
    c.full_name AS customer_name,
    c.annual_income,
    cd.total_monthly_debt,
        CASE
            WHEN (c.annual_income > (0)::numeric) THEN (((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric)
            ELSE (999)::numeric
        END AS dti_ratio,
        CASE
            WHEN (c.annual_income > (0)::numeric) THEN
            CASE
                WHEN (((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) >= (65)::numeric) AND ((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) <= (70)::numeric)) THEN '65-70%'::text
                WHEN (((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) >= (70)::numeric) AND ((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) <= (75)::numeric)) THEN '70-75%'::text
                WHEN (((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) >= (75)::numeric) AND ((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) <= (80)::numeric)) THEN '75-80%'::text
                WHEN ((((cd.total_monthly_debt * (12)::numeric) / c.annual_income) * (100)::numeric) > (80)::numeric) THEN '80%+'::text
                ELSE 'Below 65%'::text
            END
            ELSE 'Unknown'::text
        END AS dti_range
   FROM (customer_debt cd
     JOIN kastle_banking.customers c ON (((cd.customer_id)::text = (c.customer_id)::text)))
  WHERE ((c.annual_income > (0)::numeric) AND (((cd.total_monthly_debt * (12)::numeric) / c.annual_income) > 0.65));


ALTER VIEW kastle_collection.v_high_dti_customers OWNER TO postgres;

--
-- Name: v_multiple_loans_stress; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_multiple_loans_stress AS
 SELECT la.customer_id,
    c.full_name AS customer_name,
    count(DISTINCT la.loan_account_id) AS loan_count,
    sum((la.outstanding_principal + la.outstanding_interest)) AS total_exposure,
    avg((la.outstanding_principal + la.outstanding_interest)) AS avg_loan_size,
    max(la.overdue_days) AS max_overdue_days,
    sum(
        CASE
            WHEN (la.overdue_days > 0) THEN 1
            ELSE 0
        END) AS overdue_loans_count
   FROM (kastle_banking.loan_accounts la
     JOIN kastle_banking.customers c ON (((la.customer_id)::text = (c.customer_id)::text)))
  WHERE ((la.loan_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'RESTRUCTURED'::character varying])::text[]))
  GROUP BY la.customer_id, c.full_name
 HAVING (count(DISTINCT la.loan_account_id) >= 2);


ALTER VIEW kastle_collection.v_multiple_loans_stress OWNER TO postgres;

--
-- Name: v_actionable_insights; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_actionable_insights AS
 WITH risk_segments AS (
         SELECT 'First payment defaults'::text AS insight_type,
            'CRITICAL'::text AS priority,
            count(*) AS account_count,
            sum(v_first_payment_defaults.total_outstanding) AS potential_loss,
            'Immediate contact required within 24 hours'::text AS recommendation
           FROM kastle_collection.v_first_payment_defaults
        UNION ALL
         SELECT 'Multiple loans showing stress'::text AS insight_type,
            'HIGH'::text AS priority,
            count(*) AS account_count,
            sum(v_multiple_loans_stress.total_exposure) AS potential_loss,
            'Consider restructuring options proactively'::text AS recommendation
           FROM kastle_collection.v_multiple_loans_stress
          WHERE (v_multiple_loans_stress.overdue_loans_count > 0)
        UNION ALL
         SELECT 'High DTI customers'::text AS insight_type,
            'MEDIUM'::text AS priority,
            count(*) AS account_count,
            sum((v_high_dti_customers.total_monthly_debt * (12)::numeric)) AS potential_loss,
            'Review credit limits and monitor closely'::text AS recommendation
           FROM kastle_collection.v_high_dti_customers
        )
 SELECT insight_type,
    priority,
    ((account_count || ' accounts showing '::text) || insight_type) AS insight,
    recommendation,
    (potential_loss * 0.3) AS potential_saving
   FROM risk_segments
  ORDER BY
        CASE priority
            WHEN 'CRITICAL'::text THEN 1
            WHEN 'HIGH'::text THEN 2
            WHEN 'MEDIUM'::text THEN 3
            ELSE 4
        END;


ALTER VIEW kastle_collection.v_actionable_insights OWNER TO postgres;

--
-- Name: v_behavioral_changes; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_behavioral_changes AS
 WITH recent_interactions AS (
         SELECT ci.customer_id,
            ci.interaction_type,
            count(*) AS interaction_count,
            max(ci.interaction_datetime) AS last_interaction
           FROM kastle_collection.collection_interactions ci
          WHERE (ci.interaction_datetime >= (CURRENT_DATE - '30 days'::interval))
          GROUP BY ci.customer_id, ci.interaction_type
        ), channel_changes AS (
         SELECT recent_interactions.customer_id,
            count(DISTINCT recent_interactions.interaction_type) AS channels_used,
                CASE
                    WHEN (count(DISTINCT recent_interactions.interaction_type) >= 3) THEN 'Channel switch'::text
                    WHEN (max(recent_interactions.last_interaction) < (CURRENT_DATE - '15 days'::interval)) THEN 'Contact avoidance'::text
                    ELSE 'Normal'::text
                END AS change_type
           FROM recent_interactions
          GROUP BY recent_interactions.customer_id
        )
 SELECT cc.customer_id,
    c.full_name AS customer_name,
    cc.change_type,
        CASE
            WHEN (cc.change_type = 'Channel switch'::text) THEN 15
            WHEN (cc.change_type = 'Contact avoidance'::text) THEN 25
            ELSE 5
        END AS risk_increase
   FROM (channel_changes cc
     JOIN kastle_banking.customers c ON (((cc.customer_id)::text = (c.customer_id)::text)))
  WHERE (cc.change_type <> 'Normal'::text);


ALTER VIEW kastle_collection.v_behavioral_changes OWNER TO postgres;

--
-- Name: v_early_warning_alerts; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_early_warning_alerts AS
 SELECT cc.case_id,
    cc.case_number,
    cc.customer_id,
    c.full_name AS customer_name,
    cc.account_number,
    cc.priority AS alert_type,
        CASE
            WHEN (cc.days_past_due > 90) THEN 'Account showing severe delinquency'::text
            WHEN (cc.total_outstanding > (1000000)::numeric) THEN 'Large corporate account showing stress signals'::text
            WHEN (cc.days_past_due = 1) THEN 'First payment default pattern detected'::text
            WHEN ((cc.priority)::text = 'HIGH'::text) THEN 'Multiple payment failures detected'::text
            ELSE 'Account requires attention'::text
        END AS message,
    cc.created_at AS alert_time
   FROM (kastle_banking.collection_cases cc
     JOIN kastle_banking.customers c ON (((cc.customer_id)::text = (c.customer_id)::text)))
  WHERE ((cc.created_at >= (CURRENT_TIMESTAMP - '24:00:00'::interval)) AND ((cc.case_status)::text = 'ACTIVE'::text))
  ORDER BY cc.created_at DESC
 LIMIT 50;


ALTER VIEW kastle_collection.v_early_warning_alerts OWNER TO postgres;

--
-- Name: v_early_warning_summary; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_early_warning_summary AS
 SELECT count(DISTINCT case_id) AS total_alerts,
    count(DISTINCT
        CASE
            WHEN ((priority)::text = 'CRITICAL'::text) THEN case_id
            ELSE NULL::integer
        END) AS critical_alerts,
    count(DISTINCT
        CASE
            WHEN ((priority)::text = 'HIGH'::text) THEN case_id
            ELSE NULL::integer
        END) AS high_risk_accounts,
    count(DISTINCT
        CASE
            WHEN ((priority)::text = 'MEDIUM'::text) THEN case_id
            ELSE NULL::integer
        END) AS medium_risk_accounts,
    sum(total_outstanding) AS potential_loss,
    count(DISTINCT customer_id) AS accounts_monitored,
    count(DISTINCT
        CASE
            WHEN ((case_status)::text = 'RESOLVED'::text) THEN case_id
            ELSE NULL::integer
        END) AS alerts_resolved,
    0 AS false_positives
   FROM kastle_banking.collection_cases cc
  WHERE (created_at >= (CURRENT_DATE - '30 days'::interval));


ALTER VIEW kastle_collection.v_early_warning_summary OWNER TO postgres;

--
-- Name: v_industry_risk_analysis; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_industry_risk_analysis AS
 SELECT c.occupation AS sector,
    count(DISTINCT la.loan_account_id) AS accounts,
    sum((la.outstanding_principal + la.outstanding_interest)) AS exposure,
    avg(la.overdue_days) AS avg_overdue_days,
        CASE
            WHEN ((c.occupation)::text = ANY ((ARRAY['Construction'::character varying, 'Tourism'::character varying, 'Retail'::character varying])::text[])) THEN 'HIGH'::text
            WHEN ((c.occupation)::text = ANY ((ARRAY['Technology'::character varying, 'Healthcare'::character varying])::text[])) THEN 'LOW'::text
            ELSE 'MEDIUM'::text
        END AS risk_level
   FROM (kastle_banking.loan_accounts la
     JOIN kastle_banking.customers c ON (((la.customer_id)::text = (c.customer_id)::text)))
  WHERE (((la.loan_status)::text = 'ACTIVE'::text) AND (c.occupation IS NOT NULL))
  GROUP BY c.occupation;


ALTER VIEW kastle_collection.v_industry_risk_analysis OWNER TO postgres;

--
-- Name: v_irregular_payment_patterns; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_irregular_payment_patterns AS
 WITH payment_history AS (
         SELECT t.account_number,
            a.customer_id,
            date_trunc('month'::text, t.transaction_date) AS payment_month,
            count(*) AS payment_count,
            sum(t.transaction_amount) AS total_amount,
            avg(t.transaction_amount) AS avg_amount
           FROM (kastle_banking.transactions t
             JOIN kastle_banking.accounts a ON (((t.account_number)::text = (a.account_number)::text)))
          WHERE ((t.transaction_type_id IN ( SELECT transaction_types.type_id
                   FROM kastle_banking.transaction_types
                  WHERE ((transaction_types.type_code)::text = 'LOAN_PAYMENT'::text))) AND ((t.status)::text = 'COMPLETED'::text) AND (t.transaction_date >= (CURRENT_DATE - '6 mons'::interval)))
          GROUP BY t.account_number, a.customer_id, (date_trunc('month'::text, t.transaction_date))
        ), payment_variance AS (
         SELECT payment_history.customer_id,
            payment_history.account_number,
            stddev(payment_history.total_amount) AS amount_variance,
            avg(payment_history.total_amount) AS avg_monthly_payment,
            count(DISTINCT payment_history.payment_month) AS months_with_payment
           FROM payment_history
          GROUP BY payment_history.customer_id, payment_history.account_number
        )
 SELECT pv.customer_id,
    c.full_name AS customer_name,
    pv.account_number,
    pv.amount_variance,
    pv.avg_monthly_payment,
        CASE
            WHEN (pv.amount_variance > (pv.avg_monthly_payment * 0.3)) THEN 'Declining payment amounts'::text
            WHEN (pv.months_with_payment < 4) THEN 'Missed alternate payments'::text
            ELSE 'Increasing delays'::text
        END AS pattern_type,
        CASE
            WHEN (pv.amount_variance > (pv.avg_monthly_payment * 0.3)) THEN 85
            WHEN (pv.months_with_payment < 4) THEN 78
            ELSE 72
        END AS risk_score
   FROM (payment_variance pv
     JOIN kastle_banking.customers c ON (((pv.customer_id)::text = (c.customer_id)::text)))
  WHERE (pv.amount_variance > (pv.avg_monthly_payment * 0.2));


ALTER VIEW kastle_collection.v_irregular_payment_patterns OWNER TO postgres;

--
-- Name: v_loan_installment_details; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_loan_installment_details AS
 SELECT la.loan_account_id,
    la.loan_account_number,
    la.customer_id,
    la.principal_amount,
    la.outstanding_principal,
    la.outstanding_interest,
    la.total_principal_paid,
    la.total_interest_paid,
    la.overdue_amount,
    la.overdue_days,
    la.disbursement_date,
    la.maturity_date,
    la.loan_status,
    la.emi_amount,
    la.tenure_months,
    la.interest_rate,
    (la.total_principal_paid + la.total_interest_paid) AS paid_amount,
    la.overdue_amount AS due_amount,
    ((la.outstanding_principal + la.outstanding_interest) - la.overdue_amount) AS not_due_amount,
        CASE
            WHEN (la.overdue_days = 0) THEN 'Current'::text
            WHEN ((la.overdue_days >= 1) AND (la.overdue_days <= 30)) THEN '1-30 Days'::text
            WHEN ((la.overdue_days >= 31) AND (la.overdue_days <= 60)) THEN '31-60 Days'::text
            WHEN ((la.overdue_days >= 61) AND (la.overdue_days <= 90)) THEN '61-90 Days'::text
            WHEN ((la.overdue_days >= 91) AND (la.overdue_days <= 180)) THEN '91-180 Days'::text
            WHEN ((la.overdue_days >= 181) AND (la.overdue_days <= 360)) THEN '181-360 Days'::text
            ELSE '>360 Days'::text
        END AS delinquency_bucket,
    p.product_name,
    p.product_type,
    c.full_name AS customer_name,
    c.customer_type_id,
    ct.type_name AS customer_type
   FROM (((kastle_banking.loan_accounts la
     LEFT JOIN kastle_banking.products p ON ((la.product_id = p.product_id)))
     LEFT JOIN kastle_banking.customers c ON (((la.customer_id)::text = (c.customer_id)::text)))
     LEFT JOIN kastle_banking.customer_types ct ON ((c.customer_type_id = ct.type_id)));


ALTER VIEW kastle_collection.v_loan_installment_details OWNER TO postgres;

--
-- Name: v_officer_communication_summary; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_officer_communication_summary AS
 WITH monthly_calls AS (
         SELECT ci.officer_id,
            ci.case_id,
            ci.customer_id,
            date_trunc('month'::text, ci.interaction_datetime) AS month,
            count(
                CASE
                    WHEN ((ci.interaction_type)::text = 'CALL'::text) THEN 1
                    ELSE NULL::integer
                END) AS calls_count,
            count(
                CASE
                    WHEN ((ci.interaction_type)::text = ANY ((ARRAY['SMS'::character varying, 'EMAIL'::character varying, 'WHATSAPP'::character varying])::text[])) THEN 1
                    ELSE NULL::integer
                END) AS messages_count,
            max(
                CASE
                    WHEN ((ci.interaction_type)::text = 'CALL'::text) THEN ci.interaction_datetime
                    ELSE NULL::timestamp with time zone
                END) AS last_call_date,
            max((
                CASE
                    WHEN ((ci.interaction_type)::text = 'CALL'::text) THEN ci.outcome
                    ELSE NULL::character varying
                END)::text) AS last_call_outcome,
            max(ci.interaction_datetime) AS last_contact_date
           FROM kastle_collection.collection_interactions ci
          GROUP BY ci.officer_id, ci.case_id, ci.customer_id, (date_trunc('month'::text, ci.interaction_datetime))
        )
 SELECT officer_id,
    case_id,
    customer_id,
    month,
    calls_count,
    messages_count,
    last_call_date,
    last_call_outcome,
    last_contact_date,
        CASE
            WHEN (month = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) THEN calls_count
            ELSE (0)::bigint
        END AS calls_this_month,
        CASE
            WHEN (month = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) THEN messages_count
            ELSE (0)::bigint
        END AS messages_this_month
   FROM monthly_calls mc;


ALTER VIEW kastle_collection.v_officer_communication_summary OWNER TO postgres;

--
-- Name: v_risk_score_trend; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_risk_score_trend AS
 WITH monthly_risk AS (
         SELECT date_trunc('month'::text, cc.created_at) AS month,
                CASE
                    WHEN (((cc.priority)::text = 'LOW'::text) OR (cc.days_past_due <= 30)) THEN 'low'::text
                    WHEN (((cc.priority)::text = 'MEDIUM'::text) OR ((cc.days_past_due >= 31) AND (cc.days_past_due <= 60))) THEN 'medium'::text
                    WHEN (((cc.priority)::text = 'HIGH'::text) OR ((cc.days_past_due >= 61) AND (cc.days_past_due <= 90))) THEN 'high'::text
                    WHEN (((cc.priority)::text = 'CRITICAL'::text) OR (cc.days_past_due > 90)) THEN 'critical'::text
                    ELSE NULL::text
                END AS risk_category,
            count(*) AS count
           FROM kastle_banking.collection_cases cc
          WHERE (cc.created_at >= (CURRENT_DATE - '6 mons'::interval))
          GROUP BY (date_trunc('month'::text, cc.created_at)),
                CASE
                    WHEN (((cc.priority)::text = 'LOW'::text) OR (cc.days_past_due <= 30)) THEN 'low'::text
                    WHEN (((cc.priority)::text = 'MEDIUM'::text) OR ((cc.days_past_due >= 31) AND (cc.days_past_due <= 60))) THEN 'medium'::text
                    WHEN (((cc.priority)::text = 'HIGH'::text) OR ((cc.days_past_due >= 61) AND (cc.days_past_due <= 90))) THEN 'high'::text
                    WHEN (((cc.priority)::text = 'CRITICAL'::text) OR (cc.days_past_due > 90)) THEN 'critical'::text
                    ELSE NULL::text
                END
        )
 SELECT to_char(month, 'Mon'::text) AS date,
    sum(
        CASE
            WHEN (risk_category = 'low'::text) THEN count
            ELSE (0)::bigint
        END) AS low,
    sum(
        CASE
            WHEN (risk_category = 'medium'::text) THEN count
            ELSE (0)::bigint
        END) AS medium,
    sum(
        CASE
            WHEN (risk_category = 'high'::text) THEN count
            ELSE (0)::bigint
        END) AS high,
    sum(
        CASE
            WHEN (risk_category = 'critical'::text) THEN count
            ELSE (0)::bigint
        END) AS critical
   FROM monthly_risk
  GROUP BY month
  ORDER BY month;


ALTER VIEW kastle_collection.v_risk_score_trend OWNER TO postgres;

--
-- Name: v_specialist_loan_portfolio; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.v_specialist_loan_portfolio AS
 SELECT cc.case_id,
    cc.case_number,
    cc.customer_id,
    cc.loan_account_number,
    cc.account_number,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    cc.penalty_outstanding,
    cc.days_past_due,
    cc.case_status,
    cc.assigned_to AS officer_id,
    cc.priority,
    cc.created_at AS case_created_at,
    co.officer_name,
    co.officer_type,
    co.team_id,
    ld.loan_account_id,
    ld.principal_amount AS loan_amount,
    ld.paid_amount,
    ld.due_amount,
    ld.not_due_amount,
    ld.overdue_days,
    ld.delinquency_bucket,
    ld.disbursement_date,
    ld.maturity_date,
    ld.loan_status,
    ld.product_name,
    ld.product_type,
    ld.customer_name,
    ld.customer_type,
    cs.calls_this_month,
    cs.messages_this_month,
    cs.last_contact_date,
    cs.last_call_outcome,
    ptp.ptp_amount,
    ptp.ptp_date,
    ptp.status AS ptp_status,
        CASE
            WHEN (ptp.ptp_id IS NOT NULL) THEN true
            ELSE false
        END AS has_promise_to_pay
   FROM ((((kastle_banking.collection_cases cc
     LEFT JOIN kastle_collection.collection_officers co ON (((cc.assigned_to)::text = (co.officer_id)::text)))
     LEFT JOIN kastle_collection.v_loan_installment_details ld ON (((cc.loan_account_number)::text = (ld.loan_account_number)::text)))
     LEFT JOIN kastle_collection.v_officer_communication_summary cs ON ((((cc.assigned_to)::text = (cs.officer_id)::text) AND (cc.case_id = cs.case_id) AND (cs.month = date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))))
     LEFT JOIN kastle_collection.promise_to_pay ptp ON (((cc.case_id = ptp.case_id) AND ((ptp.status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'PENDING'::character varying])::text[])))))
  WHERE ((cc.case_status)::text <> 'CLOSED'::text);


ALTER VIEW kastle_collection.v_specialist_loan_portfolio OWNER TO postgres;

--
-- Name: vw_daily_collection_dashboard; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.vw_daily_collection_dashboard AS
 SELECT d.summary_date,
    d.branch_id,
    b.branch_name,
    d.total_due_amount,
    d.total_collected,
    d.collection_rate,
    d.accounts_due,
    d.accounts_collected,
    d.ptps_obtained,
    d.ptps_kept,
    d.digital_payments,
        CASE
            WHEN (d.collection_rate >= (35)::numeric) THEN 'EXCELLENT'::text
            WHEN (d.collection_rate >= (25)::numeric) THEN 'GOOD'::text
            WHEN (d.collection_rate >= (15)::numeric) THEN 'AVERAGE'::text
            ELSE 'POOR'::text
        END AS performance_status
   FROM (kastle_collection.daily_collection_summary d
     JOIN kastle_banking.branches b ON (((d.branch_id)::text = (b.branch_id)::text)));


ALTER VIEW kastle_collection.vw_daily_collection_dashboard OWNER TO postgres;

--
-- Name: vw_officer_performance; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.vw_officer_performance AS
 SELECT o.officer_id,
    o.officer_name,
    o.team_id,
    t.team_name,
    date_trunc('month'::text, (m.metric_date)::timestamp with time zone) AS month,
    sum(m.accounts_worked) AS total_accounts_worked,
    sum(m.amount_collected) AS total_collected,
    avg(m.ptps_kept_rate) AS avg_ptp_kept_rate,
    avg(m.quality_score) AS avg_quality_score,
    sum(m.customer_complaints) AS total_complaints
   FROM ((kastle_collection.collection_officers o
     JOIN kastle_collection.collection_teams t ON ((o.team_id = t.team_id)))
     LEFT JOIN kastle_collection.officer_performance_metrics m ON (((o.officer_id)::text = (m.officer_id)::text)))
  GROUP BY o.officer_id, o.officer_name, o.team_id, t.team_name, (date_trunc('month'::text, (m.metric_date)::timestamp with time zone));


ALTER VIEW kastle_collection.vw_officer_performance OWNER TO postgres;

--
-- Name: vw_portfolio_aging; Type: VIEW; Schema: kastle_collection; Owner: postgres
--

CREATE VIEW kastle_collection.vw_portfolio_aging AS
 SELECT cb.bucket_name,
    cb.min_dpd,
    cb.max_dpd,
    count(DISTINCT cc.case_id) AS case_count,
    count(DISTINCT cc.customer_id) AS customer_count,
    sum(cc.total_outstanding) AS total_outstanding,
    avg(cc.days_past_due) AS avg_dpd,
    sum(
        CASE
            WHEN ((cc.case_status)::text = 'ACTIVE'::text) THEN cc.total_outstanding
            ELSE (0)::numeric
        END) AS active_outstanding
   FROM (kastle_banking.collection_cases cc
     JOIN kastle_banking.collection_buckets cb ON ((cc.bucket_id = cb.bucket_id)))
  GROUP BY cb.bucket_id, cb.bucket_name, cb.min_dpd, cb.max_dpd
  ORDER BY cb.min_dpd;


ALTER VIEW kastle_collection.vw_portfolio_aging OWNER TO postgres;

--
-- Name: aging_distribution; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.aging_distribution AS
 SELECT bucket_name,
    display_order,
    amount,
    count,
    percentage
   FROM ( VALUES ('Current'::text,1,(1875000000)::numeric,(8500)::bigint,75.0), ('1-30 Days'::text,2,(250000000)::numeric,(1200)::bigint,10.0), ('31-60 Days'::text,3,(150000000)::numeric,(800)::bigint,6.0), ('61-90 Days'::text,4,(100000000)::numeric,(500)::bigint,4.0), ('91-180 Days'::text,5,(75000000)::numeric,(300)::bigint,3.0), ('181-365 Days'::text,6,(35000000)::numeric,(150)::bigint,1.4), ('Over 365 Days'::text,7,(15000000)::numeric,(50)::bigint,0.6)) t(bucket_name, display_order, amount, count, percentage);


ALTER VIEW public.aging_distribution OWNER TO postgres;

--
-- Name: collection_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_cases (
    case_id integer NOT NULL,
    case_number character varying DEFAULT ((('COLL'::text || to_char(now(), 'YYYYMMDD'::text)) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    customer_id character varying,
    loan_account_number character varying,
    officer_id character varying,
    loan_amount numeric(15,2),
    outstanding_balance numeric(15,2),
    overdue_amount numeric(15,2),
    overdue_days integer DEFAULT 0,
    delinquency_bucket character varying,
    priority_level character varying,
    loan_status character varying,
    product_type character varying,
    last_payment_date date,
    last_payment_amount numeric(15,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collection_cases_loan_status_check CHECK (((loan_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'RESOLVED'::character varying, 'LEGAL'::character varying, 'WRITTEN_OFF'::character varying, 'SETTLED'::character varying, 'CLOSED'::character varying])::text[]))),
    CONSTRAINT collection_cases_priority_level_check CHECK (((priority_level)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[])))
);


ALTER TABLE public.collection_cases OWNER TO postgres;

--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collection_cases_case_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collection_cases_case_id_seq OWNER TO postgres;

--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collection_cases_case_id_seq OWNED BY public.collection_cases.case_id;


--
-- Name: collection_interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_interactions (
    interaction_id integer NOT NULL,
    case_id integer,
    officer_id character varying,
    interaction_type character varying,
    interaction_datetime timestamp with time zone,
    response_received boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collection_interactions_interaction_type_check CHECK (((interaction_type)::text = ANY ((ARRAY['CALL'::character varying, 'SMS'::character varying, 'EMAIL'::character varying, 'VISIT'::character varying, 'LETTER'::character varying])::text[])))
);


ALTER TABLE public.collection_interactions OWNER TO postgres;

--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.collection_interactions_interaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collection_interactions_interaction_id_seq OWNER TO postgres;

--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.collection_interactions_interaction_id_seq OWNED BY public.collection_interactions.interaction_id;


--
-- Name: collection_officers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collection_officers (
    officer_id character varying NOT NULL,
    full_name character varying NOT NULL,
    email character varying,
    mobile_number character varying,
    department character varying,
    status character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collection_officers_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'ON_LEAVE'::character varying])::text[])))
);


ALTER TABLE public.collection_officers OWNER TO postgres;

--
-- Name: collection_rates; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.collection_rates AS
 SELECT date_trunc('month'::text, (CURRENT_DATE - ('1 mon'::interval * (n)::double precision))) AS period_date,
    'MONTHLY'::text AS period_type,
    (((40000000)::double precision + (random() * (10000000)::double precision)))::numeric AS collection_amount,
    (((35)::double precision + (random() * (10)::double precision)))::numeric AS collection_rate,
    (((85)::double precision + (random() * (10)::double precision)))::numeric AS recovery_rate
   FROM generate_series(0, 11) s(n)
  ORDER BY (date_trunc('month'::text, (CURRENT_DATE - ('1 mon'::interval * (n)::double precision)))) DESC;


ALTER VIEW public.collection_rates OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id character varying NOT NULL,
    full_name character varying NOT NULL,
    national_id character varying,
    mobile_number character varying,
    email character varying,
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: executive_delinquency_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.executive_delinquency_summary AS
 SELECT CURRENT_DATE AS snapshot_date,
    ('2500000000'::bigint)::numeric AS total_portfolio_value,
    (125000000)::numeric AS delinquent_amount,
    5.0 AS delinquency_rate,
    (45000000)::numeric AS collection_amount_mtd,
    36.0 AS recovery_rate,
    (1234)::bigint AS active_cases,
    5.5 AS prev_delinquency_rate,
    34.0 AS prev_recovery_rate,
    (42000000)::numeric AS prev_collection_amount;


ALTER VIEW public.executive_delinquency_summary OWNER TO postgres;

--
-- Name: kastle_banking.account_types; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.account_types" AS
 SELECT type_id,
    type_code,
    type_name,
    account_category,
    description
   FROM kastle_banking.account_types;


ALTER VIEW public."kastle_banking.account_types" OWNER TO postgres;

--
-- Name: kastle_banking.accounts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.accounts" AS
 SELECT account_id,
    account_number,
    customer_id,
    account_type_id,
    product_id,
    branch_id,
    currency_code,
    account_status,
    opening_date,
    closing_date,
    current_balance,
    available_balance,
    hold_amount,
    unclear_balance,
    minimum_balance,
    overdraft_limit,
    interest_rate,
    last_transaction_date,
    maturity_date,
    joint_holder_ids,
    nominee_details,
    is_salary_account,
    is_minor_account,
    guardian_id,
    created_at,
    updated_at
   FROM kastle_banking.accounts;


ALTER VIEW public."kastle_banking.accounts" OWNER TO postgres;

--
-- Name: kastle_banking.audit_trail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.audit_trail" AS
 SELECT audit_id,
    table_name,
    record_id,
    action,
    user_id,
    auth_user_id,
    user_ip,
    old_values,
    new_values,
    action_timestamp,
    session_id,
    remarks
   FROM kastle_banking.audit_trail;


ALTER VIEW public."kastle_banking.audit_trail" OWNER TO postgres;

--
-- Name: kastle_banking.auth_user_profiles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.auth_user_profiles" AS
 SELECT id,
    auth_user_id,
    bank_user_id,
    customer_id,
    user_type,
    created_at,
    updated_at
   FROM kastle_banking.auth_user_profiles;


ALTER VIEW public."kastle_banking.auth_user_profiles" OWNER TO postgres;

--
-- Name: kastle_banking.bank_config; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.bank_config" AS
 SELECT config_id,
    bank_code,
    bank_name,
    head_office_address,
    swift_code,
    routing_number,
    regulatory_license,
    fiscal_year_start,
    created_at,
    updated_at
   FROM kastle_banking.bank_config;


ALTER VIEW public."kastle_banking.bank_config" OWNER TO postgres;

--
-- Name: kastle_banking.branches; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.branches" AS
 SELECT branch_id,
    branch_name,
    branch_type,
    address,
    city,
    state,
    country_code,
    postal_code,
    phone,
    email,
    manager_id,
    opening_date,
    is_active,
    created_at,
    updated_at
   FROM kastle_banking.branches;


ALTER VIEW public."kastle_banking.branches" OWNER TO postgres;

--
-- Name: kastle_banking.collection_buckets; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.collection_buckets" AS
 SELECT bucket_id,
    bucket_code,
    bucket_name,
    min_dpd,
    max_dpd,
    priority_level,
    collection_strategy,
    description,
    is_active,
    created_at
   FROM kastle_banking.collection_buckets;


ALTER VIEW public."kastle_banking.collection_buckets" OWNER TO postgres;

--
-- Name: kastle_banking.collection_cases; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.collection_cases" AS
 SELECT case_id,
    case_number,
    customer_id,
    account_number,
    account_type,
    loan_account_number,
    card_number,
    bucket_id,
    total_outstanding,
    principal_outstanding,
    interest_outstanding,
    penalty_outstanding,
    other_charges,
    days_past_due,
    last_payment_date,
    last_payment_amount,
    case_status,
    assigned_to,
    assignment_date,
    priority,
    branch_id,
    created_at,
    updated_at
   FROM kastle_banking.collection_cases;


ALTER VIEW public."kastle_banking.collection_cases" OWNER TO postgres;

--
-- Name: kastle_banking.countries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.countries" AS
 SELECT country_code,
    country_name,
    iso_code,
    currency_code,
    is_active,
    created_at,
    updated_at
   FROM kastle_banking.countries;


ALTER VIEW public."kastle_banking.countries" OWNER TO postgres;

--
-- Name: kastle_banking.currencies; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.currencies" AS
 SELECT currency_code,
    currency_name,
    currency_symbol,
    decimal_places,
    is_active,
    created_at
   FROM kastle_banking.currencies;


ALTER VIEW public."kastle_banking.currencies" OWNER TO postgres;

--
-- Name: kastle_banking.customer_addresses; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.customer_addresses" AS
 SELECT address_id,
    customer_id,
    address_type,
    address_line1,
    address_line2,
    city,
    state,
    country_code,
    postal_code,
    is_primary,
    created_at,
    updated_at
   FROM kastle_banking.customer_addresses;


ALTER VIEW public."kastle_banking.customer_addresses" OWNER TO postgres;

--
-- Name: kastle_banking.customer_contacts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.customer_contacts" AS
 SELECT contact_id,
    customer_id,
    contact_type,
    contact_value,
    is_primary,
    is_verified,
    verified_date,
    created_at
   FROM kastle_banking.customer_contacts;


ALTER VIEW public."kastle_banking.customer_contacts" OWNER TO postgres;

--
-- Name: kastle_banking.customer_documents; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.customer_documents" AS
 SELECT document_id,
    customer_id,
    document_type,
    document_number,
    issuing_authority,
    issue_date,
    expiry_date,
    document_path,
    document_url,
    bucket_name,
    verification_status,
    verified_by,
    verified_date,
    created_at
   FROM kastle_banking.customer_documents;


ALTER VIEW public."kastle_banking.customer_documents" OWNER TO postgres;

--
-- Name: kastle_banking.customer_types; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.customer_types" AS
 SELECT type_id,
    type_code,
    type_name,
    description
   FROM kastle_banking.customer_types;


ALTER VIEW public."kastle_banking.customer_types" OWNER TO postgres;

--
-- Name: kastle_banking.customers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.customers" AS
 SELECT customer_id,
    auth_user_id,
    customer_type_id,
    first_name,
    middle_name,
    last_name,
    full_name,
    gender,
    date_of_birth,
    nationality,
    marital_status,
    education_level,
    occupation,
    annual_income,
    income_source,
    tax_id,
    employer_name,
    employment_type,
    preferred_language,
    segment,
    relationship_manager,
    onboarding_branch,
    onboarding_date,
    kyc_status,
    risk_category,
    is_active,
    is_pep,
    created_at,
    updated_at
   FROM kastle_banking.customers;


ALTER VIEW public."kastle_banking.customers" OWNER TO postgres;

--
-- Name: kastle_banking.loan_accounts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.loan_accounts" AS
 SELECT loan_account_id,
    loan_account_number,
    application_id,
    customer_id,
    product_id,
    principal_amount,
    interest_rate,
    tenure_months,
    emi_amount,
    disbursement_date,
    first_emi_date,
    maturity_date,
    outstanding_principal,
    outstanding_interest,
    total_interest_paid,
    total_principal_paid,
    overdue_amount,
    overdue_days,
    loan_status,
    npa_date,
    settlement_amount,
    settlement_date,
    created_at,
    updated_at,
    outstanding_balance
   FROM kastle_banking.loan_accounts;


ALTER VIEW public."kastle_banking.loan_accounts" OWNER TO postgres;

--
-- Name: kastle_banking.loan_applications; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.loan_applications" AS
 SELECT application_id,
    application_number,
    customer_id,
    product_id,
    requested_amount,
    approved_amount,
    tenure_months,
    interest_rate,
    purpose,
    collateral_details,
    guarantor_details,
    application_date,
    application_status,
    rejection_reason,
    credit_score,
    risk_rating,
    processing_fee,
    insurance_premium,
    branch_id,
    relationship_officer,
    created_at,
    updated_at
   FROM kastle_banking.loan_applications;


ALTER VIEW public."kastle_banking.loan_applications" OWNER TO postgres;

--
-- Name: kastle_banking.product_categories; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.product_categories" AS
 SELECT category_id,
    category_code,
    category_name,
    category_type,
    description,
    is_active,
    created_at
   FROM kastle_banking.product_categories;


ALTER VIEW public."kastle_banking.product_categories" OWNER TO postgres;

--
-- Name: kastle_banking.products; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.products" AS
 SELECT product_id,
    product_code,
    product_name,
    category_id,
    product_type,
    min_balance,
    max_balance,
    interest_rate,
    tenure_months,
    features,
    eligibility_criteria,
    documents_required,
    is_active,
    launch_date,
    end_date,
    created_at,
    updated_at
   FROM kastle_banking.products;


ALTER VIEW public."kastle_banking.products" OWNER TO postgres;

--
-- Name: kastle_banking.realtime_notifications; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.realtime_notifications" AS
 SELECT id,
    customer_id,
    notification_type,
    title,
    message,
    data,
    is_read,
    created_at
   FROM kastle_banking.realtime_notifications;


ALTER VIEW public."kastle_banking.realtime_notifications" OWNER TO postgres;

--
-- Name: kastle_banking.transaction_types; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.transaction_types" AS
 SELECT type_id,
    type_code,
    type_name,
    transaction_category,
    affects_balance,
    requires_approval,
    min_amount,
    max_amount,
    charge_applicable
   FROM kastle_banking.transaction_types;


ALTER VIEW public."kastle_banking.transaction_types" OWNER TO postgres;

--
-- Name: kastle_banking.transactions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public."kastle_banking.transactions" AS
 SELECT transaction_id,
    transaction_ref,
    transaction_date,
    value_date,
    account_number,
    transaction_type_id,
    debit_credit,
    transaction_amount,
    currency_code,
    running_balance,
    contra_account,
    channel,
    reference_number,
    cheque_number,
    narration,
    beneficiary_name,
    beneficiary_account,
    beneficiary_bank,
    status,
    approval_status,
    approved_by,
    reversal_ref,
    branch_id,
    teller_id,
    device_id,
    ip_address,
    created_at,
    posted_at
   FROM kastle_banking.transactions;


ALTER VIEW public."kastle_banking.transactions" OWNER TO postgres;

--
-- Name: officer_performance_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.officer_performance_summary (
    summary_id uuid DEFAULT gen_random_uuid() NOT NULL,
    officer_id character varying(50) NOT NULL,
    summary_date date NOT NULL,
    total_cases integer DEFAULT 0,
    total_calls integer DEFAULT 0,
    total_messages integer DEFAULT 0,
    total_ptps integer DEFAULT 0,
    ptps_kept integer DEFAULT 0,
    collection_amount numeric(15,2) DEFAULT 0,
    collection_rate numeric(5,2) DEFAULT 0,
    contact_rate numeric(5,2) DEFAULT 0,
    ptp_keep_rate numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.officer_performance_summary OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    case_id integer,
    payment_date date NOT NULL,
    payment_amount numeric(15,2) NOT NULL,
    payment_method character varying,
    reference_number character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: promise_to_pay; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promise_to_pay (
    ptp_id integer NOT NULL,
    case_id integer,
    officer_id character varying,
    promise_date date NOT NULL,
    promise_amount numeric(15,2) NOT NULL,
    status character varying,
    actual_payment_date date,
    actual_payment_amount numeric(15,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT promise_to_pay_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'KEPT'::character varying, 'BROKEN'::character varying, 'PARTIAL'::character varying])::text[])))
);


ALTER TABLE public.promise_to_pay OWNER TO postgres;

--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promise_to_pay_ptp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promise_to_pay_ptp_id_seq OWNER TO postgres;

--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promise_to_pay_ptp_id_seq OWNED BY public.promise_to_pay.ptp_id;


--
-- Name: top_delinquent_customers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.top_delinquent_customers AS
 SELECT customer_id,
    customer_name,
    outstanding_amount,
    days_past_due,
    aging_bucket
   FROM ( VALUES ('C001'::text,'ABC Corporation'::text,(15000000)::numeric,120,'91-180 Days'::text), ('C002'::text,'XYZ Industries'::text,(12000000)::numeric,95,'91-180 Days'::text), ('C003'::text,'Global Trading Co.'::text,(10000000)::numeric,65,'61-90 Days'::text), ('C004'::text,'Tech Solutions Ltd.'::text,(8500000)::numeric,45,'31-60 Days'::text), ('C005'::text,'Prime Retail Group'::text,(7200000)::numeric,35,'31-60 Days'::text), ('C006'::text,'Innovation Hub'::text,(6800000)::numeric,185,'181-365 Days'::text), ('C007'::text,'Smart Systems Inc.'::text,(5500000)::numeric,25,'1-30 Days'::text), ('C008'::text,'Future Enterprises'::text,(4200000)::numeric,400,'Over 365 Days'::text), ('C009'::text,'Dynamic Solutions'::text,(3800000)::numeric,55,'31-60 Days'::text), ('C010'::text,'Growth Partners Ltd.'::text,(3200000)::numeric,15,'1-30 Days'::text)) t(customer_id, customer_name, outstanding_amount, days_past_due, aging_bucket);


ALTER VIEW public.top_delinquent_customers OWNER TO postgres;

--
-- Name: v_specialist_loan_portfolio; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_specialist_loan_portfolio AS
 SELECT cc.case_id,
    cc.loan_account_number,
    cc.customer_id,
    cc.officer_id,
    cc.loan_amount,
    cc.outstanding_balance,
    cc.overdue_amount AS due_amount,
    cc.overdue_days,
    cc.delinquency_bucket,
    cc.priority_level,
    cc.loan_status,
    cc.product_type,
    cc.last_payment_date,
    cc.last_payment_amount,
    cc.created_at,
    cc.updated_at,
    c.full_name AS customer_name,
    c.national_id,
    c.mobile_number,
    (cc.loan_amount - cc.outstanding_balance) AS paid_amount,
    ci.interaction_datetime AS last_contact_date
   FROM ((public.collection_cases cc
     LEFT JOIN public.customers c ON (((cc.customer_id)::text = (c.customer_id)::text)))
     LEFT JOIN LATERAL ( SELECT collection_interactions.interaction_datetime
           FROM public.collection_interactions
          WHERE (collection_interactions.case_id = cc.case_id)
          ORDER BY collection_interactions.interaction_datetime DESC
         LIMIT 1) ci ON (true));


ALTER VIEW public.v_specialist_loan_portfolio OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2025_07_23; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_07_23 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_07_23 OWNER TO supabase_admin;

--
-- Name: messages_2025_07_24; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_07_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_07_24 OWNER TO supabase_admin;

--
-- Name: messages_2025_07_25; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_07_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_07_25 OWNER TO supabase_admin;

--
-- Name: messages_2025_07_26; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_07_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_07_26 OWNER TO supabase_admin;

--
-- Name: messages_2025_07_27; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_07_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_07_27 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: messages_2025_07_23; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_23 FOR VALUES FROM ('2025-07-23 00:00:00') TO ('2025-07-24 00:00:00');


--
-- Name: messages_2025_07_24; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_24 FOR VALUES FROM ('2025-07-24 00:00:00') TO ('2025-07-25 00:00:00');


--
-- Name: messages_2025_07_25; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_25 FOR VALUES FROM ('2025-07-25 00:00:00') TO ('2025-07-26 00:00:00');


--
-- Name: messages_2025_07_26; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_26 FOR VALUES FROM ('2025-07-26 00:00:00') TO ('2025-07-27 00:00:00');


--
-- Name: messages_2025_07_27; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_07_27 FOR VALUES FROM ('2025-07-27 00:00:00') TO ('2025-07-28 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: account_types type_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.account_types ALTER COLUMN type_id SET DEFAULT nextval('kastle_banking.account_types_type_id_seq'::regclass);


--
-- Name: accounts account_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts ALTER COLUMN account_id SET DEFAULT nextval('kastle_banking.accounts_account_id_seq'::regclass);


--
-- Name: aging_buckets id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.aging_buckets ALTER COLUMN id SET DEFAULT nextval('kastle_banking.aging_buckets_id_seq'::regclass);


--
-- Name: audit_trail audit_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.audit_trail ALTER COLUMN audit_id SET DEFAULT nextval('kastle_banking.audit_trail_audit_id_seq'::regclass);


--
-- Name: bank_config config_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.bank_config ALTER COLUMN config_id SET DEFAULT nextval('kastle_banking.bank_config_config_id_seq'::regclass);


--
-- Name: branch_collection_performance id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.branch_collection_performance ALTER COLUMN id SET DEFAULT nextval('kastle_banking.branch_collection_performance_id_seq'::regclass);


--
-- Name: collection_buckets bucket_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_buckets ALTER COLUMN bucket_id SET DEFAULT nextval('kastle_banking.collection_buckets_bucket_id_seq'::regclass);


--
-- Name: collection_cases case_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases ALTER COLUMN case_id SET DEFAULT nextval('kastle_banking.collection_cases_case_id_seq'::regclass);


--
-- Name: collection_rates id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_rates ALTER COLUMN id SET DEFAULT nextval('kastle_banking.collection_rates_id_seq'::regclass);


--
-- Name: customer_addresses address_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_addresses ALTER COLUMN address_id SET DEFAULT nextval('kastle_banking.customer_addresses_address_id_seq'::regclass);


--
-- Name: customer_contacts contact_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_contacts ALTER COLUMN contact_id SET DEFAULT nextval('kastle_banking.customer_contacts_contact_id_seq'::regclass);


--
-- Name: customer_documents document_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_documents ALTER COLUMN document_id SET DEFAULT nextval('kastle_banking.customer_documents_document_id_seq'::regclass);


--
-- Name: customer_types type_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_types ALTER COLUMN type_id SET DEFAULT nextval('kastle_banking.customer_types_type_id_seq'::regclass);


--
-- Name: delinquencies id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquencies ALTER COLUMN id SET DEFAULT nextval('kastle_banking.delinquencies_id_seq'::regclass);


--
-- Name: delinquency_history id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquency_history ALTER COLUMN id SET DEFAULT nextval('kastle_banking.delinquency_history_id_seq'::regclass);


--
-- Name: loan_accounts loan_account_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts ALTER COLUMN loan_account_id SET DEFAULT nextval('kastle_banking.loan_accounts_loan_account_id_seq'::regclass);


--
-- Name: loan_applications application_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications ALTER COLUMN application_id SET DEFAULT nextval('kastle_banking.loan_applications_application_id_seq'::regclass);


--
-- Name: portfolio_summary id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.portfolio_summary ALTER COLUMN id SET DEFAULT nextval('kastle_banking.portfolio_summary_id_seq'::regclass);


--
-- Name: product_categories category_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.product_categories ALTER COLUMN category_id SET DEFAULT nextval('kastle_banking.product_categories_category_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.products ALTER COLUMN product_id SET DEFAULT nextval('kastle_banking.products_product_id_seq'::regclass);


--
-- Name: transaction_types type_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transaction_types ALTER COLUMN type_id SET DEFAULT nextval('kastle_banking.transaction_types_type_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('kastle_banking.transactions_transaction_id_seq'::regclass);


--
-- Name: access_log access_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.access_log ALTER COLUMN access_id SET DEFAULT nextval('kastle_collection.access_log_access_id_seq'::regclass);


--
-- Name: audit_log audit_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.audit_log ALTER COLUMN audit_id SET DEFAULT nextval('kastle_collection.audit_log_audit_id_seq'::regclass);


--
-- Name: collection_audit_trail audit_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_audit_trail ALTER COLUMN audit_id SET DEFAULT nextval('kastle_collection.collection_audit_trail_audit_id_seq'::regclass);


--
-- Name: collection_automation_metrics metric_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_automation_metrics ALTER COLUMN metric_id SET DEFAULT nextval('kastle_collection.collection_automation_metrics_metric_id_seq'::regclass);


--
-- Name: collection_benchmarks benchmark_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_benchmarks ALTER COLUMN benchmark_id SET DEFAULT nextval('kastle_collection.collection_benchmarks_benchmark_id_seq'::regclass);


--
-- Name: collection_bucket_movement movement_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement ALTER COLUMN movement_id SET DEFAULT nextval('kastle_collection.collection_bucket_movement_movement_id_seq'::regclass);


--
-- Name: collection_call_records call_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_call_records ALTER COLUMN call_id SET DEFAULT nextval('kastle_collection.collection_call_records_call_id_seq'::regclass);


--
-- Name: collection_campaigns campaign_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_campaigns ALTER COLUMN campaign_id SET DEFAULT nextval('kastle_collection.collection_campaigns_campaign_id_seq'::regclass);


--
-- Name: collection_case_details case_detail_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_case_details ALTER COLUMN case_detail_id SET DEFAULT nextval('kastle_collection.collection_case_details_case_detail_id_seq'::regclass);


--
-- Name: collection_compliance_violations violation_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_compliance_violations ALTER COLUMN violation_id SET DEFAULT nextval('kastle_collection.collection_compliance_violations_violation_id_seq'::regclass);


--
-- Name: collection_contact_attempts attempt_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_contact_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('kastle_collection.collection_contact_attempts_attempt_id_seq'::regclass);


--
-- Name: collection_customer_segments segment_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_customer_segments ALTER COLUMN segment_id SET DEFAULT nextval('kastle_collection.collection_customer_segments_segment_id_seq'::regclass);


--
-- Name: collection_forecasts forecast_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_forecasts ALTER COLUMN forecast_id SET DEFAULT nextval('kastle_collection.collection_forecasts_forecast_id_seq'::regclass);


--
-- Name: collection_interactions interaction_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_interactions ALTER COLUMN interaction_id SET DEFAULT nextval('kastle_collection.collection_interactions_interaction_id_seq'::regclass);


--
-- Name: collection_provisions provision_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_provisions ALTER COLUMN provision_id SET DEFAULT nextval('kastle_collection.collection_provisions_provision_id_seq'::regclass);


--
-- Name: collection_queue_management queue_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_queue_management ALTER COLUMN queue_id SET DEFAULT nextval('kastle_collection.collection_queue_management_queue_id_seq'::regclass);


--
-- Name: collection_risk_assessment assessment_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_risk_assessment ALTER COLUMN assessment_id SET DEFAULT nextval('kastle_collection.collection_risk_assessment_assessment_id_seq'::regclass);


--
-- Name: collection_scores score_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_scores ALTER COLUMN score_id SET DEFAULT nextval('kastle_collection.collection_scores_score_id_seq'::regclass);


--
-- Name: collection_settlement_offers offer_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_settlement_offers ALTER COLUMN offer_id SET DEFAULT nextval('kastle_collection.collection_settlement_offers_offer_id_seq'::regclass);


--
-- Name: collection_strategies strategy_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_strategies ALTER COLUMN strategy_id SET DEFAULT nextval('kastle_collection.collection_strategies_strategy_id_seq'::regclass);


--
-- Name: collection_system_performance log_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_system_performance ALTER COLUMN log_id SET DEFAULT nextval('kastle_collection.collection_system_performance_log_id_seq'::regclass);


--
-- Name: collection_teams team_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_teams ALTER COLUMN team_id SET DEFAULT nextval('kastle_collection.collection_teams_team_id_seq'::regclass);


--
-- Name: collection_vintage_analysis vintage_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_vintage_analysis ALTER COLUMN vintage_id SET DEFAULT nextval('kastle_collection.collection_vintage_analysis_vintage_id_seq'::regclass);


--
-- Name: collection_workflow_templates template_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_workflow_templates ALTER COLUMN template_id SET DEFAULT nextval('kastle_collection.collection_workflow_templates_template_id_seq'::regclass);


--
-- Name: collection_write_offs write_off_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_write_offs ALTER COLUMN write_off_id SET DEFAULT nextval('kastle_collection.collection_write_offs_write_off_id_seq'::regclass);


--
-- Name: daily_collection_summary summary_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.daily_collection_summary ALTER COLUMN summary_id SET DEFAULT nextval('kastle_collection.daily_collection_summary_summary_id_seq'::regclass);


--
-- Name: data_masking_rules rule_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.data_masking_rules ALTER COLUMN rule_id SET DEFAULT nextval('kastle_collection.data_masking_rules_rule_id_seq'::regclass);


--
-- Name: digital_collection_attempts attempt_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.digital_collection_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('kastle_collection.digital_collection_attempts_attempt_id_seq'::regclass);


--
-- Name: field_visits visit_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.field_visits ALTER COLUMN visit_id SET DEFAULT nextval('kastle_collection.field_visits_visit_id_seq'::regclass);


--
-- Name: hardship_applications application_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.hardship_applications ALTER COLUMN application_id SET DEFAULT nextval('kastle_collection.hardship_applications_application_id_seq'::regclass);


--
-- Name: ivr_payment_attempts attempt_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.ivr_payment_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('kastle_collection.ivr_payment_attempts_attempt_id_seq'::regclass);


--
-- Name: legal_cases legal_case_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.legal_cases ALTER COLUMN legal_case_id SET DEFAULT nextval('kastle_collection.legal_cases_legal_case_id_seq'::regclass);


--
-- Name: loan_restructuring restructure_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.loan_restructuring ALTER COLUMN restructure_id SET DEFAULT nextval('kastle_collection.loan_restructuring_restructure_id_seq'::regclass);


--
-- Name: officer_performance_metrics metric_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_metrics ALTER COLUMN metric_id SET DEFAULT nextval('kastle_collection.officer_performance_metrics_metric_id_seq'::regclass);


--
-- Name: officer_performance_summary summary_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_summary ALTER COLUMN summary_id SET DEFAULT nextval('kastle_collection.officer_performance_summary_summary_id_seq'::regclass);


--
-- Name: performance_metrics metric_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.performance_metrics ALTER COLUMN metric_id SET DEFAULT nextval('kastle_collection.performance_metrics_metric_id_seq'::regclass);


--
-- Name: promise_to_pay ptp_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay ALTER COLUMN ptp_id SET DEFAULT nextval('kastle_collection.promise_to_pay_ptp_id_seq'::regclass);


--
-- Name: repossessed_assets asset_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.repossessed_assets ALTER COLUMN asset_id SET DEFAULT nextval('kastle_collection.repossessed_assets_asset_id_seq'::regclass);


--
-- Name: sharia_compliance_log compliance_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.sharia_compliance_log ALTER COLUMN compliance_id SET DEFAULT nextval('kastle_collection.sharia_compliance_log_compliance_id_seq'::regclass);


--
-- Name: user_role_assignments assignment_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_role_assignments ALTER COLUMN assignment_id SET DEFAULT nextval('kastle_collection.user_role_assignments_assignment_id_seq'::regclass);


--
-- Name: user_roles role_id; Type: DEFAULT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_roles ALTER COLUMN role_id SET DEFAULT nextval('kastle_collection.user_roles_role_id_seq'::regclass);


--
-- Name: collection_cases case_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_cases ALTER COLUMN case_id SET DEFAULT nextval('public.collection_cases_case_id_seq'::regclass);


--
-- Name: collection_interactions interaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_interactions ALTER COLUMN interaction_id SET DEFAULT nextval('public.collection_interactions_interaction_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: promise_to_pay ptp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promise_to_pay ALTER COLUMN ptp_id SET DEFAULT nextval('public.promise_to_pay_ptp_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\N	a1b2c3d4-e5f6-7890-abcd-ef1234567890	\N	\N	ahmed.hassan@email.com	$2a$10$PkKpMR6ClqGP6aKRs/REfeVOQiGXO2L0YXfEibinhLvLQn8LAVIyW	2025-07-24 03:54:06.985292+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 03:54:06.985292+00	2025-07-24 03:54:06.985292+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	b2c3d4e5-f6a7-8901-bcde-f23456789012	\N	\N	fatima.ali@email.com	$2a$10$PkKpMR6ClqGP6aKRs/REfeVOQiGXO2L0YXfEibinhLvLQn8LAVIyW	2025-07-24 03:54:06.985292+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 03:54:06.985292+00	2025-07-24 03:54:06.985292+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	c3d4e5f6-a7b8-9012-cdef-345678901234	\N	\N	mohammed.salem@email.com	$2a$10$PkKpMR6ClqGP6aKRs/REfeVOQiGXO2L0YXfEibinhLvLQn8LAVIyW	2025-07-24 03:54:06.985292+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 03:54:06.985292+00	2025-07-24 03:54:06.985292+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	d4e5f6a7-b8c9-0123-defa-456789012345	\N	\N	sara.ahmed@email.com	$2a$10$PkKpMR6ClqGP6aKRs/REfeVOQiGXO2L0YXfEibinhLvLQn8LAVIyW	2025-07-24 03:54:06.985292+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 03:54:06.985292+00	2025-07-24 03:54:06.985292+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	e5f6a7b8-c9d0-1234-efab-567890123456	\N	\N	khalid.abdullah@email.com	$2a$10$PkKpMR6ClqGP6aKRs/REfeVOQiGXO2L0YXfEibinhLvLQn8LAVIyW	2025-07-24 03:54:06.985292+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-24 03:54:06.985292+00	2025-07-24 03:54:06.985292+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: account_types; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.account_types (type_id, type_code, type_name, account_category, description) FROM stdin;
38	SAV001	Basic Savings Account	SAVINGS	Basic savings account with minimum balance
39	SAV002	Premium Savings Account	SAVINGS	Premium savings with higher interest
40	CUR001	Current Account	CURRENT	Standard current account for daily transactions
41	CUR002	Business Current Account	CURRENT	Current account for business operations
42	FD001	Fixed Deposit	FIXED_DEPOSIT	Fixed term deposit account
43	RD001	Recurring Deposit	RECURRING_DEPOSIT	Monthly recurring deposit
44	LOAN001	Personal Loan Account	LOAN	Personal loan account
45	LOAN002	Home Loan Account	LOAN	Home loan account
46	LOAN003	Auto Loan Account	LOAN	Auto loan account
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.accounts (account_id, account_number, customer_id, account_type_id, product_id, branch_id, currency_code, account_status, opening_date, closing_date, current_balance, available_balance, hold_amount, unclear_balance, minimum_balance, overdraft_limit, interest_rate, last_transaction_date, maturity_date, joint_holder_ids, nominee_details, is_salary_account, is_minor_account, guardian_id, created_at, updated_at) FROM stdin;
72	ACC1000000001	CUST001	38	37	BR001	SAR	ACTIVE	2020-02-01	\N	75000.00	75000.00	0.00	0.00	1000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
73	ACC1000000002	CUST001	40	39	BR001	SAR	ACTIVE	2020-02-01	\N	125000.00	125000.00	0.00	0.00	5000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
74	ACC1000000003	CUST002	39	38	BR001	SAR	ACTIVE	2020-03-15	\N	250000.00	250000.00	0.00	0.00	50000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
75	ACC1000000004	CUST003	39	38	BR002	SAR	ACTIVE	2020-04-01	\N	850000.00	850000.00	0.00	0.00	50000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
76	ACC1000000005	CUST003	41	40	BR002	SAR	ACTIVE	2020-04-01	\N	1500000.00	1500000.00	0.00	0.00	25000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
77	ACC1000000006	CUST004	38	37	BR002	SAR	ACTIVE	2020-05-20	\N	45000.00	45000.00	0.00	0.00	1000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
78	ACC1000000007	CUST005	40	39	BR003	SAR	ACTIVE	2021-02-10	\N	180000.00	180000.00	0.00	0.00	5000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
79	ACC1000000008	CUST006	38	37	BR003	SAR	ACTIVE	2021-03-25	\N	95000.00	95000.00	0.00	0.00	1000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
80	ACC1000000009	CUST007	39	38	BR004	AED	ACTIVE	2021-07-15	\N	450000.00	450000.00	0.00	0.00	50000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
81	ACC1000000010	CUST008	40	39	BR005	KWD	ACTIVE	2022-02-28	\N	35000.00	35000.00	0.00	0.00	5000.00	0.00	\N	\N	\N	\N	\N	f	f	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: aging_buckets; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.aging_buckets (id, bucket_name, min_days, max_days, display_order, color_code, created_at, updated_at) FROM stdin;
29	Current	0	0	1	#00FF00	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
30	1-30 DPD	1	30	2	#FFFF00	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
31	31-60 DPD	31	60	3	#FFA500	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
32	61-90 DPD	61	90	4	#FF4500	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
33	91-120 DPD	91	120	5	#FF0000	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
34	121-180 DPD	121	180	6	#8B0000	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
35	180+ DPD	181	\N	7	#000000	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.audit_trail (audit_id, table_name, record_id, action, user_id, auth_user_id, user_ip, old_values, new_values, action_timestamp, session_id, remarks) FROM stdin;
9	customers	CUST001	INSERT	SYSTEM	\N	192.168.1.1	\N	\N	2020-02-01 07:00:00+00	\N	\N
10	accounts	ACC1000000001	INSERT	SYSTEM	\N	192.168.1.1	\N	\N	2020-02-01 07:05:00+00	\N	\N
11	loan_applications	1	UPDATE	USER001	\N	192.168.1.10	\N	\N	2020-06-01 11:30:00+00	\N	\N
12	collection_cases	1	INSERT	SYSTEM	\N	192.168.1.1	\N	\N	2024-06-01 06:00:00+00	\N	\N
\.


--
-- Data for Name: auth_user_profiles; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.auth_user_profiles (id, auth_user_id, bank_user_id, customer_id, user_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bank_config; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.bank_config (config_id, bank_code, bank_name, head_office_address, swift_code, routing_number, regulatory_license, fiscal_year_start, created_at, updated_at) FROM stdin;
19	KSTL	Kastle Bank	King Fahd Road, Riyadh 11564, Saudi Arabia	KSTLSARI	80380001	SAMA/2020/KB001	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: branch_collection_performance; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.branch_collection_performance (id, branch_id, period_date, total_delinquent_amount, total_collected_amount, collection_rate, number_of_accounts, created_at) FROM stdin;
223	BR001	2024-07-01	135250.00	40575.00	30.00	1	2025-07-26 04:37:40.72132+00
224	BR002	2024-07-01	55950.00	11190.00	20.00	1	2025-07-26 04:37:40.72132+00
225	BR003	2024-07-01	229904.00	57476.00	25.00	2	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.branches (branch_id, branch_name, branch_type, address, city, state, country_code, postal_code, phone, email, manager_id, opening_date, is_active, created_at, updated_at) FROM stdin;
BR001	Riyadh Main Branch	MAIN	King Fahd Road	Riyadh	RI	SA	11564	+966-11-4567890	main@kb.sa	\N	2020-01-01	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
BR002	Jeddah Branch	SUB	Palestine Street	Jeddah	MK	SA	21442	+966-12-6789012	jeddah@kb.sa	\N	2020-06-01	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
BR003	Dammam Branch	SUB	King Saud Street	Dammam	EP	SA	31412	+966-13-8901234	dammam@kb.sa	\N	2021-01-01	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
BR004	Dubai Branch	SUB	Sheikh Zayed Road	Dubai	DU	AE	12345	+971-4-3456789	dubai@kb.ae	\N	2021-06-01	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
BR005	Kuwait City Branch	SUB	Abdullah Al-Ahmad Street	Kuwait City	CA	KW	13001	+965-2234-5678	kuwait@kb.kw	\N	2022-01-01	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_buckets; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.collection_buckets (bucket_id, bucket_code, bucket_name, min_dpd, max_dpd, priority_level, collection_strategy, description, is_active, created_at) FROM stdin;
21	BUCKET_0	Pre-Delinquent	-5	0	1	REMINDER	Accounts approaching due date	t	2025-07-26 04:37:40.72132+00
22	BUCKET_1	Early Stage	1	30	2	SOFT_COLLECTION	Early delinquency - soft approach	t	2025-07-26 04:37:40.72132+00
23	BUCKET_2	Mid Stage	31	60	3	INTENSIVE_FOLLOW_UP	Mid-stage delinquency - intensive follow-up	t	2025-07-26 04:37:40.72132+00
24	BUCKET_3	Late Stage	61	90	4	FIELD_VISIT	Late stage - field visits required	t	2025-07-26 04:37:40.72132+00
25	BUCKET_4	Severe	91	120	5	LEGAL_NOTICE	Severe delinquency - legal notices	t	2025-07-26 04:37:40.72132+00
26	BUCKET_5	Critical	121	180	6	LEGAL_ACTION	Critical - initiate legal proceedings	t	2025-07-26 04:37:40.72132+00
27	BUCKET_6	Write-off	181	999	7	RECOVERY	Write-off candidates	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_cases; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.collection_cases (case_id, case_number, customer_id, account_number, account_type, loan_account_number, card_number, bucket_id, total_outstanding, principal_outstanding, interest_outstanding, penalty_outstanding, other_charges, days_past_due, last_payment_date, last_payment_amount, case_status, assigned_to, assignment_date, priority, branch_id, created_at, updated_at, total_amount) FROM stdin;
10	COLL20250726_8f8d1128	CUST001	ACC1000000001	LOAN	LOAN1000000001	\N	23	135250.00	125000.00	5000.00	5250.00	\N	60	\N	\N	ACTIVE	\N	\N	HIGH	BR001	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	135250
11	COLL20250726_550e80ce	CUST005	ACC1000000007	LOAN	LOAN1000000003	\N	22	129524.00	120000.00	3500.00	6024.00	\N	30	\N	\N	ACTIVE	\N	\N	MEDIUM	BR003	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	129524
12	COLL20250726_d12d9499	CUST004	ACC1000000006	LOAN	LOAN1000000005	\N	23	55950.00	50000.00	2000.00	3950.00	\N	45	\N	\N	ACTIVE	\N	\N	MEDIUM	BR002	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	55950
13	COLL20250726_7f2b0237	CUST006	ACC1000000008	LOAN	LOAN1000000006	\N	24	100380.00	90000.00	3000.00	7380.00	\N	90	\N	\N	ACTIVE	\N	\N	HIGH	BR003	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	100380
\.


--
-- Data for Name: collection_rates; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.collection_rates (id, period_type, period_date, total_delinquent_amount, total_collected_amount, collection_rate, number_of_accounts, number_of_accounts_collected, created_at) FROM stdin;
139	MONTHLY	2024-06-01	400000.00	120000.00	30.00	10	3	2025-07-26 04:37:40.72132+00
140	MONTHLY	2024-07-01	421104.00	105276.00	25.00	12	3	2025-07-26 04:37:40.72132+00
141	WEEKLY	2024-07-15	421104.00	52638.00	12.50	12	2	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.countries (country_code, country_name, iso_code, currency_code, is_active, created_at, updated_at) FROM stdin;
SA	Saudi Arabia	SA	SAR	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
AE	United Arab Emirates	AE	AED	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
KW	Kuwait	KW	KWD	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
BH	Bahrain	BH	BHD	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
QA	Qatar	QA	QAR	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
OM	Oman	OM	OMR	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
EG	Egypt	EG	EGP	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
JO	Jordan	JO	JOD	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.currencies (currency_code, currency_name, currency_symbol, decimal_places, is_active, created_at) FROM stdin;
SAR	Saudi Riyal	ر.س	2	t	2025-07-26 04:37:40.72132+00
AED	UAE Dirham	د.إ	2	t	2025-07-26 04:37:40.72132+00
KWD	Kuwaiti Dinar	د.ك	2	t	2025-07-26 04:37:40.72132+00
BHD	Bahraini Dinar	د.ب	2	t	2025-07-26 04:37:40.72132+00
QAR	Qatari Riyal	ر.ق	2	t	2025-07-26 04:37:40.72132+00
OMR	Omani Rial	ر.ع	2	t	2025-07-26 04:37:40.72132+00
USD	US Dollar	$	2	t	2025-07-26 04:37:40.72132+00
EUR	Euro	€	2	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.customer_addresses (address_id, customer_id, address_type, address_line1, address_line2, city, state, country_code, postal_code, is_primary, created_at, updated_at) FROM stdin;
59	CUST001	PERMANENT	123 King Abdullah Road	Al Olaya District	Riyadh	RI	SA	11564	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
60	CUST002	PERMANENT	456 Prince Sultan Street	Al Malaz District	Riyadh	RI	SA	11565	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
61	CUST003	PERMANENT	789 Palestine Street	Al Hamra District	Jeddah	MK	SA	21442	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
62	CUST004	PERMANENT	321 King Fahad Road	Al Andalus District	Jeddah	MK	SA	21443	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
63	CUST005	PERMANENT	654 King Saud Street	Al Faisaliyah District	Dammam	EP	SA	31412	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
64	CUST006	PERMANENT	987 Prince Mohammed Street	Al Shati District	Dammam	EP	SA	31413	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
65	CUST007	PERMANENT	147 Sheikh Zayed Road	Business Bay	Dubai	DU	AE	12345	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
66	CUST008	PERMANENT	258 Abdullah Al-Ahmad Street	Salmiya	Kuwait City	CA	KW	13001	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.customer_contacts (contact_id, customer_id, contact_type, contact_value, is_primary, is_verified, verified_date, created_at) FROM stdin;
111	CUST001	MOBILE	+966501234567	t	t	\N	2025-07-26 04:37:40.72132+00
112	CUST001	EMAIL	m.rashid@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
113	CUST002	MOBILE	+966502345678	t	t	\N	2025-07-26 04:37:40.72132+00
114	CUST002	EMAIL	f.zahra@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
115	CUST003	MOBILE	+966503456789	t	t	\N	2025-07-26 04:37:40.72132+00
116	CUST003	EMAIL	a.saud@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
117	CUST004	MOBILE	+966504567890	t	t	\N	2025-07-26 04:37:40.72132+00
118	CUST004	EMAIL	a.qasim@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
119	CUST005	MOBILE	+966505678901	t	t	\N	2025-07-26 04:37:40.72132+00
120	CUST005	EMAIL	o.jabri@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
121	CUST006	MOBILE	+966506789012	t	t	\N	2025-07-26 04:37:40.72132+00
122	CUST006	EMAIL	l.harbi@kbank.sa	t	t	\N	2025-07-26 04:37:40.72132+00
123	CUST007	MOBILE	+971507890123	t	t	\N	2025-07-26 04:37:40.72132+00
124	CUST007	EMAIL	a.dosari@kbank.ae	t	t	\N	2025-07-26 04:37:40.72132+00
125	CUST008	MOBILE	+96598765432	t	t	\N	2025-07-26 04:37:40.72132+00
126	CUST008	EMAIL	m.mutairi@kbank.kw	t	t	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: customer_documents; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.customer_documents (document_id, customer_id, document_type, document_number, issuing_authority, issue_date, expiry_date, document_path, document_url, bucket_name, verification_status, verified_by, verified_date, created_at) FROM stdin;
60	CUST001	NATIONAL_ID	1234567890123456	Saudi Ministry of Interior	2020-01-01	2025-01-01	\N	\N	customer-documents	VERIFIED	\N	2020-02-01 00:00:00+00	2025-07-26 04:37:40.72132+00
61	CUST002	NATIONAL_ID	2345678901234567	Saudi Ministry of Interior	2019-06-15	2024-06-15	\N	\N	customer-documents	VERIFIED	\N	2020-03-15 00:00:00+00	2025-07-26 04:37:40.72132+00
62	CUST003	NATIONAL_ID	3456789012345678	Saudi Ministry of Interior	2018-11-20	2023-11-20	\N	\N	customer-documents	VERIFIED	\N	2020-04-01 00:00:00+00	2025-07-26 04:37:40.72132+00
63	CUST004	NATIONAL_ID	4567890123456789	Saudi Ministry of Interior	2021-02-10	2026-02-10	\N	\N	customer-documents	VERIFIED	\N	2020-05-20 00:00:00+00	2025-07-26 04:37:40.72132+00
64	CUST005	NATIONAL_ID	5678901234567890	Saudi Ministry of Interior	2020-08-05	2025-08-05	\N	\N	customer-documents	VERIFIED	\N	2021-02-10 00:00:00+00	2025-07-26 04:37:40.72132+00
65	CUST006	NATIONAL_ID	6789012345678901	Saudi Ministry of Interior	2019-12-25	2024-12-25	\N	\N	customer-documents	VERIFIED	\N	2021-03-25 00:00:00+00	2025-07-26 04:37:40.72132+00
66	CUST007	EMIRATES_ID	784198712345678	UAE Federal Authority	2020-03-30	2025-03-30	\N	\N	customer-documents	VERIFIED	\N	2021-07-15 00:00:00+00	2025-07-26 04:37:40.72132+00
67	CUST008	CIVIL_ID	287654321098765	Kuwait Ministry of Interior	2021-01-15	2026-01-15	\N	\N	customer-documents	VERIFIED	\N	2022-02-28 00:00:00+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: customer_types; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.customer_types (type_id, type_code, type_name, description) FROM stdin;
23	IND	Individual	Individual retail customers
24	CORP	Corporate	Corporate business customers
25	SME	Small & Medium Enterprise	SME business customers
26	HNI	High Net Worth Individual	High net worth individual customers
27	GOVT	Government	Government entities
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.customers (customer_id, auth_user_id, customer_type_id, first_name, middle_name, last_name, full_name, gender, date_of_birth, nationality, marital_status, education_level, occupation, annual_income, income_source, tax_id, employer_name, employment_type, preferred_language, segment, relationship_manager, onboarding_branch, onboarding_date, kyc_status, risk_category, is_active, is_pep, created_at, updated_at) FROM stdin;
CUST001	\N	23	Mohammed	Ahmed	Al-Rashid	Mohammed Ahmed Al-Rashid	MALE	1985-03-15	SA	MARRIED	Bachelor	Engineer	180000.00	\N	1234567890	\N	\N	ENGLISH	RETAIL	\N	BR001	2020-02-01	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST002	\N	23	Fatima	Ali	Al-Zahra	Fatima Ali Al-Zahra	FEMALE	1990-07-20	SA	SINGLE	Master	Doctor	250000.00	\N	2345678901	\N	\N	ENGLISH	PREMIUM	\N	BR001	2020-03-15	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST003	\N	23	Abdullah	Khalid	Al-Saud	Abdullah Khalid Al-Saud	MALE	1978-11-05	SA	MARRIED	PhD	Business Owner	500000.00	\N	3456789012	\N	\N	ENGLISH	HNI	\N	BR002	2020-04-01	VERIFIED	MEDIUM	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST004	\N	23	Aisha	Mohammed	Al-Qasim	Aisha Mohammed Al-Qasim	FEMALE	1995-01-10	SA	SINGLE	Bachelor	Teacher	120000.00	\N	4567890123	\N	\N	ENGLISH	RETAIL	\N	BR002	2020-05-20	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST005	\N	23	Omar	Hassan	Al-Jabri	Omar Hassan Al-Jabri	MALE	1988-06-25	SA	MARRIED	Master	Manager	200000.00	\N	5678901234	\N	\N	ENGLISH	RETAIL	\N	BR003	2021-02-10	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST006	\N	23	Layla	Ibrahim	Al-Harbi	Layla Ibrahim Al-Harbi	FEMALE	1992-09-30	SA	MARRIED	Bachelor	Accountant	150000.00	\N	6789012345	\N	\N	ENGLISH	RETAIL	\N	BR003	2021-03-25	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST007	\N	23	Ahmed	Yusuf	Al-Dosari	Ahmed Yusuf Al-Dosari	MALE	1983-12-20	AE	MARRIED	Master	IT Consultant	300000.00	\N	7890123456	\N	\N	ENGLISH	PREMIUM	\N	BR004	2021-07-15	VERIFIED	MEDIUM	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
CUST008	\N	23	Mariam	Saleh	Al-Mutairi	Mariam Saleh Al-Mutairi	FEMALE	1987-04-18	KW	SINGLE	Bachelor	Marketing Executive	180000.00	\N	8901234567	\N	\N	ENGLISH	RETAIL	\N	BR005	2022-02-28	VERIFIED	LOW	t	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: delinquencies; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.delinquencies (id, loan_account_id, customer_id, outstanding_amount, days_past_due, aging_bucket_id, last_payment_date, last_payment_amount, next_due_date, collection_status, risk_rating, created_at, updated_at) FROM stdin;
15	15	CUST001	135250.00	60	31	2024-05-15	\N	2024-07-15	UNDER_COLLECTION	HIGH	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
16	17	CUST004	55950.00	45	31	2024-05-01	\N	2024-07-01	UNDER_COLLECTION	MEDIUM	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
17	18	CUST006	100380.00	90	32	2024-04-01	\N	2024-07-01	UNDER_COLLECTION	HIGH	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: delinquency_history; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.delinquency_history (id, delinquency_id, snapshot_date, outstanding_amount, days_past_due, aging_bucket_id, collection_status, created_at) FROM stdin;
20	15	2024-07-01	135250.00	60	31	UNDER_COLLECTION	2025-07-26 04:37:40.72132+00
21	15	2024-06-15	132500.00	45	31	UNDER_COLLECTION	2025-07-26 04:37:40.72132+00
22	15	2024-06-01	130000.00	30	30	UNDER_COLLECTION	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: loan_accounts; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.loan_accounts (loan_account_id, loan_account_number, application_id, customer_id, product_id, principal_amount, interest_rate, tenure_months, emi_amount, disbursement_date, first_emi_date, maturity_date, outstanding_principal, outstanding_interest, total_interest_paid, total_principal_paid, overdue_amount, overdue_days, loan_status, npa_date, settlement_amount, settlement_date, created_at, updated_at, outstanding_balance) FROM stdin;
15	LOAN1000000001	20	CUST001	41	250000.00	8.50	60	5125.00	2020-06-15	2020-07-15	2025-06-15	125000.00	5000.00	0.00	0.00	10250.00	60	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
16	LOAN1000000002	21	CUST003	42	2000000.00	6.50	240	14960.00	2020-09-01	2020-10-01	2040-09-01	1850000.00	50000.00	0.00	0.00	0.00	0	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
17	LOAN1000000005	24	CUST004	41	80000.00	8.50	48	1975.00	2021-07-01	2021-08-01	2025-07-01	50000.00	2000.00	0.00	0.00	3950.00	45	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
18	LOAN1000000006	25	CUST006	41	120000.00	8.50	60	2460.00	2021-09-01	2021-10-01	2026-09-01	90000.00	3000.00	0.00	0.00	7380.00	90	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
19	LOAN1000000007	26	CUST007	41	180000.00	8.50	48	4445.00	2021-10-15	2021-11-15	2025-10-15	120000.00	4000.00	0.00	0.00	0.00	0	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
20	LOAN1000000008	27	CUST008	41	50000.00	8.50	36	1578.00	2022-05-01	2022-06-01	2025-05-01	35000.00	1000.00	0.00	0.00	0.00	0	ACTIVE	\N	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00	\N
\.


--
-- Data for Name: loan_applications; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.loan_applications (application_id, application_number, customer_id, product_id, requested_amount, approved_amount, tenure_months, interest_rate, purpose, collateral_details, guarantor_details, application_date, application_status, rejection_reason, credit_score, risk_rating, processing_fee, insurance_premium, branch_id, relationship_officer, created_at, updated_at) FROM stdin;
20	LOAN20250726_37ed36ca	CUST001	41	250000.00	250000.00	60	8.50	Personal Use	\N	\N	2020-06-01	DISBURSED	\N	750	LOW	2500.00	\N	BR001	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
21	LOAN20250726_83285076	CUST003	42	2000000.00	2000000.00	240	6.50	Home Purchase	\N	\N	2020-08-15	DISBURSED	\N	800	LOW	20000.00	\N	BR002	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
22	LOAN20250726_c6f9eb30	CUST005	43	150000.00	150000.00	60	7.50	Car Purchase	\N	\N	2021-04-01	DISBURSED	\N	720	MEDIUM	1500.00	\N	BR003	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
23	LOAN20250726_ac29935e	CUST002	41	100000.00	100000.00	36	8.50	Medical Emergency	\N	\N	2021-01-10	DISBURSED	\N	780	LOW	1000.00	\N	BR001	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
24	LOAN20250726_540f0c8a	CUST004	41	80000.00	80000.00	48	8.50	Education	\N	\N	2021-06-20	DISBURSED	\N	690	MEDIUM	800.00	\N	BR002	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
25	LOAN20250726_fc0d87d0	CUST006	41	120000.00	120000.00	60	8.50	Home Renovation	\N	\N	2021-08-15	DISBURSED	\N	710	MEDIUM	1200.00	\N	BR003	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
26	LOAN20250726_23606d65	CUST007	41	200000.00	180000.00	48	8.50	Business Investment	\N	\N	2021-10-01	DISBURSED	\N	740	MEDIUM	1800.00	\N	BR004	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
27	LOAN20250726_e1f64f4d	CUST008	41	50000.00	50000.00	36	8.50	Wedding Expenses	\N	\N	2022-04-15	DISBURSED	\N	700	LOW	500.00	\N	BR005	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: portfolio_summary; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.portfolio_summary (id, snapshot_date, total_portfolio_value, total_delinquent_value, delinquency_rate, total_loans, delinquent_loans, created_at) FROM stdin;
55	2024-06-30	3115000.00	421104.00	13.52	8	4	2025-07-26 04:37:40.72132+00
56	2024-07-15	3115000.00	421104.00	13.52	8	4	2025-07-26 04:37:40.72132+00
57	2024-07-26	3115000.00	421104.00	13.52	8	4	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.product_categories (category_id, category_code, category_name, category_type, description, is_active, created_at) FROM stdin;
27	DEP001	Savings Products	DEPOSIT	All savings related products	t	2025-07-26 04:37:40.72132+00
28	DEP002	Current Products	DEPOSIT	All current account products	t	2025-07-26 04:37:40.72132+00
29	LOAN001	Personal Loans	LOAN	Personal loan products	t	2025-07-26 04:37:40.72132+00
30	LOAN002	Secured Loans	LOAN	Asset-backed loan products	t	2025-07-26 04:37:40.72132+00
31	CARD001	Credit Cards	CARD	Credit card products	t	2025-07-26 04:37:40.72132+00
32	CARD002	Debit Cards	CARD	Debit card products	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.products (product_id, product_code, product_name, category_id, product_type, min_balance, max_balance, interest_rate, tenure_months, features, eligibility_criteria, documents_required, is_active, launch_date, end_date, created_at, updated_at) FROM stdin;
37	SAV_BASIC	Basic Savings Account	27	SAVINGS	1000.00	1000000.00	1.50	\N	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
38	SAV_PREM	Premium Savings Account	27	SAVINGS	50000.00	10000000.00	2.50	\N	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
39	CUR_STD	Standard Current Account	28	CURRENT	5000.00	\N	0.00	\N	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
40	CUR_BUS	Business Current Account	28	CURRENT	25000.00	\N	0.00	\N	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
41	PL_001	Personal Loan	29	PERSONAL_LOAN	10000.00	500000.00	8.50	60	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
42	HL_001	Home Loan	30	HOME_LOAN	100000.00	5000000.00	6.50	240	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
43	AL_001	Auto Loan	30	AUTO_LOAN	20000.00	300000.00	7.50	84	\N	\N	\N	t	2020-01-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
44	CC_CLASSIC	Classic Credit Card	31	CREDIT_CARD	5000.00	50000.00	24.00	\N	\N	\N	\N	t	2020-06-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
45	CC_GOLD	Gold Credit Card	31	CREDIT_CARD	10000.00	200000.00	21.00	\N	\N	\N	\N	t	2020-06-01	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: realtime_notifications; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.realtime_notifications (id, customer_id, notification_type, title, message, data, is_read, created_at) FROM stdin;
3bd57253-f07b-4e98-9cce-426d7cbea901	CUST001	PAYMENT_REMINDER	Payment Due	Your loan EMI of SAR 5,125 is due on 15-Jul-2024	{"amount": 5125, "due_date": "2024-07-15"}	f	2025-07-26 04:37:40.72132+00
8c39deb3-8688-4b6f-8dba-1dccafff94e0	CUST005	PAYMENT_REMINDER	Payment Due	Your loan EMI of SAR 3,012 is due on 15-Jul-2024	{"amount": 3012, "due_date": "2024-07-15"}	f	2025-07-26 04:37:40.72132+00
10adbee5-3a9d-4649-9364-f78f238dbd4c	CUST004	OVERDUE_NOTICE	Payment Overdue	Your payment of SAR 1,975 is overdue by 45 days	{"amount": 1975, "overdue_days": 45}	t	2025-07-26 04:37:40.72132+00
40c50f8e-c9ed-4f9a-ae79-d2103c0414f7	CUST006	COLLECTION_NOTICE	Urgent: Account in Collection	Your account has been moved to collection due to 90 days overdue	{"overdue_days": 90}	f	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: transaction_types; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.transaction_types (type_id, type_code, type_name, transaction_category, affects_balance, requires_approval, min_amount, max_amount, charge_applicable) FROM stdin;
35	CASH_DEP	Cash Deposit	CREDIT	t	f	\N	\N	f
36	CASH_WDL	Cash Withdrawal	DEBIT	t	f	\N	\N	f
37	TRANSFER_IN	Incoming Transfer	CREDIT	t	f	\N	\N	f
38	TRANSFER_OUT	Outgoing Transfer	DEBIT	t	f	\N	\N	t
39	INT_CREDIT	Interest Credit	INTEREST	t	f	\N	\N	f
40	LOAN_DISB	Loan Disbursement	CREDIT	t	t	\N	\N	f
41	LOAN_PMT	Loan Payment	DEBIT	t	f	\N	\N	f
42	CHG_DEBIT	Service Charge	CHARGE	t	f	\N	\N	f
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: kastle_banking; Owner: postgres
--

COPY kastle_banking.transactions (transaction_id, transaction_ref, transaction_date, value_date, account_number, transaction_type_id, debit_credit, transaction_amount, currency_code, running_balance, contra_account, channel, reference_number, cheque_number, narration, beneficiary_name, beneficiary_account, beneficiary_bank, status, approval_status, approved_by, reversal_ref, branch_id, teller_id, device_id, ip_address, created_at, posted_at) FROM stdin;
38	TRN20250726_d007b455	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000001	35	CREDIT	100000.00	SAR	100000.00	\N	BRANCH	\N	\N	Initial deposit	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
39	TRN20250726_6c08541f	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000001	36	DEBIT	25000.00	SAR	75000.00	\N	ATM	\N	\N	ATM withdrawal	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
40	TRN20250726_c26234c0	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000002	35	CREDIT	150000.00	SAR	150000.00	\N	BRANCH	\N	\N	Initial deposit	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
41	TRN20250726_fc2078f3	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000002	36	DEBIT	25000.00	SAR	125000.00	\N	MOBILE	\N	\N	Mobile transfer	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
42	TRN20250726_0ec0d357	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000003	35	CREDIT	300000.00	SAR	300000.00	\N	BRANCH	\N	\N	Initial deposit	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
43	TRN20250726_fdec1ba2	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000003	36	DEBIT	50000.00	SAR	250000.00	\N	INTERNET	\N	\N	Online payment	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
44	TRN20250726_8505b4bf	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000001	40	CREDIT	250000.00	SAR	325000.00	\N	BRANCH	\N	\N	Loan disbursement	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
45	TRN20250726_21119c1c	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000007	40	CREDIT	150000.00	SAR	330000.00	\N	BRANCH	\N	\N	Loan disbursement	\N	\N	\N	COMPLETED	\N	\N	\N	BR003	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
46	TRN20250726_7729c745	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000001	41	DEBIT	5125.00	SAR	319875.00	\N	MOBILE	\N	\N	EMI payment	\N	\N	\N	COMPLETED	\N	\N	\N	BR001	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
47	TRN20250726_ec976633	2025-07-26 04:37:40.72132+00	2025-07-26	ACC1000000007	41	DEBIT	3012.00	SAR	326988.00	\N	MOBILE	\N	\N	EMI payment	\N	\N	\N	COMPLETED	\N	\N	\N	BR003	\N	\N	\N	2025-07-26 04:37:40.72132+00	\N
\.


--
-- Data for Name: access_log; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.access_log (access_id, user_id, resource_type, resource_id, action, access_granted, denial_reason, ip_address, session_id, created_at) FROM stdin;
1	OFF001	COLLECTION_CASE	1	VIEW	t	\N	192.168.1.100	\N	2025-07-26 04:37:40.72132+00
2	OFF002	COLLECTION_CASE	2	UPDATE	t	\N	192.168.1.101	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.audit_log (audit_id, table_name, operation, record_id, user_id, changed_fields, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
1	collection_cases	UPDATE	1	OFF001	["case_status", "updated_at"]	\N	\N	\N	\N	2024-07-20 07:35:00+00
2	promise_to_pay	INSERT	1	OFF001	["all"]	\N	\N	\N	\N	2024-07-20 07:36:00+00
\.


--
-- Data for Name: collection_audit_trail; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_audit_trail (audit_id, user_id, action_type, entity_type, entity_id, old_values, new_values, ip_address, user_agent, action_timestamp) FROM stdin;
1	OFF001	CREATE_PTP	PROMISE_TO_PAY	1	\N	\N	\N	\N	2024-07-20 07:36:00+00
2	OFF006	UPDATE_CASE	COLLECTION_CASE	4	\N	\N	\N	\N	2024-07-18 13:50:00+00
\.


--
-- Data for Name: collection_automation_metrics; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_automation_metrics (metric_id, metric_date, automation_type, total_attempts, successful_contacts, payments_collected, amount_collected, cost_saved, efficiency_gain, error_rate, customer_satisfaction_score, created_at) FROM stdin;
1	2024-07-20	SMS_CAMPAIGN	1000	850	120	450000	5000	15.5	\N	7.8	2025-07-26 04:37:40.72132+00
2	2024-07-20	AUTO_DIALER	500	350	45	225000	3500	20.0	\N	7.5	2025-07-26 04:37:40.72132+00
3	2024-07-20	IVR	300	250	30	150000	2000	18.0	\N	8.0	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_benchmarks; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_benchmarks (benchmark_id, benchmark_date, benchmark_type, metric_name, internal_value, industry_average, best_in_class, percentile_rank, gap_to_average, gap_to_best, source, notes, created_at) FROM stdin;
1	2024-06-30	RECOVERY_RATE	30_DPD_Recovery	75.0	70.0	85.0	65	5.0	-10.0	SAMA_Report_Q2_2024	\N	2025-07-26 04:37:40.72132+00
2	2024-06-30	EFFICIENCY	Cost_Per_Dollar_Collected	0.08	0.10	0.05	60	-0.02	0.03	Industry_Survey_2024	\N	2025-07-26 04:37:40.72132+00
3	2024-06-30	PRODUCTIVITY	Accounts_Per_Officer	150	120	200	70	30	-50	Internal_Analysis	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_bucket_movement; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_bucket_movement (movement_id, case_id, from_bucket_id, to_bucket_id, movement_date, movement_reason, days_in_previous_bucket, amount_at_movement, officer_id, automated_movement, created_at) FROM stdin;
\.


--
-- Data for Name: collection_call_records; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_call_records (call_id, interaction_id, phone_number, officer_id, call_datetime, call_duration_seconds, wait_time_seconds, hold_time_seconds, call_type, call_disposition, recording_url, ivr_path, transfer_count, quality_monitored, quality_score, created_at) FROM stdin;
1	14	+966501234567	OFF001	2024-07-20 07:30:00+00	420	\N	\N	MANUAL	PROMISE_TO_PAY	\N	\N	\N	f	\N	2025-07-26 04:37:40.72132+00
2	15	+966505678901	OFF002	2024-07-20 11:15:00+00	180	\N	\N	MANUAL	CALLBACK_REQUESTED	\N	\N	\N	f	\N	2025-07-26 04:37:40.72132+00
3	17	+966506789012	OFF006	2024-07-18 13:45:00+00	600	\N	\N	INBOUND	DISPUTE_RAISED	\N	\N	\N	f	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_campaigns; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_campaigns (campaign_id, campaign_name, campaign_type, target_bucket, target_segment, start_date, end_date, budget_amount, target_recovery, actual_recovery, total_contacts, success_rate, roi, status, created_by, created_at) FROM stdin;
3	Ramadan Recovery Campaign	SEASONAL	22	\N	2024-03-01	2024-04-30	100000.00	5000000.00	\N	\N	\N	\N	COMPLETED	MGR001	2025-07-26 04:37:40.72132+00
4	Q3 2024 Recovery Drive	REGULAR	23	\N	2024-07-01	2024-09-30	150000.00	10000000.00	\N	\N	\N	\N	ACTIVE	MGR002	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_case_details; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_case_details (case_detail_id, case_id, delinquency_reason, customer_segment, risk_score, collection_strategy, skip_trace_status, legal_status, settlement_offered, settlement_amount, restructure_requested, hardship_flag, created_at, updated_at) FROM stdin;
10	10	JOB_LOSS	RETAIL	65	INT_CALL_01	NOT_REQUIRED	NA	f	\N	f	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
11	11	BUSINESS_IMPACT	RETAIL	55	SOFT_REM_01	NOT_REQUIRED	NA	f	\N	f	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
12	12	FINANCIAL_DISTRESS	RETAIL	60	SOFT_REM_01	NOT_REQUIRED	NA	t	\N	f	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
13	13	DISPUTE	RETAIL	75	FIELD_VIS_01	IN_PROGRESS	NOTICE_PREPARED	f	\N	f	f	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_compliance_violations; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_compliance_violations (violation_id, violation_date, violation_type, severity, officer_id, case_id, description, corrective_action, action_taken, action_date, reviewed_by, fine_amount, created_at) FROM stdin;
1	2024-07-15	COLLECTION_PRACTICE	LOW	OFF002	11	Called customer outside permitted hours	Refresher training on calling hours	t	\N	\N	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_contact_attempts; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_contact_attempts (attempt_id, case_id, customer_id, contact_type, contact_number, contact_result, attempt_datetime, officer_id, best_time_to_contact, contact_quality_score, is_valid, created_at, outstanding_amount) FROM stdin;
6	10	CUST001	PRIMARY	+966501234567	NO_ANSWER	2024-07-19 12:30:00+00	OFF001	\N	5	t	2025-07-26 04:37:40.72132+00	135250
7	10	CUST001	PRIMARY	+966501234567	CONNECTED	2024-07-20 07:30:00+00	OFF001	MORNING	8	t	2025-07-26 04:37:40.72132+00	135250
8	11	CUST005	PRIMARY	+966505678901	CONNECTED	2024-07-20 11:15:00+00	OFF002	AFTERNOON	7	t	2025-07-26 04:37:40.72132+00	129524
9	12	CUST004	PRIMARY	+966504567890	VOICEMAIL	2024-07-19 08:30:00+00	OFF004	\N	3	t	2025-07-26 04:37:40.72132+00	55950
10	13	CUST006	WORK	+966131234567	WRONG_NUMBER	2024-07-18 07:00:00+00	OFF006	\N	0	t	2025-07-26 04:37:40.72132+00	100380
\.


--
-- Data for Name: collection_customer_segments; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_customer_segments (segment_id, segment_name, segment_code, segment_criteria, risk_profile, collection_strategy, target_recovery_rate, actual_recovery_rate, customers_count, total_exposure, avg_ticket_size, is_active, created_at, updated_at) FROM stdin;
7	High Value Low Risk	HVLR	{"max_dpd": 30, "min_exposure": 500000, "risk_category": "LOW"}	LOW	SOFT_APPROACH	95.0	\N	50	25000000	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
8	Retail Medium Risk	RMR	{"max_dpd": 60, "max_exposure": 500000, "min_exposure": 50000, "risk_category": "MEDIUM"}	MEDIUM	STANDARD_APPROACH	85.0	\N	200	50000000	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
9	Small Ticket High Risk	STHR	{"min_dpd": 61, "max_exposure": 50000, "risk_category": "HIGH"}	HIGH	AGGRESSIVE_APPROACH	70.0	\N	500	15000000	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_forecasts; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_forecasts (forecast_id, forecast_date, forecast_period, forecast_type, product_id, bucket_id, predicted_amount, confidence_level, lower_bound, upper_bound, actual_amount, variance, model_used, created_at) FROM stdin;
\.


--
-- Data for Name: collection_interactions; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_interactions (interaction_id, case_id, customer_id, interaction_type, interaction_direction, officer_id, contact_number, interaction_status, duration_seconds, outcome, promise_to_pay, ptp_amount, ptp_date, notes, recording_reference, interaction_datetime, created_at) FROM stdin;
13	10	CUST001	SMS	OUTBOUND	OFF001	+966501234567	SENT	\N	NO_RESPONSE	f	\N	\N	Reminder SMS sent	\N	2024-07-21 06:00:00+00	2025-07-26 04:37:40.72132+00
14	10	CUST001	CALL	OUTBOUND	OFF001	+966501234567	COMPLETED	\N	PROMISE_TO_PAY	t	20000.00	2024-08-01	Customer promised partial payment	\N	2024-07-20 07:30:00+00	2025-07-26 04:37:40.72132+00
15	11	CUST005	CALL	OUTBOUND	OFF002	+966505678901	COMPLETED	\N	CALLBACK_REQUESTED	f	\N	\N	Customer requested callback tomorrow	\N	2024-07-20 11:15:00+00	2025-07-26 04:37:40.72132+00
16	12	CUST004	EMAIL	OUTBOUND	OFF004	a.qasim@kbank.sa	SENT	\N	NO_RESPONSE	f	\N	\N	Payment reminder email	\N	2024-07-19 08:00:00+00	2025-07-26 04:37:40.72132+00
17	13	CUST006	CALL	INBOUND	OFF006	+966506789012	COMPLETED	\N	DISPUTE_RAISED	f	\N	\N	Customer disputes charges	\N	2024-07-18 13:45:00+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_officers; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_officers (officer_id, employee_id, officer_name, team_id, officer_type, contact_number, email, language_skills, collection_limit, commission_rate, status, joining_date, last_active, created_at) FROM stdin;
OFF001	EMP001	Ahmed Al-Rasheed	16	CALL_AGENT	+966501111111	a.rasheed@kb.sa	Arabic,English	500000.00	0.50	ACTIVE	2020-03-01	\N	2025-07-26 04:37:40.72132+00
OFF002	EMP002	Sara Al-Mahmoud	16	CALL_AGENT	+966502222222	s.mahmoud@kb.sa	Arabic,English	500000.00	0.50	ACTIVE	2020-04-01	\N	2025-07-26 04:37:40.72132+00
OFF003	EMP003	Khalid Al-Otaibi	17	FIELD_AGENT	+966503333333	k.otaibi@kb.sa	Arabic,English	1000000.00	1.00	ACTIVE	2020-05-01	\N	2025-07-26 04:37:40.72132+00
OFF004	EMP004	Fatima Al-Zahrani	18	CALL_AGENT	+966504444444	f.zahrani@kb.sa	Arabic,English	500000.00	0.50	ACTIVE	2020-06-01	\N	2025-07-26 04:37:40.72132+00
OFF005	EMP005	Mohammed Al-Qahtani	20	LEGAL_OFFICER	+966505555555	m.qahtani@kb.sa	Arabic,English	2000000.00	0.30	ACTIVE	2020-07-01	\N	2025-07-26 04:37:40.72132+00
OFF006	EMP006	Noura Al-Shehri	16	SENIOR_COLLECTOR	+966506666666	n.shehri@kb.sa	Arabic,English,Hindi	1500000.00	0.75	ACTIVE	2020-02-01	\N	2025-07-26 04:37:40.72132+00
OFF007	EMP007	Abdullah Al-Ghamdi	19	FIELD_AGENT	+966507777777	a.ghamdi@kb.sa	Arabic,English	1000000.00	1.00	ACTIVE	2021-01-01	\N	2025-07-26 04:37:40.72132+00
OFF008	EMP008	Maha Al-Dossari	16	TEAM_LEAD	+966508888888	m.dossari@kb.sa	Arabic,English,French	2000000.00	0.40	ACTIVE	2020-01-15	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_provisions; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_provisions (provision_id, provision_date, bucket_id, provision_rate, total_exposure, provision_amount, ifrs9_stage, ecl_amount, regulatory_provision, additional_provision, provision_coverage_ratio, created_at) FROM stdin;
1	2024-06-30	22	5.0	185474	9273.70	STAGE1	9273.70	9273.70	\N	5.0	2025-07-26 04:37:40.72132+00
2	2024-06-30	23	15.0	135250	20287.50	STAGE2	20287.50	20287.50	\N	15.0	2025-07-26 04:37:40.72132+00
3	2024-06-30	24	50.0	100380	50190.00	STAGE3	50190.00	50190.00	\N	50.0	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_queue_management; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_queue_management (queue_id, queue_name, queue_type, priority_level, filter_criteria, assigned_officer_id, assigned_team_id, cases_count, total_amount, avg_dpd, last_refreshed, is_active, created_at, updated_at) FROM stdin;
1	High Priority Retail	PRIORITY	1	{"min_dpd": 60, "min_amount": 100000}	\N	16	2	235630	75	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
2	Standard Retail	NORMAL	2	{"max_dpd": 60, "max_amount": 100000}	\N	16	2	185474	38	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
3	Field Visit Queue	MANUAL	1	{"min_dpd": 90}	\N	17	1	100380	90	\N	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_risk_assessment; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_risk_assessment (assessment_id, customer_id, case_id, assessment_date, risk_category, default_probability, loss_given_default, expected_loss, early_warning_flags, behavioral_score, payment_pattern_score, external_risk_factors, recommended_strategy, next_review_date, created_at) FROM stdin;
1	CUST001	10	2024-07-15	HIGH	0.35	0.60	28402.500000	\N	45	30	\N	SETTLEMENT_OFFER	2024-08-15	2025-07-26 04:37:40.72132+00
2	CUST005	11	2024-07-15	MEDIUM	0.25	0.50	16190.500000	\N	55	50	\N	STANDARD_COLLECTION	2024-08-15	2025-07-26 04:37:40.72132+00
3	CUST004	12	2024-07-15	MEDIUM	0.30	0.55	9231.750000	\N	50	45	\N	SETTLEMENT_OFFER	2024-08-15	2025-07-26 04:37:40.72132+00
4	CUST006	13	2024-07-15	HIGH	0.45	0.70	31619.700000	\N	35	25	\N	LEGAL_ACTION	2024-08-15	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_scores; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_scores (score_id, customer_id, score_date, payment_behavior_score, contact_score, response_score, risk_score, recovery_probability, recommended_action, score_factors, created_at) FROM stdin;
6	CUST001	2024-07-20	45	80	70	65	0.65	CONTINUE_FOLLOW_UP	\N	2025-07-26 04:37:40.72132+00
7	CUST005	2024-07-20	55	75	60	55	0.75	STANDARD_COLLECTION	\N	2025-07-26 04:37:40.72132+00
8	CUST004	2024-07-20	50	40	50	60	0.70	INCREASE_CONTACT	\N	2025-07-26 04:37:40.72132+00
9	CUST006	2024-07-20	35	30	40	75	0.45	ESCALATE_TO_LEGAL	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_settlement_offers; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_settlement_offers (offer_id, case_id, customer_id, offer_date, original_amount, settlement_amount, discount_percentage, payment_terms, installments, offer_valid_until, offer_status, approval_level, approved_by, customer_response, response_date, created_at) FROM stdin;
1	10	CUST001	2024-07-20	135250.00	120000	11.3	LUMP_SUM	\N	2024-08-20	PENDING	\N	\N	\N	\N	2025-07-26 04:37:40.72132+00
2	12	CUST004	2024-07-19	55950.00	50000	10.6	INSTALLMENTS_3	\N	2024-08-19	PENDING	\N	\N	\N	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_strategies; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_strategies (strategy_id, strategy_code, strategy_name, bucket_id, customer_segment, risk_category, min_amount, max_amount, actions, escalation_days, is_active, created_at) FROM stdin;
12	SOFT_REM_01	Soft Reminder Strategy	22	RETAIL	LOW	1000.00	50000.00	["SMS reminder", "Email reminder", "Automated call"]	7	t	2025-07-26 04:37:40.72132+00
13	INT_CALL_01	Intensive Calling Strategy	23	RETAIL	MEDIUM	50000.00	200000.00	["Daily calls", "Skip tracing", "Email escalation"]	14	t	2025-07-26 04:37:40.72132+00
14	FIELD_VIS_01	Field Visit Strategy	24	PREMIUM	HIGH	200000.00	1000000.00	["Field visit", "Legal notice preparation", "Asset verification"]	21	t	2025-07-26 04:37:40.72132+00
15	LEGAL_ACT_01	Legal Action Strategy	25	HNI	HIGH	1000000.00	\N	["Legal notice", "Court filing", "Asset attachment"]	30	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_system_performance; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_system_performance (log_id, log_timestamp, system_component, response_time_ms, cpu_usage_percent, memory_usage_percent, active_users, error_count, warning_count, api_calls, database_connections) FROM stdin;
4	2024-07-20 07:00:00+00	WEB_APP	45	35.50	62.30	25	\N	\N	1500	\N
5	2024-07-20 08:00:00+00	API_SERVER	28	42.10	58.70	30	\N	\N	2100	\N
\.


--
-- Data for Name: collection_teams; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_teams (team_id, team_code, team_name, team_type, branch_id, manager_id, is_active, created_at) FROM stdin;
16	CALL_TEAM_01	Riyadh Call Center Team	CALL_CENTER	BR001	MGR001	t	2025-07-26 04:37:40.72132+00
17	FIELD_TEAM_01	Riyadh Field Team	FIELD	BR001	MGR002	t	2025-07-26 04:37:40.72132+00
18	CALL_TEAM_02	Jeddah Call Center Team	CALL_CENTER	BR002	MGR003	t	2025-07-26 04:37:40.72132+00
19	FIELD_TEAM_02	Eastern Province Field Team	FIELD	BR003	MGR004	t	2025-07-26 04:37:40.72132+00
20	LEGAL_TEAM_01	Central Legal Team	LEGAL	BR001	MGR005	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_vintage_analysis; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_vintage_analysis (vintage_id, origination_month, product_id, months_on_book, original_accounts, original_amount, current_outstanding, dpd_0_30_count, dpd_31_60_count, dpd_61_90_count, dpd_90_plus_count, written_off_count, written_off_amount, recovery_amount, flow_rate_30, flow_rate_60, flow_rate_90, loss_rate, created_at) FROM stdin;
1	2020-06	41	49	100	10000000	6500000	5	3	1	1	\N	\N	\N	0.05	0.03	0.01	0.01	2025-07-26 04:37:40.72132+00
2	2021-01	41	42	80	6000000	4200000	4	2	1	0	\N	\N	\N	0.05	0.025	0.0125	0.00	2025-07-26 04:37:40.72132+00
3	2021-06	41	37	120	9000000	6750000	6	3	2	1	\N	\N	\N	0.05	0.025	0.017	0.008	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_workflow_templates; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_workflow_templates (template_id, template_name, workflow_type, bucket_id, customer_segment, workflow_steps, escalation_matrix, sla_hours, is_automated, is_active, created_at, updated_at) FROM stdin;
1	Early Stage Workflow	STANDARD	22	\N	[{"step": 1, "action": "SMS"}, {"step": 2, "action": "Call"}, {"step": 3, "action": "Email"}]	\N	48	t	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
2	Mid Stage Workflow	INTENSIVE	23	\N	[{"step": 1, "action": "Call"}, {"step": 2, "action": "Field Visit"}, {"step": 3, "action": "Legal Notice"}]	\N	72	f	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
3	Late Stage Workflow	AGGRESSIVE	24	\N	[{"step": 1, "action": "Field Visit"}, {"step": 2, "action": "Legal Notice"}, {"step": 3, "action": "Legal Action"}]	\N	96	f	t	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_write_offs; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.collection_write_offs (write_off_id, case_id, account_number, customer_id, write_off_date, write_off_amount, principal_amount, interest_amount, penalty_amount, write_off_reason, approval_level, approved_by, recovery_attempts, last_payment_date, documentation, is_recoverable, created_at) FROM stdin;
\.


--
-- Data for Name: daily_collection_summary; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.daily_collection_summary (summary_id, summary_date, branch_id, team_id, total_due_amount, total_collected, collection_rate, accounts_due, accounts_collected, calls_made, contacts_successful, ptps_obtained, ptps_kept, field_visits_done, legal_notices_sent, digital_payments, created_at) FROM stdin;
4	2024-07-20	BR001	16	191200.00	57360.00	30.00	2	1	105	27	6	\N	\N	\N	\N	2025-07-26 04:37:40.72132+00
5	2024-07-20	BR002	18	55950.00	11190.00	20.00	1	0	30	6	1	\N	\N	\N	\N	2025-07-26 04:37:40.72132+00
6	2024-07-20	BR003	19	229904.00	45981.00	20.00	2	1	45	12	2	\N	\N	\N	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: data_masking_rules; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.data_masking_rules (rule_id, table_name, column_name, masking_type, masking_pattern, role_exceptions, is_active, created_at) FROM stdin;
4	customers	tax_id	PARTIAL	XXX-XX-####	\N	t	2025-07-26 04:37:40.72132+00
5	customer_contacts	contact_value	PARTIAL	+966#####XX##	\N	t	2025-07-26 04:37:40.72132+00
6	accounts	account_number	PARTIAL	ACC######XXXX	\N	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: digital_collection_attempts; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.digital_collection_attempts (attempt_id, case_id, customer_id, channel_type, campaign_id, message_template, sent_datetime, delivered_datetime, read_datetime, response_datetime, response_type, payment_made, payment_amount, click_through_rate, cost_per_message, created_at) FROM stdin;
3	10	CUST001	SMS	\N	PAYMENT_REMINDER_01	2024-07-21 06:00:00+00	2024-07-21 06:00:05+00	\N	\N	NO_RESPONSE	f	\N	\N	\N	2025-07-26 04:37:40.72132+00
4	11	CUST005	WHATSAPP	\N	PAYMENT_REMINDER_02	2024-07-20 05:00:00+00	2024-07-20 05:00:03+00	\N	\N	READ	f	\N	\N	\N	2025-07-26 04:37:40.72132+00
5	12	CUST004	EMAIL	\N	PAYMENT_REMINDER_03	2024-07-19 08:00:00+00	2024-07-19 08:00:10+00	\N	\N	NO_RESPONSE	f	\N	\N	\N	2025-07-26 04:37:40.72132+00
6	13	CUST006	SMS	\N	URGENT_PAYMENT_01	2024-07-18 06:00:00+00	2024-07-18 06:00:04+00	\N	\N	CLICKED	f	\N	\N	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: field_visits; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.field_visits (visit_id, case_id, customer_id, officer_id, visit_date, scheduled_time, actual_time, visit_address, visit_status, customer_met, amount_collected, collection_mode, receipt_number, customer_behavior, follow_up_required, geo_location, distance_traveled, expenses_claimed, safety_concern, notes, photo_references, created_at) FROM stdin;
2	10	CUST001	OFF007	2024-07-15	14:00:00	\N	\N	COMPLETED	CUSTOMER	10000.00	\N	\N	\N	f	\N	\N	\N	f	Partial payment collected	\N	2025-07-26 04:37:40.72132+00
3	13	CUST006	OFF003	2024-07-22	10:00:00	\N	\N	SCHEDULED	\N	\N	\N	\N	\N	f	\N	\N	\N	f	First field visit scheduled	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: hardship_applications; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.hardship_applications (application_id, customer_id, case_id, hardship_type, application_date, supporting_documents, requested_relief, review_status, approved_by, approval_date, relief_granted, relief_start_date, relief_end_date, monitoring_required, notes, created_at) FROM stdin;
3	CUST001	10	JOB_LOSS	2024-07-15	\N	PAYMENT_DEFERRAL_3_MONTHS	UNDER_REVIEW	\N	\N	\N	\N	\N	t	\N	2025-07-26 04:37:40.72132+00
4	CUST006	13	MEDICAL	2024-07-10	\N	INTEREST_WAIVER	PENDING	\N	\N	\N	\N	\N	t	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: ivr_payment_attempts; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.ivr_payment_attempts (attempt_id, customer_id, account_number, call_datetime, ivr_menu_path, payment_amount, payment_method, transaction_status, failure_reason, transaction_reference, created_at) FROM stdin;
1	CUST001	ACC1000000001	2024-07-19 15:30:00+00	MAIN>PAYMENT>LOAN	5000.00	DEBIT_CARD	SUCCESS	\N	IVR20240719183000001	2025-07-26 04:37:40.72132+00
2	CUST005	ACC1000000007	2024-07-18 17:15:00+00	MAIN>PAYMENT>LOAN	3012.00	CREDIT_CARD	FAILED	\N	\N	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: legal_cases; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.legal_cases (legal_case_id, case_id, case_number, court_name, case_type, filing_date, lawyer_name, lawyer_firm, current_stage, next_hearing_date, judgment_date, judgment_amount, execution_status, legal_costs, recovered_amount, case_status, documents, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: loan_restructuring; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.loan_restructuring (restructure_id, loan_account_number, customer_id, original_loan_amount, outstanding_amount, original_tenure, remaining_tenure, original_interest_rate, new_interest_rate, new_tenure, new_emi, moratorium_months, restructure_date, restructure_reason, approval_level, impact_on_provision, status, created_at) FROM stdin;
\.


--
-- Data for Name: officer_performance_metrics; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.officer_performance_metrics (metric_id, officer_id, metric_date, accounts_assigned, accounts_worked, calls_made, talk_time_minutes, contacts_successful, amount_collected, ptps_obtained, ptps_kept_rate, average_collection_days, customer_complaints, quality_score, created_at) FROM stdin;
4	OFF001	2024-07-20	25	20	60	420	15	50000.00	5	0.80	\N	0	8.50	2025-07-26 04:37:40.72132+00
5	OFF002	2024-07-20	30	25	75	525	18	75000.00	8	0.75	\N	1	8.00	2025-07-26 04:37:40.72132+00
6	OFF003	2024-07-20	15	12	0	0	8	120000.00	3	0.90	\N	0	9.00	2025-07-26 04:37:40.72132+00
7	OFF006	2024-07-20	20	18	45	540	12	95000.00	6	0.85	\N	0	8.80	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: officer_performance_summary; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.officer_performance_summary (summary_id, officer_id, summary_date, total_cases, total_portfolio_value, total_collected, collection_rate, total_calls, total_messages, successful_contacts, contact_rate, total_ptps, ptps_kept, ptp_keep_rate, avg_response_time, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.performance_metrics (metric_id, metric_name, metric_value, metric_unit, metric_timestamp, additional_info) FROM stdin;
1	DAILY_COLLECTION_RATE	25.5	PERCENTAGE	2025-07-26 04:37:40.72132+00	{"date": "2024-07-20", "region": "Central"}
2	AVERAGE_CALL_DURATION	7.5	MINUTES	2025-07-26 04:37:40.72132+00	{"date": "2024-07-20", "team": "CALL_TEAM_01"}
\.


--
-- Data for Name: promise_to_pay; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.promise_to_pay (ptp_id, case_id, customer_id, interaction_id, ptp_amount, ptp_date, ptp_type, installment_count, officer_id, status, amount_received, kept_date, broken_reason, created_at, updated_at) FROM stdin;
5	10	CUST001	14	20000.00	2024-08-01	PARTIAL	\N	OFF001	ACTIVE	0.00	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
6	11	CUST005	\N	30000.00	2024-07-30	PARTIAL	\N	OFF002	ACTIVE	0.00	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
7	12	CUST004	\N	55950.00	2024-08-15	FULL	\N	OFF004	ACTIVE	0.00	\N	\N	2025-07-26 04:37:40.72132+00	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: repossessed_assets; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.repossessed_assets (asset_id, case_id, asset_type, asset_description, repossession_date, storage_location, estimated_value, valuation_date, valuation_agency, auction_date, sale_amount, buyer_details, storage_costs, legal_costs, net_recovery, asset_condition, documents, photos, status, created_at) FROM stdin;
\.


--
-- Data for Name: sharia_compliance_log; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.sharia_compliance_log (compliance_id, case_id, compliance_type, late_payment_charges, charity_amount, charity_name, distribution_date, distribution_receipt, compliance_status, reviewed_by, review_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.user_role_assignments (assignment_id, user_id, role_id, assigned_by, valid_from, valid_until, is_active, created_at) FROM stdin;
17	OFF001	16	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
18	OFF002	16	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
19	OFF003	19	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
20	OFF004	16	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
21	OFF005	20	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
22	OFF006	16	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
23	OFF007	19	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
24	OFF008	17	ADMIN	2025-07-26 04:37:40.72132+00	\N	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: kastle_collection; Owner: postgres
--

COPY kastle_collection.user_roles (role_id, role_name, role_description, permissions, is_active, created_at) FROM stdin;
16	COLLECTION_AGENT	Basic collection agent role	{"make_calls": true, "view_cases": true, "update_interactions": true}	t	2025-07-26 04:37:40.72132+00
17	TEAM_LEAD	Team lead with supervisory access	{"make_calls": true, "view_cases": true, "assign_cases": true, "update_interactions": true, "view_team_performance": true}	t	2025-07-26 04:37:40.72132+00
18	COLLECTION_MANAGER	Collection department manager	{"full_access": true}	t	2025-07-26 04:37:40.72132+00
19	FIELD_AGENT	Field collection agent	{"view_cases": true, "collect_payments": true, "update_field_visits": true}	t	2025-07-26 04:37:40.72132+00
20	LEGAL_OFFICER	Legal collection officer	{"view_cases": true, "file_legal_notices": true, "manage_legal_cases": true}	t	2025-07-26 04:37:40.72132+00
\.


--
-- Data for Name: collection_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_cases (case_id, case_number, customer_id, loan_account_number, officer_id, loan_amount, outstanding_balance, overdue_amount, overdue_days, delinquency_bucket, priority_level, loan_status, product_type, last_payment_date, last_payment_amount, created_at, updated_at) FROM stdin;
1	COLL20250726_3bb2209b	CUST001	LN001234	OFF001	100000.00	85000.00	15000.00	30	30-60 days	MEDIUM	ACTIVE	Personal Loan	\N	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
2	COLL20250726_2d0cb2e8	CUST002	LN001235	OFF001	200000.00	180000.00	40000.00	60	60-90 days	HIGH	ACTIVE	Business Loan	\N	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
3	COLL20250726_cd0d3790	CUST003	LN001236	OFF002	50000.00	45000.00	10000.00	15	0-30 days	LOW	ACTIVE	Personal Loan	\N	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
4	COLL20250726_dc602e10	CUST004	LN001237	OFF002	300000.00	250000.00	80000.00	90	90+ days	CRITICAL	ACTIVE	Mortgage	\N	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
5	COLL20250726_7d3edf91	CUST005	LN001238	OFF003	75000.00	70000.00	20000.00	45	30-60 days	MEDIUM	ACTIVE	Auto Loan	\N	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
6	COLL20250726_0fe3cad6	CUST001	LN001234	OFF001	100000.00	85000.00	15000.00	30	30-60 days	MEDIUM	ACTIVE	Personal Loan	\N	\N	2025-07-26 13:31:41.82752+00	2025-07-26 13:31:41.82752+00
7	COLL20250726_08deed75	CUST002	LN001235	OFF001	200000.00	180000.00	40000.00	60	60-90 days	HIGH	ACTIVE	Business Loan	\N	\N	2025-07-26 13:31:41.82752+00	2025-07-26 13:31:41.82752+00
8	COLL20250726_6bd21a78	CUST003	LN001236	OFF002	50000.00	45000.00	10000.00	15	0-30 days	LOW	ACTIVE	Personal Loan	\N	\N	2025-07-26 13:31:41.82752+00	2025-07-26 13:31:41.82752+00
9	COLL20250726_3e920b7b	CUST004	LN001237	OFF002	300000.00	250000.00	80000.00	90	90+ days	CRITICAL	ACTIVE	Mortgage	\N	\N	2025-07-26 13:31:41.82752+00	2025-07-26 13:31:41.82752+00
10	COLL20250726_78a5d4bf	CUST005	LN001238	OFF003	75000.00	70000.00	20000.00	45	30-60 days	MEDIUM	ACTIVE	Auto Loan	\N	\N	2025-07-26 13:31:41.82752+00	2025-07-26 13:31:41.82752+00
\.


--
-- Data for Name: collection_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_interactions (interaction_id, case_id, officer_id, interaction_type, interaction_datetime, response_received, notes, created_at) FROM stdin;
\.


--
-- Data for Name: collection_officers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collection_officers (officer_id, full_name, email, mobile_number, department, status, created_at, updated_at) FROM stdin;
OFF001	Alice Officer	alice.o@company.com	+254700111222	Collections	ACTIVE	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
OFF002	Bob Collector	bob.c@company.com	+254700222333	Collections	ACTIVE	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
OFF003	Charlie Agent	charlie.a@company.com	+254700333444	Collections	ACTIVE	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, full_name, national_id, mobile_number, email, address, created_at, updated_at) FROM stdin;
CUST001	John Doe	1234567890	+254712345678	john.doe@email.com	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
CUST002	Jane Smith	0987654321	+254723456789	jane.smith@email.com	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
CUST003	Robert Johnson	1122334455	+254734567890	robert.j@email.com	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
CUST004	Mary Williams	5544332211	+254745678901	mary.w@email.com	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
CUST005	David Brown	6677889900	+254756789012	david.b@email.com	\N	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
\.


--
-- Data for Name: officer_performance_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.officer_performance_summary (summary_id, officer_id, summary_date, total_cases, total_calls, total_messages, total_ptps, ptps_kept, collection_amount, collection_rate, contact_rate, ptp_keep_rate, created_at, updated_at) FROM stdin;
c13fbebb-d738-4a45-af9f-59ba91516df8	OFF001	2025-07-26	40	59	20	15	12	139700.00	68.00	57.00	83.00	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
57af0683-8955-48f6-b91c-806d5f331d2d	OFF002	2025-07-26	39	21	51	14	12	191910.00	72.00	47.00	77.00	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
d7b73ed7-a5b2-4c74-a589-5c30612948ec	OFF003	2025-07-26	57	70	25	24	5	194559.00	75.00	70.00	74.00	2025-07-26 13:30:32.822611+00	2025-07-26 13:30:32.822611+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (payment_id, case_id, payment_date, payment_amount, payment_method, reference_number, created_at) FROM stdin;
\.


--
-- Data for Name: promise_to_pay; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promise_to_pay (ptp_id, case_id, officer_id, promise_date, promise_amount, status, actual_payment_date, actual_payment_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages_2025_07_23; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_07_23 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_07_24; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_07_24 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_07_25; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_07_25 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_07_26; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_07_26 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_07_27; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_07_27 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-07-23 15:50:44
20211116045059	2025-07-23 15:50:47
20211116050929	2025-07-23 15:50:48
20211116051442	2025-07-23 15:50:48
20211116212300	2025-07-23 15:50:49
20211116213355	2025-07-23 15:50:49
20211116213934	2025-07-23 15:50:50
20211116214523	2025-07-23 15:50:50
20211122062447	2025-07-23 15:50:51
20211124070109	2025-07-23 15:50:51
20211202204204	2025-07-23 15:50:52
20211202204605	2025-07-23 15:50:52
20211210212804	2025-07-23 15:50:53
20211228014915	2025-07-23 15:50:54
20220107221237	2025-07-23 15:50:54
20220228202821	2025-07-23 15:50:55
20220312004840	2025-07-23 15:50:55
20220603231003	2025-07-23 15:50:56
20220603232444	2025-07-23 15:50:56
20220615214548	2025-07-23 15:50:57
20220712093339	2025-07-23 15:50:57
20220908172859	2025-07-23 15:50:58
20220916233421	2025-07-23 15:50:58
20230119133233	2025-07-23 15:50:58
20230128025114	2025-07-23 15:50:59
20230128025212	2025-07-23 15:51:00
20230227211149	2025-07-23 15:51:00
20230228184745	2025-07-23 15:51:01
20230308225145	2025-07-23 15:51:01
20230328144023	2025-07-23 15:51:01
20231018144023	2025-07-23 15:51:02
20231204144023	2025-07-23 15:51:03
20231204144024	2025-07-23 15:51:03
20231204144025	2025-07-23 15:51:04
20240108234812	2025-07-23 15:51:04
20240109165339	2025-07-23 15:51:04
20240227174441	2025-07-23 15:51:05
20240311171622	2025-07-23 15:51:06
20240321100241	2025-07-23 15:51:06
20240401105812	2025-07-23 15:51:08
20240418121054	2025-07-23 15:51:08
20240523004032	2025-07-23 15:51:10
20240618124746	2025-07-23 15:51:10
20240801235015	2025-07-23 15:51:10
20240805133720	2025-07-23 15:51:11
20240827160934	2025-07-23 15:51:11
20240919163303	2025-07-23 15:51:12
20240919163305	2025-07-23 15:51:12
20241019105805	2025-07-23 15:51:13
20241030150047	2025-07-23 15:51:14
20241108114728	2025-07-23 15:51:15
20241121104152	2025-07-23 15:51:15
20241130184212	2025-07-23 15:51:16
20241220035512	2025-07-23 15:51:16
20241220123912	2025-07-23 15:51:17
20241224161212	2025-07-23 15:51:17
20250107150512	2025-07-23 15:51:18
20250110162412	2025-07-23 15:51:18
20250123174212	2025-07-23 15:51:19
20250128220012	2025-07-23 15:51:19
20250506224012	2025-07-23 15:51:20
20250523164012	2025-07-23 15:51:20
20250714121412	2025-07-23 15:51:21
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-07-23 15:50:40.984854
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-07-23 15:50:40.991553
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-07-23 15:50:40.99725
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-07-23 15:50:41.013594
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-07-23 15:50:41.024347
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-07-23 15:50:41.031771
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-07-23 15:50:41.040543
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-07-23 15:50:41.048369
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-07-23 15:50:41.054682
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-07-23 15:50:41.061885
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-07-23 15:50:41.068845
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-07-23 15:50:41.07566
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-07-23 15:50:41.082576
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-07-23 15:50:41.089349
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-07-23 15:50:41.096192
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-07-23 15:50:41.114243
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-07-23 15:50:41.121074
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-07-23 15:50:41.130019
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-07-23 15:50:41.137095
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-07-23 15:50:41.144963
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-07-23 15:50:41.152736
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-07-23 15:50:41.161076
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-07-23 15:50:41.175616
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-07-23 15:50:41.187067
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-07-23 15:50:41.193682
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-07-23 15:50:41.200115
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: account_types_type_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.account_types_type_id_seq', 46, true);


--
-- Name: accounts_account_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.accounts_account_id_seq', 81, true);


--
-- Name: aging_buckets_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.aging_buckets_id_seq', 35, true);


--
-- Name: audit_trail_audit_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.audit_trail_audit_id_seq', 12, true);


--
-- Name: bank_config_config_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.bank_config_config_id_seq', 19, true);


--
-- Name: branch_collection_performance_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.branch_collection_performance_id_seq', 225, true);


--
-- Name: collection_buckets_bucket_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.collection_buckets_bucket_id_seq', 27, true);


--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.collection_cases_case_id_seq', 21, true);


--
-- Name: collection_rates_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.collection_rates_id_seq', 141, true);


--
-- Name: customer_addresses_address_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.customer_addresses_address_id_seq', 66, true);


--
-- Name: customer_contacts_contact_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.customer_contacts_contact_id_seq', 126, true);


--
-- Name: customer_documents_document_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.customer_documents_document_id_seq', 67, true);


--
-- Name: customer_types_type_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.customer_types_type_id_seq', 27, true);


--
-- Name: delinquencies_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.delinquencies_id_seq', 17, true);


--
-- Name: delinquency_history_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.delinquency_history_id_seq', 22, true);


--
-- Name: loan_accounts_loan_account_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.loan_accounts_loan_account_id_seq', 25, true);


--
-- Name: loan_applications_application_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.loan_applications_application_id_seq', 27, true);


--
-- Name: portfolio_summary_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.portfolio_summary_id_seq', 57, true);


--
-- Name: product_categories_category_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.product_categories_category_id_seq', 32, true);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.products_product_id_seq', 45, true);


--
-- Name: transaction_types_type_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.transaction_types_type_id_seq', 42, true);


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: kastle_banking; Owner: postgres
--

SELECT pg_catalog.setval('kastle_banking.transactions_transaction_id_seq', 47, true);


--
-- Name: access_log_access_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.access_log_access_id_seq', 2, true);


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.audit_log_audit_id_seq', 2, true);


--
-- Name: collection_audit_trail_audit_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_audit_trail_audit_id_seq', 2, true);


--
-- Name: collection_automation_metrics_metric_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_automation_metrics_metric_id_seq', 3, true);


--
-- Name: collection_benchmarks_benchmark_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_benchmarks_benchmark_id_seq', 3, true);


--
-- Name: collection_bucket_movement_movement_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_bucket_movement_movement_id_seq', 1, false);


--
-- Name: collection_call_records_call_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_call_records_call_id_seq', 3, true);


--
-- Name: collection_campaigns_campaign_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_campaigns_campaign_id_seq', 4, true);


--
-- Name: collection_case_details_case_detail_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_case_details_case_detail_id_seq', 13, true);


--
-- Name: collection_compliance_violations_violation_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_compliance_violations_violation_id_seq', 1, true);


--
-- Name: collection_contact_attempts_attempt_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_contact_attempts_attempt_id_seq', 10, true);


--
-- Name: collection_customer_segments_segment_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_customer_segments_segment_id_seq', 9, true);


--
-- Name: collection_forecasts_forecast_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_forecasts_forecast_id_seq', 1, false);


--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_interactions_interaction_id_seq', 17, true);


--
-- Name: collection_provisions_provision_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_provisions_provision_id_seq', 3, true);


--
-- Name: collection_queue_management_queue_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_queue_management_queue_id_seq', 3, true);


--
-- Name: collection_risk_assessment_assessment_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_risk_assessment_assessment_id_seq', 4, true);


--
-- Name: collection_scores_score_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_scores_score_id_seq', 9, true);


--
-- Name: collection_settlement_offers_offer_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_settlement_offers_offer_id_seq', 2, true);


--
-- Name: collection_strategies_strategy_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_strategies_strategy_id_seq', 15, true);


--
-- Name: collection_system_performance_log_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_system_performance_log_id_seq', 5, true);


--
-- Name: collection_teams_team_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_teams_team_id_seq', 20, true);


--
-- Name: collection_vintage_analysis_vintage_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_vintage_analysis_vintage_id_seq', 3, true);


--
-- Name: collection_workflow_templates_template_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_workflow_templates_template_id_seq', 3, true);


--
-- Name: collection_write_offs_write_off_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.collection_write_offs_write_off_id_seq', 1, false);


--
-- Name: daily_collection_summary_summary_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.daily_collection_summary_summary_id_seq', 6, true);


--
-- Name: data_masking_rules_rule_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.data_masking_rules_rule_id_seq', 6, true);


--
-- Name: digital_collection_attempts_attempt_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.digital_collection_attempts_attempt_id_seq', 6, true);


--
-- Name: field_visits_visit_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.field_visits_visit_id_seq', 3, true);


--
-- Name: hardship_applications_application_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.hardship_applications_application_id_seq', 4, true);


--
-- Name: ivr_payment_attempts_attempt_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.ivr_payment_attempts_attempt_id_seq', 2, true);


--
-- Name: legal_cases_legal_case_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.legal_cases_legal_case_id_seq', 1, false);


--
-- Name: loan_restructuring_restructure_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.loan_restructuring_restructure_id_seq', 1, false);


--
-- Name: officer_performance_metrics_metric_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.officer_performance_metrics_metric_id_seq', 7, true);


--
-- Name: officer_performance_summary_summary_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.officer_performance_summary_summary_id_seq', 1, false);


--
-- Name: performance_metrics_metric_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.performance_metrics_metric_id_seq', 2, true);


--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.promise_to_pay_ptp_id_seq', 7, true);


--
-- Name: repossessed_assets_asset_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.repossessed_assets_asset_id_seq', 1, false);


--
-- Name: sharia_compliance_log_compliance_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.sharia_compliance_log_compliance_id_seq', 1, true);


--
-- Name: user_role_assignments_assignment_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.user_role_assignments_assignment_id_seq', 24, true);


--
-- Name: user_roles_role_id_seq; Type: SEQUENCE SET; Schema: kastle_collection; Owner: postgres
--

SELECT pg_catalog.setval('kastle_collection.user_roles_role_id_seq', 20, true);


--
-- Name: collection_cases_case_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.collection_cases_case_id_seq', 10, true);


--
-- Name: collection_interactions_interaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.collection_interactions_interaction_id_seq', 1, false);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 1, false);


--
-- Name: promise_to_pay_ptp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promise_to_pay_ptp_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (type_id);


--
-- Name: account_types account_types_type_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.account_types
    ADD CONSTRAINT account_types_type_code_key UNIQUE (type_code);


--
-- Name: accounts accounts_account_number_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_account_number_key UNIQUE (account_number);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (account_id);


--
-- Name: aging_buckets aging_buckets_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.aging_buckets
    ADD CONSTRAINT aging_buckets_pkey PRIMARY KEY (id);


--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (audit_id);


--
-- Name: auth_user_profiles auth_user_profiles_bank_user_id_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.auth_user_profiles
    ADD CONSTRAINT auth_user_profiles_bank_user_id_key UNIQUE (bank_user_id);


--
-- Name: auth_user_profiles auth_user_profiles_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.auth_user_profiles
    ADD CONSTRAINT auth_user_profiles_pkey PRIMARY KEY (id);


--
-- Name: bank_config bank_config_bank_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.bank_config
    ADD CONSTRAINT bank_config_bank_code_key UNIQUE (bank_code);


--
-- Name: bank_config bank_config_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.bank_config
    ADD CONSTRAINT bank_config_pkey PRIMARY KEY (config_id);


--
-- Name: branch_collection_performance branch_collection_performance_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.branch_collection_performance
    ADD CONSTRAINT branch_collection_performance_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- Name: collection_buckets collection_buckets_bucket_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_buckets
    ADD CONSTRAINT collection_buckets_bucket_code_key UNIQUE (bucket_code);


--
-- Name: collection_buckets collection_buckets_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_buckets
    ADD CONSTRAINT collection_buckets_pkey PRIMARY KEY (bucket_id);


--
-- Name: collection_cases collection_cases_case_number_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases
    ADD CONSTRAINT collection_cases_case_number_key UNIQUE (case_number);


--
-- Name: collection_cases collection_cases_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases
    ADD CONSTRAINT collection_cases_pkey PRIMARY KEY (case_id);


--
-- Name: collection_rates collection_rates_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_rates
    ADD CONSTRAINT collection_rates_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (country_code);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (currency_code);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (address_id);


--
-- Name: customer_contacts customer_contacts_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_contacts
    ADD CONSTRAINT customer_contacts_pkey PRIMARY KEY (contact_id);


--
-- Name: customer_documents customer_documents_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_documents
    ADD CONSTRAINT customer_documents_pkey PRIMARY KEY (document_id);


--
-- Name: customer_types customer_types_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_types
    ADD CONSTRAINT customer_types_pkey PRIMARY KEY (type_id);


--
-- Name: customer_types customer_types_type_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_types
    ADD CONSTRAINT customer_types_type_code_key UNIQUE (type_code);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: delinquencies delinquencies_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquencies
    ADD CONSTRAINT delinquencies_pkey PRIMARY KEY (id);


--
-- Name: delinquency_history delinquency_history_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquency_history
    ADD CONSTRAINT delinquency_history_pkey PRIMARY KEY (id);


--
-- Name: loan_accounts loan_accounts_loan_account_number_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts
    ADD CONSTRAINT loan_accounts_loan_account_number_key UNIQUE (loan_account_number);


--
-- Name: loan_accounts loan_accounts_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts
    ADD CONSTRAINT loan_accounts_pkey PRIMARY KEY (loan_account_id);


--
-- Name: loan_applications loan_applications_application_number_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications
    ADD CONSTRAINT loan_applications_application_number_key UNIQUE (application_number);


--
-- Name: loan_applications loan_applications_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications
    ADD CONSTRAINT loan_applications_pkey PRIMARY KEY (application_id);


--
-- Name: portfolio_summary portfolio_summary_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.portfolio_summary
    ADD CONSTRAINT portfolio_summary_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_category_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.product_categories
    ADD CONSTRAINT product_categories_category_code_key UNIQUE (category_code);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (category_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: realtime_notifications realtime_notifications_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.realtime_notifications
    ADD CONSTRAINT realtime_notifications_pkey PRIMARY KEY (id);


--
-- Name: transaction_types transaction_types_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transaction_types
    ADD CONSTRAINT transaction_types_pkey PRIMARY KEY (type_id);


--
-- Name: transaction_types transaction_types_type_code_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transaction_types
    ADD CONSTRAINT transaction_types_type_code_key UNIQUE (type_code);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: transactions transactions_transaction_ref_key; Type: CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_transaction_ref_key UNIQUE (transaction_ref);


--
-- Name: access_log access_log_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.access_log
    ADD CONSTRAINT access_log_pkey PRIMARY KEY (access_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (audit_id);


--
-- Name: collection_audit_trail collection_audit_trail_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_audit_trail
    ADD CONSTRAINT collection_audit_trail_pkey PRIMARY KEY (audit_id);


--
-- Name: collection_automation_metrics collection_automation_metrics_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_automation_metrics
    ADD CONSTRAINT collection_automation_metrics_pkey PRIMARY KEY (metric_id);


--
-- Name: collection_benchmarks collection_benchmarks_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_benchmarks
    ADD CONSTRAINT collection_benchmarks_pkey PRIMARY KEY (benchmark_id);


--
-- Name: collection_bucket_movement collection_bucket_movement_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement
    ADD CONSTRAINT collection_bucket_movement_pkey PRIMARY KEY (movement_id);


--
-- Name: collection_call_records collection_call_records_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_call_records
    ADD CONSTRAINT collection_call_records_pkey PRIMARY KEY (call_id);


--
-- Name: collection_campaigns collection_campaigns_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_campaigns
    ADD CONSTRAINT collection_campaigns_pkey PRIMARY KEY (campaign_id);


--
-- Name: collection_case_details collection_case_details_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_case_details
    ADD CONSTRAINT collection_case_details_pkey PRIMARY KEY (case_detail_id);


--
-- Name: collection_compliance_violations collection_compliance_violations_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_compliance_violations
    ADD CONSTRAINT collection_compliance_violations_pkey PRIMARY KEY (violation_id);


--
-- Name: collection_contact_attempts collection_contact_attempts_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_contact_attempts
    ADD CONSTRAINT collection_contact_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: collection_customer_segments collection_customer_segments_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_customer_segments
    ADD CONSTRAINT collection_customer_segments_pkey PRIMARY KEY (segment_id);


--
-- Name: collection_customer_segments collection_customer_segments_segment_code_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_customer_segments
    ADD CONSTRAINT collection_customer_segments_segment_code_key UNIQUE (segment_code);


--
-- Name: collection_forecasts collection_forecasts_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_forecasts
    ADD CONSTRAINT collection_forecasts_pkey PRIMARY KEY (forecast_id);


--
-- Name: collection_interactions collection_interactions_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_interactions
    ADD CONSTRAINT collection_interactions_pkey PRIMARY KEY (interaction_id);


--
-- Name: collection_officers collection_officers_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_officers
    ADD CONSTRAINT collection_officers_pkey PRIMARY KEY (officer_id);


--
-- Name: collection_provisions collection_provisions_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_provisions
    ADD CONSTRAINT collection_provisions_pkey PRIMARY KEY (provision_id);


--
-- Name: collection_queue_management collection_queue_management_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_queue_management
    ADD CONSTRAINT collection_queue_management_pkey PRIMARY KEY (queue_id);


--
-- Name: collection_risk_assessment collection_risk_assessment_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_risk_assessment
    ADD CONSTRAINT collection_risk_assessment_pkey PRIMARY KEY (assessment_id);


--
-- Name: collection_scores collection_scores_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_scores
    ADD CONSTRAINT collection_scores_pkey PRIMARY KEY (score_id);


--
-- Name: collection_settlement_offers collection_settlement_offers_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_settlement_offers
    ADD CONSTRAINT collection_settlement_offers_pkey PRIMARY KEY (offer_id);


--
-- Name: collection_strategies collection_strategies_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_strategies
    ADD CONSTRAINT collection_strategies_pkey PRIMARY KEY (strategy_id);


--
-- Name: collection_strategies collection_strategies_strategy_code_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_strategies
    ADD CONSTRAINT collection_strategies_strategy_code_key UNIQUE (strategy_code);


--
-- Name: collection_system_performance collection_system_performance_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_system_performance
    ADD CONSTRAINT collection_system_performance_pkey PRIMARY KEY (log_id);


--
-- Name: collection_teams collection_teams_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_teams
    ADD CONSTRAINT collection_teams_pkey PRIMARY KEY (team_id);


--
-- Name: collection_teams collection_teams_team_code_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_teams
    ADD CONSTRAINT collection_teams_team_code_key UNIQUE (team_code);


--
-- Name: collection_vintage_analysis collection_vintage_analysis_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_vintage_analysis
    ADD CONSTRAINT collection_vintage_analysis_pkey PRIMARY KEY (vintage_id);


--
-- Name: collection_workflow_templates collection_workflow_templates_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_workflow_templates
    ADD CONSTRAINT collection_workflow_templates_pkey PRIMARY KEY (template_id);


--
-- Name: collection_write_offs collection_write_offs_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_write_offs
    ADD CONSTRAINT collection_write_offs_pkey PRIMARY KEY (write_off_id);


--
-- Name: daily_collection_summary daily_collection_summary_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.daily_collection_summary
    ADD CONSTRAINT daily_collection_summary_pkey PRIMARY KEY (summary_id);


--
-- Name: data_masking_rules data_masking_rules_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.data_masking_rules
    ADD CONSTRAINT data_masking_rules_pkey PRIMARY KEY (rule_id);


--
-- Name: digital_collection_attempts digital_collection_attempts_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.digital_collection_attempts
    ADD CONSTRAINT digital_collection_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: field_visits field_visits_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.field_visits
    ADD CONSTRAINT field_visits_pkey PRIMARY KEY (visit_id);


--
-- Name: hardship_applications hardship_applications_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.hardship_applications
    ADD CONSTRAINT hardship_applications_pkey PRIMARY KEY (application_id);


--
-- Name: ivr_payment_attempts ivr_payment_attempts_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.ivr_payment_attempts
    ADD CONSTRAINT ivr_payment_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: legal_cases legal_cases_case_number_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.legal_cases
    ADD CONSTRAINT legal_cases_case_number_key UNIQUE (case_number);


--
-- Name: legal_cases legal_cases_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.legal_cases
    ADD CONSTRAINT legal_cases_pkey PRIMARY KEY (legal_case_id);


--
-- Name: loan_restructuring loan_restructuring_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.loan_restructuring
    ADD CONSTRAINT loan_restructuring_pkey PRIMARY KEY (restructure_id);


--
-- Name: officer_performance_metrics officer_performance_metrics_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_metrics
    ADD CONSTRAINT officer_performance_metrics_pkey PRIMARY KEY (metric_id);


--
-- Name: officer_performance_summary officer_performance_summary_officer_id_summary_date_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_summary
    ADD CONSTRAINT officer_performance_summary_officer_id_summary_date_key UNIQUE (officer_id, summary_date);


--
-- Name: officer_performance_summary officer_performance_summary_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_summary
    ADD CONSTRAINT officer_performance_summary_pkey PRIMARY KEY (summary_id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (metric_id);


--
-- Name: promise_to_pay promise_to_pay_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay
    ADD CONSTRAINT promise_to_pay_pkey PRIMARY KEY (ptp_id);


--
-- Name: repossessed_assets repossessed_assets_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.repossessed_assets
    ADD CONSTRAINT repossessed_assets_pkey PRIMARY KEY (asset_id);


--
-- Name: sharia_compliance_log sharia_compliance_log_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.sharia_compliance_log
    ADD CONSTRAINT sharia_compliance_log_pkey PRIMARY KEY (compliance_id);


--
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: collection_cases collection_cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_cases
    ADD CONSTRAINT collection_cases_case_number_key UNIQUE (case_number);


--
-- Name: collection_cases collection_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_cases
    ADD CONSTRAINT collection_cases_pkey PRIMARY KEY (case_id);


--
-- Name: collection_interactions collection_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_interactions
    ADD CONSTRAINT collection_interactions_pkey PRIMARY KEY (interaction_id);


--
-- Name: collection_officers collection_officers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_officers
    ADD CONSTRAINT collection_officers_pkey PRIMARY KEY (officer_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: officer_performance_summary officer_performance_summary_officer_id_summary_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officer_performance_summary
    ADD CONSTRAINT officer_performance_summary_officer_id_summary_date_key UNIQUE (officer_id, summary_date);


--
-- Name: officer_performance_summary officer_performance_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officer_performance_summary
    ADD CONSTRAINT officer_performance_summary_pkey PRIMARY KEY (summary_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: promise_to_pay promise_to_pay_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promise_to_pay
    ADD CONSTRAINT promise_to_pay_pkey PRIMARY KEY (ptp_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_23 messages_2025_07_23_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_07_23
    ADD CONSTRAINT messages_2025_07_23_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_24 messages_2025_07_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_07_24
    ADD CONSTRAINT messages_2025_07_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_25 messages_2025_07_25_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_07_25
    ADD CONSTRAINT messages_2025_07_25_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_26 messages_2025_07_26_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_07_26
    ADD CONSTRAINT messages_2025_07_26_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_07_27 messages_2025_07_27_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_07_27
    ADD CONSTRAINT messages_2025_07_27_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_accounts_customer_status; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_accounts_customer_status ON kastle_banking.accounts USING btree (customer_id, account_status);


--
-- Name: idx_audit_timestamp; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_audit_timestamp ON kastle_banking.audit_trail USING btree (action_timestamp);


--
-- Name: idx_auth_profiles_auth_user; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_auth_profiles_auth_user ON kastle_banking.auth_user_profiles USING btree (auth_user_id);


--
-- Name: idx_auth_profiles_customer; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_auth_profiles_customer ON kastle_banking.auth_user_profiles USING btree (customer_id);


--
-- Name: idx_collection_cases_assigned_to; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_collection_cases_assigned_to ON kastle_banking.collection_cases USING btree (assigned_to);


--
-- Name: idx_collection_rates_period_date; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_collection_rates_period_date ON kastle_banking.collection_rates USING btree (period_date);


--
-- Name: idx_customers_auth_user; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_customers_auth_user ON kastle_banking.customers USING btree (auth_user_id);


--
-- Name: idx_delinquencies_aging_bucket_id; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_delinquencies_aging_bucket_id ON kastle_banking.delinquencies USING btree (aging_bucket_id);


--
-- Name: idx_delinquencies_customer_id; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_delinquencies_customer_id ON kastle_banking.delinquencies USING btree (customer_id);


--
-- Name: idx_delinquencies_days_past_due; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_delinquencies_days_past_due ON kastle_banking.delinquencies USING btree (days_past_due);


--
-- Name: idx_delinquencies_loan_account_id; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_delinquencies_loan_account_id ON kastle_banking.delinquencies USING btree (loan_account_id);


--
-- Name: idx_delinquency_history_snapshot_date; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_delinquency_history_snapshot_date ON kastle_banking.delinquency_history USING btree (snapshot_date);


--
-- Name: idx_notifications_customer; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_notifications_customer ON kastle_banking.realtime_notifications USING btree (customer_id, created_at DESC);


--
-- Name: idx_portfolio_summary_snapshot_date; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_portfolio_summary_snapshot_date ON kastle_banking.portfolio_summary USING btree (snapshot_date);


--
-- Name: idx_transactions_account_date; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_transactions_account_date ON kastle_banking.transactions USING btree (account_number, transaction_date DESC);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: kastle_banking; Owner: postgres
--

CREATE INDEX idx_transactions_date ON kastle_banking.transactions USING btree (transaction_date DESC);


--
-- Name: idx_access_log_created; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_access_log_created ON kastle_collection.access_log USING btree (created_at);


--
-- Name: idx_access_log_user; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_access_log_user ON kastle_collection.access_log USING btree (user_id);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_audit_log_created ON kastle_collection.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_table_record; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_audit_log_table_record ON kastle_collection.audit_log USING btree (table_name, record_id);


--
-- Name: idx_audit_log_user; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_audit_log_user ON kastle_collection.audit_log USING btree (user_id);


--
-- Name: idx_automation_metrics_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_automation_metrics_date ON kastle_collection.collection_automation_metrics USING btree (metric_date);


--
-- Name: idx_benchmarks_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_benchmarks_date ON kastle_collection.collection_benchmarks USING btree (benchmark_date);


--
-- Name: idx_bucket_movement_case; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_bucket_movement_case ON kastle_collection.collection_bucket_movement USING btree (case_id);


--
-- Name: idx_bucket_movement_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_bucket_movement_date ON kastle_collection.collection_bucket_movement USING btree (movement_date);


--
-- Name: idx_collection_interactions_officer_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_collection_interactions_officer_date ON kastle_collection.collection_interactions USING btree (officer_id, interaction_datetime);


--
-- Name: idx_compliance_violations_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_compliance_violations_date ON kastle_collection.collection_compliance_violations USING btree (violation_date);


--
-- Name: idx_contact_attempts_case; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_contact_attempts_case ON kastle_collection.collection_contact_attempts USING btree (case_id);


--
-- Name: idx_daily_summary_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_daily_summary_date ON kastle_collection.daily_collection_summary USING btree (summary_date, branch_id);


--
-- Name: idx_digital_attempts_customer; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_digital_attempts_customer ON kastle_collection.digital_collection_attempts USING btree (customer_id, sent_datetime);


--
-- Name: idx_field_visits_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_field_visits_date ON kastle_collection.field_visits USING btree (visit_date, officer_id);


--
-- Name: idx_forecasts_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_forecasts_date ON kastle_collection.collection_forecasts USING btree (forecast_date);


--
-- Name: idx_interactions_case; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_interactions_case ON kastle_collection.collection_interactions USING btree (case_id);


--
-- Name: idx_interactions_customer_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_interactions_customer_date ON kastle_collection.collection_interactions USING btree (customer_id, interaction_datetime);


--
-- Name: idx_officer_metrics_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_officer_metrics_date ON kastle_collection.officer_performance_metrics USING btree (metric_date, officer_id);


--
-- Name: idx_performance_metrics_name_time; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_performance_metrics_name_time ON kastle_collection.performance_metrics USING btree (metric_name, metric_timestamp);


--
-- Name: idx_promise_to_pay_case_status; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_promise_to_pay_case_status ON kastle_collection.promise_to_pay USING btree (case_id, status);


--
-- Name: idx_provisions_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_provisions_date ON kastle_collection.collection_provisions USING btree (provision_date);


--
-- Name: idx_ptp_status_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_ptp_status_date ON kastle_collection.promise_to_pay USING btree (status, ptp_date);


--
-- Name: idx_queue_management_active; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_queue_management_active ON kastle_collection.collection_queue_management USING btree (is_active);


--
-- Name: idx_risk_assessment_customer; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_risk_assessment_customer ON kastle_collection.collection_risk_assessment USING btree (customer_id);


--
-- Name: idx_settlement_offers_case; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_settlement_offers_case ON kastle_collection.collection_settlement_offers USING btree (case_id);


--
-- Name: idx_vintage_month; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_vintage_month ON kastle_collection.collection_vintage_analysis USING btree (origination_month);


--
-- Name: idx_write_offs_date; Type: INDEX; Schema: kastle_collection; Owner: postgres
--

CREATE INDEX idx_write_offs_date ON kastle_collection.collection_write_offs USING btree (write_off_date);


--
-- Name: idx_collection_cases_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_cases_customer_id ON public.collection_cases USING btree (customer_id);


--
-- Name: idx_collection_cases_officer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_cases_officer_id ON public.collection_cases USING btree (officer_id);


--
-- Name: idx_collection_cases_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_cases_status ON public.collection_cases USING btree (loan_status);


--
-- Name: idx_collection_interactions_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_interactions_case_id ON public.collection_interactions USING btree (case_id);


--
-- Name: idx_collection_interactions_officer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collection_interactions_officer_id ON public.collection_interactions USING btree (officer_id);


--
-- Name: idx_payments_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_case_id ON public.payments USING btree (case_id);


--
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);


--
-- Name: idx_promise_to_pay_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promise_to_pay_case_id ON public.promise_to_pay USING btree (case_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: messages_2025_07_23_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_23_pkey;


--
-- Name: messages_2025_07_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_24_pkey;


--
-- Name: messages_2025_07_25_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_25_pkey;


--
-- Name: messages_2025_07_26_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_26_pkey;


--
-- Name: messages_2025_07_27_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_07_27_pkey;


--
-- Name: collection_cases generate_collection_case_number_trigger; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER generate_collection_case_number_trigger BEFORE INSERT ON kastle_banking.collection_cases FOR EACH ROW EXECUTE FUNCTION kastle_banking.generate_collection_case_number();


--
-- Name: loan_applications generate_loan_application_number_trigger; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER generate_loan_application_number_trigger BEFORE INSERT ON kastle_banking.loan_applications FOR EACH ROW EXECUTE FUNCTION kastle_banking.generate_loan_application_number();


--
-- Name: transactions generate_transaction_ref_trigger; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER generate_transaction_ref_trigger BEFORE INSERT ON kastle_banking.transactions FOR EACH ROW EXECUTE FUNCTION kastle_banking.generate_transaction_ref();


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON kastle_banking.accounts FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: auth_user_profiles update_auth_user_profiles_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_auth_user_profiles_updated_at BEFORE UPDATE ON kastle_banking.auth_user_profiles FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: bank_config update_bank_config_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_bank_config_updated_at BEFORE UPDATE ON kastle_banking.bank_config FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON kastle_banking.branches FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: collection_cases update_collection_cases_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_collection_cases_updated_at BEFORE UPDATE ON kastle_banking.collection_cases FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: countries update_countries_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON kastle_banking.countries FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: customer_addresses update_customer_addresses_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON kastle_banking.customer_addresses FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: customers update_customer_full_name_trigger; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_customer_full_name_trigger BEFORE INSERT OR UPDATE OF first_name, middle_name, last_name ON kastle_banking.customers FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_customer_full_name();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON kastle_banking.customers FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: loan_accounts update_loan_accounts_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_loan_accounts_updated_at BEFORE UPDATE ON kastle_banking.loan_accounts FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: loan_applications update_loan_applications_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON kastle_banking.loan_applications FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: kastle_banking; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON kastle_banking.products FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: accounts accounts_account_type_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_account_type_id_fkey FOREIGN KEY (account_type_id) REFERENCES kastle_banking.account_types(type_id);


--
-- Name: accounts accounts_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: accounts accounts_currency_code_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES kastle_banking.currencies(currency_code);


--
-- Name: accounts accounts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: accounts accounts_product_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.accounts
    ADD CONSTRAINT accounts_product_id_fkey FOREIGN KEY (product_id) REFERENCES kastle_banking.products(product_id);


--
-- Name: auth_user_profiles auth_user_profiles_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.auth_user_profiles
    ADD CONSTRAINT auth_user_profiles_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: branch_collection_performance branch_collection_performance_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.branch_collection_performance
    ADD CONSTRAINT branch_collection_performance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: branches branches_country_code_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.branches
    ADD CONSTRAINT branches_country_code_fkey FOREIGN KEY (country_code) REFERENCES kastle_banking.countries(country_code);


--
-- Name: collection_cases collection_cases_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases
    ADD CONSTRAINT collection_cases_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: collection_cases collection_cases_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases
    ADD CONSTRAINT collection_cases_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_cases collection_cases_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.collection_cases
    ADD CONSTRAINT collection_cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: customer_addresses customer_addresses_country_code_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_addresses
    ADD CONSTRAINT customer_addresses_country_code_fkey FOREIGN KEY (country_code) REFERENCES kastle_banking.countries(country_code);


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: customer_contacts customer_contacts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_contacts
    ADD CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: customer_documents customer_documents_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customer_documents
    ADD CONSTRAINT customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: customers customers_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customers
    ADD CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);


--
-- Name: customers customers_onboarding_branch_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.customers
    ADD CONSTRAINT customers_onboarding_branch_fkey FOREIGN KEY (onboarding_branch) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: delinquencies delinquencies_aging_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquencies
    ADD CONSTRAINT delinquencies_aging_bucket_id_fkey FOREIGN KEY (aging_bucket_id) REFERENCES kastle_banking.aging_buckets(id);


--
-- Name: delinquencies delinquencies_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquencies
    ADD CONSTRAINT delinquencies_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: delinquencies delinquencies_loan_account_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquencies
    ADD CONSTRAINT delinquencies_loan_account_id_fkey FOREIGN KEY (loan_account_id) REFERENCES kastle_banking.loan_accounts(loan_account_id);


--
-- Name: delinquency_history delinquency_history_aging_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquency_history
    ADD CONSTRAINT delinquency_history_aging_bucket_id_fkey FOREIGN KEY (aging_bucket_id) REFERENCES kastle_banking.aging_buckets(id);


--
-- Name: delinquency_history delinquency_history_delinquency_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.delinquency_history
    ADD CONSTRAINT delinquency_history_delinquency_id_fkey FOREIGN KEY (delinquency_id) REFERENCES kastle_banking.delinquencies(id);


--
-- Name: loan_accounts loan_accounts_application_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts
    ADD CONSTRAINT loan_accounts_application_id_fkey FOREIGN KEY (application_id) REFERENCES kastle_banking.loan_applications(application_id);


--
-- Name: loan_accounts loan_accounts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts
    ADD CONSTRAINT loan_accounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: loan_accounts loan_accounts_product_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_accounts
    ADD CONSTRAINT loan_accounts_product_id_fkey FOREIGN KEY (product_id) REFERENCES kastle_banking.products(product_id);


--
-- Name: loan_applications loan_applications_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications
    ADD CONSTRAINT loan_applications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: loan_applications loan_applications_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications
    ADD CONSTRAINT loan_applications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: loan_applications loan_applications_product_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.loan_applications
    ADD CONSTRAINT loan_applications_product_id_fkey FOREIGN KEY (product_id) REFERENCES kastle_banking.products(product_id);


--
-- Name: realtime_notifications realtime_notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.realtime_notifications
    ADD CONSTRAINT realtime_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: transactions transactions_account_number_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_account_number_fkey FOREIGN KEY (account_number) REFERENCES kastle_banking.accounts(account_number);


--
-- Name: transactions transactions_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: transactions transactions_currency_code_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES kastle_banking.currencies(currency_code);


--
-- Name: transactions transactions_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE ONLY kastle_banking.transactions
    ADD CONSTRAINT transactions_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES kastle_banking.transaction_types(type_id);


--
-- Name: collection_bucket_movement collection_bucket_movement_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement
    ADD CONSTRAINT collection_bucket_movement_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_bucket_movement collection_bucket_movement_from_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement
    ADD CONSTRAINT collection_bucket_movement_from_bucket_id_fkey FOREIGN KEY (from_bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_bucket_movement collection_bucket_movement_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement
    ADD CONSTRAINT collection_bucket_movement_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_bucket_movement collection_bucket_movement_to_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_bucket_movement
    ADD CONSTRAINT collection_bucket_movement_to_bucket_id_fkey FOREIGN KEY (to_bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_call_records collection_call_records_interaction_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_call_records
    ADD CONSTRAINT collection_call_records_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES kastle_collection.collection_interactions(interaction_id);


--
-- Name: collection_call_records collection_call_records_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_call_records
    ADD CONSTRAINT collection_call_records_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_campaigns collection_campaigns_target_bucket_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_campaigns
    ADD CONSTRAINT collection_campaigns_target_bucket_fkey FOREIGN KEY (target_bucket) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_case_details collection_case_details_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_case_details
    ADD CONSTRAINT collection_case_details_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_compliance_violations collection_compliance_violations_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_compliance_violations
    ADD CONSTRAINT collection_compliance_violations_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_compliance_violations collection_compliance_violations_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_compliance_violations
    ADD CONSTRAINT collection_compliance_violations_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_contact_attempts collection_contact_attempts_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_contact_attempts
    ADD CONSTRAINT collection_contact_attempts_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_contact_attempts collection_contact_attempts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_contact_attempts
    ADD CONSTRAINT collection_contact_attempts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: collection_contact_attempts collection_contact_attempts_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_contact_attempts
    ADD CONSTRAINT collection_contact_attempts_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_forecasts collection_forecasts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_forecasts
    ADD CONSTRAINT collection_forecasts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_forecasts collection_forecasts_product_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_forecasts
    ADD CONSTRAINT collection_forecasts_product_id_fkey FOREIGN KEY (product_id) REFERENCES kastle_banking.products(product_id);


--
-- Name: collection_interactions collection_interactions_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_interactions
    ADD CONSTRAINT collection_interactions_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_interactions collection_interactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_interactions
    ADD CONSTRAINT collection_interactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: collection_interactions collection_interactions_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_interactions
    ADD CONSTRAINT collection_interactions_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_officers collection_officers_team_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_officers
    ADD CONSTRAINT collection_officers_team_id_fkey FOREIGN KEY (team_id) REFERENCES kastle_collection.collection_teams(team_id);


--
-- Name: collection_provisions collection_provisions_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_provisions
    ADD CONSTRAINT collection_provisions_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_queue_management collection_queue_management_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_queue_management
    ADD CONSTRAINT collection_queue_management_officer_id_fkey FOREIGN KEY (assigned_officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: collection_queue_management collection_queue_management_team_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_queue_management
    ADD CONSTRAINT collection_queue_management_team_id_fkey FOREIGN KEY (assigned_team_id) REFERENCES kastle_collection.collection_teams(team_id);


--
-- Name: collection_risk_assessment collection_risk_assessment_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_risk_assessment
    ADD CONSTRAINT collection_risk_assessment_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_risk_assessment collection_risk_assessment_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_risk_assessment
    ADD CONSTRAINT collection_risk_assessment_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: collection_scores collection_scores_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_scores
    ADD CONSTRAINT collection_scores_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: collection_settlement_offers collection_settlement_offers_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_settlement_offers
    ADD CONSTRAINT collection_settlement_offers_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_settlement_offers collection_settlement_offers_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_settlement_offers
    ADD CONSTRAINT collection_settlement_offers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: collection_strategies collection_strategies_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_strategies
    ADD CONSTRAINT collection_strategies_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_teams collection_teams_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_teams
    ADD CONSTRAINT collection_teams_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: collection_vintage_analysis collection_vintage_analysis_product_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_vintage_analysis
    ADD CONSTRAINT collection_vintage_analysis_product_id_fkey FOREIGN KEY (product_id) REFERENCES kastle_banking.products(product_id);


--
-- Name: collection_workflow_templates collection_workflow_templates_bucket_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_workflow_templates
    ADD CONSTRAINT collection_workflow_templates_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);


--
-- Name: collection_write_offs collection_write_offs_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_write_offs
    ADD CONSTRAINT collection_write_offs_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: collection_write_offs collection_write_offs_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.collection_write_offs
    ADD CONSTRAINT collection_write_offs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: daily_collection_summary daily_collection_summary_branch_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.daily_collection_summary
    ADD CONSTRAINT daily_collection_summary_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);


--
-- Name: daily_collection_summary daily_collection_summary_team_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.daily_collection_summary
    ADD CONSTRAINT daily_collection_summary_team_id_fkey FOREIGN KEY (team_id) REFERENCES kastle_collection.collection_teams(team_id);


--
-- Name: digital_collection_attempts digital_collection_attempts_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.digital_collection_attempts
    ADD CONSTRAINT digital_collection_attempts_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: digital_collection_attempts digital_collection_attempts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.digital_collection_attempts
    ADD CONSTRAINT digital_collection_attempts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: field_visits field_visits_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.field_visits
    ADD CONSTRAINT field_visits_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: field_visits field_visits_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.field_visits
    ADD CONSTRAINT field_visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: field_visits field_visits_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.field_visits
    ADD CONSTRAINT field_visits_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: hardship_applications hardship_applications_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.hardship_applications
    ADD CONSTRAINT hardship_applications_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: hardship_applications hardship_applications_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.hardship_applications
    ADD CONSTRAINT hardship_applications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: ivr_payment_attempts ivr_payment_attempts_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.ivr_payment_attempts
    ADD CONSTRAINT ivr_payment_attempts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: legal_cases legal_cases_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.legal_cases
    ADD CONSTRAINT legal_cases_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: loan_restructuring loan_restructuring_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.loan_restructuring
    ADD CONSTRAINT loan_restructuring_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: officer_performance_metrics officer_performance_metrics_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_metrics
    ADD CONSTRAINT officer_performance_metrics_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: officer_performance_summary officer_performance_summary_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.officer_performance_summary
    ADD CONSTRAINT officer_performance_summary_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: promise_to_pay promise_to_pay_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay
    ADD CONSTRAINT promise_to_pay_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: promise_to_pay promise_to_pay_customer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay
    ADD CONSTRAINT promise_to_pay_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);


--
-- Name: promise_to_pay promise_to_pay_interaction_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay
    ADD CONSTRAINT promise_to_pay_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES kastle_collection.collection_interactions(interaction_id);


--
-- Name: promise_to_pay promise_to_pay_officer_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.promise_to_pay
    ADD CONSTRAINT promise_to_pay_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id);


--
-- Name: repossessed_assets repossessed_assets_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.repossessed_assets
    ADD CONSTRAINT repossessed_assets_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: sharia_compliance_log sharia_compliance_log_case_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.sharia_compliance_log
    ADD CONSTRAINT sharia_compliance_log_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);


--
-- Name: user_role_assignments user_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: kastle_collection; Owner: postgres
--

ALTER TABLE ONLY kastle_collection.user_role_assignments
    ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES kastle_collection.user_roles(role_id);


--
-- Name: collection_cases collection_cases_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_cases
    ADD CONSTRAINT collection_cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: collection_cases collection_cases_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_cases
    ADD CONSTRAINT collection_cases_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.collection_officers(officer_id);


--
-- Name: collection_interactions collection_interactions_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_interactions
    ADD CONSTRAINT collection_interactions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.collection_cases(case_id);


--
-- Name: collection_interactions collection_interactions_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collection_interactions
    ADD CONSTRAINT collection_interactions_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.collection_officers(officer_id);


--
-- Name: payments payments_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.collection_cases(case_id);


--
-- Name: promise_to_pay promise_to_pay_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promise_to_pay
    ADD CONSTRAINT promise_to_pay_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.collection_cases(case_id);


--
-- Name: promise_to_pay promise_to_pay_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promise_to_pay
    ADD CONSTRAINT promise_to_pay_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public.collection_officers(officer_id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: accounts Account holders can view own accounts; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Account holders can view own accounts" ON kastle_banking.accounts FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: transactions Account holders can view own transactions; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Account holders can view own transactions" ON kastle_banking.transactions FOR SELECT USING (((account_number)::text IN ( SELECT accounts.account_number
   FROM kastle_banking.accounts
  WHERE ((accounts.customer_id)::text IN ( SELECT auth_user_profiles.customer_id
           FROM kastle_banking.auth_user_profiles
          WHERE (auth_user_profiles.auth_user_id = auth.uid()))))));


--
-- Name: account_types Account types are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Account types are viewable by everyone" ON kastle_banking.account_types FOR SELECT USING (true);


--
-- Name: branches Branches are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Branches are viewable by everyone" ON kastle_banking.branches FOR SELECT USING (true);


--
-- Name: collection_cases Collection officers can view assigned cases; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Collection officers can view assigned cases" ON kastle_banking.collection_cases FOR SELECT USING ((kastle_banking.is_bank_employee() OR ((assigned_to)::text IN ( SELECT auth_user_profiles.bank_user_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid())))));


--
-- Name: countries Countries are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Countries are viewable by everyone" ON kastle_banking.countries FOR SELECT USING (true);


--
-- Name: currencies Currencies are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Currencies are viewable by everyone" ON kastle_banking.currencies FOR SELECT USING (true);


--
-- Name: customer_types Customer types are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customer types are viewable by everyone" ON kastle_banking.customer_types FOR SELECT USING (true);


--
-- Name: customer_contacts Customers can update own contacts; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can update own contacts" ON kastle_banking.customer_contacts FOR UPDATE USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: realtime_notifications Customers can update own notifications; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can update own notifications" ON kastle_banking.realtime_notifications FOR UPDATE USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid())))) WITH CHECK (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: customer_addresses Customers can view own addresses; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own addresses" ON kastle_banking.customer_addresses FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: collection_cases Customers can view own collection cases; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own collection cases" ON kastle_banking.collection_cases FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: customer_contacts Customers can view own contacts; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own contacts" ON kastle_banking.customer_contacts FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: customers Customers can view own data; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own data" ON kastle_banking.customers FOR SELECT USING ((auth.uid() IN ( SELECT auth_user_profiles.auth_user_id
   FROM kastle_banking.auth_user_profiles
  WHERE ((auth_user_profiles.customer_id)::text = (customers.customer_id)::text))));


--
-- Name: customer_documents Customers can view own documents; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own documents" ON kastle_banking.customer_documents FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: loan_accounts Customers can view own loan accounts; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own loan accounts" ON kastle_banking.loan_accounts FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: loan_applications Customers can view own loan applications; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own loan applications" ON kastle_banking.loan_applications FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: realtime_notifications Customers can view own notifications; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Customers can view own notifications" ON kastle_banking.realtime_notifications FOR SELECT USING (((customer_id)::text IN ( SELECT auth_user_profiles.customer_id
   FROM kastle_banking.auth_user_profiles
  WHERE (auth_user_profiles.auth_user_id = auth.uid()))));


--
-- Name: transactions Employees can create transactions; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can create transactions" ON kastle_banking.transactions FOR INSERT WITH CHECK (kastle_banking.is_bank_employee());


--
-- Name: customers Employees can update customers; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can update customers" ON kastle_banking.customers FOR UPDATE USING (kastle_banking.is_bank_employee());


--
-- Name: accounts Employees can view all accounts; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can view all accounts" ON kastle_banking.accounts FOR SELECT USING (kastle_banking.is_bank_employee());


--
-- Name: customers Employees can view all customers; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can view all customers" ON kastle_banking.customers FOR SELECT USING (kastle_banking.is_bank_employee());


--
-- Name: loan_applications Employees can view all loan applications; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can view all loan applications" ON kastle_banking.loan_applications FOR SELECT USING (kastle_banking.is_bank_employee());


--
-- Name: transactions Employees can view all transactions; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Employees can view all transactions" ON kastle_banking.transactions FOR SELECT USING (kastle_banking.is_bank_employee());


--
-- Name: product_categories Product categories are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Product categories are viewable by everyone" ON kastle_banking.product_categories FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Products are viewable by everyone" ON kastle_banking.products FOR SELECT USING (true);


--
-- Name: transaction_types Transaction types are viewable by everyone; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Transaction types are viewable by everyone" ON kastle_banking.transaction_types FOR SELECT USING (true);


--
-- Name: auth_user_profiles Users can update own profile; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON kastle_banking.auth_user_profiles FOR UPDATE USING ((auth_user_id = auth.uid()));


--
-- Name: auth_user_profiles Users can view own profile; Type: POLICY; Schema: kastle_banking; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON kastle_banking.auth_user_profiles FOR SELECT USING ((auth_user_id = auth.uid()));


--
-- Name: account_types; Type: ROW SECURITY; Schema: kastle_banking; Owner: postgres
--

ALTER TABLE kastle_banking.account_types ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA kastle_banking; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA kastle_banking TO authenticated;
GRANT USAGE ON SCHEMA kastle_banking TO service_role;
GRANT USAGE ON SCHEMA kastle_banking TO anon;
GRANT USAGE ON SCHEMA kastle_banking TO collection_read;
GRANT USAGE ON SCHEMA kastle_banking TO collection_write;
GRANT USAGE ON SCHEMA kastle_banking TO collection_admin;


--
-- Name: SCHEMA kastle_collection; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA kastle_collection TO collection_read;
GRANT USAGE ON SCHEMA kastle_collection TO collection_write;
GRANT USAGE ON SCHEMA kastle_collection TO collection_admin;
GRANT USAGE ON SCHEMA kastle_collection TO anon;
GRANT USAGE ON SCHEMA kastle_collection TO authenticated;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;
GRANT ALL ON FUNCTION auth.email() TO postgres;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;
GRANT ALL ON FUNCTION auth.role() TO postgres;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;
GRANT ALL ON FUNCTION auth.uid() TO postgres;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION check_data_lengths(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.check_data_lengths() TO anon;
GRANT ALL ON FUNCTION kastle_banking.check_data_lengths() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.check_data_lengths() TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.transactions TO anon;
GRANT ALL ON TABLE kastle_banking.transactions TO authenticated;
GRANT ALL ON TABLE kastle_banking.transactions TO service_role;
GRANT SELECT ON TABLE kastle_banking.transactions TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.transactions TO collection_write;
GRANT ALL ON TABLE kastle_banking.transactions TO collection_admin;


--
-- Name: FUNCTION create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying) TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying) TO anon;
GRANT ALL ON FUNCTION kastle_banking.create_transaction_with_balance_update(p_account_number character varying, p_transaction_type_id integer, p_debit_credit character varying, p_amount numeric, p_narration text, p_channel character varying) TO service_role;


--
-- Name: FUNCTION generate_collection_case_number(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.generate_collection_case_number() TO anon;
GRANT ALL ON FUNCTION kastle_banking.generate_collection_case_number() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.generate_collection_case_number() TO service_role;


--
-- Name: FUNCTION generate_loan_application_number(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.generate_loan_application_number() TO anon;
GRANT ALL ON FUNCTION kastle_banking.generate_loan_application_number() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.generate_loan_application_number() TO service_role;


--
-- Name: FUNCTION generate_transaction_ref(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.generate_transaction_ref() TO anon;
GRANT ALL ON FUNCTION kastle_banking.generate_transaction_ref() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.generate_transaction_ref() TO service_role;


--
-- Name: FUNCTION get_current_customer_id(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.get_current_customer_id() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.get_current_customer_id() TO anon;
GRANT ALL ON FUNCTION kastle_banking.get_current_customer_id() TO service_role;


--
-- Name: FUNCTION get_customer_total_balance(p_customer_id character varying); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.get_customer_total_balance(p_customer_id character varying) TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.get_customer_total_balance(p_customer_id character varying) TO anon;
GRANT ALL ON FUNCTION kastle_banking.get_customer_total_balance(p_customer_id character varying) TO service_role;


--
-- Name: FUNCTION is_bank_employee(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.is_bank_employee() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.is_bank_employee() TO anon;
GRANT ALL ON FUNCTION kastle_banking.is_bank_employee() TO service_role;


--
-- Name: FUNCTION update_customer_full_name(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.update_customer_full_name() TO anon;
GRANT ALL ON FUNCTION kastle_banking.update_customer_full_name() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.update_customer_full_name() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON FUNCTION kastle_banking.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION kastle_banking.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION kastle_banking.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION update_officer_performance_summary(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_officer_performance_summary() TO anon;
GRANT ALL ON FUNCTION public.update_officer_performance_summary() TO authenticated;
GRANT ALL ON FUNCTION public.update_officer_performance_summary() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION can_insert_object(bucketid text, name text, owner uuid, metadata jsonb); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) TO postgres;


--
-- Name: FUNCTION extension(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.extension(name text) TO postgres;


--
-- Name: FUNCTION filename(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.filename(name text) TO postgres;


--
-- Name: FUNCTION foldername(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.foldername(name text) TO postgres;


--
-- Name: FUNCTION get_size_by_bucket(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.get_size_by_bucket() TO postgres;


--
-- Name: FUNCTION list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) TO postgres;


--
-- Name: FUNCTION list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) TO postgres;


--
-- Name: FUNCTION operation(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.operation() TO postgres;


--
-- Name: FUNCTION search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) TO postgres;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.update_updated_at_column() TO postgres;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;
SET SESSION AUTHORIZATION postgres;
GRANT SELECT ON TABLE auth.users TO anon;
RESET SESSION AUTHORIZATION;
SET SESSION AUTHORIZATION postgres;
GRANT SELECT ON TABLE auth.users TO authenticated;
RESET SESSION AUTHORIZATION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE account_types; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.account_types TO anon;
GRANT ALL ON TABLE kastle_banking.account_types TO authenticated;
GRANT ALL ON TABLE kastle_banking.account_types TO service_role;
GRANT SELECT ON TABLE kastle_banking.account_types TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.account_types TO collection_write;
GRANT ALL ON TABLE kastle_banking.account_types TO collection_admin;


--
-- Name: SEQUENCE account_types_type_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.account_types_type_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.account_types_type_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.account_types_type_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.account_types_type_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.account_types_type_id_seq TO collection_admin;


--
-- Name: TABLE accounts; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.accounts TO anon;
GRANT ALL ON TABLE kastle_banking.accounts TO authenticated;
GRANT ALL ON TABLE kastle_banking.accounts TO service_role;
GRANT SELECT ON TABLE kastle_banking.accounts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.accounts TO collection_write;
GRANT ALL ON TABLE kastle_banking.accounts TO collection_admin;


--
-- Name: SEQUENCE accounts_account_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.accounts_account_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.accounts_account_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.accounts_account_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.accounts_account_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.accounts_account_id_seq TO collection_admin;


--
-- Name: TABLE aging_buckets; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.aging_buckets TO anon;
GRANT SELECT ON TABLE kastle_banking.aging_buckets TO authenticated;


--
-- Name: SEQUENCE aging_buckets_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.aging_buckets_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.aging_buckets_id_seq TO authenticated;


--
-- Name: TABLE delinquencies; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.delinquencies TO anon;
GRANT SELECT ON TABLE kastle_banking.delinquencies TO authenticated;


--
-- Name: TABLE aging_distribution; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.aging_distribution TO anon;
GRANT SELECT ON TABLE kastle_banking.aging_distribution TO authenticated;


--
-- Name: TABLE audit_trail; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.audit_trail TO anon;
GRANT ALL ON TABLE kastle_banking.audit_trail TO authenticated;
GRANT ALL ON TABLE kastle_banking.audit_trail TO service_role;
GRANT SELECT ON TABLE kastle_banking.audit_trail TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.audit_trail TO collection_write;
GRANT ALL ON TABLE kastle_banking.audit_trail TO collection_admin;


--
-- Name: SEQUENCE audit_trail_audit_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.audit_trail_audit_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.audit_trail_audit_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.audit_trail_audit_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.audit_trail_audit_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.audit_trail_audit_id_seq TO collection_admin;


--
-- Name: TABLE auth_user_profiles; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.auth_user_profiles TO anon;
GRANT ALL ON TABLE kastle_banking.auth_user_profiles TO authenticated;
GRANT ALL ON TABLE kastle_banking.auth_user_profiles TO service_role;
GRANT SELECT ON TABLE kastle_banking.auth_user_profiles TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.auth_user_profiles TO collection_write;
GRANT ALL ON TABLE kastle_banking.auth_user_profiles TO collection_admin;


--
-- Name: TABLE bank_config; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.bank_config TO anon;
GRANT ALL ON TABLE kastle_banking.bank_config TO authenticated;
GRANT ALL ON TABLE kastle_banking.bank_config TO service_role;
GRANT SELECT ON TABLE kastle_banking.bank_config TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.bank_config TO collection_write;
GRANT ALL ON TABLE kastle_banking.bank_config TO collection_admin;


--
-- Name: SEQUENCE bank_config_config_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.bank_config_config_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.bank_config_config_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.bank_config_config_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.bank_config_config_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.bank_config_config_id_seq TO collection_admin;


--
-- Name: TABLE branch_collection_performance; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.branch_collection_performance TO anon;
GRANT SELECT ON TABLE kastle_banking.branch_collection_performance TO authenticated;


--
-- Name: SEQUENCE branch_collection_performance_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.branch_collection_performance_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.branch_collection_performance_id_seq TO authenticated;


--
-- Name: TABLE branches; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.branches TO anon;
GRANT ALL ON TABLE kastle_banking.branches TO authenticated;
GRANT ALL ON TABLE kastle_banking.branches TO service_role;
GRANT SELECT ON TABLE kastle_banking.branches TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.branches TO collection_write;
GRANT ALL ON TABLE kastle_banking.branches TO collection_admin;


--
-- Name: TABLE collection_buckets; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.collection_buckets TO anon;
GRANT ALL ON TABLE kastle_banking.collection_buckets TO authenticated;
GRANT ALL ON TABLE kastle_banking.collection_buckets TO service_role;
GRANT SELECT ON TABLE kastle_banking.collection_buckets TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.collection_buckets TO collection_write;
GRANT ALL ON TABLE kastle_banking.collection_buckets TO collection_admin;


--
-- Name: SEQUENCE collection_buckets_bucket_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.collection_buckets_bucket_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.collection_buckets_bucket_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.collection_buckets_bucket_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.collection_buckets_bucket_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.collection_buckets_bucket_id_seq TO collection_admin;


--
-- Name: TABLE collection_cases; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.collection_cases TO anon;
GRANT ALL ON TABLE kastle_banking.collection_cases TO authenticated;
GRANT ALL ON TABLE kastle_banking.collection_cases TO service_role;
GRANT SELECT ON TABLE kastle_banking.collection_cases TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.collection_cases TO collection_write;
GRANT ALL ON TABLE kastle_banking.collection_cases TO collection_admin;


--
-- Name: SEQUENCE collection_cases_case_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.collection_cases_case_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.collection_cases_case_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.collection_cases_case_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.collection_cases_case_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.collection_cases_case_id_seq TO collection_admin;


--
-- Name: TABLE collection_rates; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.collection_rates TO anon;
GRANT SELECT ON TABLE kastle_banking.collection_rates TO authenticated;


--
-- Name: SEQUENCE collection_rates_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.collection_rates_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.collection_rates_id_seq TO authenticated;


--
-- Name: TABLE countries; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.countries TO anon;
GRANT ALL ON TABLE kastle_banking.countries TO authenticated;
GRANT ALL ON TABLE kastle_banking.countries TO service_role;
GRANT SELECT ON TABLE kastle_banking.countries TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.countries TO collection_write;
GRANT ALL ON TABLE kastle_banking.countries TO collection_admin;


--
-- Name: TABLE currencies; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.currencies TO anon;
GRANT ALL ON TABLE kastle_banking.currencies TO authenticated;
GRANT ALL ON TABLE kastle_banking.currencies TO service_role;
GRANT SELECT ON TABLE kastle_banking.currencies TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.currencies TO collection_write;
GRANT ALL ON TABLE kastle_banking.currencies TO collection_admin;


--
-- Name: TABLE customer_addresses; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.customer_addresses TO anon;
GRANT ALL ON TABLE kastle_banking.customer_addresses TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_addresses TO service_role;
GRANT SELECT ON TABLE kastle_banking.customer_addresses TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.customer_addresses TO collection_write;
GRANT ALL ON TABLE kastle_banking.customer_addresses TO collection_admin;


--
-- Name: SEQUENCE customer_addresses_address_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.customer_addresses_address_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.customer_addresses_address_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.customer_addresses_address_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.customer_addresses_address_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.customer_addresses_address_id_seq TO collection_admin;


--
-- Name: TABLE customer_contacts; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.customer_contacts TO anon;
GRANT ALL ON TABLE kastle_banking.customer_contacts TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_contacts TO service_role;
GRANT SELECT ON TABLE kastle_banking.customer_contacts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.customer_contacts TO collection_write;
GRANT ALL ON TABLE kastle_banking.customer_contacts TO collection_admin;


--
-- Name: SEQUENCE customer_contacts_contact_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.customer_contacts_contact_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.customer_contacts_contact_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.customer_contacts_contact_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.customer_contacts_contact_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.customer_contacts_contact_id_seq TO collection_admin;


--
-- Name: TABLE customer_documents; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.customer_documents TO anon;
GRANT ALL ON TABLE kastle_banking.customer_documents TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_documents TO service_role;
GRANT SELECT ON TABLE kastle_banking.customer_documents TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.customer_documents TO collection_write;
GRANT ALL ON TABLE kastle_banking.customer_documents TO collection_admin;


--
-- Name: SEQUENCE customer_documents_document_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.customer_documents_document_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.customer_documents_document_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.customer_documents_document_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.customer_documents_document_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.customer_documents_document_id_seq TO collection_admin;


--
-- Name: TABLE customer_types; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.customer_types TO anon;
GRANT ALL ON TABLE kastle_banking.customer_types TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_types TO service_role;
GRANT SELECT ON TABLE kastle_banking.customer_types TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.customer_types TO collection_write;
GRANT ALL ON TABLE kastle_banking.customer_types TO collection_admin;


--
-- Name: SEQUENCE customer_types_type_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.customer_types_type_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.customer_types_type_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.customer_types_type_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.customer_types_type_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.customer_types_type_id_seq TO collection_admin;


--
-- Name: TABLE customers; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.customers TO anon;
GRANT ALL ON TABLE kastle_banking.customers TO authenticated;
GRANT ALL ON TABLE kastle_banking.customers TO service_role;
GRANT SELECT ON TABLE kastle_banking.customers TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.customers TO collection_write;
GRANT ALL ON TABLE kastle_banking.customers TO collection_admin;


--
-- Name: SEQUENCE delinquencies_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.delinquencies_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.delinquencies_id_seq TO authenticated;


--
-- Name: TABLE delinquency_history; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.delinquency_history TO anon;
GRANT SELECT ON TABLE kastle_banking.delinquency_history TO authenticated;


--
-- Name: SEQUENCE delinquency_history_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.delinquency_history_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.delinquency_history_id_seq TO authenticated;


--
-- Name: TABLE portfolio_summary; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.portfolio_summary TO anon;
GRANT SELECT ON TABLE kastle_banking.portfolio_summary TO authenticated;


--
-- Name: TABLE executive_delinquency_summary; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.executive_delinquency_summary TO anon;
GRANT SELECT ON TABLE kastle_banking.executive_delinquency_summary TO authenticated;


--
-- Name: TABLE loan_accounts; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.loan_accounts TO anon;
GRANT ALL ON TABLE kastle_banking.loan_accounts TO authenticated;
GRANT ALL ON TABLE kastle_banking.loan_accounts TO service_role;
GRANT SELECT ON TABLE kastle_banking.loan_accounts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.loan_accounts TO collection_write;
GRANT ALL ON TABLE kastle_banking.loan_accounts TO collection_admin;


--
-- Name: SEQUENCE loan_accounts_loan_account_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.loan_accounts_loan_account_id_seq TO collection_admin;


--
-- Name: TABLE loan_applications; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.loan_applications TO anon;
GRANT ALL ON TABLE kastle_banking.loan_applications TO authenticated;
GRANT ALL ON TABLE kastle_banking.loan_applications TO service_role;
GRANT SELECT ON TABLE kastle_banking.loan_applications TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.loan_applications TO collection_write;
GRANT ALL ON TABLE kastle_banking.loan_applications TO collection_admin;


--
-- Name: SEQUENCE loan_applications_application_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.loan_applications_application_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.loan_applications_application_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.loan_applications_application_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.loan_applications_application_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.loan_applications_application_id_seq TO collection_admin;


--
-- Name: SEQUENCE portfolio_summary_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON SEQUENCE kastle_banking.portfolio_summary_id_seq TO anon;
GRANT SELECT ON SEQUENCE kastle_banking.portfolio_summary_id_seq TO authenticated;


--
-- Name: TABLE product_categories; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.product_categories TO anon;
GRANT ALL ON TABLE kastle_banking.product_categories TO authenticated;
GRANT ALL ON TABLE kastle_banking.product_categories TO service_role;
GRANT SELECT ON TABLE kastle_banking.product_categories TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.product_categories TO collection_write;
GRANT ALL ON TABLE kastle_banking.product_categories TO collection_admin;


--
-- Name: SEQUENCE product_categories_category_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.product_categories_category_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.product_categories_category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.product_categories_category_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.product_categories_category_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.product_categories_category_id_seq TO collection_admin;


--
-- Name: TABLE products; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.products TO anon;
GRANT ALL ON TABLE kastle_banking.products TO authenticated;
GRANT ALL ON TABLE kastle_banking.products TO service_role;
GRANT SELECT ON TABLE kastle_banking.products TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.products TO collection_write;
GRANT ALL ON TABLE kastle_banking.products TO collection_admin;


--
-- Name: SEQUENCE products_product_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.products_product_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.products_product_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.products_product_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.products_product_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.products_product_id_seq TO collection_admin;


--
-- Name: TABLE realtime_notifications; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.realtime_notifications TO anon;
GRANT ALL ON TABLE kastle_banking.realtime_notifications TO authenticated;
GRANT ALL ON TABLE kastle_banking.realtime_notifications TO service_role;
GRANT SELECT ON TABLE kastle_banking.realtime_notifications TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.realtime_notifications TO collection_write;
GRANT ALL ON TABLE kastle_banking.realtime_notifications TO collection_admin;


--
-- Name: TABLE top_delinquent_customers; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT SELECT ON TABLE kastle_banking.top_delinquent_customers TO anon;
GRANT SELECT ON TABLE kastle_banking.top_delinquent_customers TO authenticated;


--
-- Name: TABLE transaction_types; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.transaction_types TO anon;
GRANT ALL ON TABLE kastle_banking.transaction_types TO authenticated;
GRANT ALL ON TABLE kastle_banking.transaction_types TO service_role;
GRANT SELECT ON TABLE kastle_banking.transaction_types TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.transaction_types TO collection_write;
GRANT ALL ON TABLE kastle_banking.transaction_types TO collection_admin;


--
-- Name: SEQUENCE transaction_types_type_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.transaction_types_type_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.transaction_types_type_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.transaction_types_type_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.transaction_types_type_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.transaction_types_type_id_seq TO collection_admin;


--
-- Name: SEQUENCE transactions_transaction_id_seq; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON SEQUENCE kastle_banking.transactions_transaction_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_banking.transactions_transaction_id_seq TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.transactions_transaction_id_seq TO service_role;
GRANT USAGE ON SEQUENCE kastle_banking.transactions_transaction_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_banking.transactions_transaction_id_seq TO collection_admin;


--
-- Name: TABLE vw_customer_dashboard; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.vw_customer_dashboard TO authenticated;
GRANT ALL ON TABLE kastle_banking.vw_customer_dashboard TO anon;
GRANT ALL ON TABLE kastle_banking.vw_customer_dashboard TO service_role;
GRANT SELECT ON TABLE kastle_banking.vw_customer_dashboard TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.vw_customer_dashboard TO collection_write;
GRANT ALL ON TABLE kastle_banking.vw_customer_dashboard TO collection_admin;


--
-- Name: TABLE vw_recent_transactions; Type: ACL; Schema: kastle_banking; Owner: postgres
--

GRANT ALL ON TABLE kastle_banking.vw_recent_transactions TO authenticated;
GRANT ALL ON TABLE kastle_banking.vw_recent_transactions TO anon;
GRANT ALL ON TABLE kastle_banking.vw_recent_transactions TO service_role;
GRANT SELECT ON TABLE kastle_banking.vw_recent_transactions TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_banking.vw_recent_transactions TO collection_write;
GRANT ALL ON TABLE kastle_banking.vw_recent_transactions TO collection_admin;


--
-- Name: TABLE access_log; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.access_log TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.access_log TO collection_write;
GRANT ALL ON TABLE kastle_collection.access_log TO collection_admin;
GRANT ALL ON TABLE kastle_collection.access_log TO anon;
GRANT ALL ON TABLE kastle_collection.access_log TO authenticated;


--
-- Name: SEQUENCE access_log_access_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.access_log_access_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.access_log_access_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.access_log_access_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.access_log_access_id_seq TO authenticated;


--
-- Name: TABLE audit_log; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.audit_log TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.audit_log TO collection_write;
GRANT ALL ON TABLE kastle_collection.audit_log TO collection_admin;
GRANT ALL ON TABLE kastle_collection.audit_log TO anon;
GRANT ALL ON TABLE kastle_collection.audit_log TO authenticated;


--
-- Name: SEQUENCE audit_log_audit_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.audit_log_audit_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.audit_log_audit_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.audit_log_audit_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.audit_log_audit_id_seq TO authenticated;


--
-- Name: TABLE collection_audit_trail; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_audit_trail TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_audit_trail TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_audit_trail TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_audit_trail TO anon;
GRANT ALL ON TABLE kastle_collection.collection_audit_trail TO authenticated;


--
-- Name: SEQUENCE collection_audit_trail_audit_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_audit_trail_audit_id_seq TO authenticated;


--
-- Name: TABLE collection_automation_metrics; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_automation_metrics TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_automation_metrics TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_automation_metrics TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_automation_metrics TO anon;
GRANT ALL ON TABLE kastle_collection.collection_automation_metrics TO authenticated;


--
-- Name: SEQUENCE collection_automation_metrics_metric_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_automation_metrics_metric_id_seq TO authenticated;


--
-- Name: TABLE collection_benchmarks; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_benchmarks TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_benchmarks TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_benchmarks TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_benchmarks TO anon;
GRANT ALL ON TABLE kastle_collection.collection_benchmarks TO authenticated;


--
-- Name: SEQUENCE collection_benchmarks_benchmark_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_benchmarks_benchmark_id_seq TO authenticated;


--
-- Name: TABLE collection_bucket_movement; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_bucket_movement TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_bucket_movement TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_bucket_movement TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_bucket_movement TO anon;
GRANT ALL ON TABLE kastle_collection.collection_bucket_movement TO authenticated;


--
-- Name: SEQUENCE collection_bucket_movement_movement_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_bucket_movement_movement_id_seq TO authenticated;


--
-- Name: TABLE collection_call_records; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_call_records TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_call_records TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_call_records TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_call_records TO anon;
GRANT ALL ON TABLE kastle_collection.collection_call_records TO authenticated;


--
-- Name: SEQUENCE collection_call_records_call_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_call_records_call_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_call_records_call_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_call_records_call_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_call_records_call_id_seq TO authenticated;


--
-- Name: TABLE collection_campaigns; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_campaigns TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_campaigns TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_campaigns TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_campaigns TO anon;
GRANT ALL ON TABLE kastle_collection.collection_campaigns TO authenticated;


--
-- Name: SEQUENCE collection_campaigns_campaign_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_campaigns_campaign_id_seq TO authenticated;


--
-- Name: TABLE collection_case_details; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_case_details TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_case_details TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_case_details TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_case_details TO anon;
GRANT ALL ON TABLE kastle_collection.collection_case_details TO authenticated;


--
-- Name: SEQUENCE collection_case_details_case_detail_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_case_details_case_detail_id_seq TO authenticated;


--
-- Name: TABLE collection_compliance_violations; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_compliance_violations TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_compliance_violations TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_compliance_violations TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_compliance_violations TO anon;
GRANT ALL ON TABLE kastle_collection.collection_compliance_violations TO authenticated;


--
-- Name: SEQUENCE collection_compliance_violations_violation_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_compliance_violations_violation_id_seq TO authenticated;


--
-- Name: TABLE collection_contact_attempts; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_contact_attempts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_contact_attempts TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_contact_attempts TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_contact_attempts TO anon;
GRANT ALL ON TABLE kastle_collection.collection_contact_attempts TO authenticated;


--
-- Name: SEQUENCE collection_contact_attempts_attempt_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_contact_attempts_attempt_id_seq TO authenticated;


--
-- Name: TABLE collection_customer_segments; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_customer_segments TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_customer_segments TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_customer_segments TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_customer_segments TO anon;
GRANT ALL ON TABLE kastle_collection.collection_customer_segments TO authenticated;


--
-- Name: SEQUENCE collection_customer_segments_segment_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_customer_segments_segment_id_seq TO authenticated;


--
-- Name: TABLE collection_forecasts; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_forecasts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_forecasts TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_forecasts TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_forecasts TO anon;
GRANT ALL ON TABLE kastle_collection.collection_forecasts TO authenticated;


--
-- Name: SEQUENCE collection_forecasts_forecast_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_forecasts_forecast_id_seq TO authenticated;


--
-- Name: TABLE collection_interactions; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_interactions TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_interactions TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_interactions TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_interactions TO anon;
GRANT ALL ON TABLE kastle_collection.collection_interactions TO authenticated;


--
-- Name: SEQUENCE collection_interactions_interaction_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_interactions_interaction_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_interactions_interaction_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_interactions_interaction_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_interactions_interaction_id_seq TO authenticated;


--
-- Name: TABLE collection_officers; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_officers TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_officers TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_officers TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_officers TO anon;
GRANT ALL ON TABLE kastle_collection.collection_officers TO authenticated;


--
-- Name: TABLE collection_provisions; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_provisions TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_provisions TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_provisions TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_provisions TO anon;
GRANT ALL ON TABLE kastle_collection.collection_provisions TO authenticated;


--
-- Name: SEQUENCE collection_provisions_provision_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_provisions_provision_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_provisions_provision_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_provisions_provision_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_provisions_provision_id_seq TO authenticated;


--
-- Name: TABLE collection_queue_management; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_queue_management TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_queue_management TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_queue_management TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_queue_management TO anon;
GRANT ALL ON TABLE kastle_collection.collection_queue_management TO authenticated;


--
-- Name: SEQUENCE collection_queue_management_queue_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_queue_management_queue_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_queue_management_queue_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_queue_management_queue_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_queue_management_queue_id_seq TO authenticated;


--
-- Name: TABLE collection_risk_assessment; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_risk_assessment TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_risk_assessment TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_risk_assessment TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_risk_assessment TO anon;
GRANT ALL ON TABLE kastle_collection.collection_risk_assessment TO authenticated;


--
-- Name: SEQUENCE collection_risk_assessment_assessment_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_risk_assessment_assessment_id_seq TO authenticated;


--
-- Name: TABLE collection_scores; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_scores TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_scores TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_scores TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_scores TO anon;
GRANT ALL ON TABLE kastle_collection.collection_scores TO authenticated;


--
-- Name: SEQUENCE collection_scores_score_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_scores_score_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_scores_score_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_scores_score_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_scores_score_id_seq TO authenticated;


--
-- Name: TABLE collection_settlement_offers; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_settlement_offers TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_settlement_offers TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_settlement_offers TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_settlement_offers TO anon;
GRANT ALL ON TABLE kastle_collection.collection_settlement_offers TO authenticated;


--
-- Name: SEQUENCE collection_settlement_offers_offer_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_settlement_offers_offer_id_seq TO authenticated;


--
-- Name: TABLE collection_strategies; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_strategies TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_strategies TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_strategies TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_strategies TO anon;
GRANT ALL ON TABLE kastle_collection.collection_strategies TO authenticated;


--
-- Name: SEQUENCE collection_strategies_strategy_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_strategies_strategy_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_strategies_strategy_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_strategies_strategy_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_strategies_strategy_id_seq TO authenticated;


--
-- Name: TABLE collection_system_performance; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_system_performance TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_system_performance TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_system_performance TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_system_performance TO anon;
GRANT ALL ON TABLE kastle_collection.collection_system_performance TO authenticated;


--
-- Name: SEQUENCE collection_system_performance_log_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_system_performance_log_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_system_performance_log_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_system_performance_log_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_system_performance_log_id_seq TO authenticated;


--
-- Name: TABLE collection_teams; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_teams TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_teams TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_teams TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_teams TO anon;
GRANT ALL ON TABLE kastle_collection.collection_teams TO authenticated;


--
-- Name: SEQUENCE collection_teams_team_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_teams_team_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_teams_team_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_teams_team_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_teams_team_id_seq TO authenticated;


--
-- Name: TABLE collection_vintage_analysis; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_vintage_analysis TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_vintage_analysis TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_vintage_analysis TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_vintage_analysis TO anon;
GRANT ALL ON TABLE kastle_collection.collection_vintage_analysis TO authenticated;


--
-- Name: SEQUENCE collection_vintage_analysis_vintage_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_vintage_analysis_vintage_id_seq TO authenticated;


--
-- Name: TABLE collection_workflow_templates; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_workflow_templates TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_workflow_templates TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_workflow_templates TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_workflow_templates TO anon;
GRANT ALL ON TABLE kastle_collection.collection_workflow_templates TO authenticated;


--
-- Name: SEQUENCE collection_workflow_templates_template_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_workflow_templates_template_id_seq TO authenticated;


--
-- Name: TABLE collection_write_offs; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.collection_write_offs TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.collection_write_offs TO collection_write;
GRANT ALL ON TABLE kastle_collection.collection_write_offs TO collection_admin;
GRANT ALL ON TABLE kastle_collection.collection_write_offs TO anon;
GRANT ALL ON TABLE kastle_collection.collection_write_offs TO authenticated;


--
-- Name: SEQUENCE collection_write_offs_write_off_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.collection_write_offs_write_off_id_seq TO authenticated;


--
-- Name: TABLE daily_collection_summary; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.daily_collection_summary TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.daily_collection_summary TO collection_write;
GRANT ALL ON TABLE kastle_collection.daily_collection_summary TO collection_admin;
GRANT ALL ON TABLE kastle_collection.daily_collection_summary TO anon;
GRANT ALL ON TABLE kastle_collection.daily_collection_summary TO authenticated;


--
-- Name: SEQUENCE daily_collection_summary_summary_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.daily_collection_summary_summary_id_seq TO authenticated;


--
-- Name: TABLE data_masking_rules; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.data_masking_rules TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.data_masking_rules TO collection_write;
GRANT ALL ON TABLE kastle_collection.data_masking_rules TO collection_admin;
GRANT ALL ON TABLE kastle_collection.data_masking_rules TO anon;
GRANT ALL ON TABLE kastle_collection.data_masking_rules TO authenticated;


--
-- Name: SEQUENCE data_masking_rules_rule_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.data_masking_rules_rule_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.data_masking_rules_rule_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.data_masking_rules_rule_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.data_masking_rules_rule_id_seq TO authenticated;


--
-- Name: TABLE digital_collection_attempts; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.digital_collection_attempts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.digital_collection_attempts TO collection_write;
GRANT ALL ON TABLE kastle_collection.digital_collection_attempts TO collection_admin;
GRANT ALL ON TABLE kastle_collection.digital_collection_attempts TO anon;
GRANT ALL ON TABLE kastle_collection.digital_collection_attempts TO authenticated;


--
-- Name: SEQUENCE digital_collection_attempts_attempt_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.digital_collection_attempts_attempt_id_seq TO authenticated;


--
-- Name: TABLE field_visits; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.field_visits TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.field_visits TO collection_write;
GRANT ALL ON TABLE kastle_collection.field_visits TO collection_admin;
GRANT ALL ON TABLE kastle_collection.field_visits TO anon;
GRANT ALL ON TABLE kastle_collection.field_visits TO authenticated;


--
-- Name: SEQUENCE field_visits_visit_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.field_visits_visit_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.field_visits_visit_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.field_visits_visit_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.field_visits_visit_id_seq TO authenticated;


--
-- Name: TABLE hardship_applications; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.hardship_applications TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.hardship_applications TO collection_write;
GRANT ALL ON TABLE kastle_collection.hardship_applications TO collection_admin;
GRANT ALL ON TABLE kastle_collection.hardship_applications TO anon;
GRANT ALL ON TABLE kastle_collection.hardship_applications TO authenticated;


--
-- Name: SEQUENCE hardship_applications_application_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.hardship_applications_application_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.hardship_applications_application_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.hardship_applications_application_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.hardship_applications_application_id_seq TO authenticated;


--
-- Name: TABLE ivr_payment_attempts; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.ivr_payment_attempts TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.ivr_payment_attempts TO collection_write;
GRANT ALL ON TABLE kastle_collection.ivr_payment_attempts TO collection_admin;
GRANT ALL ON TABLE kastle_collection.ivr_payment_attempts TO anon;
GRANT ALL ON TABLE kastle_collection.ivr_payment_attempts TO authenticated;


--
-- Name: SEQUENCE ivr_payment_attempts_attempt_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.ivr_payment_attempts_attempt_id_seq TO authenticated;


--
-- Name: TABLE legal_cases; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.legal_cases TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.legal_cases TO collection_write;
GRANT ALL ON TABLE kastle_collection.legal_cases TO collection_admin;
GRANT ALL ON TABLE kastle_collection.legal_cases TO anon;
GRANT ALL ON TABLE kastle_collection.legal_cases TO authenticated;


--
-- Name: SEQUENCE legal_cases_legal_case_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.legal_cases_legal_case_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.legal_cases_legal_case_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.legal_cases_legal_case_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.legal_cases_legal_case_id_seq TO authenticated;


--
-- Name: TABLE loan_restructuring; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.loan_restructuring TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.loan_restructuring TO collection_write;
GRANT ALL ON TABLE kastle_collection.loan_restructuring TO collection_admin;
GRANT ALL ON TABLE kastle_collection.loan_restructuring TO anon;
GRANT ALL ON TABLE kastle_collection.loan_restructuring TO authenticated;


--
-- Name: SEQUENCE loan_restructuring_restructure_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.loan_restructuring_restructure_id_seq TO authenticated;


--
-- Name: TABLE officer_performance_metrics; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.officer_performance_metrics TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.officer_performance_metrics TO collection_write;
GRANT ALL ON TABLE kastle_collection.officer_performance_metrics TO collection_admin;
GRANT ALL ON TABLE kastle_collection.officer_performance_metrics TO anon;
GRANT ALL ON TABLE kastle_collection.officer_performance_metrics TO authenticated;


--
-- Name: SEQUENCE officer_performance_metrics_metric_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.officer_performance_metrics_metric_id_seq TO authenticated;


--
-- Name: TABLE officer_performance_summary; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.officer_performance_summary TO anon;
GRANT SELECT ON TABLE kastle_collection.officer_performance_summary TO authenticated;


--
-- Name: TABLE performance_metrics; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.performance_metrics TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.performance_metrics TO collection_write;
GRANT ALL ON TABLE kastle_collection.performance_metrics TO collection_admin;
GRANT ALL ON TABLE kastle_collection.performance_metrics TO anon;
GRANT ALL ON TABLE kastle_collection.performance_metrics TO authenticated;


--
-- Name: SEQUENCE performance_metrics_metric_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.performance_metrics_metric_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.performance_metrics_metric_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.performance_metrics_metric_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.performance_metrics_metric_id_seq TO authenticated;


--
-- Name: TABLE promise_to_pay; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.promise_to_pay TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.promise_to_pay TO collection_write;
GRANT ALL ON TABLE kastle_collection.promise_to_pay TO collection_admin;
GRANT ALL ON TABLE kastle_collection.promise_to_pay TO anon;
GRANT ALL ON TABLE kastle_collection.promise_to_pay TO authenticated;


--
-- Name: SEQUENCE promise_to_pay_ptp_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.promise_to_pay_ptp_id_seq TO authenticated;


--
-- Name: TABLE repossessed_assets; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.repossessed_assets TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.repossessed_assets TO collection_write;
GRANT ALL ON TABLE kastle_collection.repossessed_assets TO collection_admin;
GRANT ALL ON TABLE kastle_collection.repossessed_assets TO anon;
GRANT ALL ON TABLE kastle_collection.repossessed_assets TO authenticated;


--
-- Name: SEQUENCE repossessed_assets_asset_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.repossessed_assets_asset_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.repossessed_assets_asset_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.repossessed_assets_asset_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.repossessed_assets_asset_id_seq TO authenticated;


--
-- Name: TABLE sharia_compliance_log; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.sharia_compliance_log TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.sharia_compliance_log TO collection_write;
GRANT ALL ON TABLE kastle_collection.sharia_compliance_log TO collection_admin;
GRANT ALL ON TABLE kastle_collection.sharia_compliance_log TO anon;
GRANT ALL ON TABLE kastle_collection.sharia_compliance_log TO authenticated;


--
-- Name: SEQUENCE sharia_compliance_log_compliance_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.sharia_compliance_log_compliance_id_seq TO authenticated;


--
-- Name: TABLE user_role_assignments; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.user_role_assignments TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.user_role_assignments TO collection_write;
GRANT ALL ON TABLE kastle_collection.user_role_assignments TO collection_admin;
GRANT ALL ON TABLE kastle_collection.user_role_assignments TO anon;
GRANT ALL ON TABLE kastle_collection.user_role_assignments TO authenticated;


--
-- Name: SEQUENCE user_role_assignments_assignment_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.user_role_assignments_assignment_id_seq TO authenticated;


--
-- Name: TABLE user_roles; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.user_roles TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.user_roles TO collection_write;
GRANT ALL ON TABLE kastle_collection.user_roles TO collection_admin;
GRANT ALL ON TABLE kastle_collection.user_roles TO anon;
GRANT ALL ON TABLE kastle_collection.user_roles TO authenticated;


--
-- Name: SEQUENCE user_roles_role_id_seq; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT USAGE ON SEQUENCE kastle_collection.user_roles_role_id_seq TO collection_write;
GRANT ALL ON SEQUENCE kastle_collection.user_roles_role_id_seq TO collection_admin;
GRANT ALL ON SEQUENCE kastle_collection.user_roles_role_id_seq TO anon;
GRANT ALL ON SEQUENCE kastle_collection.user_roles_role_id_seq TO authenticated;


--
-- Name: TABLE v_first_payment_defaults; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_first_payment_defaults TO anon;
GRANT SELECT ON TABLE kastle_collection.v_first_payment_defaults TO authenticated;


--
-- Name: TABLE v_high_dti_customers; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_high_dti_customers TO anon;
GRANT SELECT ON TABLE kastle_collection.v_high_dti_customers TO authenticated;


--
-- Name: TABLE v_multiple_loans_stress; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_multiple_loans_stress TO anon;
GRANT SELECT ON TABLE kastle_collection.v_multiple_loans_stress TO authenticated;


--
-- Name: TABLE v_actionable_insights; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_actionable_insights TO anon;
GRANT SELECT ON TABLE kastle_collection.v_actionable_insights TO authenticated;


--
-- Name: TABLE v_behavioral_changes; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_behavioral_changes TO anon;
GRANT SELECT ON TABLE kastle_collection.v_behavioral_changes TO authenticated;


--
-- Name: TABLE v_early_warning_alerts; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_early_warning_alerts TO anon;
GRANT SELECT ON TABLE kastle_collection.v_early_warning_alerts TO authenticated;


--
-- Name: TABLE v_early_warning_summary; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_early_warning_summary TO anon;
GRANT SELECT ON TABLE kastle_collection.v_early_warning_summary TO authenticated;


--
-- Name: TABLE v_industry_risk_analysis; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_industry_risk_analysis TO anon;
GRANT SELECT ON TABLE kastle_collection.v_industry_risk_analysis TO authenticated;


--
-- Name: TABLE v_irregular_payment_patterns; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_irregular_payment_patterns TO anon;
GRANT SELECT ON TABLE kastle_collection.v_irregular_payment_patterns TO authenticated;


--
-- Name: TABLE v_loan_installment_details; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_loan_installment_details TO anon;
GRANT SELECT ON TABLE kastle_collection.v_loan_installment_details TO authenticated;


--
-- Name: TABLE v_officer_communication_summary; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_officer_communication_summary TO anon;
GRANT SELECT ON TABLE kastle_collection.v_officer_communication_summary TO authenticated;


--
-- Name: TABLE v_risk_score_trend; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_risk_score_trend TO anon;
GRANT SELECT ON TABLE kastle_collection.v_risk_score_trend TO authenticated;


--
-- Name: TABLE v_specialist_loan_portfolio; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.v_specialist_loan_portfolio TO anon;
GRANT SELECT ON TABLE kastle_collection.v_specialist_loan_portfolio TO authenticated;


--
-- Name: TABLE vw_daily_collection_dashboard; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.vw_daily_collection_dashboard TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.vw_daily_collection_dashboard TO collection_write;
GRANT ALL ON TABLE kastle_collection.vw_daily_collection_dashboard TO collection_admin;
GRANT ALL ON TABLE kastle_collection.vw_daily_collection_dashboard TO anon;
GRANT ALL ON TABLE kastle_collection.vw_daily_collection_dashboard TO authenticated;


--
-- Name: TABLE vw_officer_performance; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.vw_officer_performance TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.vw_officer_performance TO collection_write;
GRANT ALL ON TABLE kastle_collection.vw_officer_performance TO collection_admin;
GRANT ALL ON TABLE kastle_collection.vw_officer_performance TO anon;
GRANT ALL ON TABLE kastle_collection.vw_officer_performance TO authenticated;


--
-- Name: TABLE vw_portfolio_aging; Type: ACL; Schema: kastle_collection; Owner: postgres
--

GRANT SELECT ON TABLE kastle_collection.vw_portfolio_aging TO collection_read;
GRANT SELECT,INSERT,UPDATE ON TABLE kastle_collection.vw_portfolio_aging TO collection_write;
GRANT ALL ON TABLE kastle_collection.vw_portfolio_aging TO collection_admin;
GRANT ALL ON TABLE kastle_collection.vw_portfolio_aging TO anon;
GRANT ALL ON TABLE kastle_collection.vw_portfolio_aging TO authenticated;


--
-- Name: TABLE aging_distribution; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.aging_distribution TO anon;
GRANT ALL ON TABLE public.aging_distribution TO authenticated;
GRANT ALL ON TABLE public.aging_distribution TO service_role;


--
-- Name: TABLE collection_cases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.collection_cases TO anon;
GRANT ALL ON TABLE public.collection_cases TO authenticated;
GRANT ALL ON TABLE public.collection_cases TO service_role;


--
-- Name: SEQUENCE collection_cases_case_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.collection_cases_case_id_seq TO anon;
GRANT ALL ON SEQUENCE public.collection_cases_case_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.collection_cases_case_id_seq TO service_role;


--
-- Name: TABLE collection_interactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.collection_interactions TO anon;
GRANT ALL ON TABLE public.collection_interactions TO authenticated;
GRANT ALL ON TABLE public.collection_interactions TO service_role;


--
-- Name: SEQUENCE collection_interactions_interaction_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.collection_interactions_interaction_id_seq TO anon;
GRANT ALL ON SEQUENCE public.collection_interactions_interaction_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.collection_interactions_interaction_id_seq TO service_role;


--
-- Name: TABLE collection_officers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.collection_officers TO anon;
GRANT ALL ON TABLE public.collection_officers TO authenticated;
GRANT ALL ON TABLE public.collection_officers TO service_role;


--
-- Name: TABLE collection_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.collection_rates TO anon;
GRANT ALL ON TABLE public.collection_rates TO authenticated;
GRANT ALL ON TABLE public.collection_rates TO service_role;


--
-- Name: TABLE customers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.customers TO anon;
GRANT ALL ON TABLE public.customers TO authenticated;
GRANT ALL ON TABLE public.customers TO service_role;


--
-- Name: TABLE executive_delinquency_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.executive_delinquency_summary TO anon;
GRANT ALL ON TABLE public.executive_delinquency_summary TO authenticated;
GRANT ALL ON TABLE public.executive_delinquency_summary TO service_role;


--
-- Name: TABLE "kastle_banking.account_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.account_types" TO anon;
GRANT ALL ON TABLE public."kastle_banking.account_types" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.account_types" TO service_role;


--
-- Name: TABLE "kastle_banking.accounts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.accounts" TO anon;
GRANT ALL ON TABLE public."kastle_banking.accounts" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.accounts" TO service_role;


--
-- Name: TABLE "kastle_banking.audit_trail"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.audit_trail" TO anon;
GRANT ALL ON TABLE public."kastle_banking.audit_trail" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.audit_trail" TO service_role;


--
-- Name: TABLE "kastle_banking.auth_user_profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.auth_user_profiles" TO anon;
GRANT ALL ON TABLE public."kastle_banking.auth_user_profiles" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.auth_user_profiles" TO service_role;


--
-- Name: TABLE "kastle_banking.bank_config"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.bank_config" TO anon;
GRANT ALL ON TABLE public."kastle_banking.bank_config" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.bank_config" TO service_role;


--
-- Name: TABLE "kastle_banking.branches"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.branches" TO anon;
GRANT ALL ON TABLE public."kastle_banking.branches" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.branches" TO service_role;


--
-- Name: TABLE "kastle_banking.collection_buckets"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.collection_buckets" TO anon;
GRANT ALL ON TABLE public."kastle_banking.collection_buckets" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.collection_buckets" TO service_role;


--
-- Name: TABLE "kastle_banking.collection_cases"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.collection_cases" TO anon;
GRANT ALL ON TABLE public."kastle_banking.collection_cases" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.collection_cases" TO service_role;


--
-- Name: TABLE "kastle_banking.countries"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.countries" TO anon;
GRANT ALL ON TABLE public."kastle_banking.countries" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.countries" TO service_role;


--
-- Name: TABLE "kastle_banking.currencies"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.currencies" TO anon;
GRANT ALL ON TABLE public."kastle_banking.currencies" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.currencies" TO service_role;


--
-- Name: TABLE "kastle_banking.customer_addresses"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.customer_addresses" TO anon;
GRANT ALL ON TABLE public."kastle_banking.customer_addresses" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.customer_addresses" TO service_role;


--
-- Name: TABLE "kastle_banking.customer_contacts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.customer_contacts" TO anon;
GRANT ALL ON TABLE public."kastle_banking.customer_contacts" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.customer_contacts" TO service_role;


--
-- Name: TABLE "kastle_banking.customer_documents"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.customer_documents" TO anon;
GRANT ALL ON TABLE public."kastle_banking.customer_documents" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.customer_documents" TO service_role;


--
-- Name: TABLE "kastle_banking.customer_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.customer_types" TO anon;
GRANT ALL ON TABLE public."kastle_banking.customer_types" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.customer_types" TO service_role;


--
-- Name: TABLE "kastle_banking.customers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.customers" TO anon;
GRANT ALL ON TABLE public."kastle_banking.customers" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.customers" TO service_role;


--
-- Name: TABLE "kastle_banking.loan_accounts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.loan_accounts" TO anon;
GRANT ALL ON TABLE public."kastle_banking.loan_accounts" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.loan_accounts" TO service_role;


--
-- Name: TABLE "kastle_banking.loan_applications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.loan_applications" TO anon;
GRANT ALL ON TABLE public."kastle_banking.loan_applications" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.loan_applications" TO service_role;


--
-- Name: TABLE "kastle_banking.product_categories"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.product_categories" TO anon;
GRANT ALL ON TABLE public."kastle_banking.product_categories" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.product_categories" TO service_role;


--
-- Name: TABLE "kastle_banking.products"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.products" TO anon;
GRANT ALL ON TABLE public."kastle_banking.products" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.products" TO service_role;


--
-- Name: TABLE "kastle_banking.realtime_notifications"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.realtime_notifications" TO anon;
GRANT ALL ON TABLE public."kastle_banking.realtime_notifications" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.realtime_notifications" TO service_role;


--
-- Name: TABLE "kastle_banking.transaction_types"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.transaction_types" TO anon;
GRANT ALL ON TABLE public."kastle_banking.transaction_types" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.transaction_types" TO service_role;


--
-- Name: TABLE "kastle_banking.transactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."kastle_banking.transactions" TO anon;
GRANT ALL ON TABLE public."kastle_banking.transactions" TO authenticated;
GRANT ALL ON TABLE public."kastle_banking.transactions" TO service_role;


--
-- Name: TABLE officer_performance_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.officer_performance_summary TO anon;
GRANT ALL ON TABLE public.officer_performance_summary TO authenticated;
GRANT ALL ON TABLE public.officer_performance_summary TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: SEQUENCE payments_payment_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payments_payment_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payments_payment_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payments_payment_id_seq TO service_role;


--
-- Name: TABLE promise_to_pay; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promise_to_pay TO anon;
GRANT ALL ON TABLE public.promise_to_pay TO authenticated;
GRANT ALL ON TABLE public.promise_to_pay TO service_role;


--
-- Name: SEQUENCE promise_to_pay_ptp_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.promise_to_pay_ptp_id_seq TO anon;
GRANT ALL ON SEQUENCE public.promise_to_pay_ptp_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.promise_to_pay_ptp_id_seq TO service_role;


--
-- Name: TABLE top_delinquent_customers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.top_delinquent_customers TO anon;
GRANT ALL ON TABLE public.top_delinquent_customers TO authenticated;
GRANT ALL ON TABLE public.top_delinquent_customers TO service_role;


--
-- Name: TABLE v_specialist_loan_portfolio; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_specialist_loan_portfolio TO anon;
GRANT ALL ON TABLE public.v_specialist_loan_portfolio TO authenticated;
GRANT ALL ON TABLE public.v_specialist_loan_portfolio TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2025_07_23; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_07_23 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_07_23 TO dashboard_user;


--
-- Name: TABLE messages_2025_07_24; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_07_24 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_07_24 TO dashboard_user;


--
-- Name: TABLE messages_2025_07_25; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_07_25 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_07_25 TO dashboard_user;


--
-- Name: TABLE messages_2025_07_26; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_07_26 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_07_26 TO dashboard_user;


--
-- Name: TABLE messages_2025_07_27; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_07_27 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_07_27 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;
GRANT ALL ON TABLE storage.s3_multipart_uploads TO postgres;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;
GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO postgres;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: kastle_banking; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA kastle_banking GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA kastle_banking GRANT SELECT ON TABLES TO authenticated;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: kastle_collection; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA kastle_collection GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA kastle_collection GRANT SELECT ON TABLES TO authenticated;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database cluster dump complete
--

