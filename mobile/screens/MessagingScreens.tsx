import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

// --- INBOX SCREEN ---

export function InboxScreen({ navigation }: any) {
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConvos = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch unique recent contacts
            const { data } = await supabase
                .from('messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (data) {
                const ids = new Set(data.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id));
                if (ids.size > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', Array.from(ids));
                    setConversations(profiles || []);
                }
            }
            setLoading(false);
        }
        fetchConvos();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.inboxItem}
            onPress={() => navigation.navigate('Chat', { recipientId: item.id, name: item.full_name })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name?.[0]}</Text>
            </View>
            <View>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.subtext}>Tap to chat</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>Messages</Text>
            </View>
            {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    )
}

// --- CHAT SCREEN ---

export function ChatScreen({ route }: any) {
    const { recipientId, name } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Load initial
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            setMessages(data || []);

            // Subscribe
            const channel = supabase
                .channel('mobile_chat')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, (payload) => {
                    if (payload.new.sender_id === recipientId) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
        init();
    }, [recipientId]);

    const sendMessage = async () => {
        if (!text.trim() || !userId) return;

        const msg = {
            sender_id: userId,
            receiver_id: recipientId,
            content: text,
        };

        // Optimistic
        setMessages(prev => [...prev, { ...msg, id: Math.random().toString() }]);
        setText('');

        const { error } = await supabase.from('messages').insert(msg);
        if (error) console.error(error);
    }

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === userId;
        return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={isMe ? styles.textMe : styles.textOther}>{item.content}</Text>
            </View>
        )
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>{name}</Text>
            </View>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            <View style={styles.inputBar}>
                <TextInput
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    value={text}
                    onChangeText={setText}
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                    <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    topBar: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    topBarTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    list: { padding: 10 },
    inboxItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginBottom: 1, borderRadius: 0 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    name: { fontWeight: 'bold', fontSize: 16 },
    subtext: { color: '#888' },
    chatList: { padding: 15 },
    bubble: { padding: 12, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
    bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#007bff', borderBottomRightRadius: 0 },
    bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea', borderBottomLeftRadius: 0 },
    textMe: { color: '#fff' },
    textOther: { color: '#000' },
    inputBar: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    chatInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 20, marginRight: 10 },
    sendBtn: { padding: 10 },
    sendText: { color: '#007bff', fontWeight: 'bold' }
});
