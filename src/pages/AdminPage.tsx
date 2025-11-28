import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Lock, Trash2, LogOut, User, MapPin, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export const AdminPage: React.FC = () => {
    const {
        adminUser, loginAdmin, logoutAdmin,
        deletePlayer, deleteField, deleteEvent,
        fetchFields
    } = useStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'players' | 'fields' | 'events'>('players');
    const [isLoading, setIsLoading] = useState(false);

    // Local state for admin data
    const [localFields, setLocalFields] = useState<any[]>([]);
    const [localPlayers, setLocalPlayers] = useState<any[]>([]);
    const [localEvents, setLocalEvents] = useState<any[]>([]);

    // Filter state
    const [filterField, setFilterField] = useState('');
    const [filterPlayer, setFilterPlayer] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Fetch data functions
    const fetchAllPlayers = async () => {
        let query = supabase
            .from('players')
            .select('*, fields!inner(code, description)')
            .order('created_at', { ascending: false });

        if (filterField) {
            query = query.ilike('fields.code', `%${filterField}%`);
        }
        if (filterPlayer) {
            query = query.ilike('name', `%${filterPlayer}%`);
        }

        const { data, error } = await query;

        if (error) console.error('Error fetching players:', error);
        else setLocalPlayers(data || []);
    };

    const fetchAllEvents = async () => {
        let query = supabase
            .from('events')
            .select('*, players!inner(name, fields!inner(code))')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (filterField) {
            query = query.ilike('players.fields.code', `%${filterField}%`);
        }
        if (filterPlayer) {
            query = query.ilike('players.name', `%${filterPlayer}%`);
        }
        if (filterDate) {
            const startDate = new Date(filterDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filterDate);
            endDate.setHours(23, 59, 59, 999);

            query = query.gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) console.error('Error fetching events:', error);
        else setLocalEvents(data || []);
    };

    // Initial fetch if logged in
    useEffect(() => {
        if (adminUser) {
            fetchFields('').then(setLocalFields);
            fetchAllPlayers();
            fetchAllEvents();
        }
    }, [adminUser]);

    // Refetch data when filters change
    useEffect(() => {
        if (adminUser) {
            if (activeTab === 'players') {
                fetchAllPlayers();
            } else if (activeTab === 'events') {
                fetchAllEvents();
            }
        }
    }, [adminUser, filterField, filterPlayer, filterDate, activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await loginAdmin(username, password);
        setIsLoading(false);
        if (!success) {
            alert('Invalid credentials');
        }
    };

    const handleDeletePlayer = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this player?')) {
            try {
                await deletePlayer(id);
                await fetchAllPlayers(); // Refresh list
            } catch (error) {
                alert('Failed to delete player. Please check console for details.');
            }
        }
    };

    const handleDeleteField = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this field? This will delete all associated players and events.')) {
            try {
                await deleteField(id);
                await fetchFields('').then(setLocalFields); // Refresh list
                await fetchAllPlayers(); // Refresh players as some might be deleted
                await fetchAllEvents(); // Refresh events as some might be deleted
            } catch (error) {
                alert('Failed to delete field. Please check console for details.');
            }
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteEvent(id);
                await fetchAllEvents(); // Refresh list
            } catch (error) {
                alert('Failed to delete event. Please check console for details.');
            }
        }
    };

    if (!adminUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-red-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Checking...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="text-red-600" /> Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Welcome, {adminUser.username}</span>
                        <button
                            onClick={logoutAdmin}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} /> Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('players')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2",
                                activeTab === 'players' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <User size={20} /> Players
                        </button>
                        <button
                            onClick={() => setActiveTab('fields')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2",
                                activeTab === 'fields' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <MapPin size={20} /> Fields
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2",
                                activeTab === 'events' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Activity size={20} /> Events
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'players' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Manage Players (All Fields)</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <input
                                        type="text"
                                        placeholder="Filter by Field Code..."
                                        value={filterField}
                                        onChange={(e) => setFilterField(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Filter by Player Name..."
                                        value={filterPlayer}
                                        onChange={(e) => setFilterPlayer(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                </div>

                                {localPlayers.length === 0 ? (
                                    <p className="text-gray-500">No players found.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {localPlayers.map(player => (
                                            <div key={player.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {player.name}
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                            {player.fields?.code}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">{player.roles.join(', ')}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeletePlayer(player.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Player"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'fields' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Manage Fields</h3>
                                <input
                                    type="text"
                                    placeholder="Search fields..."
                                    className="w-full px-4 py-2 border rounded-lg"
                                    onChange={(e) => fetchFields(e.target.value).then(setLocalFields)}
                                />
                                {localFields.length === 0 ? (
                                    <p className="text-gray-500">No fields found.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {localFields.map(field => (
                                            <div key={field.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{field.code}</div>
                                                    <div className="text-sm text-gray-500">{field.description}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteField(field.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Field"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Manage Events (All Fields - Last 100)</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <input
                                        type="text"
                                        placeholder="Filter by Field Code..."
                                        value={filterField}
                                        onChange={(e) => setFilterField(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Filter by Player Name..."
                                        value={filterPlayer}
                                        onChange={(e) => setFilterPlayer(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                    <input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                </div>

                                {localEvents.length === 0 ? (
                                    <p className="text-gray-500">No events found.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                        {localEvents.map(event => (
                                            <div key={event.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {event.type}
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                            {event.players?.fields?.code}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Player: {event.players?.name} | Time: {new Date(event.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
