import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const BlogPostsAdmin: React.FC = () => {
  // ...existing code...
  // Importar Link si no está
  // import { Link } from 'react-router-dom';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este artículo?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      setMessage('Error al eliminar el artículo.');
    } else {
      setPosts(posts.filter(p => p.id !== id));
      setMessage('Artículo eliminado correctamente.');
    }
  };

  const handleStartEdit = (post: any) => {
    setEditId(post.id);
    setEditValues({
      title: post.title,
      content: post.content,
      author: post.author,
      image_url: post.image_url,
      is_published: post.is_published,
    });
  };

  const handleEditChange = (field: string, value: any) => {
    setEditValues((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setLoading(true);
    const { error } = await supabase.from('blog_posts').update(editValues).eq('id', editId);
    setLoading(false);
    if (error) {
      setMessage('Error al actualizar el artículo.');
    } else {
      setPosts(posts.map(p => p.id === editId ? { ...p, ...editValues } : p));
      setMessage('Artículo actualizado correctamente.');
      setEditId(null);
      setEditValues({});
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditValues({});
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/admin/panel" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold shadow">
          ← Regresar al panel administrador
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-purple-800">Administrar artículos del Blog</h2>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {loading ? (
        <p>Cargando artículos...</p>
      ) : posts.length === 0 ? (
        <p>No hay artículos publicados aún.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map(post => (
            <li key={post.id} className="bg-white rounded shadow p-4">
              {editId === post.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValues.title}
                    onChange={e => handleEditChange('title', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <textarea
                    value={editValues.content}
                    onChange={e => handleEditChange('content', e.target.value)}
                    className="w-full p-2 border rounded min-h-[100px]"
                  />
                  <input
                    type="text"
                    value={editValues.author}
                    onChange={e => handleEditChange('author', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    value={editValues.image_url}
                    onChange={e => handleEditChange('image_url', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editValues.is_published}
                      onChange={e => handleEditChange('is_published', e.target.checked)}
                    />
                    Publicar artículo
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleSaveEdit}>Guardar</button>
                    <button className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={handleCancelEdit}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg text-purple-700">{post.title}</div>
                    <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => handleStartEdit(post)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(post.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlogPostsAdmin;
