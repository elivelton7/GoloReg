import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Users, Activity, BarChart2, MapPin, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Toast } from './Toast';
import { Footer } from './Footer';
import { clsx } from 'clsx';

export const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentField, clearField } = useStore();
    const { t, currentLanguage, setLanguage } = useLanguage();

    const handleLogout = () => {
        clearField();
        navigate('/');
    };

    const navItems = [
        { path: '/players', icon: Users, label: t('player.listTitle') },
        { path: '/logger', icon: Activity, label: t('logger.title') },
        { path: '/stats', icon: BarChart2, label: t('stats.title') },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Toast />
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Activity className="text-white" size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 hidden sm:block">GoloReg</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={currentLanguage}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="bg-gray-50 border-none text-sm font-medium text-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 py-1.5 pl-3 pr-8 cursor-pointer uppercase outline-none"
                        >
                            <option value="pt">PT</option>
                            <option value="en">EN</option>
                            <option value="es">ES</option>
                        </select>

                        {currentField && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin size={16} />
                                    <span className="font-medium">{currentField.code}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={t('field.changeField')}
                                >
                                    <LogOut size={20} />
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
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
