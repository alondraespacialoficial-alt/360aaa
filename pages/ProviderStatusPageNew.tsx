import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface ProviderRegistration {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  admin_notes?: string;
  categories: string[];
}

const ProviderStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [registration, setRegistration] = useState<ProviderRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);

  const email = searchParams.get('email');
  const registrationId = searchParams.get('id');
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (email || registrationId) {
      fetchRegistrationStatus();
    }
  }, [email, registrationId]);

  const handleEmailSearch = async () => {
    if (!searchEmail.trim()) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setSearching(true);
    setError(null);
    setRegistration(null);

    try {
      const { data, error } = await supabase
        .from('provider_registrations')
        .select('*')
        .ilike('email', searchEmail.trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setError(`No se encontró ningún registro con el email: ${searchEmail}`);
        return;
      }

      setRegistration(data[0]);
    } catch (error: any) {
      console.error('Error fetching registration:', error);
      setError('Error al consultar el estado: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('provider_registrations').select('*');
      
      if (registrationId) {
        query = query.eq('id', registrationId);
      } else if (email) {
        query = query.ilike('email', email.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setError(`No se encontró ningún registro con el email: ${email}`);
        return;
      }

      setRegistration(data[0]);
    } catch (error: any) {
      console.error('Error fetching registration:', error);
      setError('Error al consultar el estado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: '⏳',
          title: 'Solicitud Pendiente',
          description: 'Tu solicitud está siendo revisada por nuestro equipo.'
        };
      case 'approved':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: '✅',
          title: '¡Solicitud Aprobada!',
          description: 'Tu negocio ha sido aprobado y ya aparece en nuestro directorio.'
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: '❌',
          title: 'Solicitud No Aprobada',
          description: 'Tu solicitud no pudo ser aprobada. Revisa los comentarios.'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: '❓',
          title: 'Estado Desconocido',
          description: 'No pudimos determinar el estado de tu solicitud.'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Consultando estado de tu solicitud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {success ? '¡Pago Exitoso!' : 'Estado de tu Solicitud'}
          </h1>
          <p className="text-gray-600">
            Charlitron Eventos 360 - Directorio de Proveedores
          </p>
        </div>

        {/* Formulario de búsqueda */}
        {!registration && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              🔍 Consulta el Estado de tu Solicitud
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Ingresa el email que usaste para registrarte
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailSearch()}
                />
                <button
                  onClick={handleEmailSearch}
                  disabled={searching || !searchEmail.trim()}
                  className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                    searching || !searchEmail.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {searching ? '🔍' : '📋 Buscar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center mb-6">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRegistration(null);
                setSearchEmail('');
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Intentar de Nuevo
            </button>
          </div>
        )}

        {/* Mensaje de éxito post-pago */}
        {success && sessionId && registration && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-green-700 mb-2">
                ¡Pago Procesado Exitosamente!
              </h2>
              <p className="text-green-600 mb-4">
                Tu suscripción ha sido activada. Tu solicitud está en proceso de revisión.
              </p>
            </div>
          </div>
        )}

        {/* Contenido del registro */}
        {registration && (() => {
          const statusInfo = getStatusInfo(registration.status);
          
          return (
            <>
              {/* Estado */}
              <div className={`${statusInfo.bgColor} border-2 ${statusInfo.borderColor} rounded-xl p-8 mb-6`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">{statusInfo.icon}</div>
                  <h2 className={`text-2xl font-bold ${statusInfo.textColor} mb-2`}>
                    {statusInfo.title}
                  </h2>
                  <p className={`${statusInfo.textColor} text-lg`}>
                    {statusInfo.description}
                  </p>
                </div>
              </div>

              {/* Información */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Detalles</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Negocio:</span>
                    <span className="font-medium">{registration.business_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contacto:</span>
                    <span className="font-medium">{registration.contact_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{registration.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{formatDate(registration.created_at)}</span>
                  </div>
                  {registration.payment_status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado del pago:</span>
                      <span className={`font-bold ${
                        registration.payment_status === 'completed' ? 'text-green-600' :
                        registration.payment_status === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {registration.payment_status === 'completed' && '💳 PAGADO'}
                        {registration.payment_status === 'pending' && '⏳ PENDIENTE'}
                        {registration.payment_status === 'failed' && '❌ FALLIDO'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              {registration.admin_notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">💬 Comentarios</h3>
                  <p className="text-yellow-700">{registration.admin_notes}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="text-center space-y-4">
                <button
                  onClick={() => {
                    setRegistration(null);
                    setSearchEmail('');
                    setError(null);
                  }}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  ← Buscar otro registro
                </button>
                
                <div>
                  <Link 
                    to="/"
                    className="text-gray-600 hover:text-gray-800 text-sm hover:underline"
                  >
                    Volver al Inicio
                  </Link>
                </div>
              </div>
            </>
          );
        })()}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            ¿Tienes preguntas? Contáctanos en{' '}
            <a href="mailto:ventas@charlitron.com" className="text-purple-600 hover:underline">
              ventas@charlitron.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatusPage;