import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lecturerResearchAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { PlusIcon, DocumentTextIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const loadEntries = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await lecturerResearchAPI.getAll({ page, limit: 10 });
            setEntries(data.data.entries);
            setPagination(data.data.pagination);
        } catch (err) {
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
            const payload = {
                ...form,
                keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
                coAuthors: form.coAuthors.split(',').map((a) => a.trim()).filter(Boolean),
            };

            if (editingId) {
                await lecturerResearchAPI.update(editingId, payload);
                toast.success('Research updated');
            } else {
                await lecturerResearchAPI.create(payload);
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

    if (loading && entries.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
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

            {entries.length === 0 && !loading && (
                <EmptyState
                    icon={DocumentTextIcon}
                    title="No Research Entries"
                    message="You haven't added any research publications yet."
                />
            )}
        </div>
    );
}