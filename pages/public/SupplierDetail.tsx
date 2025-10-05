
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Supplier, Service } from '../../types';
import { ChevronLeftIcon, WhatsAppIcon, PlusCircleIcon, MinusCircleIcon, ShoppingCartIcon } from '../../components/icons';

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<{ id: number; kind: string; url: string; sort_order: number }[]>([]);
  const [reviews, setReviews] = useState<{ id: number; user_id: string; rating: number; comment: string; created_at: string }[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);

      const { data: supData, error: supError } = await supabase
  .from('providers')
  .select('id, name, contact_name, email, phone, whatsapp, address, city, state, description, profile_image_url, cover_image_url, website_url, instagram_url, facebook_url, is_verified, is_premium, is_active, rating_average, total_reviews, total_events, years_experience, created_at, updated_at, featured, facebook, website')
  .eq('id', id)
  .eq('is_active', true)
  .single();

      if (supError || !supData) {
        setError('Proveedor no encontrado.');
        setLoading(false);
        return;
      }
      setSupplier(supData);

      const { data: servData, error: servError } = await supabase
  .from('provider_services')
  .select('id, name, description, price')
  .eq('provider_id', id)
  .order('name');

      if (servError) {
        setError('Error al cargar servicios.');
        console.error(servError);
      } else {
        setServices(servData);
      }

      // Consulta de media
      const { data: mediaData, error: mediaError } = await supabase
        .from('provider_media')
        .select('id, kind, url, sort_order')
        .eq('provider_id', id)
        .order('sort_order', { ascending: true });

      if (mediaError) {
        console.error('Error al cargar media:', mediaError);
      } else {
        setMedia(mediaData || []);
      }

      // Consulta de reseñas
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('provider_reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('provider_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error al cargar reseñas:', reviewsError);
      } else {
        setReviews(reviewsData || []);
      }

      setLoading(false);
    };

    fetchDetails();
  }, [id]);

  const toggleCartItem = (service: Service) => {
    setCart(prevCart => 
      prevCart.some(item => item.id === service.id)
        ? prevCart.filter(item => item.id !== service.id)
        : [...prevCart, service]
    );
  };

  const totalCost = useMemo(() => {
    return cart.reduce((total, item) => total + item.cost, 0);
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

  if (error || !supplier) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }
  
  const goBackUrl = supplier.categories ? `/categoria/${(supplier.categories as any).slug}` : '/embed';

  return (
    <div className="max-w-7xl mx-auto font-sans bg-white">
      {reviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reseñas</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center mb-2">
                  <span className="font-bold text-purple-700 mr-2">{r.rating}★</span>
                  <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
       <div className="p-4 md:p-6 flex items-center bg-gray-50 border-b">
         <button onClick={() => navigate(goBackUrl)} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition">
           <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
         </button>
      <div className="flex items-center">
            <img src={supplier.profile_image_url || `https://picsum.photos/seed/${supplier.id}/100`} alt={supplier.name} className="h-12 w-12 rounded-full object-cover mr-4" />
            <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
            <a href="/admin/panel" className="ml-4 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Admin</a>
            <button onClick={() => navigate('/embed')} className="ml-4 px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">Regresar a portada</button>
      </div>
       </div>
      
       <div className="p-4 md:p-6">
        <p className="text-gray-600 mb-6">{supplier.description}</p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contacto y redes</h2>
          <div className="flex flex-col gap-1">
            {supplier.contact?.whatsapp && <span>WhatsApp: <a href={`https://wa.me/${supplier.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">{supplier.contact.whatsapp}</a></span>}
            {supplier.contact?.phone && <span>Teléfono: <a href={`tel:${supplier.contact.phone}`} className="text-blue-700 underline">{supplier.contact.phone}</a></span>}
            {supplier.contact?.email && <span>Email: <a href={`mailto:${supplier.contact.email}`} className="text-purple-700 underline">{supplier.contact.email}</a></span>}
            {supplier.contact?.maps_url && <span>Web: <a href={supplier.contact.maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{supplier.contact.maps_url}</a></span>}
            {supplier.contact?.facebook && <span>Facebook: <a href={supplier.contact.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{supplier.contact.facebook}</a></span>}
            {supplier.contact?.instagram && <span>Instagram: <a href={supplier.contact.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-700 underline">{supplier.contact.instagram}</a></span>}
          </div>
        </div>

        {media.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.filter(m => m.kind === 'image').map((m, index) => (
                <img key={m.id} src={m.url} alt={`Imagen ${index + 1}`} className="w-full h-40 object-cover rounded-lg shadow-md" />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Servicios</h2>
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold text-gray-800">{service.name}</h4>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <p className="font-semibold text-purple-600 mt-1">${service.price ? service.price.toFixed(2) : 'Consultar'}</p>
                </div>
                <button onClick={() => toggleCartItem(service)} className="transition-transform duration-200 ease-in-out hover:scale-110">
                  {cart.some(item => item.id === service.id) 
                    ? <MinusCircleIcon className="h-8 w-8 text-red-500" />
                    : <PlusCircleIcon className="h-8 w-8 text-green-500" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {cart.length > 0 && (
        <div className="sticky bottom-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-6 w-6 text-purple-600"/>
                <span className="font-semibold text-gray-700">{cart.length} servicio(s) seleccionado(s)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">Total: ${totalCost.toFixed(2)}</p>
            </div>
            <a href={buildWALink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 transition-colors shadow-lg">
              <WhatsAppIcon className="h-6 w-6 mr-2"/>
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDetail;
