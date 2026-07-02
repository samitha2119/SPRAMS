import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { researchAPI, getFileUrl } from '../../services/api';
import {
    PageSpinner, EmptyState, Pagination, ConfirmDialog, Modal, Spinner, AIBadge, FileTypeBadge,
} from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, PaperClipIcon,
    SparklesIcon, TagIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const ALLOWED_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'video/mp4': ['.mp4'],
};

function ResearchForm({ onClose, onSuccess, initialData }) {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState(initialData?.tags || []);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            year: initialData?.year || CURRENT_YEAR,
        },
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted]),
        accept: ALLOWED_TYPES,
        maxSize: 1073741824,
    });

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t) && tags.length < 20) {
            setTags([...tags, t]);
            setTagInput('');
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('year', data.year);
            formData.append('tags', JSON.stringify(tags));
            files.forEach((f) => formData.append('files', f));

            if (initialData?._id) {
                await researchAPI.update(initialData._id, formData);
                toast.success('Research entry updated');
            } else {
                await researchAPI.create(formData);
                toast.success('Research entry created! Analysis summary is being generated...');
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
            <div>
                <label className="label">Title *</label>
                <input className={`input-field ${errors.title ? 'border-red-400' : ''}`} placeholder="Research title"
                    {...register('title', { required: 'Title required', minLength: { value: 5, message: 'Min 5 chars' } })} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Year *</label>
                    <select className="input-field" {...register('year', { required: true })}>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Tags</label>
                    <div className="flex gap-2">
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            className="input-field flex-1" placeholder="Add tag, press Enter" />
                        <button type="button" onClick={addTag} className="btn-secondary px-3 text-sm">+</button>
                    </div>
                </div>
            </div>

            {/* Tags display */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs border border-primary-100">
                            <TagIcon className="w-3 h-3" />
                            {tag}
                            <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}
                                className="text-primary-400 hover:text-primary-700 ml-1" aria-label={`Remove tag ${tag}`}>×</button>
                        </span>
                    ))}
                </div>
            )}

            <div>
                <label className="label">Description *</label>
                <textarea rows={5} className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
                    placeholder="Detailed research description..."
                    {...register('description', { required: 'Description required', minLength: { value: 20, message: 'Min 20 chars' } })} />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            {/* File upload */}
            <div>
                <label className="label">
                    Upload Files <span className="text-slate-400 font-normal">(PDF, JPG, PNG, MP3, WAV, MP4 — max 1GB each)</span>
                </label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}>
                    <input {...getInputProps()} />
                    <PaperClipIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                        {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
                    </p>
                </div>
                {files.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                                <span className="text-slate-600 truncate">{f.name}</span>
                                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                                    className="text-red-400 hover:text-red-600 ml-2">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <span className="flex items-center gap-2"><Spinner size="sm" />{initialData ? 'Updating...' : 'Creating...'}</span>
                        : (initialData ? 'Update' : 'Create Entry')}
                </button>
            </div>
        </form>
    );
}

function ResearchCard({ entry, isAdmin, isLecturer, onEdit, onDelete }) {
    return (
        <div className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
                <span className="badge badge-purple">{entry.year}</span>
                {entry.aiSummary && <AIBadge label="Automated Summary" />}
            </div>

            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-3">{entry.title}</h3>

            {entry.aiSummary && (
                <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 mb-3">
                    <div className="flex items-center gap-1 mb-1">
                        <SparklesIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-semibold text-purple-600">Automated Summary</span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-3">{entry.aiSummary}</p>
                </div>
            )}

            {!entry.aiSummary && (
                <p className="text-xs text-slate-600 line-clamp-3 mb-3">{entry.description}</p>
            )}

            {/* Tags */}
            {entry.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {entry.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{tag}</span>
                    ))}
                    {entry.tags.length > 4 && <span className="text-xs text-slate-400">+{entry.tags.length - 4}</span>}
                </div>
            )}

            {/* Files */}
            {entry.files?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {entry.files.slice(0, 3).map((f) => (
                        <FileTypeBadge key={f._id} type={f.fileType} />
                    ))}
                    {entry.files.length > 3 && <span className="text-xs text-slate-400">+{entry.files.length - 3} files</span>}
                </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Link to={`/research/${entry._id}`} className="btn-secondary text-xs flex-1 justify-center py-1.5">
                    View Details
                </Link>
                {(isAdmin || isLecturer) && (
                    <>
                        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" aria-label="Edit">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ResearchPage() {
    const { user, isAdmin, isLecturer } = useAuth();
    const [entries, setEntries] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ year: '', fileType: '' });
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchEntries = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.year) params.year = filters.year;
            if (filters.fileType) params.fileType = filters.fileType;
            const { data } = await researchAPI.getAll(params);
            setEntries(data.data.entries);
            setPagination(data.data.pagination);
        } catch {
            toast.error('Failed to load research entries');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        document.title = 'Research Repository | SPRAMS';
        fetchEntries(1);
    }, [fetchEntries]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await researchAPI.delete(deleteConfirm._id);
            toast.success('Entry deleted');
            setDeleteConfirm(null);
            fetchEntries(pagination.page);
        } catch {
            toast.error('Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Research Repository</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} research entries</p>
                </div>
                {(isAdmin || isLecturer || user?.role === 'student') && (
                    <button onClick={() => { setEditEntry(null); setFormOpen(true); }} className="btn-primary gap-2 text-sm">
                        <PlusIcon className="w-4 h-4" /> New Entry
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
                        className="input-field w-full sm:w-40" aria-label="Filter by year">
                        <option value="">All Years</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={filters.fileType} onChange={(e) => setFilters((f) => ({ ...f, fileType: e.target.value }))}
                        className="input-field w-full sm:w-48" aria-label="Filter by file type">
                        <option value="">All File Types</option>
                        <option value="application/pdf">PDF</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="audio/mpeg">MP3</option>
                        <option value="audio/wav">WAV</option>
                        <option value="video/mp4">MP4</option>
                    </select>
                    <button onClick={() => setFilters({ year: '', fileType: '' })} className="btn-ghost text-sm">Clear</button>
                </div>
            </div>

            {loading ? <PageSpinner /> : (
                <>
                    {entries.length === 0 ? (
                        <EmptyState
                            icon={DocumentTextIcon}
                            title="No research entries"
                            description={isAdmin || isLecturer || user?.role === 'student' ? 'Add the first research entry to the repository.' : 'No entries match the current filters.'}
                            action={(isAdmin || isLecturer || user?.role === 'student') && <button onClick={() => setFormOpen(true)} className="btn-primary">Add Entry</button>}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {entries.map((entry) => (
                                <ResearchCard key={entry._id} entry={entry} isAdmin={isAdmin} isLecturer={isLecturer}
                                    onEdit={() => { setEditEntry(entry); setFormOpen(true); }}
                                    onDelete={() => setDeleteConfirm(entry)} />
                            ))}
                        </div>
                    )}
                    <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchEntries} />
                </>
            )}

            <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditEntry(null); }}
                title={editEntry ? 'Edit Research Entry' : 'New Research Entry'} size="lg">
                <ResearchForm key={editEntry?._id || 'new'} initialData={editEntry}
                    onClose={() => { setFormOpen(false); setEditEntry(null); }}
                    onSuccess={() => fetchEntries(1)} />
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete} loading={deleteLoading} title="Delete Research Entry"
                message={`Delete "${deleteConfirm?.title}"? All associated files will be removed.`} />
        </div>
    );
}
