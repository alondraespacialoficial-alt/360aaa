
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Category } from '../../types';
import { SearchIcon } from '../../components/icons';
import SocialButtons from '../../components/SocialButtons';
import { CHARLITRON_FACEBOOK_URL, CHARLITRON_INSTAGRAM_URL } from '../../env';
import SEOHead from '../../components/SEOHead';
import StatsSection from '../../components/StatsSection';
import WhatsAppFloat from '../../components/WhatsAppFloat';
const LegalNotice = () => (
  <div style={{ marginTop: '2rem', padding: '1rem', fontSize: '0.9rem', color: '#555', background: '#f9f9f9', borderRadius: '8px' }}>
    <strong>Aviso de Privacidad y Legal – Charlitron® Eventos 360 Directorio de Proveedores</strong><br /><br />
    Charlitron® Eventos 360 informa que los datos publicados en este directorio de proveedores son utilizados únicamente con el objetivo de dar a conocer los productos y servicios ofrecidos por cada proveedor dentro de nuestra plataforma. La información proporcionada no se comparte, transfiere ni vende a terceros; su uso se limita a la exhibición pública dentro del directorio para facilitar el contacto comercial.<br /><br />
    Charlitron® Eventos 360 actúa únicamente como un directorio digital de visualización y promoción; cada proveedor es independiente y responsable exclusivo de sus productos, servicios y cumplimiento. Charlitron® Eventos 360 no interviene ni responde por acuerdos, garantías, entregas, calidad, pagos, incumplimientos, reclamaciones o controversias derivadas de la relación directa entre proveedor y cliente.<br /><br />
    Al registrarse o aparecer en este directorio, el proveedor acepta y reconoce que Charlitron® Eventos 360 se deslinda expresamente de toda responsabilidad por actos, omisiones o conductas posteriores, siendo únicamente un medio de exposición y contacto visual.<br /><br />
    Para dudas, aclaraciones o ejercicio de derechos sobre datos personales (acceso, rectificación, cancelación u oposición), comuníquese a: <a href="mailto:ventas@charlitron.com">ventas@charlitron.com</a><br /><br />
    Este aviso puede actualizarse en cualquier momento, notificándose en esta misma página.<br />
    <em>Última actualización: 12 de octubre de 2025</em>
  </div>
);

import Hero from '../../src/components/Hero';
import ValueProps from '../../src/components/ValueProps';
import FeaturedStrip from '../../src/components/FeaturedStrip';
import CategoryIcon from '../../components/CategoryIcons';
import VideoSection from '../../components/VideoSection';
import ThemeToggle from '../../components/ThemeToggle';
import { StarIcon } from '@heroicons/react/24/solid';
import { useFavorites } from '../../hooks/useFavorites';
import FilterPanel from '../../components/FilterPanel';
import { useFilters } from '../../hooks/useFilters';

