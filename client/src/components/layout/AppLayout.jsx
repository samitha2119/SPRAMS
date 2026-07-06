import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../ui/NotificationBell';
import toast from 'react-hot-toast';
import {
    HomeIcon, FolderOpenIcon, DocumentTextIcon, MagnifyingGlassIcon,
    UsersIcon, Bars3Icon, XMarkIcon, ChevronDoubleLeftIcon, SparklesIcon,
    ArrowRightOnRectangleIcon, AcademicCapIcon, ClipboardDocumentListIcon,
    FolderPlusIcon, DocumentPlusIcon,
    BookOpenIcon, ClipboardDocumentCheckIcon, BellIcon,
    DocumentDuplicateIcon, BriefcaseIcon,
} from '@heroicons/react/24/outline';

const navSections = [
    {
        title: 'Main',
        roles: ['admin', 'lecturer', 'student'],
        items: [
            { label: 'Dashboard', icon: HomeIcon, path: '/dashboard', roles: ['admin', 'lecturer', 'student'] },
        ]
    },
    {
        title: 'Explore',
        roles: ['admin', 'lecturer', 'student'],
        items: [
            { label: 'Projects', icon: FolderOpenIcon, path: '/projects', roles: ['student'] },
            { label: 'Research', icon: DocumentTextIcon, path: '/research', roles: ['lecturer', 'student'] },
            { label: 'Search', icon: MagnifyingGlassIcon, path: '/search', roles: ['admin', 'lecturer', 'student'] },
        ]
    },
    {
        title: 'Contribute',
        roles: ['lecturer', 'student'],
        items: [
            { label: 'Add Project', icon: FolderPlusIcon, path: '/add-project', roles: ['student'] },
            { label: 'Add Research', icon: DocumentPlusIcon, path: '/add-research', roles: ['lecturer', 'student'] },
        ]
    },
    {
        title: 'Student',
        roles: ['student'],
        items: [
            { label: 'My Work', icon: BriefcaseIcon, path: '/workspace', roles: ['student'] },
        ]
    },
    {
        title: 'Lecturer',
        roles: ['lecturer'],
        items: [
            { label: 'My Publications', icon: BookOpenIcon, path: '/lecturer/research', roles: ['lecturer'] },
            { label: 'Evaluations', icon: ClipboardDocumentCheckIcon, path: '/evaluations', roles: ['lecturer'] },
        ]
    },

    {
        title: 'Resources',
        roles: ['admin', 'lecturer', 'student'],
        items: [
            { label: 'Form Templates', icon: DocumentDuplicateIcon, path: '/form-templates', roles: ['admin', 'student'] },
            { label: 'Notifications', icon: BellIcon, path: '/notifications', roles: ['admin', 'lecturer', 'student'] },
        ]
    },
    {
        title: 'Management',
        roles: ['admin'],
        items: [
            { label: 'Users', icon: UsersIcon, path: '/admin/users', roles: ['admin'] },
            { label: 'Manage Projects', icon: FolderOpenIcon, path: '/admin/projects', roles: ['admin'] },
            { label: 'Manage Research', icon: DocumentTextIcon, path: '/admin/research', roles: ['admin'] },
            { label: 'Activity Logs', icon: ClipboardDocumentListIcon, path: '/admin/activity', roles: ['admin'] },
        ]
    }
];

const roleColors = {
    admin: 'badge-red',
    lecturer: 'badge-blue',
    student: 'badge-green',
};

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">SPRAMS</p>
                        <p className="text-xs text-slate-500 leading-tight">Archive System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-6" aria-label="Main navigation">
                {navSections
                    .filter((section) => section.roles.includes(user?.role))
                    .map((section) => (
                        <div key={section.title} className="space-y-1">
                            {!collapsed && (
                                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    {section.title}
                                </p>
                            )}
                            {section.items
                                .filter((item) => item.roles.includes(user?.role))
                                .map((item) => {
                                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                                            aria-current={isActive ? 'page' : undefined}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                        </div>
                    ))}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-slate-100">
                {!collapsed ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                            <span className={`badge ${roleColors[user?.role] || 'badge-blue'} capitalize`}>{user?.role}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold" title={user?.name}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
                    aria-label="Sign out"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>

            {/* Collapse toggle (desktop only) */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex items-center justify-center p-2 mx-3 mb-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <ChevronDoubleLeftIcon className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200 shadow-lg lg:shadow-none transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}`}
                aria-label="Sidebar"
            >
                {/* Mobile close button */}
                <button
                    className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-slate-600"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top navbar */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0 shadow-sm">
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                        {/* Breadcrumb */}
                        <span className="text-sm text-slate-500 hidden sm:block">
                            {navSections
                                .flatMap(s => s.items)
                                .find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))?.label || 'Dashboard'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">


                        {/* Notification bell */}
                        <NotificationBell />

                        {/* User pill */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700 hidden md:block">{user?.name}</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6" id="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
