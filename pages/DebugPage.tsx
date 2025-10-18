import React, { useState, useEffect } from 'react';
import { debugProviders, createTestProvider } from '../utils/debugProviders';
import { getAllProviders, getProvidersWithServices } from '../services/supabaseClient';

const DebugPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDebug = async () => {
    setLoading(true);
    setLogs([]);
    addLog('🔧 Iniciando diagnóstico...');

    try {
      // 1. Debug básico
      const debugResult = await debugProviders();
      addLog(`✅ Debug completado. Proveedores encontrados: ${debugResult?.length || 0}`);

      // 2. Obtener con función específica
      const allProviders = await getAllProviders();
      addLog(`📋 getAllProviders() retornó: ${allProviders?.length || 0} proveedores`);

      // 3. Obtener con servicios
      const providersWithServices = await getProvidersWithServices();
      addLog(`🛍️ getProvidersWithServices() retornó: ${providersWithServices?.length || 0} proveedores`);

      setProviders(providersWithServices || []);

      if (providersWithServices && providersWithServices.length === 0) {
        addLog('⚠️ No hay proveedores. ¿Crear uno de prueba?');
      }

    } catch (error) {
      addLog(`❌ Error en diagnóstico: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    setLoading(true);
    addLog('🧪 Creando proveedor de prueba...');

    try {
      const testProvider = await createTestProvider();
      if (testProvider) {
        addLog(`✅ Proveedor creado: ${testProvider.name} (ID: ${testProvider.id})`);
        runDebug(); // Volver a cargar datos
      } else {
        addLog('❌ No se pudo crear el proveedor de prueba');
      }
    } catch (error) {
      addLog(`❌ Error creando proveedor: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-purple-800 mb-6">🔧 Debug de Proveedores</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de control */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          
          <div className="space-y-4">
            <button
              onClick={runDebug}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '🔄 Cargando...' : '🔍 Ejecutar Diagnóstico'}
            </button>

            <button
              onClick={createTestData}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              🧪 Crear Proveedor de Prueba
            </button>
          </div>

          {/* Lista de proveedores */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Proveedores Encontrados ({providers.length})</h3>
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              {providers.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay proveedores cargados</p>
              ) : (
                providers.map((provider, index) => (
                  <div key={provider.id} className="border-b py-2 last:border-b-0">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-gray-600">
                      ID: {provider.id} | Ciudad: {provider.city} | 
                      Servicios: {provider.services?.length || 0}
                    </div>
                    <a 
                      href={`/proveedor/${provider.id}`}
                      target="_blank"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Ver perfil →
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de logs */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Console Logs</h2>
          
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Presiona "Ejecutar Diagnóstico" para ver logs...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setLogs([])}
            className="mt-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            🗑️ Limpiar Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;