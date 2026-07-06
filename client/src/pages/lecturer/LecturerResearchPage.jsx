import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lecturerResearchAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    PlusIcon, DocumentTextIcon, PencilSquareIcon,
    TrashIcon, ChevronDownIcon, ChevronUpIcon,
    BookOpenIcon, LinkIcon,
} from '@heroicons/react/24/outline';

const INITIAL_FORM = {
    title: '', abstract: '', department: '', year: new Date().getFullYear(),
    publicationTitle: '', journalName: '', volume: '', issueNumber: '',
    pages: '', doi: '', publicationUrl: '', keywords: '', coAuthors: '', status: 'Draft',
};

export default function LecturerResearchPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const loadEntries = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await lecturerResearchAPI.getAll({ page, limit: 10 });
            setEntries(data.data.entries);
            setPagination(data.data.pagination);
        } catch {
            toast.error('Failed to load research entries');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        document.title = 'My Research | SPRAMS';
        loadEntries();
    }, [loadEntries]);

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setFiles([]);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (entry) => {
        setForm({
            title: entry.title,
            abstract: entry.abstract,
            department: entry.department,
            year: entry.year,
            publicationTitle: entry.publicationTitle || '',
            journalName: entry.journalName || '',
            volume: entry.volume || '',
            issueNumber: entry.issueNumber || '',
            pages: entry.pages || '',
            doi: entry.doi || '',
            publicationUrl: entry.publicationUrl || '',
            keywords: (entry.keywords || []).join(', '),
            coAuthors: (entry.coAuthors || []).join(', '),
            status: entry.status || 'Draft',
        });
        setEditingId(entry._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('abstract', form.abstract);
            formData.append('department', form.department);
            formData.append('year', form.year);
            formData.append('publicationTitle', form.publicationTitle);
            formData.append('journalName', form.journalName);
            formData.append('volume', form.volume);
            formData.append('issueNumber', form.issueNumber);
            formData.append('pages', form.pages);
            formData.append('doi', form.doi);
            formData.append('publicationUrl', form.publicationUrl);
            formData.append('status', form.status);
            formData.append('keywords', JSON.stringify(
                form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
            ));
            formData.append('coAuthors', JSON.stringify(
                form.coAuthors.split(',').map((a) => a.trim()).filter(Boolean)
            ));
            for (const file of files) {
                formData.append('files', file);
            }

            if (editingId) {
                await lecturerResearchAPI.update(editingId, formData);
                toast.success('Research updated');
            } else {
                await lecturerResearchAPI.create(formData);
                toast.success('Research added');
            }
            resetForm();
            loadEntries();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this research entry?')) return;
        try {
            await lecturerResearchAPI.delete(id);
            toast.success('Research deleted');
            loadEntries();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const statusColors = {
        Draft: 'badge-yellow',
        Submitted: 'badge-blue',
        Published: 'badge-green',
        Archived: 'badge-red',
    };

    if (loading && entries.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpenIcon className="w-7 h-7 text-primary-600" />
                        My Research Publications
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your own research entries and publications.</p>
                </div>
                <button
                    onClick={() => { showForm ? resetForm() : setShowForm(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    {showForm ? 'Cancel' : 'Add Research'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <h2 className="font-semibold text-slate-700">
                        {editingId ? 'Edit Research' : 'New Research Entry'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="form-label">Title *</label>
                            <input
                                type="text" required minLength={5}
                                className="form-input"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Abstract *</label>
                            <textarea
                                required minLength={50} rows={4}
                                className="form-input"
                                value={form.abstract}
                                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Department *</label>
                            <input
                                type="text" required
                                className="form-input"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Year *</label>
                            <input
                                type="number" required min={2000} max={2100}
                                className="form-input"
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Keywords (comma-separated)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="AI, Machine Learning, NLP"
                                value={form.keywords}
                                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Co-Authors (comma-separated)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Dr. Smith, Prof. Jones"
                                value={form.coAuthors}
                                onChange={(e) => setForm({ ...form, coAuthors: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Publication details */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="font-medium text-slate-600 mb-3 text-sm">Publication Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="form-label">Publication Title</label>
                                <input
                                    type="text" className="form-input"
                                    value={form.publicationTitle}
                                    onChange={(e) => setForm({ ...form, publicationTitle: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Journal Name</label>
                                <input
                                    type="text" className="form-input"
                                    value={form.journalName}
                                    onChange={(e) => setForm({ ...form, journalName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">DOI</label>
                                <input
                                    type="text" className="form-input"
                                    value={form.doi}
                                    onChange={(e) => setForm({ ...form, doi: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Volume</label>
                                <input
                                    type="text" className="form-input"
                                    value={form.volume}
                                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Issue</label>
                                <input
                                    type="text" className="form-input"
                                    value={form.issueNumber}
                                    onChange={(e) => setForm({ ...form, issueNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Pages</label>
                                <input
                                    type="text" className="form-input"
                                    placeholder="1-25"
                                    value={form.pages}
                                    onChange={(e) => setForm({ ...form, pages: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Publication URL</label>
                                <input
                                    type="url" className="form-input"
                                    value={form.publicationUrl}
                                    onChange={(e) => setForm({ ...form, publicationUrl: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Published">Published</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Files */}
                    <div>
                        <label className="form-label">Attach Files</label>
                        <input
                            type="file" multiple
                            className="form-input"
                            onChange={(e) => setFiles([...e.target.files])}
                        />
                        <p className="text-xs text-slate-400 mt-1">Max 10 files, 1GB each</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary flex items-center gap-2"
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update Research' : 'Add Research')}
                        </button>
                        <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            )}

            {/* Entries list */}
            {entries.length === 0 && !loading ? (
                <EmptyState
                    icon={DocumentTextIcon}
                    title="No Research Entries"
                    message="You haven't added any research publications yet. Click 'Add Research' to get started."
                />
            ) : (
                <div className="space-y-3">
                    {entries.map((entry) => (
                        <div key={entry._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                                    <BookOpenIcon className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold text-slate-800 text-sm truncate">{entry.title}</h3>
                                        <span className={`badge ${statusColors[entry.status] || 'badge-blue'}`}>
                                            {entry.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">
                                        {entry.department} · {entry.year}
                                        {entry.journalName && ` · ${entry.journalName}`}
                                    </p>

                                    {/* Expanded details */}
                                    {expandedId === entry._id && (
                                        <div className="mt-3 space-y-2 text-sm text-slate-600 border-t pt-3">
                                            <p><strong>Abstract:</strong> {entry.abstract}</p>
                                            {entry.keywords?.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {entry.keywords.map((kw, i) => (
                                                        <span key={i} className="badge badge-blue text-xs">{kw}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {entry.coAuthors?.length > 0 && (
                                                <p><strong>Co-Authors:</strong> {entry.coAuthors.join(', ')}</p>
                                            )}
                                            {entry.doi && (
                                                <p className="flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" />
                                                    <strong>DOI:</strong> {entry.doi}
                                                </p>
                                            )}
                                            {entry.files?.length > 0 && (
                                                <p><strong>Files:</strong> {entry.files.length} attached</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                                        title={expandedId === entry._id ? 'Collapse' : 'Expand'}
                                    >
                                        {expandedId === entry._id ?
                                            <ChevronUpIcon className="w-4 h-4" /> :
                                            <ChevronDownIcon className="w-4 h-4" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"
                                        title="Edit"
                                    >
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry._id)}
                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                        title="Delete"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary text-xs disabled:opacity-50"
                            >Previous</button>
                            <span className="text-sm text-slate-500 flex items-center">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="btn-secondary text-xs disabled:opacity-50"
                            >Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
