import React, { useState, useEffect, useCallback, useRef } from 'react';
import { researchAPI, getFileUrl } from '../../services/api';
import { PageSpinner, Pagination, Modal, ConfirmDialog, Spinner, ErrorAlert, EmptyState, FileTypeBadge, TagChip } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
    DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon,
    FunnelIcon, EyeIcon, PaperClipIcon, XMarkIcon,
    ArrowUpTrayIcon, DocumentArrowDownIcon,
    CalendarIcon, CloudArrowUpIcon, HashtagIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/* ── Research Form (Create / Edit) ── */
function ResearchForm({ onClose, onSuccess, initialData }) {
    const isEditing = !!initialData;
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [proposalFile, setProposalFile] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState(initialData?.tags || []);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            title: initialData.title,
            description: initialData.description,
            year: initialData.year,
        } : {
            title: '', description: '', year: new Date().getFullYear(),
        }
    });

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t) && tags.length < 20) {
            setTags([...tags, t]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('year', data.year);
            tags.forEach(tag => formData.append('tags', tag));
            files.forEach(file => formData.append('files', file));
            if (proposalFile) {
                formData.append('proposal', proposalFile);
            }

            if (isEditing) {
                await researchAPI.update(initialData._id, formData);
                toast.success('Research entry updated');
            } else {
                await researchAPI.create(formData);
                toast.success('Research entry created');
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} entry`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
                <label className="label">Title <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    className={`input-field ${errors.title ? 'border-red-300' : ''}`}
                    placeholder="e.g. Deep Learning for Medical Image Segmentation"
                    {...register('title', {
                        required: 'Title is required',
                        minLength: { value: 5, message: 'Title must be at least 5 characters' },
                    })}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
                <label className="label">Year <span className="text-red-500">*</span></label>
                <input
                    type="number"
                    className={`input-field w-32 ${errors.year ? 'border-red-300' : ''}`}
                    {...register('year', {
                        required: 'Year is required',
                        min: { value: 2000, message: 'Min year 2000' },
                        max: { value: 2100, message: 'Max year 2100' },
                        valueAsNumber: true,
                    })}
                />
                {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>}
            </div>

            <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea
                    rows={5}
                    className={`input-field resize-none ${errors.description ? 'border-red-300' : ''}`}
                    placeholder="Provide a detailed description (min 20 characters)..."
                    {...register('description', {
                        required: 'Description is required',
                        minLength: { value: 20, message: 'Description must be at least 20 characters' },
                    })}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            {/* Tags */}
            <div>
                <label className="label">Tags</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="input-field flex-1 text-sm"
                        placeholder="Type and press Enter to add..."
                    />
                    <button type="button" onClick={addTag} className="btn-secondary text-sm px-3">Add</button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map(tag => (
                            <span key={tag} className="badge badge-blue flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Proposal PDF Upload */}
            <div>
                <label className="label font-medium text-slate-700">Proposal PDF (Optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-primary-400 transition-colors bg-slate-50/50 cursor-pointer relative">
                    <div className="space-y-1 text-center">
                        {proposalFile ? (
                            <div className="flex flex-col items-center">
                                <svg className="mx-auto h-12 w-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <div className="flex text-sm text-slate-600 mt-2 justify-center">
                                    <label htmlFor="proposal-upload" className="relative cursor-pointer rounded-md font-semibold text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                        <span>Upload a proposal PDF</span>
                                        <input
                                            id="proposal-upload"
                                            name="proposal-upload"
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
                                <p className="text-xs text-slate-400 mt-1">
                                    {initialData?.proposalFile ? `Current: ${initialData.proposalFile.originalName} (Upload to replace)` : 'PDF up to 50MB'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div>
                <label className="label">Attachments</label>
                {isEditing && initialData.files?.length > 0 && (
                    <div className="mb-2 text-xs text-slate-500">
                        <span className="font-medium">{initialData.files.length}</span> existing file(s). New uploads will be added.
                    </div>
                )}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                >
                    <ArrowUpTrayIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to upload files (PDF, JPG, PNG, MP3, WAV, MP4)</p>
                    <p className="text-xs text-slate-400 mt-1">Max 10 files</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav,.mp4"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="hidden"
                />
                {files.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                <PaperClipIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate flex-1">{file.name}</span>
                                <span className="text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <Spinner size="sm" /> : isEditing ? 'Save Changes' : 'Create Entry'}
                </button>
            </div>
        </form>
    );
}

export default function AdminResearchPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [yearFilter, setYearFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchEntries = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (yearFilter) params.year = yearFilter;
            const { data } = await researchAPI.getAll(params);
            setEntries(data.data.entries || data.data.research || []);
            setPagination(data.data.pagination);
        } catch {
            setError('Failed to load research entries.');
        } finally {
            setLoading(false);
        }
    }, [yearFilter]);

    useEffect(() => {
        document.title = 'Manage Research | SPRAMS';
        fetchEntries(1);
    }, [fetchEntries]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await researchAPI.delete(deleteConfirm._id);
            toast.success('Research entry deleted');
            setDeleteConfirm(null);
            fetchEntries(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate statistics
    const stats = {
        total: pagination.total || 0,
        latestYear: entries.length > 0 ? Math.max(...entries.map(e => e.year)) : '-',
        totalFiles: entries.reduce((acc, e) => acc + (e.files?.length || 0), 0),
        uniqueTags: new Set(entries.flatMap(e => e.tags || [])).size
    };

    return (
        <div className="space-y-6 fade-in px-2 sm:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="animate-slide-in-left">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-primary-50 p-2 rounded-xl border border-primary-100">
                            <DocumentTextIcon className="w-8 h-8 text-primary-600" />
                        </div>
                        Manage Research
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        Overview of research outputs and archival documents
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 h-12 px-6 shadow-lg shadow-primary-200 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200"
                >
                    <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                    <span className="font-semibold">Add Research</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-up">
                {[
                    { label: 'Total Research', value: stats.total, icon: ChartBarIcon, color: 'blue' },
                    { label: 'Latest Year', value: stats.latestYear, icon: CalendarIcon, color: 'emerald' },
                    { label: 'Total Files', value: stats.totalFiles, icon: CloudArrowUpIcon, color: 'amber' },
                    { label: 'Unique Tags', value: stats.uniqueTags, icon: HashtagIcon, color: 'indigo' },
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
                <div className="flex-1 w-full max-w-sm">
                    <input
                        type="number"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="input-field py-2 text-sm w-full"
                        placeholder="Filter by research year..."
                    />
                </div>
                <button 
                    onClick={() => setYearFilter('')} 
                    className="btn-ghost text-sm ml-auto h-10 px-4 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                >
                    <XMarkIcon className="w-4 h-4" />
                    Reset
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            {loading ? <PageSpinner /> : entries.length === 0 ? (
                <EmptyState
                    icon={DocumentTextIcon}
                    title="No research entries found"
                    description="Adjust filters or create a new research entry."
                    action={
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
                            <PlusIcon className="w-4 h-4 inline mr-1" /> Create Entry
                        </button>
                    }
                />
            ) : (
                <div className="card p-0 overflow-hidden border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Files</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="font-semibold text-slate-800 text-sm truncate" title={entry.title}>
                                                    {entry.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                    {entry.description?.substring(0, 80)}...
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge badge-blue text-[10px]">{entry.year}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-32">
                                                {entry.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {entry.tags?.length > 3 && (
                                                    <span className="text-[10px] text-slate-400">+{entry.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <PaperClipIcon className="w-4 h-4" />
                                                {entry.files?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    to={`/research/${entry._id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => setEditEntry(entry)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(entry)}
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
                            onPageChange={fetchEntries}
                        />
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Research Entry"
                size="lg"
            >
                <ResearchForm
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => fetchEntries(1)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editEntry}
                onClose={() => setEditEntry(null)}
                title="Edit Research Entry"
                size="lg"
            >
                {editEntry && (
                    <ResearchForm
                        initialData={editEntry}
                        onClose={() => setEditEntry(null)}
                        onSuccess={() => fetchEntries(pagination.page)}
                    />
                )}
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="Delete Research Entry"
                message={`Are you sure you want to permanently delete "${deleteConfirm?.title}"? All associated files will also be removed.`}
            />
        </div>
    );
}
