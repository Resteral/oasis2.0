export interface GooglePlace {
    place_id: string;
    name: string;
    price?: string;
    formatted_address: string;
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
