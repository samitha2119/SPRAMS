import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentResearchAPI, projectsAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    PlusIcon, DocumentTextIcon, PencilSquareIcon,
    TrashIcon, ChevronDownIcon, ChevronUpIcon,
    BookOpenIcon, FolderIcon, BriefcaseIcon,
} from '@heroicons/react/24/outline';

const INITIAL_FORM = {
    title: '', abstract: '', department: '', academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    supervisor: '', keywords: '',
};

export default function StudentResearchPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('research');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [proposalFile, setProposalFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Projects state
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectPage, setProjectPage] = useState(1);
    const [projectPagination, setProjectPagination] = useState({});

    const loadEntries = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await studentResearchAPI.getAll({ page, limit: 10 });
            setEntries(data.data.entries);
            setPagination(data.data.pagination);
        } catch {
            toast.error('Failed to load research entries');
        } finally {
            setLoading(false);
        }
    }, [page]);

    const loadProjects = useCallback(async () => {
        if (!user?._id) return;
        try {
            setProjectsLoading(true);
            const { data } = await projectsAPI.getAll({
                page: projectPage,
                limit: 10
            });
            setProjects(data.data.projects);
            setProjectPagination(data.data.pagination);
        } catch {
            toast.error('Failed to load project submissions');
        } finally {
            setProjectsLoading(false);
        }
    }, [user, projectPage]);

    useEffect(() => {
        document.title = 'My Work | SPRAMS';
        loadEntries();
        loadProjects();
    }, [loadEntries, loadProjects]);

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setProposalFile(null);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (entry) => {
        setForm({
            title: entry.title || '',
            abstract: entry.abstract || '',
            department: entry.department || '',
            academicYear: entry.academicYear || '',
            supervisor: entry.supervisor || '',
            keywords: Array.isArray(entry.keywords) ? entry.keywords.join(', ') : (entry.keywords || ''),
        });
        setEditingId(entry._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingId && !proposalFile) {
            toast.error('Research proposal PDF is required for submission');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('abstract', form.abstract);
            formData.append('department', form.department);
            formData.append('academicYear', form.academicYear);
            formData.append('supervisor', form.supervisor);
            formData.append('keywords', JSON.stringify(
                form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
            ));
            if (proposalFile) {
                formData.append('proposal', proposalFile);
            }

            if (editingId) {
                await studentResearchAPI.update(editingId, formData);
                toast.success('Research updated');
            } else {
                await studentResearchAPI.create(formData);
                toast.success('Research submitted');
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
        if (!window.confirm('Delete this research?')) return;
        try {
            await studentResearchAPI.delete(id);
            toast.success('Research deleted');
            loadEntries();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const statusColors = {
        Proposed: 'badge-yellow',
        Ongoing: 'badge-purple',
        Completed: 'badge-blue',
        Approved: 'badge-green',
        Unfinished: 'badge-red',
    };

    if (loading && entries.length === 0 && projects.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BriefcaseIcon className="w-7 h-7 text-green-600" />
                        My Work
                    </h1>
                    <p className="text-slate-500 mt-1">Submit and track your research and academic projects</p>
                </div>
                {activeTab === 'research' ? (
                    <button
                        onClick={() => { showForm ? resetForm() : setShowForm(true); }}
                        className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'Submit Research'}
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            // Redirect to submit project page or explore projects
                            window.location.href = '/projects';
                        }}
                        className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Project
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('research')}
                    className={`flex items-center gap-2 py-3 px-6 border-b-2 font-semibold text-sm transition-all ${
                        activeTab === 'research'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    Research Submissions ({pagination.total || 0})
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`flex items-center gap-2 py-3 px-6 border-b-2 font-semibold text-sm transition-all ${
                        activeTab === 'projects'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <FolderIcon className="w-4 h-4" />
                    Project Submissions ({projectPagination.total || 0})
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <h2 className="font-semibold text-slate-700">
                        {editingId ? 'Edit Research' : 'New Research Submission'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="form-label">Title *</label>
                            <input type="text" required minLength={5} className="form-input"
                                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Abstract *</label>
                            <textarea required minLength={50} rows={4} className="form-input"
                                value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Department *</label>
                            <input type="text" required className="form-input"
                                value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Academic Year *</label>
                            <input type="text" required pattern="\d{4}/\d{4}" placeholder="e.g. 2023/2024" title="Must be in format YYYY/YYYY (e.g. 2023/2024)" className="form-input"
                                value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Supervisor</label>
                            <input type="text" className="form-input" placeholder="Dr./Prof. Name"
                                value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Keywords (comma-separated)</label>
                            <input type="text" className="form-input" placeholder="AI, IoT, ML"
                                value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Research Proposal (PDF) *</label>
                        <input
                            type="file"
                            accept=".pdf"
                            className="form-input"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.type === 'application/pdf') {
                                    setProposalFile(file);
                                } else if (file) {
                                    toast.error('Only PDF is allowed');
                                }
                            }}
                        />
                        {proposalFile && (
                            <p className="text-xs text-green-600 font-semibold mt-1">Selected: {proposalFile.name}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={submitting}
                            className="btn-primary bg-green-600 hover:bg-green-700">
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Submit Research')}
                        </button>
                        <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            )}

            {/* Tab Contents */}
            {activeTab === 'research' ? (
                <>
                    {entries.length === 0 && !loading ? (
                        <EmptyState icon={DocumentTextIcon} title="No Research" message="Submit your first research entry to get started." />
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <div key={entry._id} className="card hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <BookOpenIcon className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-semibold text-slate-800 text-sm truncate">{entry.title}</h3>
                                                <span className={`badge ${statusColors[entry.status] || 'badge-blue'}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {entry.department} · {entry.academicYear}
                                                {entry.supervisor && ` · Supervisor: ${entry.supervisor}`}
                                            </p>

                                            {expandedId === entry._id && (
                                                <div className="mt-3 space-y-2 text-sm text-slate-600 border-t pt-3">
                                                    <p><strong>Abstract:</strong> {entry.abstract}</p>
                                                    {entry.keywords?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.keywords.map((kw, i) => (
                                                                <span key={i} className="badge badge-green text-xs">{kw}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {entry.files?.length > 0 && (
                                                        <p><strong>Files:</strong> {entry.files.length} attached</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Link
                                                to={`/research/${entry._id}`}
                                                className="btn-secondary text-xs px-3 py-1.5"
                                            >
                                                View Details
                                            </Link>
                                            <button
                                                onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                                            >
                                                {expandedId === entry._id ?
                                                    <ChevronUpIcon className="w-4 h-4" /> :
                                                    <ChevronDownIcon className="w-4 h-4" />}
                                            </button>
                                            {((entry.submittedBy?._id || entry.submittedBy) === user?._id) && (
                                                <>
                                                    <button onClick={() => handleEdit(entry)}
                                                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-500" title="Edit">
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(entry._id)}
                                                        className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-4">
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                        className="btn-secondary text-xs disabled:opacity-50">Previous</button>
                                    <span className="text-sm text-slate-500 flex items-center">Page {page} of {pagination.totalPages}</span>
                                    <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages}
                                        className="btn-secondary text-xs disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
