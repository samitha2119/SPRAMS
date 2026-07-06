import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    researchAPI,
    studentResearchAPI,
    getFileUrl,
    getResearchProposalUrl,
    getResearchFinalReportUrl,
    getStudentResearchProposalUrl,
    getStudentResearchFinalReportUrl,
    tokenStorage
} from '../../services/api';
import { PageSpinner, ErrorAlert, FileTypeBadge, Modal, Spinner } from '../../components/ui/Common';
import {
    ChevronLeftIcon, DocumentTextIcon, CalendarIcon,
    TagIcon, UserIcon, ArrowLeftIcon,
    ArrowDownTrayIcon, EyeIcon, DocumentArrowDownIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

// --- Citation Format Helpers ---
const getInitialsAPA = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
    return `${lastName}, ${initials}`;
};

const getInitialsIEEE = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
    return `${initials} ${lastName}`;
};

const getInitialsHarvard = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0]).join('');
    return `${lastName}, ${initials}.`;
};

const formatAPAAuthors = (authors) => {
    if (!authors || authors.length === 0) return "Unknown Author";
    const formatted = authors.map(a => getInitialsAPA(a.name || a)).filter(Boolean);
    if (formatted.length === 0) return "Unknown Author";
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
    return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
};

const formatIEEEAuthors = (authors) => {
    if (!authors || authors.length === 0) return "Unknown Author";
    const formatted = authors.map(a => getInitialsIEEE(a.name || a)).filter(Boolean);
    if (formatted.length === 0) return "Unknown Author";
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
    return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
};

const formatHarvardAuthors = (authors) => {
    if (!authors || authors.length === 0) return "Unknown Author";
    const formatted = authors.map(a => getInitialsHarvard(a.name || a)).filter(Boolean);
    if (formatted.length === 0) return "Unknown Author";
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
    return `${formatted.slice(0, -1).join(', ')} and ${formatted[formatted.length - 1]}`;
};

