-- Supabase cài extension vào schema "extensions" (không phải "public"),
-- nên gọi hàm không chỉ rõ schema sẽ báo "function does not exist".
SET search_path TO public, extensions;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- Bọc lại các hàm/operator của pg_trgm + unaccent, tự gắn cứng search_path
-- ngay trong định nghĩa hàm — nhờ vậy code Node gọi qua connection pooler
-- (search_path mặc định có thể không có "extensions") vẫn luôn chạy đúng,
-- không phụ thuộc session đang search_path gì.
CREATE OR REPLACE FUNCTION earthoria_unaccent(text)
RETURNS text AS $$
  SELECT unaccent($1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION earthoria_similarity(text, text)
RETURNS real AS $$
  SELECT similarity($1, $2)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION earthoria_is_similar(text, text)
RETURNS boolean AS $$
  SELECT $1 % $2
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = public, extensions;

CREATE INDEX IF NOT EXISTS "Book_title_trgm_idx"
  ON "Book" USING GIN (earthoria_unaccent(lower(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Book_description_trgm_idx"
  ON "Book" USING GIN (earthoria_unaccent(lower(description)) gin_trgm_ops);