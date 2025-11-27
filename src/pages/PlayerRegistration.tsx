import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, Power, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

export const PlayerRegistration: React.FC = () => {
    const { players, addPlayer, togglePlayerStatus } = useStore();
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'GK' | 'FIELD' | 'BOTH'>('FIELD');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const roles: ('GK' | 'FIELD')[] = role === 'BOTH' ? ['GK', 'FIELD'] : [role];

        await addPlayer(name.trim(), roles);
        setName('');
        setRole('FIELD');
    };

    const filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="text-indigo-500" />
                    {t('player.registerTitle')}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('player.nameLabel')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            placeholder={t('player.namePlaceholder')}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('player.roleLabel')}</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        >
                            <option value="FIELD">{t('player.roleField')}</option>
                            <option value="GK">{t('player.roleGK')}</option>
                            <option value="BOTH">{t('player.roleBoth')}</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('player.addButton')}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">{t('player.listTitle')} ({filteredPlayers.length})</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('player.searchPlaceholder')}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {filteredPlayers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchTerm ? t('player.noResults') : t('player.emptyList')}
                        </div>
                    ) : (
                        filteredPlayers.map((player) => (
                            <div key={player.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className={clsx("font-medium", player.active ? "text-gray-900" : "text-gray-400 line-through")}>
                                        {player.name}
                                    </div>
                                    <div className="text-sm text-gray-500 flex gap-2">
                                        {player.roles.includes('FIELD') && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{t('player.roleField')}</span>}
                                        {player.roles.includes('GK') && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">{t('player.roleGK')}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => togglePlayerStatus(player.id)}
                                    className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        player.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                                    )}
                                    title={player.active ? t('player.deactivate') : t('player.activate')}
                                >
                                    <Power size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
