export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const baseUrl = 'https://charlitron360.vercel.app'; // Cambia por tu dominio real
  
  const robotsTxt = `# Robots.txt para Charlitron Eventos 360
# Directorio de Proveedores para Eventos en México

User-agent: *
Allow: /

# Permitir acceso a todas las páginas públicas
Allow: /embed
Allow: /categoria/
Allow: /proveedor/
Allow: /legal

# Restringir acceso a páginas administrativas
Disallow: /admin/
Disallow: /api/

# Permitir bots de redes sociales
User-agent: facebookexternalhit/1.1
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/api/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 horas
  
  return res.status(200).send(robotsTxt);
}