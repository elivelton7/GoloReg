import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { GameEvent } from '../types';
import { Dribbble, Footprints, Hand, Flag, Play, Pause, RotateCcw, Undo2, Timer, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const EventLogger: React.FC = () => {
    const {
        players,
        addEvent,
        showToast,
        undoLastEvent,
        fetchEvents,
        currentField,
        activeSessionId,
        startSession,
        stopSession,
        currentUser
    } = useStore();
    const { t } = useLanguage();

    useEffect(() => {
        const loadData = async () => {
            if (currentField) {
                await useStore.getState().fetchPlayers(); // Ensure players are loaded first
                await fetchEvents();
            }
        };
        loadData();
    }, [currentField]);

    // Timer State
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const intervalRef = useRef<number | null>(null);

    // Session State
    const [isStartingSession, setIsStartingSession] = useState(false);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setTime((prev) => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    // Low Credit Warning Logic
    const warned10Ref = useRef(false);
    const warned5Ref = useRef(false);

    useEffect(() => {
        if (!currentUser || !isRunning) return;

        const balanceInSeconds = (currentUser.balance || 0) * 60;
        const secondsUsed = time;
        const secondsRemaining = balanceInSeconds - secondsUsed;

        // Warning at 10 minutes (600 seconds)
        if (secondsRemaining <= 600 && secondsRemaining > 590 && !warned10Ref.current) {
            showToast(t('logger.warning10min') || 'Warning: 10 minutes of credit remaining!', 'error');
            warned10Ref.current = true;
        }

        // Warning at 5 minutes (300 seconds)
        if (secondsRemaining <= 300 && secondsRemaining > 290 && !warned5Ref.current) {
            showToast(t('logger.warning5min') || 'Urgent: Only 5 minutes of credit remaining!', 'error');
            warned5Ref.current = true;
        }
    }, [time, currentUser, isRunning, showToast, t]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeClick = () => {
        setIsEditing(true);
        setEditValue(Math.floor(time / 60).toString());
        setIsRunning(false);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mins = parseInt(editValue);
        if (!isNaN(mins) && mins >= 0) {
            setTime(mins * 60);
        }
        setIsEditing(false);
    };

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTime(0);
    };

    const handleLog = async (playerId: string, type: GameEvent['type']) => {
        if (!activeSessionId) {
            showToast('You must start a session to log events', 'error');
            return;
        }

        await addEvent(playerId, type);
        const player = players.find(p => p.id === playerId);

        let color = 'green';
        if (type === 'ASSIST') color = 'blue';
        if (type === 'SAVE') color = 'orange';
        if (type === 'FOUL') color = 'red';

        showToast(`${type} ${t('logger.recorded')} ${player?.name}!`, 'success', color);
    };

    const handleStartSession = async () => {
        if (!currentUser) return;
        setIsStartingSession(true);
        const sessionId = await startSession(currentUser.id);
        setIsStartingSession(false);
        if (sessionId) {
            setIsRunning(true); // Auto-start timer
        }
    };

    const handleStopSession = async () => {
        if (!activeSessionId) return;
        if (window.confirm(t('logger.confirmStop'))) {
            const success = await stopSession(activeSessionId);
            if (success) {
                setIsRunning(false);
            }
        }
    };

    if (!activeSessionId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="bg-indigo-100 p-6 rounded-full">
                    <Timer className="w-16 h-16 text-indigo-600" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">{t('logger.startSessionTitle')}</h2>
                    <p className="text-gray-500">
                        {t('logger.startSessionDesc')}
                        <br />
                        {t('logger.creditsDeducted')} ({currentUser?.balance || 0} {t('logger.creditsAvailable')}).
                    </p>
                </div>
                <button
                    onClick={handleStartSession}
                    disabled={isStartingSession || (currentUser?.balance || 0) <= 0}
                    className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    {isStartingSession ? t('logger.starting') : t('logger.startSessionButton')}
                    {!isStartingSession && <Play size={24} fill="currentColor" />}
                </button>
                {(currentUser?.balance || 0) <= 0 && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <AlertCircle size={20} />
                        <span>{t('logger.insufficientCredits')}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">{t('logger.title')}</h2>
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {t('logger.sessionActive')}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        {isEditing ? (
                            <form onSubmit={handleEditSubmit} className="flex items-center">
                                <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-16 px-2 py-1 text-sm border rounded outline-none"
                                    autoFocus
                                    onBlur={() => setIsEditing(false)}
                                />
                                <span className="text-sm font-medium ml-1">min</span>
                            </form>
                        ) : (
                            <div
                                onClick={handleTimeClick}
                                className="font-mono text-xl font-bold text-gray-700 px-3 py-1 cursor-pointer hover:bg-gray-200 rounded transition-colors"
                                title="Click to edit minutes"
                            >
                                {formatTime(time)}
                            </div>
                        )}

                        <div className="flex items-center border-l border-gray-300 pl-1">
                            <button
                                onClick={toggleTimer}
                                className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button
                                onClick={resetTimer}
                                className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-red-600 transition-colors"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleStopSession}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors text-sm"
                    >
                        {t('logger.stopSession')}
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={undoLastEvent}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                    <Undo2 size={18} />
                    {t('common.undo')}
                </button>
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
                                title={t('logger.goal')}
                            >
                                <Dribbble size={24} />
                            </button>

                            <button
                                onClick={() => handleLog(player.id, 'ASSIST')}
                                className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title={t('logger.assist')}
                            >
                                <Footprints size={24} />
                            </button>

                            <button
                                onClick={() => handleLog(player.id, 'FOUL')}
                                className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title={t('logger.foul')}
                            >
                                <Flag size={24} />
                            </button>

                            {player.roles.includes('GK') ? (
                                <button
                                    onClick={() => handleLog(player.id, 'SAVE')}
                                    className="flex items-center justify-center p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                                    title={t('logger.save')}
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
