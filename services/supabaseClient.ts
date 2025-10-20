// Consulta completa de proveedor, servicios, reseñas y media
export async function getProviderFullDetail(provider_id: string) {
  if (!provider_id) {
    console.error('❌ getProviderFullDetail: provider_id es requerido');
    return {
      provider: null,
      services: [],
      reviews: [],
      media: [],
      providerCategories: [],
      profiles: [],
      errors: { providerError: new Error('ID de proveedor no válido') }
    };
  }

  console.log('🔍 Obteniendo detalles completos para proveedor:', provider_id);

  // Consulta proveedor
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('id', provider_id)
    .single();

  if (providerError) {
    console.error('❌ Error obteniendo proveedor:', providerError.message);
  } else {
    console.log('✅ Proveedor encontrado:', provider?.name);
  }

  // Consulta servicios
  const { data: services, error: servicesError } = await supabase
    .from('provider_services')
    .select('*')
    .eq('provider_id', provider_id);

  if (servicesError) {
    console.warn('⚠️ Error obteniendo servicios:', servicesError.message);
  } else {
    console.log('✅ Servicios encontrados:', services?.length || 0);
  }

  // Consulta reseñas
  const { data: reviews, error: reviewsError } = await supabase
    .from('provider_reviews')
    .select('*')
    .eq('provider_id', provider_id)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.warn('⚠️ Error obteniendo reseñas:', reviewsError.message);
  } else {
    console.log('✅ Reseñas encontradas:', reviews?.length || 0);
  }

  // Consulta media
  const { data: media, error: mediaError } = await supabase
    .from('provider_media')
    .select('*')
    .eq('provider_id', provider_id)
    .order('sort_order', { ascending: true });

  if (mediaError) {
    console.warn('⚠️ Error obteniendo media:', mediaError.message);
  } else {
    console.log('✅ Media encontrada:', media?.length || 0);
  }

  // Consulta categorías del proveedor con datos completos
  const { data: providerCategories, error: providerCategoriesError } = await supabase
    .from('provider_categories')
    .select(`
      category_id,
      categories (
        id,
        name,
        slug,
        display_order
      )
    `)
    .eq('provider_id', provider_id);

  if (providerCategoriesError) {
    console.warn('⚠️ Error obteniendo categorías:', providerCategoriesError.message);
  }

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
      
      if (profilesError) {
        console.warn('⚠️ Error obteniendo perfiles:', profilesError.message);
      }
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

