import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (!error) setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <Link to="/" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold shadow">
          ← Regresar a la página principal
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-purple-800">Blog y Consejos para tu Evento</h1>
      {loading ? (
        <p>Cargando artículos...</p>
      ) : posts.length === 0 ? (
        <p>No hay artículos publicados aún.</p>
      ) : (
        <div className="space-y-8">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow p-6">
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="mb-4 rounded w-full h-auto object-contain" style={{maxHeight: '400px'}} />
              )}
              <h2 className="text-2xl font-bold text-purple-700 mb-2">{post.title}</h2>
              <div className="text-gray-700 mb-2">
                {post.content.split(/\r?\n/).map((line: string, idx: number) =>
                  line.trim() ? <p key={idx} className="mb-2">{line}</p> : <br key={idx} />
                )}
              </div>
              <div className="text-sm text-gray-500">Por {post.author || 'Charlitron®'} | {new Date(post.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blog;
