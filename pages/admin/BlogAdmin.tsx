import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';

const BlogAdmin: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let uploadedImageUrl = imageUrl;
    if (imageFile) {
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(`blog/${Date.now()}_${imageFile.name}`, imageFile);
      if (error) {
        setMessage('Error al subir la imagen.');
        setLoading(false);
        return;
      }
      const { data: publicData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);
      uploadedImageUrl = publicData.publicUrl;
    }
    const { error } = await supabase.from('blog_posts').insert([
      {
        title,
        content,
        author,
        image_url: uploadedImageUrl,
        is_published: isPublished,
      },
    ]);
    setLoading(false);
    if (error) {
      setMessage('Error al guardar el artículo.');
    } else {
      setMessage('Artículo publicado correctamente.');
      setTitle('');
      setContent('');
      setAuthor('');
      setImageUrl('');
      setImageFile(null);
      setIsPublished(true);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-4 flex gap-2">
        <Link to="/admin/panel" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold shadow">
          ← Regresar al panel administrador
        </Link>
        <Link to="/admin/blog-posts" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-semibold shadow">
          Administrar artículos
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-purple-800">Panel de Blog / Consejos</h1>
  <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Contenido"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          className="w-full p-2 border rounded min-h-[120px]"
        />
        <input
          type="text"
          placeholder="Autor"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="URL de imagen (opcional)"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="w-full p-2 border rounded"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
          />
          Publicar artículo
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          {loading ? 'Guardando...' : 'Publicar'}
        </button>
        {message && <div className="mt-2 text-green-600">{message}</div>}
      </form>
    </div>
  );
};

export default BlogAdmin;
