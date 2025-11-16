export default function FeaturedStrip() {
  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-indigo-50 border p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm md:text-base text-indigo-900">
            <strong>¿Por qué Charlitron Eventos 360?</strong> Porque combinamos curaduría + velocidad:
            ves fotos reales, contactas por WhatsApp y eliges con confianza.
          </p>
          <a href="#categorias" className="inline-flex justify-center rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700">
            Ver categorías
          </a>
        </div>
      </div>
    </section>
  );
}
