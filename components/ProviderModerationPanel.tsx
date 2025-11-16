/**
 * Panel de Moderación de Registros de Proveedores
 * Muestra solicitudes pendientes y permite aprobar/rechazar
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ProviderRegistration {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  description: string;
  categories: string[];
  services: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  location_type: 'manual' | 'maps_url';
  address?: string;
  city?: string;
  state?: string;
  maps_url?: string;
  profile_image_url?: string;
  gallery_images: string[];
  instagram?: string;
  instagram_url?: string;
  facebook?: string;
  facebook_url?: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
}

interface RegistrationStats {
  total_registrations: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  avg_review_time_hours: number;
}

const ProviderModerationPanel: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ProviderRegistration[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<ProviderRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Cargar registros por filtro y estadísticas
  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [activeFilter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_registrations')
        .select('*')
        .eq('status', activeFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      alert('Error al cargar registros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_registration_stats');
      if (error) throw error;
      setStats(data[0] || null);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (registration: ProviderRegistration) => {
    if (!user) {
      alert('Debes estar autenticado como admin');
      return;
    }

    if (!window.confirm(`¿Aprobar el registro de "${registration.business_name}"?\n\nEsto creará un proveedor activo en el sistema.`)) {
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_provider_registration', {
        registration_id: registration.id,
        admin_user_id: user.id
      });

      if (error) throw error;

      alert(`✅ Registro aprobado!\n\nProveedor creado con ID: ${data}\nYa aparece en el directorio público.`);
      
      // Recargar lista
      await fetchRegistrations();
      await fetchStats();
      setSelectedRegistration(null);
    } catch (error: any) {
      console.error('Error approving registration:', error);
      alert('❌ Error al aprobar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (registration: ProviderRegistration) => {
    if (!user) {
      alert('Debes estar autenticado como admin');
      return;
    }

    if (!rejectionReason.trim()) {
      alert('Por favor, escribe una razón para el rechazo');
      return;
    }

    if (!window.confirm(`¿Rechazar el registro de "${registration.business_name}"?`)) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_provider_registration', {
        registration_id: registration.id,
        admin_user_id: user.id,
        rejection_reason: rejectionReason
      });

      if (error) throw error;

      alert('❌ Registro rechazado\n\nEl solicitante puede ver la razón en su email.');
      
      // Recargar lista
      await fetchRegistrations();
      await fetchStats();
      setSelectedRegistration(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      alert('Error al rechazar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{stats.pending_count}</div>
            <div className="text-sm text-blue-700">Pendientes</div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">{stats.approved_count}</div>
            <div className="text-sm text-green-700">Aprobados</div>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-600">{stats.rejected_count}</div>
            <div className="text-sm text-red-700">Rechazados</div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-600">{stats.avg_review_time_hours?.toFixed(1) || '0'}h</div>
            <div className="text-sm text-purple-700">Tiempo promedio</div>
          </div>
        </div>
      )}

      {/* Pestañas de filtro */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              📋 Gestión de Registros
            </h2>
            <button
              onClick={fetchRegistrations}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              🔄 Actualizar
            </button>
          </div>
          
          {/* Pestañas */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveFilter('pending')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeFilter === 'pending'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              ⏳ Pendientes ({stats?.pending_count || 0})
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeFilter === 'approved'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              ✅ Aprobados ({stats?.approved_count || 0})
            </button>
            <button
              onClick={() => setActiveFilter('rejected')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                activeFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              ❌ Rechazados ({stats?.rejected_count || 0})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Cargando registros...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {activeFilter === 'pending' && '✅ No hay registros pendientes de revisión'}
            {activeFilter === 'approved' && '📋 No hay registros aprobados aún'}
            {activeFilter === 'rejected' && '📋 No hay registros rechazados'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {registrations.map(registration => (
              <div key={registration.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{registration.business_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        registration.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                        registration.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {registration.status === 'pending' && '⏳ PENDIENTE'}
                        {registration.status === 'approved' && '✅ APROBADO'}
                        {registration.status === 'rejected' && '❌ RECHAZADO'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      👤 {registration.contact_name} · 📧 {registration.email} · 📱 {registration.phone}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {registration.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ⏰ {formatDate(registration.created_at)}
                    </p>
                    {registration.status === 'rejected' && registration.admin_notes && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border-l-2 border-red-300">
                        💭 <strong>Razón:</strong> {registration.admin_notes}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedRegistration(registration)}
                    className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
                  >
                    Ver Detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRegistration.business_name}</h2>
              <button
                onClick={() => {
                  setSelectedRegistration(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información de contacto */}
              <div>
                <h3 className="font-bold text-lg mb-2">📞 Información de Contacto</h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><strong>Nombre:</strong> {selectedRegistration.contact_name}</div>
                  <div><strong>Email:</strong> {selectedRegistration.email}</div>
                  <div><strong>Teléfono:</strong> {selectedRegistration.phone}</div>
                  <div><strong>WhatsApp:</strong> {selectedRegistration.whatsapp}</div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h3 className="font-bold text-lg mb-2">📍 Ubicación</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedRegistration.maps_url ? (
                    <a 
                      href={selectedRegistration.maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      🗺️ Ver en Google Maps →
                    </a>
                  ) : (
                    <div>
                      {selectedRegistration.address}<br />
                      {selectedRegistration.city}, {selectedRegistration.state}
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="font-bold text-lg mb-2">📝 Descripción</h3>
                <p className="bg-gray-50 p-4 rounded-lg">{selectedRegistration.description}</p>
              </div>

              {/* Servicios */}
              <div>
                <h3 className="font-bold text-lg mb-2">💼 Servicios ({selectedRegistration.services.length})</h3>
                <div className="space-y-2">
                  {selectedRegistration.services.map((service, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold">{service.name} - ${service.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{service.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Imágenes */}
              {(selectedRegistration.profile_image_url || selectedRegistration.gallery_images.length > 0) && (
                <div>
                  <h3 className="font-bold text-lg mb-2">📸 Imágenes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedRegistration.profile_image_url && (
                      <img 
                        src={selectedRegistration.profile_image_url} 
                        alt="Perfil"
                        className="w-full h-32 object-cover rounded-lg border-2 border-purple-500"
                      />
                    )}
                    {selectedRegistration.gallery_images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt={`Galería ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Redes sociales */}
              {(selectedRegistration.instagram || selectedRegistration.facebook || selectedRegistration.website) && (
                <div>
                  <h3 className="font-bold text-lg mb-2">🌐 Redes Sociales</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedRegistration.instagram && (
                      <div>📷 Instagram: {selectedRegistration.instagram}</div>
                    )}
                    {selectedRegistration.facebook && (
                      <div>👍 Facebook: {selectedRegistration.facebook}</div>
                    )}
                    {selectedRegistration.website && (
                      <div>🌍 Web: <a href={selectedRegistration.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedRegistration.website}</a></div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario de rechazo */}
              <div>
                <h3 className="font-bold text-lg mb-2">💭 Razón de rechazo (opcional)</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: Información incompleta, imágenes de baja calidad, etc."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>

              {/* Botones de acción - Solo para pendientes */}
              {selectedRegistration.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedRegistration)}
                    disabled={processing}
                    className={`flex-1 py-3 rounded-lg font-bold transition ${
                      processing 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {processing ? 'Procesando...' : '✅ Aprobar y Publicar'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedRegistration)}
                    disabled={processing}
                    className={`flex-1 py-3 rounded-lg font-bold transition ${
                      processing 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {processing ? 'Procesando...' : '❌ Rechazar'}
                  </button>
                </div>
              )}
              
              {/* Info para registros ya procesados */}
              {selectedRegistration.status !== 'pending' && (
                <div className="pt-4 border-t text-center">
                  <p className={`text-lg font-bold ${
                    selectedRegistration.status === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedRegistration.status === 'approved' && '✅ Este registro ya fue aprobado'}
                    {selectedRegistration.status === 'rejected' && '❌ Este registro fue rechazado'}
                  </p>
                  {selectedRegistration.admin_notes && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                      <strong>Razón:</strong> {selectedRegistration.admin_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderModerationPanel;
