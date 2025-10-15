import { useState, useMemo } from 'react';

// Interfaz para los filtros
interface Filters {
  priceRange: string;
  city: string;
  isPremium: boolean | null;
  isFeatured: boolean | null;
  search: string;
}

// Interfaz para proveedor con servicios
interface ProviderWithServices {
  id: string;
  name: string;
  description?: string;
  city?: string;
  is_premium?: boolean;
  featured?: boolean;
  services?: Array<{ price: number }>;
  [key: string]: any;
}

// Hook personalizado para manejar filtros
export const useFilters = (providers: ProviderWithServices[]) => {
  const [filters, setFilters] = useState<Filters>({
    priceRange: '',
    city: '',
    isPremium: null,
    isFeatured: null,
    search: ''
  });

  // Función para cambiar un filtro específico
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({
      priceRange: '',
      city: '',
      isPremium: null,
      isFeatured: null,
      search: ''
    });
  };

  // Obtener ciudades únicas de los proveedores
  const availableCities = useMemo(() => {
    const cities = providers
      .map(p => p.city)
      .filter(Boolean) // Eliminar valores null/undefined
      .filter((city, index, array) => array.indexOf(city) === index) // Únicos
      .sort();
    return cities;
  }, [providers]);

  // Función para obtener precio mínimo de los servicios de un proveedor
  const getProviderMinPrice = (provider: ProviderWithServices): number => {
    if (!provider.services || provider.services.length === 0) {
      return 0;
    }
    const prices = provider.services.map(s => s.price || 0);
    return Math.min(...prices);
  };

  // Función para filtrar por rango de precio
  const matchesPriceRange = (provider: ProviderWithServices, priceRange: string): boolean => {
    if (!priceRange) return true;
    
    const minPrice = getProviderMinPrice(provider);
    
    switch (priceRange) {
      case '0-1000':
        return minPrice >= 0 && minPrice <= 1000;
      case '1000-5000':
        return minPrice > 1000 && minPrice <= 5000;
      case '5000+':
        return minPrice > 5000;
      default:
        return true;
    }
  };

  // Función para filtrar por búsqueda de texto
  const matchesSearch = (provider: ProviderWithServices, search: string): boolean => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    const nameMatches = provider.name?.toLowerCase().includes(searchLower);
    const descriptionMatches = provider.description?.toLowerCase().includes(searchLower);
    
    return nameMatches || descriptionMatches;
  };

  // Aplicar todos los filtros
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      // Filtro por ciudad
      if (filters.city && provider.city !== filters.city) {
        return false;
      }

      // Filtro por Premium
      if (filters.isPremium !== null && provider.is_premium !== filters.isPremium) {
        return false;
      }

      // Filtro por Destacado
      if (filters.isFeatured !== null && provider.featured !== filters.isFeatured) {
        return false;
      }

      // Filtro por rango de precio
      if (!matchesPriceRange(provider, filters.priceRange)) {
        return false;
      }

      // Filtro por búsqueda de texto
      if (!matchesSearch(provider, filters.search)) {
        return false;
      }

      return true;
    });
  }, [providers, filters]);

  // Estadísticas de los filtros
  const filterStats = useMemo(() => {
    const total = providers.length;
    const filtered = filteredProviders.length;
    const hasActiveFilters = Object.values(filters).some(value => 
      value !== '' && value !== null && value !== undefined
    );

    return {
      total,
      filtered,
      hasActiveFilters,
      percentageShown: total > 0 ? Math.round((filtered / total) * 100) : 0
    };
  }, [providers, filteredProviders, filters]);

  return {
    filters,
    filteredProviders,
    availableCities,
    filterStats,
    handleFilterChange,
    clearFilters,
    getProviderMinPrice
  };
};