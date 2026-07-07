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
            </form>
        </div>
    );
}
