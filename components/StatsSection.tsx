import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface Stats {
  totalProviders: number;
  totalCategories: number;
  totalReviews: number;
  averageRating: number;
  premiumProviders: number;
  activeCities: number;
}

const StatsSection: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalProviders: 0,
    totalCategories: 0,
    totalReviews: 0,
    averageRating: 0,
    premiumProviders: 0,
    activeCities: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRealTimeUpdate, setIsRealTimeUpdate] = useState(false);

  // 🚀 Optimización: Debounce para evitar demasiadas consultas
  const [fetchTimeout, setFetchTimeout] = useState<NodeJS.Timeout | null>(null);

  // 🚀 Función optimizada para actualización en tiempo real
  const debouncedFetchStats = () => {
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsRealTimeUpdate(true);
      fetchStats().finally(() => {
        setIsRealTimeUpdate(false);
      });
    }, 500); // Espera 500ms antes de actualizar
    
    setFetchTimeout(timeout);
  };

  useEffect(() => {
    fetchStats();
    
    // 🚀 TIEMPO REAL: Suscripciones para actualización instantánea
    const providersChannel = supabase
      .channel('providers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'providers' },
        (payload) => {
          console.log('🔄 Proveedor actualizado en tiempo real:', payload);
          debouncedFetchStats(); // Usar versión optimizada
        }
      )
      .subscribe();

    const reviewsChannel = supabase
      .channel('reviews_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'provider_reviews' },
        (payload) => {
          console.log('🔄 Reseña actualizada en tiempo real:', payload);
          debouncedFetchStats(); // Usar versión optimizada
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('🔄 Categoría actualizada en tiempo real:', payload);
          debouncedFetchStats(); // Usar versión optimizada
        }
      )
      .subscribe();

    // Cleanup: Desconectar cuando el componente se desmonte
    return () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      providersChannel.unsubscribe();
      reviewsChannel.unsubscribe();
      categoriesChannel.unsubscribe();
    };
  }, [fetchTimeout]);

  const fetchStats = async () => {
    try {
      // Obtener estadísticas en paralelo con consultas más robustas
      const [
        providersResponse,
        categoriesResponse,
        reviewsResponse,
        ratingsResponse,
        premiumResponse,
        citiesResponse
      ] = await Promise.all([
        supabase.from('providers').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('provider_reviews').select('*', { count: 'exact', head: true }),
        supabase.from('provider_reviews').select('rating'),
        supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('providers').select('city').not('city', 'is', null)
      ]);

      // Calcular promedio de calificaciones
      const avgRating = ratingsResponse.data && ratingsResponse.data.length > 0 
        ? ratingsResponse.data.reduce((sum, review) => sum + review.rating, 0) / ratingsResponse.data.length 
        : 5.0; // Valor por defecto atractivo

      // Contar ciudades únicas
      const uniqueCities = citiesResponse.data 
        ? new Set(citiesResponse.data.map(provider => provider.city).filter(city => city)).size 
        : 1;

      setStats({
        totalProviders: providersResponse.count || 1,
        totalCategories: categoriesResponse.count || 18, // Fallback a 18 como dijiste
        totalReviews: reviewsResponse.count || 1,
        averageRating: avgRating,
        premiumProviders: premiumResponse.count || 1,
        activeCities: uniqueCities
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // En caso de error, usar valores por defecto atractivos
      setStats({
        totalProviders: 1,
        totalCategories: 18,
        totalReviews: 1,
        averageRating: 5.0,
        premiumProviders: 1,
        activeCities: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const statItems = [
    {
      icon: '👥',
      label: 'Proveedores Activos',
      value: formatNumber(stats.totalProviders),
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: '🎯',
      label: 'Categorías de Servicios',
      value: stats.totalCategories.toString(),
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: '⭐',
      label: 'Reseñas de Clientes',
      value: formatNumber(stats.totalReviews),
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      icon: '🏆',
      label: 'Calificación Promedio',
      value: stats.averageRating.toFixed(1),
      color: 'from-pink-500 to-red-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    {
      icon: '💎',
      label: 'Proveedores Premium',
      value: stats.premiumProviders.toString(),
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: '🏙️',
      label: 'Ciudades Cubiertas',
      value: stats.activeCities.toString(),
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-48 sm:w-64 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg animate-pulse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mx-auto mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Efectos de fondo - Reducidos en móvil */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-32 sm:w-64 h-32 sm:h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-24 sm:w-48 h-24 sm:h-48 bg-pink-300/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Título de la sección - Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-800 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
            <span className="text-sm sm:text-lg">📊</span>
            <span className="hidden sm:inline">Estadísticas en Tiempo Real</span>
            <span className="sm:hidden">Tiempo Real</span>
            {isRealTimeUpdate && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-bold hidden sm:inline">Actualizando...</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-2 sm:px-0">
            Charlitron Eventos 360 en Números
          </h2>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Nuestra plataforma crece cada día con más proveedores verificados y eventos exitosos en todo México
          </p>
        </div>

        {/* Grid de estadísticas - Optimizado móvil */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {statItems.map((stat, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-gray-100 overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Efecto de gradiente en hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Contenido */}
              <div className="relative z-10 text-center">
                {/* Icono - Responsive */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${stat.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-lg sm:text-2xl">{stat.icon}</span>
                </div>
                
                {/* Número - Responsive */}
                <div className={`text-xl sm:text-3xl md:text-4xl font-bold ${stat.textColor} mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </div>
                
                {/* Label - Responsive */}
                <div className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">
                  {stat.label.length > 15 && window.innerWidth < 640 ? 
                    stat.label.split(' ').slice(0, 2).join(' ') : 
                    stat.label
                  }
                </div>
              </div>

              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </div>
          ))}
        </div>

        {/* Call-to-action final - Móvil optimizado */}
        <div className="text-center mt-8 sm:mt-12 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="text-sm sm:text-base text-gray-600 text-center">
              ¿Quieres formar parte de estas estadísticas?
            </div>
            <a
              href="/proveedores/planes"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-sm sm:text-base"
            >
              <span className="text-sm sm:text-base">🚀</span>
              <span>Únete como Proveedor</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;