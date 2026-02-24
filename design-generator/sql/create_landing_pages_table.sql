-- Supabase SQL Migration
-- Script for creating the landing_pages table to store generated LPs

CREATE TABLE public.landing_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Nullable se não usar auth no momento
    name TEXT NOT NULL,
    project_description TEXT,
    theme_id UUID REFERENCES public.design_systems(id),
    html_content TEXT NOT NULL,
    sections_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Exemplo de política básica (permite tudo anonimamente apenas para uso local/dev):
CREATE POLICY "Enable all for anon users" ON public.landing_pages FOR ALL USING (true);
