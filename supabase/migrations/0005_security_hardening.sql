-- 0005_security_hardening.sql, passe de securite pre-production.
--
-- Correction du lint Supabase "public_bucket_allows_listing" : un
-- bucket public sert ses fichiers par URL publique SANS policy SELECT
-- sur storage.objects. La policy large permettait de LISTER tous les
-- fichiers du bucket (enumeration des avatars de tous les profils).
-- On la retire : les URLs publiques continuent de fonctionner, le
-- listing devient impossible.

drop policy if exists "avatars_read_public" on storage.objects;
