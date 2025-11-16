-- ============================================================================
-- CONFIGURACIÓN DE STORAGE PARA IMÁGENES DE PROVEEDORES
-- ============================================================================
-- Ejecutar en Supabase SQL Editor para crear bucket y políticas
-- ============================================================================

-- NOTA: El bucket se debe crear desde la interfaz de Supabase Storage primero
-- 1. Ve a Storage en el panel de Supabase
-- 2. Crea un bucket llamado "provider-images"
-- 3. Marca como "Public bucket" para URLs públicas
-- 4. Luego ejecuta este SQL para configurar las políticas

-- ============================================================================
-- POLÍTICAS DE ACCESO AL BUCKET
-- ============================================================================

-- Permitir que cualquiera suba imágenes (para el formulario público)
CREATE POLICY "Permitir INSERT público en provider-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'provider-images');

-- Permitir que cualquiera lea imágenes (URLs públicas)
CREATE POLICY "Permitir SELECT público en provider-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'provider-images');

-- Solo admins pueden eliminar imágenes
CREATE POLICY "Solo admins pueden DELETE en provider-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-images' AND
  auth.jwt() ->> 'role' = 'admin'
);

-- ============================================================================
-- VERIFICAR CONFIGURACIÓN
-- ============================================================================

-- Ver políticas actuales del bucket
SELECT * FROM storage.policies WHERE bucket_id = 'provider-images';

-- Ver archivos subidos
SELECT * FROM storage.objects WHERE bucket_id = 'provider-images' ORDER BY created_at DESC LIMIT 10;
