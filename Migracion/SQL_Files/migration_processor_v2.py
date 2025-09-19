#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de migración de WordPress MEJORADO
Versión 2 - Captura todos los posts correctamente
"""

import re
import os
import sys

def read_file_with_encoding(file_path):
    """Lee un archivo intentando diferentes codificaciones"""
    encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"✅ Archivo leído con codificación: {encoding}")
            return content
        except UnicodeDecodeError:
            continue
    
    print("❌ No se pudo leer el archivo con ninguna codificación")
    return None

def extract_all_posts_data(sql_file_path, output_dir):
    """Extrae todos los posts (posts reales y attachments) por separado"""
    print("Procesando todos los posts...")
    
    content = read_file_with_encoding(sql_file_path)
    if content is None:
        return

    # Buscar todas las líneas que contienen registros de wp_posts
    post_lines = []
    lines = content.split('\n')
    
    in_posts_section = False
    
    for line in lines:
        # Detectar cuando empezamos la sección de wp_posts
        if 'INSERT INTO `wp_posts` VALUES' in line:
            in_posts_section = True
        
        # Si estamos en la sección de posts y la línea contiene datos
        if in_posts_section and line.strip().startswith('('):
            post_lines.append(line.strip())
        
        # Si encontramos el final de la sección
        if in_posts_section and (line.strip().endswith(';') or 'INSERT INTO' in line and 'wp_posts' not in line):
            if not line.strip().startswith('('):
                break
    
    print(f"📊 Total de líneas de posts encontradas: {len(post_lines)}")
    
    # Separar posts reales de attachments
    real_posts = []
    attachments = []
    
    for line in post_lines:
        # Limpiar la línea
        clean_line = line.rstrip(',;')
        
        # Verificar si es un post real
        if ",'post'," in line:
            # Verificar que no sea revision, elementor_library, etc.
            if not any(bad_type in line for bad_type in ["'revision'", "'elementor_library'", "'nav_menu_item'"]):
                # Manejar conflictos de autores (cambiar IDs 3-36 a 37)
                author_match = re.search(r'^\((\d+),(\d+),', clean_line)
                if author_match:
                    post_id = author_match.group(1)
                    post_author = author_match.group(2)
                    
                    if int(post_author) >= 3 and int(post_author) <= 36:
                        clean_line = re.sub(r'^\((\d+),(\d+),', f'({post_id},37,', clean_line)
                        print(f"⚠️  Post ID {post_id}: Cambiando autor de {post_author} a 37")
                
                real_posts.append(clean_line)
        
        # Verificar si es un attachment
        elif ",'attachment'," in line:
            # Corregir URLs para radiodos.aurigital.com
            corrected_line = clean_line.replace(
                'https://radiodos.com/wp-content/uploads/',
                'https://radiodos.aurigital.com/wp-content/uploads/'
            )
            corrected_line = corrected_line.replace(
                'http://radiodos.com/wp-content/uploads/',
                'https://radiodos.aurigital.com/wp-content/uploads/'
            )
            # También corregir otras referencias de dominio
            corrected_line = corrected_line.replace(
                'https://radiodos.com/',
                'https://radiodos.aurigital.com/'
            )
            corrected_line = corrected_line.replace(
                'http://radiodos.com/',
                'https://radiodos.aurigital.com/'
            )
            
            attachments.append(corrected_line)
    
    # Crear archivos
    header = """SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO wp_posts VALUES"""
    footer = ";\n\nSET FOREIGN_KEY_CHECKS = 1;"
    
    # Guardar posts reales
    if real_posts:
        posts_content = header + "\n" + ",\n".join(real_posts) + footer
        output_file = os.path.join(output_dir, "01_Posts", "posts_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(posts_content)
        print(f"✅ Posts reales extraídos: {len(real_posts)} registros")
        print(f"📁 Archivo creado: {output_file}")
    
    # Guardar attachments
    if attachments:
        attachments_content = header + "\n" + ",\n".join(attachments) + footer
        output_file = os.path.join(output_dir, "02_Attachments", "attachments_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(attachments_content)
        print(f"✅ Attachments extraídos: {len(attachments)} registros")
        print(f"📁 Archivo creado: {output_file}")

def extract_postmeta_improved(sql_file_path, output_dir):
    """Extrae metadatos críticos de forma mejorada"""
    print("Procesando postmeta mejorado...")
    
    content = read_file_with_encoding(sql_file_path)
    if content is None:
        return

    # Buscar todas las líneas de postmeta
    postmeta_lines = []
    lines = content.split('\n')
    
    in_postmeta_section = False
    
    for line in lines:
        if 'INSERT INTO `wp_postmeta` VALUES' in line:
            in_postmeta_section = True
        
        if in_postmeta_section and line.strip().startswith('('):
            postmeta_lines.append(line.strip())
        
        if in_postmeta_section and (line.strip().endswith(';') or ('INSERT INTO' in line and 'wp_postmeta' not in line)):
            if not line.strip().startswith('('):
                break
    
    print(f"📊 Total de líneas de postmeta encontradas: {len(postmeta_lines)}")
    
    # Filtrar metadatos críticos
    critical_meta_keys = [
        '_thumbnail_id',
        '_wp_attached_file',
        '_wp_attachment_metadata',
        '_edit_last',
        '_edit_lock'
    ]
    
    exclude_patterns = [
        'elementor',
        'yoast',
        'tie_',
        'oembed',
        '_aioseop',
        '_genesis',
        'rank_math'
    ]
    
    valid_postmeta = []
    
    for line in postmeta_lines:
        clean_line = line.rstrip(',;')
        
        # Verificar si contiene metadatos críticos
        is_critical = any(key in line for key in critical_meta_keys)
        
        # Verificar si contiene metadatos de plugins a excluir
        is_plugin_meta = any(pattern in line.lower() for pattern in exclude_patterns)
        
        if is_critical and not is_plugin_meta:
            # Corregir URLs en metadatos
            corrected_line = clean_line.replace(
                'https://radiodos.com/wp-content/uploads/',
                'https://radiodos.aurigital.com/wp-content/uploads/'
            )
            corrected_line = corrected_line.replace(
                'http://radiodos.com/wp-content/uploads/',
                'https://radiodos.aurigital.com/wp-content/uploads/'
            )
            
            valid_postmeta.append(corrected_line)
    
    if valid_postmeta:
        header = """SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO wp_postmeta VALUES"""
        footer = ";\n\nSET FOREIGN_KEY_CHECKS = 1;"
        
        postmeta_content = header + "\n" + ",\n".join(valid_postmeta) + footer
        
        output_file = os.path.join(output_dir, "03_Postmeta", "postmeta_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(postmeta_content)
        
        print(f"✅ Postmeta extraído: {len(valid_postmeta)} registros")
        print(f"📁 Archivo creado: {output_file}")

def extract_terms_improved(sql_file_path, output_dir):
    """Extrae términos, taxonomías y relaciones de forma mejorada"""
    print("Procesando términos mejorado...")
    
    content = read_file_with_encoding(sql_file_path)
    if content is None:
        return

    def extract_table_data(table_name):
        lines = content.split('\n')
        table_lines = []
        in_table_section = False
        
        for line in lines:
            if f'INSERT INTO `{table_name}` VALUES' in line:
                in_table_section = True
            
            if in_table_section and line.strip().startswith('('):
                table_lines.append(line.strip().rstrip(',;'))
            
            if in_table_section and (line.strip().endswith(';') or ('INSERT INTO' in line and table_name not in line)):
                if not line.strip().startswith('('):
                    break
        
        return table_lines

    # Extraer cada tabla
    terms_lines = extract_table_data('wp_terms')
    taxonomy_lines = extract_table_data('wp_term_taxonomy')
    relationships_lines = extract_table_data('wp_term_relationships')
    
    print(f"📊 Terms: {len(terms_lines)}, Taxonomies: {len(taxonomy_lines)}, Relationships: {len(relationships_lines)}")
    
    # Filtrar solo categorías y tags en taxonomías
    valid_taxonomies = []
    for line in taxonomy_lines:
        if "'category'" in line or "'post_tag'" in line:
            valid_taxonomies.append(line)
    
    # Crear archivos
    header_base = """SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

