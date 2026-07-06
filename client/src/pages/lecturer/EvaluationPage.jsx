import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { evaluationsAPI, studentResearchAPI, projectsAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { ClipboardDocumentCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function EvaluationPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('projects'); // 'projects' or 'research'

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [projRes, researchRes, evalsRes] = await Promise.all([
                projectsAPI.getAll({ limit: 100 }),
                studentResearchAPI.getAll({ limit: 100 }),
                evaluationsAPI.getAll({ limit: 200 }),
            ]);
            const projects = (projRes.data.data.projects || projRes.data.data.entries || []).map((p) => ({
                ...p, _submissionType: 'Project',
            }));
            const research = (researchRes.data.data.entries || []).map((r) => ({
                ...r, _submissionType: 'StudentResearch',
            }));
            setSubmissions([...projects, ...research]);
            setEvaluations(evalsRes.data.data.evaluations || []);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = 'Evaluations | SPRAMS';
        loadData();
    }, [loadData]);

    const filtered = submissions.filter((s) =>
        tab === 'projects' ? s._submissionType === 'Project' : s._submissionType === 'StudentResearch'
    );

    if (loading) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-7 h-7 text-primary-600" />
                    Evaluation Panel
                </h1>
                <p className="text-slate-500 mt-1">Review and grade student submissions</p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setTab('projects')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'projects' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Projects
                </button>
                <button
                    onClick={() => setTab('research')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'research' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Student Research
                </button>
            </div>

            {filtered.length === 0 && (
                <EmptyState
                    icon={DocumentTextIcon}
                    title={`No ${tab === 'projects' ? 'Projects' : 'Research'}`}
                    message="No submissions found to evaluate."
                />
            )}
        </div>
    );
}