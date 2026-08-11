export interface ServiceMedia {
  url: string;
  type: 'image' | 'video' | 'pdf' | 'document';
  metadata?: Record<string, any>;
}

export interface ServiceAvailability {
  appointment_only?: boolean;
  schedule?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  custom_preferences?: string;
}

export interface ServiceEntity {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  pricing_type: 'fixed' | 'hourly' | 'custom';
  base_price: number;
  delivery_time: string | null;
  media: ServiceMedia[];
  tags: string[];
  is_active: boolean;
  is_archived: boolean;
  availability?: ServiceAvailability;
  views_count: number;
  saves_count: number;
  orders_count: number;
  created_at: string;
  updated_at: string;
}
