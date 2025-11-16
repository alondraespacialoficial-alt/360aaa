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

  const handleEmailSearch = async (emailToSearch: string) => {
    if (!emailToSearch.trim()) {
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
        .ilike('email', emailToSearch.trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setError(`No se encontró ningún registro con el email: ${emailToSearch}`);
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
        // Búsqueda más flexible por email (case insensitive)
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
          color: 'blue',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: '⏳',
          title: 'Solicitud Pendiente',
          description: 'Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando tengamos una respuesta.'
        };
      case 'approved':
        return {
          color: 'green',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: '✅',
          title: '¡Solicitud Aprobada!',
          description: 'Tu negocio ha sido aprobado y ya aparece en nuestro directorio público.'
        };
      case 'rejected':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: '❌',
          title: 'Solicitud No Aprobada',
          description: 'Tu solicitud no pudo ser aprobada en este momento. Revisa los comentarios y puedes volver a aplicar.'
        };
      default:
        return {
          color: 'gray',
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Consultando estado de tu solicitud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Error</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Link 
              to="/proveedores/registro"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Volver al Registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!registration) {
    return null;
  }

  const statusInfo = getStatusInfo(registration.status);

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

        {/* Formulario de búsqueda - Solo mostrar si no hay registro cargado */}
        {!registration && !loading && (
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
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailSearch(searchEmail)}
                />
                <button
                  onClick={() => handleEmailSearch(searchEmail)}
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

        {/* Mensaje de éxito post-pago */}
        {success && sessionId && registration && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-green-700 mb-2">
                ¡Pago Procesado Exitosamente!
              </h2>
              <p className="text-green-600 mb-4">
                Tu suscripción ha sido activada. Tu solicitud está ahora en proceso de revisión por nuestro equipo.
              </p>
              <p className="text-sm text-green-600">
                Recibirás una notificación cuando tu perfil sea aprobado y publicado en el directorio.
              </p>
            </div>
          </div>
        )}

        {/* Tarjeta principal de estado - Solo mostrar si hay registro */}
        {registration && (
        <div className={`${statusInfo.bgColor} border-2 ${statusInfo.borderColor} rounded-xl p-8 mb-6`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{statusInfo.icon}</div>
            <h2 className={`text-2xl font-bold ${statusInfo.textColor} mb-2`}>
              {statusInfo.title}
            </h2>
            <p className={`${statusInfo.textColor} text-lg mb-4`}>
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Información del registro */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📋 Detalles de la Solicitud
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Negocio:</span>
              <span className="font-medium text-gray-900">{registration.business_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contacto:</span>
              <span className="font-medium text-gray-900">{registration.contact_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{registration.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha de solicitud:</span>
              <span className="font-medium text-gray-900">{formatDate(registration.created_at)}</span>
            </div>
            {registration.updated_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Última actualización:</span>
              <span className="font-medium text-gray-900">{formatDate(registration.updated_at)}</span>
            </div>
          )}
          {registration.payment_status && (
            <div className="flex justify-between">
              <span className="text-gray-600">Estado del pago:</span>
              <span className={`font-medium ${
                registration.payment_status === 'completed' ? 'text-green-600' :
                registration.payment_status === 'failed' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {registration.payment_status === 'completed' && '💳 Pagado'}
                {registration.payment_status === 'pending' && '⏳ Pendiente de pago'}
                {registration.payment_status === 'failed' && '❌ Pago fallido'}
                {registration.payment_status === 'cancelled' && '🚫 Pago cancelado'}
              </span>
            </div>
          )}
        </div>          {registration.categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Categorías:</p>
              <div className="flex flex-wrap gap-2">
                {registration.categories.map(category => (
                  <span key={category} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notas administrativas (solo si hay) */}
        {registration.admin_notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">
              💬 Comentarios del Equipo
            </h3>
            <p className="text-yellow-700">{registration.admin_notes}</p>
          </div>
        )}

        {/* Acciones según el estado */}
        <div className="text-center space-y-4">
          {registration.status === 'approved' && (
            <div className="space-y-2">
              <Link 
                to="/"
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition mr-4"
              >
                🏠 Ver en Directorio
              </Link>
              <Link 
                to="/proveedores/registro"
                className="inline-block bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Registrar Otro Negocio
              </Link>
            </div>
          )}
          
          {registration.status === 'rejected' && (
            <div className="space-y-2">
              <Link 
                to="/proveedores/registro"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition mr-4"
              >
                🔄 Aplicar Nuevamente
              </Link>
              <Link 
                to="/"
                className="inline-block bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Volver al Inicio
              </Link>
            </div>
          )}
          
          {registration.status === 'pending' && (
            <div className="space-y-2">
              <button
                onClick={fetchRegistrationStatus}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition mr-4"
              >
                🔄 Actualizar Estado
              </button>
              <Link 
                to="/"
                className="inline-block bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Volver al Inicio
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Footer informativo */}
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