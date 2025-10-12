
import React, { useState, useEffect } from 'react';
// Aviso legal básico al pie de la página
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
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Category } from '../../types';
import { SearchIcon } from '../../components/icons';
import Hero from '../../src/components/Hero';
import ValueProps from '../../src/components/ValueProps';
import FeaturedStrip from '../../src/components/FeaturedStrip';
import categoryIcons from '../../components/CategoryIcons';
import { StarIcon } from '@heroicons/react/24/solid';

const HomePanel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showCookies, setShowCookies] = useState(true);
  const [servicesByProvider, setServicesByProvider] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Categorías
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name, description, icon_url, color_scheme, slug, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (catError) {
        setError('Error al cargar categorías.');
        console.error(catError);
      } else {
        setCategories(catData || []);
      }
      // Proveedores
      const { data: provData, error: provError } = await supabase
  .from('providers')
  .select('id, name, description, profile_image_url, featured, is_active, city, state')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      if (provError) {
        setError('Error al cargar proveedores.');
        console.error(provError);
      } else {
        setSuppliers(provData || []);
        // Obtener servicios de todos los proveedores
        if (provData && provData.length > 0) {
          const providerIds = provData.map((p: any) => p.id);
          const { data: servData, error: servError } = await supabase
            .from('provider_services')
            .select('id, provider_id, name, description')
            .in('provider_id', providerIds);
          if (!servError && servData) {
            const map: Record<string, any[]> = {};
            servData.forEach(s => {
              if (!map[s.provider_id]) map[s.provider_id] = [];
              map[s.provider_id].push(s);
            });
            setServicesByProvider(map);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <Hero />
      <ValueProps />
      <FeaturedStrip />
      <header className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Link to="/blog" className="inline-block px-5 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition font-semibold">
            🎉 Tips para tus eventos
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-purple-800 mb-2">Charlitron Eventos 360: el lugar donde los eventos cobran vida</h1>
        <p className="text-lg text-gray-700 mb-4">
          Encuentra proveedores verificados, cotiza al instante y crea el evento que todos recordarán.<br />
          Haz que tu experiencia sea rápida, segura y sin sorpresas.<br />
          <span className="block mt-2 text-xl">🎯 Porque tu evento no merece improvisación, merece perfección.</span>
        </p>
        <div className="mt-6 mb-6">
          <h2 className="text-xl font-bold text-purple-600 mb-2">💎 Beneficios principales</h2>
          <ul className="list-disc pl-6 text-gray-700 text-left inline-block">
            <li><b>🔹 Directorio verificado:</b> Todos los proveedores han sido evaluados para ofrecerte calidad, confianza y claridad en cada servicio.</li>
            <li><b>🔹 Cotiza al instante:</b> Habla directo por WhatsApp, sin intermediarios ni formularios complicados. Un clic, una cotización.</li>
            <li><b>🔹 Mayor visibilidad:</b> ¿Eres proveedor? Muestra tu talento, sube fotos de tus servicios y obtén la exposición que tu marca merece.</li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-purple-600 mb-2">💬 ¿Por qué elegir Charlitron Eventos 360?</h2>
          <p className="text-gray-700">Mayor velocidad: ves fotos reales, contactas al instante y eliges con confianza.<br />Aquí la planeación se convierte en emoción… y cada detalle brilla como tú lo imaginaste. ✨</p>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-2">💜 Tu evento ideal empieza aquí.</h2>
          <p className="text-lg text-gray-700">Cotiza, compara y conecta con los mejores.<br /><b>Charlitron Eventos 360 – Donde cada clic te acerca a la celebración perfecta.</b></p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <a href="/admin/panel" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Acceso Admin</a>
          <Link to="/proveedores/planes" className="ml-3 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700">
            Quiero ser proveedor
          </Link>
        </div>
      </header>
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center relative">
        <div className="relative w-full md:w-2/3">
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor por nombre o servicio..."
            className="w-full p-4 pl-12 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
        </div>
        <div className="w-full md:w-1/3">
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Filtrar por ciudad..."
            className="w-full p-4 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          {/* Categorías */}
          <div className="mb-8" id="categorias">
            <h2 className="text-xl font-bold mb-2 text-gray-700">Explora por categoría</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {categories.filter(c => !!c.slug).map(cat => (
                <Link 
                  to={`/categoria/${cat.slug}`}
                  key={cat.id}
                  className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Ícono profesional para la categoría */}
                  <span className="mb-3 flex items-center justify-center">
                    {categoryIcons[cat.name.toLowerCase()] || <StarIcon className="h-10 w-10 text-gray-400" />}
                  </span>
                  <span className="text-center font-semibold text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
          {/* Proveedores filtrados */}
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-700">Proveedores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...suppliers.filter(s => s.featured), ...suppliers.filter(s => !s.featured)]
                .filter(sup => {
                  const term = search.toLowerCase();
                  const cityTerm = city.toLowerCase();
                  // Buscar en nombre, descripción, servicios, ciudad y estado
                  const matchName = sup.name.toLowerCase().includes(term);
                  const matchDesc = sup.description && sup.description.toLowerCase().includes(term);
                  const matchService = servicesByProvider[sup.id]?.some(serv =>
                    serv.name.toLowerCase().includes(term) ||
                    (serv.description && serv.description.toLowerCase().includes(term))
                  );
                  const matchCity = sup.city && sup.city.toLowerCase().includes(cityTerm);
                  const matchState = sup.state && sup.state.toLowerCase().includes(cityTerm);
                  // Si no hay filtro de ciudad/estado, ignora
                  const cityFilter = cityTerm === '' || matchCity || matchState;
                  return (term === '' || matchName || matchDesc || matchService) && cityFilter;
                })
                .map(sup => (
                  <Link 
                    to={`/proveedor/${sup.id}`}
                    key={sup.id}
                    className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative">
                      <img 
                        src={sup.profile_image_url || `https://picsum.photos/seed/${sup.id}/400/250`} 
                        alt={sup.name}
                        className="w-full h-48 object-cover" 
                      />
                      {sup.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-lg">★</span> DESTACADO
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {sup.featured && <span className="text-yellow-500 mr-1">★</span>}
                        {sup.name}
                      </h3>
                      <p className="text-gray-600 mt-2 line-clamp-2">{sup.description}</p>
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
    </div>
  );
}

export default HomePanel;
