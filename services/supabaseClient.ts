// Consulta completa de proveedor, servicios, reseñas y media
export async function getProviderFullDetail(provider_id: string) {
  // Consulta proveedor
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('id', provider_id)
    .single();

  // Consulta servicios
  const { data: services, error: servicesError } = await supabase
    .from('provider_services')
    .select('*')
    .eq('provider_id', provider_id);

  // Consulta reseñas
  const { data: reviews, error: reviewsError } = await supabase
    .from('provider_reviews')
    .select('*')
    .eq('provider_id', provider_id)
    .order('created_at', { ascending: false });

  // Consulta media
  const { data: media, error: mediaError } = await supabase
    .from('provider_media')
    .select('*')
    .eq('provider_id', provider_id)
    .order('sort_order', { ascending: true });

  // Consulta categorías del proveedor
  const { data: providerCategories, error: providerCategoriesError } = await supabase
    .from('provider_categories')
    .select('category_id')
    .eq('provider_id', provider_id);

  // Consulta perfiles de usuarios que dejaron reseña
  let profiles = [];
  if (reviews && reviews.length > 0) {
    const userIds = reviews.map(r => r.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .in('id', userIds);
      profiles = profilesData || [];
    }
  }

  return {
    provider,
    services,
    reviews,
    media,
    providerCategories,
    profiles,
    errors: { providerError, servicesError, reviewsError, mediaError, providerCategoriesError }
  };
}
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Función para diagnosticar la estructura de la base de datos
export async function diagnoseDatabaseStructure() {
  console.log('🔧 DIAGNÓSTICO DE BASE DE DATOS SUPABASE');
  console.log('==========================================');
  
  // Verificar conexión básica
  try {
    const { data, error } = await supabase.from('providers').select('*').limit(1);
    console.log('✅ Conexión a Supabase: OK');
    if (data) console.log('📊 Estructura básica providers:', Object.keys(data[0] || {}));
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return { success: false, error };
  }

  // Probar cada tabla individualmente
  const tables = ['providers', 'categories', 'provider_services', 'provider_categories', 'provider_reviews', 'provider_media'];
  const results: Record<string, any> = {};

  for (const table of tables) {
    try {
      console.log(`🔍 Probando tabla: ${table}`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error(`❌ Error en tabla ${table}:`, error.message);
        results[table] = { error: error.message, exists: false };
      } else {
        console.log(`✅ Tabla ${table}: ${count} registros`);
        if (data && data[0]) {
          console.log(`📋 Columnas en ${table}:`, Object.keys(data[0]));
        }
        results[table] = { 
          exists: true, 
          count, 
          columns: data && data[0] ? Object.keys(data[0]) : [],
          sample: data?.[0] || null
        };
      }
    } catch (error) {
      console.error(`🚨 Excepción en tabla ${table}:`, error);
      results[table] = { error: error, exists: false };
    }
  }

  console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log(results);
  console.log('==========================================');
  
  return { success: true, results };
}

// Función para obtener todos los proveedores con datos reales
export async function getAllProviders() {
  console.log('🔍 Intentando obtener proveedores de Supabase...');
  
  try {
    // Primero, vamos a ver qué tablas existen
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .limit(10); // Limitamos para testing

    if (error) {
      console.error('❌ Error al obtener proveedores:', error);
      throw error;
    }

    console.log('✅ Proveedores obtenidos exitosamente:', providers);
    return providers || [];
  } catch (error) {
    console.error('🚨 Error en getAllProviders:', error);
    return [];
  }
}

// Función para obtener categorías reales
export async function getAllCategories() {
  console.log('🔍 Intentando obtener categorías de Supabase...');
  
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('❌ Error al obtener categorías:', error);
      throw error;
    }

    console.log('✅ Categorías obtenidas exitosamente:', categories);
    return categories || [];
  } catch (error) {
    console.error('🚨 Error en getAllCategories:', error);
    return [];
  }
}

// Función para obtener proveedores con sus servicios y categorías
// ✅ IMPORTANTE: Esta función detecta automáticamente nuevos proveedores 
// cuando se agregan a Supabase - NO necesita modificaciones adicionales
export async function getProvidersWithServices() {
  console.log('🔍 Obteniendo TODOS los proveedores de Supabase...');
  
  try {
    // Estrategia: obtener proveedores primero, luego sus relaciones
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('*'); // Obtiene TODOS los proveedores sin límite

    if (providersError) {
      console.error('❌ Error al obtener proveedores:', providersError);
      throw providersError;
    }

    console.log('✅ Proveedores base obtenidos:', providers?.length || 0);

    // Ahora obtener servicios para cada proveedor
    const providersWithServices = await Promise.all(
      (providers || []).map(async (provider) => {
        try {
          const { data: services, error: servicesError } = await supabase
            .from('provider_services')
            .select('*')
            .eq('provider_id', provider.id);

          if (servicesError) {
            console.warn('⚠️ Error al obtener servicios para proveedor', provider.id, servicesError);
          }

          return {
            ...provider,
            services: services || []
          };
        } catch (error) {
          console.warn('⚠️ Error procesando proveedor', provider.id, error);
          return {
            ...provider,
            services: []
          };
        }
      })
    );

    console.log('✅ Proveedores con servicios procesados:', providersWithServices.length);
    console.log('🔄 Los filtros detectarán automáticamente cualquier proveedor nuevo');
    return providersWithServices;

  } catch (error) {
    console.error('🚨 Error en getProvidersWithServices:', error);
    return [];
  }
}