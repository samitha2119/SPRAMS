import React from 'react';
import {
    DocumentArrowDownIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    InformationCircleIcon,
    FolderIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const TEMPLATES = [
    {
        title: 'Project Proposal Template',
        description: 'Standard format for submitting your initial project proposal for department approval.',
        fileName: 'UOV_Project_Proposal_Template.pdf',
        size: '1.2 MB',
        type: 'PDF'
    },
    {
        title: 'Final Dissertation Format',
        description: 'Required structure and formatting rules for the final research dissertation / project report.',
        fileName: 'UOV_Dissertation_Formatting_Guide.pdf',
        size: '2.5 MB',
        type: 'PDF'
    },
    {
        title: 'Project Submission Form',
        description: 'The mandatory submission form to be filled and signed by the supervisor before final archiving.',
        fileName: 'Project_Archive_Self_Declaration.pdf',
        size: '0.8 MB',
        type: 'PDF'
    },
    {
        title: 'Research Abstract Guidelines',
        description: 'Best practices for writing academic abstracts that are optimized for the search engine.',
        fileName: 'Abstract_Writing_Best_Practices.pdf',
        size: '1.1 MB',
        type: 'PDF'
    }
];

export default function ProjectResourcesPage() {
    const navigate = useNavigate();

    const handleDownload = (fileName) => {
        // In a real app, this would trigger a download from the server
        alert(`Downloading simulated file: ${fileName}`);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Submission Resources</h1>
                    <p className="text-slate-500 text-sm mt-1">Download templates and mandatory forms for your project and research submissions.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/projects')}
                        className="btn-primary gap-2"
                    >
                        <FolderIcon className="w-4 h-4" />
                        Explore Archive
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Information Card */}
                <div className="card bg-primary-50 border-primary-100 md:col-span-2">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
                            <InformationCircleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Submission Checklist</h3>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                Before submitting your work to the archive, please ensure you have downloaded the correct templates and filled in all required fields in the submission form. All PDF files must be under 1GB and include the signed declaration from your supervisor.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Templates List */}
                {TEMPLATES.map((item, idx) => (
                    <div key={idx} className="card group hover:shadow-md transition-all border-slate-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                {idx % 2 === 0 ? <DocumentTextIcon className="w-6 h-6" /> : <ClipboardDocumentCheckIcon className="w-6 h-6" />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-6 line-clamp-2">{item.description}</p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 text-xs">
                            <span className="text-slate-400 font-medium">{item.size}</span>
                            <button
                                onClick={() => handleDownload(item.fileName)}
                                className="flex items-center gap-1.5 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                            >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                                Download Template
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Support section */}
            <div className="text-center py-12 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                    Having trouble with the forms? Contact the university library technical desk for assistance.
                </p>
            </div>
        </div>
    );
}
