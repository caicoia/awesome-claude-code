-- ================================================================
-- MIGRATION 003: Storage Buckets — Checkin Na Mão
-- Executar APÓS 002_rls_policies.sql
-- ================================================================

-- Bucket para logos e fotos das pousadas (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pousada-media',
  'pousada-media',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para documentos de hóspedes (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-documents',
  'guest-documents',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- ================================================================
-- POLÍTICAS DE STORAGE
-- ================================================================

-- pousada-media: owner do tenant pode fazer upload
CREATE POLICY "pousada_media_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pousada-media'
    AND auth.user_role() IN ('owner', 'super_admin')
  );

-- pousada-media: leitura pública (imagens do site)
CREATE POLICY "pousada_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pousada-media');

-- pousada-media: owner pode deletar seus próprios arquivos
CREATE POLICY "pousada_media_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pousada-media'
    AND auth.user_role() IN ('owner', 'super_admin')
  );

-- guest-documents: somente usuários autenticados do mesmo tenant
CREATE POLICY "guest_docs_tenant_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'guest-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "guest_docs_tenant_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'guest-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "guest_docs_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'guest-documents'
    AND auth.user_role() IN ('owner', 'super_admin')
  );
