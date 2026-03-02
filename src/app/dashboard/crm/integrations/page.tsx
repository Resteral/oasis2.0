'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Integration = {
    id?: string;
    platform: 'instagram' | 'facebook' | 'whatsapp' | 'sms' | 'twilio';
    name: string;
    connected: boolean;
    icon: string;
};

const PLATFORMS: Record<string, { name: string, icon: string }> = {
    instagram: { name: 'Instagram', icon: '📸' },
    facebook: { name: 'Facebook', icon: '📘' },
    whatsapp: { name: 'WhatsApp', icon: '💬' },
    twilio: { name: 'SMS (Twilio)', icon: '📱' },
    sms: { name: 'SMS (Twilio)', icon: '📱' }
};

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    async function fetchIntegrations() {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (business) {
            setBusinessId(business.id);
            const { data: activeIntegrations } = await supabase
                .from('integrations')
                .select('*')
                .eq('business_id', business.id);

            const merged: Integration[] = Object.keys(PLATFORMS).map(platform => {
                const active = activeIntegrations?.find(ai => ai.platform === platform);
                return {
                    id: active?.id,
                    platform: platform as any,
                    name: PLATFORMS[platform].name,
                    icon: PLATFORMS[platform].icon,
                    connected: !!active?.is_active
                };
            });

            // Handle duplicates if any (e.g. sms vs twilio labels)
            const unique = merged.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
            setIntegrations(unique);
        }
        setIsLoading(false);
    }

    const toggleConnection = async (integration: Integration) => {
        if (!businessId) return;

        if (integration.connected) {
            // Disconnect
            const { error } = await supabase
                .from('integrations')
                .update({ is_active: false })
                .eq('platform', integration.platform)
                .eq('business_id', businessId);

            if (!error) fetchIntegrations();
        } else {
            // Connect (Mock connection for now)
            const { error } = await supabase
                .from('integrations')
                .upsert({
                    business_id: businessId,
                    platform: integration.platform,
                    is_active: true,
                    credentials: { mock: true },
                    updated_at: new Date().toISOString()
                });

            if (!error) fetchIntegrations();
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading channels...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
            <p className="text-gray-500 mb-8">Connect your favorite platforms to receive orders and appointments directly.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                    <div key={integration.platform} className="bg-white border border-gray-200 rounded-xl p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                {integration.icon}
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {integration.connected ? 'Connected and active' : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleConnection(integration)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${integration.connected
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                }`}
                        >
                            {integration.connected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