"""
    footer = ";\n\nSET FOREIGN_KEY_CHECKS = 1;"
    
    if terms_lines:
        terms_content = header_base + "INSERT INTO wp_terms VALUES\n" + ",\n".join(terms_lines) + footer
        output_file = os.path.join(output_dir, "04_Terms_Categories", "terms_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(terms_content)
        print(f"✅ Terms extraídos: {len(terms_lines)} registros")
    
    if valid_taxonomies:
        taxonomy_content = header_base + "INSERT INTO wp_term_taxonomy VALUES\n" + ",\n".join(valid_taxonomies) + footer
        output_file = os.path.join(output_dir, "04_Terms_Categories", "term_taxonomy_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(taxonomy_content)
        print(f"✅ Taxonomies extraídas: {len(valid_taxonomies)} registros")
    
    if relationships_lines:
        relationships_content = header_base + "INSERT INTO wp_term_relationships VALUES\n" + ",\n".join(relationships_lines) + footer
        output_file = os.path.join(output_dir, "04_Terms_Categories", "term_relationships_migration.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(relationships_content)
        print(f"✅ Relationships extraídas: {len(relationships_lines)} registros")

def create_verification_queries(output_dir):
    """Crea archivos con queries de verificación"""
    print("Creando queries de verificación...")
    
    verification_queries = """-- Queries de verificación post-migración
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
"""
    
    output_file = os.path.join(output_dir, "05_Verification", "verification_queries.sql")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(verification_queries)
    
    print(f"📁 Queries de verificación creadas: {output_file}")

def create_readme_v2(output_dir):
    """Crea archivo README mejorado"""
    readme_content = """# Migración de WordPress - RadioDos (VERSIÓN MEJORADA)

