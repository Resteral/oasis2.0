'use client';

import { supabase } from '@/lib/supabase';

// Phase 23: Live Analytics Engine
export const trackEvent = async (
    businessId: string,
    type: 'view' | 'click' | 'search' | 'conversion' | 'purchase',
    metadata: any = {}
) => {
    try {
        const { error } = await supabase.from('analytics_events').insert({
            business_id: businessId,
            event_type: type,
            metadata: metadata,
            page_url: typeof window !== 'undefined' ? window.location.href : null,
            session_id: getSessionId()
        });

        if (error) console.error('Analytics Error:', error.message);
    } catch (err) {
        console.error('Analytics System Failure:', err);
    }
};

// Simple anonymous session tracking
function getSessionId() {
    if (typeof window === 'undefined') return null;
    let sid = sessionStorage.getItem('oasis_session_id');
    if (!sid) {
        sid = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('oasis_session_id', sid);
    }
    return sid;
}
