import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });

    // 1. Fetch Loyalty Account
    const { data: account, error: accError } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

    // 2. Fetch Active Redemptions (Reward Codes)
    const { data: redemptions, error: redError } = await supabase
        .from('redemptions')
        .select('*, rewards(title, business_id, businesses(name))')
        .eq('user_id', userId)
        .eq('status', 'active');

    // 3. Fetch Available Rewards (Global)
    const { data: availableRewards } = await supabase
        .from('rewards')
        .select('*, businesses(name)')
        .eq('is_active', true)
        .order('point_cost', { ascending: true });

    return NextResponse.json({
        success: true,
        account: account || { points: 0, tier: 'Silver' },
        redemptions: redemptions || [],
        availableRewards: availableRewards || []
    });
}

export async function POST(req: Request) {
    const { userId, rewardId } = await req.json();

    // 1. Get Reward & User Data
    const { data: reward } = await supabase.from('rewards').select('*').eq('id', rewardId).single();
    const { data: account } = await supabase.from('loyalty_accounts').select('*').eq('user_id', userId).single();

    if (!reward || !account) return NextResponse.json({ success: false, error: 'Data not found' });
    if (account.points < reward.point_cost) return NextResponse.json({ success: false, error: 'Insufficient points' });

    // 2. Atomic Transaction (Simulated via sequential calls - in production use rpc/transaction)
    // A. Deduct Points
    const { error: deductError } = await supabase
        .from('loyalty_accounts')
        .update({ points: account.points - reward.point_cost })
        .eq('user_id', userId);

    if (deductError) return NextResponse.json({ success: false, error: 'Redemption failed' });

    // B. Create Redemption
    const { data: redemption, error: redError } = await supabase
        .from('redemptions')
        .insert({ user_id: userId, reward_id: rewardId })
        .select()
        .single();

    return NextResponse.json({ success: !redError, redemption });
}
