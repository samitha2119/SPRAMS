import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { evaluationsAPI, studentResearchAPI, projectsAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    ClipboardDocumentCheckIcon, CheckCircleIcon, XCircleIcon,
    ArrowPathIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function EvaluationPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('projects');
    const [evaluatingId, setEvaluatingId] = useState(null);
    const [evalForm, setEvalForm] = useState({
        approvalStatus: 'Pending', marks: '', grade: 'N/A', feedback: '',
    });
    const [submitting, setSubmitting] = useState(false);

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

    const getEvaluation = (submissionId) => {
        return evaluations.find((e) => e.submissionId === submissionId);
    };

    const filtered = submissions.filter((s) =>
        tab === 'projects' ? s._submissionType === 'Project' : s._submissionType === 'StudentResearch'
    );

    const handleEvaluate = async (e) => {
        e.preventDefault();
        if (!evaluatingId) return;
        setSubmitting(true);
        const sub = submissions.find((s) => s._id === evaluatingId);
        try {
            const existing = getEvaluation(evaluatingId);
            const payload = {
                submissionId: evaluatingId,
                submissionType: sub._submissionType,
                approvalStatus: evalForm.approvalStatus,
                marks: evalForm.marks ? parseInt(evalForm.marks, 10) : null,
                grade: evalForm.grade,
                feedback: evalForm.feedback,
            };

            if (existing) {
                await evaluationsAPI.update(existing._id, payload);
                toast.success('Evaluation updated');
            } else {
                await evaluationsAPI.create(payload);
                toast.success('Evaluation submitted');
            }
            setEvaluatingId(null);
            setEvalForm({ approvalStatus: 'Pending', marks: '', grade: 'N/A', feedback: '' });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setSubmitting(false);
        }
    };

    const startEvaluate = (sub) => {
        const existing = getEvaluation(sub._id);
        if (existing) {
            setEvalForm({
                approvalStatus: existing.approvalStatus,
                marks: existing.marks ?? '',
                grade: existing.grade || 'N/A',
                feedback: existing.feedback || '',
            });
        } else {
            setEvalForm({ approvalStatus: 'Pending', marks: '', grade: 'N/A', feedback: '' });
        }
        setEvaluatingId(sub._id);
    };

    const statusIcons = {
        Approved: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
        Rejected: <XCircleIcon className="w-4 h-4 text-red-500" />,
        'Revision Required': <ArrowPathIcon className="w-4 h-4 text-yellow-500" />,
        Pending: <DocumentTextIcon className="w-4 h-4 text-slate-400" />,
    };

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

            {filtered.length === 0 ? (
                <EmptyState
                    icon={DocumentTextIcon}
                    title={`No ${tab === 'projects' ? 'Projects' : 'Research'}`}
                    message="No submissions found to evaluate."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Submitted By</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Evaluation</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((sub) => {
                                const ev = getEvaluation(sub._id);
                                return (
                                    <React.Fragment key={sub._id}>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-xs truncate">
                                                {sub.title}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {sub.createdBy?.name || sub.submittedBy?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">{sub.department}</td>
                                            <td className="px-4 py-3">
                                                <span className={`badge ${sub.status === 'Completed' || sub.status === 'Approved' ? 'badge-green' : 'badge-blue'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {ev ? (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        {statusIcons[ev.approvalStatus]}
                                                        <span>{ev.approvalStatus}</span>
                                                        {ev.marks != null && <span className="ml-1 font-mono">({ev.marks}/100)</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Not evaluated</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => startEvaluate(sub)}
                                                    className="btn-primary text-xs py-1 px-3"
                                                >
                                                    {ev ? 'Edit' : 'Evaluate'}
                                                </button>
                                            </td>
                                        </tr>

                                        {evaluatingId === sub._id && (
                                            <tr>
                                                <td colSpan={6} className="p-4 bg-slate-50">
                                                    <form onSubmit={handleEvaluate} className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="form-label text-xs">Status</label>
                                                                <select
                                                                    className="form-input text-sm"
                                                                    value={evalForm.approvalStatus}
                                                                    onChange={(e) => setEvalForm({ ...evalForm, approvalStatus: e.target.value })}
                                                                >
                                                                    <option>Pending</option>
                                                                    <option>Approved</option>
                                                                    <option>Rejected</option>
                                                                    <option>Revision Required</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="form-label text-xs">Marks (0-100)</label>
                                                                <input
                                                                    type="number" min={0} max={100}
                                                                    className="form-input text-sm"
                                                                    value={evalForm.marks}
                                                                    onChange={(e) => setEvalForm({ ...evalForm, marks: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="form-label text-xs">Grade</label>
                                                                <select
                                                                    className="form-input text-sm"
                                                                    value={evalForm.grade}
                                                                    onChange={(e) => setEvalForm({ ...evalForm, grade: e.target.value })}
                                                                >
                                                                    {['N/A', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map((g) => (
                                                                        <option key={g} value={g}>{g}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="form-label text-xs">Feedback</label>
                                                            <textarea
                                                                rows={3}
                                                                className="form-input text-sm"
                                                                placeholder="Write your feedback here..."
                                                                value={evalForm.feedback}
                                                                onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="submit" disabled={submitting} className="btn-primary text-xs">
                                                                {submitting ? 'Saving...' : 'Submit Evaluation'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEvaluatingId(null)}
                                                                className="btn-secondary text-xs"
                                                            >Cancel</button>
                                                        </div>
                                                    </form>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}