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
    const { currentField, clearField, fetchOwnerContact, currentUser, fetchProfile, signOut } = useStore();
    const { t, currentLanguage, setLanguage } = useLanguage();

    React.useEffect(() => {
        fetchProfile();
        fetchOwnerContact();
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
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
                <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
                    <Link to="/players" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                        <img
                            src="https://mzguoaihqpdhhaytqrwa.supabase.co/storage/v1/object/public/ImagesGoloReg/Gemini_Generated_Image_b4tb6rb4tb6rb4tb.png?v=2"
                            alt="GoloReg Logo"
                            className="w-8 h-auto object-contain"
                        />
                    </Link>

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

                        {currentUser && (
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700 bg-indigo-50 px-3 py-1.5 rounded-full">
                                    <span className="text-indigo-600 font-bold">{currentUser.balance}</span>
                                    <span className="text-indigo-600 text-xs uppercase tracking-wider">Credits</span>
                                </div>

                                {currentField && (
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                                        <MapPin size={16} />
                                        <span className="font-medium">{currentField.code}</span>
                                    </div>
                                )}

                                <div className="relative group">
                                    <button
                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Users size={20} />
                                    </button>

                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all transform origin-top-right z-50">
                                        <div className="px-4 py-2 border-b border-gray-50">
                                            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
                                            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                clearField();
                                                navigate('/field-selection');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <MapPin size={16} />
                                            {t('field.changeField')}
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            {t('auth.signOut')}
                                        </button>
                                    </div>
                                </div>
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
