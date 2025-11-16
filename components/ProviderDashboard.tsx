import React, { useState, useEffect } from 'react';
import { getProviderStats } from '../services/supabaseClient';
import { EyeIcon, PhoneIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';

interface ProviderDashboardProps {
  providerId: string;
  providerName?: string;
}

interface ProviderStats {
  provider_id: string;
  provider_name: string;
  total_views: number;
  views_last_30_days: number;
  views_last_7_days: number;
  views_today: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  website_clicks: number;
  instagram_clicks: number;
  facebook_clicks: number;
  service_views: number;
  gallery_views: number;
  unique_visitors: number;
  unique_visitors_30_days: number;
  cities_reached: number;
  countries_reached: number;
  mobile_views: number;
  desktop_views: number;
  tablet_views: number;
  contact_conversion_rate: number;
  first_view: string;
  last_activity: string;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ providerId, providerName }) => {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getProviderStats(providerId);
        
        if (result.success && result.stats) {
          setStats(result.stats);
        } else {
          setError('No se pudieron cargar las estadísticas');
          console.warn('Error obteniendo estadísticas:', result.error);
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
        console.error('Error en fetchStats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchStats();
    }
  }, [providerId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-purple-700 font-medium">Cargando métricas...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-8">
        <div className="text-center">
          <div className="text-gray-500 text-sm">
            📊 Métricas del proveedor próximamente
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const StatCard = ({ icon, title, value, subtitle, color = 'purple' }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'purple' | 'green' | 'blue' | 'orange' | 'pink';
  }) => {
    const colorClasses = {
      purple: 'from-purple-500 to-purple-600 text-white',
      green: 'from-green-500 to-green-600 text-white',
      blue: 'from-blue-500 to-blue-600 text-white',
      orange: 'from-orange-500 to-orange-600 text-white',
      pink: 'from-pink-500 to-pink-600 text-white'
    };

    // Función helper para formatear valores seguros
    const formatValue = (val: string | number) => {
      if (val === null || val === undefined) return '0';
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return val.toLocaleString();
      return String(val);
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 shadow-md transform hover:scale-105 transition-all duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              {icon}
              <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
            📊 Dashboard Público de {providerName || 'Proveedor'}
          </h2>
          <p className="text-purple-600 text-sm">Métricas en tiempo real • Última actualización: {formatDate(stats.last_activity)}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-purple-600">Rate de conversión</div>
          <div className="text-2xl font-bold text-purple-800">{(stats.contact_conversion_rate || 0)}%</div>
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<EyeIcon className="w-5 h-5" />}
          title="Vistas Totales"
          value={stats.total_views || 0}
          subtitle="Desde el primer día"
          color="purple"
        />
        <StatCard 
          icon={<EyeIcon className="w-5 h-5" />}
          title="Este Mes"
          value={stats.views_last_30_days || 0}
          subtitle="Últimos 30 días"
          color="blue"
        />
        <StatCard 
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          title="WhatsApp"
          value={stats.whatsapp_clicks || 0}
          subtitle="Clics totales"
          color="green"
        />
        <StatCard 
          icon={<PhoneIcon className="w-5 h-5" />}
          title="Teléfono"
          value={stats.phone_clicks || 0}
          subtitle="Clics totales"
          color="orange"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.views_last_7_days || 0}</div>
          <div className="text-xs text-purple-600">Esta semana</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.views_today || 0}</div>
          <div className="text-xs text-purple-600">Hoy</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.unique_visitors || 0}</div>
          <div className="text-xs text-purple-600">Visitantes únicos</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.service_views || 0}</div>
          <div className="text-xs text-purple-600">Servicios vistos</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.gallery_views || 0}</div>
          <div className="text-xs text-purple-600">Fotos vistas</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-100 text-center">
          <div className="text-lg font-bold text-purple-700">{stats.cities_reached || 0}</div>
          <div className="text-xs text-purple-600">Ciudades</div>
        </div>
      </div>

      {/* Distribución por dispositivos */}
      <div className="bg-white rounded-lg p-4 border border-purple-100 mb-4">
        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
          📱 Distribución por Dispositivo
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <DevicePhoneMobileIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-700">Móvil: <strong>{stats.mobile_views || 0}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <ComputerDesktopIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">Desktop: <strong>{stats.desktop_views || 0}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <ComputerDesktopIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-700">Tablet: <strong>{stats.tablet_views || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Métricas de redes sociales */}
      {((stats.website_clicks || 0) > 0 || (stats.instagram_clicks || 0) > 0 || (stats.facebook_clicks || 0) > 0) && (
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
            🌐 Clics en Enlaces
          </h3>
          <div className="flex flex-wrap gap-4">
            {(stats.website_clicks || 0) > 0 && (
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">Sitio web: <strong>{stats.website_clicks}</strong></span>
              </div>
            )}
            {(stats.instagram_clicks || 0) > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-pink-600">📸</span>
                <span className="text-sm text-gray-700">Instagram: <strong>{stats.instagram_clicks}</strong></span>
              </div>
            )}
            {(stats.facebook_clicks || 0) > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📘</span>
                <span className="text-sm text-gray-700">Facebook: <strong>{stats.facebook_clicks}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <div className="flex justify-between items-center text-xs text-purple-600">
          <span>Primer visita: {formatDate(stats.first_view)}</span>
          <span>Powered by Charlitron Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;