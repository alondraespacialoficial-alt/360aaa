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
    console.log('📝 Iniciando registro de proveedor:', data.businessName);
    
    // 1. Subir imagen de perfil (si existe)
    let profileImageUrl: string | null = null;
    if (data.profileImage) {
      console.log('📸 Subiendo imagen de perfil...');
      profileImageUrl = await uploadImage(
        data.profileImage,
        'profiles',
        data.businessName
      );
      
      if (!profileImageUrl) {
        console.warn('⚠️ No se pudo subir la imagen de perfil, continuando sin ella');
      }
    }
    
    // 2. Subir imágenes de galería
    const galleryUrls: string[] = [];
    if (data.galleryImages.length > 0) {
      console.log(`📸 Subiendo ${data.galleryImages.length} imágenes de galería...`);
      
      for (const image of data.galleryImages) {
        const url = await uploadImage(image, 'gallery', data.businessName);
        if (url) {
          galleryUrls.push(url);
        }
      }
      
      console.log(`✅ ${galleryUrls.length}/${data.galleryImages.length} imágenes subidas`);
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
    
    // 4. Insertar en base de datos
    console.log('💾 Guardando en base de datos...');
    const { data: result, error } = await supabase
      .from('provider_registrations')
      .insert(registrationData)
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Error al guardar registro:', error);
      return {
        success: false,
        error: `Error al guardar: ${error.message}`
      };
    }
    
    console.log('✅ Registro completado exitosamente! ID:', result.id);
    
    return {
      success: true,
      registrationId: result.id
    };
    
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
    const { data, error } = await supabase
      .from('provider_registrations')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (error) {
      console.error('Error checking email:', error);
      return false;
    }
    
    return data && data.length > 0;
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
