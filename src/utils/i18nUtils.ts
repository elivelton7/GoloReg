import { translations, type Language } from '../translations';

export const getTranslation = (key: string): string => {
    const currentLanguage = (localStorage.getItem('language') as Language) || 'pt';
    const keys = key.split('.');
    let current: any = translations[currentLanguage];

    for (const k of keys) {
        if (current[k] === undefined) {
            console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
            return key;
        }
        current = current[k];
    }

    return current as string;
};
