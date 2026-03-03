-- Cache de análises de LP (evita chamar a API repetidamente)
CREATE TABLE IF NOT EXISTS lp_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lp_id uuid REFERENCES landing_pages(id) ON DELETE CASCADE,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lp_id)
);

-- Cache de entregáveis gerados (DOCX + PDF no Storage)
CREATE TABLE IF NOT EXISTS generated_deliverables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lp_id uuid REFERENCES landing_pages(id) ON DELETE CASCADE,
  deliverable_key text NOT NULL,
  item_nome text,
  item_tipo text,
  docx_path text,
  pdf_path text,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(lp_id, deliverable_key)
);

-- Storage bucket para arquivos gerados
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: leitura pública
CREATE POLICY "Deliverables public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deliverables');

-- Policy: upload sem autenticação (anon key suficiente)
CREATE POLICY "Deliverables public upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deliverables');

-- Policy: atualização sem autenticação
CREATE POLICY "Deliverables public update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'deliverables');
