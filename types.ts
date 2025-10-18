
export interface ContactDetails {
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  maps_url?: string;
  facebook?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  emoji?: string;
}

export interface Supplier {
  id: string;
  created_at: string;
  name: string;
  category_id: string;
  description: string;
  logo_url: string | null;
  gallery: string[];
  contact: ContactDetails;
  is_featured: boolean;
  is_active: boolean;
  categories?: Category; // For joins
}

export interface Service {
  id: string;
  created_at: string;
  supplier_id: string;
  name: string;
  description: string;
  cost: number;
  is_active: boolean;
}

// Nuevo interface para reseñas autenticadas
export interface ProviderReview {
  id: number;
  provider_id: string;
  user_id?: string;
  rating: number;
  comment: string;
  user_name?: string;
  user_avatar_url?: string;
  is_verified: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

// Interface para usuario autenticado
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}
