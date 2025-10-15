import { supabase } from '../../services/supabaseClient';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const generateSitemapXml = (urls: SitemapUrl[]): string => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority ? `
    <priority>${url.priority}</priority>` : ''}
  </url>`).join('')}
</urlset>`;
  
  return sitemap.trim();
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const baseUrl = 'https://charlitron360.vercel.app'; // Cambia por tu dominio real
    const currentDate = new Date().toISOString().split('T')[0];
    
    const urls: SitemapUrl[] = [];

    // Páginas estáticas principales
    urls.push(
      {
        loc: `${baseUrl}/embed`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/legal`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.3
      }
    );

    // Obtener todas las categorías activas
    const { data: categories, error: catError } = await supabase
      .from('provider_categories')
      .select('id, name, slug, updated_at')
      .eq('is_active', true)
      .order('name');

    if (!catError && categories) {
      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/categoria/${category.slug}`,
          lastmod: category.updated_at ? new Date(category.updated_at).toISOString().split('T')[0] : currentDate,
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }

    // Obtener todos los proveedores activos
    const { data: providers, error: provError } = await supabase
      .from('providers')
      .select('id, name, updated_at')
      .eq('is_active', true)
      .order('name');

    if (!provError && providers) {
      providers.forEach(provider => {
        urls.push({
          loc: `${baseUrl}/proveedor/${provider.id}`,
          lastmod: provider.updated_at ? new Date(provider.updated_at).toISOString().split('T')[0] : currentDate,
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

    // Páginas del admin (públicas pero con menor prioridad)
    urls.push({
      loc: `${baseUrl}/admin/login`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.2
    });

    // Generar el sitemap XML
    const sitemapXml = generateSitemapXml(urls);

    // Configurar headers para XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache 1 hora
    
    return res.status(200).send(sitemapXml);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).json({ 
      message: 'Error generating sitemap',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}