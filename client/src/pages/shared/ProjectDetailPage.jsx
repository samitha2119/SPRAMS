import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tokenStorage, getProjectProposalUrl, getProjectFinalReportUrl, getFileUrl } from '../../services/api';
import { PageSpinner, ErrorAlert, AIBadge, Modal, Spinner } from '../../components/ui/Common';
import {
    ChevronLeftIcon, AcademicCapIcon, UserGroupIcon, CalendarIcon,
    BuildingOfficeIcon, UserIcon, ArrowLeftIcon, DocumentArrowDownIcon,
    ArrowDownTrayIcon, EyeIcon, DocumentTextIcon, TrashIcon
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

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewFile, setPreviewFile] = useState(null);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showCitationModal, setShowCitationModal] = useState(false);

    const handleDownloadFinalReport = async () => {
        try {
            const token = tokenStorage.getAccess();
            const url = getProjectFinalReportUrl(project._id);
            const response = await fetch(`${url}?token=${token}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                toast.error(err.message || 'End report PDF not available');
                return;
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `${project.title}_Final_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handlePreviewFinalReport = () => {
        const token = tokenStorage.getAccess();
        const url = `${getProjectFinalReportUrl(project._id)}?token=${token}&disposition=inline`;
        setPreviewFile({
            originalName: project.finalReportFile.originalName,
            url: url,
            fileType: project.finalReportFile.fileType || 'application/pdf'
        });
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await projectsAPI.getOne(id);
                setProject(data.data.project);
            } catch (err) {
                setError('Project not found or access denied.');
                toast.error('Failed to load project details');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const handleDownloadProposal = async () => {
        try {
            const token = tokenStorage.getAccess();
            const url = getProjectProposalUrl(project._id);
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
            link.setAttribute('download', `${project.title}_Proposal.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handlePreviewProposal = () => {
        const token = tokenStorage.getAccess();
        const url = `${getProjectProposalUrl(project._id)}?token=${token}&disposition=inline`;
        setPreviewFile({
            originalName: project.proposalFile.originalName,
            url: url,
            fileType: project.proposalFile.fileType || 'application/pdf',
            isProposal: true
        });
    };

    const handleDownload = async (file) => {
        try {
            const token = tokenStorage.getAccess();
            const response = await fetch(`${getFileUrl(project._id, file._id)}?token=${token}`);
            if (!response.ok) {
                toast.error('File not available for download');
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
            toast.error('Download failed');
        }
    };

    const handlePreview = (file) => {
        const token = tokenStorage.getAccess();
        const url = `${getFileUrl(project._id, file._id)}?token=${token}`;
        setPreviewFile({ ...file, url });
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;
        try {
            await projectsAPI.deleteFile(project._id, fileId);
            toast.success('File deleted successfully');
            const { data } = await projectsAPI.getOne(id);
            setProject(data.data.project);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete file');
        }
    };

    if (loading) return <PageSpinner />;
    if (error) return (
        <div className="max-w-4xl mx-auto space-y-4">
            <Link to="/projects" className="btn-ghost gap-2 text-sm">
                <ChevronLeftIcon className="w-4 h-4" /> Back to projects
            </Link>
            <ErrorAlert message={error} />
        </div>
    );

    const canManage = user?.role === 'admin' || user?.role === 'lecturer' || project?.createdBy?._id === user?._id || project?.createdBy === user?._id;

    const proposalFile = project.proposalFile?.filePath ? {
        ...project.proposalFile,
        isProposal: true,
        displayName: project.proposalFile.originalName,
        categoryLabel: 'Proposal',
        fileType: project.proposalFile.fileType || 'application/pdf',
        fileSize: project.proposalFile.fileSize,
        onPreview: handlePreviewProposal,
        onDownload: handleDownloadProposal
    } : null;

    const finalReportFile = project.finalReportFile?.filePath ? {
        ...project.finalReportFile,
        isFinalReport: true,
        displayName: project.finalReportFile.originalName,
        categoryLabel: 'End Report',
        fileType: project.finalReportFile.fileType || 'application/pdf',
        fileSize: project.finalReportFile.fileSize,
        onPreview: handlePreviewFinalReport,
        onDownload: handleDownloadFinalReport
    } : null;

    const supplementaryFiles = (project.files || []).map(file => ({
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

    const apaCitation = project ? `${formatAPAAuthors(project.members)}. (${project.academicYear || new Date(project.createdAt).getFullYear()}). ${project.title}. Department of ${project.department || 'Computer Science'}, University of Vavuniya.` : '';
    const ieeeCitation = project ? `${formatIEEEAuthors(project.members)}, "${project.title}," Dept. ${project.department || 'Computer Science'}, Univ. Vavuniya, ${project.academicYear || new Date(project.createdAt).getFullYear()}.` : '';
    const harvardCitation = project ? `${formatHarvardAuthors(project.members)} ${project.academicYear || new Date(project.createdAt).getFullYear()}, ${project.title}, Department of ${project.department || 'Computer Science'}, University of Vavuniya.` : '';

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
                <div className="h-2 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

                <div className="p-8 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="badge badge-blue px-3 py-1 text-sm font-bold uppercase tracking-wider">
                            {project.academicYear}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            {project.department}
                        </div>
                        <span className={`badge px-3 py-1 text-sm font-bold uppercase tracking-wider ${
                            project.status === 'Completed' ? 'badge-green bg-emerald-100 text-emerald-800' :
                            project.status === 'Ongoing' ? 'badge-blue bg-blue-100 text-blue-800' :
                            'badge-yellow bg-amber-100 text-amber-800'
                        }`}>
                            {project.status || 'Proposed'}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-8">
                        {project.title}
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Abstract Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Abstract</h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                        {project.abstract}
                                    </p>
                                </div>
                            </section>

                            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserGroupIcon className="w-5 h-5 text-primary-600" />
                                    <h2 className="text-lg font-bold text-slate-800">Project Members</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {project.members?.map((m, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{m.regNo}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!project.members || project.members.length === 0) && (
                                        <p className="text-sm text-slate-400 italic col-span-2">No members listed</p>
                                    )}
                                </div>
                            </section>

                            {/* Attachments Section with Split Tables */}
                            <section className="space-y-8">
                                <FileTable
                                    title="Project Documents"
                                    files={documentFiles}
                                    icon={<DocumentTextIcon className="w-6 h-6 text-blue-600" />}
                                    typeColor="bg-blue-100 text-blue-800"
                                    canManage={canManage}
                                    emptyMessage="No project documents uploaded yet."
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
                    </div>
                </div>
            </div>
        </div>
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
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a1 1 0 011.414 0L16 17m0 0l1-1m-1 1k-3-3m-3.5 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-all"
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
