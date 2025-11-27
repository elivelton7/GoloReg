import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
    },
}));

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            currentField: null,
            players: [],
            events: [],
            toast: null,
        });
        vi.clearAllMocks();
    });

    it('should have initial state', () => {
        const state = useStore.getState();
        expect(state.currentField).toBeNull();
        expect(state.players).toEqual([]);
        expect(state.events).toEqual([]);
        expect(state.toast).toBeNull();
    });

    it('should fetch fields successfully', async () => {
        // Supabase returns snake_case
        const mockFields = [
            { id: '1', code: 'TEST', description: 'Test Field', created_at: '2023-01-01' },
        ];

        // Mock Supabase response
        const selectMock = vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockFields, error: null }),
            }),
        });
        (supabase.from as any).mockReturnValue({ select: selectMock });

        const fields = await useStore.getState().fetchFields('TEST');

        // Store should return camelCase
        expect(fields).toEqual([
            { id: '1', code: 'TEST', description: 'Test Field', createdAt: '2023-01-01' },
        ]);
        expect(supabase.from).toHaveBeenCalledWith('fields');
    });

    it('should create a field successfully', async () => {
        // Supabase returns snake_case
        const newField = { id: '2', code: 'NEW', description: 'New Field', created_at: '2023-01-01' };

        // Mock Supabase response
        const insertMock = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newField, error: null })
            })
        });
        (supabase.from as any).mockReturnValue({ insert: insertMock });

        const result = await useStore.getState().createField('NEW', 'New Field');

        // Store should return camelCase
        expect(result).toEqual({ id: '2', code: 'NEW', description: 'New Field', createdAt: '2023-01-01' });
        expect(supabase.from).toHaveBeenCalledWith('fields');
    });
});
