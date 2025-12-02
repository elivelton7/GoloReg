import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getTranslation } from '../utils/i18nUtils';
import type { Player, GameEvent, Field } from '../types';

interface AppState {
    // Auth State
    currentUser: { id: string; username: string; email: string; balance: number } | null;
    isAdmin: boolean;
    activeSessionId: string | null;

    currentField: Field | null;
    players: Player[];
    events: GameEvent[];
    toast: { message: string; type: 'success' | 'error'; color?: string } | null;

    // Toast Actions
    showToast: (message: string, type?: 'success' | 'error', color?: string) => void;
    hideToast: () => void;

    // Auth Actions
    signUp: (email: string, password: string, username: string) => Promise<boolean>;
    signIn: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    checkAdminStatus: () => Promise<boolean>;

    // Field Actions
    fetchFields: (query?: string) => Promise<Field[]>;
    createField: (code: string, description: string) => Promise<Field | null>;
    selectField: (field: Field) => Promise<void>;
    clearField: () => void;

    // Player Actions
    fetchPlayers: () => Promise<void>;
    addPlayer: (name: string, roles: ('GK' | 'FIELD')[]) => Promise<void>;
    togglePlayerStatus: (playerId: string) => Promise<void>;

    // Event Actions
    fetchEvents: () => Promise<void>;
    addEvent: (playerId: string, type: GameEvent['type']) => Promise<void>;

    // Contact Actions
    ownerContact: { email: string | null; phone: string | null } | null;
    fetchOwnerContact: () => Promise<void>;

    // Admin Actions (Legacy/Internal)
    adminUser: { id: string; username: string } | null;
    deletePlayer: (id: string) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    undoLastEvent: () => Promise<void>;

    // Credit System Actions
    addCredits: (userId: string, amount: number, description: string, reference?: string) => Promise<boolean>;
    startSession: (userId: string) => Promise<string | null>; // Returns session ID
    stopSession: (sessionId: string) => Promise<boolean>;
    fetchUserBalance: (userId: string) => Promise<{ balance: number; transactions: any[] } | null>;

    // Admin Actions (New)
    fetchAllProfiles: () => Promise<{ id: string; username: string; email: string; balance: number }[]>;
    fetchOpenSessions: () => Promise<{ sessionId: string; userId: string; username: string; email: string; startTime: string; durationMinutes: number }[]>;
    deleteSession: (sessionId: string) => Promise<boolean>;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            isAdmin: false,
            activeSessionId: null,
            currentField: null,
            players: [],
            events: [],
            toast: null,
            ownerContact: null,
            adminUser: null,

            showToast: (message, type = 'success', color) => {
                set({ toast: { message, type, color } });
                setTimeout(() => {
                    set({ toast: null });
                }, 3000);
            },

            hideToast: () => set({ toast: null }),

