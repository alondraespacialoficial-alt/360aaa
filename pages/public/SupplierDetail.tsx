import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getProviderFullDetail } from '../../services/supabaseClient';
import FavoriteButton from '../../components/FavoriteButton';

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
  const [showModal, setShowModal] = useState(false);
  const [modalImg, setModalImg] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      
      // Usar la función optimizada del cliente Supabase
      const result = await getProviderFullDetail(id);
      
      if (result.provider) {
        // Unir servicios e imágenes al proveedor
        setSupplier({
          ...result.provider,
          services: result.services || [],
          media: result.media || []
        });
        setReviews(result.reviews || []);
      } else {
        setSupplier(null);
        setReviews([]);
      }
      
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
    if (!supplier || !supplier.whatsapp) return '#';
    const whatsNumber = supplier.whatsapp.replace(/\D/g, '');
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
      {/* Modal de imagen grande */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <img src={modalImg} alt="Imagen grande" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl border-4 border-white" />
        </div>
      )}
      {/* Información del proveedor */}
      {supplier && (
        <div className="p-4 md:p-6 bg-gray-50 border-b mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition font-semibold shadow"
          >
            ← Regresar
          </button>
          {/* Imágenes principales del proveedor */}
          <div className="mb-4">
            {supplier.media && supplier.media.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {supplier.media.slice(0, 5).map((img) => (
                  <div key={img.id} className="flex items-center justify-center bg-white rounded-xl border-2 border-purple-200 shadow-md overflow-hidden" style={{height: '180px'}}>
                    <img src={img.url} alt={img.kind} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-purple-700">{supplier.name}</h1>
                <FavoriteButton 
                  provider={{
                    id: supplier.id,
                    name: supplier.name,
                    description: supplier.description,
                    profile_image_url: supplier.profile_image_url,
                    whatsapp: supplier.whatsapp
                  }}
                  size="lg"
                />
              </div>
              {supplier.contact_name && (
                <p className="text-lg text-gray-700 mb-2"><strong>Contacto:</strong> {supplier.contact_name}</p>
              )}
              <p className="text-gray-600 mb-2">{supplier.description}</p>
              
              {/* Dirección - Detectar si es un enlace o dirección normal */}
              <div className="text-gray-500 mb-4">
                {supplier.address && (
                  <>
                    {supplier.address.startsWith('http') ? (
                      <a 
                        href={supplier.address} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 underline hover:text-blue-800 transition inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Ver ubicación en Google Maps
                      </a>
                    ) : (
                      <span>{supplier.address}</span>
                    )}
                    {supplier.city && <span>, {supplier.city}</span>}
                    {supplier.state && <span>, {supplier.state}</span>}
                  </>
                )}
              </div>
              {/* Contacto en renglones separados */}
              <div className="mt-2 space-y-2">
                {supplier.whatsapp && (
                  <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 transition">
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
              {/* Redes sociales: solo mostrar si existen */}
              <div className="flex flex-row gap-4 mt-4">
                {supplier.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sitio web</a>
                )}
                {supplier.instagram_url && (
                  <a href={supplier.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">Instagram</a>
                )}
                {supplier.facebook_url && (
                  <a href={supplier.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">Facebook</a>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Premium: {supplier.is_premium ? 'Sí' : 'No'}</span> | <span>Destacado: {supplier.featured ? 'Sí' : 'No'}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Calificación promedio: {supplier.rating_average ?? 'N/A'}</span> | <span>Reseñas: {reviews.length}</span>
              </div>
            </div>
          </div>
          {/* Imagen de portada con click para modal */}
          {supplier.cover_image && (
            <img
              src={supplier.cover_image}
              alt="Portada"
              className="w-full h-48 object-cover rounded-lg mb-4 border-4 border-purple-200 cursor-pointer"
              onClick={() => { setModalImg(supplier.cover_image); setShowModal(true); }}
              title="Haz clic para ver en grande"
            />
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
          {/* Cotizador WhatsApp y monto total */}
          <div className="mt-6">
            {cart.length > 0 && (
              <div className="mb-4 text-lg font-semibold text-gray-700">
                Monto total seleccionado: $ {totalCost.toFixed(2)}
              </div>
            )}
            {cart.length === 0 ? (
              <span className="text-gray-500">Selecciona al menos un servicio para cotizar.</span>
            ) : supplier.whatsapp ? (
              <a
                href={buildWALink()}
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
          {/* Formulario y lista de reseñas */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Reseñas de Proveedores</h2>
            <ReviewForm providerId={supplier.id} onNewReview={review => setReviews([review, ...reviews])} />
            <div className="mt-6">
              {reviews.length === 0 ? (
                <p className="text-gray-500">No hay reseñas aún.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map(r => (
                    <li key={r.id} className="p-4 bg-white border rounded shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                        <span className="text-gray-700 font-semibold">{r.comment}</span>
                      </div>
                      <div className="text-xs text-gray-400">{r.created_at?.slice(0,10)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}