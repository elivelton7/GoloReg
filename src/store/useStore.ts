import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Player, GameEvent, Field } from '../types';

interface AppState {
    currentField: Field | null;
    players: Player[];
    events: GameEvent[];
    toast: { message: string; type: 'success' | 'error'; color?: string } | null;

    // Toast Actions
    showToast: (message: string, type?: 'success' | 'error', color?: string) => void;
    hideToast: () => void;

    // Field Actions
    fetchFields: (query: string) => Promise<Field[]>;
    createField: (code: string, description: string, password?: string) => Promise<Field | null>;
    verifyFieldPassword: (fieldId: string, password: string) => Promise<boolean>;
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

    // Admin Actions
    adminUser: { id: string; username: string } | null;
    loginAdmin: (username: string, password: string) => Promise<boolean>;
    logoutAdmin: () => void;
    deletePlayer: (id: string) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    undoLastEvent: () => Promise<void>;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
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

            fetchFields: async (query: string) => {
                const { data, error } = await supabase
                    .from('fields')
                    .select('*')
                    .or(`code.eq.${query},description.ilike.%${query}%`)
                    .limit(5);

                if (error) {
                    console.error('Error fetching fields:', error);
                    return [];
                }
                return (data || []).map(f => ({
                    id: f.id,
                    code: f.code,
                    description: f.description,
                    createdAt: f.created_at
                }));
            },

            createField: async (code: string, description: string, password = '9999') => {
                const { data, error } = await supabase
                    .from('fields')
                    .insert([{ code: code.toUpperCase(), description, password }])
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating field:', error);
                    return null;
                }
                return {
                    id: data.id,
                    code: data.code,
                    description: data.description,
                    createdAt: data.created_at
                };
            },

            verifyFieldPassword: async (fieldId: string, password: string) => {
                const { data, error } = await supabase
                    .from('fields')
                    .select('id')
                    .eq('id', fieldId)
                    .eq('password', password)
                    .single();

                if (error || !data) {
                    return false;
                }
                return true;
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
                const { players } = get();
                const owner = players.find(p => p.name.toLowerCase() === 'eli');

                if (!owner) {
                    set({ ownerContact: null });
                    return;
                }

                const { data, error } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('player_id', owner.id)
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

            loginAdmin: async (username, password) => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password) // Plain text for now as requested
                    .eq('is_admin', true)
                    .single();

                if (error || !data) {
                    return false;
                }

                set({ adminUser: { id: data.id, username: data.username } });
                return true;
            },

            logoutAdmin: () => set({ adminUser: null }),

            deletePlayer: async (id) => {
                console.log('Attempting to delete player:', id);
                // 1. Delete events for this player first (cascade manually)
                const { error: eventsError } = await supabase
                    .from('events')
                    .delete()
                    .eq('player_id', id);

                if (eventsError) {
                    console.error('Error deleting player events:', eventsError);
                    get().showToast('Failed to delete player events', 'error');
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
                    get().showToast('Failed to delete player: ' + error.message, 'error');
                    throw error;
                }

                if (count === 0) {
                    console.warn('No player deleted. RLS or ID mismatch?');
                    get().showToast('Could not delete player. Permission denied or not found.', 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                set(state => ({ players: state.players.filter(p => p.id !== id) }));
                get().showToast('Player deleted successfully');
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
                        get().showToast('Failed to delete field events', 'error');
                        throw eventsError;
                    }

                    // 3. Delete all players
                    const { error: playersError } = await supabase
                        .from('players')
                        .delete()
                        .eq('field_id', id);

                    if (playersError) {
                        console.error('Error deleting field players:', playersError);
                        get().showToast('Failed to delete field players', 'error');
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
                    get().showToast('Failed to delete field: ' + error.message, 'error');
                    throw error;
                }

                if (count === 0) {
                    console.warn('No field deleted. RLS or ID mismatch?');
                    get().showToast('Could not delete field. Permission denied or not found.', 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                // If current field is deleted, clear it
                if (get().currentField?.id === id) {
                    get().clearField();
                }
                get().showToast('Field deleted successfully');
            },

            deleteEvent: async (id) => {
                const { error, count } = await supabase
                    .from('events')
                    .delete({ count: 'exact' })
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting event:', error);
                    get().showToast('Failed to delete event', 'error');
                    throw error;
                }

                if (count === 0) {
                    get().showToast('Could not delete event. Permission denied.', 'error');
                    throw new Error('Delete failed: No rows affected');
                }

                set(state => ({ events: state.events.filter(e => e.id !== id) }));
                get().showToast('Event deleted successfully');
            },

            undoLastEvent: async () => {
                const { events } = get();
                if (events.length === 0) return;

                // Sort by timestamp desc to get the last one
                const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
                const lastEvent = sortedEvents[0];

                await get().deleteEvent(lastEvent.id);
            },
        }),
        {
            name: 'goloreg-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                adminUser: state.adminUser,
                currentField: state.currentField
            }), // Only persist adminUser and currentField
        }
    )
);
