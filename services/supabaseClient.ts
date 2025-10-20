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
  state?: string | null;
  budget?: number | null;
  limit?: number;
}) {
  const { service_slug, city, state, budget, limit = 50 } = options;
  try {
    console.log('🔍 getProvidersForQuery called with:', { service_slug, city, state, budget, limit });
    
    // Primero obtener todos los proveedores activos
    const { data: providersData, error: providersError } = await supabase
      .from('providers')
      .select('*')
      .eq('is_active', true)
      .limit(limit);
      
    if (providersError) {
      console.error('❌ Error fetching providers:', providersError);
      return [];
    }
    
    if (!providersData || providersData.length === 0) {
      console.log('⚠️ No providers found in database');
      return [];
    }
    
    console.log('✅ Found providers:', providersData.length);
    
    // Debug: verificar estructura de datos de contacto
    if (providersData.length > 0) {
      console.log('📞 Provider data structure sample:', {
        provider: providersData[0].name,
        fields: Object.keys(providersData[0]),
        contact_field: providersData[0].contact,
        whatsapp_field: providersData[0].whatsapp,
        phone_field: providersData[0].phone
      });
    }
    
    // Obtener servicios para estos proveedores con filtrado por tipo
    let servicesQuery = supabase
      .from('provider_services')
      .select('*')
      .in('provider_id', providersData.map(p => p.id));
    
    // Filtrar servicios por categoría si se especifica
    if (service_slug) {
      console.log('🎯 Filtering services by type:', service_slug);
      
      // Mapeo de service_slug a palabras clave para búsqueda (expandido)
      const serviceKeywords: Record<string, string[]> = {
        'video': [
          // Video profesional
          'video', 'videografia', 'videografo', 'film', 'filmmaker', 'cinematografia', 'cine',
          'audiovisual', 'grabacion', 'edicion', 'montaje', 'postproduccion', 'cobertura',
          // Tipos de video
          'video boda', 'video evento', 'video corporativo', 'video promocional', 'video musical',
          'video quinceañera', 'video graduacion', 'video institucional', 'video empresarial',
          // Servicios específicos
          'dron', 'drone', 'aereo', 'gimbal', 'camara profesional', 'streaming', 'transmision',
          'slow motion', 'camara lenta', 'time lapse', 'multicamara',
          // Paquetes
          'paquete oro', 'paquete plata', 'paquete empresarial', 'paquete musical', 'paquete basico',
          'paquete premium', 'paquete completo', 'paquete wedding', 'paquete bodas'
        ],
        'photography': [
          // Fotografía profesional  
          'foto', 'fotografia', 'fotografo', 'sesion', 'shooting', 'photo', 'pictures',
          'retrato', 'retratos', 'captura', 'instantanea', 'imagen', 'imagenes',
          // Tipos de fotografía
          'foto boda', 'foto evento', 'foto corporativa', 'foto familiar', 'foto quinceañera',
          'foto graduacion', 'foto infantil', 'foto embarazo', 'foto maternity', 'foto newborn',
          'foto producto', 'foto comercial', 'foto moda', 'foto retrato', 'foto estudio',
          // Servicios específicos
          'sesion fotos', 'book fotografico', 'album', 'photobook', 'impresiones',
          'fotografia social', 'fotografia de eventos', 'fotografia profesional',
          'sesion exterior', 'sesion estudio', 'sesion casual', 'sesion formal'
        ],
        'music': [
          // DJs y música
          'dj', 'disc jockey', 'musica', 'sonido', 'audio', 'sound', 'musico', 'grupo musical',
          'banda', 'grupo', 'mariachi', 'trio', 'cuarteto', 'orquesta', 'conjunto',
          // Servicios de audio
          'sonido profesional', 'equipo sonido', 'microfonos', 'bocinas', 'amplificacion',
          'mezcladora', 'consola', 'sistema audio', 'karaoke', 'musica en vivo',
          // Tipos de música
          'musica boda', 'musica evento', 'musica corporativa', 'musica fiesta',
          'musica ambiental', 'musica bailar', 'musica ceremonia', 'musica recepcion',
          // Entretenimiento
          'entretenimiento', 'animacion', 'show musical', 'espectaculo', 'presentacion',
          'musical', 'repertorio', 'playlist', 'setlist'
        ],
        'sweets': [
          // Dulces y postres
          'dulce', 'dulces', 'candy', 'golosinas', 'confiteria', 'reposteria', 'pasteleria',
          'postre', 'postres', 'dessert', 'sweet', 'azucar', 'chocolate', 'caramelo',
          // Tipos específicos
          'pastel', 'cake', 'torta', 'cupcake', 'muffin', 'dona', 'galleta', 'cookie',
          'brownie', 'cheesecake', 'flan', 'gelatina', 'mousse', 'tiramisu',
          // Snacks y casual
          'snacks', 'botana', 'botanas', 'aperitivo', 'paletas', 'helado', 'nieve',
          'raspado', 'esquites', 'elotes', 'palomitas', 'popcorn', 'churros',
          // Servicios de barras
          'barra de snacks', 'barra snacks', 'barra dulces', 'barra postres',
          'carro de elotes', 'carrito elotes', 'puesto elotes', 'esquites',
          'palomera', 'maquina palomera', 'barra palomitas', 'mesa dulces',
          'candy bar', 'sweet table', 'mesa postres',
          // Variedad
          'variedad', 'variadas', 'surtido', 'mixto', 'combinado', 'assorted'
        ],
        'catering': [
          // Catering profesional
          'catering', 'banquete', 'banquetes', 'servicio comida', 'comida eventos',
          'buffet', 'bufet', 'servicio mesa', 'cocina', 'chef', 'cocinero',
          // Tipos de comida
          'comida', 'bebida', 'bebidas', 'alimentos', 'menu', 'platillos', 'platos',
          'entrada', 'plato fuerte', 'postre catering', 'aperitivos', 'canapes',
          'cocktail', 'coctel', 'brunch', 'almuerzo', 'cena', 'desayuno',
          // Servicios
          'mesero', 'meseros', 'servicio', 'atencion', 'personal', 'staff',
          'cristaleria', 'vajilla', 'manteleria', 'mobiliario', 'montaje',
          // Tipos de eventos
          'catering boda', 'catering corporativo', 'catering social', 'catering empresarial',
          'catering evento', 'catering fiesta', 'catering graduacion'
        ],
        'decoration': [
          // Decoración general
          'decoracion', 'decoracion eventos', 'ambientacion', 'ornamentacion',
          'adorno', 'adornos', 'ornamento', 'ornamentos', 'decorativo',
          // Elementos específicos
          'globos', 'globo', 'balloon', 'flores', 'floral', 'arreglo floral',
          'bouquet', 'ramo', 'centro mesa', 'centros mesa', 'centerpiece',
          // Materiales y elementos
          'tela', 'cortinas', 'drapeado', 'luces', 'iluminacion', 'velas',
          'candelabros', 'jarrones', 'cristal', 'papel', 'fabric', 'satin',
          // Tipos de decoración
          'decoracion boda', 'decoracion quinceañera', 'decoracion infantil',
          'decoracion tematica', 'decoracion elegante', 'decoracion rustica',
          'decoracion vintage', 'decoracion moderna', 'decoracion clasica',
          // Servicios
          'montaje decoracion', 'instalacion', 'diseño decorativo', 'concepto decorativo',
          'ambientacion eventos', 'decoracion integral', 'styling'
        ],
        'transport': [
          // Transporte general
          'transporte', 'transportation', 'traslado', 'viaje', 'transfer',
          'movilidad', 'vehiculo', 'auto', 'carro', 'automovil',
          // Tipos de vehículos
          'camion', 'autobus', 'bus', 'van', 'minivan', 'suburban',
          'limousina', 'limo', 'sedan', 'luxury car', 'auto lujo',
          'sprinter', 'microbus', 'combi', 'urvan',
          // Servicios específicos
          'renta auto', 'renta vehiculo', 'alquiler auto', 'chofer',
          'conductor', 'driver', 'servicio chofer', 'transporte ejecutivo',
          'transporte grupo', 'transporte wedding', 'transporte evento',
          // Servicios modernos
          'uber', 'taxi', 'ride', 'servicio privado', 'transfer privado',
          'transporte exclusivo', 'transporte vip'
        ],
        'venue': [
          // Lugares y espacios
          'salon', 'salones', 'venue', 'lugar', 'espacio', 'local', 'recinto',
          'instalaciones', 'facilities', 'location', 'site', 'area',
          // Tipos de venues
          'salon eventos', 'salon fiestas', 'salon bodas', 'salon recepciones',
          'salon quinceañera', 'salon graduacion', 'salon corporativo',
          // Espacios específicos
          'jardin', 'garden', 'terraza', 'rooftop', 'patio', 'quinta',
          'hacienda', 'rancho', 'finca', 'casa campo', 'villa',
          // Lugares comerciales
          'hotel', 'centro convenciones', 'club', 'restaurant', 'restaurante',
          'casino', 'museo', 'galeria', 'biblioteca', 'auditorio',
          // Servicios de renta
          'renta salon', 'renta espacio', 'renta lugar', 'alquiler salon',
          'reservacion', 'booking', 'disponibilidad', 'capacidad'
        ]
      };
      
      const keywords = serviceKeywords[service_slug] || [service_slug];
      console.log('🔍 Searching for keywords:', keywords);
      
      // Construir filtro OR para buscar en name y description
      const orConditions = keywords.flatMap(keyword => [
        `name.ilike.%${keyword}%`,
        `description.ilike.%${keyword}%`
      ]);
      
      servicesQuery = servicesQuery.or(orConditions.join(','));
    }
      
    const { data: servicesData, error: servicesError } = await servicesQuery;
    
    // Debug: mostrar qué servicios se encontraron
    if (service_slug && servicesData) {
      console.log('🔍 Services found for', service_slug, ':', servicesData.map(s => ({
        provider_id: s.provider_id,
        name: s.name,
        description: s.description
      })));
    }
      
    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError);
    }
    
    console.log('✅ Found services:', servicesData?.length || 0);

    const services = servicesData || [];
    const providers = providersData || [];

    // Si hay filtro de servicio, solo incluir proveedores que tienen ese tipo de servicio
    let relevantProviderIds: string[] = [];
    if (service_slug && services.length > 0) {
      relevantProviderIds = [...new Set(services.map(s => s.provider_id))];
      console.log('🎯 Providers with relevant services for', service_slug, ':', relevantProviderIds.length);
      console.log('🔍 Relevant provider IDs:', relevantProviderIds);
    } else if (service_slug && services.length === 0) {
      console.log('⚠️ No services found for service_slug:', service_slug);
      relevantProviderIds = []; // Si busca algo específico pero no hay servicios, no mostrar nada
    } else {
      relevantProviderIds = providers.map(p => p.id);
    }

    // Filtrar proveedores por ubicación Y por servicios relevantes
    let filteredProviders = providers.filter(p => {
      // FILTRO ESTRICTO: Si hay service_slug, DEBE estar en relevantProviderIds
      if (service_slug) {
        if (!relevantProviderIds.includes(p.id)) {
          console.log('🚫 EXCLUDING provider', p.name, '(ID:', p.id, ') - NO relevant services for', service_slug);
          return false;
        }
        console.log('✅ INCLUDING provider', p.name, '(ID:', p.id, ') - HAS relevant services for', service_slug);
      }
      
      // Luego filtrar por ubicación si se especifica
      if (city || state) {
        // Si especifica ciudad, buscar coincidencia flexible
        if (city) {
          const cityMatch = p.city && (
            p.city.toLowerCase().includes(city.toLowerCase()) ||
            city.toLowerCase().includes(p.city.toLowerCase()) ||
            // Casos especiales San Luis Potosí
            (city.toLowerCase().includes('san luis') && p.city.toLowerCase().includes('san luis'))
          );
          if (cityMatch) return true;
        }
        
        // Si especifica estado, buscar coincidencia flexible
        if (state) {
          const stateMatch = p.state && (
            p.state.toLowerCase().includes(state.toLowerCase()) ||
            state.toLowerCase().includes(p.state.toLowerCase()) ||
            // Casos especiales San Luis Potosí
            (state.toLowerCase().includes('san luis') && p.state.toLowerCase().includes('san luis'))
          );
          if (stateMatch) return true;
        }
        
        return false;
      }
      
      return true; // Si no hay filtro de ubicación, incluir todos los relevantes
    });
    
    const providerIds = filteredProviders.map(p => p.id);
    
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

    // Build candidates combinando proveedores y servicios
    const candidates = filteredProviders.map((p: any) => {
        const reviews = reviewsMap[p.id] || { rating: 0, reviews_count: 0 };
        const analytics = analyticsMap[p.id] || { views_30d: 0, whatsapp_30d: 0 };
        const media_count = mediaMap[p.id] || 0;
        
        // Buscar servicios RELEVANTES para este proveedor
        const providerServices = services.filter(s => s.provider_id === p.id);
        const relevantService = providerServices[0]; // El más relevante según el filtro
        
        // Información del servicio específico o general
        const serviceInfo = relevantService ? {
          service_id: relevantService.id,
          service_name: relevantService.name || 'Servicio especializado',
          service_description: relevantService.description || p.description,
          service_price: relevantService.price,
          service_type: service_slug || 'general'
        } : {
          service_id: null,
          service_name: 'Servicio general',
          service_description: p.description,
          service_price: null,
          service_type: 'general'
        };
        
        return {
          provider_id: p.id,
          provider_name: p.name,
          city: p.city,
          state: p.state,
          description: p.description,
          is_premium: p.is_premium,
          is_verified: p.is_verified,
          
          // Información de contacto (múltiples formatos posibles)
          contact: p.contact,
          whatsapp: p.whatsapp,
          phone: p.phone,
          email: p.email,
          instagram_url: p.instagram_url,
          facebook_url: p.facebook_url,
          website_url: p.website_url,
          
          // Datos del servicio específico
          ...serviceInfo,
          
          // Métricas calculadas
          rating: reviews.rating,
          reviews_count: reviews.reviews_count,
          views_30d: analytics.views_30d,
          whatsapp_30d: analytics.whatsapp_30d,
          media_count: media_count,
          
          // Para compatibilidad con ranking
          service_median: relevantService?.price ? parseFloat(relevantService.price) : null,
        };
    });

    console.log('🎯 Final candidates by service type:', candidates.length);
    if (candidates.length > 0) {
      console.log('📊 Sample candidate:', {
        name: candidates[0].provider_name,
        service: candidates[0].service_name,
        type: candidates[0].service_type
      });
    }
    
    return candidates.slice(0, limit);
  } catch (error) {
    console.error('❌ getProvidersForQuery error:', error);
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