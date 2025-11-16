export default function ValueProps() {
  const items = [
    { title: "Directorio verificado", desc: "Proveedores evaluados y fichas claras (datos + fotos)." },
    { title: "Cotiza al instante", desc: "Botón directo a WhatsApp con mensaje prellenado." },
    { title: "Mejor visibilidad", desc: "Planes de proveedor con opción Destacado (más clics y contratos)." },
  ];
  return (
    <section className="py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-3 gap-4">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{i.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{i.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
