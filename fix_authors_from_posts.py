#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script INTELIGENTE: Lee posts_migration.sql, extrae IDs, busca autores originales y genera corrección
"""

import re
import os

def read_file_with_encoding(file_path):
    """Lee un archivo intentando diferentes codificaciones"""
    encodings = ["utf-8", "latin1", "cp1252", "iso-8859-1"]
    
    for encoding in encodings:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read()
            print(f"✅ Archivo {file_path} leído con codificación: {encoding}")
            return content
        except UnicodeDecodeError:
            continue
    
    print(f"❌ No se pudo leer el archivo {file_path}")
    return None

def extract_post_ids_from_migration():
    """Extrae todos los IDs de posts del archivo posts_migration.sql"""
    posts_file = "01_Posts/posts_migration.sql"
    
    print("🔍 Leyendo posts_migration.sql...")
    content = read_file_with_encoding(posts_file)
    if content is None:
        return []
    
    post_ids = []
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith('('):
            # Extraer ID del post (primer número después del paréntesis)
            match = re.match(r'^\((\d+),', line)
            if match:
                post_id = int(match.group(1))
                post_ids.append(post_id)
                print(f"Post ID encontrado: {post_id}")
    
    print(f"📊 Total IDs extraídos: {len(post_ids)}")
    return post_ids

def find_original_authors(post_ids):
    """Busca los autores originales de estos posts en el SQL backup"""
    sql_file_path = "../SQL BACKUP_dC2QX.sql"
    
    print("🔍 Leyendo SQL backup original...")
    content = read_file_with_encoding(sql_file_path)
    if content is None:
        return {}
    
    print("🔍 Buscando autores originales...")
    
    # Crear diccionario para mapear ID -> autor original
    post_authors = {}
    lines = content.split('\n')
    
    in_posts_section = False
    
    for line_num, line in enumerate(lines, 1):
        # Detectar sección wp_posts
        if 'INSERT INTO `wp_posts` VALUES' in line:
            in_posts_section = True
            print(f"✅ Encontrada sección wp_posts en línea {line_num}")
        
        # Si estamos en la sección de posts
        if in_posts_section and line.strip().startswith('('):
            # Extraer ID y autor de cada línea
            match = re.match(r'^\((\d+),(\d+),', line.strip())
            if match:
                post_id = int(match.group(1))
                original_author = int(match.group(2))
                
                # Solo guardar si es uno de los IDs que necesitamos
                if post_id in post_ids:
                    post_authors[post_id] = original_author
                    print(f"Post {post_id}: Autor original = {original_author}")
        
        # Fin de sección
        if in_posts_section and ("INSERT INTO" in line and "wp_posts" not in line):
            print(f"✅ Fin de sección wp_posts en línea {line_num}")
            break
    
    print(f"📊 Autores encontrados para {len(post_authors)} posts")
    return post_authors

def generate_author_correction_sql(post_authors):
    """Genera el SQL de corrección de autores"""
    if not post_authors:
        print("❌ No hay datos para generar corrección")
        return
    
    # Crear directorio si no existe
    os.makedirs("06_Fixes", exist_ok=True)
    
    # Generar SQL
    sql_corrections = []
    sql_corrections.append("-- ==========================================")
    sql_corrections.append("-- CORRECCIÓN AUTOMÁTICA DE AUTORES")
    sql_corrections.append("-- Basado en posts_migration.sql + SQL backup")
    sql_corrections.append("-- Regla: Autor original + 2 = Autor correcto")
    sql_corrections.append("-- ==========================================")
    sql_corrections.append("")
    sql_corrections.append("SET NAMES utf8mb4;")
    sql_corrections.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_corrections.append("")
    
    # Estadísticas
    author_stats = {}
    for post_id, original_author in post_authors.items():
        if original_author not in author_stats:
            author_stats[original_author] = []
        author_stats[original_author].append(post_id)
    
    sql_corrections.append("-- ESTADÍSTICAS DE CORRECCIÓN:")
    for orig_author in sorted(author_stats.keys()):
        new_author = orig_author + 2
        count = len(author_stats[orig_author])
        sql_corrections.append(f"-- Autor {orig_author} → {new_author} ({count} posts)")
    sql_corrections.append("")
    
    # Generar UPDATEs
    sql_corrections.append("-- CORRECCIONES INDIVIDUALES:")
    for post_id, original_author in sorted(post_authors.items()):
        new_author = original_author + 2
        sql_line = f"UPDATE wp_posts SET post_author = {new_author} WHERE ID = {post_id} AND post_type = 'post';"
        sql_corrections.append(sql_line)
    
    sql_corrections.append("")
    sql_corrections.append("SET FOREIGN_KEY_CHECKS = 1;")
    sql_corrections.append("")
    sql_corrections.append("-- VERIFICACIÓN FINAL:")
    sql_corrections.append("SELECT post_author, COUNT(*) as total_posts")
    sql_corrections.append("FROM wp_posts")
    sql_corrections.append("WHERE post_type = 'post'")
    sql_corrections.append("GROUP BY post_author")
    sql_corrections.append("ORDER BY post_author;")
    
    # Guardar archivo
    output_file = "06_Fixes/fix_authors_automatic.sql"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_corrections))
    
    print(f"\n✅ ARCHIVO DE CORRECCIÓN CREADO: {output_file}")
    print(f"📝 Total de correcciones: {len(post_authors)}")
    print(f"👥 Autores afectados: {len(author_stats)}")
    print("\n🚀 EJECUTA este archivo en phpMyAdmin para corregir TODOS los autores")

def main():
    """Función principal"""
    print("🔥 SCRIPT DE CORRECCIÓN DE AUTORES")
    print("=" * 50)
    
    # Paso 1: Extraer IDs de posts_migration.sql
    post_ids = extract_post_ids_from_migration()
    if not post_ids:
        print("❌ No se encontraron IDs de posts")
        return
    
    # Paso 2: Buscar autores originales en SQL backup
    post_authors = find_original_authors(post_ids)
    if not post_authors:
        print("❌ No se encontraron autores originales")
        return
    
    # Paso 3: Generar SQL de corrección
    generate_author_correction_sql(post_authors)

if __name__ == "__main__":
    main()
