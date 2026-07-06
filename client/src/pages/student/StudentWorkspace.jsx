import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner, ErrorAlert } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    AcademicCapIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    DocumentDuplicateIcon,
    CpuChipIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function StudentWorkspace() {
    const { user } = useAuth();
    const [data, setData] = useState({
        project: null,
        groupMembers: [],
        submissions: [],
        evaluations: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('Proposal');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCitationModal, setShowCitationModal] = useState(false);

    // Deficit Checklist state
    const [deficits, setDeficits] = useState([
        { id: 1, text: "Correct formatting of the Abstract", resolved: false },
        { id: 2, text: "Address supervisor remarks on methodology", resolved: false },
        { id: 3, text: "Ensure GitHub repository matches the uploaded source code", resolved: false }
    ]);

    // Fetch workspace data
    const fetchWorkspaceData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/workspace');
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load workspace.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Workspace | SPRAMS';
        fetchWorkspaceData();
    }, []);

    // Handle File Selection
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    // Handle File Upload Submit
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        // Check if deficits are all resolved if changes are required
        const allResolved = deficits.every(d => d.resolved);
        if (data.project?.status === 'Proposed' && !allResolved) {
            toast.error('You must resolve all checklist deficits before re-submitting!');
            return;
        }

        const formData = new FormData();
        formData.append('projectID', data.project._id);
        formData.append('submissionType', selectedType);
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            const res = await api.post('/workspace/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                toast.success(res.data.message || 'File uploaded successfully');
                setSelectedFile(null);
                fetchWorkspaceData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'File upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Toggle checklist checkbox
    const toggleDeficit = (id) => {
        setDeficits(prev => prev.map(d => d.id === id ? { ...d, resolved: !d.resolved } : d));
    };

    // Generate citations
    const generateCitation = (format) => {
        if (!data.project) return '';
        const year = new Date(data.project.createdAt).getFullYear();
        const authors = data.groupMembers.map(m => m.name).join(', ');
        
        switch (format) {
            case 'APA':
                return `${authors}. (${year}). ${data.project.title}. Department of Computer Science, University of Vavuniya.`;
            case 'IEEE':
                return `[1] ${authors}, "${data.project.title}," Dept. of Computer Science, Univ. of Vavuniya, ${year}.`;
            case 'Harvard':
                return `${authors} ${year}, '${data.project.title}', University of Vavuniya, Vavuniya.`;
            default:
                return '';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Citation copied to clipboard!');
    };

    if (loading) return <PageSpinner />;
    if (error) return <div className="max-w-6xl mx-auto p-6"><ErrorAlert message={error} /></div>;

    if (!data.project) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
                <AcademicCapIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 animate-pulse">No Active Project Workspace</h2>
                <p className="text-slate-500 mt-2">You are currently not assigned to any active project group.</p>
                <a href="/add-project" className="btn-primary inline-flex items-center gap-2 mt-6 bg-green-600 hover:bg-green-700">
                    Propose New Project
                </a>
            </div>
        );
    }

    const { project, groupMembers, submissions, evaluations } = data;

    // Timeline steps mapping
    const statusSteps = ['Proposed', 'Approved', 'Ongoing', 'Completed'];
    const currentStepIndex = statusSteps.indexOf(project.status) === -1 ? 0 : statusSteps.indexOf(project.status);

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8 pb-16">
            {/* Header Module */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-green-600" />
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                            Active Project Workspace
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                            ID: {project.projectID}
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{project.title}</h1>
                    
                    {/* Supervisor Contact Channel */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">Supervisor:</span>
                        <span className="bg-slate-50 border px-2 py-0.5 rounded text-slate-700 font-medium">Dr. Jane Smith</span>
                        <a href="mailto:lecturer@archive.edu" className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-bold ml-1 transition-colors hover:underline">
                            <EnvelopeIcon className="w-3.5 h-3.5" /> Contact channels
                        </a>
                    </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                        project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        project.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        project.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {project.status}
                    </span>
                    <button 
                        onClick={() => setShowCitationModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:text-green-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" /> Cite Project
                    </button>
                </div>
            </div>
             {/* Split Workspace Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Upload & Submission Form (Left Column) */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Deficit Correction Checklist */}
                                {project.status === 'Proposed' && (
                                    <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
                                        <h2 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-rose-700" />
                                            Corrections Required
                                        </h2>
                                        <p className="text-xs text-rose-700 leading-relaxed font-medium">
                                            The project proposal requires improvements. Please resolve the checklist below before uploading your updated document.
                                        </p>
                                        <div className="space-y-3 pt-2">
                                            {deficits.map((d) => (
                                                <label key={d.id} className="flex items-start gap-3 cursor-pointer select-none group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={d.resolved}
                                                        onChange={() => toggleDeficit(d.id)}
                                                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500/20 border-slate-300 mt-0.5"
                                                    />
                                                    <span className={`text-xs font-semibold leading-normal ${
                                                        d.resolved ? 'text-rose-500/60 line-through' : 'text-rose-800'
                                                    }`}>
                                                        {d.text}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
            
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <ArrowUpTrayIcon className="w-5 h-5 text-green-600" />
                                        Submit Deliverable
                                    </h2>
                                    
                                    <form onSubmit={handleUploadSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Submission Type</label>
                                            <select 
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                            >
                                                <option value="Proposal">Proposal</option>
                                                <option value="Progress Report">Progress Report</option>
                                                <option value="Final Report">Final Report</option>
                                            </select>
                                        </div>
            
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Draft File</label>
                                            <div className="border-2 border-dashed border-slate-200 hover:border-green-400 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-6 text-center cursor-pointer relative">
                                                <input 
                                                    type="file" 
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="space-y-2">
                                                    <DocumentTextIcon className="w-8 h-8 text-slate-400 mx-auto" />
                                                    <span className="block text-xs font-bold text-green-600">
                                                        {selectedFile ? selectedFile.name : 'Choose file...'}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400 font-medium">PDF, ZIP, DOCX up to 100MB</span>
                                                </div>
                                            </div>
                                        </div>
            
                                        <button 
                                            type="submit" 
                                            disabled={uploading || !selectedFile || (project.status === 'Proposed' && !deficits.every(d => d.resolved))}
                                            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                                                uploading || !selectedFile || (project.status === 'Proposed' && !deficits.every(d => d.resolved))
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                                    : 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/10'
                                            }`}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Submission'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

    

