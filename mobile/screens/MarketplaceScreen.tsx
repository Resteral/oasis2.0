import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';

export default function MarketplaceScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<'pros' | 'products'>('pros');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        })();
    }, []);

    useEffect(() => {
        // Debounce search or fetch on tab change
        const timeout = setTimeout(() => fetchItems(), 500);
        return () => clearTimeout(timeout);
    }, [activeTab, searchQuery]);

    const fetchItems = async () => {
        setLoading(true);
        if (activeTab === 'pros') {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'provider');
            setItems(data || []);
        } else {
            // Products Search Strategy
            // 1. If no query, show local trending (or empty)
            // 2. If query, call Edge Function 'search-nearby'

            if (!searchQuery) {
                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                setItems(data || []);
            } else {
                try {
                    const { data, error } = await supabase.functions.invoke('search-nearby', {
                        body: {
                            query: searchQuery,
                            lat: location?.coords.latitude,
                            lng: location?.coords.longitude
                        }
                    });

                    if (error) throw error;

                    // Add distance calculation fallback if missing from API
                    const results = (data.results || []).map((item: any) => {
                        let dist = item.distance;
                        if (!dist && location && item.location) {
                            // Simple Haversine approx if needed, but usually Edge Function returns it now
                            // Leaving as fallback blank for now to keep it simple
                        }
                        return { ...item, isGoogle: true };
                    });

                    setItems(results);
                } catch (e) {
                    console.error("Search failed", e);
                    // Fallback to local
                    const { data } = await supabase
                        .from('products')
                        .select('*')
                        .ilike('name', `%${searchQuery}%`);
                    setItems(data || []);
                }
            }
        }
        setLoading(false);
    }

    const handleOrder = (item: any) => {
        Alert.alert(
            "Order Delivery 🚚",
            `Do you want to request a driver to pick up "${item.name}" from ${item.formatted_address || 'Store'}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm Order", onPress: () => Alert.alert("Success", "Driver request broadcasted! (Demo)") }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'pros') {
            return (
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{item.full_name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.full_name}</Text>
                            <Text style={styles.subtext}>{item.skills?.slice(0, 3).join(', ')}</Text>
                        </View>
                        {item.hourly_rate && <Text style={styles.price}>${item.hourly_rate}/hr</Text>}
                    </View>
                    <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => navigation.navigate('Chat', { recipientId: item.id, name: item.full_name })}
                    >
                        <Text style={styles.btnText}>Message</Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            // Product Card
            return (
                <View style={styles.card}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
                    ) : (
                        <View style={[styles.productImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151' }]}>
                            <Text style={{ fontSize: 40 }}>🍱</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            {item.price && <Text style={styles.price}>{item.price}</Text>}
                            {item.rating && <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ {item.rating}</Text>}
                        </View>

                        {(item.formatted_address || item.distance) && (
                            <Text style={{ color: '#9ca3af', marginBottom: 8, fontSize: 12 }}>
                                📍 {item.distance ? `(${item.distance}) ` : ''} {item.formatted_address}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.orderBtn}
                            onPress={() => handleOrder(item)}
                        >
                            <Text style={styles.btnText}>Order Delivery 🚚</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products or pros..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pros' && styles.activeTab]}
                    onPress={() => setActiveTab('pros')}
                >
                    <Text style={[styles.tabText, activeTab === 'pros' && styles.activeTabText]}>Find Pros</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                    onPress={() => setActiveTab('products')}
                >
                    <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Find Products</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color="#3b82f6" />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => item.place_id || item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' }, // Dark mode bg
    searchContainer: { padding: 15, backgroundColor: '#1f2937', paddingTop: 60, paddingBottom: 20 },
    searchInput: { backgroundColor: '#374151', padding: 12, borderRadius: 12, color: '#fff', fontSize: 16 },
    tabs: { flexDirection: 'row', backgroundColor: '#1f2937', paddingBottom: 15 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#3b82f6' },
    tabText: { color: '#9ca3af', fontWeight: 'bold', fontSize: 14 },
    activeTabText: { color: '#3b82f6' },
    list: { padding: 15 },
    card: { backgroundColor: '#1f2937', marginBottom: 15, borderRadius: 16, overflow: 'hidden', padding: 15, borderWidth: 1, borderColor: '#374151' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    name: { fontWeight: 'bold', fontSize: 16, color: '#fff', marginBottom: 2 },
    subtext: { color: '#9ca3af', fontSize: 12 },
    price: { fontWeight: 'bold', fontSize: 16, color: '#34d399' },
    bio: { color: '#d1d5db', marginBottom: 12, lineHeight: 20 },
    btn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' },
    productImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
    btnOutline: { borderWidth: 1, borderColor: '#3b82f6', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    orderBtn: { backgroundColor: '#059669', padding: 10, borderRadius: 8, alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }
});
