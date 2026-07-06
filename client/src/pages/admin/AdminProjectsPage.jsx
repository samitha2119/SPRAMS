import React, { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../../services/api';
import { PageSpinner, Pagination, Modal, ConfirmDialog, Spinner, ErrorAlert, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    FolderIcon, PlusIcon, PencilIcon, TrashIcon,
    FunnelIcon, EyeIcon, UserGroupIcon, AcademicCapIcon,
    ArrowDownTrayIcon, XMarkIcon, MagnifyingGlassIcon,
    ClockIcon, CheckCircleIcon, ChartBarIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/* ── Project Form (Create / Edit) ── */
function ProjectForm({ onClose, onSuccess, initialData }) {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [proposalFile, setProposalFile] = useState(null);

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            title: initialData.title,
            department: initialData.department,
            academicYear: initialData.academicYear,
            groupName: initialData.groupName,
            supervisor: initialData.supervisor,
            abstract: initialData.abstract,
            members: initialData.members?.length ? initialData.members : [],
        } : {
            title: '', department: '', academicYear: '', groupName: '',
            supervisor: '', abstract: '', members: [],
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'members' });

    const onSubmit = async (data) => {
        if (!isEditing && !proposalFile) {
            toast.error('Project proposal PDF is required for submission');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('department', data.department);
            formData.append('academicYear', data.academicYear);
            formData.append('groupName', data.groupName);
            formData.append('supervisor', data.supervisor);
            formData.append('abstract', data.abstract);

            const cleanedMembers = data.members.filter(m => m.name.trim() && m.regNo.trim());
            formData.append('members', JSON.stringify(cleanedMembers));

            if (proposalFile) {
                formData.append('proposal', proposalFile);
            }

            if (isEditing) {
                await projectsAPI.update(initialData._id, formData);
                toast.success('Project updated successfully');
            } else {
                await projectsAPI.create(formData);
                toast.success('Project created successfully');
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} project`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
                <label className="label">Project Title <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    className={`input-field ${errors.title ? 'border-red-300' : ''}`}
                    placeholder="e.g. Smart Agriculture Monitoring System"
                    {...register('title', {
                        required: 'Title is required',
                        minLength: { value: 5, message: 'Title must be at least 5 characters' },
                    })}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="label">Department <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className={`input-field ${errors.department ? 'border-red-300' : ''}`}
                        placeholder="e.g. Computer Science"
                        {...register('department', { required: 'Department is required' })}
                    />
                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                </div>

                <div>
                    <label className="label">Academic Year <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className={`input-field ${errors.academicYear ? 'border-red-300' : ''}`}
                        placeholder="e.g. 2024/2025"
                        {...register('academicYear', {
                            required: 'Academic year is required',
                            pattern: { value: /^\d{4}\/\d{4}$/, message: 'Format: YYYY/YYYY' }
                        })}
                    />
                    {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="label">Group Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className={`input-field ${errors.groupName ? 'border-red-300' : ''}`}
                        placeholder="e.g. Group A"
                        {...register('groupName', { required: 'Group name is required' })}
                    />
                    {errors.groupName && <p className="text-xs text-red-500 mt-1">{errors.groupName.message}</p>}
                </div>

                <div>
                    <label className="label">Supervisor <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        className={`input-field ${errors.supervisor ? 'border-red-300' : ''}`}
                        placeholder="e.g. Dr. Smith"
                        {...register('supervisor', { required: 'Supervisor is required' })}
                    />
                    {errors.supervisor && <p className="text-xs text-red-500 mt-1">{errors.supervisor.message}</p>}
                </div>
            </div>

            <div>
                <label className="label">Abstract <span className="text-red-500">*</span></label>
                <textarea
                    rows={4}
                    className={`input-field resize-none ${errors.abstract ? 'border-red-300' : ''}`}
                    placeholder="Provide the project abstract (min 50 characters)..."
                    {...register('abstract', {
                        required: 'Abstract is required',
                        minLength: { value: 50, message: 'Abstract must be at least 50 characters' },
                    })}
                />
                {errors.abstract && <p className="text-xs text-red-500 mt-1">{errors.abstract.message}</p>}
            </div>

            {/* Proposal PDF Upload */}
            <div>
                <label className="label font-medium text-slate-700">Proposal PDF {!isEditing && <span className="text-red-500">*</span>}</label>
                {isEditing && initialData?.proposalFile && (
                    <div className="mb-2 text-xs text-slate-500">
                        Current: <span className="font-semibold text-primary-600">{initialData.proposalFile.originalName}</span>. Uploading a new PDF will replace it.
                    </div>
                )}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-primary-400 transition-colors bg-slate-50/50 cursor-pointer relative">
                    <div className="space-y-1 text-center">
                        {proposalFile ? (
                            <div className="flex flex-col items-center">
                                <svg className="mx-auto h-12 w-12 text-primary-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex text-sm text-slate-600 mt-2 font-medium">
                                    <span>{proposalFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProposalFile(null);
                                        }}
                                        className="ml-2 text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{(proposalFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <div className="flex text-sm text-slate-600 mt-2 justify-center">
                                    <label htmlFor="admin-proposal-upload" className="relative cursor-pointer rounded-md font-semibold text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                        <span>Upload a proposal PDF</span>
                                        <input
                                            id="admin-proposal-upload"
                                            name="admin-proposal-upload"
                                            type="file"
                                            accept=".pdf"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file && file.type === 'application/pdf') {
                                                    setProposalFile(file);
                                                } else if (file) {
                                                    toast.error('Only PDF files are allowed');
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">PDF up to 50MB</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Members */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Team Members</label>
                    <button
                        type="button"
                        onClick={() => append({ name: '', regNo: '' })}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                        <PlusIcon className="w-3.5 h-3.5" /> Add Member
                    </button>
                </div>
                <div className="space-y-2">
                    {fields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-start">
                            <input
                                type="text"
                                className="input-field flex-1"
                                placeholder="Member name"
                                {...register(`members.${idx}.name`)}
                            />
                            <input
                                type="text"
                                className="input-field w-36"
                                placeholder="Reg. No."
                                {...register(`members.${idx}.regNo`)}
                            />
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(idx)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <Spinner size="sm" /> : isEditing ? 'Save Changes' : 'Create Project'}
                </button>
            </div>
        </form>
    );
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [filters, setFilters] = useState({ department: '', academicYear: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const fetchProjects = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filters.department) params.department = filters.department;
            if (filters.academicYear) params.academicYear = filters.academicYear;
            const { data } = await projectsAPI.getAll(params);
            setProjects(data.data.projects);
            setPagination(data.data.pagination);
        } catch {
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        document.title = 'Manage Projects | SPRAMS';
        fetchProjects(1);
    }, [fetchProjects]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await projectsAPI.delete(deleteConfirm._id);
            toast.success('Project deleted');
            setDeleteConfirm(null);
            fetchProjects(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const response = await projectsAPI.exportCSV(filters);
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV exported successfully');
        } catch {
            toast.error('Failed to export CSV');
        } finally {
            setExportLoading(false);
        }
    };

    // Calculate statistics
    const stats = {
        total: pagination.total || 0,
        completed: projects.filter(p => p.status === 'Completed').length,
        inProgress: projects.filter(p => p.status === 'In Progress').length,
        pending: projects.filter(p => p.status === 'Pending').length,
    };

    return (
        <div className="space-y-6 fade-in px-2 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="animate-slide-in-left">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-primary-50 p-2 rounded-xl border border-primary-100">
                            <FolderIcon className="w-8 h-8 text-primary-600" />
                        </div>
                        Manage Projects
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        Overview of all research projects across the platform
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={exportLoading}
                        className="btn-secondary flex items-center gap-2 h-12 px-5"
                    >
                        {exportLoading ? <Spinner size="sm" /> : <ArrowDownTrayIcon className="w-4 h-4 stroke-[2]" />}
                        <span className="font-medium">Export CSV</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 h-12 px-6 shadow-lg shadow-primary-200 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200"
                    >
                        <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                        <span className="font-semibold">New Project</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-up">
                {[
                    { label: 'Total Projects', value: stats.total, icon: ChartBarIcon, color: 'blue' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircleIcon, color: 'emerald' },
                    { label: 'In Progress', value: stats.inProgress, icon: ClockIcon, color: 'amber' },
                    { label: 'Pending', value: stats.pending, icon: ExclamationCircleIcon, color: 'rose' },
                ].map((stat, i) => (
                    <div key={i} className="card p-5 group hover:border-slate-300 transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4 sm:p-5 flex flex-col lg:flex-row gap-4 items-center bg-white/70 backdrop-blur-md">
                <FunnelIcon className="w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={filters.department}
                    onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                    className="input-field py-1.5 text-sm w-full sm:w-48"
                    placeholder="Filter by department..."
                />
                <input
                    type="text"
                    value={filters.academicYear}
                    onChange={(e) => setFilters(f => ({ ...f, academicYear: e.target.value }))}
                    className="input-field py-1.5 text-sm w-full sm:w-36"
                    placeholder="e.g. 2024/2025"
                />
                <button onClick={() => setFilters({ department: '', academicYear: '' })} className="btn-ghost text-sm ml-auto">
                    Clear
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            {loading ? <PageSpinner /> : projects.length === 0 ? (
                <EmptyState
                    icon={FolderOpenIcon}
                    title="No projects found"
                    description="Try adjusting your filters or create a new project."
                    action={
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
                            <PlusIcon className="w-4 h-4 inline mr-1" /> Create Project
                        </button>
                    }
                />
            ) : (
                <div className="card p-0 overflow-hidden border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.map((project) => (
                                    <tr key={project._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="font-semibold text-slate-800 text-sm truncate" title={project.title}>
                                                    {project.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <AcademicCapIcon className="w-3.5 h-3.5" />
                                                    {project.supervisor} · {project.groupName}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge badge-blue text-[10px]">{project.department}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                            {project.academicYear}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <UserGroupIcon className="w-4 h-4" />
                                                {project.members?.length || 0} members
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    to={`/projects/${project._id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => setEditProject(project)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(project)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={fetchProjects}
                        />
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Project"
                size="lg"
            >
                <ProjectForm
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => fetchProjects(1)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editProject}
                onClose={() => setEditProject(null)}
                title="Edit Project"
                size="lg"
            >
                {editProject && (
                    <ProjectForm
                        initialData={editProject}
                        onClose={() => setEditProject(null)}
                        onSuccess={() => fetchProjects(pagination.page)}
                    />
                )}
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="Delete Project"
                message={`Are you sure you want to permanently delete "${deleteConfirm?.title}"? This action cannot be undone.`}
            />
        </div>
    );
}
