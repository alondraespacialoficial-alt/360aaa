// Consulta completa de proveedor, servicios, reseñas y media
export async function getProviderFullDetail(provider_id: string) {
  // Consulta proveedor
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('id', provider_id)
    .single();

  // Consulta servicios
  const { data: services, error: servicesError } = await supabase
    .from('provider_services')
    .select('*')
    .eq('provider_id', provider_id);

  // Consulta reseñas
  const { data: reviews, error: reviewsError } = await supabase
    .from('provider_reviews')
    .select('*')
    .eq('provider_id', provider_id)
    .order('created_at', { ascending: false });

  // Consulta media
  const { data: media, error: mediaError } = await supabase
    .from('provider_media')
    .select('*')
    .eq('provider_id', provider_id)
    .order('sort_order', { ascending: true });

  // Consulta categorías del proveedor
  const { data: providerCategories, error: providerCategoriesError } = await supabase
    .from('provider_categories')
    .select('category_id')
    .eq('provider_id', provider_id);

  // Consulta perfiles de usuarios que dejaron reseña
  let profiles = [];
  if (reviews && reviews.length > 0) {
    const userIds = reviews.map(r => r.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .in('id', userIds);
      profiles = profilesData || [];
    }
  }

  return {
    provider,
    services,
    reviews,
    media,
    providerCategories,
    profiles,
    errors: { providerError, servicesError, reviewsError, mediaError, providerCategoriesError }
  };
}
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);