import { create } from 'zustand';
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
}

export const useStore = create<AppState>((set, get) => ({
    currentField: null,
    players: [],
    events: [],
    toast: null,
    ownerContact: null,

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
}));
