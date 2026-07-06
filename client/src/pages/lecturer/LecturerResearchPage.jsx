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
    const [files, setFiles] = useState([]);
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