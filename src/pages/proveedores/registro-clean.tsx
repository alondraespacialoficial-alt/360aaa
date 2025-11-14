import React, { useState } from "react";
import { Link } from "react-router-dom";
import ProviderRegistrationForm from "../../../components/ProviderRegistrationForm";

export default function RegistroProveedor() {
  const [showForm, setShowForm] = useState(false);

  // Vista del formulario
  if (showForm) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition font-medium shadow-sm"
            >
              ← Ver información
            </button>
            <Link
              to="/proveedores/planes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-medium"
            >
              Ver planes
            </Link>
          </div>

          <ProviderRegistrationForm />
        </div>
      </main>
    );
  }

  // Vista de información (Coming Soon)
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

        {/* CTA Principal */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 p-8 md:p-12 text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <span className="text-5xl">✨</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Prueba el Formulario Ahora!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Hemos preparado una experiencia increíble para que registres tu negocio.
            <strong className="text-indigo-600"> Ya puedes probarlo</strong> y ver cómo funciona.
          </p>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg transform hover:scale-105"
          >
            <span className="text-2xl">🚀</span>
            Comenzar Registro
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Incluye IA para redactar descripciones profesionales ✨
          </p>
        </div>

        {/* Opción WhatsApp */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-8 border border-green-200">
          <h3 className="font-bold text-gray-900 mb-3 text-center">
            🤝 ¿Prefieres ayuda personalizada?
          </h3>
          <p className="text-gray-700 mb-4 text-center">
            También puedes registrarte de forma tradicional enviándonos un WhatsApp.
            ¡Te ayudamos con todo!
          </p>
          
          <div className="text-center">
            <a
              href="https://api.whatsapp.com/send/?phone=%2B524444237092&type=phone_number&app_absent=0&text=Hola, quiero registrarme en Charlitron Eventos 360. Mi giro es: ____"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-lg"
            >
              <span className="text-xl">📱</span>
              Contactar por WhatsApp
            </a>
          </div>
        </div>

        {/* Process Preview */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            📝 Proceso de Registro
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Datos Básicos</h4>
              <p className="text-sm text-gray-600">Nombre, email, contacto</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Ubicación</h4>
              <p className="text-sm text-gray-600">Dirección o Google Maps</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full font-bold mb-3">
                ✨
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Descripción con IA</h4>
              <p className="text-sm text-gray-600">Genera texto profesional</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full font-bold mb-3">
                ✓
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">¡Listo!</h4>
              <p className="text-sm text-gray-600">Aprobación rápida</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              ¿Preguntas? Escríbenos a{" "}
              <a href="mailto:ventas@charlitron.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                ventas@charlitron.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
