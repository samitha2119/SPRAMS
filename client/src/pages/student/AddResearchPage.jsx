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
        </div>
    );
}
