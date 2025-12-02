import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LoginPage: React.FC = () => {
    const { signIn, signUp } = useStore();
    const navigate = useNavigate();
    const { currentLanguage, setLanguage, t } = useLanguage();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        let success = false;
        if (isSignUp) {
            success = await signUp(email.trim(), password.trim(), username.trim());
            if (success) {
                setIsSignUp(false);
                setEmail('');
                setPassword('');
                setUsername('');
            }
        } else {
            success = await signIn(email.trim(), password.trim());
            if (success) {
                navigate('/field-selection');
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative">
            <div className="absolute top-4 right-4">
                <select
                    value={currentLanguage}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 py-2 pl-3 pr-8 cursor-pointer uppercase outline-none shadow-sm"
                >
                    <option value="pt">PT</option>
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                </select>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-8">
                        <img
                            src="https://mzguoaihqpdhhaytqrwa.supabase.co/storage/v1/object/public/ImagesGoloReg/Gemini_Generated_Image_b4tb6rb4tb6rb4tb.png?v=2"
                            alt="GoloReg Logo"
                            className="w-40 h-auto object-contain"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{isSignUp ? t('login.createAccount') : t('login.welcomeBack')}</h2>
                    <p className="text-gray-500 mt-2">{isSignUp ? t('login.signUpDesc') : t('login.signInDesc')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.username')}</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    placeholder={t('login.usernamePlaceholder')}
                                    required={isSignUp}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder={t('login.emailPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder={t('login.passwordPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98] duration-200"
                    >
                        {isLoading ? (
                            t('login.processing')
                        ) : (
                            <>
                                {isSignUp ? t('login.signUp') : t('login.signIn')} <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        {isSignUp ? t('login.haveAccount') : t('login.noAccount')}
                    </button>
                </div>
            </div >
        </div >
    );
};
