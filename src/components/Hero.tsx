import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Gradiente México con animaciones */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-white/10 to-red-400/20 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-pink-500/20 to-transparent" />
      
      {/* Patrones decorativos mexicanos */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-6xl animate-bounce">🎉</div>
        <div className="absolute top-40 right-20 text-4xl animate-pulse">🎊</div>
        <div className="absolute bottom-32 left-20 text-5xl animate-bounce delay-300">✨</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-500">🎪</div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
        <div className="text-center">
          {/* Título principal impactante */}
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-red-500 text-white text-sm font-bold rounded-full mb-4 animate-pulse">
              🇲🇽 #1 EN MÉXICO
            </span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            Directorio de Proveedores
            <br />
            <span className="text-3xl md:text-6xl">para tu evento ✨</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-purple-700">Charlitron Eventos 360</strong>: encuentra los mejores proveedores 
            verificados en <strong className="text-green-600">México</strong>. Cotiza al instante por WhatsApp, 
            especialistas en <strong className="text-red-600">San Luis Potosí</strong> y toda la República Mexicana.
          </p>

          {/* Estadísticas impactantes */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-purple-200 transform hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-gray-600">Proveedores Verificados</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-green-200 transform hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl font-bold text-green-600">1000+</div>
              <div className="text-sm text-gray-600">Eventos Exitosos</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-red-200 transform hover:scale-105 transition-all">
              <div className="text-2xl md:text-3xl font-bold text-red-600">24/7</div>
              <div className="text-sm text-gray-600">Respuesta WhatsApp</div>
            </div>
          </div>

          {/* Call-to-action EXPLOSIVOS */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/proveedores/planes"
              className="group relative inline-flex items-center rounded-2xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                🚀 ¡Quiero ser proveedor!
              </span>
            </Link>
            
            <a
              href="#categorias"
              className="group relative inline-flex items-center rounded-2xl px-8 py-4 text-lg font-bold text-purple-700 bg-white/90 backdrop-blur-sm border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-500 shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                🎯 ¡Encuentra tu proveedor AHORA!
              </span>
            </a>
          </div>

          {/* Mensaje de confianza */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-lg">✅</span>
              <span className="font-semibold">Proveedores Verificados</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <span className="text-lg">📱</span>
              <span className="font-semibold">Cotización Instantánea</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <span className="text-lg">🇲🇽</span>
              <span className="font-semibold">Cobertura Nacional</span>
            </div>
          </div>
          
          <p className="mt-6 text-xs text-gray-500">
            ¿Eres admin? <Link to="/admin" className="underline hover:text-purple-600 transition-colors">Acceso Admin</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
