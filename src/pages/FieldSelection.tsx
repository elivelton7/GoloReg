import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const FieldSelection: React.FC = () => {
    const { fetchFields, createField, selectField, currentField } = useStore();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentField) {
            navigate('/players');
        }
    }, [currentField, navigate]);

    const [mode, setMode] = useState<'select' | 'create'>('select');
    const [searchQuery, setSearchQuery] = useState('');
    const [fields, setFields] = useState<Awaited<ReturnType<typeof fetchFields>>>([]);

    const [newFieldCode, setNewFieldCode] = useState('');
    const [newFieldDesc, setNewFieldDesc] = useState('');

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        const results = await fetchFields();
        setFields(results);
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        const results = await fetchFields(query);
        setFields(results);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFieldCode && newFieldDesc) {
            const field = await createField(newFieldCode, newFieldDesc);
            if (field) {
                await selectField(field);
                navigate('/players');
            }
        }
    };

    const handleFieldClick = async (field: any) => {
        await selectField(field);
        navigate('/players');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-indigo-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'select' ? t('field.selectTitle') : t('field.createTitle')}
                    </h2>
                </div>

                {mode === 'select' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder={t('field.searchPlaceholder')}
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {fields.length > 0 ? (
                                fields.map((field) => (
                                    <button
                                        key={field.id}
                                        onClick={() => handleFieldClick(field)}
                                        className="w-full p-4 text-left rounded-xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="font-semibold text-gray-900 group-hover:text-indigo-700 flex items-center justify-between">
                                            {field.code}
                                        </div>
                                        <div className="text-sm text-gray-500">{field.description}</div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No fields found. Create one!</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setMode('create')}
                                className="w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                {t('field.orCreate')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('field.enterCode')}</label>
                            <input
                                type="text"
                                value={newFieldCode}
                                onChange={(e) => setNewFieldCode(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all uppercase"
                                placeholder="ARENA-01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('field.description')}</label>
                            <input
                                type="text"
                                value={newFieldDesc}
                                onChange={(e) => setNewFieldDesc(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                placeholder="Campo Society Principal"
                            />
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {t('field.createButton')} <ArrowRight size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                {t('field.backToSelection')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