## Archivos generados según las instrucciones

### Orden de importación recomendado:

1. **01_Posts/posts_migration.sql**
   - Posts reales (post_type='post') únicamente
   - Autores conflictivos (ID 3-36) cambiados a ID 37
   - Excluye revisiones, elementor_library, nav_menu_item
   
2. **02_Attachments/attachments_migration.sql**  
   - Imágenes y archivos adjuntos (post_type='attachment')
   - URLs corregidas para radiodos.aurigital.com
   - Dominios actualizados automáticamente
   
3. **03_Postmeta/postmeta_migration.sql**
   - Solo metadatos críticos: _thumbnail_id, _wp_attached_file, _wp_attachment_metadata
   - Excluye completamente metadatos de plugins (elementor, yoast, etc.)
   - URLs de metadatos corregidas
   
4. **04_Terms_Categories/**
   - terms_migration.sql (todos los términos)
   - term_taxonomy_migration.sql (solo categorías y tags)  
   - term_relationships_migration.sql (todas las relaciones)

### Verificación:

Ejecuta **TODAS** las queries en **05_Verification/verification_queries.sql** después de cada importación.

### Mejoras en esta versión:

✅ Captura TODOS los posts correctamente (no solo algunos)
✅ Procesamiento línea por línea más preciso
✅ Mejor filtrado de metadatos de plugins
✅ URLs corregidas en todos los campos relevantes
✅ Queries de verificación ampliadas
✅ Manejo robusto de conflictos de autores

### Estadísticas esperadas:

- Posts reales: ~9 registros
- Attachments: Variable (depende de imágenes)
- Metadatos críticos: Solo los esenciales
- Términos y relaciones: Completos

### Notas críticas:

- ⚠️ Los usuarios YA están importados (ID 3-36)
- ⚠️ Posts con autores conflictivos se asignaron al usuario ID 37
- ⚠️ Debes crear el usuario ID 37 ANTES de importar posts
- ⚠️ URLs apuntan a radiodos.aurigital.com (verificar CORS)
- ⚠️ Formato optimizado: UN INSERT por tabla
- ⚠️ Codificación UTF-8 preservada

### Crear usuario ID 37 (OBLIGATORIO):

```sql
INSERT INTO wp_users VALUES 
(37, 'admin_radiodos', '$P$B...', 'admin_radiodos', 'admin@radiodos.com', '', '2024-01-01 00:00:00', '', 0, 'Administrador RadioDos');

INSERT INTO wp_usermeta VALUES 
(NULL, 37, 'wp_capabilities', 'a:1:{s:13:"administrator";b:1;}'),
(NULL, 37, 'wp_user_level', '10');
```

### En caso de problemas:

1. Importa por partes, verificando cada paso
2. Ejecuta queries de verificación después de cada importación
3. Si fallan thumbnails, usa regeneración automática
4. Revisa configuración CORS para dominios cruzados
5. Verifica permisos en carpeta wp-content/uploads/
"""
    
    readme_file = os.path.join(output_dir, "README.md")
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"📁 README mejorado creado: {readme_file}")

def main():
    sql_file_path = "../SQL BACKUP_dC2QX.sql"
    output_dir = "."
    
    if not os.path.exists(sql_file_path):
        print(f"❌ Archivo SQL no encontrado: {sql_file_path}")
        return
    
    print("🚀 Iniciando migración MEJORADA de WordPress...")
    print("=" * 60)
    
    # Procesar cada tipo de datos con versiones mejoradas
    extract_all_posts_data(sql_file_path, output_dir)
    print()
    
    extract_postmeta_improved(sql_file_path, output_dir)
    print()
    
    extract_terms_improved(sql_file_path, output_dir)
    print()
    
    create_verification_queries(output_dir)
    print()
    
    create_readme_v2(output_dir)
    print()
    
    print("✅ Migración MEJORADA completada!")
    print("📁 Revisa los archivos en las carpetas correspondientes")
    print("📖 Lee el README.md para instrucciones detalladas")
    print("⚠️  IMPORTANTE: Crea el usuario ID 37 ANTES de importar posts")

if __name__ == "__main__":
    main()
