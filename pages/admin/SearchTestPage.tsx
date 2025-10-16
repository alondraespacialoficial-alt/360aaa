import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const SearchTestPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProvidersWithServices();
  }, []);

  const loadProvidersWithServices = async () => {
    setLoading(true);
    try {
      // Obtener proveedores con sus servicios
      const { data: providersData, error: providersError } = await supabase
        .from('providers')
        .select(`
          id, name, description, city, is_premium, featured,
          provider_services(id, name, description, price)
        `)
        .eq('is_active', true)
        .limit(20);

      if (providersError) {
        console.error('Error cargando proveedores:', providersError);
        return;
      }

      const mappedProviders = (providersData || []).map(provider => ({
        ...provider,
        services: provider.provider_services || []
      }));

      setProviders(mappedProviders);
      setResults(mappedProviders);
      console.log('✅ Proveedores cargados con servicios:', mappedProviders);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setResults(providers);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = providers.filter(provider => {
      // Buscar en nombre del proveedor
      const nameMatches = provider.name?.toLowerCase().includes(searchLower);
      
      // Buscar en descripción del proveedor
      const descriptionMatches = provider.description?.toLowerCase().includes(searchLower);
      
      // Buscar en servicios
      const servicesMatch = provider.services?.some((service: any) => {
        const serviceNameMatches = service.name?.toLowerCase().includes(searchLower);
        const serviceDescriptionMatches = service.description?.toLowerCase().includes(searchLower);
        return serviceNameMatches || serviceDescriptionMatches;
      }) || false;

      return nameMatches || descriptionMatches || servicesMatch;
    });

    setResults(filtered);
    console.log(`🔍 Búsqueda "${term}": ${filtered.length} resultados de ${providers.length} proveedores`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 Test de Búsqueda en Servicios</h1>
        <p className="text-gray-600">
          Prueba la búsqueda con datos reales de Supabase (proveedores y servicios)
        </p>
      </header>

      {/* Campo de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => performSearch(e.target.value)}
            placeholder="Buscar por proveedor o servicio (ej: barra de elotes, snacks, paletas)..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Ejemplos de búsqueda rápida */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3">🚀 Búsquedas rápidas:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            'barra de elotes',
            'snacks',
            'paletas de hielo',
            'máquina palomera',
            'carro de elotes',
            'paquete',
            'video',
            'fotografía'
          ].map(term => (
            <button
              key={term}
              onClick={() => performSearch(term)}
              className="bg-white hover:bg-blue-100 border border-blue-300 rounded px-3 py-2 text-sm text-blue-700 transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800">📊 Total Proveedores</h3>
          <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">✅ Resultados</h3>
          <p className="text-2xl font-bold text-green-900">{results.length}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">🔍 Término</h3>
          <p className="text-lg font-bold text-blue-900">"{searchTerm || 'Ninguno'}"</p>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          🔄 Cargando proveedores desde Supabase...
        </div>
      )}

      {/* Resultados */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📋 Resultados de Búsqueda ({results.length})</h2>
        
        {results.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">
              {searchTerm ? 
                `No se encontraron proveedores o servicios que coincidan con "${searchTerm}"` :
                'No hay proveedores disponibles'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((provider) => (
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
                  
                  {/* Mostrar servicios */}
                  {provider.services && provider.services.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">🛍️ Servicios:</div>
                      {provider.services.map((service: any, index: number) => {
                        // Resaltar coincidencias de búsqueda
                        const serviceText = `${service.name || 'Sin nombre'} - $${service.price?.toLocaleString()}`;
                        const isMatch = searchTerm && (
                          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                        
                        return (
                          <div 
                            key={service.id || index} 
                            className={`text-xs ${isMatch ? 'text-green-600 font-semibold' : 'text-blue-600'}`}
                          >
                            • {serviceText}
                            {isMatch && ' ✅'}
                            {service.description && (
                              <div className="text-gray-500 ml-2 italic">
                                {service.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTestPage;