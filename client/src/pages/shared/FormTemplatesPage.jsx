import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formTemplatesAPI, tokenStorage } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    DocumentArrowDownIcon, PlusIcon, TrashIcon,
    PencilSquareIcon, DocumentIcon, EyeIcon,
    ArrowDownTrayIcon, XMarkIcon, FolderOpenIcon,
    TagIcon, CheckBadgeIcon,
} from '@heroicons/react/24/outline';

// Category color mapping
const CATEGORY_COLORS = {
    Registration: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500' },
    Proposal: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-500' },
    Guidelines: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' },
    Ethics: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
    General: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', icon: 'text-slate-500' },
};

const getCategoryStyle = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.General;

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

function PreviewModal({ template, onClose, onDownload }) {
    const token = tokenStorage.getAccess();
    const previewUrl = `${formTemplatesAPI.getDownloadUrl(template._id)}?token=${token}&disposition=inline`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/90 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '96vw', height: '96vh' }}>
                <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="bg-red-100 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-widest flex-shrink-0">PDF</span>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{template.name}</p>
                            <p className="text-xs text-slate-400">{template.originalName} · {formatSize(template.fileSize)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => onDownload(template)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Download
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500" title="Close preview">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden bg-slate-100">
                    <iframe src={previewUrl} title={`Preview: ${template.name}`} className="w-full h-full border-0" style={{ minHeight: '100%' }} />
                </div>
            </div>
        </div>
    );
}

function TemplateCard({ template, isAdmin, onEdit, onDelete, onDownload, onPreview }) {
    const style = getCategoryStyle(template.category);

    return (
        <div className={`rounded-2xl border ${style.border} ${style.bg} p-5 flex flex-col gap-4 hover:shadow-lg transition-all duration-200 group`}>
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border ${style.border}`}>
                    <DocumentIcon className={`w-6 h-6 ${style.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1">{template.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${style.badge}`}>
                        <TagIcon className="w-3 h-3" /> {template.category}
                    </span>
                </div>
            </div>
            {template.description && <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{template.description}</p>}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/60">
                <span className="font-medium">{template.originalName}</span>
                <span>·</span>
                <span>{formatSize(template.fileSize)}</span>
                {template.downloadCount > 0 && (
                    <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                            <ArrowDownTrayIcon className="w-3 h-3" /> {template.downloadCount}
                        </span>
                    </>
                )}
            </div>
            <div className="flex gap-2 mt-auto">
                <button onClick={() => onPreview(template)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex-1">
                    <EyeIcon className="w-4 h-4" /> Preview
                </button>
                <button onClick={() => onDownload(template)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all flex-1 shadow-sm">
                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </button>
                {isAdmin && (
                    <>
                        <button onClick={() => onEdit(template)} className="p-2 rounded-xl bg-white border border-slate-200 text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(template._id)} className="p-2 rounded-xl bg-white border border-slate-200 text-red-400 hover:bg-red-50 hover:border-red-200 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function FormTemplatesPage() {
    const { isAdmin } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (categoryFilter) params.category = categoryFilter;
            const { data } = await formTemplatesAPI.getAll(params);
            setTemplates(data.data.templates);
        } catch {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => {
        document.title = 'Form Templates | SPRAMS';
        loadTemplates();
    }, [loadTemplates]);

    const handleDownload = (template) => {
        const token = tokenStorage.getAccess();
        const url = formTemplatesAPI.getDownloadUrl(template._id);
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (!res.ok) throw new Error('Download failed');
                return res.blob();
            })
            .then((blob) => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = template.originalName || `${template.name}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success(`"${template.name}" downloaded!`);
            })
            .catch(() => toast.error('Download failed. Please try again.'));
    };

    const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];
    const filteredTemplates = categoryFilter ? templates.filter((t) => t.category === categoryFilter) : templates;

    if (loading && templates.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderOpenIcon className="w-7 h-7 text-primary-600" /> Form Templates
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {isAdmin ? 'Manage and upload campus form templates for students.' : 'Download official campus form templates below.'}
                    </p>
                </div>
            </div>

            {templates.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-primary-700">{templates.length}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Templates Available</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-emerald-700">{categories.length}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Categories</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-blue-700">{templates.reduce((sum, t) => sum + (t.downloadCount || 0), 0)}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Total Downloads</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-purple-700">PDF</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Format</p>
                    </div>
                </div>
            )}

            {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setCategoryFilter('')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!categoryFilter ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        All ({templates.length})
                    </button>
                    {categories.map((cat) => {
                        const style = getCategoryStyle(cat);
                        return (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${categoryFilter === cat ? `${style.badge} shadow-sm` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                {cat} ({templates.filter((t) => t.category === cat).length})
                            </button>
                        );
                    })}
                </div>
            )}

            {filteredTemplates.length === 0 ? (
                <EmptyState icon={DocumentIcon} title="No Templates" message={isAdmin ? 'Upload your first form template above.' : 'No form templates are available yet.'} />
            ) : (
                <>
                    {!isAdmin && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                            <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p>Click <strong>Preview</strong> to view a template in your browser, or <strong>Download</strong> to save it to your device.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredTemplates.map((t) => (
                            <TemplateCard key={t._id} template={t} isAdmin={isAdmin} onEdit={() => {}} onDelete={() => {}} onDownload={handleDownload} onPreview={setPreviewTemplate} />
                        ))}
                    </div>
                </>
            )}

            {previewTemplate && <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} onDownload={handleDownload} />}
        </div>
    );
}