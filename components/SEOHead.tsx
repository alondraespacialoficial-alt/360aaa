import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'business.business';
  siteName?: string;
  author?: string;
  structuredData?: object;
  providerData?: {
    name: string;
    description: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    services?: Array<{ name: string; price: number; description: string; }>;
  };
  categoryData?: {
    name: string;
    description: string;
    providerCount?: number;
  };
}

const SEOHead: React.FC<SEOProps> = ({
  title = "Charlitron Eventos 360 - Directorio de Proveedores para Eventos en México",
  description = "Encuentra los mejores proveedores para tu evento en México. DJ, fotografía, catering, decoración y más. Compara precios y servicios en San Luis Potosí y toda la República Mexicana.",
  keywords = "eventos México, proveedores eventos, DJ San Luis Potosí, fotografía, catering, decoración, bodas, quinceaños, XV años, México",
  image = "/charlitron-logo.png",
  url,
  type = "website",
  siteName = "Charlitron Eventos 360",
  author = "Charlitron Eventos 360",
  structuredData,
  providerData,
  categoryData
}) => {
  
  useEffect(() => {
    // Configurar título dinámico
    document.title = title;
    
    // Función para actualizar o crear meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Meta tags básicos
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:locale', 'es_MX', true);
    
    if (image) {
      updateMetaTag('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', title, true);
    }
    
    if (url) {
      updateMetaTag('og:url', url, true);
    } else {
      updateMetaTag('og:url', window.location.href, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (image) {
      updateMetaTag('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url || window.location.href;

    // JSON-LD Structured Data
    let structuredDataScript = document.querySelector('#structured-data');
    if (structuredDataScript) {
      structuredDataScript.remove();
    }

    let jsonLd: any = {};

    // Datos estructurados para proveedores
    if (providerData) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": providerData.name,
        "description": providerData.description,
        "url": window.location.href,
        "telephone": providerData.phone || undefined,
        "address": providerData.address ? {
          "@type": "PostalAddress",
          "streetAddress": providerData.address,
          "addressLocality": providerData.city,
          "addressRegion": providerData.state,
          "addressCountry": "México"
        } : undefined,
        "aggregateRating": providerData.rating ? {
          "@type": "AggregateRating",
          "ratingValue": providerData.rating,
          "reviewCount": providerData.reviewCount || 1,
          "bestRating": 5,
          "worstRating": 1
        } : undefined,
        "hasOfferCatalog": providerData.services ? {
          "@type": "OfferCatalog",
          "name": "Servicios disponibles",
          "itemListElement": providerData.services.map((service, index) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": service.name,
              "description": service.description
            },
            "price": service.price,
            "priceCurrency": "MXN",
            "position": index + 1
          }))
        } : undefined
      };
    }
    // Datos estructurados para categorías
    else if (categoryData) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": categoryData.name,
        "description": categoryData.description,
        "url": window.location.href,
        "mainEntity": {
          "@type": "ItemList",
          "name": `Proveedores de ${categoryData.name}`,
          "description": `Lista de proveedores especializados en ${categoryData.name.toLowerCase()}`,
          "numberOfItems": categoryData.providerCount || 0
        }
      };
    }
    // Datos estructurados por defecto para el sitio
    else {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "description": description,
        "url": window.location.origin,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${window.location.origin}/categoria/{search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@type": "Organization",
          "name": siteName,
          "url": window.location.origin
        }
      };
    }

    // Agregar datos estructurados personalizados si se proporcionan
    if (structuredData) {
      jsonLd = { ...jsonLd, ...structuredData };
    }

    if (Object.keys(jsonLd).length > 0) {
      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

  }, [title, description, keywords, image, url, type, siteName, author, structuredData, providerData, categoryData]);

  return null; // Este componente no renderiza nada visible
};

export default SEOHead;