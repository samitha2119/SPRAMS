import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import { StatCard, PageSpinner } from '../../components/ui/Common';
import {
    DocumentTextIcon, ClipboardDocumentListIcon, SparklesIcon,
    ShieldCheckIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';

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

            {/* Research Statistics Section (New) */}
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
        </div>
    );
}