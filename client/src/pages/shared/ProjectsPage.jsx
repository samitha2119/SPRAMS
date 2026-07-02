import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI, dashboardAPI } from '../../services/api';
import {
    PageSpinner, EmptyState, Pagination, ConfirmDialog, Modal, Spinner, ErrorAlert,
} from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, FolderOpenIcon, UserGroupIcon,
    ArrowDownTrayIcon, FunnelIcon, SparklesIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useForm, useFieldArray } from 'react-hook-form';

// Departments list
const DEPARTMENTS = ['IT', 'AMC', 'BIO'];

function ProjectForm({ onClose, onSuccess, initialData }) {
    const [loading, setLoading] = useState(false);
    const [improving, setImproving] = useState(false);
    const { register, handleSubmit, setValue, getValues, watch, formState: { errors }, control } = useForm({
        defaultValues: initialData || {
            title: '', department: '', academicYear: '', groupName: '',
            supervisor: '', abstract: '', members: [],
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'members' });

    const handleImproveAbstract = async () => {
        const abstract = getValues('abstract');
        if (!abstract || abstract.trim().length < 50) {
            toast.error('Abstract must be at least 50 characters to improve');
            return;
        }
        setImproving(true);
        try {
            const { data } = await dashboardAPI.improveAbstract(abstract);
            if (data.data.improved) {
                setValue('abstract', data.data.improved);
                toast.success('Abstract improved by AI! Review and modify as needed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI improvement failed');
        } finally {
            setImproving(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (initialData?._id) {
                await projectsAPI.update(initialData._id, data);
                toast.success('Project updated successfully');
            } else {
                await projectsAPI.create(data);
                toast.success('Project created successfully');
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="label">Project Title *</label>
                    <input className={`input-field ${errors.title ? 'border-red-400' : ''}`} placeholder="Enter project title"
                        {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })} />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="label">Department *</label>
                    <select className={`input-field ${errors.department ? 'border-red-400' : ''}`}
                        {...register('department', { required: 'Department is required' })}>
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                </div>

                <div>
                    <label className="label">Academic Year *</label>
                    <input className={`input-field ${errors.academicYear ? 'border-red-400' : ''}`} placeholder="e.g. 2023/2024"
                        {...register('academicYear', {
                            required: 'Academic year required',
                            pattern: { value: /^\d{4}\/\d{4}$/, message: 'Format: YYYY/YYYY' }
                        })} />
                    {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
                </div>

                <div>
                    <label className="label">Group Name *</label>
                    <input className={`input-field ${errors.groupName ? 'border-red-400' : ''}`} placeholder="e.g. Team Alpha"
                        {...register('groupName', { required: 'Group name is required' })} />
                    {errors.groupName && <p className="text-xs text-red-500 mt-1">{errors.groupName.message}</p>}
                </div>

                <div>
                    <label className="label">Supervisor *</label>
                    <input className={`input-field ${errors.supervisor ? 'border-red-400' : ''}`} placeholder="Supervisor name"
                        {...register('supervisor', { required: 'Supervisor is required' })} />
                    {errors.supervisor && <p className="text-xs text-red-500 mt-1">{errors.supervisor.message}</p>}
                </div>
            </div>

            {/* Abstract with AI improve */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Abstract *</label>
                    <button type="button" onClick={handleImproveAbstract} disabled={improving}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
                        aria-label="Improve abstract with AI">
                        {improving ? <Spinner size="sm" /> : <SparklesIcon className="w-3.5 h-3.5" />}
                        {improving ? 'Improving...' : 'Improve with AI'}
                    </button>
                </div>
                <textarea rows={5} className={`input-field resize-none ${errors.abstract ? 'border-red-400' : ''}`}
                    placeholder="Write your project abstract here (minimum 50 characters)..."
                    {...register('abstract', {
                        required: 'Abstract is required',
                        minLength: { value: 50, message: 'Minimum 50 characters' }
                    })} />
                {errors.abstract && <p className="text-xs text-red-500 mt-1">{errors.abstract.message}</p>}
            </div>

            {/* Members */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Group Members</label>
                    <button type="button" onClick={() => append({ name: '', regNo: '' })}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        <PlusIcon className="w-3.5 h-3.5" /> Add Member
                    </button>
                </div>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <input className="input-field flex-1" placeholder="Member name"
                                {...register(`members.${index}.name`, { required: 'Name required' })} />
                            <input className="input-field w-36" placeholder="Reg. No"
                                {...register(`members.${index}.regNo`, { required: 'RegNo required' })} />
                            <button type="button" onClick={() => remove(index)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Remove member">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {fields.length === 0 && <p className="text-xs text-slate-400 italic">No members added yet</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <span className="flex items-center gap-2"><Spinner size="sm" />{initialData ? 'Updating...' : 'Creating...'}</span>
                        : (initialData ? 'Update Project' : 'Create Project')}
                </button>
            </div>
        </form>
    );
}

export default function ProjectsPage() {
    const { user, isAdmin, isLecturer } = useAuth();
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ department: '', academicYear: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchProjects = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await projectsAPI.getAll({ page, limit: 20, ...filters });
            setProjects(data.data.projects);
            setPagination(data.data.pagination);
        } catch {
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        document.title = 'Project Archive | SPRAMS';
        fetchProjects(1);
    }, [fetchProjects]);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await projectsAPI.delete(deleteConfirm._id);
            toast.success('Project deleted');
            setDeleteConfirm(null);
            fetchProjects(pagination.page);
        } catch {
            toast.error('Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data } = await projectsAPI.exportCSV(filters);
            const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'projects_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Project Archive</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {pagination.total || 0} projects found
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(isAdmin || isLecturer) && (
                        <>
                            {isAdmin && (
                                <button onClick={handleExport} disabled={exporting} className="btn-secondary gap-2 text-sm">
                                    {exporting ? <Spinner size="sm" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                                    Export CSV
                                </button>
                            )}
                            <button onClick={() => { setEditProject(null); setFormOpen(true); }} className="btn-primary gap-2 text-sm">
                                <PlusIcon className="w-4 h-4" /> New Project
                            </button>
                        </>
                    )}
                    {!isAdmin && !isLecturer && user?.role === 'student' && (
                        <button onClick={() => { setEditProject(null); setFormOpen(true); }} className="btn-primary gap-2 text-sm">
                            <PlusIcon className="w-4 h-4" /> New Project
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card py-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <FunnelIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
                    <select
                        value={filters.department}
                        onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                        className="input-field w-full sm:w-56"
                        aria-label="Filter by department"
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input
                        type="text"
                        value={filters.academicYear}
                        onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
                        placeholder="Academic Year (e.g. 2023/2024)"
                        className="input-field w-full sm:w-52"
                        aria-label="Filter by academic year"
                    />
                    <button onClick={() => setFilters({ department: '', academicYear: '' })} className="btn-ghost text-sm">
                        Clear
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && <ErrorAlert message={error} />}

            {/* Content */}
            {loading ? <PageSpinner /> : (
                <>
                    {projects.length === 0 ? (
                        <EmptyState
                            icon={FolderOpenIcon}
                            title="No projects found"
                            description={isAdmin || isLecturer || user?.role === 'student' ? 'Create your first project to get started.' : 'No projects match the current filters.'}
                            action={(isAdmin || isLecturer || user?.role === 'student') && <button onClick={() => setFormOpen(true)} className="btn-primary">Add Project</button>}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    isAdmin={isAdmin}
                                    isLecturer={isLecturer}
                                    onEdit={() => { setEditProject(project); setFormOpen(true); }}
                                    onDelete={() => setDeleteConfirm(project)}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(p) => fetchProjects(p)}
                    />
                </>
            )}

            {/* Create/Edit modal */}
            <Modal
                isOpen={formOpen}
                onClose={() => { setFormOpen(false); setEditProject(null); }}
                title={editProject ? 'Edit Project' : 'Create New Project'}
                size="lg"
            >
                <ProjectForm
                    key={editProject?._id || 'new'}
                    initialData={editProject}
                    onClose={() => { setFormOpen(false); setEditProject(null); }}
                    onSuccess={() => fetchProjects(1)}
                />
            </Modal>

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="Delete Project"
                message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
            />
        </div>
    );
}

function ProjectCard({ project, isAdmin, isLecturer, onEdit, onDelete }) {
    return (
        <div className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <span className="badge badge-blue mb-2">{project.academicYear}</span>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{project.title}</h3>
                </div>
            </div>

            <div className="space-y-1.5 mb-4">
                <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Dept:</span> {project.department}
                </p>
                <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Group:</span> {project.groupName}
                </p>
                <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Supervisor:</span> {project.supervisor}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <UserGroupIcon className="w-3.5 h-3.5" />
                    {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
                </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 mb-4">{project.abstract}</p>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Link to={`/projects/${project._id}`} className="btn-secondary text-xs flex-1 justify-center py-1.5">
                    View Details
                </Link>
                {(isAdmin || isLecturer) && (
                    <>
                        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" aria-label="Edit project">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete project">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
