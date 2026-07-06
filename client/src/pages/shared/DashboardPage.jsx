import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { StatCard, PageSpinner } from '../../components/ui/Common';
import {
    FolderOpenIcon, DocumentTextIcon, UsersIcon, ServerIcon,
    ClipboardDocumentListIcon, SparklesIcon, ArrowRightIcon, 
    UserGroupIcon, ShieldCheckIcon, DocumentChartBarIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ACTION_COLORS = {
    PROJECT_CREATED: 'badge-green',
    RESEARCH_CREATED: 'badge-blue',
    USER_CREATED: 'badge-purple',
    FILE_UPLOADED: 'badge-yellow',
    FILE_DELETED: 'badge-red',
    AI_SUMMARY_GENERATED: 'badge-purple',
    AI_ABSTRACT_IMPROVED: 'badge-purple',
    EXPORT_CSV: 'badge-blue',
    LOGIN: 'badge-green',
    LOGOUT: 'badge-yellow',
};

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        document.title = 'Dashboard | SPRAMS';
        dashboardAPI.getStats()
            .then(({ data }) => setStats(data.data))
            .catch((err) => {
                console.error('Failed to load dashboard stats:', err);
                setStats(null);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageSpinner />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 fade-in">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold tracking-wider text-primary-200">
                           <SparklesIcon className="w-3.5 h-3.5" />
                           {user?.role?.toUpperCase()} DASHBOARD
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black">{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-slate-400 max-w-xl text-lg">
                            Welcome back to <span className="text-white font-semibold italic uppercase">SPRAMS</span>. 
                            {isAdmin 
                                ? "Managing the future of academic archives at the University of Vavuniya."
                                : "Your gateway to academic excellence and research management."}
                        </p>
                    </div>
                    <div className="flex shrink-0">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center min-w-[140px]">
                            <p className="text-slate-400 text-xs font-medium mb-1">CURRENT ROLE</p>
                            <p className="text-xl font-bold text-accent-400 capitalize">{user?.role}</p>
                            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Research Statistics Section */}
            {!isAdmin && stats && stats.researchStats && (
                <div className="space-y-6 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800">Research Statistics</h2>
                        <div className="h-px bg-slate-200 flex-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {user?.role === 'student' ? (
                            <>
                                <StatCard
                                    title="Submitted Research"
                                    value={stats.researchStats.submitted || 0}
                                    icon={DocumentTextIcon}
                                    color="blue"
                                    subtitle="Total projects submitted"
                                />
                                <StatCard
                                    title="Approved Research"
                                    value={stats.researchStats.approved || 0}
                                    icon={ShieldCheckIcon}
                                    color="green"
                                    subtitle="Verified by faculty"
                                />
                                <StatCard
                                    title="Academic Points"
                                    value={stats.researchStats.points || 0}
                                    icon={SparklesIcon}
                                    color="purple"
                                    subtitle="Research contribution score"
                                />
                            </>
                        ) : (
                            <>
                                <StatCard
                                    title="My Publications"
                                    value={stats.researchStats.lectureTotal || 0}
                                    icon={AcademicCapIcon}
                                    color="blue"
                                    subtitle="Entries authored by you"
                                />
                                <StatCard
                                    title="System Total"
                                    value={stats.stats.totalResearch || 0}
                                    icon={DocumentTextIcon}
                                    color="green"
                                    subtitle="Total research in database"
                                />
                                <StatCard
                                    title="Pending Review"
                                    value={stats.researchStats.pendingTotal || 0}
                                    icon={ClipboardDocumentListIcon}
                                    color="orange"
                                    subtitle="Entries awaiting verification"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Metrics & Charts */}
            {isAdmin && stats && (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Projects"
                            value={stats.stats.totalProjects}
                            icon={FolderOpenIcon}
                            color="blue"
                            subtitle="Undergraduate & Postgraduate"
                        />
                        <StatCard
                            title="Research Entries"
                            value={stats.stats.totalResearch}
                            icon={DocumentTextIcon}
                            color="green"
                            subtitle="Peer-reviewed publications"
                        />
                        <StatCard
                            title="Verified Users"
                            value={stats.stats.totalUsers}
                            icon={UserGroupIcon}
                            color="purple"
                            subtitle="Across all departments"
                        />
                        <StatCard
                            title="Storage Used"
                            value={`${stats.stats.storageUsedMB} MB`}
                            icon={ServerIcon}
                            color="orange"
                            subtitle="S3-compatible storage"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Distribution Chart */}
                        <div className="lg:col-span-2 card bg-white border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Archive Distribution</h3>
                                    <p className="text-sm text-slate-500">Projects grouped by academic department</p>
                                </div>
                                <DocumentChartBarIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="p-6 h-[300px]">
                                {stats.projectsByDept?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={stats.projectsByDept.map((d) => ({ name: d._id, count: d.count }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                            />
                                            <YAxis 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 italic">No distribution data available yet</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="card bg-white border-slate-100 shadow-sm flex flex-col">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">System Activity</h3>
                                <p className="text-sm text-slate-500">Live feed of administrative actions</p>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[300px] flex-1">
                                {stats.recentActivity?.length > 0 ? (
                                    <div className="space-y-5">
                                        {stats.recentActivity.map((log) => (
                                            <div key={log._id} className="relative pl-6 pb-2 last:pb-0">
                                                <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 border-primary-500 bg-white z-10" />
                                                <div className="absolute left-[4px] top-4 bottom-0 w-0.5 bg-slate-100 last:hidden" />
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                                            {log.action.split('_')[0]}
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700 truncate">{log.target}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                                                        {log.userId && <span>· {log.userId.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 italic">No recent activity detected</div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <Link to="/admin/activity" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1 group">
                                    VIEW ALL LOGS <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}