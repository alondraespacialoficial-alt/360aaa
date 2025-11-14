import React, { useState } from "react";
import { Link } from "react-router-dom";
import SmartLocationInput from "../../../components/SmartLocationInput";
import AIDescriptionHelper from "../../../components/AIDescriptionHelper";

export default function RegistroProveedor() {
  const [step, setStep] = useState(0);
  
  // Estado de ejemplo para demostrar componentes
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    mapsUrl: undefined as string | undefined
  });

  const [businessData, setBusinessData] = useState({
    name: '',
    category: '',
    description: '',
    services: [] as string[]
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/proveedores/planes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition font-medium shadow-sm"
          >
            ← Regresar a Planes
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Registro de Proveedores
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Únete al directorio de eventos más completo de México.<br />
            <span className="text-indigo-600 font-semibold">
              ¡Crea tu perfil en minutos!
            </span>
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Registro Rápido</h3>
            <p className="text-sm text-gray-600">
              Solo 5 minutos con tu cuenta de Google
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-gray-900 mb-2">Verificación</h3>
            <p className="text-sm text-gray-600">
              Revisamos tu perfil antes de publicarlo
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-bold text-gray-900 mb-2">Más Clientes</h3>
            <p className="text-sm text-gray-600">
              Miles de usuarios buscando proveedores
            </p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg">
            <span className="text-5xl">🚧</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Próximamente Disponible!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Estamos preparando una experiencia increíble para que registres tu negocio
            de forma rápida y sencilla. Muy pronto podrás:
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h4 className="font-semibold text-gray-900">Inicia con Google</h4>
                <p className="text-sm text-gray-600">Acceso seguro y rápido</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <h4 className="font-semibold text-gray-900">Sube tus Fotos</h4>
                <p className="text-sm text-gray-600">Muestra tu trabajo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <h4 className="font-semibold text-gray-900">Edita tu Perfil</h4>
                <p className="text-sm text-gray-600">Control total 24/7</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="font-semibold text-gray-900">Pago Seguro</h4>
                <p className="text-sm text-gray-600">Con Stripe</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">
              ⏰ Mientras tanto...
            </h3>
            <p className="text-gray-700 mb-4">
              Puedes registrarte de forma tradicional enviándonos un WhatsApp.
              ¡Te ayudamos con todo!
            </p>
            
            <a
              href="https://api.whatsapp.com/send/?phone=%2B524444237092&type=phone_number&app_absent=0&text=Hola, quiero registrarme en Charlitron Eventos 360. Mi giro es: ____"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg"
            >
              <span className="text-xl">📱</span>
              Contactar por WhatsApp
            </a>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ¿Preguntas? Escríbenos a{" "}
              <a href="mailto:ventas@charlitron.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                ventas@charlitron.com
              </a>
            </p>
          </div>
        </div>

        {/* Process Preview */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            📝 Proceso de Registro (Cuando esté listo)
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Regístrate</h4>
              <p className="text-sm text-gray-600">Con Google OAuth</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Completa</h4>
              <p className="text-sm text-gray-600">Datos y fotos</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Elige Plan</h4>
              <p className="text-sm text-gray-600">Y paga seguro</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full font-bold mb-3">
                ✓
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">¡Listo!</h4>
              <p className="text-sm text-gray-600">Aprobación rápida</p>
            </div>
          </div>

          {/* Demo del SmartLocationInput */}
          <div className="border-t pt-8 mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              👀 Vista Previa: Campo Inteligente de Ubicación
            </h4>
            <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl">
              <SmartLocationInput
                value={locationData}
                onChange={setLocationData}
              />
              
              {/* Debug info */}
              {(locationData.address || locationData.mapsUrl) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-mono text-gray-500 mb-1">Datos que se guardarían:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(locationData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Demo del AIDescriptionHelper */}
          <div className="border-t pt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              ✨ Vista Previa: IA para Descripciones Profesionales
            </h4>
            <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl">
              {/* Campos de contexto para la IA */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    value={businessData.name}
                    onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
                    placeholder="Ej: Fotografía María López"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={businessData.category}
                    onChange={(e) => setBusinessData({...businessData, category: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Autos">🚗 Autos</option>
                    <option value="Transporte">🚐 Transporte</option>
                    <option value="Música y Entretenimiento">🎵 Música y Entretenimiento</option>
                    <option value="Fotografía y Video">📸 Fotografía y Video</option>
                    <option value="Entretenimiento">🎪 Entretenimiento</option>
                    <option value="Maquillaje">💄 Maquillaje</option>
                    <option value="Repostería y dulces">🍰 Repostería y dulces</option>
                    <option value="Mobiliario">🪑 Mobiliario</option>
                    <option value="Peluquería">💇 Peluquería</option>
                    <option value="Organizadores">📋 Organizadores</option>
                    <option value="Vestuario">👗 Vestuario</option>
                    <option value="Banquetes y Catering">🍽️ Banquetes y Catering</option>
                    <option value="Personal">👤 Personal</option>
                    <option value="Salones">🏛️ Salones</option>
                    <option value="Comida y bebidas">🍕 Comida y bebidas</option>
                    <option value="Lugares y Salones">🏰 Lugares y Salones</option>
                    <option value="Decoración y Ambientación">🎨 Decoración y Ambientación</option>
                    <option value="Flores y decoración">🌸 Flores y decoración</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={locationData.city}
                      onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                      placeholder="Ej: Monterrey"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={locationData.state}
                      onChange={(e) => setLocationData({...locationData, state: e.target.value})}
                      placeholder="Ej: Nuevo León"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Componente de IA */}
              <AIDescriptionHelper
                value={businessData.description}
                onChange={(newDesc) => setBusinessData({...businessData, description: newDesc})}
                businessContext={{
                  businessName: businessData.name,
                  category: businessData.category,
                  services: businessData.services,
                  city: locationData.city,
                  state: locationData.state
                }}
              />

              {/* Debug info */}
              {businessData.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-mono text-gray-500 mb-1">Longitud: {businessData.description.length} caracteres</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
