import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FilterPanelProps {
  filters: {
    priceRange: string;
    city: string;
    isPremium: boolean | null;
    isFeatured: boolean | null;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  availableCities: string[];
  resultsCount: number;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableCities,
  resultsCount,
  className = ''
}) => {
  const priceRanges = [
    { value: '', label: 'Todos los precios' },
    { value: '0-1000', label: 'Económico ($0 - $1,000)' },
    { value: '1000-5000', label: 'Medio ($1,000 - $5,000)' },
    { value: '5000+', label: 'Premium ($5,000+)' }
  ];

  const premiumOptions = [
    { value: null, label: 'Todos los tipos' },
    { value: true, label: 'Solo Premium' },
    { value: false, label: 'Solo Estándar' }
  ];

  const featuredOptions = [
    { value: null, label: 'Todos' },
    { value: true, label: 'Solo Destacados' },
    { value: false, label: 'Solo Regulares' }
  ];

  const hasActiveFilters = 
    filters.priceRange || 
    filters.city || 
    filters.isPremium !== null || 
    filters.isFeatured !== null ||
    filters.search;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🔍 Filtros
          {hasActiveFilters && (
            <span className="bg-purple-100 text-purple-700 text-sm px-2 py-1 rounded-full">
              Activos
            </span>
          )}
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            📊 {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Búsqueda */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔎 Buscar
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Nombre o descripción..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Precio
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => onFilterChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 Ciudad
          </label>
          <select
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas las ciudades</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Premium */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⭐ Tipo
          </label>
          <select
            value={filters.isPremium === null ? '' : filters.isPremium.toString()}
            onChange={(e) => {
              const value = e.target.value === '' ? null : e.target.value === 'true';
              onFilterChange('isPremium', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {premiumOptions.map((option) => (
              <option key={option.label} value={option.value === null ? '' : option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destacados */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌟 Destacado
          </label>
          <select
            value={filters.isFeatured === null ? '' : filters.isFeatured.toString()}
            onChange={(e) => {
              const value = e.target.value === '' ? null : e.target.value === 'true';
              onFilterChange('isFeatured', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {featuredOptions.map((option) => (
              <option key={option.label} value={option.value === null ? '' : option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros activos (chips) */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                🔎 "{filters.search}"
                <button
                  onClick={() => onFilterChange('search', '')}
                  className="hover:bg-blue-200 rounded-full p-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.priceRange && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                💰 {priceRanges.find(r => r.value === filters.priceRange)?.label}
                <button
                  onClick={() => onFilterChange('priceRange', '')}
                  className="hover:bg-green-200 rounded-full p-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.city && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                📍 {filters.city}
                <button
                  onClick={() => onFilterChange('city', '')}
                  className="hover:bg-purple-200 rounded-full p-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.isPremium !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                ⭐ {filters.isPremium ? 'Premium' : 'Estándar'}
                <button
                  onClick={() => onFilterChange('isPremium', null)}
                  className="hover:bg-yellow-200 rounded-full p-1"
                >
                  ×
                </button>
              </span>
            )}
            {filters.isFeatured !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
                🌟 {filters.isFeatured ? 'Destacado' : 'Regular'}
                <button
                  onClick={() => onFilterChange('isFeatured', null)}
                  className="hover:bg-pink-200 rounded-full p-1"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;