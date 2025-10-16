import React, { useState, useEffect } from 'react';
import { useFilters } from '../../hooks/useFilters';
import FilterPanel from '../../components/FilterPanel';
import { getAllProviders } from '../../services/supabaseClient';

const TestFiltersPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook de filtros real
  const {
    filters,
    filteredProviders,
    availableCities,
    filterStats,
    handleFilterChange,
    clearFilters
  } = useFilters(providers);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        console.log('🔍 Cargando proveedores para prueba de filtros...');
        
        const data = await getAllProviders();
        console.log('✅ Proveedores cargados:', data);
        
        // Mapear los datos para que coincidan con el formato esperado
        const mappedProviders = data.map(provider => ({
          ...provider,
          services: provider.services || []
        }));
        
        setProviders(mappedProviders);
        setError(null);
      } catch (err) {
        console.error('❌ Error cargando proveedores:', err);
        setError('Error al cargar proveedores de Supabase');
        
        // Datos de fallback para testing
        const fallbackData = [
          {
            id: '1',
            name: 'Fotografía Elite Test',
            description: 'Servicios profesionales de fotografía para bodas y eventos especiales',
            city: 'San Luis Potosí',
            is_premium: true,
            featured: true,
            services: [
              { id: '1', name: 'Paquete Básico', description: 'Fotografía básica para eventos', price: 5000 },
              { id: '2', name: 'Paquete Premium', description: 'Fotografía profesional con álbum', price: 8000 }
            ]
          },
          {
            id: '2',
            name: 'DJ Party Sound Test',
            description: 'Música y sonido para fiestas y celebraciones',
            city: 'Guadalajara',
            is_premium: false,
            featured: false,
            services: [
              { id: '3', name: 'Barra de Snacks', description: 'Snacks variados para eventos', price: 1500 },
              { id: '4', name: 'Barra de elotes', description: 'Elotes preparados al momento', price: 2500 }
            ]
          },
          {
            id: '3',
            name: 'Catering Deluxe Test',
            description: 'Servicios de catering y banquetes para eventos corporativos',
            city: 'Ciudad de México',
            is_premium: true,
            featured: false,
            services: [
              { id: '5', name: 'Paletas de Hielo', description: 'Paletas artesanales para eventos', price: 800 },
              { id: '6', name: 'Máquina Palomera', description: 'Palomitas frescas durante el evento', price: 1200 }
            ]
          }
        ];
        
        setProviders(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 Test de Filtros y Búsqueda</h1>
        <p className="text-gray-600 mb-4">
          Esta página permite probar la funcionalidad de filtros con datos reales de Supabase
        </p>
        
        {/* 🆕 EJEMPLOS DE BÚSQUEDA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Prueba estos términos de búsqueda:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="bg-white px-2 py-1 rounded border">
              <strong>Servicios:</strong> "barra de elotes", "snacks", "paletas", "máquina"
            </div>
            <div className="bg-white px-2 py-1 rounded border">
              <strong>Proveedores:</strong> "fotografía", "catering", "DJ"
            </div>
            <div className="bg-white px-2 py-1 rounded border">
              <strong>Ciudades:</strong> "San Luis", "Guadalajara", "México"
            </div>
            <div className="bg-white px-2 py-1 rounded border">
              <strong>Descripciones:</strong> "eventos", "bodas", "corporativos"
            </div>
          </div>
        </div>
      </header>

      {/* Información de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">📊 Total Proveedores</h3>
          <p className="text-2xl font-bold text-blue-900">{providers.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">✅ Filtrados</h3>
          <p className="text-2xl font-bold text-green-900">{filteredProviders.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">🏙️ Ciudades</h3>
          <p className="text-2xl font-bold text-purple-900">{availableCities.length}</p>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          🔄 Cargando proveedores desde Supabase...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          ❌ {error}
        </div>
      )}

      {/* Panel de filtros */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        availableCities={availableCities}
        resultsCount={filteredProviders.length}
      />

      {/* Información detallada de filtros */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">🔧 Estado de Filtros Activos</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <strong>Búsqueda:</strong><br/>
            <span className="text-gray-600">"{filters.search || 'Ninguna'}"</span>
          </div>
          <div>
            <strong>Ciudad:</strong><br/>
            <span className="text-gray-600">{filters.city || 'Todas'}</span>
          </div>
          <div>
            <strong>Precio:</strong><br/>
            <span className="text-gray-600">{filters.priceRange || 'Todos'}</span>
          </div>
          <div>
            <strong>Premium:</strong><br/>
            <span className="text-gray-600">
              {filters.isPremium === null ? 'Todos' : filters.isPremium ? 'Sí' : 'No'}
            </span>
          </div>
          <div>
            <strong>Destacado:</strong><br/>
            <span className="text-gray-600">
              {filters.isFeatured === null ? 'Todos' : filters.isFeatured ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📋 Resultados ({filteredProviders.length})</h2>
        
        {filteredProviders.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">No se encontraron proveedores que coincidan con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {provider.featured && '⭐ '}
                    {provider.name}
                    {provider.is_premium && ' 👑'}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{provider.description}</p>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div>📍 {provider.city || 'Ciudad no especificada'}</div>
                  <div>💰 Servicios: {provider.services?.length || 0}</div>
                  {provider.services && provider.services.length > 0 && (
                    <div>
                      🏷️ Precio mín: ${Math.min(...provider.services.map((s: any) => s.price || 0)).toLocaleString()}
                    </div>
                  )}
                  <div>🔖 Premium: {provider.is_premium ? 'Sí' : 'No'}</div>
                  <div>⭐ Destacado: {provider.featured ? 'Sí' : 'No'}</div>
                  
                  {/* 🆕 MOSTRAR SERVICIOS DISPONIBLES */}
                  {provider.services && provider.services.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">🛍️ Servicios:</div>
                      {provider.services.map((service: any, index: number) => (
                        <div key={service.id || index} className="text-xs text-blue-600">
                          • {service.name || 'Servicio sin nombre'} - ${service.price?.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ciudades disponibles */}
      <div className="mt-8 bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">🏙️ Ciudades Disponibles</h3>
        <div className="flex flex-wrap gap-2">
          {availableCities.map((city) => (
            <span 
              key={city} 
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestFiltersPage;