import React, { useState } from 'react';
import { StarIcon, UserIcon, CheckBadgeIcon, HandThumbUpIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_avatar_url?: string;
  is_verified: boolean;
  helpful_votes: number;
  user_id?: string;
}

interface ReviewsDisplayProps {
  reviews: Review[];
  onHelpfulVote?: (reviewId: number) => void;
}

const ReviewsDisplay: React.FC<ReviewsDisplayProps> = ({ reviews, onHelpfulVote }) => {
  const [votedReviews, setVotedReviews] = useState<Set<number>>(new Set());

  const handleHelpfulClick = (reviewId: number) => {
    if (votedReviews.has(reviewId)) return;
    
    setVotedReviews(prev => new Set([...prev, reviewId]));
    onHelpfulVote?.(reviewId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;
    return `Hace ${Math.ceil(diffDays / 365)} años`;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Aún no hay reseñas</p>
        <p className="text-sm text-gray-500">¡Sé el primero en compartir tu experiencia!</p>
      </div>
    );
  }

  // Estadísticas de reseñas
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  const verifiedCount = reviews.filter(r => r.is_verified).length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
  }));

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-gray-600">
              Basado en {totalReviews} reseña{totalReviews !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-600">{count}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {verifiedCount}
            </div>
            <div className="text-sm text-gray-600">
              Reseñas verificadas
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((verifiedCount / totalReviews) * 100).toFixed(0)}% verificadas
            </div>
          </div>
        </div>
      </div>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        {reviews
          .sort((a, b) => {
            // Priorizar verificadas, luego por fecha
            if (a.is_verified && !b.is_verified) return -1;
            if (!a.is_verified && b.is_verified) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((review) => (
          <div 
            key={review.id} 
            className={`p-4 rounded-lg border-2 transition-all ${
              review.is_verified 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {review.user_avatar_url ? (
                  <img 
                    src={review.user_avatar_url} 
                    alt={review.user_name || 'Usuario'} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">
                      {review.user_name ? getInitials(review.user_name) : '?'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {review.user_name || 'Usuario Anónimo'}
                  </span>
                  
                  {review.is_verified && (
                    <CheckBadgeIcon className="w-5 h-5 text-green-500" title="Reseña verificada" />
                  )}
                  
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    ({review.rating}/5)
                  </span>
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {review.comment}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleHelpfulClick(review.id)}
                    disabled={votedReviews.has(review.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      votedReviews.has(review.id)
                        ? 'text-purple-600'
                        : 'text-gray-500 hover:text-purple-600'
                    } disabled:cursor-not-allowed`}
                  >
                    {votedReviews.has(review.id) ? (
                      <HandThumbUpIcon className="w-4 h-4" />
                    ) : (
                      <HandThumbUpOutlineIcon className="w-4 h-4" />
                    )}
                    <span>
                      Útil ({review.helpful_votes + (votedReviews.has(review.id) ? 1 : 0)})
                    </span>
                  </button>

                  {review.is_verified && (
                    <span className="text-xs text-green-600 font-medium">
                      ✅ Verificada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer informativo */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Las reseñas verificadas son de usuarios registrados. 
          <br />
          <span className="text-xs">
            Las reseñas anónimas también son valiosas para la comunidad.
          </span>
        </p>
      </div>
    </div>
  );
};

export default ReviewsDisplay;