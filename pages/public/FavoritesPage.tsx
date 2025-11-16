import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteButton from '../../components/FavoriteButton';
import { ChevronLeftIcon } from '../../components/icons';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, clearFavorites } = useFavorites();

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres quitar todos los favoritos?')) {
      clearFavorites();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              💗 Mis Favoritos
            </h1>
            <p className="text-gray-500">
              {favorites.length === 0 
                ? 'No tienes proveedores favoritos aún' 
                : `${favorites.length} proveedor${favorites.length === 1 ? '' : 'es'} favorito${favorites.length === 1 ? '' : 's'}`
              }
            </p>
          </div>
        </div>
        
        {/* Botón limpiar todos */}
        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
          >
            Limpiar todos
          </button>
        )}
      </header>

      {/* Contenido */}
      {favorites.length === 0 ? (
        /* Estado vacío */
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes favoritos aún
          </h2>
          <p className="text-gray-500 mb-6">
            Explora proveedores y agrégalos a favoritos haciendo clic en el corazón
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Explorar Proveedores
          </Link>
        </div>
      ) : (
        /* Lista de favoritos */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(provider => (
            <div 
              key={provider.id} 
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <div className="relative">
                <img 
                  src={provider.profile_image_url || `https://picsum.photos/seed/${provider.id}/400/250`} 
                  alt={provider.name}
                  className="w-full h-48 object-cover" 
                />
                {/* Botón de favorito */}
                <div className="absolute top-2 left-2">
                  <FavoriteButton 
                    provider={provider}
                    size="md"
                  />
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {provider.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {provider.description || 'Sin descripción disponible'}
                  </p>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/proveedor/${provider.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow transition flex items-center gap-2 w-full justify-center"
                  >
                    Ver detalles
                  </Link>
                  {provider.whatsapp && (
                    <a
                      href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow transition w-full justify-center"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;