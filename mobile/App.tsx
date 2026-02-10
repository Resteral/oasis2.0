import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, Text, Alert, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import { StatusBar } from 'expo-status-bar';

import RadarScreen from './screens/RadarScreen';
import { FeedScreen, ProfileScreen } from './screens/OtherScreens';
import MarketplaceScreen from './screens/MarketplaceScreen';
import { InboxScreen, ChatScreen } from './screens/MessagingScreens';

// --- SCREENS ---

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert('Error', error.message);
      else Alert.alert('Success', 'Check your email for confirmation!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oasis Mobile</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={styles.btnContainer}>
        <Button title={loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")} onPress={handleAuth} />
      </View>
      <Button
        title={isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
        onPress={() => setIsSignUp(!isSignUp)}
        color="#666"
      />
    </View>
  );
}

// --- NAVIGATION ---

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MessagingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

function MarketStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MarketList" component={MarketplaceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#007bff' }}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: '🏠 Home' }} />
      <Tab.Screen name="Radar" component={RadarScreen} options={{ tabBarLabel: '🔭 Radar' }} />
      <Tab.Screen name="Market" component={MarketStack} options={{ tabBarLabel: '🛍️ Market' }} />
      <Tab.Screen name="Messages" component={MessagingStack} options={{ tabBarLabel: '💬 Inbox' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '👤 Me' }} />
    </Tab.Navigator>
  )
}

// --- ROOT APP ---

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <NavigationContainer>
      {session && session.user ? <MainTabs /> : <LoginScreen />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  btnContainer: {
    width: '100%',
    marginBottom: 20,
  }
});
