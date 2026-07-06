import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../../services/api';
import { PageSpinner, Pagination, ErrorAlert } from '../../components/ui/Common';
import {
    ClipboardDocumentListIcon, ClockIcon, UserIcon,
    FunnelIcon, CalendarIcon, BriefcaseIcon, SparklesIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ACTION_MAP = {
    PROJECT_CREATED: { label: 'Project Created', color: 'badge-green', icon: BriefcaseIcon },
    PROJECT_UPDATED: { label: 'Project Updated', color: 'badge-blue', icon: BriefcaseIcon },
    RESEARCH_CREATED: { label: 'Research Created', color: 'badge-green', icon: ClipboardDocumentListIcon },
    RESEARCH_UPDATED: { label: 'Research Updated', color: 'badge-blue', icon: ClipboardDocumentListIcon },
    AI_SUMMARY_GENERATED: { label: 'AI Summary', color: 'badge-purple', icon: SparklesIcon },
    AI_ABSTRACT_IMPROVED: { label: 'AI Abstract', color: 'badge-purple', icon: SparklesIcon },
    USER_DELETED: { label: 'User Deleted', color: 'badge-red', icon: UserIcon },
    USER_UPDATED: { label: 'User Role/Auth', color: 'badge-yellow', icon: UserIcon },
    EXPORT_CSV: { label: 'Data Export', color: 'badge-blue', icon: ArrowDownTrayIcon },
};

export default function ActivityLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ action: '', userId: '' });

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await dashboardAPI.getActivity({ page, limit: 50, ...filters });
            setLogs(data.data.logs);
            setPagination(data.data.pagination);
        } catch {
            setError('Failed to load system activity logs.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        document.title = 'Activity Log | SPRAMS';
        fetchLogs(1);
    }, [fetchLogs]);

    return (
        <div className="space-y-6 fade-in max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <ClockIcon className="w-8 h-8 text-primary-600" />
                        System Activity Logs
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Audit trail of all administrative actions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card py-4 flex flex-col sm:flex-row gap-3 items-center">
                <FunnelIcon className="w-4 h-4 text-slate-400" />
                <select
                    value={filters.action}
                    onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                    className="input-field py-1.5 text-sm w-full sm:w-60"
                >
                    <option value="">All Actions</option>
                    {Object.entries(ACTION_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
                <button onClick={() => setFilters({ action: '', userId: '' })} className="btn-ghost text-sm ml-auto">
                    Reset Audit Trail
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            {loading ? <PageSpinner /> : (
                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <div className="card text-center py-20 bg-slate-50">
                            <ClockIcon className="w-12 h-12 text-slate-200 mx-auto" />
                            <p className="text-slate-400 mt-4 text-sm font-medium">No system activity has been recorded yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Administrator</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details / Target</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.map((log) => {
                                            const actionInfo = ACTION_MAP[log.action] || { label: log.action, color: 'badge-blue', icon: ClockIcon };
                                            return (
                                                <tr key={log._id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-sm font-semibold text-slate-600">
                                                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`badge ${actionInfo.color} flex items-center w-fit gap-1 text-[11px] uppercase tracking-wide font-black`}>
                                                            <actionInfo.icon className="w-3 h-3" />
                                                            {actionInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                                {log.userId?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700 leading-none">
                                                                    {log.userId?.name || 'Unknown Admin'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{log.userId?.role || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-slate-600 font-medium line-clamp-2 max-w-md" title={log.target}>
                                                            {log.target}
                                                        </p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                                <Pagination
                                    page={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={fetchLogs}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
