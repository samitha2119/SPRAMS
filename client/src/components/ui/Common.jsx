import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

// Loading Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
    return (
        <div className={`${sizes[size]} border-2 border-primary-600 border-t-transparent rounded-full animate-spin ${className}`} />
    );
};

// Full-page spinner
export const PageSpinner = () => (
    <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading...</p>
        </div>
    </div>
);

// AI Badge
export const AIBadge = ({ label = 'AI Generated' }) => (
    <span className="ai-badge" title="System Generated">
        <SparklesIcon className="w-3 h-3 text-purple-600" />
        <span className="ai-gradient-text">{label}</span>
    </span>
);

// Empty state
export const EmptyState = ({ icon: Icon, title, description, message, action }) => {
    const text = description || message;
    return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {Icon && <Icon className="w-12 h-12 text-slate-300 mb-4" />}
        <h3 className="text-lg font-semibold text-slate-600 mb-1">{title}</h3>
        {text && <p className="text-sm text-slate-400 mb-4 max-w-sm">{text}</p>}
        {action}
    </div>
    );
};

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-6xl',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-fade-in`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 id="modal-title" className="text-lg font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close modal">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">{children}</div>
            </div>
        </div>
    );
};

// Confirmation dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading, confirmText = 'Delete', confirmVariant = 'danger' }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
                <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
                <button
                    onClick={onConfirm}
                    className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" className="mr-2" /> : null}
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

// Pagination
export const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="Previous page"
            >
                ← Prev
            </button>
            <span className="text-sm text-slate-600 px-3">
                Page {page} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="Next page"
            >
                Next →
            </button>
        </div>
    );
};

// Tag chip
export const TagChip = ({ tag, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
      ${variant === 'suggestion'
                ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
        aria-label={`Filter by ${tag}`}
    >
        {variant === 'suggestion' && <SparklesIcon className="w-3 h-3 mr-1 text-purple-500" />}
        {tag}
    </button>
);

// File type badge
export const FileTypeBadge = ({ type }) => {
    const styles = {
        'application/pdf': 'bg-red-100 text-red-700',
        'image/jpeg': 'bg-green-100 text-green-700',
        'image/png': 'bg-green-100 text-green-700',
        'audio/mpeg': 'bg-yellow-100 text-yellow-700',
        'audio/wav': 'bg-yellow-100 text-yellow-700',
        'video/mp4': 'bg-blue-100 text-blue-700',
    };
    const labels = {
        'application/pdf': 'PDF',
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'audio/mpeg': 'MP3',
        'audio/wav': 'WAV',
        'video/mp4': 'MP4',
    };
    return (
        <span className={`badge ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
            {labels[type] || type}
        </span>
    );
};

// Stats card
export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        purple: 'bg-purple-50 text-purple-700',
        orange: 'bg-orange-50 text-orange-700',
        red: 'bg-red-50 text-red-700',
    };
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-800">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

// Error alert
export const ErrorAlert = ({ message }) => (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3" role="alert">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-red-700">{message}</p>
    </div>
);
