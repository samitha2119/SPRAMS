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

            {submissions.length === 0 && (
                <EmptyState
                    icon={DocumentTextIcon}
                    title="No Submissions"
                    message="No submissions found to evaluate."
                />
            )}
        </div>
    );
}