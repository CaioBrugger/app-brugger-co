


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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."generated_deliverables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lp_id" "uuid",
    "deliverable_key" "text" NOT NULL,
    "item_nome" "text",
    "item_tipo" "text",
    "docx_path" "text",
    "pdf_path" "text",
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generated_deliverables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landing_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "theme_id" "text" DEFAULT ''::"text" NOT NULL,
    "model_used" "text" DEFAULT ''::"text" NOT NULL,
    "section_count" integer DEFAULT 0 NOT NULL,
    "sections_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "html_content" "text" DEFAULT ''::"text" NOT NULL,
    "thumbnail_html" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."landing_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lp_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lp_id" "uuid",
    "result" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lp_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lp_components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" DEFAULT 'custom'::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "html" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lp_components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lp_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "sections_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "thumbnail_html" "text" DEFAULT ''::"text",
    "theme_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lp_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_bumps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "landing_page_id" "uuid",
    "landing_page_name" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text" DEFAULT ''::"text",
    "preco" numeric(10,2) DEFAULT 0 NOT NULL,
    "copy_checkout" "text" DEFAULT ''::"text",
    "entregaveis" "text" DEFAULT ''::"text",
    "categoria" "text" DEFAULT 'complementar'::"text",
    "status" "text" DEFAULT 'approved'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_bumps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_ideas" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "reasoning" "text" DEFAULT ''::"text" NOT NULL,
    "category" "text" DEFAULT 'AT'::"text" NOT NULL,
    "status" "text" DEFAULT 'idea'::"text" NOT NULL,
    "price_range" "text" DEFAULT 'low_ticket'::"text",
    "source" "text" DEFAULT 'ai_council'::"text",
    "council_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_ideas_status_check" CHECK (("status" = ANY (ARRAY['idea'::"text", 'planned'::"text", 'in_progress'::"text", 'launched'::"text"])))
);


ALTER TABLE "public"."product_ideas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_links" (
    "id" bigint NOT NULL,
    "product_id" "text" NOT NULL,
    "language" "text" NOT NULL,
    "url" "text",
    "checkout_basic" "text",
    "checkout_full" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_links" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_links_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_links_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_links_id_seq" OWNED BY "public"."product_links"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "icon" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "products_category_check" CHECK (("category" = ANY (ARRAY['AT'::"text", 'NT'::"text", 'COMBO'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."themes" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "tokens" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "preview_html" "text" DEFAULT ''::"text" NOT NULL,
    "accent_colors" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "done" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    CONSTRAINT "todos_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."todos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."todos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."todos_id_seq" OWNED BY "public"."todos"."id";



ALTER TABLE ONLY "public"."product_links" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_links_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."todos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."todos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."generated_deliverables"
    ADD CONSTRAINT "generated_deliverables_lp_id_deliverable_key_key" UNIQUE ("lp_id", "deliverable_key");



ALTER TABLE ONLY "public"."generated_deliverables"
    ADD CONSTRAINT "generated_deliverables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lp_analyses"
    ADD CONSTRAINT "lp_analyses_lp_id_key" UNIQUE ("lp_id");



ALTER TABLE ONLY "public"."lp_analyses"
    ADD CONSTRAINT "lp_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lp_components"
    ADD CONSTRAINT "lp_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lp_templates"
    ADD CONSTRAINT "lp_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_bumps"
    ADD CONSTRAINT "order_bumps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_ideas"
    ADD CONSTRAINT "product_ideas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_links"
    ADD CONSTRAINT "product_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_links"
    ADD CONSTRAINT "product_links_product_id_language_key" UNIQUE ("product_id", "language");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_order_bumps_lp" ON "public"."order_bumps" USING "btree" ("landing_page_id");



CREATE INDEX "idx_order_bumps_status" ON "public"."order_bumps" USING "btree" ("status");



CREATE INDEX "landing_pages_created_at_idx" ON "public"."landing_pages" USING "btree" ("created_at" DESC);



CREATE OR REPLACE TRIGGER "landing_pages_updated_at" BEFORE UPDATE ON "public"."landing_pages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."generated_deliverables"
    ADD CONSTRAINT "generated_deliverables_lp_id_fkey" FOREIGN KEY ("lp_id") REFERENCES "public"."landing_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lp_analyses"
    ADD CONSTRAINT "lp_analyses_lp_id_fkey" FOREIGN KEY ("lp_id") REFERENCES "public"."landing_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_bumps"
    ADD CONSTRAINT "order_bumps_landing_page_id_fkey" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_links"
    ADD CONSTRAINT "product_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



CREATE POLICY "allow_all_order_bumps" ON "public"."order_bumps" USING (true) WITH CHECK (true);



ALTER TABLE "public"."landing_pages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "landing_pages_open" ON "public"."landing_pages" USING (true) WITH CHECK (true);



ALTER TABLE "public"."order_bumps" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."todos";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."generated_deliverables" TO "anon";
GRANT ALL ON TABLE "public"."generated_deliverables" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_deliverables" TO "service_role";



GRANT ALL ON TABLE "public"."landing_pages" TO "anon";
GRANT ALL ON TABLE "public"."landing_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."landing_pages" TO "service_role";



GRANT ALL ON TABLE "public"."lp_analyses" TO "anon";
GRANT ALL ON TABLE "public"."lp_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."lp_components" TO "anon";
GRANT ALL ON TABLE "public"."lp_components" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_components" TO "service_role";



GRANT ALL ON TABLE "public"."lp_templates" TO "anon";
GRANT ALL ON TABLE "public"."lp_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_templates" TO "service_role";



GRANT ALL ON TABLE "public"."order_bumps" TO "anon";
GRANT ALL ON TABLE "public"."order_bumps" TO "authenticated";
GRANT ALL ON TABLE "public"."order_bumps" TO "service_role";



GRANT ALL ON TABLE "public"."product_ideas" TO "anon";
GRANT ALL ON TABLE "public"."product_ideas" TO "authenticated";
GRANT ALL ON TABLE "public"."product_ideas" TO "service_role";



GRANT ALL ON TABLE "public"."product_links" TO "anon";
GRANT ALL ON TABLE "public"."product_links" TO "authenticated";
GRANT ALL ON TABLE "public"."product_links" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_links_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_links_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_links_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."themes" TO "anon";
GRANT ALL ON TABLE "public"."themes" TO "authenticated";
GRANT ALL ON TABLE "public"."themes" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































