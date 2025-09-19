#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT FINAL DE MIGRACIÓN WORDPRESS - RADIODOS
Versión DEFINITIVA que incluye todas las mejoras y lecciones aprendidas

Características:
- Mapeo correcto de autores (+2 siempre)
- División automática de postmeta si es muy grande
- Extracción completa y correcta de todos los datos
- Corrección automática de URLs
- Filtrado inteligente de contenido
"""

import re
import os
import sys
from datetime import datetime

class WordPressMigrator:
    def __init__(self, sql_file_path, output_dir):
        self.sql_file_path = sql_file_path
        self.output_dir = output_dir
        self.content = None
        self.stats = {
            'posts': 0,
            'attachments': 0,
            'postmeta': 0,
            'terms': 0,
            'taxonomies': 0,
            'relationships': 0,
            'authors_mapped': {}
        }
    
    def read_file_with_encoding(self, file_path):
        """Lee un archivo intentando diferentes codificaciones"""
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"✅ Archivo {file_path} leído con codificación: {encoding}")
                return content
            except UnicodeDecodeError:
                continue
        
        print(f"❌ No se pudo leer el archivo {file_path}")
        return None
    
    def create_directories(self):
        """Crea la estructura de directorios necesaria"""
        directories = [
            "00_Prerequisites",
            "01_Posts", 
            "02_Attachments",
            "03_Postmeta",
            "04_Terms_Categories",
            "05_Verification",
            "06_Fixes"
        ]
        
        for directory in directories:
            dir_path = os.path.join(self.output_dir, directory)
            os.makedirs(dir_path, exist_ok=True)
        
        print("📁 Estructura de directorios creada")
    
    def load_sql_content(self):
        """Carga el contenido del archivo SQL"""
        print("🔍 Cargando archivo SQL...")
        self.content = self.read_file_with_encoding(self.sql_file_path)
        if self.content is None:
            return False
        print(f"✅ Archivo SQL cargado ({len(self.content)} caracteres)")
        return True
    
    def extract_posts_and_attachments(self):
        """Extrae posts y attachments por separado con mapeo correcto de autores"""
        print("\n🔍 Procesando posts y attachments...")
        
        lines = self.content.split('\n')
        posts = []
        attachments = []
        
        in_posts_section = False
        
        for line_num, line in enumerate(lines, 1):
            # Detectar sección wp_posts
            if 'INSERT INTO `wp_posts` VALUES' in line:
                in_posts_section = True
                print(f"✅ Encontrada sección wp_posts en línea {line_num}")
            
            # Procesar líneas de datos
            if in_posts_section and line.strip().startswith('('):
                clean_line = line.strip().rstrip(',;')
                
                # Posts reales
                if ",'post'," in line:
                    if not any(bad_type in line for bad_type in ["'revision'", "'elementor_library'", "'nav_menu_item'"]):
                        # Mapear autor correctamente (+2)
                        author_match = re.search(r'^\((\d+),(\d+),', clean_line)
                        if author_match:
                            post_id = author_match.group(1)
                            original_author = int(author_match.group(2))
                            new_author = original_author + 2
                            
                            # Actualizar estadísticas
                            if original_author not in self.stats['authors_mapped']:
                                self.stats['authors_mapped'][original_author] = []
                            self.stats['authors_mapped'][original_author].append(post_id)
                            
                            # Reemplazar autor en la línea
                            clean_line = re.sub(r'^\((\d+),(\d+),', f'({post_id},{new_author},', clean_line)
                            print(f"📝 Post {post_id}: Autor {original_author} → {new_author}")
                        
                        # Corregir caracteres especiales
                        clean_line = self.fix_encoding_issues(clean_line)
                        posts.append(clean_line)
                        self.stats['posts'] += 1
                
                # Attachments
                elif ",'attachment'," in line:
                    # Corregir URLs
                    corrected_line = self.fix_urls(clean_line)
                    attachments.append(corrected_line)
                    self.stats['attachments'] += 1
            
            # Fin de sección
            if in_posts_section and ("INSERT INTO" in line and "wp_posts" not in line):
                if not line.strip().startswith('('):
                    print(f"✅ Fin de sección wp_posts en línea {line_num}")
                    break
        
        # Guardar archivos
        self.save_sql_file("01_Posts", "posts_migration.sql", posts, "wp_posts")
        self.save_sql_file("02_Attachments", "attachments_migration.sql", attachments, "wp_posts")
        
        print(f"✅ Posts extraídos: {self.stats['posts']}")
        print(f"✅ Attachments extraídos: {self.stats['attachments']}")
    
    def extract_postmeta(self):
        """Extrae postmeta con división automática si es muy grande"""
        print("\n🔍 Procesando postmeta...")
        
        lines = self.content.split('\n')
        postmeta_lines = []
        
        in_postmeta_section = False
        
        for line_num, line in enumerate(lines, 1):
            if 'INSERT INTO `wp_postmeta` VALUES' in line:
                in_postmeta_section = True
                print(f"✅ Encontrada sección wp_postmeta en línea {line_num}")
            
            if in_postmeta_section and line.strip().startswith('('):
                clean_line = line.strip().rstrip(',;')
                
                # Filtrar metadatos críticos
                if self.is_critical_meta(line):
                    corrected_line = self.fix_urls(clean_line)
                    # Cambiar meta_id por NULL para auto-increment
                    corrected_line = re.sub(r'^\((\d+),', '(NULL,', corrected_line)
                    postmeta_lines.append(corrected_line)
                    self.stats['postmeta'] += 1
            
            if in_postmeta_section and ("INSERT INTO" in line and "wp_postmeta" not in line):
                if not line.strip().startswith('('):
                    print(f"✅ Fin de sección wp_postmeta en línea {line_num}")
                    break
        
        # División automática si es muy grande
        max_records_per_file = 1000
        if len(postmeta_lines) > max_records_per_file:
            print(f"📊 Postmeta muy grande ({len(postmeta_lines)} registros), dividiendo...")
            self.split_postmeta(postmeta_lines, max_records_per_file)
        else:
            self.save_sql_file("03_Postmeta", "postmeta_migration.sql", postmeta_lines, "wp_postmeta")
        
        print(f"✅ Postmeta extraído: {self.stats['postmeta']} registros")
    
    def split_postmeta(self, postmeta_lines, max_per_file):
        """Divide postmeta en archivos más pequeños"""
        total_files = (len(postmeta_lines) + max_per_file - 1) // max_per_file
        
        for i in range(total_files):
            start_idx = i * max_per_file
            end_idx = min(start_idx + max_per_file, len(postmeta_lines))
            chunk = postmeta_lines[start_idx:end_idx]
            
            filename = f"postmeta_part_{i+1:02d}_of_{total_files:02d}.sql"
            self.save_sql_file("03_Postmeta", filename, chunk, "wp_postmeta")
            print(f"📁 Creado: {filename} ({len(chunk)} registros)")
    
    def extract_terms_and_taxonomies(self):
        """Extrae términos, taxonomías y relaciones"""
        print("\n🔍 Procesando términos y taxonomías...")
        
        # Extraer cada tabla
        terms = self.extract_table_data('wp_terms')
        taxonomies = self.extract_table_data('wp_term_taxonomy')
        relationships = self.extract_table_data('wp_term_relationships')
        
        # Filtrar solo categorías y tags
        valid_taxonomies = []
        for line in taxonomies:
            if "'category'" in line or "'post_tag'" in line:
                valid_taxonomies.append(line)
        
        self.stats['terms'] = len(terms)
        self.stats['taxonomies'] = len(valid_taxonomies)
        self.stats['relationships'] = len(relationships)
        
        # Guardar archivos
        if terms:
            self.save_sql_file("04_Terms_Categories", "terms_migration.sql", terms, "wp_terms")
        if valid_taxonomies:
            self.save_sql_file("04_Terms_Categories", "term_taxonomy_migration.sql", valid_taxonomies, "wp_term_taxonomy")
        if relationships:
            self.save_sql_file("04_Terms_Categories", "term_relationships_migration.sql", relationships, "wp_term_relationships")
        
        print(f"✅ Terms: {self.stats['terms']}, Taxonomies: {self.stats['taxonomies']}, Relationships: {self.stats['relationships']}")
    
    def extract_table_data(self, table_name):
        """Extrae datos de una tabla específica"""
        lines = self.content.split('\n')
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
    
    def is_critical_meta(self, line):
        """Determina si un metadato es crítico"""
        critical_keys = [
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
        
        is_critical = any(key in line for key in critical_keys)
        is_excluded = any(pattern in line.lower() for pattern in exclude_patterns)
        
        return is_critical and not is_excluded
    
    def fix_urls(self, line):
        """Corrige URLs para el dominio correcto"""
        corrections = [
            ('https://radiodos.com/wp-content/uploads/', 'https://radiodos.aurigital.com/wp-content/uploads/'),
            ('http://radiodos.com/wp-content/uploads/', 'https://radiodos.aurigital.com/wp-content/uploads/'),
            ('https://radiodos.com/', 'https://radiodos.aurigital.com/'),
            ('http://radiodos.com/', 'https://radiodos.aurigital.com/')
        ]
        
        corrected_line = line
        for old_url, new_url in corrections:
            corrected_line = corrected_line.replace(old_url, new_url)
        
        return corrected_line
    
    def fix_encoding_issues(self, line):
        """Corrige problemas de encoding de caracteres especiales"""
        # Usar replace directo para evitar problemas con caracteres especiales
        fixed_line = line
        fixed_line = fixed_line.replace('Ã¡', 'á')
        fixed_line = fixed_line.replace('Ã©', 'é')
        fixed_line = fixed_line.replace('Ã­', 'í')
        fixed_line = fixed_line.replace('Ã³', 'ó')
        fixed_line = fixed_line.replace('Ãº', 'ú')
        fixed_line = fixed_line.replace('Ã±', 'ñ')
        fixed_line = fixed_line.replace('Ã¼', 'ü')
        
        return fixed_line
    
    def save_sql_file(self, directory, filename, data_lines, table_name):
        """Guarda un archivo SQL con el formato correcto"""
        if not data_lines:
            return
        
        header = f"""SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO {table_name} VALUES"""
        
        footer = ";\n\nSET FOREIGN_KEY_CHECKS = 1;"
        
        content = header + "\n" + ",\n".join(data_lines) + footer
        
        output_path = os.path.join(self.output_dir, directory, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"📁 Creado: {directory}/{filename}")
    
    def create_verification_queries(self):
        """Crea queries de verificación"""
        queries = """-- QUERIES DE VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar después de importar todos los archivos

