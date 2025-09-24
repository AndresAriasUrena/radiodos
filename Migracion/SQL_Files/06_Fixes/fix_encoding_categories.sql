-- ============================================
-- CORRECCIÓN DE CARACTERES ESPECIALES EN CATEGORÍAS
-- Ejecutar DESPUÉS de importar términos y taxonomías
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Corregir caracteres especiales en nombres de términos (categorías y tags)
UPDATE wp_terms SET name = REPLACE(name, 'Ã¡', 'á');
UPDATE wp_terms SET name = REPLACE(name, 'Ã©', 'é');
UPDATE wp_terms SET name = REPLACE(name, 'Ã­', 'í');
UPDATE wp_terms SET name = REPLACE(name, 'Ã³', 'ó');
UPDATE wp_terms SET name = REPLACE(name, 'Ãº', 'ú');
UPDATE wp_terms SET name = REPLACE(name, 'Ã±', 'ñ');
UPDATE wp_terms SET name = REPLACE(name, 'Ã¼', 'ü');
UPDATE wp_terms SET name = REPLACE(name, 'Ã', 'Á');
UPDATE wp_terms SET name = REPLACE(name, 'Ã‰', 'É');
UPDATE wp_terms SET name = REPLACE(name, 'Ã', 'Í');
UPDATE wp_terms SET name = REPLACE(name, 'Ã"', 'Ó');
UPDATE wp_terms SET name = REPLACE(name, 'Ãš', 'Ú');
UPDATE wp_terms SET name = REPLACE(name, 'Ã'', 'Ñ');
UPDATE wp_terms SET name = REPLACE(name, 'Ãœ', 'Ü');

-- Corregir caracteres especiales en slugs de términos
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã¡', 'á');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã©', 'é');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã­', 'í');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã³', 'ó');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ãº', 'ú');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã±', 'ñ');
UPDATE wp_terms SET slug = REPLACE(slug, 'Ã¼', 'ü');

-- Corregir caracteres especiales en descripciones de taxonomías
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã¡', 'á');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã©', 'é');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã­', 'í');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã³', 'ó');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ãº', 'ú');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã±', 'ñ');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã¼', 'ü');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã', 'Á');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã‰', 'É');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã', 'Í');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã"', 'Ó');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ãš', 'Ú');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ã'', 'Ñ');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'Ãœ', 'Ü');

-- Caracteres especiales adicionales comunes
UPDATE wp_terms SET name = REPLACE(name, 'â€œ', '"');
UPDATE wp_terms SET name = REPLACE(name, 'â€', '"');
UPDATE wp_terms SET name = REPLACE(name, 'â€™', "'");
UPDATE wp_terms SET name = REPLACE(name, 'â€˜', "'");
UPDATE wp_terms SET name = REPLACE(name, 'â€"', '–');
UPDATE wp_terms SET name = REPLACE(name, 'â€"', '—');

UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€œ', '"');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€', '"');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€™', "'");
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€˜', "'");
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€"', '–');
UPDATE wp_term_taxonomy SET description = REPLACE(description, 'â€"', '—');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICACIÓN DESPUÉS DE EJECUTAR
-- ============================================

-- Ver todas las categorías para verificar
SELECT term_id, name, slug FROM wp_terms WHERE term_id IN (
    SELECT term_id FROM wp_term_taxonomy WHERE taxonomy = 'category'
) ORDER BY name;

-- Ver todos los tags para verificar
SELECT term_id, name, slug FROM wp_terms WHERE term_id IN (
    SELECT term_id FROM wp_term_taxonomy WHERE taxonomy = 'post_tag'
) ORDER BY name;

-- Buscar caracteres raros que puedan quedar
SELECT term_id, name, 'TERM NAME' as tipo FROM wp_terms 
WHERE name LIKE '%Ã%' OR name LIKE '%â€%'
UNION ALL
SELECT term_id, slug, 'TERM SLUG' as tipo FROM wp_terms 
WHERE slug LIKE '%Ã%' OR slug LIKE '%â€%'
UNION ALL
SELECT term_id, description, 'TAXONOMY DESC' as tipo FROM wp_term_taxonomy 
WHERE description LIKE '%Ã%' OR description LIKE '%â€%';