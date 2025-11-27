import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Plus, Map, Lock } from 'lucide-react';
import type { Field } from '../types';

export const FieldSelection: React.FC = () => {
    const navigate = useNavigate();
    const { fetchFields, createField, selectField, verifyFieldPassword, showToast } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Field[]>([]);

    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Selection State
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [passwordInput, setPasswordInput] = useState('');

    useEffect(() => {
        if (query.length >= 2) {
            fetchFields(query).then(setResults);
        } else {
            setResults([]);
        }
    }, [query, fetchFields]);

    const handleFieldClick = (field: Field) => {
        setSelectedField(field);
        setPasswordInput('');
    };

    const handleVerifyAndEnter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedField) return;

        const isValid = await verifyFieldPassword(selectedField.id, passwordInput);
        if (isValid) {
            await selectField(selectedField);
            navigate('/players');
        } else {
            showToast('Incorrect password', 'error');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query || !newDescription || !newPassword) return;

        const field = await createField(query, newDescription, newPassword);
        if (field) {
            await selectField(field);
            navigate('/players');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Map className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to GoloReg</h1>
                    <p className="text-gray-500">Select a field to start tracking stats</p>
                </div>

                {!selectedField ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value.toUpperCase().slice(0, 4));
                                    setIsCreating(false);
                                }}
                                placeholder="Enter Field Code (e.g. ARENA)"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all uppercase"
                                maxLength={4}
                            />
                        </div>

                        {results.length > 0 && !isCreating && (
                            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                                {results.map((field) => (
                                    <button
                                        key={field.id}
                                        onClick={() => handleFieldClick(field)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-900">{field.code}</div>
                                            <div className="text-sm text-gray-500">{field.description}</div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity">
                                            <Lock size={16} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {query.length >= 3 && results.length === 0 && !isCreating && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={20} />
                                Create new field "{query}"
                            </button>
                        )}

                        {isCreating && (
                            <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="e.g. Downtown Arena"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newDescription.trim() || !newPassword.trim()}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create & Enter
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleVerifyAndEnter} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center pb-2">
                            <h3 className="font-semibold text-gray-900">Enter Password for {selectedField.code}</h3>
                            <p className="text-sm text-gray-500">This field is protected</p>
                        </div>

                        <div>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center tracking-widest"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedField(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!passwordInput}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Enter
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
