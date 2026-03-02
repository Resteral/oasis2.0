"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StaffMember {
    id: string;
    role: string;
    created_at: string;
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('staff');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchStaff = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single();
        if (!business) return;

        const { data, error } = await supabase
            .from('business_staff')
            .select(`
                id,
                role,
                created_at,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .eq('business_id', business.id);

        if (!error && data) {
            setStaff(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: 'Sending invitation...', type: 'info' });

        const { data: { user } } = await supabase.auth.getUser();
        const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user?.id).single();

        if (!business) return;

        // 1. Find user by email (Simulated for this MVP)
        // In a real app, this would use a dedicated invitation table and email service
        const { data: targetProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('full_name', inviteEmail) // Mocking search by name for now since we don't store email in profiles for privacy/demo
            .single();

        if (profileError || !targetProfile) {
            setMessage({ text: 'User not found. Ensure they have an Oasis account.', type: 'error' });
            return;
        }

        // 2. Add to business_staff
        const { error } = await supabase
            .from('business_staff')
            .insert({
                business_id: business.id,
                user_id: targetProfile.id,
                role: inviteRole
            });

        if (error) {
            setMessage({ text: 'User is already a staff member or an error occurred.', type: 'error' });
        } else {
            setMessage({ text: `Successfully added ${targetProfile.full_name} as ${inviteRole}!`, type: 'success' });
            setInviteEmail('');
            fetchStaff();
        }
    };

    if (loading) return <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">Loading Team...</div>;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Staff Accounts</h1>
                <p className="mt-2 text-lg text-gray-500">Manage your team and their access levels to the dashboard.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Invite Form */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">Invite Member</h3>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">User Name (Oasis Profile)</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Enter full name..."
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Role</label>
                            <select
                                className="input w-full"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                            >
                                <option value="staff">Staff (Manage Orders)</option>
                                <option value="admin">Admin (Full Access)</option>
                                <option value="viewer">Viewer (Read Only)</option>
                            </select>
                        </div>
                        <button className="btn btn-primary w-full py-4 tracking-widest uppercase text-xs font-black">
                            Add to Team
                        </button>
                    </form>
                    {message.text && (
                        <div className={`mt-4 p-4 rounded-xl text-[10px] font-black uppercase tracking-tighter ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Team List */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Member</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Role</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Joined</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staff.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {member.profiles.full_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{member.profiles.full_name}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Verified Oasis User</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${member.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                member.role === 'staff' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                                    'bg-gray-50 text-gray-500 border-gray-100'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="text-[10px] font-black text-rose-600 opacity-0 group-hover:opacity-100 hover:text-rose-800 tracking-widest uppercase transition-all">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                                        <p className="font-medium">No staff members yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
