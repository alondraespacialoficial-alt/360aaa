import React, { useState, useEffect } from "react";
import { supabase } from "../../../services/supabaseClient";
import { waLink } from "../../utils/whats";

const WA_BASE = "https://api.whatsapp.com/send/?phone=%2B524444237092&type=phone_number&app_absent=0";

export default function PlanesProveedor() {
  const [billing, setBilling] = useState<"mensual" | "anual">("mensual");
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanes = async () => {
      setLoading(true);
      const { data } = await supabase.from("provider_plans").select("*");
      setPlanes(data || []);
      setLoading(false);
    };
    fetchPlanes();
  }, []);

  // Filtrar planes por tipo
  const planesMensual = planes.filter((p) =>
    p.name?.toLowerCase().includes("mensual")
  );
  const planesAnual = planes.filter((p) => p.name?.toLowerCase().includes("anual"));
  const planesMostrar = billing === "mensual" ? planesMensual : planesAnual;

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
          >
            ← Regresar a portada
          </a>
        </div>
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Planes para Proveedores
          </h1>
          <p className="mt-3 text-gray-600">
            Elige tu visibilidad. Sin complicaciones. Nosotros te conectamos con
            quienes organizan eventos hojeando nuestro directorio.
          </p>
        </div>

        {/* Sección de Opciones de Registro */}
        <div className="mt-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            📋 ¿Cómo quieres registrarte?
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Elige la opción que más te convenga
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Opción 1: Nosotros te ayudamos */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 hover:border-indigo-400 transition-all hover:shadow-xl">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Nosotros te Ayudamos
                </h3>
                <p className="text-sm text-gray-500 mt-1">Tradicional y personal</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Nos contactas por WhatsApp</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Nos envías tus datos y fotos</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Configuramos tu perfil completo</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Te avisamos cuando esté listo</span>
                </li>
              </ul>

              <a
                href={waLink(
                  WA_BASE,
                  `Hola, quiero registrarme en Charlitron Eventos 360 y necesito ayuda para configurar mi perfil. Mi giro es: ____`
                )}
                className="block w-full text-center px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md"
              >
                📱 Contactar por WhatsApp
              </a>
            </div>

            {/* Opción 2: Auto-registro */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-indigo-500 hover:border-indigo-600 transition-all hover:shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  NUEVO 🚀
                </span>
              </div>
              
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-3">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Regístrate Tú Mismo
                </h3>
                <p className="text-sm text-indigo-600 mt-1 font-medium">Rápido y fácil</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                  <span>Regístrate con Google en 5 min</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                  <span>Sube tus fotos directamente</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                  <span>Edita tu perfil cuando quieras</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                  <span>Activo tras nuestra aprobación</span>
                </li>
              </ul>

              <a
                href="/registro-proveedor"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              >
                🔐 Comenzar Registro
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            💡 <strong>Tip:</strong> Ambas opciones te dan acceso a los mismos planes y beneficios
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setBilling("mensual")}
            className={`px-4 py-2 rounded-l-xl border ${
              billing === "mensual" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBilling("anual")}
            className={`px-4 py-2 rounded-r-xl border ${
              billing === "anual" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            Anual
          </button>
        </div>

        {loading ? (
          <div className="mt-10 text-center text-gray-500">
            Cargando planes...
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {planesMostrar.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 shadow-sm ${
                  plan.name.toLowerCase().includes("destacado")
                    ? "ring-2 ring-indigo-600"
                    : ""
                }`}
              >
                {plan.name.toLowerCase().includes("destacado") && (
                  <div className="inline-flex items-center text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">
                    MÁS VISIBILIDAD
                  </div>
                )}
                <h3 className="mt-2 text-xl font-semibold">
                  {plan.name.replace(/(Mensual|Anual)/i, "").trim()}
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  ${plan.price}
                  {billing === "mensual" ? "/mes" : "/año"}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {plan.description
                    ?.split(".")
                    .map(
                      (line: string, idx: number) =>
                        line.trim() && <li key={idx}>• {line.trim()}</li>
                    )}
                </ul>
                <a
                  href={waLink(
                    WA_BASE,
                    `Hola, me interesa el Paquete ${plan.name} $${plan.price}${billing === "mensual" ? "/mes" : "/año"} para ser proveedor en Charlitron Eventos 360. Mi giro es: ____`
                  )}
                  className="mt-6 inline-flex w-full justify-center rounded-xl px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Quiero el {plan.name.replace(/(Mensual|Anual)/i, "").trim()}
                </a>
                {plan.name.toLowerCase().includes("destacado") && (
                  <p className="mt-3 text-xs text-gray-500">
                    *Los Destacados se muestran primero en la portada y categoría.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-gray-50 border p-5">
          <h4 className="font-semibold">¿Qué sigue?</h4>
          <ol className="mt-2 text-sm text-gray-700 list-decimal pl-5 space-y-1">
            <li>Envíanos WhatsApp con el plan elegido.</li>
            <li>Te pediremos: giro, ciudad, datos de contacto y hasta 5 fotos.</li>
            <li>Publicamos tu ficha y te mandamos el link para revisar.</li>
          </ol>
        </div>

        <div className="mt-6 rounded-xl bg-indigo-50 px-6 py-4 text-indigo-900 font-medium">
          <strong>Tu evento perfecto empieza aquí 💍🎉</strong> Encuentra proveedores reales, cotiza al instante y planea sin estrés.
        </div>
      </section>
    </main>
  );
}
