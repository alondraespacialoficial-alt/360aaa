
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Category } from '../../types';
import { SearchIcon } from '../../components/icons';

const HomePanel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
        .select('id, name, description, profile_image_url, featured, is_active')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      if (provError) {
        setError('Error al cargar proveedores.');
        console.error(provError);
      } else {
        setSuppliers(provData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Directorio de Proveedores</h1>
        <p className="text-gray-600 mt-2">Encuentra los mejores servicios para tu evento.</p>
        <div className="mt-4">
          <a href="/admin/panel" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Acceso Admin</a>
        </div>
      </header>
      
      <div className="mb-8 relative">
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor por nombre..."
          className="w-full p-4 pl-12 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
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
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2 text-gray-700">Explora por categoría</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {categories.filter(c => !!c.slug).map(cat => (
                <Link 
                  to={`/categoria/${cat.slug}`}
                  key={cat.id}
                  className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  {cat.icon_url ? (
                    <img 
                      src={`${cat.icon_url}?w=100&h=100&fit=crop&auto=format`} 
                      alt={cat.name} 
                      className="h-12 w-12 rounded-full object-cover mb-3"
                      onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentNode.appendChild(document.createElement('span')).innerText = cat.emoji || (() => {
                        const name = cat.name.toLowerCase();
                        if (name.includes('comida') || name.includes('catering')) return '🍽️';
                        if (name.includes('música') || name.includes('dj')) return '🎧';
                        if (name.includes('pastel') || name.includes('postre')) return '🎂';
                        if (name.includes('decoración') || name.includes('flores')) return '🎈';
                        if (name.includes('foto')) return '📸';
                        if (name.includes('video')) return '🎥';
                        if (name.includes('transporte') || name.includes('auto')) return '🚌';
                        if (name.includes('hotel') || name.includes('hospedaje')) return '🏨';
                        if (name.includes('animación') || name.includes('show')) return '🎤';
                        if (name.includes('bebida') || name.includes('bar')) return '🍹';
                        if (name.includes('invitación')) return '✉️';
                        if (name.includes('regalo')) return '🎁';
                        return '🎉';
                      })(); }}
                    />
                  ) : (
                    <span className="text-5xl mb-3">{cat.emoji || (() => {
                      const name = cat.name.toLowerCase();
                      if (name.includes('comida') || name.includes('catering')) return '🍽️';
                      if (name.includes('música') || name.includes('dj')) return '🎧';
                      if (name.includes('pastel') || name.includes('postre')) return '🎂';
                      if (name.includes('decoración') || name.includes('flores')) return '🎈';
                      if (name.includes('foto')) return '📸';
                      if (name.includes('video')) return '🎥';
                      if (name.includes('transporte') || name.includes('auto')) return '🚌';
                      if (name.includes('hotel') || name.includes('hospedaje')) return '🏨';
                      if (name.includes('animación') || name.includes('show')) return '🎤';
                      if (name.includes('bebida') || name.includes('bar')) return '🍹';
                      if (name.includes('invitación')) return '✉️';
                      if (name.includes('regalo')) return '🎁';
                      return '🎉';
                    })()}</span>
                  )}
                  <span className="text-center font-semibold text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
          {/* Proveedores filtrados */}
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-700">Proveedores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {suppliers
                .filter(sup => {
                  const term = search.toLowerCase();
                  return (
                    sup.name.toLowerCase().includes(term) ||
                    (sup.description && sup.description.toLowerCase().includes(term))
                  );
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
    </div>
  );
};

export default HomePanel;
