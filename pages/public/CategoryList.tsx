
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Supplier, Category } from '../../types';
import { ChevronLeftIcon } from '../../components/icons';

const CategoryList: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!slug) return;
      setLoading(true);

      const { data: catData, error: catError } = await supabase
        .from('categories')
        // FIX: Changed select to fetch all fields to match the 'Category' type.
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (catError || !catData) {
        setError('Categoría no encontrada.');
        setLoading(false);
        return;
      }
      
      setCategory(catData);

      const { data, error } = await supabase
        .from('suppliers')
        // FIX: Changed select to fetch all fields to match the 'Supplier' type.
        .select('*')
        .eq('category_id', catData.id)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        setError('Error al cargar proveedores.');
        console.error(error);
      } else {
        setSuppliers(data);
      }
      setLoading(false);
    };

    fetchSuppliers();
  }, [slug]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-8 flex items-center">
        <button onClick={() => navigate('/embed')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(sup => (
            <Link 
              to={`/proveedor/${sup.id}`} 
              key={sup.id} 
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative">
                <img 
                  src={sup.logo_url || `https://picsum.photos/seed/${sup.id}/400/250`} 
                  alt={sup.name}
                  className="w-full h-48 object-cover" 
                />
                {sup.is_featured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                    DESTACADO
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">{sup.name}</h3>
                <p className="text-gray-600 mt-2 line-clamp-2">{sup.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryList;
