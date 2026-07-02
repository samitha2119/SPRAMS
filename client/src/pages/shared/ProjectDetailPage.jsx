import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { PageSpinner, ErrorAlert, AIBadge } from '../../components/ui/Common';
import {
    ChevronLeftIcon, AcademicCapIcon, UserGroupIcon, CalendarIcon,
    BuildingOfficeIcon, UserIcon, ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <PageSpinner />;
    if (error) return (
        <div className="max-w-4xl mx-auto space-y-4">
            <Link to="/projects" className="btn-ghost gap-2 text-sm">
                <ChevronLeftIcon className="w-4 h-4" /> Back to projects
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
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="card bg-slate-50 border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Supervisor</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-800">
                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">{project.supervisor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Group Name</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-800">
                                            <UserGroupIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">{project.groupName}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Academic Year</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-800">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold">{project.academicYear}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 text-xs text-slate-400">
                                        Added on {new Date(project.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                        {project.createdBy && ` by ${project.createdBy.name}`}
                                    </div>
                                </div>
                            </div>

                            <div className="card border-primary-100 bg-primary-50/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                                    <h3 className="font-bold text-slate-800">Academic Asset</h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    This project is part of the official academic archive of the University of Vavuniya. All rights reserved by the respective authors and the institution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
