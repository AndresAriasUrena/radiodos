-- Crear usuario ID 37 para posts migrados
-- EJECUTAR ANTES de importar los posts

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Crear el usuario administrador para posts migrados
INSERT INTO wp_users VALUES 
(37, 'admin_radiodos', '$P$BvDfaS1234567890ABCDEF', 'admin_radiodos', 'admin@radiodos.aurigital.com', '', NOW(), '', 0, 'Administrador RadioDos');

-- Asignar capacidades de administrador
INSERT INTO wp_usermeta VALUES 
(NULL, 37, 'wp_capabilities', 'a:1:{s:13:"administrator";b:1;}'),
(NULL, 37, 'wp_user_level', '10'),
(NULL, 37, 'nickname', 'Administrador RadioDos'),
(NULL, 37, 'first_name', 'Administrador'),
(NULL, 37, 'last_name', 'RadioDos'),
(NULL, 37, 'description', 'Usuario creado para posts migrados con conflictos de autor');

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que se creó correctamente
SELECT ID, user_login, user_email, display_name FROM wp_users WHERE ID = 37;
