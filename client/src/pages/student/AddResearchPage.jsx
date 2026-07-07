import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { researchAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    DocumentPlusIcon, PaperClipIcon, TagIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export default function AddResearchPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [proposalFile, setProposalFile] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            year: new Date().getFullYear(),
        },
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
            if (proposalFile) {
                formData.append('proposal', proposalFile);
            }

            await researchAPI.create(formData);
            setSubmitted(true);
            toast.success('Research entry submitted successfully!');
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Research Submitted!</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Your research entry has been added to the repository. An automated summary will be generated shortly.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/research')} className="btn-primary">
                            View All Research
                        </button>
                        <button onClick={() => { setSubmitted(false); setFiles([]); setTags([]); }} className="btn-secondary">
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
                    <DocumentPlusIcon className="w-7 h-7 text-green-600" />
                    Submit New Research
                </h1>
                <p className="text-slate-500 mt-1">Add your research entry with supporting files and metadata.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6" noValidate>
                {/* Title */}
                <div>
                    <label className="label">Research Title *</label>
                    <input
                        className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                        placeholder="e.g. Impact of Machine Learning on Healthcare Diagnostics"
                        {...register('title', { required: 'Title required', minLength: { value: 5, message: 'Min 5 chars' } })}
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Year and Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Year *</label>
                        <select className="input-field" {...register('year', { required: true })}>
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Tags</label>
                        <div className="flex gap-2">
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                className="input-field flex-1"
                                placeholder="Add tag, press Enter"
                            />
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
                                <button
                                    type="button"
                                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                                    className="text-primary-400 hover:text-primary-700 ml-1"
                                    aria-label={`Remove tag ${tag}`}
                                >×</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Description */}
                <div>
                    <label className="label">Description *</label>
                    <textarea
                        rows={6}
                        className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
                        placeholder="Provide a detailed description of your research..."
                        {...register('description', { required: 'Description required', minLength: { value: 20, message: 'Min 20 chars' } })}
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
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
                                    <p className="text-xs text-slate-400 mt-1">PDF up to 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
