-- Corregir codificación de caracteres especiales en posts
-- Ejecutar DESPUÉS de importar los posts

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Corregir post_title - caracteres minúsculas
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã±', 'ñ') WHERE post_type = 'post';

-- Corregir post_title - caracteres mayúsculas  
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã', 'Á') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã‰', 'É') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã', 'Í') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã"', 'Ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ãš', 'Ú') WHERE post_type = 'post';

-- Corregir post_content - caracteres minúsculas
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã±', 'ñ') WHERE post_type = 'post';

-- Corregir post_content - caracteres mayúsculas
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã', 'Á') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã‰', 'É') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã', 'Í') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã"', 'Ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ãš', 'Ú') WHERE post_type = 'post';

-- Corregir comillas especiales
UPDATE wp_posts SET post_content = REPLACE(post_content, 'â€œ', '"') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'â€', '"') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'â€"', '–') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'â€"', '—') WHERE post_type = 'post';

-- Corregir post_excerpt también
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã±', 'ñ') WHERE post_type = 'post';

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que se corrigieron
SELECT ID, post_title, LEFT(post_content, 200) as content_preview 
FROM wp_posts 
WHERE post_type = 'post' 
AND (post_title LIKE '%Ã%' OR post_content LIKE '%Ã%')
LIMIT 5;