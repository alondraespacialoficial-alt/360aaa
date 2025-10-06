import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

// Componente para el formulario de reseña
function ReviewForm({ providerId, onNewReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!comment.trim()) {
      setError("Por favor escribe tu opinión");
      setLoading(false);
      return;
    }
    const { data, error: insertError } = await supabase
      .from('provider_reviews')
      .insert({ provider_id: providerId, rating, comment })
      .select()
      .single();
    if (insertError || !data) {
      setError("No se pudo guardar la reseña");
    } else {
      setSuccess(true);
      setComment("");
      setRating(5);
      onNewReview(data);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white border rounded-lg shadow">
      <label className="block mb-2 font-medium">Calificación:</label>
      <div className="flex gap-1 mb-2">
        {[1,2,3,4,5].map(star => (
          <button type="button" key={star} onClick={() => setRating(star)} className={star <= rating ? "text-yellow-500" : "text-gray-300"}>
            ★
          </button>
        ))}
      </div>
      <label className="block mb-2 font-medium">Opinión:</label>
      <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded p-2 mb-2" rows={3} placeholder="Escribe tu experiencia..." />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">¡Gracias por tu reseña!</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
        {loading ? "Guardando..." : "Enviar reseña"}
      </button>
    </form>
  );
}

// Componente principal SupplierDetail
export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [cart, setCart] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      // Traer proveedor desde providers
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .single();

      // Traer servicios relacionados desde provider_services
      const { data: servicesData } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', id);

      // Traer imágenes adicionales desde provider_media
      const { data: mediaData } = await supabase
        .from('provider_media')
        .select('*')
        .eq('provider_id', id);

      // Unir servicios e imágenes al proveedor
      setSupplier(providerData ? { ...providerData, services: servicesData || [], media: mediaData || [] } : null);
      setLoading(false);
    }
    fetchDetails();
  }, [id]);

  const toggleCartItem = (service) => {
    setCart(prevCart =>
      prevCart.some(item => item.id === service.id)
        ? prevCart.filter(item => item.id !== service.id)
        : [...prevCart, service]
    );
  };

  const totalCost = useMemo(() => {
    return cart.reduce((total, item) => total + (typeof item.price === 'number' ? item.price : 0), 0);
  }, [cart]);

  const buildWALink = () => {
    if (!supplier || !supplier.contact?.whatsapp) return '#';
    const whatsNumber = supplier.contact.whatsapp.replace(/\D/g, '');
    const lines = [
      'Hola, vimos tu anuncio en Charlitron Eventos 360.',
      `Proveedor: ${supplier.name}`,
      'Servicios de interés:',
      ...cart.map(i => `• ${i.name} – $${i.price ? i.price.toFixed(2) : ''}`),
      '------------------',
      `Total aproximado: $${totalCost.toFixed(2)}`
    ];
    return `https://wa.me/${whatsNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto font-sans bg-white">
      {/* Información del proveedor */}
      {supplier && (
        <div className="p-4 md:p-6 bg-gray-50 border-b mb-6">
          {/* Imágenes */}
          <div className="flex items-center mb-4">
            <img src={supplier.profile_image || `https://picsum.photos/seed/${supplier.id}/100`} alt={supplier.name} className="h-24 w-24 rounded-full object-cover mr-6 border-4 border-purple-300" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{supplier.name}</h1>
              <p className="text-gray-600 mt-2">{supplier.description}</p>
              <p className="text-gray-500">{supplier.address}, {supplier.city}, {supplier.state}</p>
              {/* Contacto en renglones separados */}
              <div className="mt-4 space-y-2">
                {supplier.whatsapp && (
                  <a href={`https://wa.me/${supplier.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 13.487a8.25 8.25 0 1 1-3.612-3.612m3.612 3.612c-.306-.153-.612-.306-.918-.459a2.25 2.25 0 0 0-2.835.459c-.459.459-.918.918-1.377 1.377a2.25 2.25 0 0 0 .459 2.835c.153.306.306.612.459.918" /></svg>
                    WhatsApp: {supplier.whatsapp}
                  </a>
                )}
                {supplier.email && (
                  <a href={`mailto:${supplier.email}`} className="text-purple-700 underline block">Email: {supplier.email}</a>
                )}
                {supplier.phone && (
                  <span className="text-blue-700 block">Teléfono: {supplier.phone}</span>
                )}
              </div>
              {/* Redes sociales: mostrar todos los campos posibles */}
              <div className="flex flex-col gap-2 mt-3">
                <span>
                  {supplier.website_url ? (
                    <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sitio web</a>
                  ) : supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sitio web</a>
                  ) : (
                    <span className="text-gray-400">Sitio web: No disponible</span>
                  )}
                </span>
                <span>
                  {supplier.instagram_url ? (
                    <a href={supplier.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Instagram</a>
                  ) : supplier.instagram ? (
                    <a href={supplier.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Instagram</a>
                  ) : (
                    <span className="text-gray-400">Instagram: No disponible</span>
                  )}
                </span>
                <span>
                  {supplier.facebook_url ? (
                    <a href={supplier.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">Facebook</a>
                  ) : supplier.facebook ? (
                    <a href={supplier.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">Facebook</a>
                  ) : (
                    <span className="text-gray-400">Facebook: No disponible</span>
                  )}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Verificado: {supplier.is_verified ? 'Sí' : 'No'}</span> | <span>Premium: {supplier.is_premium ? 'Sí' : 'No'}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Calificación promedio: {supplier.rating_averag ?? 'N/A'}</span> | <span>Reseñas: {supplier.total_reviews ?? 0}</span> | <span>Eventos: {supplier.total_events ?? 0}</span> | <span>Años experiencia: {supplier.years_experie ?? 'N/A'}</span>
              </div>
            </div>
          </div>
          {/* Imagen de portada */}
          {supplier.cover_image && (
            <img src={supplier.cover_image} alt="Portada" className="w-full h-48 object-cover rounded-lg mb-4 border-4 border-purple-200" />
          )}
          {/* Imágenes adicionales */}
          {supplier.media && supplier.media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {supplier.media.map((img) => (
                <img key={img.id} src={img.url} alt={img.kind} className="w-full h-32 object-cover rounded-lg border-2 border-purple-100" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Servicios del proveedor */}
      {supplier?.services && supplier.services.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.services.map(service => (
              <div key={service.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-purple-700">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                  <span className="text-gray-800 font-semibold">${service.price}</span>
                </div>
                <button onClick={() => toggleCartItem(service)} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                  {cart.some(item => item.id === service.id) ? 'Quitar' : 'Agregar'}
                </button>
              </div>
            ))}
          </div>
          {/* Cotizador WhatsApp */}
          <div className="mt-6">
            {cart.length === 0 ? (
              <span className="text-gray-500">Selecciona al menos un servicio para cotizar.</span>
            ) : supplier.whatsapp ? (
              <a
                href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, vimos tu anuncio en Charlitron Eventos 360.\nProveedor: ${supplier.name}\nServicios de interés:\n${cart.map(i => `• ${i.name} – $${i.price ? i.price.toFixed(2) : ''}`).join('\n')}\n------------------\nTotal aproximado: $${cart.reduce((total, item) => total + (typeof item.price === 'number' ? item.price : 0), 0).toFixed(2)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition font-bold"
              >
                Cotizar por WhatsApp
              </a>
            ) : (
              <button disabled className="inline-block px-5 py-2 bg-gray-400 text-white rounded font-bold cursor-not-allowed" title="No hay número de WhatsApp disponible">
                Cotizar por WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}