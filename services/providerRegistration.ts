/**
 * Servicio para manejar el registro de nuevos proveedores
 * Incluye subida de imágenes a Supabase Storage y guardado en BD
 */

import { supabase } from './supabaseClient';

// Tipos
export interface ProviderRegistrationData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  
  location: {
    type: 'manual' | 'maps_url';
    address?: string;
    city?: string;
    state?: string;
    mapsUrl?: string;
  };
  
  description: string;
  categories: string[];
  services: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  
  profileImage?: File;
  galleryImages: File[];
  
  instagram?: string;
  instagramUrl?: string;
  facebook?: string;
  facebookUrl?: string;
  website?: string;
}

export interface RegistrationResponse {
  success: boolean;
  registrationId?: string;
  error?: string;
}

/**
 * Subir imagen a Supabase Storage
 */
async function uploadImage(
  file: File,
  folder: 'profiles' | 'gallery',
  businessName: string
): Promise<string | null> {
  try {
    // Generar nombre único
    const timestamp = Date.now();
    const cleanName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${cleanName}_${timestamp}.${extension}`;
    
    // Subir archivo
    const { data, error } = await supabase.storage
      .from('provider-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('provider-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Registrar nuevo proveedor
 */
export async function registerProvider(
  data: ProviderRegistrationData
): Promise<RegistrationResponse> {
  try {
    
    // 1. Subir imagen de perfil (si existe)
    let profileImageUrl: string | null = null;
    if (data.profileImage) {
      profileImageUrl = await uploadImage(
        data.profileImage,
        'profiles',
        data.businessName
      );
    }
    
    // 2. Subir imágenes de galería
    const galleryUrls: string[] = [];
    if (data.galleryImages.length > 0) {
      
      for (const image of data.galleryImages) {
        const url = await uploadImage(image, 'gallery', data.businessName);
        if (url) {
          galleryUrls.push(url);
        }
      }
    }
    
    // 3. Preparar datos para insertar
    const registrationData = {
      business_name: data.businessName,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      
      location_type: data.location.type,
      address: data.location.address || null,
      city: data.location.city || null,
      state: data.location.state || null,
      maps_url: data.location.mapsUrl || null,
      
      description: data.description,
      categories: data.categories,
      services: data.services,
      
      profile_image_url: profileImageUrl,
      gallery_images: galleryUrls,
      
      instagram: data.instagram || null,
      instagram_url: data.instagramUrl || null,
      facebook: data.facebook || null,
      facebook_url: data.facebookUrl || null,
      website: data.website || null,
      
      status: 'pending',
      metadata: {
        registered_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`
      }
    };
    
    try {
      const { data: result, error } = await supabase.rpc('insert_provider_registration_public', {
        p_business_name: data.businessName,
        p_contact_name: data.contactName,
        p_email: data.email,
        p_phone: data.phone,
        p_whatsapp: data.whatsapp,
        p_location_type: data.location.type,
        p_description: data.description,
        p_categories: data.categories,
        p_services: data.services,
        p_address: data.location.address || null,
        p_city: data.location.city || null,
        p_state: data.location.state || null,
        p_maps_url: data.location.mapsUrl || null,
        p_profile_image_url: profileImageUrl,
        p_gallery_images: galleryUrls,
        p_instagram: data.instagram || null,
        p_instagram_url: data.instagramUrl || null,
        p_facebook: data.facebook || null,
        p_facebook_url: data.facebookUrl || null,
        p_website: data.website || null,
        p_metadata: registrationData.metadata
      });
      
      if (error) {
        console.error('❌ Error RPC al guardar registro:', error);
        return {
          success: false,
          error: `Error al guardar: ${error.message}`
        };
      }
      
      // El RPC retorna el UUID directamente
      const registrationId = result;
      
      if (!registrationId) {
        console.error('❌ No se recibió ID de registro');
        return {
          success: false,
          error: 'No se pudo completar el registro'
        };
      }
      
      return {
        success: true,
        registrationId: registrationId
      };
      
    } catch (rpcError: any) {
      console.error('❌ Error RPC:', rpcError);
      
      // Fallback: intentar inserción directa
      
      const { data: fallbackResult, error: fallbackError } = await supabase
        .from('provider_registrations')
        .insert(registrationData)
        .select('id')
        .single();
      
      if (fallbackError) {
        console.error('❌ Error fallback al guardar registro:', fallbackError);
        return {
          success: false,
          error: `Error al guardar: ${fallbackError.message}`
        };
      }
      
      return {
        success: true,
        registrationId: fallbackResult.id
      };
    }
    

    
  } catch (error: any) {
    console.error('❌ Error general en registro:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al registrar'
    };
  }
}

/**
 * Verificar si un email ya está registrado
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Usar la función RPC pública
    const { data, error } = await supabase.rpc('check_email_exists_public', {
      email_to_check: email
    });
    
    if (error) {
      console.error('Error checking email with RPC:', error);
      
      // Fallback: consulta directa
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('provider_registrations')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);
      
      if (fallbackError) {
        console.error('Error in fallback email check:', fallbackError);
        return false;
      }
      
      return fallbackData && fallbackData.length > 0;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in checkEmailExists:', error);
    return false;
  }
}

/**
 * Obtener estado de un registro
 */
export async function getRegistrationStatus(registrationId: string) {
  try {
    const { data, error } = await supabase
      .from('provider_registrations')
      .select('status, admin_notes, reviewed_at, provider_id')
      .eq('id', registrationId)
      .single();
    
    if (error) {
      console.error('Error getting status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getRegistrationStatus:', error);
    return null;
  }
}
