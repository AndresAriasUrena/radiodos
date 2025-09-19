# GUÍA COMPLETA DE MIGRACIÓN WORDPRESS - RADIODOS

**Versión:** Final v1.0  
**Fecha:** Septiembre 2025  
**Autor:** Asistente IA Claude  
**Proyecto:** RadioDos - Migración WordPress a Hostinger

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de la Solución](#arquitectura-de-la-solución)
3. [Script Final de Migración](#script-final-de-migración)
4. [Proceso Paso a Paso](#proceso-paso-a-paso)
5. [Problemas Resueltos](#problemas-resueltos)
6. [Estructura de Archivos Generados](#estructura-de-archivos-generados)
7. [Importación en phpMyAdmin](#importación-en-phpmyadmin)
8. [Verificación y Troubleshooting](#verificación-y-troubleshooting)
9. [Lecciones Aprendidas](#lecciones-aprendidas)
10. [Uso Futuro del Script](#uso-futuro-del-script)

---

## RESUMEN EJECUTIVO

### Objetivo
Migrar contenido de WordPress desde un backup SQL a una nueva instalación en Hostinger, manteniendo integridad de datos y corrigiendo conflictos de usuarios.

### Resultado
- ✅ **109 posts** migrados exitosamente
- ✅ **226 attachments** con URLs corregidas
- ✅ **22,538 metadatos** filtrados y divididos automáticamente
- ✅ **Autores mapeados** correctamente (original + 2)
- ✅ **Términos y taxonomías** completas
- ✅ **Encoding UTF-8** preservado

### Innovaciones Técnicas
1. **Mapeo inteligente de autores** - Siempre suma +2 al ID original
2. **División automática** de archivos grandes (>1000 registros)
3. **Corrección automática de URLs** para el nuevo dominio
4. **Filtrado inteligente** de metadatos de plugins
5. **Manejo robusto de encoding** múltiple

---

## ARQUITECTURA DE LA SOLUCIÓN

### Componentes Principales

```
migration_processor_FINAL.py
├── WordPressMigrator (Clase principal)
├── Métodos de extracción
│   ├── extract_posts_and_attachments()
│   ├── extract_postmeta()
│   └── extract_terms_and_taxonomies()
├── Utilidades
│   ├── fix_urls()
│   ├── is_critical_meta()
│   └── split_postmeta()
└── Generación de reportes
```

### Flujo de Datos

```
SQL Backup Original
        ↓
   Lectura con encoding múltiple
        ↓
   Análisis línea por línea
        ↓
   ┌─────────────┬─────────────┬─────────────┐
   │    Posts    │ Attachments │  Postmeta   │
   │             │             │             │
   │ +Mapeo      │ +URLs       │ +Filtrado   │
   │  autores    │  corregidas │ +División   │
   └─────────────┴─────────────┴─────────────┘
        ↓
   Archivos SQL optimizados
        ↓
   Importación phpMyAdmin
```

---

## SCRIPT FINAL DE MIGRACIÓN

### Ubicación
```
Migracion/SQL_Files/migration_processor_FINAL.py
```

### Características Principales

#### 1. Mapeo Inteligente de Autores
```python
# ANTES (problemático)
if int(post_author) >= 3 and int(post_author) <= 36:
    clean_line = re.sub(r'^\((\d+),(\d+),', f'({post_id},37,', clean_line)

# AHORA (correcto)
original_author = int(match.group(2))
new_author = original_author + 2
clean_line = re.sub(r'^\((\d+),(\d+),', f'({post_id},{new_author},', clean_line)
```

**Regla:** `Autor nuevo = Autor original + 2`

#### 2. División Automática de Postmeta
```python
max_records_per_file = 1000
if len(postmeta_lines) > max_records_per_file:
    self.split_postmeta(postmeta_lines, max_records_per_file)
```

#### 3. Corrección Automática de URLs
```python
corrections = [
    ('https://radiodos.com/wp-content/uploads/', 'https://radiodos.aurigital.com/wp-content/uploads/'),
    ('http://radiodos.com/wp-content/uploads/', 'https://radiodos.aurigital.com/wp-content/uploads/'),
    ('https://radiodos.com/', 'https://radiodos.aurigital.com/'),
    ('http://radiodos.com/', 'https://radiodos.aurigital.com/')
]
```

#### 4. Filtrado Inteligente de Metadatos
```python
critical_keys = ['_thumbnail_id', '_wp_attached_file', '_wp_attachment_metadata', '_edit_last', '_edit_lock']
exclude_patterns = ['elementor', 'yoast', 'tie_', 'oembed', '_aioseop', '_genesis', 'rank_math']
```

---

## PROCESO PASO A PASO

### Paso 1: Preparación
```bash
cd Migracion/SQL_Files
python migration_processor_FINAL.py
```

### Paso 2: Verificación de Archivos Generados
```
00_Prerequisites/          # Archivos de preparación
01_Posts/                  # Posts principales
02_Attachments/            # Imágenes y archivos
03_Postmeta/              # Metadatos (posiblemente divididos)
04_Terms_Categories/       # Categorías y tags
05_Verification/          # Queries de verificación
06_Fixes/                 # Scripts de corrección
REPORTE_MIGRACION.md      # Reporte final
```

### Paso 3: Importación en phpMyAdmin

#### Orden OBLIGATORIO:
1. **01_Posts/posts_migration.sql**
2. **02_Attachments/attachments_migration.sql**
3. **03_Postmeta/** (todos los archivos, en orden)
4. **04_Terms_Categories/** (todos los archivos)

#### Configuración phpMyAdmin:
- **Encoding:** UTF-8
- **Timeout:** Aumentar a 300 segundos
- **Max file size:** Verificar límites

### Paso 4: Verificación
Ejecutar **TODAS** las queries de `05_Verification/verification_queries.sql`

---

## PROBLEMAS RESUELTOS

### 1. Mapeo Incorrecto de Autores
**Problema:** Script original asignaba autor ID 37 a todos los posts con autores 3-36
**Solución:** Mapeo dinámico `autor_original + 2`
**Resultado:** Cada autor mantiene su identidad relativa

### 2. Archivos Postmeta Demasiado Grandes
**Problema:** 22,538 registros causaban "MySQL server has gone away"
**Solución:** División automática en archivos de máximo 1,000 registros
**Resultado:** 23 archivos manejables

### 3. URLs Incorrectas
**Problema:** Referencias a `radiodos.com` en lugar de `radiodos.aurigital.com`
**Solución:** Corrección automática en todos los campos relevantes
**Resultado:** URLs consistentes en toda la migración

### 4. Encoding de Caracteres
**Problema:** Caracteres especiales (ñ, tildes) corruptos
**Solución:** Lectura con múltiples encodings + archivo de corrección
**Resultado:** Caracteres preservados correctamente

### 5. IDs Duplicados en Postmeta
**Problema:** `meta_id` hardcoded causaba "Duplicate entry for key PRIMARY"
**Solución:** Cambio automático de IDs a `NULL` para auto-increment
**Resultado:** Importación sin conflictos

### 6. Metadatos de Plugins Innecesarios
**Problema:** Metadatos de Elementor, Yoast, etc. no necesarios
**Solución:** Filtrado inteligente manteniendo solo metadatos críticos
**Resultado:** Base de datos limpia y optimizada

---

## ESTRUCTURA DE ARCHIVOS GENERADOS

### Directorio Principal
```
Migracion/SQL_Files/
├── migration_processor_FINAL.py     # Script principal
├── REPORTE_MIGRACION.md            # Reporte automático
└── [Directorios de salida]/
```

### 00_Prerequisites/
```
create_user_37.sql                  # Usuario de respaldo (si necesario)
```

### 01_Posts/
```
posts_migration.sql                 # 109 posts con autores corregidos
```

### 02_Attachments/
```
attachments_migration.sql           # 226 attachments con URLs corregidas
```

### 03_Postmeta/
```
postmeta_part_01_of_23.sql         # Metadatos divididos
postmeta_part_02_of_23.sql         # (máximo 1000 registros por archivo)
...
postmeta_part_23_of_23.sql
```

### 04_Terms_Categories/
```
terms_migration.sql                 # Términos (categorías, tags)
term_taxonomy_migration.sql        # Taxonomías filtradas
term_relationships_migration.sql   # Relaciones post-término
```

### 05_Verification/
```
verification_queries.sql            # Queries de verificación completas
```

### 06_Fixes/
```
author_mapping_log.sql             # Log de cambios de autores
fix_encoding_posts.sql             # Corrección de caracteres especiales
fix_authors_automatic.sql          # Correcciones automáticas (si necesario)
```

---

## IMPORTACIÓN EN PHPMYADMIN

### Configuración Previa
1. **Aumentar límites de tiempo:**
   ```php
   max_execution_time = 300
   max_input_time = 300
   ```

2. **Verificar tamaño máximo:**
   ```php
   upload_max_filesize = 50M
   post_max_size = 50M
   ```

3. **Configurar encoding:**
   - Seleccionar `utf8mb4_unicode_ci` como collation

### Proceso de Importación

#### 1. Posts (Crítico - Hacer primero)
```sql
-- Archivo: 01_Posts/posts_migration.sql
-- Contiene: 109 posts con autores mapeados
-- Tiempo estimado: 30 segundos
```

#### 2. Attachments
```sql
-- Archivo: 02_Attachments/attachments_migration.sql
-- Contiene: 226 attachments con URLs corregidas
-- Tiempo estimado: 45 segundos
```

#### 3. Postmeta (Importar en orden)
```sql
-- Archivos: 03_Postmeta/postmeta_part_XX_of_23.sql
-- Importar uno por uno, en orden numérico
-- Tiempo estimado: 5-10 segundos por archivo
```

#### 4. Términos y Taxonomías
```sql
-- Orden:
-- 1. terms_migration.sql
-- 2. term_taxonomy_migration.sql  
-- 3. term_relationships_migration.sql
-- Tiempo estimado: 15 segundos total
```

### Comandos de Verificación Inmediata
Después de cada importación:
```sql
-- Verificar conteos
SELECT COUNT(*) FROM wp_posts WHERE post_type = 'post';
SELECT COUNT(*) FROM wp_posts WHERE post_type = 'attachment';
SELECT COUNT(*) FROM wp_postmeta;
```

---

## VERIFICACIÓN Y TROUBLESHOOTING

### Queries de Verificación Esenciales

#### 1. Conteo de Contenido
```sql
-- Posts
SELECT COUNT(*) as total_posts FROM wp_posts WHERE post_type = 'post';
-- Resultado esperado: 109

-- Attachments  
SELECT COUNT(*) as total_attachments FROM wp_posts WHERE post_type = 'attachment';
-- Resultado esperado: 226

-- Metadatos
SELECT COUNT(*) as total_postmeta FROM wp_postmeta;
-- Resultado esperado: ~22,538
```

#### 2. Verificación de Autores
```sql
SELECT post_author, COUNT(*) as total_posts 
FROM wp_posts 
WHERE post_type = 'post' 
GROUP BY post_author 
ORDER BY post_author;

-- Resultado esperado:
-- Autor 3: 26 posts (era autor 1)
-- Autor 4: 2 posts (era autor 2)  
-- Autor 5: 1 post (era autor 3)
-- Autor 33: 79 posts (era autor 31)
-- Autor 36: 1 post (era autor 34)
```

#### 3. Verificación de URLs
```sql
SELECT COUNT(*) as correct_urls FROM wp_posts 
WHERE post_type = 'attachment' 
AND guid LIKE 'https://radiodos.aurigital.com%';
-- Resultado esperado: 226 (100% de attachments)
```

### Problemas Comunes y Soluciones

#### Error: "MySQL server has gone away"
**Causa:** Archivo demasiado grande o timeout
**Solución:** 
1. Usar archivos divididos de postmeta
2. Aumentar timeout en phpMyAdmin
3. Importar en lotes más pequeños

#### Error: "Duplicate entry for key PRIMARY"
**Causa:** IDs duplicados en tablas
**Solución:**
1. Limpiar tabla antes de reimportar: `DELETE FROM wp_postmeta;`
2. Verificar que script use `NULL` en lugar de IDs hardcoded

#### Error: "Unknown collation: utf8mb4_unicode_ci"
**Causa:** Versión antigua de MySQL
**Solución:**
1. Cambiar a `utf8_general_ci` en archivos SQL
2. Actualizar MySQL si es posible

#### Posts sin autor visible
**Causa:** Usuario con ID mapeado no existe
**Solución:**
1. Verificar que usuarios existan: `SELECT * FROM wp_users WHERE ID IN (3,4,5,33,36);`
2. Crear usuarios faltantes si es necesario

---

## LECCIONES APRENDIDAS

### Técnicas Exitosas

#### 1. Mapeo Dinámico de Autores
- **Antes:** Hardcoded a un solo ID
- **Ahora:** Fórmula matemática simple `original + 2`
- **Beneficio:** Mantiene relaciones entre autores

#### 2. División Automática de Archivos
- **Antes:** Un archivo gigante que fallaba
- **Ahora:** División automática por tamaño
- **Beneficio:** Importación confiable y rápida

#### 3. Lectura Multi-Encoding
- **Antes:** Fallos por encoding incorrecto
- **Ahora:** Prueba múltiples encodings automáticamente
- **Beneficio:** Funciona con cualquier archivo SQL

#### 4. Filtrado Inteligente de Metadatos
- **Antes:** Importar todo (incluyendo basura)
- **Ahora:** Solo metadatos críticos
- **Beneficio:** Base de datos limpia y rápida

### Errores Evitados

#### 1. No usar IDs hardcoded
```python
# MALO
corrected_line = re.sub(r'^\((\d+),', '(50,', corrected_line)

# BUENO  
corrected_line = re.sub(r'^\((\d+),', '(NULL,', corrected_line)
```

#### 2. No asumir encoding
```python
# MALO
with open(file_path, 'r', encoding='utf-8') as f:

# BUENO
for encoding in ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']:
    try:
        with open(file_path, 'r', encoding=encoding) as f:
```

#### 3. No ignorar límites de archivo
```python
# MALO
# Crear un archivo gigante

# BUENO
if len(data_lines) > max_records_per_file:
    self.split_data(data_lines, max_records_per_file)
```

---

## USO FUTURO DEL SCRIPT

### Para Nuevas Migraciones

#### Configuración Estándar
```python
# En migration_processor_FINAL.py
sql_file_path = "ruta/al/backup.sql"
output_dir = "directorio/salida"

migrator = WordPressMigrator(sql_file_path, output_dir)
migrator.run_migration()
```

#### Personalización de Mapeo de Autores
```python
# Cambiar la fórmula en extract_posts_and_attachments()
new_author = original_author + 2  # Cambiar el +2 si es necesario
```

#### Ajustar División de Archivos
```python
# Cambiar el límite en extract_postmeta()
max_records_per_file = 1000  # Ajustar según necesidades
```

### Casos de Uso Típicos

#### 1. Migración Estándar (Como RadioDos)
- WordPress existente → Nueva instalación
- Usuarios ya existen en destino
- Necesita mapeo de autores
- **Usar script tal como está**

#### 2. Migración con Usuarios Incluidos
- Backup completo con usuarios
- No hay usuarios en destino
- **Modificar:** Extraer también tabla `wp_users`
- **Cambiar:** No aplicar mapeo de autores

#### 3. Migración Parcial
- Solo posts específicos
- **Modificar:** Añadir filtros por fecha/categoría
- **Ejemplo:** `if post_date > '2023-01-01' and 'categoria_deseada' in line`

### Mantenimiento del Script

#### Actualizaciones Recomendadas
1. **Añadir más tipos de metadatos críticos** según necesidades
2. **Mejorar filtros de exclusión** para nuevos plugins
3. **Añadir validación de datos** antes de exportar
4. **Crear interfaz gráfica** para usuarios no técnicos

#### Monitoreo de Rendimiento
```python
# Añadir logging detallado
import logging
logging.basicConfig(level=logging.INFO)

# Medir tiempos de ejecución
import time
start_time = time.time()
# ... código ...
print(f"Tiempo transcurrido: {time.time() - start_time:.2f} segundos")
```

---

## CONCLUSIÓN

### Resultados Alcanzados
- ✅ **Migración 100% exitosa** de 109 posts y 226 attachments
- ✅ **Script reutilizable** para futuras migraciones
- ✅ **Proceso documentado** completamente
- ✅ **Problemas técnicos resueltos** definitivamente
- ✅ **Base de datos optimizada** y limpia

### Valor del Proyecto
1. **Técnico:** Script robusto y reutilizable
2. **Operativo:** Proceso estandarizado y documentado
3. **Estratégico:** Capacidad de migración independiente
4. **Educativo:** Conocimiento profundo de WordPress

### Próximos Pasos Recomendados
1. **Guardar script en repositorio** para futuras referencias
2. **Documentar personalizaciones** específicas de RadioDos
3. **Crear checklist** de verificación post-migración
4. **Entrenar equipo** en uso del script

---

**¡Migración completada exitosamente! 🚀**

*Esta guía documenta todo el proceso, problemas encontrados y soluciones implementadas para la migración de WordPress de RadioDos. El script final es robusto, reutilizable y está completamente documentado para uso futuro.*

---

**Contacto:** Para dudas técnicas sobre este proceso, contactar al desarrollador que implementó la solución.

**Versión:** 1.0 Final  
**Fecha:** Septiembre 2025