-- 1. Contar posts importados
SELECT COUNT(*) as total_posts FROM wp_posts WHERE post_type = 'post';

-- 2. Contar attachments importados
SELECT COUNT(*) as total_attachments FROM wp_posts WHERE post_type = 'attachment';

-- 3. Verificar mapeo de autores
SELECT post_author, COUNT(*) as total_posts 
FROM wp_posts 
WHERE post_type = 'post' 
GROUP BY post_author 
ORDER BY post_author;

-- 4. Posts con thumbnail
SELECT COUNT(*) as posts_with_thumbnail FROM wp_posts p 
JOIN wp_postmeta pm ON p.ID = pm.post_id 
WHERE p.post_type = 'post' AND pm.meta_key = '_thumbnail_id';

-- 5. Verificar URLs de attachments
SELECT COUNT(*) as correct_urls FROM wp_posts 
WHERE post_type = 'attachment' 
AND guid LIKE 'https://radiodos.aurigital.com%';

-- 6. Categorías y tags
SELECT taxonomy, COUNT(*) as total 
FROM wp_term_taxonomy 
WHERE taxonomy IN ('category', 'post_tag') 
GROUP BY taxonomy;

-- 7. Mostrar algunos posts para verificar
SELECT ID, post_title, post_author, post_status 
FROM wp_posts 
WHERE post_type = 'post' 
ORDER BY ID 
LIMIT 10;
"""
        
        output_path = os.path.join(self.output_dir, "05_Verification", "verification_queries.sql")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(queries)
        
        print("📁 Queries de verificación creadas")
    
    def create_author_fix_script(self):
        """Crea script para corregir autores si es necesario"""
        if not self.stats['authors_mapped']:
            return
        
        corrections = []
        corrections.append("-- CORRECCIONES DE AUTORES APLICADAS AUTOMÁTICAMENTE")
        corrections.append("-- Este archivo documenta los cambios realizados")
        corrections.append("")
        
        for original_author, post_ids in self.stats['authors_mapped'].items():
            new_author = original_author + 2
            corrections.append(f"-- Autor {original_author} → {new_author} ({len(post_ids)} posts)")
            
            for post_id in post_ids:
                corrections.append(f"-- Post {post_id}: Autor cambiado automáticamente")
        
        corrections.append("")
        corrections.append("-- Si necesitas revertir cambios:")
        for original_author, post_ids in self.stats['authors_mapped'].items():
            new_author = original_author + 2
            for post_id in post_ids:
                corrections.append(f"-- UPDATE wp_posts SET post_author = {original_author} WHERE ID = {post_id};")
        
        output_path = os.path.join(self.output_dir, "06_Fixes", "author_mapping_log.sql")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(corrections))
        
        print("📁 Log de mapeo de autores creado")
    
    def create_encoding_fix_script(self):
        """Crea script para corregir caracteres especiales"""
        encoding_fixes = """-- CORRECCIÓN DE CARACTERES ESPECIALES