            signUp: async (email, password, username) => {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });

                if (error) {
                    get().showToast(getTranslation('auth.signUpFailed') + error.message, 'error');
                    return false;
                }

                if (data.user) {
                    get().showToast(getTranslation('auth.signUpSuccess'));
                    return true;
                }
                return false;
            },

            signIn: async (email, password) => {
                console.log('Attempting sign in for:', email);
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    console.error('Sign in error:', error);
                    get().showToast(getTranslation('auth.signInFailed') + (error.message === 'Invalid login credentials' ? getTranslation('auth.invalidCredentials') : error.message), 'error');
                    return false;
                }

                console.log('Sign in successful, user:', data.user);

                if (data.user) {
                    await get().fetchProfile();
                    await get().checkAdminStatus();
                    return true;
                }
                return false;
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({ currentUser: null, isAdmin: false, activeSessionId: null, currentField: null, players: [], events: [] });
            },

            fetchProfile: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                console.log('Fetching profile, user from auth:', user);

                if (!user) {
                    console.warn('No user found in auth.getUser()');
                    set({ currentUser: null });
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    return;
                }

                if (profile) {
                    console.log('Profile fetched:', profile);
                    set({
                        currentUser: {
                            id: user.id,
                            email: user.email || '',
                            username: profile.username || user.user_metadata?.username || 'User',
                            balance: profile.saldo_creditos || 0
                        }
                    });

                    // Check for active session
                    const { data: activeSession } = await supabase
                        .from('usage_sessions')
                        .select('id')
                        .eq('user_id', user.id)
                        .is('end_time', null) // Check if end_time is null (open session)
                        .eq('status', 'ABERTA') // Double check status
                        .maybeSingle();

                    if (activeSession) {
                        console.log('Found active session:', activeSession.id);
                        set({ activeSessionId: activeSession.id });
                    }
                }
            },

            checkAdminStatus: async () => {
                const { data, error } = await supabase.rpc('is_admin');

                if (error) {
                    console.error('Error checking admin status:', error);
                    set({ isAdmin: false });
                    return false;
                }

                set({ isAdmin: !!data });
                return !!data;
            },

            fetchFields: async (query = '') => {
                const { currentUser } = get();
                if (!currentUser) return [];

                let queryBuilder = supabase
                    .from('fields')
                    .select('*')
                    .eq('owner_id', currentUser.id); // Filter by owner

                if (query) {
                    queryBuilder = queryBuilder.or(`code.eq.${query},description.ilike.%${query}%`);
                }

                const { data, error } = await queryBuilder.limit(10);

                if (error) {
                    console.error('Error fetching fields:', error);
                    return [];
                }
                return (data || []).map(f => ({
                    id: f.id,
                    code: f.code,
                    description: f.description,
                    ownerId: f.owner_id,
                    createdAt: f.created_at
                }));
            },

            createField: async (code: string, description: string) => {
                const { currentUser } = get();
                if (!currentUser) {
                    get().showToast(getTranslation('field.loginRequired'), 'error');
                    return null;
                }

                const { data, error } = await supabase
                    .from('fields')
                    .insert([{
                        code: code.toUpperCase(),
                        description,
                        owner_id: currentUser.id
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating field:', error);
                    get().showToast(getTranslation('field.createError') + error.message, 'error');
                    return null;
                }
                return {
                    id: data.id,
                    code: data.code,
                    description: data.description,
                    ownerId: data.owner_id,
                    createdAt: data.created_at
                };
            },

            selectField: async (field: Field) => {
                set({ currentField: field });
                await get().fetchPlayers();
                await get().fetchEvents();
                await get().fetchOwnerContact();
            },

            clearField: () => {
                set({ currentField: null, players: [], events: [] });
            },

            fetchPlayers: async () => {
                const { currentField } = get();
                if (!currentField) return;

                const { data, error } = await supabase
                    .from('players')
                    .select('*')
                    .eq('field_id', currentField.id)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Error fetching players:', error);
                    return;
                }

                set({
                    players: data.map(p => ({
                        id: p.id,
                        name: p.name,
                        roles: p.roles,
                        fieldId: p.field_id,
                        active: p.active,
                        createdAt: p.created_at
                    }))
                });
            },

            addPlayer: async (name: string, roles: ('GK' | 'FIELD')[]) => {
                const { currentField } = get();
                if (!currentField) return;

                const { data, error } = await supabase
                    .from('players')
                    .insert([{
                        name,
                        roles,
                        field_id: currentField.id,
                        active: true
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('Error adding player:', error);
                    return;
                }

                const newPlayer: Player = {
                    id: data.id,
                    name: data.name,
                    roles: data.roles,
                    fieldId: data.field_id,
                    active: data.active,
                    createdAt: data.created_at
                };

                set(state => ({ players: [...state.players, newPlayer] }));
            },

            togglePlayerStatus: async (playerId: string) => {
                const { players } = get();
                const player = players.find(p => p.id === playerId);
                if (!player) return;

                const newStatus = !player.active;

                const { error } = await supabase
                    .from('players')
                    .update({ active: newStatus })
                    .eq('id', playerId);

                if (error) {
                    console.error('Error toggling player status:', error);
                    return;
                }

                set(state => ({
                    players: state.players.map(p =>
                        p.id === playerId ? { ...p, active: newStatus } : p
                    )
                }));
            },

            fetchEvents: async () => {
                const { currentField } = get();
                if (!currentField) return;

                const playerIds = get().players.map(p => p.id);
                if (playerIds.length === 0) {
                    set({ events: [] });
                    return;
                }

                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .in('player_id', playerIds);

                if (error) console.error('Error fetching events:', error);
                else set({
                    events: (data || []).map(e => ({
                        id: e.id,
                        playerId: e.player_id,
                        type: e.type,
                        timestamp: e.timestamp
                    }))
                });
            },

            addEvent: async (playerId: string, type: GameEvent['type']) => {
                const { data, error } = await supabase
                    .from('events')
                    .insert([{ player_id: playerId, type, timestamp: Date.now() }])
                    .select()
                    .single();

                if (error) console.error('Error adding event:', error);
                else set((state) => ({
                    events: [...state.events, {
                        id: data.id,
                        playerId: data.player_id,
                        type: data.type,
                        timestamp: data.timestamp
                    }]
                }));
            },

            fetchOwnerContact: async () => {
                const { data, error } = await supabase
                    .from('contacts')
                    .select('*')
                    .ilike('name', 'Eli') // Fetch contact with name 'Eli' (case insensitive)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching contact:', error);
                }

                if (data) {
                    set({ ownerContact: { email: data.email, phone: data.phone } });
                } else {
                    set({ ownerContact: null });
                }
            },

            // Admin Actions (Legacy/Internal)
            deletePlayer: async (id) => {
                console.log('Attempting to delete player:', id);
                // 1. Delete events for this player first (cascade manually)
                const { error: eventsError } = await supabase
                    .from('events')
                    .delete()
                    .eq('player_id', id);

                if (eventsError) {
                    console.error('Error deleting player events:', eventsError);
                    get().showToast(getTranslation('player.deleteErrorEvents'), 'error');
                    throw eventsError;
                }

                // 2. Delete the player
                const { error, count } = await supabase
                    .from('players')
                    .delete({ count: 'exact' })
                    .eq('id', id);

                console.log('Delete player result:', { error, count });

                if (error) {
                    console.error('Error deleting player:', error);
                    get().showToast(getTranslation('player.deleteError') + error.message, 'error');
                    throw error;
                }

                if (count === 0) {
                    console.warn('No player deleted. RLS or ID mismatch?');
                    get().showToast(getTranslation('player.deleteDenied'), 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                set(state => ({ players: state.players.filter(p => p.id !== id) }));
                get().showToast(getTranslation('player.deleteSuccess'));
            },

            deleteField: async (id) => {
                console.log('Attempting to delete field:', id);
                // 1. Get all players for this field
                const { data: players } = await supabase
                    .from('players')
                    .select('id')
                    .eq('field_id', id);

                if (players && players.length > 0) {
                    const playerIds = players.map(p => p.id);

                    // 2. Delete all events for these players
                    const { error: eventsError } = await supabase
                        .from('events')
                        .delete()
                        .in('player_id', playerIds);

                    if (eventsError) {
                        console.error('Error deleting field events:', eventsError);
                        get().showToast(getTranslation('field.deleteErrorEvents'), 'error');
                        throw eventsError;
                    }

                    // 3. Delete all players
                    const { error: playersError } = await supabase
                        .from('players')
                        .delete()
                        .eq('field_id', id);

                    if (playersError) {
                        console.error('Error deleting field players:', playersError);
                        get().showToast(getTranslation('field.deleteErrorPlayers'), 'error');
                        throw playersError;
                    }
                }

                // 4. Delete the field
                const { error, count } = await supabase
                    .from('fields')
                    .delete({ count: 'exact' })
                    .eq('id', id);

                console.log('Delete field result:', { error, count });

                if (error) {
                    console.error('Error deleting field:', error);
                    get().showToast(getTranslation('field.deleteError') + error.message, 'error');
                    throw error;
                }

                if (count === 0) {
                    console.warn('No field deleted. RLS or ID mismatch?');
                    get().showToast(getTranslation('field.deleteDenied'), 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                // If current field is deleted, clear it
                if (get().currentField?.id === id) {
                    get().clearField();
                }
                get().showToast(getTranslation('field.deleteSuccess'));
            },

            deleteEvent: async (id) => {
                const { error, count } = await supabase
                    .from('events')
                    .delete({ count: 'exact' })
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting event:', error);
                    get().showToast(getTranslation('event.deleteError'), 'error');
                    throw error;
                }

                if (count === 0) {
                    get().showToast(getTranslation('event.deleteDenied'), 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                set(state => ({ events: state.events.filter(e => e.id !== id) }));
                get().showToast(getTranslation('event.deleteSuccess'));
            },

            undoLastEvent: () => {
                const { events } = get();
                if (events.length === 0) return Promise.resolve();

                // Sort by timestamp desc to get the last one
                const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
                const lastEvent = sortedEvents[0];

                return get().deleteEvent(lastEvent.id);
            },

            // Credit System Implementation
            addCredits: async (userId, amount, description, reference) => {
                const { data, error } = await supabase.rpc('add_credits', {
                    p_user_id: userId,
                    p_quantidade: amount,
                    p_descricao: description,
                    p_referencia: reference
                });

                if (error) {
                    console.error('Error adding credits:', error);
                    get().showToast(getTranslation('credits.addError') + error.message, 'error');
                    return false;
                }

                if (data && data.success) {
                    get().showToast(getTranslation('credits.addSuccess') + data.new_balance);
                    // Update local balance
                    set(state => state.currentUser ? { currentUser: { ...state.currentUser, balance: data.new_balance } } : {});
                    return true;
                } else {
                    get().showToast(getTranslation('credits.addError') + (data?.error || 'Unknown error'), 'error');
                    return false;
                }
            },

            startSession: async (userId) => {
                const { data, error } = await supabase.rpc('start_session', {
                    p_user_id: userId
                });

                if (error) {
                    console.error('Error starting session:', error);

                    // Check if error is "User already has an open session"
                    if (error.message.includes('already has an open session')) {
                        console.log('Session already active, attempting to recover state...');
                        // Fetch the active session
                        const { data: activeSession } = await supabase
                            .from('usage_sessions')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('status', 'ABERTA')
                            .maybeSingle();

                        if (activeSession) {
                            set({ activeSessionId: activeSession.id });
                            get().showToast(getTranslation('session.startSuccess')); // Show success as we recovered
                            return activeSession.id;
                        }
                    }

                    get().showToast(getTranslation('session.startError') + error.message, 'error');
                    return null;
                }

                if (data && data.success) {
                    get().showToast(getTranslation('session.startSuccess'));
                    set({ activeSessionId: data.session_id });
                    return data.session_id;
                } else {
                    get().showToast(getTranslation('session.startError') + (data?.error || 'Unknown error'), 'error');
                    return null;
                }
            },

            stopSession: async (sessionId) => {
                const { data, error } = await supabase.rpc('stop_session', {
                    p_session_id: sessionId
                });

                if (error) {
                    console.error('Error stopping session:', error);
                    get().showToast(getTranslation('session.stopError') + error.message, 'error');
                    return false;
                }

                if (data && data.success) {
                    get().showToast(getTranslation('session.stopSuccess') + data.credits_charged + getTranslation('session.creditsLabel'));
                    set({ activeSessionId: null });
                    // Refresh balance
                    const { currentUser } = get();
                    if (currentUser) {
                        const balanceData = await get().fetchUserBalance(currentUser.id);
                        if (balanceData) {
                            set(state => state.currentUser ? { currentUser: { ...state.currentUser, balance: balanceData.balance } } : {});
                        }
                    }
                    return true;
                } else {
                    get().showToast(getTranslation('session.stopError') + (data?.error || 'Unknown error'), 'error');
                    return false;
                }
            },

            fetchUserBalance: async (userId) => {
                const { data, error } = await supabase.rpc('get_user_balance', {
                    p_user_id: userId
                });

                if (error) {
                    console.error('Error fetching balance:', error);
                    return null;
                }

                return data;
            },

            fetchAllProfiles: async () => {
                const { data, error } = await supabase.rpc('get_all_profiles');

                if (error) {
                    console.error('Error fetching profiles:', error);
                    return [];
                }

                return (data || []).map((p: any) => ({
                    id: p.id,
                    username: p.username,
                    email: p.email,
                    balance: p.saldo_creditos
                }));
            },

            fetchOpenSessions: async () => {
                const { data, error } = await supabase.rpc('get_open_sessions');

                if (error) {
                    console.error('Error fetching open sessions:', error);
                    return [];
                }

                return (data || []).map((s: any) => ({
                    sessionId: s.session_id,
                    userId: s.user_id,
                    username: s.username,
                    email: s.email,
                    startTime: s.start_time,
                    durationMinutes: s.duration_minutes
                }));
            },

            deleteSession: async (sessionId) => {
                const { data, error } = await supabase.rpc('delete_session', {
                    p_session_id: sessionId
                });

                if (error) {
                    console.error('Error deleting session:', error);
                    get().showToast(getTranslation('actionFailed') + error.message, 'error');
                    return false;
                }

                if (data && data.success) {
                    get().showToast(getTranslation('actionSuccess'));
                    return true;
                } else {
                    get().showToast(getTranslation('actionFailed') + (data?.error || 'Unknown error'), 'error');
                    return false;
                }
            },
        }),
        {
            name: 'goloreg-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                adminUser: state.adminUser,
                currentField: state.currentField,
                currentUser: state.currentUser,
                isAdmin: state.isAdmin,
                activeSessionId: state.activeSessionId
            }), // Persist auth state
        }
    )
);
