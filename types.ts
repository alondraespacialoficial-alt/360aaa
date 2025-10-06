
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
