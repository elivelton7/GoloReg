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
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-none",
                toast.color === 'green' && "bg-green-600 text-white",
                toast.color === 'blue' && "bg-blue-600 text-white",
                toast.color === 'orange' && "bg-orange-500 text-white",
                toast.color === 'red' && "bg-red-600 text-white",
                !toast.color && (toast.type === 'success' ? "bg-green-600 text-white" : "bg-red-600 text-white")
            )}>
                {toast.color === 'green' && <CheckCircle size={20} className="text-white" />}
                {toast.color === 'blue' && <CheckCircle size={20} className="text-white" />}
                {toast.color === 'orange' && <CheckCircle size={20} className="text-white" />}
                {toast.color === 'red' && <AlertCircle size={20} className="text-white" />}
                {!toast.color && (toast.type === 'success' ? <CheckCircle size={20} className="text-white" /> : <AlertCircle size={20} className="text-white" />)}
                <span className="font-medium">{toast.message}</span>
                <button onClick={hideToast} className="text-white/80 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
