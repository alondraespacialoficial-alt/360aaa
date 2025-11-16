import { useEffect } from 'react';
import { logProviderEvent } from '../services/supabaseClient';

// Hook personalizado para tracking de eventos de proveedores
export function useProviderTracking(providerId: string | null) {
  
  // Función para registrar eventos manualmente
  const trackEvent = async (
    eventType: 'profile_view' | 'whatsapp_click' | 'phone_click' | 'website_click' | 
              'instagram_click' | 'facebook_click' | 'service_view' | 'gallery_view' | 'category_click',
    metadata: Record<string, any> = {}
  ) => {
    if (!providerId) {
      console.warn('No se puede trackear evento: providerId es null');
      return { success: false };
    }
    
    return await logProviderEvent(providerId, eventType, metadata);
  };

  // Auto-trackear vista del perfil cuando se monta el componente
  useEffect(() => {
    if (providerId) {
      console.log(`🔍 AUTO-TRACKING: Registrando vista para proveedor ID: ${providerId}`);
      
      trackEvent('profile_view', {
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        auto_tracked: true
      }).then(result => {
        console.log('📊 RESULTADO del tracking:', result);
        if (result && result.success) {
          console.log('✅ Vista del perfil registrada automáticamente');
        } else {
          console.warn('⚠️ Error registrando vista del perfil:', result);
        }
      }).catch(error => {
        console.error('🚨 Error en tracking:', error);
      });
    } else {
      console.warn('⚠️ No hay providerId para trackear');
    }
  }, [providerId]);

  // Funciones helper para eventos comunes
  const trackWhatsAppClick = (phoneNumber?: string) => {
    console.log('📱 TRACKING: WhatsApp click', phoneNumber);
    return trackEvent('whatsapp_click', { 
      phone_number: phoneNumber,
      timestamp: new Date().toISOString()
    });
  };

  const trackPhoneClick = (phoneNumber?: string) => {
    console.log('📞 TRACKING: Phone click', phoneNumber);
    return trackEvent('phone_click', { 
      phone_number: phoneNumber,
      timestamp: new Date().toISOString()
    });
  };

  const trackWebsiteClick = (websiteUrl?: string) => {
    console.log('🌐 TRACKING: Website click', websiteUrl);
    return trackEvent('website_click', { 
      website_url: websiteUrl,
      timestamp: new Date().toISOString()
    });
  };

  const trackInstagramClick = (instagramHandle?: string) => {
    console.log('📸 TRACKING: Instagram click', instagramHandle);
    return trackEvent('instagram_click', { 
      instagram_handle: instagramHandle,
      timestamp: new Date().toISOString()
    });
  };

  const trackFacebookClick = (facebookUrl?: string) => {
    console.log('📘 TRACKING: Facebook click', facebookUrl);
    return trackEvent('facebook_click', { 
      facebook_url: facebookUrl,
      timestamp: new Date().toISOString()
    });
  };

  const trackServiceView = (serviceName?: string, serviceId?: string) => {
    console.log('🛍️ TRACKING: Service view', serviceName, serviceId);
    return trackEvent('service_view', { 
      service_name: serviceName,
      service_id: serviceId,
      timestamp: new Date().toISOString()
    });
  };

  const trackGalleryView = (imageCount: number) => {
    console.log('🖼️ TRACKING: Galería vista', imageCount);
    return trackEvent('gallery_view', { 
      image_count: imageCount,
      timestamp: new Date().toISOString()
    });
  };

  const trackCategoryClick = (categoryName: string, categorySlug: string) => {
    console.log('🏷️ TRACKING: Categoría click', categoryName);
    return trackEvent('category_click', { 
      category_name: categoryName,
      category_slug: categorySlug,
      timestamp: new Date().toISOString()
    });
  };

  return {
    trackEvent,
    trackWhatsAppClick,
    trackPhoneClick,
    trackWebsiteClick,
    trackInstagramClick,
    trackFacebookClick,
    trackServiceView,
    trackGalleryView,
    trackCategoryClick
  };
}