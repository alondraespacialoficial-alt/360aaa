import React, { useState, useEffect } from 'react';
import { getAISettings, updateAISettings, getAIStats } from '../services/aiAssistant';
import { useAIStatus } from '../context/AIStatusContext';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  CogIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface AISettings {
  is_enabled: boolean;
  daily_budget_usd: number;
  monthly_budget_usd: number;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  max_tokens_per_question: number;
  max_conversation_length: number;
  welcome_message: string;
}

interface AIStats {
  period: string;
  total_questions: number;
  total_cost_usd: number;
  avg_processing_time_ms: number;
  total_tokens_input: number;
  total_tokens_output: number;
  unique_users: number;
  top_questions?: Array<{ question_text: string; frequency: number }>;
}

const AIAdminPanel: React.FC = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const { refreshAIStatus } = useAIStatus(); // 🎯 USAR CONTEXTO PARA COMUNICAR CAMBIOS
  const [stats, setStats] = useState<{
    today: AIStats | null;
    week: AIStats | null;
    month: AIStats | null;
  }>({
    today: null,
    week: null,
    month: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar configuración y estadísticas en paralelo
      const [settingsData, todayStats, weekStats, monthStats] = await Promise.all([
        getAISettings(),
        getAIStats('today'),
        getAIStats('week'),
        getAIStats('month')
      ]);

      console.log('AI Settings:', settingsData);
      console.log('Today Stats:', todayStats);
      console.log('Week Stats:', weekStats);
      console.log('Month Stats:', monthStats);

      setSettings(settingsData);
      setStats({
        today: todayStats,
        week: weekStats,
        month: monthStats
      });
      
    } catch (error) {
      console.error('Error loading AI admin data:', error);
      setError('Error al cargar los datos del asistente virtual');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (field: keyof AISettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateAISettings(settings);
      setSuccess('Configuración guardada exitosamente');
      
      // Auto-hide success message
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error saving AI settings:', error);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleAI = async () => {
    if (!settings) return;
    
    const newEnabledState = !settings.is_enabled;
    
    try {
      setSaving(true);
      await updateAISettings({ is_enabled: newEnabledState });
      
      setSettings({
        ...settings,
        is_enabled: newEnabledState
      });
      
      // Recargar datos para verificar que se guardó
      await loadData();
      
      setSuccess(
        newEnabledState 
          ? '✅ Asistente virtual activado - Chat actualizado' 
          : '🛑 Asistente virtual pausado - Chat deshabilitado'
      );
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error toggling AI:', error);
      setError('Error al cambiar el estado del asistente');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <h3 className="font-semibold">Error de Configuración</h3>
        </div>
        <p className="text-red-700 mt-2">
          No se pudo cargar la configuración del asistente virtual. 
          Asegúrate de haber ejecutado el script SQL de configuración.
        </p>
        <button 
          onClick={loadData}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CpuChipIcon className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Asistente Virtual IA</h2>
            <p className="text-gray-600">Control y estadísticas del chatbot inteligente</p>
          </div>
        </div>
        
        {/* Toggle principal */}
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${settings.is_enabled ? 'text-green-600' : 'text-red-600'}`}>
            {settings.is_enabled ? '✅ Activo' : '🛑 Pausado'}
          </span>
          <button
            onClick={toggleAI}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              settings.is_enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hoy */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Hoy</h3>
              <p className="text-sm text-gray-600">Actividad del día</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Preguntas:</span>
              <span className="font-semibold">{formatNumber(stats.today?.total_questions || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo:</span>
              <span className="font-semibold">{formatCurrency(stats.today?.total_cost_usd || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usuarios:</span>
              <span className="font-semibold">{formatNumber(stats.today?.unique_users || 0)}</span>
            </div>
          </div>
        </div>

        {/* Semana */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Esta Semana</h3>
              <p className="text-sm text-gray-600">Últimos 7 días</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Preguntas:</span>
              <span className="font-semibold">{formatNumber(stats.week?.total_questions || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo:</span>
              <span className="font-semibold">{formatCurrency(stats.week?.total_cost_usd || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usuarios:</span>
              <span className="font-semibold">{formatNumber(stats.week?.unique_users || 0)}</span>
            </div>
          </div>
        </div>

        {/* Mes */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Este Mes</h3>
              <p className="text-sm text-gray-600">Últimos 30 días</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Preguntas:</span>
              <span className="font-semibold">{formatNumber(stats.month?.total_questions || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Costo:</span>
              <span className="font-semibold text-lg">{formatCurrency(stats.month?.total_cost_usd || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usuarios:</span>
              <span className="font-semibold">{formatNumber(stats.month?.unique_users || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <CogIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Presupuestos */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Control de Presupuesto</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto Diario (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.daily_budget_usd}
                onChange={(e) => handleSettingsChange('daily_budget_usd', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto Mensual (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.monthly_budget_usd}
                onChange={(e) => handleSettingsChange('monthly_budget_usd', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Rate Limits */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Límites de Uso</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preguntas por Minuto
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.rate_limit_per_minute}
                onChange={(e) => handleSettingsChange('rate_limit_per_minute', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preguntas por Hora
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.rate_limit_per_hour}
                onChange={(e) => handleSettingsChange('rate_limit_per_hour', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preguntas por Día
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.rate_limit_per_day}
                onChange={(e) => handleSettingsChange('rate_limit_per_day', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje de Bienvenida
          </label>
          <textarea
            rows={4}
            value={settings.welcome_message}
            onChange={(e) => handleSettingsChange('welcome_message', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Mensaje que verán los usuarios al abrir el chat..."
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Recargar
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Preguntas frecuentes */}
      {stats.month?.top_questions && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preguntas Más Frecuentes (Este Mes)
          </h3>
          <div className="space-y-3">
            {stats.month.top_questions.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{item.question_text}</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                  {item.frequency} veces
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdminPanel;