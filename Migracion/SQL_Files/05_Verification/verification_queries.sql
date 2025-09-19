-- Queries de verificación post-migración
-- Ejecutar después de importar todos los archivos

-- 1. Contar posts importados
SELECT COUNT(*) as total_posts FROM wp_posts WHERE post_type = 'post';

-- 2. Contar attachments importados  
SELECT COUNT(*) as total_attachments FROM wp_posts WHERE post_type = 'attachment';

-- 3. Posts con thumbnail asignado
SELECT COUNT(*) as posts_with_thumbnail FROM wp_posts p 
JOIN wp_postmeta pm ON p.ID = pm.post_id 
WHERE p.post_type = 'post' AND pm.meta_key = '_thumbnail_id';

-- 4. Posts sin categoría
SELECT COUNT(*) as posts_without_category FROM wp_posts p 
WHERE p.post_type = 'post' AND p.ID NOT IN (
    SELECT object_id FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    WHERE tt.taxonomy = 'category'
);

-- 5. URLs de attachments incorrectas
SELECT COUNT(*) as incorrect_urls FROM wp_posts 
WHERE post_type = 'attachment' 
AND guid NOT LIKE 'https://radiodos.aurigital.com%';

-- 6. Verificar autores de posts
SELECT DISTINCT post_author, COUNT(*) as post_count 
FROM wp_posts 
WHERE post_type = 'post' 
GROUP BY post_author 
ORDER BY post_author;

-- 7. Categorías disponibles
SELECT COUNT(*) as total_categories FROM wp_term_taxonomy WHERE taxonomy = 'category';

-- 8. Tags disponibles  
SELECT COUNT(*) as total_tags FROM wp_term_taxonomy WHERE taxonomy = 'post_tag';

-- 9. Mostrar algunos posts para verificar
SELECT ID, post_title, post_author, post_type, post_status 
FROM wp_posts 
WHERE post_type = 'post' 
LIMIT 10;

-- 10. Verificar URLs de attachments
SELECT ID, guid, post_title 
FROM wp_posts 
WHERE post_type = 'attachment' 
LIMIT 5;
