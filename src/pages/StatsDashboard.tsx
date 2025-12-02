import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { Trophy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

type Period = 'DAY' | 'MONTH' | 'YEAR';
type SortKey = 'goals' | 'assists' | 'saves' | 'fouls';
type SortDirection = 'asc' | 'desc';

export const StatsDashboard: React.FC = () => {
    const { players, events, currentField, fetchPlayers, fetchEvents } = useStore();
    const { t } = useLanguage();
    const [period, setPeriod] = useState<Period>('DAY');

    // Fetch data on mount if field is selected
    React.useEffect(() => {
        const loadData = async () => {
            if (currentField) {
                await fetchPlayers();
                await fetchEvents();
            }
        };
        loadData();
    }, [currentField]);
    const [date] = useState(new Date());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'goals',
        direction: 'desc',
    });

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const stats = useMemo(() => {
        let start: Date, end: Date;

        switch (period) {
            case 'DAY':
                start = startOfDay(date);
                end = endOfDay(date);
                break;
            case 'MONTH':
                start = startOfMonth(date);
                end = endOfMonth(date);
                break;
            case 'YEAR':
                start = startOfYear(date);
                end = endOfYear(date);
                break;
        }

        const filteredEvents = events.filter(e =>
            isWithinInterval(e.timestamp, { start, end })
        );

        return players.map(player => {
            const playerEvents = filteredEvents.filter(e => e.playerId === player.id);
            return {
                ...player,
                goals: playerEvents.filter(e => e.type === 'GOAL').length,
                assists: playerEvents.filter(e => e.type === 'ASSIST').length,
                saves: playerEvents.filter(e => e.type === 'SAVE').length,
                fouls: playerEvents.filter(e => e.type === 'FOUL').length,
            };
        }).sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }, [players, events, period, date, sortConfig]);

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    {t('stats.title')}
                </h2>

                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 w-full sm:w-auto overflow-x-auto">
                    {(['DAY', 'MONTH', 'YEAR'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={clsx(
                                'flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                                period === p
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            {p === 'DAY' ? t('stats.today') : p === 'MONTH' ? t('stats.month') : t('stats.year')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[350px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-3 sm:px-6 py-3 font-semibold text-gray-900 text-sm">{t('stats.player')}</th>
                                <th
                                    className="px-2 sm:px-6 py-3 font-semibold text-gray-900 text-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('goals')}
                                >
                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                                        {t('stats.goals')} <SortIcon columnKey="goals" />
                                    </div>
                                </th>
                                <th
                                    className="px-2 sm:px-6 py-3 font-semibold text-gray-900 text-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('assists')}
                                >
                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                                        {t('stats.assists')} <SortIcon columnKey="assists" />
                                    </div>
                                </th>
                                <th
                                    className="px-2 sm:px-6 py-3 font-semibold text-gray-900 text-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('saves')}
                                >
                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                                        {t('stats.saves')} <SortIcon columnKey="saves" />
                                    </div>
                                </th>
                                <th
                                    className="px-2 sm:px-6 py-3 font-semibold text-gray-900 text-center cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('fouls')}
                                >
                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                                        {t('stats.fouls')} <SortIcon columnKey="fouls" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.map((player) => (
                                <tr key={player.id} className="hover:bg-gray-50">
                                    <td className={clsx(
                                        "px-3 sm:px-6 py-3 font-medium text-sm truncate max-w-[120px] sm:max-w-none",
                                        player.active ? "text-gray-900" : "text-gray-400 line-through"
                                    )}>
                                        {player.name}
                                    </td>
                                    <td className="px-2 sm:px-6 py-3 text-center text-gray-600 text-sm">{player.goals}</td>
                                    <td className="px-2 sm:px-6 py-3 text-center text-gray-600 text-sm">{player.assists}</td>
                                    <td className="px-2 sm:px-6 py-3 text-center text-gray-600 text-sm">
                                        {player.roles.includes('GK') ? player.saves : '-'}
                                    </td>
                                    <td className="px-2 sm:px-6 py-3 text-center text-red-600 font-medium text-sm">{player.fouls}</td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        {t('stats.empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
