import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { 
    PencilSquareIcon, XMarkIcon, UserGroupIcon, PlusIcon,
    ArrowLeftIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useForm, useFieldArray } from 'react-hook-form';

const DEPARTMENTS = ['IT', 'AMC', 'BIO'];

export default function AdminEditProjectPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [project, setProject] = useState(null);
    const [proposalFile, setProposalFile] = useState(null);

    const { register, handleSubmit, setValue, formState: { errors }, control, reset } = useForm({
        defaultValues: {
            title: '', department: '', academicYear: '', groupName: '',
            supervisor: '', abstract: '', members: [{ name: '', regNo: '' }],
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'members' });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await projectsAPI.getById(id);
                const projectData = data.data.project;
                if (!projectData) throw new Error('Project not found');
                setProject(projectData);
                reset({
                    title: projectData.title,
                    department: projectData.department,
                    academicYear: projectData.academicYear,
                    groupName: projectData.groupName,
                    supervisor: projectData.supervisor,
                    abstract: projectData.abstract,
                    members: projectData.members?.length ? projectData.members : [{ name: '', regNo: '' }],
                });
            } catch (err) {
                toast.error('Failed to load project details');
                navigate('/admin/projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, reset, navigate]);

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('department', data.department);
            formData.append('academicYear', data.academicYear);
            formData.append('groupName', data.groupName);
            formData.append('supervisor', data.supervisor);
            formData.append('abstract', data.abstract);
            formData.append('members', JSON.stringify(data.members || []));
            if (proposalFile) {
                formData.append('proposal', proposalFile);
            }

            await projectsAPI.update(id, formData);
            toast.success('Project updated successfully!');
            navigate('/admin/projects');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 fade-in pb-12">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/admin/projects')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PencilSquareIcon className="w-7 h-7 text-primary-600" />
                        Edit Project
                    </h1>
                    <p className="text-slate-500">Update project details in the archive.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
                <div>
                    <label className="label">Project Title *</label>
                    <input
                        className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                        {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Department *</label>
                        <select
                            className={`input-field ${errors.department ? 'border-red-400' : ''}`}
                            {...register('department', { required: 'Department is required' })}
                        >
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Academic Year *</label>
                        <input
                            className={`input-field ${errors.academicYear ? 'border-red-400' : ''}`}
                            {...register('academicYear', { required: 'Academic year required' })}
                        />
                    </div>
                    <div>
                        <label className="label">Group Name *</label>
                        <input
                            className={`input-field ${errors.groupName ? 'border-red-400' : ''}`}
                            {...register('groupName', { required: 'Group name is required' })}
                        />
                    </div>
                    <div>
                        <label className="label">Supervisor *</label>
                        <input
                            className={`input-field ${errors.supervisor ? 'border-red-400' : ''}`}
                            {...register('supervisor', { required: 'Supervisor is required' })}
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Abstract *</label>
                    <textarea
                        rows={8}
                        className={`input-field resize-none ${errors.abstract ? 'border-red-400' : ''}`}
                        {...register('abstract', { required: 'Abstract is required' })}
                    />
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
                                        {project?.proposalFile ? `Current: ${project.proposalFile.originalName} (Upload to replace)` : 'PDF up to 50MB'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="label mb-0 flex items-center gap-1.5">
                            <UserGroupIcon className="w-4 h-4 text-slate-400" />
                            Group Members
                        </label>
                        <button
                            type="button"
                            onClick={() => append({ name: '', regNo: '' })}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                            <PlusIcon className="w-3.5 h-3.5" /> Add Member
                        </button>
                    </div>
                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <input
                                        className="input-field"
                                        placeholder="Full name"
                                        {...register(`members.${index}.name`, { required: 'Name required' })}
                                    />
                                </div>
                                <div className="w-36">
                                    <input
                                        className="input-field"
                                        placeholder="Reg. No"
                                        {...register(`members.${index}.regNo`, { required: 'Reg No required' })}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => navigate('/admin/projects')} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-white bg-primary-600 hover:bg-primary-700">
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Spinner size="sm" /> Updating...
                            </span>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
