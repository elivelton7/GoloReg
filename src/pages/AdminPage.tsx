import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Lock, Trash2, LogOut, User, MapPin, Activity, CreditCard, Plus, Coins, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
    const {
        currentUser, signOut, isAdmin, checkAdminStatus,
        deletePlayer, deleteField, deleteEvent,
        fetchFields, fetchAllProfiles, addCredits,
        fetchOpenSessions, deleteSession
    } = useStore();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'users' | 'players' | 'fields' | 'events' | 'sessions'>('users');

    // Local state for admin data
    const [localFields, setLocalFields] = useState<any[]>([]);
    const [localPlayers, setLocalPlayers] = useState<any[]>([]);
    const [localEvents, setLocalEvents] = useState<any[]>([]);
    const [localUsers, setLocalUsers] = useState<any[]>([]);
    const [localSessions, setLocalSessions] = useState<any[]>([]);

    // Filter state
    const [filterField, setFilterField] = useState('');
    const [filterPlayer, setFilterPlayer] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterUser, setFilterUser] = useState('');

    // Credit Modal State
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState(0);
    const [creditDescription, setCreditDescription] = useState('Admin Bonus');

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

    const fetchUsers = async () => {
        const users = await fetchAllProfiles();
        setLocalUsers(users);
    };

    const fetchSessions = async () => {
        const sessions = await fetchOpenSessions();
        setLocalSessions(sessions);
    };

    // Initial fetch if logged in
    useEffect(() => {
        if (currentUser) {
            checkAdminStatus();
            fetchFields('').then(setLocalFields);
            fetchAllPlayers();
            fetchAllEvents();
            fetchAllEvents();
            fetchUsers();
            fetchSessions();
        }
    }, [currentUser]);

    // Refetch data when filters change
    useEffect(() => {
        if (currentUser) {
            if (activeTab === 'players') fetchAllPlayers();
            else if (activeTab === 'events') fetchAllEvents();
            else if (activeTab === 'events') fetchAllEvents();
            else if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'sessions') fetchSessions();
        }
    }, [currentUser, filterField, filterPlayer, filterDate, activeTab]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleAddCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || creditAmount <= 0) return;

        const success = await addCredits(selectedUserId, creditAmount, creditDescription, 'ADMIN_MANUAL');
        if (success) {
            setShowCreditModal(false);
            setCreditAmount(0);
            setSelectedUserId(null);
            fetchUsers(); // Refresh balance
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

    const handleDeleteSession = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this session? The user will NOT be charged.')) {
            const success = await deleteSession(id);
            if (success) {
                await fetchSessions(); // Refresh list
            }
        }
    };

    if (!currentUser || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        {currentUser
                            ? `User ${currentUser.username} is not an administrator.`
                            : "You must be logged in to access the admin dashboard."}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        {currentUser ? "Switch Account" : "Go to Login"}
                    </button>
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
                        <span className="text-gray-600">Welcome, {currentUser.username}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} /> Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2 min-w-[120px]",
                                activeTab === 'users' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <CreditCard size={20} /> Users & Credits
                        </button>
                        <button
                            onClick={() => setActiveTab('players')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2 min-w-[120px]",
                                activeTab === 'players' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <User size={20} /> Players
                        </button>
                        <button
                            onClick={() => setActiveTab('fields')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2 min-w-[120px]",
                                activeTab === 'fields' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <MapPin size={20} /> Fields
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2 min-w-[120px]",
                                activeTab === 'events' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Activity size={20} /> Events
                        </button>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className={clsx(
                                "flex-1 py-4 font-medium text-center transition-colors flex items-center justify-center gap-2 min-w-[120px]",
                                activeTab === 'sessions' ? "text-red-600 border-b-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Clock size={20} /> Active Sessions
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Manage Users & Credits</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <input
                                        type="text"
                                        placeholder="Filter by Username or Email..."
                                        value={filterUser}
                                        onChange={(e) => setFilterUser(e.target.value)}
                                        className="px-4 py-2 border rounded-lg w-full"
                                    />
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {localUsers
                                        .filter(u =>
                                            u.username.toLowerCase().includes(filterUser.toLowerCase()) ||
                                            u.email.toLowerCase().includes(filterUser.toLowerCase())
                                        )
                                        .map(user => (
                                            <div key={user.id} className="py-4 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.username}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="font-bold text-indigo-600">{user.balance} Credits</div>
                                                        <div className="text-xs text-gray-400">Current Balance</div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserId(user.id);
                                                            setShowCreditModal(true);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                                    >
                                                        <Plus size={16} /> Add Credits
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {localUsers.length === 0 && <p className="text-gray-500 text-center py-4">No users found.</p>}
                                </div>
                            </div>
                        )}

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

                        {activeTab === 'sessions' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Active Sessions</h3>
                                {localSessions.length === 0 ? (
                                    <p className="text-gray-500">No active sessions found.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {localSessions.map(session => (
                                            <div key={session.sessionId} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {session.username}
                                                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Started: {new Date(session.startTime).toLocaleString()} ({session.durationMinutes} min ago)
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {session.email}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSession(session.sessionId)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Session (No Charge)"
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

            {/* Credit Modal */}
            {
                showCreditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Coins className="text-indigo-600" /> Add Credits
                            </h3>
                            <form onSubmit={handleAddCredits} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={creditDescription}
                                        onChange={(e) => setCreditDescription(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreditModal(false)}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                    >
                                        Add Credits
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
