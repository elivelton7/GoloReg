import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../translations';

interface LanguageContextType {
    currentLanguage: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved as Language) || 'pt'; // Default to PT-BR as requested
    });

    useEffect(() => {
        localStorage.setItem('language', currentLanguage);
    }, [currentLanguage]);

    const setLanguage = (lang: Language) => {
        setCurrentLanguage(lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations[currentLanguage];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${currentLanguage}`);
                return path;
            }
            current = current[key];
        }

        return current as string;
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
