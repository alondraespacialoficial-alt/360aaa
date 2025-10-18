import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ReviewLoginModal from './ReviewLoginModal';
import { UserIcon, StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface AuthenticatedReviewFormProps {
  providerId: string;
  providerName: string;
  onNewReview: (review: any) => void;
  existingReviews: any[];
}

const AuthenticatedReviewForm: React.FC<AuthenticatedReviewFormProps> = ({
  providerId,
  providerName,
  onNewReview,
  existingReviews
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(false);

  // Verificar si el usuario ya tiene una reseña
  const userHasReview = user && existingReviews.some(review => review.user_id === user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!comment.trim()) {
      setError('Por favor escribe tu opinión');
      setLoading(false);
      return;
    }

    try {
      let reviewData: any = {
        provider_id: providerId,
        rating,
        comment: comment.trim()
      };

      // Si hay usuario autenticado, agregar datos del usuario
      if (user) {
        reviewData.user_id = user.id;
        reviewData.user_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
        reviewData.user_avatar_url = user.user_metadata?.avatar_url || null;
      } else {
        // Reseña anónima
        reviewData.user_name = 'Usuario Anónimo';
      }

      const { data, error: insertError } = await supabase
        .from('provider_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Ya tienes una reseña para este proveedor. Solo puedes dejar una reseña por proveedor.');
        } else {
          setError(`Error: ${insertError.message}`);
        }
      } else if (data) {
        setSuccess(true);
        setComment('');
        setRating(5);
        onNewReview(data);
        
        // Resetear éxito después de 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = () => {
    if (!user && !allowAnonymous) {
      setShowLoginModal(true);
    } else {
      // Continuar con el submit normal
    }
  };

  if (userHasReview) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <StarIcon className="w-5 h-5" />
          <span className="font-medium">Ya has reseñado este proveedor</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Gracias por tu opinión. Puedes editar tu reseña desde tu perfil.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            {user ? (
              user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-purple-600" />
              )
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user ? 'Escribe tu reseña' : 'Comparte tu experiencia'}
            </h3>
            <p className="text-sm text-gray-600">
              {user ? (
                `Como ${user.user_metadata?.full_name || user.email}`
              ) : (
                'Puedes escribir una reseña anónima o crear cuenta para verificarla'
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                >
                  {star <= rating ? (
                    <StarIcon className="w-8 h-8 text-yellow-400 hover:text-yellow-500 transition-colors" />
                  ) : (
                    <StarOutlineIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && "Muy malo"}
              {rating === 2 && "Malo"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Bueno"}
              {rating === 5 && "Excelente"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu opinión *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Cuéntanos sobre tu experiencia con este proveedor..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ¡Gracias por tu reseña! Tu opinión ayuda a otros usuarios.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
                >
                  🔒 Reseña Verificada
                </button>
                <button
                  type="submit"
                  disabled={loading || !comment.trim()}
                  onClick={() => setAllowAnonymous(true)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Guardando...' : '👤 Reseña Anónima'}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Guardando...' : '✅ Publicar Reseña Verificada'}
              </button>
            )}
          </div>

          {!user && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <strong>💡 Tip:</strong> Las reseñas verificadas tienen más credibilidad y aparecen destacadas.
              Con una cuenta puedes editar tu reseña y ver tu historial.
            </div>
          )}
        </form>
      </div>

      <ReviewLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // El formulario se actualizará automáticamente cuando el usuario esté autenticado
        }}
        providerName={providerName}
      />
    </>
  );
};

export default AuthenticatedReviewForm;