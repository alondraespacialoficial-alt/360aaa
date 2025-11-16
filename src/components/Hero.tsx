import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[85vh] sm:min-h-[80vh] flex items-center">
      {/* Gradiente México con animaciones */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-white/10 to-red-400/20 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-pink-500/20 to-transparent" />
      
      {/* Patrones decorativos mexicanos - Optimizados para móvil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-5 sm:top-20 left-2 sm:left-10 text-2xl sm:text-6xl animate-bounce">🎉</div>
        <div className="absolute top-16 sm:top-40 right-4 sm:right-20 text-xl sm:text-4xl animate-pulse">🎊</div>
        <div className="absolute bottom-24 sm:bottom-32 left-4 sm:left-20 text-2xl sm:text-5xl animate-bounce delay-300">✨</div>
        <div className="absolute bottom-8 sm:bottom-20 right-2 sm:right-10 text-xl sm:text-3xl animate-pulse delay-500">🎪</div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-24 relative z-10">
        <div className="text-center">
          {/* Badge superior - Móvil optimizado */}
          <div className="mb-3 sm:mb-6">
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-red-500 text-white text-xs sm:text-sm font-bold rounded-full mb-3 sm:mb-4 animate-pulse shadow-lg">
              🇲🇽 #1 EN MÉXICO
            </span>
          </div>
          
          {/* Título principal - Mejor legibilidad móvil */}
          <h1 className="text-2xl sm:text-4xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent leading-tight px-2 sm:px-0">
            <span className="block">Directorio de</span>
            <span className="block">Proveedores</span>
            <span className="block text-xl sm:text-3xl md:text-6xl mt-1 sm:mt-2">para tu evento ✨</span>
          </h1>
          
          {/* Descripción - Más legible en móvil */}
          <p className="mt-3 sm:mt-6 text-sm sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            <strong className="text-purple-700">Charlitron Eventos 360</strong>: encuentra los mejores proveedores 
            verificados en <strong className="text-green-600">México</strong>. 
            <span className="block sm:inline mt-1 sm:mt-0">
              Cotiza al instante por WhatsApp, especialistas en <strong className="text-red-600">San Luis Potosí</strong> y toda la República.
            </span>
          </p>

          {/* Estadísticas impactantes - Optimizado móvil */}
          <div className="mt-4 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-6 sm:px-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-purple-200 transform hover:scale-105 transition-all">
              <div className="text-2xl sm:text-2xl md:text-3xl font-bold text-purple-600">500+</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Proveedores Verificados</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-green-200 transform hover:scale-105 transition-all">
              <div className="text-2xl sm:text-2xl md:text-3xl font-bold text-green-600">1000+</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Eventos Exitosos</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-red-200 transform hover:scale-105 transition-all">
              <div className="text-2xl sm:text-2xl md:text-3xl font-bold text-red-600">24/7</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Respuesta WhatsApp</div>
            </div>
          </div>

          {/* Call-to-action EXPLOSIVOS - Móvil optimizado */}
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link
              to="/proveedores/planes"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                <span className="text-base sm:text-lg">🚀</span>
                <span className="text-sm sm:text-base">¡Quiero ser proveedor!</span>
              </span>
            </Link>
            
            <a
              href="#categorias"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-bold text-purple-700 bg-white/90 backdrop-blur-sm border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-500 shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🎯</span>
                <span className="text-sm sm:text-base">¡Encuentra tu proveedor!</span>
              </span>
            </a>
          </div>

          {/* Mensajes de confianza - Stack en móvil */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm px-4 sm:px-0">
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-sm sm:text-lg">✅</span>
              <span className="font-semibold">Proveedores Verificados</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <span className="text-sm sm:text-lg">📱</span>
              <span className="font-semibold">Cotización Instantánea</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <span className="text-sm sm:text-lg">🇲🇽</span>
              <span className="font-semibold">Cobertura Nacional</span>
            </div>
          </div>
          
          <p className="mt-4 sm:mt-6 text-xs text-gray-500">
            ¿Eres admin? <Link to="/admin" className="underline hover:text-purple-600 transition-colors">Acceso Admin</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
