import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export const Toast: React.FC = () => {
    const { toast, hideToast } = useStore();

    if (!toast) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
                toast.color === 'green' && "bg-white border-green-100 text-green-800",
                toast.color === 'blue' && "bg-white border-blue-100 text-blue-800",
                toast.color === 'orange' && "bg-white border-orange-100 text-orange-800",
                !toast.color && (toast.type === 'success' ? "bg-white border-green-100 text-green-800" : "bg-white border-red-100 text-red-800")
            )}>
                {toast.color === 'green' && <CheckCircle size={20} className="text-green-500" />}
                {toast.color === 'blue' && <CheckCircle size={20} className="text-blue-500" />}
                {toast.color === 'orange' && <CheckCircle size={20} className="text-orange-500" />}
                {!toast.color && (toast.type === 'success' ? <CheckCircle size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />)}
                <span className="font-medium">{toast.message}</span>
                <button onClick={hideToast} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
