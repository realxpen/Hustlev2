export interface MarketplaceMedia {
  url: string;
  type: 'image' | 'video' | 'pdf' | 'document';
  metadata?: Record<string, any>;
}

export interface Service {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  pricing_type: 'fixed' | 'hourly' | 'custom';
  base_price: number;
  delivery_time: string | null;
  media: MarketplaceMedia[];
  tags: string[];
  is_active: boolean;
  views_count: number;
  saves_count: number;
  orders_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  product_type: 'physical' | 'digital';
  price: number;
  inventory_count: number;
  media: MarketplaceMedia[];
  tags: string[];
  is_active: boolean;
  views_count: number;
  saves_count: number;
  orders_count: number;
  created_at: string;
}

export interface Training {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  training_type: 'live' | 'recorded' | 'mentorship';
  media: MarketplaceMedia[];
  tags: string[];
  is_active: boolean;
  views_count: number;
  saves_count: number;
  orders_count: number;
  created_at: string;
}

export type ListingType = 'service' | 'product' | 'training';
