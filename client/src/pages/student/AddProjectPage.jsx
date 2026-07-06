import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    FolderPlusIcon, PlusIcon, XMarkIcon,
    CheckCircleIcon, UserGroupIcon, LinkIcon,
} from '@heroicons/react/24/outline';
import { useForm, useFieldArray } from 'react-hook-form';

const DEPARTMENTS = ['IT', 'AMC', 'BIO'];

export default function AddProjectPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [proposalFile, setProposalFile] = useState(null);

    const { register, handleSubmit, setValue, getValues, formState: { errors }, control } = useForm({
        defaultValues: {
            title: '', department: '', academicYear: '', groupName: '',
            supervisor: '', abstract: '', githubLink: '', members: [],
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'members' });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('department', data.department);
            formData.append('academicYear', data.academicYear);
            formData.append('groupName', data.groupName);
            formData.append('supervisor', data.supervisor);
            formData.append('abstract', data.abstract);
            
            const cleanedMembers = (data.members || []).filter(m => m.name.trim() && m.regNo.trim());
            formData.append('members', JSON.stringify(cleanedMembers));
            
            if (!proposalFile) {
                toast.error('Project proposal PDF is required for submission');
                setLoading(false);
                return;
            }
            formData.append('proposal', proposalFile);

            await projectsAPI.create(formData);
            setSubmitted(true);
            toast.success('Project submitted successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto fade-in">
                <div className="card text-center py-16">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Project Submitted!</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Your project has been successfully submitted to the archive. It is now visible in the project repository.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/projects')} className="btn-primary">
                            View All Projects
                        </button>
                        <button onClick={() => { setSubmitted(false); }} className="btn-secondary">
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 fade-in pb-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FolderPlusIcon className="w-7 h-7 text-primary-600" />
                    Submit New Project
                </h1>
                <p className="text-slate-500 mt-1">Fill in the details below to add your project to the university archive.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6" noValidate>
                {/* Title */}
                <div>
                    <label className="label">Project Title *</label>
                    <input
                        className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                        placeholder="e.g. Smart Irrigation System using IoT Sensors"
                        {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })}
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Two-column fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Department *</label>
                        <select
                            className={`input-field ${errors.department ? 'border-red-400' : ''}`}
                            {...register('department', { required: 'Department is required' })}
                        >
                            <option value="">Select department</option>
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                    </div>
                    <div>
                        <label className="label">Academic Year *</label>
                        <input
                            className={`input-field ${errors.academicYear ? 'border-red-400' : ''}`}
                            placeholder="e.g. 2024/2025"
                            {...register('academicYear', {
                                required: 'Academic year required',
                                pattern: { value: /^\d{4}\/\d{4}$/, message: 'Format: YYYY/YYYY' }
                            })}
                        />
                        {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
                    </div>
                    <div>
                        <label className="label">Group Name *</label>
                        <input
                            className={`input-field ${errors.groupName ? 'border-red-400' : ''}`}
                            placeholder="e.g. Team Alpha"
                            {...register('groupName', { required: 'Group name is required' })}
                        />
                        {errors.groupName && <p className="text-xs text-red-500 mt-1">{errors.groupName.message}</p>}
                    </div>
                    <div>
                        <label className="label">Supervisor *</label>
                        <input
                            className={`input-field ${errors.supervisor ? 'border-red-400' : ''}`}
                            placeholder="e.g. Dr. John Smith"
                            {...register('supervisor', { required: 'Supervisor is required' })}
                        />
                        {errors.supervisor && <p className="text-xs text-red-500 mt-1">{errors.supervisor.message}</p>}
                    </div>
                </div>

                {/* Abstract */}
                <div>
                    <label className="label">Abstract *</label>
                    <textarea
                        rows={6}
                        className={`input-field resize-none ${errors.abstract ? 'border-red-400' : ''}`}
                        placeholder="Write your project abstract here (minimum 50 characters)..."
                        {...register('abstract', {
                            required: 'Abstract is required',
                            minLength: { value: 50, message: 'Minimum 50 characters' }
                        })}
                    />
                    {errors.abstract && <p className="text-xs text-red-500 mt-1">{errors.abstract.message}</p>}
                </div>

                {/* Proposal PDF Upload */}
                <div>
                    <label className="label font-medium text-slate-700">Proposal PDF *</label>
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
                                    <p className="text-xs text-slate-400 mt-1">PDF up to 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Members */}
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
                                    aria-label="Remove member"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2">No members added yet. Click "Add Member" above.</p>
                        )}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => navigate('/projects')} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Spinner size="sm" /> Submitting...
                            </span>
                        ) : 'Submit Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}