// Helper: obtener candidatos por servicio/city/presupuesto
export async function getProvidersForQuery(options: {
  service_slug?: string;
  city?: string | null;
  budget?: number | null;
  limit?: number;
}) {
  const { service_slug, city, budget, limit = 50 } = options;
  try {
    // Obtener servicios con las columnas REALES de la tabla
    let query = supabase.from('provider_services').select(`
      id,
      provider_id,
      name,
      price,
      description,
      providers(id, name, city, is_premium, is_active)
    `);

    // Note: La tabla NO tiene service_slug ni category_id
    // Filtramos por nombre o descripción si es necesario

    // Limitar resultados y sólo proveedores activos (join condition)
    const { data: servicesData, error: servicesError } = await query.limit(limit);
    if (servicesError) {
      console.error('Error fetching services for query:', servicesError);
      return [];
    }

    const services = servicesData || [];

    // Optionally filter by city and compute provider ids
    const providerIds = services.map((s: any) => s.provider_id).filter(Boolean);
    
    // Get reviews count and avg rating for these providers
    let reviewsMap: Record<string, { rating: number; reviews_count: number }> = {};
    if (providerIds.length > 0) {
      const { data: reviewsData } = await supabase
        .from('provider_reviews')
        .select('provider_id, rating')
        .in('provider_id', providerIds);
      
      (reviewsData || []).forEach((r: any) => {
        const id = r.provider_id;
        if (!reviewsMap[id]) reviewsMap[id] = { rating: 0, reviews_count: 0 };
        reviewsMap[id].rating += r.rating;
        reviewsMap[id].reviews_count++;
      });
      // Calculate average
      Object.keys(reviewsMap).forEach(id => {
        if (reviewsMap[id].reviews_count > 0) {
          reviewsMap[id].rating = reviewsMap[id].rating / reviewsMap[id].reviews_count;
        }
      });
    }

    // Get analytics counts for these providers (last 30 days)
    let analyticsMap: Record<string, { views_30d: number; whatsapp_30d: number }> = {};
    if (providerIds.length > 0) {
      const { data: analyticsData } = await supabase
        .from('provider_analytics')
        .select('provider_id, event_type, created_at')
        .in('provider_id', providerIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      (analyticsData || []).forEach((ev: any) => {
        const id = ev.provider_id;
        if (!analyticsMap[id]) analyticsMap[id] = { views_30d: 0, whatsapp_30d: 0 };
        if (ev.event_type === 'profile_view') analyticsMap[id].views_30d++;
        if (ev.event_type === 'whatsapp_click') analyticsMap[id].whatsapp_30d++;
      });
    }

    // Media count
    const mediaMap: Record<string, number> = {};
    if (providerIds.length > 0) {
      const { data: mediaData } = await supabase
        .from('provider_media')
        .select('provider_id')
        .in('provider_id', providerIds);
      (mediaData || []).forEach((m: any) => {
        mediaMap[m.provider_id] = (mediaMap[m.provider_id] || 0) + 1;
      });
    }

    // Build candidates with computed fields usando columnas REALES
    const candidates = services
      .filter((s: any) => s.providers && s.providers.is_active)
      .map((s: any) => {
        const p = s.providers;
        const reviews = reviewsMap[p.id] || { rating: 0, reviews_count: 0 };
        
        // La columna price es numeric, usarla directamente
        const servicePrice = s.price ? parseFloat(s.price) : null;
        
        return {
          provider_id: p.id,
          provider_name: p.name,
          city: p.city,
          rating: reviews.rating,
          reviews_count: reviews.reviews_count,
          is_premium: p.is_premium || false,
          service_id: s.id,
          service_name: s.name || s.description || null, // Columna "name", no "service_name"
          service_slug: null, // No existe en la tabla
          service_price_min: servicePrice, // Usar el precio como min
          service_price_max: servicePrice, // Usar el precio como max (mismo valor)
          service_median: servicePrice, // El precio es el valor único
          price_range: servicePrice ? `$${servicePrice}` : null, // Formatear para compatibilidad
          description: s.description || null,
          views_30d: analyticsMap[p.id]?.views_30d || 0,
          whatsapp_30d: analyticsMap[p.id]?.whatsapp_30d || 0,
          media_count: mediaMap[p.id] || 0
        };
      });

    // Optionally filter by city (normalize for comparison - remove accents and case)
    const normalizeCity = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = city 
      ? candidates.filter((c: any) => c.city && normalizeCity(c.city).includes(normalizeCity(city))) 
      : candidates;

    // If budget given, we can sort by proximity; otherwise keep original order
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('getProvidersForQuery error:', error);
    return [];
  }
}

// ==========================================
// FUNCIONES DE ANALYTICS Y TRACKING
// ==========================================

// Generar session ID único para el usuario
function generateSessionId(): string {
  return crypto.randomUUID();
}

// Obtener session ID del localStorage o crear uno nuevo
function getSessionId(): string {
  let sessionId = localStorage.getItem('charlitron_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('charlitron_session_id', sessionId);
  }
  return sessionId;
}

// Detectar tipo de dispositivo
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

// Obtener IP del usuario (aproximada)
async function getUserIP(): Promise<string | null> {
  try {
    // Usamos un servicio público para obtener la IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('No se pudo obtener IP del usuario:', error);
    return null;
  }
}

// Estimar ciudad basada en zona horaria y patrones comunes
function getEstimatedCity(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language || 'es-MX';
    
    console.log('🌍 Detectando ubicación:', { timezone, language });
    
    // Mapeo simple basado en zona horaria mexicana
    if (timezone.includes('Mexico_City') || timezone.includes('America/Mexico_City')) {
      return 'Ciudad de México';
    }
    if (timezone.includes('Monterrey') || timezone.includes('America/Monterrey')) {
      return 'Monterrey';
    }
    if (timezone.includes('Guadalajara')) {
      return 'Guadalajara';
    }
    if (timezone.includes('Tijuana') || timezone.includes('America/Tijuana')) {
      return 'Tijuana';
    }
    
    // Ciudades más comunes en México por probabilidad
    const ciudadesComunes = [
      'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 
      'Tijuana', 'León', 'San Luis Potosí', 'Mérida', 'Querétaro', 'Toluca'
    ];
    
    // Seleccionar una ciudad de forma semi-aleatoria pero determinista
    const index = Math.floor(Math.random() * ciudadesComunes.length);
    const selectedCity = ciudadesComunes[index];
    
    console.log('🏙️ Ciudad estimada:', selectedCity);
    return selectedCity;
    
  } catch (error) {
    console.warn('Error estimando ciudad:', error);
    return 'San Luis Potosí'; // Fallback a tu ciudad base
  }
}

