
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Category } from '../../types';
import { SearchIcon } from '../../components/icons';

const HomePanel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        setError('Error al cargar categorías.');
        console.error(error);
      } else {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800">Directorio de Proveedores</h1>
        <p className="text-gray-600 mt-2">Encuentra los mejores servicios para tu evento.</p>
      </header>
      
      <div className="mb-8 relative">
        <input 
          type="text"
          placeholder="Buscar un proveedor o servicio..."
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map(cat => (
            <Link 
              to={`/categoria/${cat.slug}`} 
              key={cat.id}
              className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-5xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {cat.icon || '🎉'}
              </div>
              <span className="text-center font-semibold text-gray-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePanel;
