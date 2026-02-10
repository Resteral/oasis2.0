import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, Alert, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function RadarScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isDriverMode, setIsDriverMode] = useState(false);
    const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);

    // 1. Get Permission & Watch Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // Watch Position
            await Location.watchPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10
            }, (newLoc) => {
                setLocation(newLoc);
                if (isDriverMode) {
                    broadcastLocation(newLoc);
                }
            });
        })();
    }, [isDriverMode]);

    // 2. Broadcast Location to database
    const broadcastLocation = async (loc: Location.LocationObject) => {
        const { error } = await supabase.rpc('update_location', {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
        });
        if (error) console.error("Loc Update Error:", error);
    }

    // 3. Fetch Nearby Users (Radar)
    useEffect(() => {
        const fetchNearby = async () => {
            // Mocking nearby fetch
            const { data } = await supabase.from('profiles').select('*').limit(10);
            setNearbyUsers(data || []);
        }
        fetchNearby();
        const interval = setInterval(fetchNearby, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            {location ? (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    region={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation={true}
                >
                    {nearbyUsers.map(user => (
                        // Mock random offset for demo if no real location
                        <Marker
                            key={user.id}
                            coordinate={{
                                latitude: location.coords.latitude + (Math.random() - 0.5) * 0.02,
                                longitude: location.coords.longitude + (Math.random() - 0.5) * 0.02,
                            }}
                            title={user.full_name || 'User'}
                            description={user.role}
                            pinColor={user.role === 'driver' ? 'green' : 'red'}
                        />
                    ))}
                </MapView>
            ) : (
                <View style={styles.center}><Text>Locating...</Text></View>
            )}

            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.label}>Driver Mode</Text>
                    <Switch
                        value={isDriverMode}
                        onValueChange={setIsDriverMode}
                        trackColor={{ true: '#22c55e' }}
                    />
                </View>
                <Text style={styles.status}>
                    {isDriverMode ? "You are ONLINE 🟢" : "You are Offline 🔴"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    overlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 5,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: { fontSize: 18, fontWeight: 'bold' },
    status: { fontSize: 14, color: '#666', textAlign: 'center' }
});
