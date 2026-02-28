-- Order Bumps table for storing AI-generated and approved order bumps per LP
CREATE TABLE IF NOT EXISTS order_bumps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
    landing_page_name TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT DEFAULT '',
    preco NUMERIC(10,2) NOT NULL DEFAULT 0,
    copy_checkout TEXT DEFAULT '',
    entregaveis TEXT DEFAULT '',
    categoria TEXT DEFAULT 'complementar',
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by LP
CREATE INDEX IF NOT EXISTS idx_order_bumps_lp ON order_bumps(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_order_bumps_status ON order_bumps(status);

-- Enable RLS (allow all for now since no auth)
ALTER TABLE order_bumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on order_bumps" ON order_bumps FOR ALL USING (true) WITH CHECK (true);