-- Ejecutar DESPUÉS de importar posts si hay problemas de encoding

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Corregir títulos de posts
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã±', 'ñ') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã¼', 'ü') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã', 'Á') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã‰', 'É') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã"', 'Ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ãš', 'Ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_title = REPLACE(post_title, 'Ã'', 'Ñ') WHERE post_type = 'post';

-- Corregir contenido de posts
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã±', 'ñ') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã¼', 'ü') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã', 'Á') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã‰', 'É') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã"', 'Ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ãš', 'Ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_content = REPLACE(post_content, 'Ã'', 'Ñ') WHERE post_type = 'post';

-- Corregir excerpts
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã¡', 'á') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã©', 'é') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã­', 'í') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã³', 'ó') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ãº', 'ú') WHERE post_type = 'post';
UPDATE wp_posts SET post_excerpt = REPLACE(post_excerpt, 'Ã±', 'ñ') WHERE post_type = 'post';

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar correcciones
SELECT post_title FROM wp_posts WHERE post_type = 'post' AND (
    post_title LIKE '%Ã%' OR post_content LIKE '%Ã%'
) LIMIT 5;
"""
        
        output_path = os.path.join(self.output_dir, "06_Fixes", "fix_encoding_posts.sql")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(encoding_fixes)
        
        print("📁 Script de corrección de encoding creado")
    
    def extract_users(self):
        """Extrae usuarios del SQL original y crea script con mapeo +2"""
        print("\n🔍 Procesando usuarios...")
        
        lines = self.content.split('\n')
        users_lines = []
        usermeta_lines = []
        
        # Extraer usuarios
        in_users_section = False
        for line in lines:
            if 'INSERT INTO `wp_users` VALUES' in line:
                in_users_section = True
                print("✅ Encontrada sección wp_users")
            
            if in_users_section and line.strip().startswith('('):
                clean_line = line.strip().rstrip(',;')
                # Mapear user ID (+2)
                user_match = re.search(r'^\((\d+),', clean_line)
                if user_match:
                    original_id = int(user_match.group(1))
                    new_id = original_id + 2
                    clean_line = re.sub(r'^\((\d+),', f'({new_id},', clean_line)
                    print(f"👤 Usuario {original_id} → {new_id}")
                
                users_lines.append(clean_line)
            
            if in_users_section and ("INSERT INTO" in line and "wp_users" not in line):
                if not line.strip().startswith('('):
                    break
        
        # Extraer usermeta
        in_usermeta_section = False
        for line in lines:
            if 'INSERT INTO `wp_usermeta` VALUES' in line:
                in_usermeta_section = True
                print("✅ Encontrada sección wp_usermeta")
            
            if in_usermeta_section and line.strip().startswith('('):
                clean_line = line.strip().rstrip(',;')
                # Mapear user_id en usermeta (+2)
                meta_match = re.search(r'^\((\d+),(\d+),', clean_line)
                if meta_match:
                    meta_id = meta_match.group(1)
                    original_user_id = int(meta_match.group(2))
                    new_user_id = original_user_id + 2
                    clean_line = re.sub(r'^\((\d+),(\d+),', f'(NULL,{new_user_id},', clean_line)
                
                usermeta_lines.append(clean_line)
            
            if in_usermeta_section and ("INSERT INTO" in line and "wp_usermeta" not in line):
                if not line.strip().startswith('('):
                    break
        
        # Guardar archivos
        if users_lines:
            self.save_sql_file("00_Prerequisites", "users_migration.sql", users_lines, "wp_users")
            print(f"✅ Usuarios extraídos: {len(users_lines)}")
        
        if usermeta_lines:
            self.save_sql_file("00_Prerequisites", "usermeta_migration.sql", usermeta_lines, "wp_usermeta")
            print(f"✅ Usermeta extraído: {len(usermeta_lines)}")
    
    def create_final_report(self):
        """Crea reporte final de la migración"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""# REPORTE FINAL DE MIGRACIÓN - RADIODOS
