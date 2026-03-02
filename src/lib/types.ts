export interface Theme {
    primaryColor: string;
    backgroundColor: string;
}

export interface DeliverySettings {
    radius: number;
    selfDelivery: boolean;
    providers: string[]; // 'doordash', 'ubereats', 'self'
    instagram_id?: string; // For webhook matching
}

export interface Integrations {
    twilio?: {
        phone?: string;
        connected: boolean;
    };
    instagram?: {
        handle?: string;
        connected: boolean;
    };
    facebook?: {
        id?: string;
        access_token?: string;
        connected: boolean;
    };
}

export interface Business {
    id: string;
    owner_id: string;
    slug: string;
    name: string;
    description?: string;
    category?: string;
    location?: string;
    image_url?: string;
    integrations?: Integrations;
    theme?: Theme;
    delivery_settings?: DeliverySettings;
    created_at: string;
    updated_at?: string;
}

export type PostType = 'post' | 'event';

export interface Post {
    id: string;
    business_id: string;
    type: PostType;
    title?: string;
    content?: string;
    image_url?: string;
    event_date?: string;
    views: number;
    created_at: string;
}

export interface GooglePlace {
    place_id: string;
    name: string;
    price?: string;
    formatted_address?: string;
    rating?: number;
    image?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    distance?: string;
    open_state?: string;
    phone?: string;
}

export interface Appointment {
    id: string;
    business_id: string;
    customer_id?: string;
    service_name: string;
    start_time: string;
    end_time: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_notes?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    custom_fields: any;
    created_at: string;
    updated_at?: string;
}

export interface Product {
    id: string;
    business_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    stock: number;
    created_at: string;
    embedding?: number[];
}

export interface Order {
    id: string;
    business_id: string;
    customer_name: string;
    customer_contact?: string;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    channel: 'web' | 'sms' | 'instagram' | 'facebook' | 'whatsapp';
    items?: any;
    address?: string;
    delivery_type: 'pickup' | 'delivery' | 'shipping';
    created_at: string;
}
