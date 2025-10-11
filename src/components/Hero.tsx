import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-fuchsia-500/10 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Directorio de Proveedores para tu evento ✨
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600">
            <strong>Charlitron Eventos 360</strong>: encuentra proveedores verificados y cotiza
            al instante por WhatsApp. Ahorra tiempo, evita sorpresas y eleva tu experiencia.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/proveedores/planes"
              className="inline-flex items-center rounded-xl px-5 py-3 text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"
            >
              Quiero ser proveedor
            </Link>
            <a
              href="#categorias"
              className="inline-flex items-center rounded-xl px-5 py-3 bg-white border hover:bg-gray-50"
            >
              Explorar directorio
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            ¿Eres admin? <Link to="/admin" className="underline">Acceso Admin</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