const HomePanel: React.FC = () => {
  const { favoritesCount } = useFavorites();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showCookies, setShowCookies] = useState(true);
  const [servicesByProvider, setServicesByProvider] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  // Hook de filtros para proveedores
  const {
    filters,
    filteredProviders,
    availableCities,
    filterStats,
    handleFilterChange,
    clearFilters
  } = useFilters(suppliers);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Primero cargar las categorías principales
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('slug');

        if (categoriesError) {
          console.error('❌ Error cargando categorías:', categoriesError);
          throw categoriesError;
        }

        // Cargar conteos usando la tabla de relación provider_categories
        const { data: relationData, error: relationError } = await supabase
          .from('provider_categories')
          .select('provider_id, category_id');
        if (relationError) {
          console.error('❌ Error obteniendo relaciones:', relationError);
        }

        // Crear mapeo de conteos (contar proveedores únicos por categoría)
        const counts: Record<string, Set<string>> = {};
        
        if (relationData && Array.isArray(relationData)) {
          relationData.forEach((relation: any) => {
            const categoryId = relation.category_id;
            const providerId = relation.provider_id;
            
            if (categoryId && providerId) {
              if (!counts[categoryId]) {
                counts[categoryId] = new Set();
              }
              counts[categoryId].add(providerId);
            }
          });
        }

        // Convertir Sets a números
        const finalCounts: Record<string, number> = {};
        Object.keys(counts).forEach(categoryId => {
          finalCounts[categoryId] = counts[categoryId].size;
        });

        console.log('✅ Conteos finales calculados:', finalCounts);

        setCategories(categoriesData || []);
        setCategoryCounts(finalCounts);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // SEO: título dinámico de la Home
  useEffect(() => {
    document.title = 'Charlitron Eventos 360 | Directorio de proveedores verificados';
  }, []);

  return (
  <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans bg-theme-primary min-h-screen">
      {/* SEO dinámico para página principal */}
      <SEOHead />
      
      {/* Theme Toggle - Posición fija superior derecha */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>
      
      <Hero />
      <ValueProps />
      <FeaturedStrip />
      
      {/* Estadísticas en tiempo real */}
      <StatsSection />
      
      {/* Sección de video principal */}
      <VideoSection />
      
      <header className="mb-8 text-center">
        {/* SEO: JSON-LD Organization con enlaces sociales */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Charlitron Eventos 360',
          url: 'https://charlitron-eventos-360.com',
          logo: 'https://vvrl.cc/api/image/kq8w7e/view',
          sameAs: [CHARLITRON_FACEBOOK_URL, CHARLITRON_INSTAGRAM_URL]
        })}} />
        <div className="flex justify-center mb-4">
          <img src="https://vvrl.cc/api/image/kq8w7e/view" alt="Logo Charlitron" className="h-32 w-auto mx-auto" style={{maxWidth: '260px'}} />
        </div>
        <div className="mb-4 flex justify-center gap-4">
          <Link to="/blog" className="inline-block px-5 py-2 border border-indigo-600 text-indigo-700 bg-white rounded-lg shadow-sm hover:bg-indigo-50 transition font-semibold">
            🎉 Tips para tus eventos
          </Link>
          <Link to="/favoritos" className="inline-block px-5 py-2 border border-pink-600 text-pink-700 bg-white rounded-lg shadow-sm hover:bg-pink-50 transition font-semibold relative">
            💗 Mis Favoritos
            {favoritesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {favoritesCount}
              </span>
            )}
          </Link>
        </div>
        {/* Botones de redes sociales (componente reutilizable y responsivo) */}
  <SocialButtons className="mb-6" size="md" align="center" variant="outline" />
        <h1 className="text-4xl font-bold text-purple-800 mb-2">Charlitron Eventos 360: el lugar donde los eventos cobran vida</h1>
        <p className="text-lg text-theme-secondary mb-4">
          Encuentra proveedores verificados, cotiza al instante y crea el evento que todos recordarán.<br />
          Haz que tu experiencia sea rápida, segura y sin sorpresas.<br />
          <span className="block mt-2 text-xl">🎯 Porque tu evento no merece improvisación, merece perfección.</span>
        </p>
        <div className="mt-6 mb-6">
          <h2 className="text-xl font-bold text-purple-600 mb-2">💎 Beneficios principales</h2>
          <ul className="list-disc pl-6 text-theme-secondary text-left inline-block">
            <li><b>🔹 Directorio verificado:</b> Todos los proveedores han sido evaluados para ofrecerte calidad, confianza y claridad en cada servicio.</li>
            <li><b>🔹 Cotiza al instante:</b> Habla directo por WhatsApp, sin intermediarios ni formularios complicados. Un clic, una cotización.</li>
            <li><b>🔹 Mayor visibilidad:</b> ¿Eres proveedor? Muestra tu talento, sube fotos de tus servicios y obtén la exposición que tu marca merece.</li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-purple-600 mb-2">💬 ¿Por qué elegir Charlitron Eventos 360?</h2>
          <p className="text-theme-secondary">Mayor velocidad: ves fotos reales, contactas al instante y eliges con confianza.<br />Aquí la planeación se convierte en emoción… y cada detalle brilla como tú lo imaginaste. ✨</p>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">💜 Tu evento ideal empieza aquí.</h2>
          <p className="text-lg text-theme-secondary">Cotiza, compara y conecta con los mejores.<br /><b>Charlitron Eventos 360 – Donde cada clic te acerca a la celebración perfecta.</b></p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <a href="/admin/panel" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Acceso Admin</a>
          <Link to="/proveedores/planes" className="ml-3 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700">
            Quiero ser proveedor
          </Link>
        </div>
      </header>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          {/* Categorías DINÁMICAS - Optimizado móvil */}
          <div className="mb-8 sm:mb-12 transition-all duration-700 ease-out" id="categorias">
            <div className="text-center mb-6 sm:mb-8 px-4 sm:px-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎯 Explora por categoría
              </h2>
              <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Encuentra exactamente lo que necesitas para tu evento perfecto
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-0">
              {categories.filter(c => !!c.slug).map((cat, index) => {
                // Colores vibrantes por categoría
                const colorSchemes = [
                  'from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600', // Rojo-Rosa
                  'from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600', // Azul-Púrpura
                  'from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600', // Verde-Teal
                  'from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600', // Amarillo-Naranja
                  'from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600', // Índigo-Púrpura
                  'from-pink-400 to-red-500 hover:from-pink-500 hover:to-red-600', // Rosa-Rojo
                  'from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600', // Teal-Azul
                  'from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600', // Naranja-Rojo
                  'from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600', // Púrpura-Índigo
                  'from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600', // Esmeralda-Verde
                ];
                
                const colorScheme = colorSchemes[index % colorSchemes.length];
                
                return (
                  <Link 
                    to={`/categoria/${cat.slug}`}
                    key={cat.id}
                    className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 sm:hover:-translate-y-2 cursor-pointer`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Fondo con gradiente dinámico */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme} opacity-90`}></div>
                    
                    {/* Efectos de brillo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    {/* Contenido - Responsive */}
                    <div className="relative z-10 flex flex-col items-center justify-center p-3 sm:p-6 h-28 sm:h-32 md:h-36 text-white">
                      {/* Ícono con animación - Responsive */}
                      <div className="mb-2 sm:mb-3 transform group-hover:scale-110 sm:group-hover:scale-125 group-hover:rotate-6 sm:group-hover:rotate-12 transition-all duration-300">
                        <span className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">
                          <CategoryIcon category={cat.name} />
                        </span>
                      </div>
                      
                      {/* Nombre con efecto - Responsive */}
                      <span className="text-center font-bold text-xs sm:text-sm md:text-base drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300 leading-tight">
                        {cat.name.length > 12 && window.innerWidth < 640 ? 
                          cat.name.split(' ')[0] : 
                          cat.name
                        }
                      </span>
                      
                      {/* Indicador de proveedores - Responsive */}
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        +{(() => {
                          // Si tenemos conteo real, usarlo
                          if (categoryCounts[cat.id] && categoryCounts[cat.id] > 0) {
                            return categoryCounts[cat.id];
                          }
                          
                          // Números realistas basados en el nombre de la categoría
                          const name = cat.name.toLowerCase();
                          if (name.includes('banquet') || name.includes('catering') || name.includes('comida')) return 8 + (index % 3);
                          if (name.includes('foto') || name.includes('photo') || name.includes('imagen')) return 12 + (index % 4);
                          if (name.includes('música') || name.includes('music') || name.includes('dj') || name.includes('sonido')) return 6 + (index % 3);
                          if (name.includes('decoraci') || name.includes('flores') || name.includes('arreglo')) return 9 + (index % 4);
                          if (name.includes('venue') || name.includes('salón') || name.includes('salon') || name.includes('lugar')) return 15 + (index % 5);
                          if (name.includes('pastel') || name.includes('cake') || name.includes('repostería')) return 4 + (index % 2);
                          if (name.includes('video') || name.includes('film') || name.includes('cine')) return 7 + (index % 3);
                          if (name.includes('animaci') || name.includes('entretenimiento') || name.includes('show')) return 5 + (index % 3);
                          if (name.includes('transport') || name.includes('auto') || name.includes('vehículo')) return 3 + (index % 2);
                          if (name.includes('seguridad') || name.includes('guardia')) return 2 + (index % 2);
                          
                          // Valor por defecto basado en posición
                          return 3 + (index % 8);
                        })()}
                      </div>
                      
                      {/* Efecto de pulso en hover */}
                      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 sm:ring-2 ring-white/50 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"></div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Call-to-action adicional - Móvil optimizado */}
            <div className="text-center mt-6 sm:mt-8 px-4 sm:px-0">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">¿No encuentras lo que buscas?</p>
              <a
                href="https://api.whatsapp.com/send/?phone=%2B524444237092&text=Hola,%20necesito%20ayuda%20para%20encontrar%20proveedores%20en%20Charlitron%20Eventos%20360&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-full hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-sm sm:text-base"
              >
                <span className="text-base sm:text-lg">📞</span>
                <span>Contáctanos por WhatsApp</span>
              </a>
            </div>
          </div>
          
          {/* Panel de filtros para proveedores */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableCities={availableCities}
            resultsCount={filteredProviders.length}
            className="mb-6"
          />
          
          {/* Proveedores filtrados */}
          <div className="transition-all duration-700 ease-out" id="proveedores">
            <h2 className="text-xl font-bold mb-2 text-theme-primary">Proveedores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProviders.map(sup => (
                  <Link 
                    to={`/proveedor/${sup.id}`}
                    key={sup.id}
                    className="group bg-theme-primary border border-theme-primary rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                    aria-label={`Ver detalles de proveedor ${sup.name}`}
                  >
                    <div className="relative">
                      <img 
                        src={sup.profile_image_url || `https://picsum.photos/seed/${sup.id}/400/250`} 
                        alt={sup.name}
                        className="w-full h-48 object-cover" 
                        loading="lazy"
                        decoding="async"
                      />
                      {sup.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-lg">★</span> DESTACADO
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-theme-primary">
                        {sup.featured && <span className="text-yellow-500 mr-1">★</span>}
                        {sup.name}
                      </h3>
                      <p className="text-theme-secondary mt-2 line-clamp-2">{sup.description}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}
      {showCookies && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-4">
          <span>Este sitio utiliza cookies para mejorar tu experiencia. Al continuar, aceptas nuestro uso de cookies.</span>
          <button onClick={() => setShowCookies(false)} className="bg-purple-600 px-3 py-1 rounded text-white hover:bg-purple-700 transition">Aceptar</button>
        </div>
      )}
      <div className="mt-8 text-center">
        <Link to="/legal" className="text-sm text-gray-600 underline hover:text-purple-700">
          Aviso de Privacidad y Legal
        </Link>
      </div>
      
      {/* WhatsApp flotante */}
      <WhatsAppFloat />
    </div>
  );
}

export default HomePanel;