export default function ResearchDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewFile, setPreviewFile] = useState(null);
    const [isStudentResearch, setIsStudentResearch] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showCitationModal, setShowCitationModal] = useState(false);

    const fetchEntry = async () => {
        try {
            // Try standard research first
            const { data } = await researchAPI.getOne(id);
            setEntry(data.data.entry);
            setIsStudentResearch(false);
        } catch (err) {
            // If it fails, try student research
            try {
                const { data } = await studentResearchAPI.getOne(id);
                setEntry(data.data.entry);
                setIsStudentResearch(true);
            } catch (studentErr) {
                setError('Research entry not found or access denied.');
                toast.error('Failed to load research details');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntry();
    }, [id]);

    const handleDownload = async (file) => {
        try {
            const token = tokenStorage.getAccess();
            const url = getFileUrl(entry._id, file._id);
            const response = await fetch(`${url}?token=${token}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err.message || 'Failed to download file');
                return;
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handleDownloadProposal = async () => {
        try {
            const token = tokenStorage.getAccess();
            const url = isStudentResearch ? getStudentResearchProposalUrl(entry._id) : getResearchProposalUrl(entry._id);
            const response = await fetch(`${url}?token=${token}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err.message || 'Proposal PDF not available');
                return;
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `${entry.title}_Proposal.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handleDownloadFinalReport = async () => {
        try {
            const token = tokenStorage.getAccess();
            const url = isStudentResearch ? getStudentResearchFinalReportUrl(entry._id) : getResearchFinalReportUrl(entry._id);
            const response = await fetch(`${url}?token=${token}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err.message || 'Final report PDF not available');
                return;
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `${entry.title}_Final_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handlePreview = (file) => {
        const token = tokenStorage.getAccess();
        const url = `${getFileUrl(entry._id, file._id)}?token=${token}`;
        setPreviewFile({ ...file, url });
    };

    const handlePreviewProposal = () => {
        const token = tokenStorage.getAccess();
        const url = `${isStudentResearch ? getStudentResearchProposalUrl(entry._id) : getResearchProposalUrl(entry._id)}?token=${token}&disposition=inline`;
        setPreviewFile({
            originalName: entry.proposalFile.originalName,
            url: url,
            fileType: entry.proposalFile.fileType || 'application/pdf',
            isProposal: true
        });
    };

    const handlePreviewFinalReport = () => {
        const token = tokenStorage.getAccess();
        const url = `${isStudentResearch ? getStudentResearchFinalReportUrl(entry._id) : getResearchFinalReportUrl(entry._id)}?token=${token}&disposition=inline`;
        setPreviewFile({
            originalName: entry.finalReportFile.originalName,
            url: url,
            fileType: entry.finalReportFile.fileType || 'application/pdf',
            isFinalReport: true
        });
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            if (isStudentResearch) {
                await studentResearchAPI.deleteFile(entry._id, fileId);
            } else {
                await researchAPI.deleteFile(entry._id, fileId);
            }
            toast.success('File deleted successfully');
            await fetchEntry();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete file');
        }
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

    const canManage = user?.role === 'admin' || user?.role === 'lecturer' || (entry?.submittedBy?._id || entry?.submittedBy) === user?._id || (entry?.authorId?._id || entry?.authorId) === user?._id;

    const proposalFile = entry.proposalFile?.filePath ? {
        ...entry.proposalFile,
        isProposal: true,
        displayName: entry.proposalFile.originalName,
        categoryLabel: 'Proposal',
        fileType: entry.proposalFile.fileType || 'application/pdf',
        fileSize: entry.proposalFile.fileSize,
        onPreview: handlePreviewProposal,
        onDownload: handleDownloadProposal
    } : null;

    const finalReportFile = entry.finalReportFile?.filePath ? {
        ...entry.finalReportFile,
        isFinalReport: true,
        displayName: entry.finalReportFile.originalName,
        categoryLabel: 'End Report',
        fileType: entry.finalReportFile.fileType || 'application/pdf',
        fileSize: entry.finalReportFile.fileSize,
        onPreview: handlePreviewFinalReport,
        onDownload: handleDownloadFinalReport
    } : null;

    const supplementaryFiles = (entry.files || []).map(file => ({
        ...file,
        displayName: file.originalName,
        categoryLabel: file.category ? file.category.charAt(0).toUpperCase() + file.category.slice(1) : 'Supplementary',
        fileType: file.fileType,
        fileSize: file.fileSize,
        onPreview: () => handlePreview(file),
        onDownload: () => handleDownload(file),
        onDelete: () => handleDeleteFile(file._id)
    }));

    const documentFiles = [
        ...(proposalFile ? [proposalFile] : []),
        ...(finalReportFile ? [finalReportFile] : []),
        ...supplementaryFiles.filter(f => f.fileType === 'application/pdf' || f.categoryLabel === 'Pdf' || f.categoryLabel === 'Document')
    ];

    const videoFiles = supplementaryFiles.filter(f => f.fileType?.startsWith('video/') || f.categoryLabel === 'Video');
    const audioFiles = supplementaryFiles.filter(f => f.fileType?.startsWith('audio/') || f.categoryLabel === 'Audio');
    const otherFiles = supplementaryFiles.filter(f => 
        !documentFiles.includes(f) && 
        !videoFiles.includes(f) && 
        !audioFiles.includes(f)
    );

    const keywordsList = isStudentResearch ? entry.keywords : entry.tags;

    const getAuthorsList = () => {
        if (!entry) return [];
        if (isStudentResearch) {
            if (entry.researchers && entry.researchers.length > 0) {
                return entry.researchers;
            }
            return [entry.submittedBy?.name || 'Unknown'];
        } else {
            return [entry.authorId?.name || 'Unknown'];
        }
    };
    const authors = getAuthorsList();
    const year = entry ? (isStudentResearch ? (entry.academicYear || new Date(entry.createdAt).getFullYear()) : (entry.year || new Date(entry.createdAt).getFullYear())) : '';
    
    const apaCitation = entry ? `${formatAPAAuthors(authors)}. (${year}). ${entry.title}. Department of ${entry.department || 'Computer Science'}, University of Vavuniya.` : '';
    const ieeeCitation = entry ? `${formatIEEEAuthors(authors)}, "${entry.title}," Dept. ${entry.department || 'Computer Science'}, Univ. Vavuniya, ${year}.` : '';
    const harvardCitation = entry ? `${formatHarvardAuthors(authors)} ${year}, ${entry.title}, Department of ${entry.department || 'Computer Science'}, University of Vavuniya.` : '';

    const copyToClipboard = (text, style) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${style} Citation to Clipboard!`);
    };

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
                <button
                    onClick={() => setShowCitationModal(true)}
                    className="flex items-center gap-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                    <DocumentTextIcon className="w-4 h-4" /> Cite this Work
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />

                <div className="p-8 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="badge badge-purple px-3 py-1 text-sm font-bold">
                            {isStudentResearch ? entry.academicYear : entry.year}
                        </span>
                        {(isStudentResearch || entry.status) && (
                            <span className={`badge px-3 py-1 text-sm font-bold uppercase tracking-wider ${
                                entry.status === 'Completed' ? 'badge-green bg-emerald-100 text-emerald-800' :
                                entry.status === 'Approved' ? 'badge-green bg-green-100 text-green-800' :
                                entry.status === 'Ongoing' ? 'badge-blue bg-blue-100 text-blue-800' :
                                entry.status === 'Proposed' ? 'badge-yellow bg-amber-100 text-amber-800' :
                                'badge-red bg-rose-100 text-rose-800'
                            }`}>
                                {entry.status || 'Proposed'}
                            </span>
                        )}
                        {entry.department && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                                {entry.department}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-8">
                        {entry.title}
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Summary & Description Section */}
                        <div className="lg:col-span-2 space-y-10">

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {isStudentResearch ? 'Abstract' : 'Description'}
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {isStudentResearch ? entry.abstract : entry.description}
                                    </p>
                                </div>
                            </section>

                            {/* Keywords / Tags Section */}
                            {keywordsList?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                                        <TagIcon className="w-5 h-5" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Metadata Tags</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {keywordsList.map((tag) => (
                                            <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium border border-slate-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Attachments Section with Split Tables */}
                            <section className="space-y-8">
                                <FileTable
                                    title="Research Documents"
                                    files={documentFiles}
                                    icon={<DocumentTextIcon className="w-6 h-6 text-blue-600" />}
                                    typeColor="bg-blue-100 text-blue-800"
                                    canManage={canManage}
                                    emptyMessage="No research documents uploaded yet."
                                />

                                <FileTable
                                    title="Video Presentations"
                                    files={videoFiles}
                                    icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                                    typeColor="bg-amber-100 text-amber-800"
                                    canManage={canManage}
                                />

                                <FileTable
                                    title="Audio Recordings"
                                    files={audioFiles}
                                    icon={<svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
                                    typeColor="bg-purple-100 text-purple-800"
                                    canManage={canManage}
                                />

                                <FileTable
                                    title="Other Supplementary Files"
                                    files={otherFiles}
                                    icon={<svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                    typeColor="bg-slate-100 text-slate-800"
                                    canManage={canManage}
                                />
                            </section>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="card bg-slate-50 border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Contribution</h3>
                                <div className="space-y-4">
                                    {isStudentResearch ? (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Researchers</label>
                                                <div className="flex flex-col gap-1.5 mt-1 text-slate-800">
                                                    {entry.researchers?.map((r, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                            <span className="font-semibold text-sm">{r}</span>
                                                        </div>
                                                    ))}
                                                    {(!entry.researchers || entry.researchers.length === 0) && (
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                                            <span className="font-semibold text-sm">{entry.submittedBy?.name || 'Unknown'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {entry.supervisor && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Supervisor</label>
                                                    <div className="flex items-center gap-2 mt-1 text-slate-800">
                                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                                        <span className="font-semibold text-sm">{entry.supervisor}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {entry.department && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                                    <div className="flex items-center gap-2 mt-1 text-slate-800">
                                                        <span className="font-semibold text-sm">{entry.department}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                                                <div className="flex items-center gap-2 mt-1 text-slate-800">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                    <span className="font-semibold text-lg">{entry.academicYear}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
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

                            {entry.status !== 'Completed' && (
                                <div className="card border-dashed border-2 border-green-200 bg-green-50/20 p-5">
                                    <h3 className="font-bold text-slate-800 mb-2">Complete Your Research</h3>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Submit your final GitHub repository link, end report PDF, and related media/files to archive this research.
                                    </p>
                                    <button
                                        onClick={() => setShowFinalizeModal(true)}
                                        className="btn-primary text-xs w-full py-2 justify-center bg-green-600 hover:bg-green-700 hover:border-green-700"
                                    >
                                        Finalize Submission
                                    </button>
                                </div>
                            )}

                            {/* GitHub Repository */}
                            {entry.githubLink && (
                                <div className="card border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <h3 className="font-bold text-slate-800">Source Code</h3>
                                    </div>
                                    <a
                                        href={entry.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors group"
                                    >
                                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <span className="truncate">{entry.githubLink.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                                        <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* File Preview Modal (Overlay) */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/90 backdrop-blur-sm">
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ width: '96vw', height: '96vh' }}
                    >
                        {/* Modal Header */}
                        <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileTypeBadge type={previewFile.fileType} />
                                <span className="font-bold text-slate-800 truncate">{previewFile.originalName}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <button
                                    onClick={() => {
                                        if (previewFile.isProposal) handleDownloadProposal();
                                        else if (previewFile.isFinalReport) handleDownloadFinalReport();
                                        else handleDownload(previewFile);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                    title="Download file"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                    title="Close preview"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden bg-slate-100">
                            {previewFile.fileType.startsWith('image') ? (
                                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                                    <img
                                        src={previewFile.url}
                                        alt={previewFile.originalName}
                                        className="max-w-full max-h-full object-contain shadow-lg rounded"
                                    />
                                </div>
                            ) : previewFile.fileType === 'application/pdf' ? (
                                <iframe
                                    src={previewFile.url}
                                    title="PDF Preview"
                                    className="w-full h-full border-0"
                                    style={{ minHeight: '100%' }}
                                />
                            ) : previewFile.fileType.startsWith('video/') ? (
                                <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950">
                                    <video
                                        src={previewFile.url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-full rounded-xl shadow-2xl"
                                    />
                                </div>
                            ) : previewFile.fileType.startsWith('audio/') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50">
                                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-6 shadow-sm">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                    <audio
                                        src={previewFile.url}
                                        controls
                                        autoPlay
                                        className="w-full max-w-md"
                                    />
                                    <p className="text-sm text-slate-500 font-medium mt-4">Playing: {previewFile.originalName}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                    <DocumentTextIcon className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 mt-2 font-medium">Preview not available for this file type</p>
                                    <button
                                        onClick={() => {
                                            if (previewFile.isProposal) handleDownloadProposal();
                                            else if (previewFile.isFinalReport) handleDownloadFinalReport();
                                            else handleDownload(previewFile);
                                        }}
                                        className="btn-primary mt-6 bg-green-600 hover:bg-green-700"
                                    >
                                        Download to View
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showFinalizeModal && (
                <Modal
                    isOpen={showFinalizeModal}
                    onClose={() => setShowFinalizeModal(false)}
                    title="Finalize Research Submission"
                    size="md"
                >
                    <FinalizeResearchForm
                        entry={entry}
                        isStudentResearch={isStudentResearch}
                        onClose={() => setShowFinalizeModal(false)}
                        onSuccess={async () => {
                            const { data } = isStudentResearch
                                ? await studentResearchAPI.getOne(id)
                                : await researchAPI.getOne(id);
                            setEntry(data.data.entry);
                            setShowFinalizeModal(false);
                        }}
                    />
                </Modal>
            )}
            {showCitationModal && (
                <Modal
                    isOpen={showCitationModal}
                    onClose={() => setShowCitationModal(false)}
                    title="Cite this Work"
                    size="md"
                >
                    <div className="space-y-6 pt-2">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Use the following pre-formatted citations to reference this academic asset in your reports, papers, or bibliographies.
                        </p>
                        
                        {/* APA Style */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">APA Style</span>
                                <button
                                    onClick={() => copyToClipboard(apaCitation, 'APA')}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 hover:bg-primary-100"
                                >
                                    Copy APA
                                </button>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-mono select-all bg-white p-3 rounded-lg border border-slate-100 break-words">
                                {apaCitation}
                            </p>
                        </div>

                        {/* IEEE Style */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IEEE Style</span>
                                <button
                                    onClick={() => copyToClipboard(ieeeCitation, 'IEEE')}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 hover:bg-primary-100"
                                >
                                    Copy IEEE
                                </button>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-mono select-all bg-white p-3 rounded-lg border border-slate-100 break-words">
                                {ieeeCitation}
                            </p>
                        </div>

                        {/* Harvard Style */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group hover:border-primary-300 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harvard Style</span>
                                <button
                                    onClick={() => copyToClipboard(harvardCitation, 'Harvard')}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 hover:bg-primary-100"
                                >
                                    Copy Harvard
                                </button>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-mono select-all bg-white p-3 rounded-lg border border-slate-100 break-words">
                                {harvardCitation}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowCitationModal(false)}
                                className="btn-secondary w-full py-2.5 rounded-xl font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function FinalizeResearchForm({ entry, isStudentResearch, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [finalReport, setFinalReport] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { githubLink: entry.githubLink || '' }
    });

    const onSubmit = async (data) => {
        if (!finalReport) {
            toast.error('Final End Report PDF is required');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('githubLink', data.githubLink);
            formData.append('finalReport', finalReport);
            mediaFiles.forEach((file) => {
                formData.append('files', file);
            });

            if (isStudentResearch) {
                await studentResearchAPI.update(entry._id, formData);
            } else {
                await researchAPI.update(entry._id, formData);
            }
            toast.success('Research finalized successfully!');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to finalize research');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div>
                <label className="label">GitHub Repository (Optional)</label>
                <input
                    type="url"
                    className={`input-field ${errors.githubLink ? 'border-red-400' : ''}`}
                    placeholder="https://github.com/username/repository"
                    {...register('githubLink', {
                        validate: value => {
                            if (!value) return true;
                            return /^https?:\/\/(www\.)?github\.com\/.+/i.test(value) || 'Must be a valid GitHub URL';
                        }
                    })}
                />
                {errors.githubLink && <p className="text-xs text-red-500 mt-1">{errors.githubLink.message}</p>}
            </div>

            <div>
                <label className="label">Final End Report (PDF) *</label>
                {finalReport ? (
                    <div className="mt-1 flex justify-center px-4 py-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 relative">
                        <div className="space-y-1 text-center">
                            <div className="flex flex-col items-center">
                                <svg className="mx-auto h-8 w-8 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs font-semibold text-slate-700 mt-1">{finalReport.name}</span>
                                <button type="button" onClick={() => setFinalReport(null)} className="text-xs text-red-500 font-bold hover:underline mt-1 relative z-10">Remove</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <label className="mt-1 flex justify-center px-4 py-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-green-400 bg-slate-50 transition-colors cursor-pointer relative">
                        <div className="space-y-1 text-center">
                            <div className="flex flex-col items-center">
                                <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="font-bold text-green-600 hover:text-green-500 text-xs">
                                    Upload report PDF
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file && file.type === 'application/pdf') {
                                            setFinalReport(file);
                                        } else if (file) {
                                            toast.error('Only PDF files are allowed');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </label>
                )}
            </div>

            <div>
                <label className="label">Supplementary Files (Video, Audio, Datasets, etc.)</label>
                <label className="mt-1 flex justify-center px-4 py-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-green-400 bg-slate-50 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                        <div className="flex flex-col items-center">
                            <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-bold text-green-600 hover:text-green-500 text-xs">
                                Upload video, audio or other files
                            </span>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav,.mp4"
                                className="sr-only"
                                onChange={(e) => {
                                    const selected = Array.from(e.target.files);
                                    setMediaFiles((prev) => [...prev, ...selected]);
                                }}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, MP3, WAV, MP4 up to 1GB each</p>
                        </div>
                    </div>
                </label>
                {mediaFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {mediaFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                                <span className="text-slate-700 truncate font-semibold">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="text-red-500 font-bold hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700">
                    {submitting ? <Spinner size="sm" /> : 'Finalize & Complete'}
                </button>
            </div>
        </form>
    );
}

function FileTable({ title, files, icon, typeColor, canManage, emptyMessage }) {
    if (files.length === 0) {
        if (!emptyMessage) return null;
        return (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    {icon}
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 italic text-sm">
                    {emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">File Name</th>
                            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Category</th>
                            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Size</th>
                            <th scope="col" className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {files.map((file, idx) => {
                            const isPdf = file.fileType === 'application/pdf';
                            const isImage = file.fileType?.startsWith('image/');
                            const isAudio = file.fileType?.startsWith('audio/');
                            const isVideo = file.fileType?.startsWith('video/');

                            return (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                {isPdf && (
                                                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                                {isImage && (
                                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a1 1 0 011.414 0L16 17m0 0l1-1m-1 1M8 12a4 4 0 108 0 4 4 0 00-8 0z" />
                                                    </svg>
                                                )}
                                                {isAudio && (
                                                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                    </svg>
                                                )}
                                                {isVideo && (
                                                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                                {!isPdf && !isImage && !isAudio && !isVideo && (
                                                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="truncate max-w-xs font-bold text-slate-700" title={file.displayName}>{file.displayName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                                            file.categoryLabel === 'Proposal' ? 'bg-emerald-100 text-emerald-800' :
                                            file.categoryLabel === 'End Report' ? 'bg-blue-100 text-blue-800' :
                                            file.categoryLabel === 'Audio' ? 'bg-purple-100 text-purple-800' :
                                            file.categoryLabel === 'Video' ? 'bg-amber-100 text-amber-800' :
                                            file.categoryLabel === 'Image' ? 'bg-indigo-100 text-indigo-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {file.categoryLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs font-semibold">
                                        {file.fileSize ? (file.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {(isPdf || isImage || isAudio || isVideo) && (
                                                <button
                                                    onClick={file.onPreview}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Preview File"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={file.onDownload}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title="Download File"
                                            >
                                                <ArrowDownTrayIcon className="w-5 h-5" />
                                            </button>
                                            {canManage && file.onDelete && (
                                                <button
                                                    onClick={file.onDelete}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete File"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
