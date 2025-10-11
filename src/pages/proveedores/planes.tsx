import React, { useState } from "react";
import { waLink } from "../../utils/whats";

const WA_BASE = "https://api.whatsapp.com/send/?phone=%2B524444237092&type=phone_number&app_absent=0";

export default function PlanesProveedor() {
  const [billing, setBilling] = useState<"mensual" | "anual">("mensual");

  const basicPrice = billing === "mensual" ? "$99/mes" : "$1,000/año";
  const basicMsg =
    billing === "mensual"
      ? "Hola, me interesa el Paquete Básico $99/mes para ser proveedor en Charlitron Eventos 360. Mi giro es: ____"
      : "Hola, me interesa el Paquete Básico $1000/año para ser proveedor en Charlitron Eventos 360. Mi giro es: ____";

  const featuredPrice = billing === "mensual" ? "$199/mes" : "$1,990/año";
  const featuredMsg =
    billing === "mensual"
      ? "Hola, me interesa el Paquete Destacado $199/mes para ser proveedor en Charlitron Eventos 360. Mi giro es: ____"
      : "Hola, me interesa el Paquete Destacado $1990/año para ser proveedor en Charlitron Eventos 360. Mi giro es: ____";

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <a href="/" className="inline-block px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium">
            ← Regresar a portada
          </a>
        </div>
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Planes para Proveedores</h1>
          <p className="mt-3 text-gray-600">
            Elige tu visibilidad. Sin complicaciones. Nosotros te conectamos con quienes organizan eventos hojeando nuestro directorio.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setBilling("mensual")}
            className={`px-4 py-2 rounded-l-xl border ${billing==="mensual" ? "bg-indigo-600 text-white" : "bg-white"}`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBilling("anual")}
            className={`px-4 py-2 rounded-r-xl border ${billing==="anual" ? "bg-indigo-600 text-white" : "bg-white"}`}
          >
            Anual
          </button>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {/* Básico */}
          <div className="rounded-2xl border p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Básico</h3>
            <p className="mt-1 text-2xl font-bold">{basicPrice}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Ficha con datos de contacto</li>
              <li>• Hasta 5 fotos promocionales</li>
              <li>• Aparición en el directorio por categoría</li>
            </ul>
            <a
              href={waLink(WA_BASE, basicMsg)}
              className="mt-6 inline-flex w-full justify-center rounded-xl px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Quiero el Básico
            </a>
          </div>

          {/* Destacado */}
          <div className="rounded-2xl border p-6 shadow-sm ring-2 ring-indigo-600">
            <div className="inline-flex items-center text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">
              MÁS VISIBILIDAD
            </div>
            <h3 className="mt-2 text-xl font-semibold">Destacado</h3>
            <p className="mt-1 text-2xl font-bold">{featuredPrice}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Todo lo del Básico</li>
              <li>• Aparición en la franja superior de <strong>Destacados</strong></li>
              <li>• Mayor probabilidad de ser contratado</li>
            </ul>
            <a
              href={waLink(WA_BASE, featuredMsg)}
              className="mt-6 inline-flex w-full justify-center rounded-xl px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Quiero el Destacado
            </a>
            <p className="mt-3 text-xs text-gray-500">
              *Los Destacados se muestran primero en la portada y categoría.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 border p-5">
          <h4 className="font-semibold">¿Qué sigue?</h4>
          <ol className="mt-2 text-sm text-gray-700 list-decimal pl-5 space-y-1">
            <li>Envíanos WhatsApp con el plan elegido.</li>
            <li>Te pediremos: giro, ciudad, datos de contacto y hasta 5 fotos.</li>
            <li>Publicamos tu ficha y te mandamos el link para revisar.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
