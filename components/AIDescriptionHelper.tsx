import React, { useState } from 'react';
import { generateProviderDescription } from '../services/aiDescriptionService';

interface AIDescriptionHelperProps {
  /** Valor actual de la descripción */
  value: string;
  /** Callback cuando la descripción cambia */
  onChange: (newDescription: string) => void;
  /** Datos del negocio para contexto de la IA */
  businessContext: {
    businessName?: string;
    category?: string;
    services?: string[];
    city?: string;
    state?: string;
  };
  /** Placeholder del textarea */
  placeholder?: string;
  /** Máximo de caracteres */
  maxLength?: number;
}

/**
 * Componente de campo de descripción con asistencia de IA
 * Permite al usuario escribir o generar automáticamente una descripción profesional
 */
const AIDescriptionHelper: React.FC<AIDescriptionHelperProps> = ({
  value,
  onChange,
  businessContext,
  placeholder = "Describe tu negocio, servicios y qué te hace especial...",
  maxLength = 500
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleGenerateDescription = async () => {
    // Validar que tenga datos mínimos
    if (!businessContext.businessName || !businessContext.category) {
      setError('Necesitas llenar al menos el nombre del negocio y categoría primero');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedText = await generateProviderDescription(businessContext);
      onChange(generatedText);
    } catch (err: any) {
      setError(err.message || 'Error al generar descripción. Intenta de nuevo.');
      console.error('Error generating description:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="space-y-3">
      {/* Header con ayuda */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          📝 Descripción de tu negocio
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
        >
          <span>💡</span>
          <span>{showHelp ? 'Ocultar tips' : 'Ver tips'}</span>
        </button>
      </div>

      {/* Tips desplegables */}
      {showHelp && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-amber-900 mb-2">💡 Tips para una buena descripción:</h4>
          <ul className="list-disc ml-5 space-y-1 text-amber-800">
            <li>Menciona qué servicios ofreces</li>
            <li>Destaca tu experiencia o años en el mercado</li>
            <li>Incluye qué te hace diferente</li>
            <li>Habla de la calidad de tu trabajo</li>
            <li>Invita a los clientes a contactarte</li>
          </ul>
        </div>
      )}

      {/* Campo de texto */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          rows={6}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition resize-none ${
            error 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-300 bg-white focus:border-purple-500'
          }`}
          disabled={isGenerating}
        />
        
        {/* Contador de caracteres */}
        <div className={`absolute bottom-3 right-3 text-xs font-medium ${
          isNearLimit ? 'text-red-600' : 'text-gray-400'
        }`}>
          {remainingChars} caracteres restantes
        </div>
      </div>

      {/* Botón de IA */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleGenerateDescription}
          disabled={isGenerating || !businessContext.businessName || !businessContext.category}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition shadow-lg ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generando con IA...</span>
            </>
          ) : (
            <>
              <span className="text-xl">✨</span>
              <span>Generar con IA</span>
            </>
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {value ? (
              <>✍️ Puedes editar el texto generado o escribir el tuyo propio</>
            ) : (
              <>🤖 La IA creará una descripción profesional basada en tus datos</>
            )}
          </p>
          {(!businessContext.businessName || !businessContext.category) && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Llena nombre y categoría primero para usar la IA
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <span className="text-red-600">⚠️</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message después de generar */}
      {value && !isGenerating && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <span className="text-green-600">✅</span>
          <div className="flex-1">
            <p className="text-sm text-green-700 font-medium">
              ¡Descripción generada! Puedes editarla si deseas hacer cambios.
            </p>
          </div>
        </div>
      )}

      {/* Preview de cómo se verá */}
      {value && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Vista previa:</p>
          <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
        </div>
      )}
    </div>
  );
};

export default AIDescriptionHelper;