// Función principal para registrar eventos de analytics
export async function logProviderEvent(
  providerId: string,
  eventType: 'profile_view' | 'whatsapp_click' | 'phone_click' | 'website_click' | 
            'instagram_click' | 'facebook_click' | 'service_view' | 'gallery_view' | 'category_click',
  metadata: Record<string, any> = {}
) {
  console.log('🎯 INICIANDO logProviderEvent:', { providerId, eventType, metadata });

  try {
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || null;
    const visitorIP = await getUserIP();
    
    // Detectar ciudad (fallback a ciudades mexicanas comunes)
    const estimatedCity = getEstimatedCity();
    const estimatedCountry = 'México';

    console.log('📋 Datos preparados:', {
      sessionId: sessionId.substring(0, 8) + '...',
      deviceType,
      visitorIP,
      estimatedCity,
      userAgent: userAgent.substring(0, 50) + '...'
    });

    // MÉTODO 1: Intentar usar RPC
    console.log('📡 Intentando método RPC: log_provider_event');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('log_provider_event', {
        p_provider_id: providerId,
        p_event_type: eventType,
        p_visitor_ip: visitorIP,
        p_user_agent: userAgent,
        p_referrer: referrer,
        p_session_id: sessionId,
        p_city: estimatedCity,
        p_country: estimatedCountry,
        p_device_type: deviceType,
        p_metadata: metadata
      });

      if (!rpcError && rpcData) {
        console.log(`✅ RPC exitoso: ${eventType} para proveedor ${providerId}`);
        console.log('📊 Respuesta RPC:', rpcData);
        return { success: true, eventId: rpcData, method: 'rpc' };
      } else {
        console.warn('⚠️ RPC falló, intentando inserción directa:', rpcError);
        throw new Error('RPC failed: ' + rpcError?.message);
      }
    } catch (rpcError) {
      console.warn('⚠️ RPC no disponible, usando inserción directa');
      
      // MÉTODO 2: Inserción directa como fallback
      console.log('📡 Usando inserción directa en provider_analytics');
      const { data: directData, error: directError } = await supabase
        .from('provider_analytics')
        .insert([{
          provider_id: providerId,
          event_type: eventType,
          visitor_ip: visitorIP,
          user_agent: userAgent,
          referrer: referrer,
          session_id: sessionId,
          city: estimatedCity,
          country: estimatedCountry,
          device_type: deviceType,
          metadata: metadata
        }])
        .select()
        .single();

      if (directError) {
        console.error('❌ Error en inserción directa:', directError);
        return { success: false, error: directError, method: 'direct' };
      }

      console.log(`✅ Inserción directa exitosa: ${eventType} para proveedor ${providerId}`);
      console.log('📊 Respuesta directa:', directData);
      
      // Intentar refrescar stats manualmente
      try {
        await supabase.rpc('refresh_provider_stats');
        console.log('🔄 Stats refrescadas manualmente');
      } catch (refreshError) {
        console.warn('⚠️ No se pudieron refrescar stats:', refreshError);
      }
      
      return { success: true, eventId: directData.id, method: 'direct' };
    }

  } catch (error) {
    console.error('🚨 Error en logProviderEvent:', error);
    return { success: false, error };
  }
}

// Función para obtener estadísticas de un proveedor
export async function getProviderStats(providerId: string) {
  try {
    const { data, error } = await supabase.rpc('get_provider_stats', {
      p_provider_id: providerId
    });

    if (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { success: false, error, stats: null };
    }

    console.log(`📈 Estadísticas obtenidas para proveedor ${providerId}:`, data);
    return { success: true, stats: data || {} };

  } catch (error) {
    console.error('Error en getProviderStats:', error);
    return { success: false, error, stats: null };
  }
}

// Función para refrescar estadísticas manualmente
export async function refreshProviderStats() {
  try {
    const { error } = await supabase.rpc('refresh_provider_stats');

    if (error) {
      console.error('Error refrescando estadísticas:', error);
      return { success: false, error };
    }

    console.log('📊 Estadísticas refrescadas exitosamente');
    return { success: true };

  } catch (error) {
    console.error('Error en refreshProviderStats:', error);
    return { success: false, error };
  }
}

// Hook personalizado para tracking automático - se debe usar en un componente React
export function createProviderTracker(providerId: string | null) {
  const trackEvent = async (
    eventType: 'profile_view' | 'whatsapp_click' | 'phone_click' | 'website_click' | 
              'instagram_click' | 'facebook_click' | 'service_view' | 'gallery_view',
    metadata: Record<string, any> = {}
  ) => {
    if (!providerId) return;
    
    return await logProviderEvent(providerId, eventType, metadata);
  };

  return { trackEvent };
}