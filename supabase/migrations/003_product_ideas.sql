-- ============================================================
-- Migration 003: Product Ideas table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_ideas (
    id          text PRIMARY KEY,
    name        text NOT NULL,
    description text NOT NULL DEFAULT '',
    reasoning   text NOT NULL DEFAULT '',
    category    text NOT NULL DEFAULT 'AT',
    status      text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','planned','in_progress','launched')),
    price_range text DEFAULT 'low_ticket',
    source      text DEFAULT 'ai_council',
    council_data jsonb DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_ideas DISABLE ROW LEVEL SECURITY;
