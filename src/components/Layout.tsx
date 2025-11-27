import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Activity, BarChart2, MapPin, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Toast } from './Toast';
import { Footer } from './Footer';
import { clsx } from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentField, clearField } = useStore();

    const navItems = [
        { path: '/players', label: 'Players', icon: Users },
        { path: '/logger', label: 'Logger', icon: Activity },
        { path: '/stats', label: 'Stats', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Toast />
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-indigo-600">GoloReg</h1>
                        {currentField && (
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                    <MapPin size={14} />
                                    <span className="font-medium text-gray-900">{currentField.code}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="truncate max-w-[150px]">{currentField.description}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        clearField();
                                        navigate('/');
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Change Field"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    <nav className="flex gap-4">
                        {navItems.map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                                    location.pathname === path
                                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon size={20} />
                                <span className="hidden sm:inline">{label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
                {children}
            </main>
            <Footer />
        </div>
    );
};
