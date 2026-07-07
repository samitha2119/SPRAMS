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
            </form>
        </div>
    );
}
            
        



        
        


