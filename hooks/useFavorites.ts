import { useState, useEffect } from 'react';

// Interfaz para los datos mínimos de un proveedor favorito
interface FavoriteProvider {
  id: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  whatsapp?: string;
}

// Custom hook para manejar favoritos en localStorage
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);

  // Cargar favoritos del localStorage al inicializar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('charlitron-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error parsing favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Guardar favoritos en localStorage cada vez que cambien
  const saveFavorites = (newFavorites: FavoriteProvider[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('charlitron-favorites', JSON.stringify(newFavorites));
  };

  // Verificar si un proveedor está en favoritos
  const isFavorite = (providerId: string): boolean => {
    return favorites.some(fav => fav.id === providerId);
  };

  // Agregar proveedor a favoritos
  const addFavorite = (provider: FavoriteProvider) => {
    if (!isFavorite(provider.id)) {
      const newFavorites = [...favorites, provider];
      saveFavorites(newFavorites);
    }
  };

  // Quitar proveedor de favoritos
  const removeFavorite = (providerId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== providerId);
    saveFavorites(newFavorites);
  };

  // Toggle favorito (agregar si no está, quitar si está)
  const toggleFavorite = (provider: FavoriteProvider) => {
    if (isFavorite(provider.id)) {
      removeFavorite(provider.id);
    } else {
      addFavorite(provider);
    }
  };

  // Limpiar todos los favoritos
  const clearFavorites = () => {
    saveFavorites([]);
  };

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    favoritesCount: favorites.length
  };
};