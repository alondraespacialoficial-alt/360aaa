import { supabase } from '../services/supabaseClient';

interface StructuredDataConfig {
  type: 'WebSite' | 'LocalBusiness' | 'Service' | 'Review' | 'Organization';
  data: any;
}

export class StructuredDataManager {
  private static baseUrl = 'https://charlitron360.vercel.app'; // Cambia por tu dominio real

  // Schema.org para el sitio web principal
  static getWebSiteSchema(): object {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Charlitron Eventos 360",
      "alternateName": "Charlitron360",
      "description": "Directorio de proveedores verificados para eventos en México. Encuentra DJ, fotografía, catering, decoración y más para tu evento perfecto en San Luis Potosí y toda la República Mexicana.",
      "url": this.baseUrl,
      "inLanguage": "es-MX",
      "publisher": {
        "@type": "Organization",
        "name": "Charlitron Eventos 360",
        "url": this.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.baseUrl}/logo-charlitron.png`,
          "width": "200",
          "height": "200"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "ventas@charlitron.com",
          "contactType": "customer service",
          "availableLanguage": "Spanish"
        }
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.baseUrl}/categoria/{search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "audience": {
        "@type": "Audience",
        "audienceType": "People planning events",
        "geographicArea": [
          {
            "@type": "State",
            "name": "San Luis Potosí"
          },
          {
            "@type": "Country", 
            "name": "México"
          }
        ]
      }
    };
  }

  // Schema.org para proveedores (LocalBusiness)
  static getProviderSchema(provider: any): object {
    const baseSchema: any = {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "Service"],
      "name": provider.name,
      "description": provider.description,
      "url": `${this.baseUrl}/proveedor/${provider.id}`,
      "identifier": provider.id,
      "image": provider.profile_image_url || provider.cover_image,
      "priceRange": "$$",
      "areaServed": [
        {
          "@type": "State",
          "name": "San Luis Potosí"
        },
        {
          "@type": "Country",
          "name": "México"
        }
      ]
    };

    // Agregar dirección si existe
    if (provider.address || provider.city || provider.state) {
      baseSchema.address = {
        "@type": "PostalAddress",
        "streetAddress": provider.address,
        "addressLocality": provider.city,
        "addressRegion": provider.state,
        "addressCountry": "México"
      };
    }

    // Agregar contacto
    const contactPoints = [];
    if (provider.phone) {
      contactPoints.push({
        "@type": "ContactPoint",
        "telephone": provider.phone,
        "contactType": "customer service"
      });
    }
    if (provider.whatsapp) {
      contactPoints.push({
        "@type": "ContactPoint",
        "url": `https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`,
        "contactType": "customer service",
        "availableLanguage": "Spanish"
      });
    }
    if (provider.email) {
      contactPoints.push({
        "@type": "ContactPoint",
        "email": provider.email,
        "contactType": "customer service"
      });
    }
    if (contactPoints.length > 0) {
      baseSchema.contactPoint = contactPoints;
    }

    // Agregar redes sociales
    const sameAs = [];
    if (provider.website) sameAs.push(provider.website);
    if (provider.instagram_url) sameAs.push(provider.instagram_url);
    if (provider.facebook_url) sameAs.push(provider.facebook_url);
    if (sameAs.length > 0) {
      baseSchema.sameAs = sameAs;
    }

    // Agregar calificaciones si existen
    if (provider.rating_average && provider.rating_average > 0) {
      baseSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": provider.rating_average,
        "bestRating": 5,
        "worstRating": 1,
        "reviewCount": provider.review_count || 1
      };
    }

    // Agregar servicios ofrecidos
    if (provider.services && provider.services.length > 0) {
      baseSchema.hasOfferCatalog = {
        "@type": "OfferCatalog",
        "name": "Servicios disponibles",
        "itemListElement": provider.services.map((service: any, index: number) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": service.name,
            "description": service.description || `Servicio de ${service.name}`
          },
          "price": service.price || 0,
          "priceCurrency": "MXN",
          "position": index + 1
        }))
      };
    }

    return baseSchema;
  }

  // Schema.org para categorías (CollectionPage)
  static getCategorySchema(category: any, providers: any[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category.name,
      "description": category.description || `Proveedores especializados en ${category.name.toLowerCase()} para eventos en México`,
      "url": `${this.baseUrl}/categoria/${category.slug}`,
      "inLanguage": "es-MX",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Charlitron Eventos 360",
        "url": this.baseUrl
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": `Proveedores de ${category.name}`,
        "description": `Lista completa de proveedores especializados en ${category.name.toLowerCase()}`,
        "numberOfItems": providers.length,
        "itemListElement": providers.slice(0, 10).map((provider, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "LocalBusiness",
            "name": provider.name,
            "description": provider.description,
            "url": `${this.baseUrl}/proveedor/${provider.id}`,
            "image": provider.profile_image_url
          }
        }))
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": this.baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": category.name,
            "item": `${this.baseUrl}/categoria/${category.slug}`
          }
        ]
      }
    };
  }

  // Schema.org para reseñas
  static getReviewSchema(review: any, provider: any): object {
    return {
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": provider.name,
        "url": `${this.baseUrl}/proveedor/${provider.id}`
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "reviewBody": review.comment,
      "datePublished": review.created_at,
      "inLanguage": "es-MX"
    };
  }

  // Obtener schema completo para una página específica
  static async getPageSchema(pageType: string, pageData?: any): Promise<object[]> {
    const schemas: object[] = [];

    try {
      switch (pageType) {
        case 'home':
          schemas.push(this.getWebSiteSchema());
          break;

        case 'provider':
          if (pageData) {
            schemas.push(this.getProviderSchema(pageData));
          }
          break;

        case 'category':
          if (pageData && pageData.category && pageData.providers) {
            schemas.push(this.getCategorySchema(pageData.category, pageData.providers));
          }
          break;

        default:
          schemas.push(this.getWebSiteSchema());
      }
    } catch (error) {
      console.error('Error generating schema:', error);
      // Fallback al schema básico del sitio
      schemas.push(this.getWebSiteSchema());
    }

    return schemas;
  }
}