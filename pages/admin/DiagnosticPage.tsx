import React, { useState, useEffect } from 'react';
import { supabase, diagnoseDatabaseStructure, getAllProviders, getAllCategories } from '../../services/supabaseClient';

const DiagnosticPage: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackRows, setFeedbackRows] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'useful' | 'not_useful'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalFeedback, setTotalFeedback] = useState<number | null>(null);

  // Carga una página de feedback desde Supabase con paginación
  const loadFeedbackPage = async (pageIndex: number, size: number, filter: 'all' | 'useful' | 'not_useful') => {
    const from = pageIndex * size;
    const to = from + size - 1;
    try {
      let query = supabase
        .from('ai_usage_tracking')
        .select('id, session_id, question, sources_used, user_feedback, feedback_comment, feedback_at, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === 'useful') query = query.eq('user_feedback', true);
      if (filter === 'not_useful') query = query.eq('user_feedback', false);

      const { data, error, count } = await query;
      if (error) {
        console.error('Error cargando feedback:', error);
        return;
      }
      setFeedbackRows(data || []);
      setTotalFeedback(typeof count === 'number' ? count : null);
    } catch (err) {
      console.error('Excepción cargando feedback:', err);
    }
  };

  // Exporta los resultados filtrados (todas las filas que coincidan) como CSV
  const exportFeedbackCSV = async () => {
    try {
      let query = supabase
        .from('ai_usage_tracking')
        .select('id, session_id, question, sources_used, user_feedback, feedback_comment, feedback_at, created_at');

      if (feedbackFilter === 'useful') query = query.eq('user_feedback', true);
      if (feedbackFilter === 'not_useful') query = query.eq('user_feedback', false);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('Error exportando feedback:', error);
        return;
      }
      if (!data || data.length === 0) {
        alert('No hay filas para exportar con el filtro actual.');
        return;
      }

      // convertir a CSV
      const rows = data as any[];
      const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
      const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
        const v = r[h];
        if (v === null || v === undefined) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return '"' + s.replace(/"/g, '""') + '"';
      }).join(','))).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_feedback_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excepción exportando CSV:', err);
      alert('Error exportando CSV. Revisa la consola.');
    }
  };

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

      // cargar últimos feedbacks
      // load first page
      await loadFeedbackPage(0, pageSize, feedbackFilter);

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

      {/* Feedback AI */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📝 Feedback del Asistente AI</h2>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm">Filtrar:</label>
          <select value={feedbackFilter} onChange={async (e) => { setFeedbackFilter(e.target.value as any); setPage(0); await loadFeedbackPage(0, pageSize, e.target.value as any); }} className="border px-2 py-1 rounded text-sm">
            <option value="all">Todos</option>
            <option value="useful">Útil</option>
            <option value="not_useful">No útil</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => loadFeedbackPage(page, pageSize, feedbackFilter)} className="bg-gray-200 px-3 py-1 rounded text-sm">🔄 Recargar</button>
            <button onClick={() => exportFeedbackCSV()} className="bg-green-200 px-3 py-1 rounded text-sm">📥 Export CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-2 py-1">ID</th>
                <th className="px-2 py-1">Pregunta</th>
                <th className="px-2 py-1">Sources</th>
                <th className="px-2 py-1">Feedback</th>
                <th className="px-2 py-1">Comentario</th>
                <th className="px-2 py-1">Creado</th>
              </tr>
            </thead>
            <tbody>
              {(feedbackRows || []).map(row => (
                <tr key={row.id} className="border-t">
                  <td className="px-2 py-1">{row.id}</td>
                  <td className="px-2 py-1 max-w-xs truncate">{row.question}</td>
                  <td className="px-2 py-1 max-w-xs truncate">{JSON.stringify(row.sources_used || [])}</td>
                  <td className="px-2 py-1">{row.user_feedback === true ? 'Útil' : row.user_feedback === false ? 'No útil' : '-'}</td>
                  <td className="px-2 py-1">{row.feedback_comment || '-'}</td>
                  <td className="px-2 py-1">{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          {/* Pagination controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">Página {page + 1}{totalFeedback ? ` — ${totalFeedback} filas` : ''}</div>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => { const newPage = Math.max(0, page - 1); setPage(newPage); loadFeedbackPage(newPage, pageSize, feedbackFilter); }} className="px-2 py-1 bg-gray-100 rounded">Anterior</button>
              <button disabled={feedbackRows.length < pageSize} onClick={() => { const newPage = page + 1; setPage(newPage); loadFeedbackPage(newPage, pageSize, feedbackFilter); }} className="px-2 py-1 bg-gray-100 rounded">Siguiente</button>
              <select value={pageSize} onChange={(e) => { const newSize = Number(e.target.value); setPageSize(newSize); setPage(0); loadFeedbackPage(0, newSize, feedbackFilter); }} className="border px-2 py-1 rounded">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
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