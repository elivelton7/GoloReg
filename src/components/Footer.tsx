import React from 'react';
import { useStore } from '../store/useStore';
import { Mail, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer: React.FC = () => {
    const { ownerContact } = useStore();
    const { t } = useLanguage();

    return (
        <footer className="bg-white border-t border-gray-100 py-4 mt-auto">
            <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                <div className="font-medium">
                    {t('footer.developedBy')}
                </div>

                {ownerContact && (
                    <div className="flex items-center gap-4">
                        {ownerContact.email && (
                            <div className="flex items-center gap-1">
                                <Mail size={12} />
                                <span>{t('footer.email')}: {ownerContact.email}</span>
                            </div>
                        )}
                        {ownerContact.phone && (
                            <div className="flex items-center gap-1">
                                <Phone size={12} />
                                <span>{t('footer.phone')}: {ownerContact.phone}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </footer>
    );
};
