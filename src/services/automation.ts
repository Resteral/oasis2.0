// This service mocks the "Hook up" points for external automation systems.
// In a production environment, you would uncomment the API calls and add your keys.

export type Order = {
    id: string;
    customerName: string;
    items: any[];
    total: number;
    type: 'pickup' | 'delivery' | 'shipping';
    address?: string;
    phone?: string;
};

export type Message = {
    id: string;
    platform: 'sms' | 'whatsapp' | 'instagram';
    sender: string;
    content: string;
    timestamp: Date;
    read: boolean;
};

// Mock "Database" for demo purposes
let INBOX: Message[] = [
    { id: '1', platform: 'sms', sender: '+15550101', content: 'Do you have the vegan options in stock?', timestamp: new Date(Date.now() - 1000 * 60 * 5), read: false },
    { id: '2', platform: 'instagram', sender: '@coffee_lover', content: 'Loved the new blend! Can I order 5 bags?', timestamp: new Date(Date.now() - 1000 * 60 * 60), read: true },
    { id: '3', platform: 'whatsapp', sender: '+15550199', content: 'Is my order #2031 ready for pickup?', timestamp: new Date(Date.now() - 1000 * 60 * 120), read: false },
];

export const AutomationService = {
    // 1. Hook for dispatching orders to external systems
    processOrder: async (order: Order) => {
        console.log(`[Automation] Processing Order #${order.id}...`);

        // Twilio Hook
        await AutomationService.sendSMS(
            order.phone || '+15550000000',
            `Thanks ${order.customerName}, we received your ${order.type} order!`
        );

        // Email Hook (SendGrid/Resend)
        await AutomationService.sendEmail(
            'business@oasis-united.com',
            `New Order: $${order.total.toFixed(2)}`,
            JSON.stringify(order, null, 2)
        );

        return true;
    },

    // 1b. Hook for appointment notifications
    notifyAppointmentStatus: async (appointment: any, status: string) => {
        console.log(`[Automation] Notifying appointment ${appointment.id} status change to ${status}...`);

        const message = status === 'confirmed'
            ? `Your appointment for ${appointment.service_name} at ${new Date(appointment.start_time).toLocaleString()} has been CONFIRMED. See you then!`
            : `Your appointment for ${appointment.service_name} has been CANCELLED. Please contact us if you have questions.`;

        // SMS Notification
        if (appointment.customer_phone) {
            await AutomationService.sendSMS(appointment.customer_phone, message);
        }

        // Email Notification
        if (appointment.customer_email) {
            await AutomationService.sendEmail(appointment.customer_email, `Appointment ${status.toUpperCase()}`, message);
        }

        return true;
    },

    // 1c. Hook for order status notifications
    notifyOrderUpdate: async (order: any, status: string) => {
        console.log(`[Automation] Notifying order ${order.id} status change to ${status}...`);

        const messages: Record<string, string> = {
            'processing': `Preparing order #${order.id.slice(0, 5)}.`,
            'shipped': `Order #${order.id.slice(0, 5)} on the way! 🚚`,
            'completed': `Order #${order.id.slice(0, 5)} delivered. ✨`,
            'cancelled': `Order #${order.id.slice(0, 5)} cancelled.`
        };

        const body = messages[status] || `Order #${order.id.slice(0, 5)} status: ${status}.`;

        if (order.customer_contact?.includes('+')) {
            await AutomationService.sendSMS(order.customer_contact, body);
        }

        if (order.customer_contact?.includes('@')) {
            await AutomationService.sendEmail(order.customer_contact, `Order #${order.id.slice(0, 5)} Update`, body);
        }

        return true;
    },

    // 2. Mock Twilio/WhatsApp Webhook (Incoming)
    getMessages: async (): Promise<Message[]> => {
        // Simulate fetching latest messages from Twilio/Meta API
        return [...INBOX];
    },

    simulateIncomingMessage: (platform: Message['platform'], content: string) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            platform,
            sender: platform === 'instagram' ? '@new_customer' : '+15559999',
            content,
            timestamp: new Date(),
            read: false
        };
        INBOX = [newMessage, ...INBOX];
        return newMessage;
    },

    // --- External API Stubs ---

    sendSMS: async (to: string, body: string) => {
        // const client = require('twilio')(accountSid, authToken);
        // await client.messages.create({ body, from: '+1234567890', to });
        console.log(`[Twilio Mock] Sending SMS to ${to}: "${body}"`);
    },

    sendEmail: async (to: string, subject: string, body: string) => {
        // await resend.emails.send({ from: 'orders@oasis.com', to, subject, html: body });
        console.log(`[Email Mock] Sending to ${to}: Subject: "${subject}"`);
    }
};
