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
    EnvelopeIcon,
    BriefcaseIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function StudentWorkspace() {
    const { user } = useAuth();
    
    // Active workspace data
    const [data, setData] = useState({
        project: null,
        groupMembers: [],
        submissions: [],
        evaluations: []
    });
    
    // Lists data
    const [projectsList, setProjectsList] = useState([]);
    const [researchList, setResearchList] = useState([]);
    
    // UI state
    const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'research'
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'workspace' | 'project' | 'research', item: object }
    
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Detail view specific states
    const [selectedItemEvaluations, setSelectedItemEvaluations] = useState([]);
    const [selectedItemSubmissions, setSelectedItemSubmissions] = useState([]);
    
    // Upload state (only for active workspace)
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('Proposal');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCitationModal, setShowCitationModal] = useState(false);
    
    // Deficit Checklist state (for active workspace)
    const [deficits, setDeficits] = useState([
        { id: 1, text: "Correct formatting of the Abstract", resolved: false },
        { id: 2, text: "Address supervisor remarks on methodology", resolved: false },
        { id: 3, text: "Ensure GitHub repository matches the uploaded source code", resolved: false }
    ]);

    // Fetch workspace data
    const fetchWorkspaceData = async () => {
        try {
            const res = await api.get('/workspace');
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load active workspace:', err);
        }
    };

    // Fetch lists
    const fetchLists = async () => {
        try {
            setListLoading(true);
            const [projRes, resRes] = await Promise.all([
                api.get('/projects', { params: { createdBy: user._id } }),
                api.get('/student-research', { params: { submittedBy: user._id } })
            ]);
            if (projRes.data.success) {
                setProjectsList(projRes.data.data.projects || []);
            }
            if (resRes.data.success) {
                setResearchList(resRes.data.data.entries || []);
            }
        } catch (err) {
            console.error('Failed to load lists:', err);
        } finally {
            setListLoading(false);
        }
    };

    const initializeData = async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.all([
                fetchWorkspaceData(),
                fetchLists()
            ]);
        } catch (err) {
            setError('Failed to initialize page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'My Work | SPRAMS';
        initializeData();
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
                
                // Refresh workspace data
                const wsRes = await api.get('/workspace');
                if (wsRes.data.success) {
                    setData(wsRes.data.data);
                    // Update current select details
                    setSelectedItemSubmissions(wsRes.data.data.submissions);
                }
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

    // Select Item and fetch details
    const selectItem = async (item, type) => {
        if (type === 'workspace') {
            setSelectedItem({ type: 'workspace', item });
            setSelectedItemEvaluations(data.evaluations || []);
            setSelectedItemSubmissions(data.submissions || []);
            return;
        }

        setDetailsLoading(true);
        try {
            setSelectedItem({ type, item });
            
            // Fetch evaluations
            const evalRes = await api.get('/evaluations', {
                params: {
                    submissionId: item._id,
                    submissionType: type === 'project' ? 'Project' : 'StudentResearch'
                }
            });
            if (evalRes.data.success) {
                setSelectedItemEvaluations(evalRes.data.data.evaluations || []);
            } else {
                setSelectedItemEvaluations([]);
            }

            // Map submissions
            const subs = [];
            if (item.proposalFile && item.proposalFile.filePath) {
                subs.push({
                    submissionID: 'prop',
                    submissionType: 'Proposal',
                    originalName: item.proposalFile.originalName || 'Proposal.pdf',
                    versionNumber: 1,
                    filePath: item.proposalFile.filePath,
                    isDirectFile: true,
                    url: type === 'project'
                        ? `${api.defaults.baseURL}/files/projects/${item._id}/proposal`
                        : `${api.defaults.baseURL}/files/student-research/${item._id}/proposal`
                });
            }
            if (item.finalReportFile && item.finalReportFile.filePath) {
                subs.push({
                    submissionID: 'final',
                    submissionType: 'Final Report',
                    originalName: item.finalReportFile.originalName || 'Final_Report.pdf',
                    versionNumber: 1,
                    filePath: item.finalReportFile.filePath,
                    isDirectFile: true,
                    url: type === 'project'
                        ? `${api.defaults.baseURL}/files/projects/${item._id}/final-report`
                        : `${api.defaults.baseURL}/files/student-research/${item._id}/final-report`
                });
            }
            if (item.files && item.files.length > 0) {
                item.files.forEach((f, idx) => {
                    subs.push({
                        submissionID: f._id,
                        submissionType: 'Supplementary File',
                        originalName: f.originalName,
                        versionNumber: idx + 1,
                        filePath: f.filePath,
                        isDirectFile: true,
                        url: `${api.defaults.baseURL}/files/${item._id}/${f._id}`
                    });
                });
            }
            setSelectedItemSubmissions(subs);
        } catch (err) {
            console.error('Failed to load item details:', err);
            toast.error('Failed to load evaluation feedback details');
        } finally {
            setDetailsLoading(false);
        }
    };

    // Generate citations
    const generateCitation = (format) => {
        if (!selectedItem) return '';
        const item = selectedItem.item;
        const year = item.createdAt ? new Date(item.createdAt).getFullYear() : new Date().getFullYear();
        
        let authors = '';
        if (selectedItem.type === 'workspace') {
            authors = data.groupMembers.map(m => m.name).join(', ');
        } else if (selectedItem.type === 'project') {
            authors = (item.members || []).map(m => m.name).join(', ');
        } else {
            authors = (item.researchers || []).join(', ');
        }
        
        if (!authors) authors = user.name;

        switch (format) {
            case 'APA':
                return `${authors}. (${year}). ${item.title}. Department of Computer Science, University of Vavuniya.`;
            case 'IEEE':
                return `[1] ${authors}, "${item.title}," Dept. of Computer Science, Univ. of Vavuniya, ${year}.`;
            case 'Harvard':
                return `${authors} ${year}, '${item.title}', University of Vavuniya, Vavuniya.`;
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

    // --- RENDER DETAIL VIEW (DASHBOARD) ---
    if (selectedItem) {
        const item = selectedItem.item;
        const type = selectedItem.type;
        const isWorkspace = type === 'workspace';
        
        // Status steps mapping
        const statusSteps = ['Proposed', 'Approved', 'Ongoing', 'Completed'];
        const currentStepIndex = statusSteps.indexOf(item.status) === -1 ? 0 : statusSteps.indexOf(item.status);

        if (detailsLoading) return <PageSpinner />;

        return (
            <div className="max-w-7xl mx-auto p-4 space-y-8 pb-16">
                {/* Back button */}
                <button
                    onClick={() => setSelectedItem(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-green-700 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" /> Back to My Work
                </button>

                {/* Header Module */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-green-600" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                {isWorkspace ? 'Active Project Workspace' : type === 'project' ? 'Project Details' : 'Research Details'}
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                                ID: {isWorkspace ? item.projectID : item.projectID || `ARCH-${item._id.substring(0, 6).toUpperCase()}`}
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{item.title}</h1>
                        
                        {/* Supervisor Contact Channel */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">Supervisor:</span>
                            <span className="bg-slate-50 border px-2 py-0.5 rounded text-slate-700 font-medium">{item.supervisor || 'Dr. Jane Smith'}</span>
                            <a href="mailto:lecturer@archive.edu" className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-bold ml-1 transition-colors hover:underline">
                                <EnvelopeIcon className="w-3.5 h-3.5" /> Contact channels
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                            item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            item.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            {item.status}
                        </span>
                        <button 
                            onClick={() => setShowCitationModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:text-green-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                        >
                            <DocumentDuplicateIcon className="w-4 h-4" /> Cite {type === 'research' ? 'Research' : 'Project'}
                        </button>
                    </div>
                </div>

                {/* Team Profiles Grid */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-green-600" />
                        {type === 'research' ? 'Researchers & Authors' : 'Group Members & Workspace Profiles'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {isWorkspace ? (
                            data.groupMembers.map((m, index) => {
                                const isLeader = index === 0;
                                return (
                                    <div key={m.studentID} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                            isLeader ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate">{m.name}</p>
                                            <p className="text-xs text-slate-400 truncate uppercase font-medium">{m.registrationNumber}</p>
                                        </div>
                                        <span className={`ml-auto text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                                            isLeader ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {isLeader ? 'Leader' : 'Member'}
                                        </span>
                                    </div>
                                );
                            })
                        ) : type === 'project' ? (
                            (item.members || []).map((m, index) => (
                                <div key={m.regNo} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 transition-colors">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-700">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{m.name}</p>
                                        <p className="text-xs text-slate-400 truncate uppercase font-medium">{m.regNo}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            (item.researchers || []).map((name, index) => (
                                <div key={index} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 transition-colors">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-200 text-slate-700">
                                        {name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{name}</p>
                                        <p className="text-xs text-slate-400 truncate font-medium">Author</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Visual Progress Timeline */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Workspace Milestones Progress</h3>
                    <div className="relative flex items-center justify-between">
                        <div className="absolute left-0 right-0 h-1 bg-slate-100 -z-0"></div>
                        <div 
                            className="absolute left-0 h-1 bg-green-500 transition-all duration-500 -z-0"
                            style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                        ></div>

                        {statusSteps.map((step, idx) => {
                            const isActive = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div key={step} className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isCurrent ? 'bg-green-600 border-green-600 text-white ring-4 ring-green-100' :
                                        isActive ? 'bg-emerald-500 border-emerald-500 text-white' :
                                        'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                        {isActive ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
                                    </div>
                                    <span className={`text-[11px] font-extrabold mt-3 tracking-wide uppercase ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {step === 'Proposed' ? 'Proposal Approved' :
                                         step === 'Approved' ? 'SRS Documentation' :
                                         step === 'Ongoing' ? 'Mid-Evaluation' : 'Final Upload'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Split Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Upload for Active workspace, or static abstract/keywords for other items) */}
                    <div className="lg:col-span-1 space-y-6">
                        {isWorkspace ? (
                            <>
                                {item.status === 'Proposed' && (
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
                                            disabled={uploading || !selectedFile || (item.status === 'Proposed' && !deficits.every(d => d.resolved))}
                                            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                                                uploading || !selectedFile || (item.status === 'Proposed' && !deficits.every(d => d.resolved))
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                                    : 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/10'
                                            }`}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Submission'}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                <h2 className="text-xl font-bold text-slate-800">Abstract</h2>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {item.abstract || item.description || 'No abstract description available.'}
                                </p>
                                {item.keywords && item.keywords.length > 0 && (
                                    <div className="pt-2">
                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Keywords</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.keywords.map((k) => (
                                                <span key={k} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column (Submissions and Evaluations Feedback Loop) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Submissions list */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-green-600" />
                                File Deliverables & Version Control
                            </h2>
                            
                            {selectedItemSubmissions.length === 0 ? (
                                <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 italic text-sm border border-slate-200">
                                    No files uploaded yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                                    <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                                <th scope="col" className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Version</th>
                                                <th scope="col" className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                                                <th scope="col" className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Download</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {selectedItemSubmissions.map((sub, idx) => (
                                                <tr key={sub.submissionID || idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                                                            sub.submissionType === 'Proposal' ? 'bg-blue-100 text-blue-800' :
                                                            sub.submissionType === 'Progress Report' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {sub.submissionType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-slate-700">v{sub.versionNumber}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-600 truncate max-w-[200px]" title={sub.originalName}>
                                                        {sub.originalName}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <a 
                                                            href={sub.isDirectFile ? `${sub.url}?token=${localStorage.getItem('archive_access_token')}` : `${api.defaults.baseURL}/workspace/download/${sub.submissionID}?token=${localStorage.getItem('archive_access_token')}`}
                                                            download
                                                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-bold hover:underline"
                                                        >
                                                            <ArrowDownTrayIcon className="w-4.5 h-4.5" /> Download
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Feedback Timeline */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
                                Real-time Supervisor Feedback Loop
                            </h2>

                            {selectedItemEvaluations.length === 0 ? (
                                <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 italic text-sm border border-slate-200">
                                    No feedback remarks received yet.
                                </div>
                            ) : (
                                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                                    {selectedItemEvaluations.map((evalItem, idx) => (
                                        <div key={evalItem._id || evalItem.evaluationID || idx} className="relative">
                                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-green-600 bg-white"></div>
                                            
                                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 space-y-3 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">
                                                            {evalItem.gradedBy || (evalItem.evaluatedBy?.name) || 'Supervisor'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                            {new Date(evalItem.createdAt || evalItem.evaluationDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {evalItem.marks !== null && (
                                                        <span className="bg-green-100 text-green-800 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                                                            Grade: {evalItem.marks}/100
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                    {evalItem.feedback}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Citation exporter modal */}
                {showCitationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-6">
                            <div className="flex items-center justify-between border-b pb-3">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <CpuChipIcon className="w-5 h-5 text-green-600" />
                                    One-Click Citation Generator
                                </h3>
                                <button onClick={() => setShowCitationModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
                            </div>

                            <div className="space-y-4">
                                {['APA', 'IEEE', 'Harvard'].map((format) => {
                                    const citation = generateCitation(format);
                                    return (
                                        <div key={format} className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{format} Format</span>
                                                <button 
                                                    onClick={() => copyToClipboard(citation)}
                                                    className="text-[10px] text-green-600 font-bold hover:underline"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <div className="p-3 bg-slate-50 border rounded-xl text-xs text-slate-600 font-medium select-all leading-normal">
                                                {citation}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER LIST VIEW ---
    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6 pb-16">
            {/* Header Title */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">My Work</h1>
                <p className="text-sm text-slate-500">Stay updated and track your projects and research papers.</p>
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'projects'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <BriefcaseIcon className="w-5 h-5" /> My Projects
                </button>
                <button
                    onClick={() => setActiveTab('research')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'research'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <DocumentTextIcon className="w-5 h-5" /> My Research
                </button>
            </div>

            {listLoading ? (
                <PageSpinner />
            ) : (
                <div className="pt-2">
                    {/* PROJECTS TAB CONTENT */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            {/* 1. Active Workspace Project (fetched from workspace) */}
                            {data.project && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Workspace Project</h3>
                                    <div 
                                        onClick={() => selectItem(data.project, 'workspace')}
                                        className="bg-white rounded-3xl border-2 border-green-500 p-6 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 bg-green-500 text-white font-extrabold text-[9px] tracking-wider uppercase px-3 py-1 rounded-bl-xl">
                                            Active Workspace
                                        </div>
                                        <div className="space-y-2 pr-16">
                                            <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                ID: {data.project.projectID}
                                            </span>
                                            <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-green-600 transition-colors leading-tight">
                                                {data.project.title}
                                            </h2>
                                            <p className="text-xs text-slate-400">
                                                Supervisor: <span className="font-semibold text-slate-600">Dr. Jane Smith</span>
                                            </p>
                                            <div className="flex items-center gap-3 pt-2">
                                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    {data.project.status}
                                                </span>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Members: {data.groupMembers.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Archived / All other projects */}
                            <div className="space-y-3 pt-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Projects</h3>
                                {projectsList.length === 0 && !data.project ? (
                                    <div className="max-w-md mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                                        <AcademicCapIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <h2 className="text-lg font-bold text-slate-800">No Projects Found</h2>
                                        <p className="text-slate-500 mt-2 text-xs">You haven't proposed or created any projects yet.</p>
                                        <a href="/add-project" className="btn-primary inline-flex items-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-xs">
                                            Propose Project
                                        </a>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projectsList
                                            .filter(p => !data.project || p.title !== data.project.title)
                                            .map((p) => (
                                                <div 
                                                    key={p._id}
                                                    onClick={() => selectItem(p, 'project')}
                                                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                                >
                                                    <div className="space-y-2">
                                                        <h4 className="text-md font-extrabold text-slate-800 group-hover:text-green-600 transition-colors leading-snug truncate-2-lines">
                                                            {p.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-400">
                                                            Supervisor: <span className="font-semibold text-slate-600">{p.supervisor}</span>
                                                        </p>
                                                        <div className="flex items-center justify-between pt-2">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                                p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                                p.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700' :
                                                                'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {p.status}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                                                {p.academicYear}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RESEARCH TAB CONTENT */}
                    {activeTab === 'research' && (
                        <div className="space-y-4">
                            {researchList.length === 0 ? (
                                <div className="max-w-md mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm mt-4">
                                    <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h2 className="text-lg font-bold text-slate-800">No Research Papers Found</h2>
                                    <p className="text-slate-500 mt-2 text-xs">You haven't submitted any research papers yet.</p>
                                    <a href="/add-research" className="btn-primary inline-flex items-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-xs">
                                        Submit Research Paper
                                    </a>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {researchList.map((r) => (
                                        <div 
                                            key={r._id}
                                            onClick={() => selectItem(r, 'research')}
                                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="space-y-2">
                                                <h4 className="text-md font-extrabold text-slate-800 group-hover:text-green-600 transition-colors leading-snug truncate-2-lines">
                                                    {r.title}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    Supervisor: <span className="font-semibold text-slate-600">{r.supervisor}</span>
                                                </p>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                        r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        r.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {r.status}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                                        {r.academicYear}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
