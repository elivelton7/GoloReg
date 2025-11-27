import React from 'react';
import { useStore } from '../store/useStore';
import type { GameEvent } from '../types';
import { Dribbble, Footprints, Hand, RectangleVertical } from 'lucide-react';

export const EventLogger: React.FC = () => {
    const { players, addEvent, showToast } = useStore();

    const handleLog = async (playerId: string, type: GameEvent['type']) => {
        await addEvent(playerId, type);
        const player = players.find(p => p.id === playerId);

        let color = 'green';
        if (type === 'ASSIST') color = 'blue';
        if (type === 'SAVE') color = 'orange';
        if (type === 'FOUL') color = 'red';

        showToast(`${type} recorded for ${player?.name}!`, 'success', color);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Live Event Logger</h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.filter(p => p.active).map((player) => (
                    <div key={player.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="font-semibold text-lg text-center border-b border-gray-100 pb-2 truncate">
                            {player.name}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={() => handleLog(player.id, 'GOAL')}
                                className="flex items-center justify-center p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Goal"
                            >
                                <Dribbble size={24} />
                            </button>

                            <button
                                onClick={() => handleLog(player.id, 'ASSIST')}
                                className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Assist"
                            >
                                <Footprints size={24} />
                            </button>

                            <button
                                onClick={() => handleLog(player.id, 'FOUL')}
                                className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Foul"
                            >
                                <RectangleVertical size={24} fill="currentColor" />
                            </button>

                            {player.roles.includes('GK') ? (
                                <button
                                    onClick={() => handleLog(player.id, 'SAVE')}
                                    className="flex items-center justify-center p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                                    title="Save"
                                >
                                    <Hand size={24} />
                                </button>
                            ) : (
                                <div className="p-2" /> // Spacer for non-GK
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
