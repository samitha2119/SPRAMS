import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { researchAPI, getFileUrl } from '../../services/api';
import { PageSpinner, ErrorAlert, AIBadge, FileTypeBadge } from '../../components/ui/Common';
import {
    ChevronLeftIcon, DocumentTextIcon, CalendarIcon,
    TagIcon, UserIcon, ArrowLeftIcon, SparklesIcon,
    ArrowDownTrayIcon, EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ResearchDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewFile, setPreviewFile] = useState(null);

    useEffect(() => {
        const fetchEntry = async () => {
            try {
                const { data } = await researchAPI.getOne(id);
                setEntry(data.data.entry);
            } catch (err) {
                setError('Research entry not found or access denied.');
                toast.error('Failed to load research details');
            } finally {
                setLoading(false);
            }
        };
        fetchEntry();
    }, [id]);

    const handleDownload = (file) => {
        const url = getFileUrl(entry._id, file._id);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handlePreview = (file) => {
        const url = getFileUrl(entry._id, file._id);
        setPreviewFile({ ...file, url });
    };

    if (loading) return <PageSpinner />;
    if (error) return (
        <div className="max-w-4xl mx-auto space-y-4">
            <Link to="/research" className="btn-ghost gap-2 text-sm">
                <ChevronLeftIcon className="w-4 h-4" /> Back to repository
            </Link>
            <ErrorAlert message={error} />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 fade-in pb-12">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />

                <div className="p-8 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="badge badge-purple px-3 py-1 text-sm font-bold">
                            {entry.year}
                        </span>
                        {entry.aiSummary && <AIBadge label="AI Enhanced" />}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-8">
                        {entry.title}
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Summary & Description Section */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* AI Summary (High Priority) */}
                            {entry.aiSummary && (
                                <section className="relative group">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-2xl p-6 border border-purple-100/80 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <SparklesIcon className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <h2 className="text-lg font-bold text-purple-900 uppercase tracking-wider text-sm">AI-Generated Summary</h2>
                                        </div>
                                        <p className="text-purple-900/80 leading-relaxed text-lg italic">
                                            "{entry.aiSummary}"
                                        </p>
                                    </div>
                                </section>
                            )}

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Description</h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {entry.description}
                                    </p>
                                </div>
                            </section>

                            {/* Tags Section */}
                            {entry.tags?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                                        <TagIcon className="w-5 h-5" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Metadata Tags</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {entry.tags.map((tag) => (
                                            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium border border-slate-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Attachments Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <h2 className="text-xl font-bold text-slate-800">Research Documents & Media</h2>
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                        {entry.files?.length || 0} files
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {entry.files?.map((file) => (
                                        <div key={file._id} className="group bg-white rounded-xl border border-slate-200 p-1 pr-4 overflow-hidden flex items-center hover:border-primary-300 hover:shadow-md transition-all">
                                            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center flex-shrink-0 mr-4">
                                                <FileTypeBadge type={file.fileType} />
                                            </div>
                                            <div className="flex-1 min-w-0 mr-4">
                                                <p className="text-sm font-bold text-slate-800 truncate" title={file.originalName}>
                                                    {file.originalName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                                                    {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType.split('/')[1]}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                {(file.fileType.startsWith('image') || file.fileType === 'application/pdf') && (
                                                    <button
                                                        onClick={() => handlePreview(file)}
                                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Preview"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!entry.files || entry.files.length === 0) && (
                                        <p className="text-sm text-slate-400 italic col-span-2">No files attached to this entry</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="card bg-slate-50 border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Contribution</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Author / Contributor</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-800">
                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">{entry.authorId?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Publication Year</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-800">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold text-lg">{entry.year}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
                                        ARCHIVE ID: {entry._id}<br />
                                        RECORD CREATED: {new Date(entry.createdAt).toLocaleString()}<br />
                                        LAST MODIFIED: {new Date(entry.updatedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="card border-emerald-100 bg-emerald-50/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-slate-800">Research Integrity</h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    All contents in this repository are vetted academic contributions. Access is restricted to authorized personnel of the University of Vavuniya.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Preview Modal (Overlay) */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
                    <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileTypeBadge type={previewFile.fileType} />
                                <span className="font-bold text-slate-800 truncate max-w-md">{previewFile.originalName}</span>
                            </div>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center">
                            {previewFile.fileType.startsWith('image') ? (
                                <img src={previewFile.url} alt={previewFile.originalName} className="max-w-full h-auto p-4 shadow-lg rounded" />
                            ) : previewFile.fileType === 'application/pdf' ? (
                                <iframe src={`${previewFile.url}#toolbar=0`} title="PDF Preview" className="w-full h-full" />
                            ) : (
                                <div className="text-center p-12">
                                    <DocumentTextIcon className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 mt-2 font-medium">Preview not available for this file type</p>
                                    <button onClick={() => handleDownload(previewFile)} className="btn-primary mt-6">Download to View</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
