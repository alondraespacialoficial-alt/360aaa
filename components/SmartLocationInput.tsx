import React, { useState, useEffect } from 'react';
import { isGoogleMapsUrl, parseLocationInput } from '../utils/locationHelpers';

interface SmartLocationInputProps {
  value: {
    address: string;
    city: string;
    state: string;
    mapsUrl?: string;
  };
  onChange: (value: {
    address: string;
    city: string;
    state: string;
    mapsUrl?: string;
  }) => void;
  error?: string;
}

/**
 * Componente inteligente que detecta automáticamente si el usuario
 * está pegando un link de Google Maps o escribiendo una dirección manual
 */
const SmartLocationInput: React.FC<SmartLocationInputProps> = ({ value, onChange, error }) => {
  const [inputType, setInputType] = useState<'auto' | 'maps' | 'manual'>('auto');
  const [localAddress, setLocalAddress] = useState(value.address || '');
  const [localCity, setLocalCity] = useState(value.city || '');
  const [localState, setLocalState] = useState(value.state || '');
  const [showHelp, setShowHelp] = useState(false);

  // Detectar automáticamente el tipo de entrada
  useEffect(() => {
    if (localAddress && isGoogleMapsUrl(localAddress)) {
      setInputType('maps');
      // Limpiar city/state si es URL de Maps
      onChange({
        address: '',
        city: '',
        state: '',
        mapsUrl: localAddress
      });
    } else if (localAddress) {
      setInputType('manual');
      onChange({
        address: localAddress,
        city: localCity,
        state: localState,
        mapsUrl: undefined
      });
    }
  }, [localAddress, localCity, localState]);

  const handleAddressChange = (newAddress: string) => {
    setLocalAddress(newAddress);
  };

  const handleCityChange = (newCity: string) => {
    setLocalCity(newCity);
  };

  const handleStateChange = (newState: string) => {
    setLocalState(newState);
  };

  const isMapsMode = inputType === 'maps';

  return (
    <div className="space-y-4">
      {/* Header con ayuda */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          📍 Ubicación de tu negocio
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
        >
          <span>❓</span>
          <span>{showHelp ? 'Ocultar ayuda' : '¿Cómo obtener mi ubicación?'}</span>
        </button>
      </div>

      {/* Ayuda desplegable */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Dos formas de agregar tu ubicación:</h4>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-blue-800">📌 Opción 1: Link de Google Maps (Recomendado)</p>
              <ol className="list-decimal ml-5 mt-1 text-blue-700 space-y-1">
                <li>Abre Google Maps en tu navegador</li>
                <li>Busca tu negocio o la dirección exacta</li>
                <li>Haz clic en "Compartir" o el botón de compartir</li>
                <li>Copia el enlace</li>
                <li>Pégalo en el campo de abajo ⬇️</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-blue-800">✍️ Opción 2: Escribir dirección manualmente</p>
              <p className="ml-5 mt-1 text-blue-700">
                Escribe tu dirección completa, ciudad y estado en los campos correspondientes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campo principal inteligente */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={localAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={
              isMapsMode 
                ? "Ej: https://maps.app.goo.gl/xxxxx o https://www.google.com/maps/..."
                : "Ej: Av. Constitución 123, Col. Centro"
            }
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
              isMapsMode
                ? 'border-green-300 bg-green-50 focus:border-green-500'
                : 'border-purple-300 bg-white focus:border-purple-500'
            } ${error ? 'border-red-500' : ''}`}
          />
          
          {/* Indicador de tipo detectado */}
          {localAddress && (
            <div className="absolute right-3 top-3">
              {isMapsMode ? (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>✓</span>
                  <span>Google Maps</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>✍️</span>
                  <span>Dirección</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mensaje de ayuda dinámico */}
        {localAddress && isMapsMode && (
          <p className="mt-2 text-sm text-green-700 flex items-center gap-1">
            <span>✅</span>
            <span>Link de Google Maps detectado. No necesitas llenar ciudad/estado.</span>
          </p>
        )}
      </div>

      {/* Campos de ciudad y estado (solo si no es Maps URL) */}
      {!isMapsMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              type="text"
              value={localCity}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="Ej: Monterrey"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <input
              type="text"
              value={localState}
              onChange={(e) => handleStateChange(e.target.value)}
              placeholder="Ej: Nuevo León"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {/* Vista previa de lo que se guardará */}
      {localAddress && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Vista previa:</p>
          {isMapsMode ? (
            <div className="text-sm text-gray-700">
              <p>🗺️ <strong>Google Maps:</strong> {localAddress}</p>
              <a 
                href={localAddress} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                Ver en Google Maps →
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              📍 {localAddress}
              {localCity && `, ${localCity}`}
              {localState && `, ${localState}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartLocationInput;