Fecha: {timestamp}

## ESTADÍSTICAS DE MIGRACIÓN

### Contenido extraído:
- Posts reales: {self.stats['posts']}
- Attachments: {self.stats['attachments']}
- Metadatos críticos: {self.stats['postmeta']}
- Términos: {self.stats['terms']}
- Taxonomías: {self.stats['taxonomies']}
- Relaciones: {self.stats['relationships']}

### Mapeo de autores aplicado:
"""
        
        for original_author, post_ids in self.stats['authors_mapped'].items():
            new_author = original_author + 2
            report += f"- Autor {original_author} → {new_author} ({len(post_ids)} posts)\n"
        
        report += """
## ORDEN DE IMPORTACIÓN RECOMENDADO:

1. **01_Posts/posts_migration.sql**
   - Posts con autores corregidos automáticamente
   
2. **02_Attachments/attachments_migration.sql**
   - URLs corregidas para radiodos.aurigital.com
   
3. **03_Postmeta/** (todos los archivos)
   - Solo metadatos críticos
   - IDs cambiados a NULL para auto-increment
   
4. **04_Terms_Categories/** (todos los archivos)
   - Términos, taxonomías y relaciones
   
5. **05_Verification/verification_queries.sql**
   - Ejecutar TODAS las queries para verificar

## NOTAS IMPORTANTES:

✅ Autores mapeados correctamente (original + 2)
✅ URLs corregidas automáticamente
✅ Postmeta dividido si era necesario
✅ Solo metadatos críticos incluidos
✅ Formato optimizado para importación
✅ Codificación UTF-8 preservada

## PRÓXIMOS PASOS:

1. Importar archivos en el orden indicado
2. Ejecutar queries de verificación
3. Revisar que todo funcione correctamente
4. Aplicar correcciones de encoding si es necesario

¡Migración completada exitosamente! 🚀
"""
        
        output_path = os.path.join(self.output_dir, "REPORTE_MIGRACION.md")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("📁 Reporte final creado")
    
    def run_migration(self):
        """Ejecuta la migración completa"""
        print("🚀 INICIANDO MIGRACIÓN FINAL DE WORDPRESS")
        print("=" * 60)
        
        # Verificar archivo fuente
        if not os.path.exists(self.sql_file_path):
            print(f"❌ Archivo SQL no encontrado: {self.sql_file_path}")
            return False
        
        # Crear estructura
        self.create_directories()
        
        # Cargar contenido
        if not self.load_sql_content():
            return False
        
        # Procesar datos
        self.extract_posts_and_attachments()
        self.extract_postmeta()
        self.extract_terms_and_taxonomies()
        
        # Crear archivos auxiliares
        self.create_verification_queries()
        self.create_author_fix_script()
        self.create_encoding_fix_script()
        self.extract_users()
        self.create_final_report()
        
        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("📁 Revisa REPORTE_MIGRACION.md para detalles")
        print("🔍 Ejecuta queries de verificación después de importar")
        
        return True

def main():
    sql_file_path = "./SQL BACKUP_dC2QX.sql"
    output_dir = "."
    
    migrator = WordPressMigrator(sql_file_path, output_dir)
    migrator.run_migration()

if __name__ == "__main__":
    main()
