export interface Order {
    id: string;
    store_name: string;
    store_address: string;
    delivery_address: string;
    distance: string; // Formatting
    payout: string;
    status: 'pending' | 'accepted' | 'delivered';
}

export function generateMockOrders(): Order[] {
    return [
        {
            id: 'ord_123',
            store_name: 'Starbucks',
            store_address: '123 Main St',
            delivery_address: '456 Oak Ave (Apt 4B)',
            distance: '0.8 mi',
            payout: '$5.50',
            status: 'pending'
        },
        {
            id: 'ord_456',
            store_name: 'Best Buy',
            store_address: '789 Commerce Blvd',
            delivery_address: '321 Pine Ln',
            distance: '2.1 mi',
            payout: '$12.00',
            status: 'pending'
        },
        {
            id: 'ord_789',
            store_name: 'CVS Pharmacy',
            store_address: '101 Market St',
            delivery_address: '555 Elm St',
            distance: '0.3 mi',
            payout: '$4.75',
            status: 'pending'
        }
    ];
}
