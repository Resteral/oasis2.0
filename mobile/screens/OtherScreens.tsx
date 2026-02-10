import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, Image, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// --- FEED SCREEN ---

export function FeedScreen() {
    const [posts, setPosts] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = async () => {
        setRefreshing(true);
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(full_name, avatar_url, role)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) Alert.alert('Error fetching feed', error.message);
        else setPosts(data || []);

        setRefreshing(false);
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.profiles?.full_name?.[0]}</Text>
                </View>
                <View>
                    <Text style={styles.name}>
                        {item.profiles?.full_name}
                        {item.profiles?.role === 'provider' && <Text style={styles.proBadge}> (Pro)</Text>}
                    </Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            <Text style={styles.content}>{item.content}</Text>

            <View style={styles.footer}>
                <Text style={styles.stat}>{item.likes_count} ❤️</Text>
                <Text style={styles.stat}>{item.comments_count} 💬</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>Oasis Feed</Text>
            </View>
            <FlatList
                data={posts}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                onRefresh={fetchPosts}
                refreshing={refreshing}
                contentContainerStyle={styles.list}
            />
        </View>
    )
}

// --- PROFILE SCREEN ---

export function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(data);
            setLoading(false);
        }
        getProfile();
    }, []);

    return (
        <View style={styles.container}>
            <View style={[styles.card, { marginTop: 50, alignItems: 'center' }]}>
                <View style={[styles.avatarPlaceholder, { width: 80, height: 80, borderRadius: 40, marginBottom: 15 }]}>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
                        {profile?.full_name?.[0] || '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{profile?.full_name || 'Loading...'}</Text>
                <Text style={styles.date}>{profile?.role?.toUpperCase()}</Text>

                <View style={{ marginTop: 20, width: '100%' }}>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Points</Text>
                        <Text style={styles.statValue}>{profile?.points || 0} 🪙</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Level</Text>
                        <Text style={styles.statValue}>{profile?.level || 1} ⬆️</Text>
                    </View>
                </View>

                <View style={{ marginTop: 40, width: '100%' }}>
                    <Button title="Sign Out" onPress={() => supabase.auth.signOut()} color="#ff4444" />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    topBar: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    topBarTitle: { fontSize: 24, fontWeight: 'bold' },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    avatarText: { color: '#fff', fontWeight: 'bold' },
    name: { fontWeight: 'bold', fontSize: 16 },
    proBadge: { color: 'purple', fontWeight: 'bold' },
    date: { color: '#888', fontSize: 12 },
    content: { fontSize: 14, lineHeight: 20, marginBottom: 10, color: '#333' },
    footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, gap: 20 },
    stat: { color: '#555', fontWeight: 'bold' },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    statLabel: { color: '#666' },
    statValue: { fontWeight: 'bold' }
});
