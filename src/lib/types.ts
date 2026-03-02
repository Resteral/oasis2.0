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
