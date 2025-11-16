/* ========================================
   Agregar soporte para Google Maps URL
   ======================================== */

/* Paso 1: Agregar columna maps_url */
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS maps_url TEXT;

/* Paso 2: Documentar la columna */
COMMENT ON COLUMN providers.maps_url IS 'URL de Google Maps del negocio. Si está presente, tiene prioridad sobre address/city/state';

/* Paso 3: Crear índice para búsquedas */
CREATE INDEX IF NOT EXISTS idx_providers_maps_url ON providers(maps_url) WHERE maps_url IS NOT NULL;

/* Paso 4: Función helper para obtener ubicación formateada */
CREATE OR REPLACE FUNCTION get_provider_location(
  p_maps_url TEXT,
  p_address TEXT,
  p_city TEXT,
  p_state TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_maps_url IS NOT NULL THEN
    RETURN p_maps_url;
  END IF;
  
  RETURN CONCAT_WS(', ', p_address, p_city, p_state);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_provider_location IS 'Retorna la ubicación del proveedor, priorizando maps_url sobre dirección manual';

/* Ejemplo de uso:
   SELECT id, name, get_provider_location(maps_url, address, city, state) as location FROM providers;
*/
