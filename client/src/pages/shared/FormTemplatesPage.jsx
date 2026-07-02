import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formTemplatesAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    DocumentArrowDownIcon, PlusIcon, TrashIcon,
    PencilSquareIcon, DocumentIcon,
} from '@heroicons/react/24/outline';

export default function FormTemplatesPage() {
    const { user, isAdmin } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', category: 'General' });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');

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

    const resetForm = () => {
        setForm({ name: '', description: '', category: 'General' });
        setFile(null);
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingId && !file) {
            toast.error('Please select a file');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('description', form.description);
            formData.append('category', form.category);
            if (file) formData.append('file', file);

            if (editingId) {
                await formTemplatesAPI.update(editingId, formData);
                toast.success('Template updated');
            } else {
                await formTemplatesAPI.create(formData);
                toast.success('Template uploaded');
            }
            resetForm();
            loadTemplates();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await formTemplatesAPI.delete(id);
            toast.success('Template deleted');
            loadTemplates();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleEdit = (t) => {
        setForm({ name: t.name, description: t.description || '', category: t.category || 'General' });
        setEditingId(t._id);
        setShowForm(true);
    };

    const handleDownload = (id) => {
        const token = localStorage.getItem('token');
        const url = `${window.location.origin}/api/v1/form-templates/${id}/download`;
        // Use fetch with auth header for download
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (!res.ok) throw new Error('Download failed');
                return res.blob();
            })
            .then((blob) => {
                const t = templates.find((t) => t._id === id);
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = t?.originalName || 'template';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(() => toast.error('Download failed'));
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];

    if (loading && templates.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <DocumentArrowDownIcon className="w-7 h-7 text-primary-600" />
                        Form Templates
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isAdmin
                            ? 'Upload and manage campus form templates for students.'
                            : 'Download campus form templates.'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { showForm ? resetForm() : setShowForm(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'Upload Template'}
                    </button>
                )}
            </div>

            {/* Admin upload form */}
            {showForm && isAdmin && (
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <h2 className="font-semibold text-slate-700">
                        {editingId ? 'Edit Template' : 'Upload New Template'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Name *</label>
                            <input
                                type="text" required minLength={3}
                                className="form-input"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Category</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Registration, Thesis"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Description</label>
                            <textarea
                                rows={2}
                                className="form-input"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">File (PDF or DOCX) {editingId ? '' : '*'}</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="form-input"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" disabled={submitting} className="btn-primary">
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Upload')}
                        </button>
                        <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            )}

            {/* Category filter */}
            {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setCategoryFilter('')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >All</button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >{cat}</button>
                    ))}
                </div>
            )}

            {/* Templates list */}
            {templates.length === 0 ? (
                <EmptyState
                    icon={DocumentIcon}
                    title="No Templates"
                    message={isAdmin ? 'Upload your first form template.' : 'No form templates are available yet.'}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t) => (
                        <div key={t._id} className="card hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <DocumentIcon className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-slate-800 truncate">{t.name}</h3>
                                    <span className="badge badge-blue text-xs">{t.category}</span>
                                </div>
                            </div>
                            {t.description && (
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>
                            )}
                            <div className="text-xs text-slate-400 mt-auto mb-3">
                                {t.originalName} · {formatSize(t.fileSize)}
                                {t.downloadCount > 0 && ` · ${t.downloadCount} downloads`}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(t._id)}
                                    className="btn-primary text-xs flex-1 py-2 flex items-center justify-center gap-1"
                                >
                                    <DocumentArrowDownIcon className="w-3 h-3" /> Download
                                </button>
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t._id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
