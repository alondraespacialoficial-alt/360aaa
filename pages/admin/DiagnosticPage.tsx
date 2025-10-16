import React, { useState, useEffect } from 'react';
import { supabase, diagnoseDatabaseStructure, getAllProviders, getAllCategories } from '../../services/supabaseClient';

const DiagnosticPage: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔧 Iniciando diagnóstico completo...');
      
      // Ejecutar diagnóstico de estructura
      const results = await diagnoseDatabaseStructure();
      setDiagnosticResults(results);

      // Obtener proveedores reales
      const providersData = await getAllProviders();
      setProviders(providersData);

      // Obtener categorías reales
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);

      console.log('✅ Diagnóstico completado');
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Diagnóstico de Base de Datos</h1>
      
      <div className="mb-6">
        <button 
          onClick={runDiagnostic}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '🔄 Ejecutando...' : '🔧 Ejecutar Diagnóstico'}
        </button>
      </div>

      {/* Resultados del Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📊 Estado de las Tablas</h2>
          {diagnosticResults?.results ? (
            <div className="space-y-2">
              {Object.entries(diagnosticResults.results).map(([table, info]: [string, any]) => (
                <div key={table} className={`p-2 rounded ${info.exists ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="font-medium">
                    {info.exists ? '✅' : '❌'} {table}
                  </div>
                  {info.exists && (
                    <div className="text-sm text-gray-600">
                      Registros: {info.count} | Columnas: {info.columns?.length || 0}
                    </div>
                  )}
                  {info.error && (
                    <div className="text-sm text-red-600">Error: {info.error}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Ejecute el diagnóstico para ver resultados</div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📋 Categorías Disponibles</h2>
          {categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map((category, index) => (
                <div key={category.id || index} className="text-sm">
                  <strong>{category.name}</strong> ({category.slug})
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No se encontraron categorías</div>
          )}
        </div>
      </div>

      {/* Proveedores */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🏢 Proveedores Disponibles</h2>
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider, index) => (
              <div key={provider.id || index} className="border p-3 rounded">
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="text-sm text-gray-600">{provider.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Ciudad: {provider.city || 'No especificada'}<br/>
                  Premium: {provider.is_premium ? 'Sí' : 'No'}<br/>
                  Destacado: {provider.featured ? 'Sí' : 'No'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No se encontraron proveedores</div>
        )}
      </div>

      {/* Información de conexión */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">🔗 Información de Conexión</h3>
        <div className="text-sm">
          <p><strong>URL Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
          <p><strong>Clave Anon:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '***configurada***' : '❌ NO CONFIGURADA'}</p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;