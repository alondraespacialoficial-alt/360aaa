import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  EyeIcon,
  CloudArrowUpIcon,
  LinkIcon 
} from '@heroicons/react/24/solid';
import { supabase } from '../../services/supabaseClient';

interface SiteVideo {
  id: string;
  title: string;
  description: string;
  video_type: 'youtube' | 'vimeo' | 'upload' | 'url';
  video_url: string | null;
  video_file_path: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface VideoFormData {
  title: string;
  description: string;
  video_type: 'youtube' | 'vimeo' | 'upload' | 'url';
  video_url: string;
  thumbnail_url: string;
}

const VideoAdmin: React.FC = () => {
  const [videos, setVideos] = useState<SiteVideo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SiteVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    video_type: 'youtube',
    video_url: '',
    thumbnail_url: ''
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('site_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      alert('Error al cargar los videos');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const videoData = {
        title: formData.title,
        description: formData.description,
        video_type: formData.video_type,
        video_url: formData.video_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        video_file_path: null // Se actualizará si es upload
      };

      if (editingVideo) {
        // Actualizar video existente
        const { error } = await supabase
          .from('site_videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
      } else {
        // Crear nuevo video
        const { error } = await supabase
          .from('site_videos')
          .insert([videoData]);

        if (error) throw error;
      }

      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        video_type: 'youtube',
        video_url: '',
        thumbnail_url: ''
      });
      setShowForm(false);
      setEditingVideo(null);
      await fetchVideos();

      alert(editingVideo ? 'Video actualizado exitosamente' : 'Video creado exitosamente');
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error al guardar el video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setIsUploading(true);

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('site-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Crear registro en la base de datos
      const videoData = {
        title: formData.title || file.name,
        description: formData.description,
        video_type: 'upload' as const,
        video_url: null,
        video_file_path: filePath,
        thumbnail_url: formData.thumbnail_url || null
      };

      const { error } = await supabase
        .from('site_videos')
        .insert([videoData]);

      if (error) throw error;

      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        video_type: 'youtube',
        video_url: '',
        thumbnail_url: ''
      });
      setShowForm(false);
      await fetchVideos();

      alert('Video subido exitosamente');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleActivateVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('site_videos')
        .update({ is_active: true })
        .eq('id', videoId);

      if (error) throw error;
      await fetchVideos();
      alert('Video activado exitosamente');
    } catch (error) {
      console.error('Error activating video:', error);
      alert('Error al activar el video');
    }
  };

  const handleDeleteVideo = async (video: SiteVideo) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este video?')) return;

    try {
      // Si es un archivo subido, eliminarlo del storage también
      if (video.video_type === 'upload' && video.video_file_path) {
        const { error: storageError } = await supabase.storage
          .from('site-videos')
          .remove([video.video_file_path]);
        
        if (storageError) console.warn('Error deleting file from storage:', storageError);
      }

      // Eliminar registro de la base de datos
      const { error } = await supabase
        .from('site_videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;
      await fetchVideos();
      alert('Video eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error al eliminar el video');
    }
  };

  const startEdit = (video: SiteVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      video_type: video.video_type,
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || ''
    });
    setShowForm(true);
  };

  const getVideoPreviewUrl = (video: SiteVideo): string => {
    switch (video.video_type) {
      case 'upload':
        return video.video_file_path 
          ? `${supabase.storage.from('site-videos').getPublicUrl(video.video_file_path).data.publicUrl}`
          : '';
      case 'youtube':
        if (video.video_url) {
          const videoId = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
          return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
        }
        return '';
      default:
        return video.thumbnail_url || '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Videos</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingVideo(null);
            setFormData({
              title: '',
              description: '',
              video_type: 'youtube',
              video_url: '',
              thumbnail_url: ''
            });
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Video
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-semibold mb-4">
            {editingVideo ? 'Editar Video' : 'Nuevo Video'}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Video
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Video
                </label>
                <select
                  value={formData.video_type}
                  onChange={(e) => setFormData({...formData, video_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="url">URL Directa</option>
                  <option value="upload">Subir Archivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {formData.video_type !== 'upload' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.video_type === 'youtube' ? 'URL de YouTube' : 
                   formData.video_type === 'vimeo' ? 'URL de Vimeo' : 
                   'URL del Video'}
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                  required={formData.video_type !== 'upload'}
                />
              </div>
            )}

            {formData.video_type === 'upload' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {isUploading && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full animate-pulse w-full"></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Subiendo video...</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Thumbnail (opcional)
              </label>
              <input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {isLoading ? 'Guardando...' : (editingVideo ? 'Actualizar' : 'Crear Video')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVideo(null);
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
            {/* Preview del video */}
            <div className="aspect-video bg-gray-100 relative">
              {getVideoPreviewUrl(video) ? (
                <img 
                  src={getVideoPreviewUrl(video)} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <PlayIcon className="h-12 w-12" />
                </div>
              )}
              {video.is_active && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  ACTIVO
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {video.video_type.toUpperCase()}
              </div>
            </div>

            {/* Información del video */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2 truncate">{video.title}</h3>
              {video.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
              )}
              
              <div className="flex gap-2">
                {!video.is_active && (
                  <button
                    onClick={() => handleActivateVideo(video.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition flex items-center justify-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Activar
                  </button>
                )}
                <button
                  onClick={() => startEdit(video)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteVideo(video)}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <PlayIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No hay videos</h3>
          <p className="text-gray-400">Crea tu primer video para la página principal</p>
        </div>
      )}
    </div>
  );
};

export default VideoAdmin;