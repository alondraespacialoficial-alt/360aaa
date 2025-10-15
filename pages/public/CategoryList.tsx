
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Supplier, Category } from '../../types';
import { ChevronLeftIcon } from '../../components/icons';
import FavoriteButton from '../../components/FavoriteButton';
import FilterPanel from '../../components/FilterPanel';
import { useFilters } from '../../hooks/useFilters';
import SEOHead from '../../components/SEOHead';

const CategoryList: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook de filtros
  const {
    filters,
    filteredProviders,
    availableCities,
    filterStats,
    handleFilterChange,
    clearFilters
  } = useFilters(suppliers);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!slug) return;
      setLoading(true);

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (catError || !catData) {
        setError('Categoría no encontrada.');
        setLoading(false);
        return;
      }

      setCategory(catData);

      // Consulta proveedores por join nativo
      const { data: provs, error: provErr } = await supabase
        .from('providers')
        .select(`
          id, name, description, website, instagram, facebook, whatsapp,
          city, is_premium, featured, profile_image_url,
          provider_categories!inner(category_id),
          provider_services(id, name, description, price)
        `)
        .eq('provider_categories.category_id', catData.id)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });

      if (provErr) {
        setError('Error al cargar proveedores.');
        console.error(provErr);
      } else {
        // Mapear proveedores con servicios para los filtros
        const providersWithServices = provs?.map(provider => ({
          ...provider,
          services: provider.provider_services || []
        })) || [];
        
        setSuppliers(providersWithServices);
      }
      setLoading(false);
    };

    fetchSuppliers();
  }, [slug]);

  // SEO dinámico para categorías
  const seoData = useMemo(() => {
    if (!category) return {};

    const title = `${category.name} - Proveedores para Eventos en México | Charlitron Eventos 360`;
    const description = category.description || `Encuentra los mejores proveedores de ${category.name.toLowerCase()} para tu evento en México. Especialistas en San Luis Potosí y toda la República Mexicana. Compara precios y contacta por WhatsApp.`;
    const keywords = `${category.name} México, proveedores eventos México, servicios ${category.name.toLowerCase()}, cotizar, San Luis Potosí, República Mexicana`;
    
    return {
      title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      keywords,
      image: '/logo-charlitron.png',
      type: 'website' as const,
      categoryData: {
        name: category.name,
        description: category.description || `Servicios de ${category.name}`,
        providerCount: filteredProviders.length
      }
    };
  }, [category, filteredProviders]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* SEO dinámico */}
      <SEOHead {...seoData} />
      
      <header className="mb-8 flex items-center">
        <button onClick={() => navigate('/')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{category?.name || 'Proveedores'}</h1>
          <p className="text-gray-500">Explora las opciones disponibles</p>
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
          {/* Panel de filtros */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            availableCities={availableCities}
            resultsCount={filteredProviders.length}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(sup => (
            <div key={sup.id} className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
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
                {/* Botón de favorito en la esquina superior izquierda */}
                <div className="absolute top-2 left-2">
                  <FavoriteButton 
                    provider={{
                      id: sup.id,
                      name: sup.name,
                      description: sup.description,
                      profile_image_url: sup.profile_image_url,
                      whatsapp: sup.whatsapp
                    }}
                    size="md"
                  />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                  {sup.featured && <span className="text-yellow-500 mr-1">★</span>}
                  {sup.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{sup.description}</p>
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/proveedor/${sup.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow transition flex items-center gap-2 w-full justify-center"
                  >
                    Ver detalles
                  </Link>
                  {sup.whatsapp ? (
                    <a
                      href={`https://wa.me/${sup.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow transition w-full justify-center"
                    >
                      Cotizar por WhatsApp
                    </a>
                  ) : (
                    <span className="bg-gray-400 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow w-full justify-center cursor-not-allowed">
                      WhatsApp no disponible
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryList;
