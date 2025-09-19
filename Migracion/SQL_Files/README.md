# Migración de WordPress - RadioDos (VERSIÓN MEJORADA)

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
