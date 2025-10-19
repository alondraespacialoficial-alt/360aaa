import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, getProviderFullDetail } from '../../services/supabaseClient';
import FavoriteButton from '../../components/FavoriteButton';
import SEOHead from '../../components/SEOHead';
import ProviderDashboard from '../../components/ProviderDashboard';
import { useProviderTracking } from '../../hooks/useProviderTracking';
import AuthenticatedReviewForm from '../../components/AuthenticatedReviewForm';
import ReviewsDisplay from '../../components/ReviewsDisplay';

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

  // Validación temprana: si no hay ID, mostrar error
  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error: Proveedor no encontrado</h1>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del proveedor.</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // 📊 Hook de tracking para analytics
  const {
    trackWhatsAppClick,
    trackPhoneClick,
    trackWebsiteClick,
    trackInstagramClick,
    trackFacebookClick,
    trackServiceView,
    trackGalleryView,
    trackCategoryClick
  } = useProviderTracking(id);

  // 📊 Funciones de tracking para eventos de contacto
  const handleWhatsAppClick = () => {
    trackWhatsAppClick(supplier?.whatsapp);
  };

  const handlePhoneClick = () => {
    trackPhoneClick(supplier?.phone);
  };

  const handleWebsiteClick = () => {
    trackWebsiteClick(supplier?.website);
  };

  const handleInstagramClick = () => {
    trackInstagramClick(supplier?.instagram_url);
  };

  const handleFacebookClick = () => {
    trackFacebookClick(supplier?.facebook_url);
  };

  const handleServiceClick = (service: any) => {
    trackServiceView(service.name, service.id);
    toggleCartItem(service);
  };

  const handleGalleryClick = () => {
    if (supplier?.media?.length) {
      trackGalleryView(supplier.media.length);
    }
  };

  const handleCategoryClick = (category: any) => {
    trackCategoryClick(category.name, category.slug);
  };

  useEffect(() => {
    async function fetchDetails() {
      // Validar que tenemos un ID válido
      if (!id) {
        console.error('❌ No se encontró ID del proveedor en la URL');
        setSupplier(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        console.log('🔍 Obteniendo detalles del proveedor:', id);
        
        // Usar la función optimizada del cliente Supabase
        const result = await getProviderFullDetail(id);
        
        if (result.provider) {
          console.log('✅ Proveedor encontrado:', result.provider.name);
          console.log('📋 Categorías del proveedor:', result.providerCategories);
          
          // Mapear categorías correctamente
          const mappedCategories = result.providerCategories?.map(pc => pc.categories).filter(Boolean) || [];
          
          // Unir servicios, imágenes y categorías al proveedor
          setSupplier({
            ...result.provider,
            services: result.services || [],
            media: result.media || [],
            categories: mappedCategories
          });
          setReviews(result.reviews || []);
        } else {
          console.warn('⚠️ No se encontró el proveedor con ID:', id);
          setSupplier(null);
          setReviews([]);
        }
      } catch (error) {
        console.error('🚨 Error obteniendo detalles del proveedor:', error);
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
      '🎉 ¡Hola! Vengo desde Charlitron Eventos 360',
      '',
      `✨ Proveedor: *${supplier.name}*`,
      `📍 Ubicación: ${supplier.city || 'México'}`,
      '',
      '🛍️ *Servicios de mi interés:*',
      ...cart.map(i => `   • ${i.name} – $${i.price ? i.price.toFixed(2) : 'Consultar precio'}`),
      '',
      '💰 ────────────────────────────',
      `💵 *Total aproximado: $${totalCost.toFixed(2)} MXN*`,
      '💰 ────────────────────────────',
      '',
      '📞 Me gustaría recibir más información y cotización personalizada.',
      '⏰ ¿Cuándo podríamos platicar sobre mi evento?',
      '',
      '🙏 ¡Gracias por tu tiempo!'
    ];
    return `https://wa.me/${whatsNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const buildSimpleWALink = () => {
    if (!supplier || !supplier.whatsapp) return '#';
    const whatsNumber = supplier.whatsapp.replace(/\D/g, '');
    const lines = [
      '🎉 ¡Hola! Vengo desde Charlitron Eventos 360',
      '',
      `✨ Me interesa contactar con: *${supplier.name}*`,
      `📍 Ubicación: ${supplier.city || 'México'}`,
      '',
      '💬 Me gustaría conocer más sobre sus servicios para eventos:',
      '   • Catálogo de servicios disponibles',
      '   • Precios y paquetes',
      '   • Disponibilidad de fechas',
      '',
      '📅 Tipo de evento: [Por favor especificar]',
      '📍 Ubicación del evento: [Ciudad, estado]',
      '👥 Número aproximado de invitados: [Cantidad]',
      '',
      '📞 ¿Podrían brindarme más información?',
      '',
      '🙏 ¡Gracias por su atención!'
    ];
    return `https://wa.me/${whatsNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  // SEO dinámico para proveedores
  const seoData = useMemo(() => {
    if (!supplier) return {};

    const title = `${supplier.name} - ${supplier.description || 'Proveedor de Eventos'} | Charlitron Eventos 360`;
    const description = supplier.description || `Conoce a ${supplier.name}, proveedor especializado en eventos en México. Cotiza servicios y contacta directamente por WhatsApp.`;
    const keywords = `${supplier.name}, proveedor eventos México, ${supplier.city || 'San Luis Potosí'}, servicios eventos México, cotizar${supplier.services?.length ? ', ' + supplier.services.map(s => s.name).join(', ') : ''}`;
    
    return {
      title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      keywords,
      image: supplier.profile_image_url || supplier.cover_image || '/logo-charlitron.png',
      type: 'business.business' as const,
      providerData: {
        name: supplier.name,
        description: supplier.description || '',
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        phone: supplier.phone,
        rating: supplier.rating_average,
        reviewCount: reviews.length,
        services: supplier.services?.map(s => ({
          name: s.name,
          price: s.price || 0,
          description: s.description || ''
        })) || []
      }
    };
  }, [supplier, reviews]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  // Validación adicional para supplier null
  if (!supplier) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Proveedor no encontrado</h1>
        <p className="text-gray-600 mb-6">Lo sentimos, no pudimos encontrar la información de este proveedor.</p>
        <Link 
          to="/" 
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans bg-white">
      {/* SEO dinámico */}
      <SEOHead {...seoData} />
      
      {/* Modal de imagen grande */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="relative max-w-full max-h-full">
            <img 
              src={modalImg} 
              alt="Imagen ampliada" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
              aria-label="Cerrar imagen"
            >
              ×
            </button>
          </div>
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
          
          {/* Galería principal de imágenes */}
          <div className="mb-6">
            {supplier.media && supplier.media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {supplier.media.map((img, index) => (
                  <div 
                    key={img.id} 
                    className="aspect-square bg-white rounded-xl border-2 border-purple-200 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" 
                    onClick={() => { 
                      handleGalleryClick();
                      setModalImg(img.url); 
                      setShowModal(true); 
                    }}
                    title="Haz clic para ver en grande"
                  >
                    <img 
                      src={img.url} 
                      alt={`Imagen ${index + 1} de ${supplier.name}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-purple-700">{supplier.name}</h1>
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
              
              {/* Categorías del proveedor */}
              {supplier.categories && supplier.categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Categorías:</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories.map((category: any) => {
                      if (!category) return null;
                      
                      return (
                        <Link
                          key={category.id}
                          to={`/categoria/${category.slug}`}
                          onClick={() => handleCategoryClick(category)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 rounded-full text-sm font-medium transition-colors duration-200 border border-purple-200 hover:border-purple-300"
                        >
                          <span>🏷️</span>
                          <span>{category.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              
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
                  <a 
                    href={buildSimpleWALink()} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleWhatsAppClick}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 13.487a8.25 8.25 0 1 1-3.612-3.612m3.612 3.612c-.306-.153-.612-.306-.918-.459a2.25 2.25 0 0 0-2.835.459c-.459.459-.918.918-1.377 1.377a2.25 2.25 0 0 0 .459 2.835c.153.306.306.612.459.918" /></svg>
                    💬 WhatsApp: {supplier.whatsapp}
                  </a>
                )}
                {supplier.email && (
                  <a href={`mailto:${supplier.email}`} className="text-purple-700 underline block">Email: {supplier.email}</a>
                )}
                {supplier.phone && (
                  <button 
                    onClick={handlePhoneClick}
                    className="text-blue-700 underline block cursor-pointer bg-transparent border-none p-0 text-left"
                  >
                    Teléfono: {supplier.phone}
                  </button>
                )}
              </div>
              {/* Redes sociales: solo mostrar si existen */}
              <div className="flex flex-row gap-4 mt-4">
                {supplier.website && (
                  <a 
                    href={supplier.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleWebsiteClick}
                    className="text-blue-600 underline"
                  >
                    Sitio web
                  </a>
                )}
                {supplier.instagram_url && (
                  <a 
                    href={supplier.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleInstagramClick}
                    className="text-pink-600 underline"
                  >
                    Instagram
                  </a>
                )}
                {supplier.facebook_url && (
                  <a 
                    href={supplier.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={handleFacebookClick}
                    className="text-blue-800 underline"
                  >
                    Facebook
                  </a>
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
          {/* Imagen de portada opcional (solo si existe) */}
          {supplier.cover_image && (
            <img
              src={supplier.cover_image}
              alt="Portada"
              className="w-full h-48 object-cover rounded-lg mb-4 border-4 border-purple-200 cursor-pointer"
              onClick={() => { setModalImg(supplier.cover_image); setShowModal(true); }}
              title="Haz clic para ver en grande"
            />
          )}
        </div>
      )}

      {/* Dashboard de Métricas Públicas */}
      <div className="px-4 md:px-6">
        <ProviderDashboard 
          providerId={id} 
          providerName={supplier?.name}
        />
      </div>

      {/* Servicios del proveedor */}
      {supplier?.services && supplier.services.length > 0 && (
        <div className="mb-8 px-4 md:px-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🛍️ Servicios Disponibles
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de servicios */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.services.map(service => {
                  const isInCart = cart.some(item => item.id === service.id);
                  const priceCategory = service.price <= 1000 ? 'economico' : service.price <= 5000 ? 'medio' : 'premium';
                  const colorClasses = {
                    economico: 'from-green-400 to-green-600 border-green-200',
                    medio: 'from-yellow-400 to-orange-500 border-yellow-200', 
                    premium: 'from-purple-500 to-pink-600 border-purple-200'
                  };
                  
                  return (
                    <div 
                      key={service.id} 
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
                        ${isInCart 
                          ? `bg-gradient-to-br ${colorClasses[priceCategory]} text-white shadow-lg` 
                          : 'bg-white border-gray-200 hover:border-purple-300 shadow-md hover:shadow-lg'
                        }
                      `}
                    >
                      {/* Badge de categoría de precio */}
                      <div className={`
                        absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold
                        ${priceCategory === 'economico' ? 'bg-green-500 text-white' : 
                          priceCategory === 'medio' ? 'bg-yellow-500 text-white' : 
                          'bg-purple-500 text-white'}
                      `}>
                        {priceCategory === 'economico' ? '💚 Económico' : 
                         priceCategory === 'medio' ? '🧡 Medio' : 
                         '💜 Premium'}
                      </div>
                      
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={`font-bold text-lg ${isInCart ? 'text-white' : 'text-purple-700'}`}>
                          {service.name}
                        </h3>
                        {isInCart && (
                          <span className="text-white text-2xl animate-pulse">✓</span>
                        )}
                      </div>
                      
                      <p className={`mb-3 text-sm ${isInCart ? 'text-white/90' : 'text-gray-600'}`}>
                        {service.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xl font-bold ${isInCart ? 'text-white' : 'text-gray-800'}`}>
                          ${service.price?.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => handleServiceClick(service)} 
                          className={`
                            px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105
                            ${isInCart 
                              ? 'bg-white/20 text-white border-2 border-white/50 hover:bg-white/30' 
                              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                            }
                          `}
                        >
                          {isInCart ? '🗑️ Quitar' : '➕ Agregar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel de cotización visual */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
                  <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                    🧮 Tu Cotización
                  </h3>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🛒</div>
                      <p className="text-gray-500 font-medium">
                        Selecciona servicios para cotizar
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Lista de servicios seleccionados */}
                      <div className="space-y-3 mb-6">
                        {cart.map((item, index) => {
                          const percentage = ((item.price / totalCost) * 100).toFixed(1);
                          const priceCategory = item.price <= 1000 ? 'economico' : item.price <= 5000 ? 'medio' : 'premium';
                          const barColor = {
                            economico: 'bg-green-500',
                            medio: 'bg-yellow-500', 
                            premium: 'bg-purple-500'
                          };
                          
                          return (
                            <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-800 text-sm">
                                  {item.name}
                                </span>
                                <span className="font-bold text-purple-600">
                                  ${item.price?.toLocaleString()}
                                </span>
                              </div>
                              
                              {/* Barra de progreso */}
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                <div 
                                  className={`h-2.5 rounded-full transition-all duration-500 ${barColor[priceCategory]}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              
                              <div className="text-xs text-gray-500 flex justify-between">
                                <span>{percentage}% del total</span>
                                <button 
                                  onClick={() => toggleCartItem(item)}
                                  className="text-red-500 hover:text-red-700 font-medium"
                                >
                                  ✕ Quitar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total destacado */}
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold">
                            ${totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {cart.length} servicio{cart.length !== 1 ? 's' : ''} seleccionado{cart.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Botón de WhatsApp mejorado */}
                      {supplier.whatsapp ? (
                        <a
                          href={buildWALink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleWhatsAppClick}
                          className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">📱</span>
                            <div>
                              <div className="text-lg">Cotizar por WhatsApp</div>
                              <div className="text-sm opacity-90">Respuesta inmediata</div>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <button 
                          disabled 
                          className="w-full bg-gray-400 text-white font-bold py-4 px-6 rounded-xl cursor-not-allowed"
                        >
                          WhatsApp no disponible
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Reseñas Autenticadas */}
      <div className="mt-10 px-4 md:px-6">
        <h2 className="text-xl font-semibold text-purple-700 mb-6">Reseñas y Opiniones</h2>
        
        {/* Formulario de reseña autenticado */}
        <AuthenticatedReviewForm
          providerId={supplier.id}
          providerName={supplier.name}
          onNewReview={(review) => setReviews([review, ...reviews])}
          existingReviews={reviews}
        />
        
        {/* Mostrar reseñas con sistema avanzado */}
        <ReviewsDisplay
          reviews={reviews}
          onHelpfulVote={async (reviewId) => {
            try {
              // Obtener el valor actual
              const { data: currentReview } = await supabase
                .from('provider_reviews')
                .select('helpful_votes')
                .eq('id', reviewId)
                .single();
              
              if (currentReview) {
                const { error } = await supabase
                  .from('provider_reviews')
                  .update({ helpful_votes: currentReview.helpful_votes + 1 })
                  .eq('id', reviewId);
                
                if (!error) {
                  // Actualizar estado local
                  setReviews(prev => prev.map(review => 
                    review.id === reviewId 
                      ? { ...review, helpful_votes: review.helpful_votes + 1 }
                      : review
                  ));
                }
              }
            } catch (error) {
              console.error('Error al votar como útil:', error);
            }
          }}
        />
      </div>
    </div>
  );
}