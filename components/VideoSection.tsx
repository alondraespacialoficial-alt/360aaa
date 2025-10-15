import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { supabase } from '../services/supabaseClient';

interface SiteVideo {
  id: string;
  title: string;
  description: string;
  video_type: 'youtube' | 'vimeo' | 'upload' | 'url';
  video_url: string | null;
  video_file_path: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
}

const VideoSection: React.FC = () => {
  const [video, setVideo] = useState<SiteVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveVideo();
  }, []);

  const fetchActiveVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('site_videos')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video:', error);
      } else if (data) {
        setVideo(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoUrl = (video: SiteVideo): string => {
    switch (video.video_type) {
      case 'upload':
        return video.video_file_path 
          ? `${supabase.storage.from('site-videos').getPublicUrl(video.video_file_path).data.publicUrl}`
          : '';
      case 'youtube':
        // Convertir URL de YouTube a formato embed
        if (video.video_url) {
          const videoId = extractYouTubeId(video.video_url);
          return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : video.video_url;
        }
        return '';
      case 'vimeo':
        // Convertir URL de Vimeo a formato embed
        if (video.video_url) {
          const videoId = extractVimeoId(video.video_url);
          return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=0` : video.video_url;
        }
        return '';
      default:
        return video.video_url || '';
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (video: SiteVideo): string => {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    // Thumbnails automáticos para YouTube y Vimeo
    if (video.video_type === 'youtube' && video.video_url) {
      const videoId = extractYouTubeId(video.video_url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    }
    
    return '/placeholder-video-thumb.jpg'; // Fallback image
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse rounded-2xl mb-8 shadow-xl">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-4">🎬</div>
            <div className="text-gray-600 font-semibold">Cargando video...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    // Sección de video fallback ESPECTACULAR cuando no hay video
    return (
      <section className="mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-3xl overflow-hidden shadow-2xl">
            {/* Fondo con patrón */}
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center h-80 md:h-96 text-white text-center p-8">
              {/* Icono animado */}
              <div className="mb-6 animate-bounce">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎥</span>
                </div>
              </div>
              
              {/* Contenido */}
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                ¡Descubre Charlitron Eventos 360!
              </h3>
              <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
                La plataforma líder en México para encontrar proveedores de eventos verificados. 
                Cotiza al instante y crea experiencias inolvidables.
              </p>
              
              {/* Características destacadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-sm">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-semibold">Proveedores Verificados</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-semibold">WhatsApp Directo</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-2xl mb-2">🇲🇽</div>
                  <div className="font-semibold">Cobertura Nacional</div>
                </div>
              </div>
              
              {/* Call to action */}
              <div className="mt-8">
                <a
                  href="#categorias"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <span>🚀</span>
                  Explorar Proveedores
                </a>
              </div>
            </div>
            
            {/* Efectos decorativos */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-pink-300/20 rounded-full blur-xl"></div>
          </div>
          
          {/* Indicador */}
          <div className="text-center mt-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
              🎬 Sección de Video Promocional
            </span>
          </div>
        </div>
      </section>
    );
  }

  const videoUrl = getVideoUrl(video);
  const thumbnailUrl = getThumbnailUrl(video);

  return (
    <section className="w-full mb-12">
      <div className="container mx-auto px-4">
        {/* Título del video */}
        {video.title && (
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {video.title}
            </h2>
            {video.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {video.description}
              </p>
            )}
          </div>
        )}

        {/* Container del video */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            {video.video_type === 'upload' ? (
              // Video subido - reproductor HTML5
              <video
                className="w-full h-full object-cover"
                controls
                poster={thumbnailUrl}
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                Tu navegador no soporta el elemento video.
              </video>
            ) : (
              // Videos de YouTube/Vimeo/URL - iframe
              <iframe
                className="w-full h-full"
                src={videoUrl}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>

          {/* Overlay con información adicional */}
          <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg p-4 text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-200 mt-1 line-clamp-2">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de tipo de video */}
        <div className="text-center mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {video.video_type === 'youtube' && '📺 YouTube'}
            {video.video_type === 'vimeo' && '🎬 Vimeo'}
            {video.video_type === 'upload' && '📁 Video Local'}
            {video.video_type === 'url' && '🔗 Enlace Directo'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;