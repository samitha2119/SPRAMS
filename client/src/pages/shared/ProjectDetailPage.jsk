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
        </div>
    );
}
