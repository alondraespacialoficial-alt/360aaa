/**
 * Utilidades para manejo inteligente de direcciones y Google Maps URLs
 */

/**
 * Detecta si un string es una URL de Google Maps
 */
export const isGoogleMapsUrl = (text: string): boolean => {
  if (!text) return false;
  
  const mapsPatterns = [
    /https?:\/\/(www\.)?google\.[a-z]+\/maps/i,
    /https?:\/\/maps\.google\.[a-z]+/i,
    /https?:\/\/maps\.app\.goo\.gl/i,
    /https?:\/\/goo\.gl\/maps/i,
    /https?:\/\/g\.page\//i
  ];
  
  return mapsPatterns.some(pattern => pattern.test(text.trim()));
};

/**
 * Limpia y valida una URL de Google Maps
 */
export const cleanGoogleMapsUrl = (url: string): string => {
  if (!url) return '';
  
  // Remover espacios en blanco
  let cleaned = url.trim();
  
  // Si no tiene protocolo, agregarlo
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  
  return cleaned;
};

/**
 * Extrae información de ubicación de una URL de Google Maps
 * Intenta extraer coordenadas y lugar si están disponibles
 */
export const extractLocationFromMapsUrl = (url: string): {
  hasCoordinates: boolean;
  latitude?: number;
  longitude?: number;
  placeName?: string;
} => {
  if (!isGoogleMapsUrl(url)) {
    return { hasCoordinates: false };
  }
  
  try {
    // Patrón para coordenadas: /@lat,lng,zoom
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    if (coordsMatch) {
      return {
        hasCoordinates: true,
        latitude: parseFloat(coordsMatch[1]),
        longitude: parseFloat(coordsMatch[2])
      };
    }
    
    // Patrón para place_id o nombre de lugar
    const placeMatch = url.match(/place\/([^\/]+)/);
    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      return {
        hasCoordinates: false,
        placeName
      };
    }
    
    return { hasCoordinates: false };
  } catch (error) {
    console.error('Error extracting location from Maps URL:', error);
    return { hasCoordinates: false };
  }
};

/**
 * Valida una dirección escrita manualmente
 */
export const validateAddress = (address: string, city: string, state: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!address || address.trim().length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres');
  }
  
  if (!city || city.trim().length < 2) {
    errors.push('La ciudad es requerida');
  }
  
  if (!state || state.trim().length < 2) {
    errors.push('El estado es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formatea una dirección completa para mostrar
 */
export const formatFullAddress = (address: string, city: string, state: string): string => {
  const parts = [address, city, state].filter(Boolean);
  return parts.join(', ');
};

/**
 * Determina el tipo de entrada de ubicación y retorna datos estructurados
 */
export const parseLocationInput = (
  addressInput: string,
  cityInput?: string,
  stateInput?: string
): {
  type: 'maps_url' | 'manual_address' | 'invalid';
  mapsUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  placeName?: string;
  errors?: string[];
} => {
  // Verificar si es URL de Google Maps
  if (isGoogleMapsUrl(addressInput)) {
    const cleaned = cleanGoogleMapsUrl(addressInput);
    const locationData = extractLocationFromMapsUrl(cleaned);
    
    return {
      type: 'maps_url',
      mapsUrl: cleaned,
      coordinates: locationData.hasCoordinates 
        ? { lat: locationData.latitude!, lng: locationData.longitude! }
        : undefined,
      placeName: locationData.placeName
    };
  }
  
  // Es dirección manual
  const validation = validateAddress(addressInput, cityInput || '', stateInput || '');
  
  if (!validation.isValid) {
    return {
      type: 'invalid',
      errors: validation.errors
    };
  }
  
  return {
    type: 'manual_address',
    address: addressInput.trim(),
    city: cityInput?.trim(),
    state: stateInput?.trim()
  };
};
