import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ui/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Shared Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/shared/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/shared/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../pages/shared/ProjectDetailPage'));
const ResearchPage = lazy(() => import('../pages/shared/ResearchPage'));
const ResearchDetailPage = lazy(() => import('../pages/shared/ResearchDetailPage'));
const SearchPage = lazy(() => import('../pages/shared/SearchPage'));
const NotificationsPage = lazy(() => import('../pages/shared/NotificationsPage'));
const FormTemplatesPage = lazy(() => import('../pages/shared/FormTemplatesPage'));
const ProjectResourcesPage = lazy(() => import('../pages/shared/ProjectResourcesPage'));

// Admin Pages
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
const ActivityLogPage = lazy(() => import('../pages/admin/ActivityLogPage'));
const AdminProjectsPage = lazy(() => import('../pages/admin/AdminProjectsPage'));
const AdminResearchPage = lazy(() => import('../pages/admin/AdminResearchPage'));

// Lecturer Pages
const LecturerResearchPage = lazy(() => import('../pages/lecturer/LecturerResearchPage'));
const EvaluationPage = lazy(() => import('../pages/lecturer/EvaluationPage'));

// Student Pages
const AddProjectPage = lazy(() => import('../pages/student/AddProjectPage'));
const AddResearchPage = lazy(() => import('../pages/student/AddResearchPage'));
const StudentResearchPage = lazy(() => import('../pages/student/StudentResearchPage'));
const StudentWorkspace = lazy(() => import('../pages/student/StudentWorkspace'));

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Main Protected Routes */}
            <Route element={<ProtectedRoute roles={['admin', 'lecturer', 'student']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    <Route path="/research" element={<ResearchPage />} />
                    <Route path="/research/:id" element={<ResearchDetailPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/add-project" element={<AddProjectPage />} />
                    <Route path="/add-research" element={<AddResearchPage />} />
                    <Route path="/project-resources" element={<ProjectResourcesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/form-templates" element={<FormTemplatesPage />} />
                    <Route path="/student-research" element={<StudentResearchPage />} />
                    <Route path="/workspace" element={<StudentWorkspace />} />
                </Route>
            </Route>

            {/* Admin and Lecturer routes */}
            <Route element={<ProtectedRoute roles={['admin', 'lecturer']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/lecturer/research" element={<LecturerResearchPage />} />
                    <Route path="/evaluations" element={<EvaluationPage />} />
                </Route>
            </Route>

            {/* Admin only routes */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/admin/users" element={<UserManagementPage />} />
                    <Route path="/admin/activity" element={<ActivityLogPage />} />
                    <Route path="/admin/projects" element={<AdminProjectsPage />} />
                    <Route path="/admin/research" element={<AdminResearchPage />} />
                </Route>
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 handler */}
            <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col p-4 text-center">
                    <h1 className="text-8xl font-black text-slate-200">404</h1>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">Page Not Found</h2>
                    <p className="text-slate-500 mt-2 mb-8 max-w-xs">The resource you are looking for might have been removed or is temporarily unavailable.</p>
                    <a href="/dashboard" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">Return Home</a>
                </div>
            } />
        </Routes>
    );
};

export default AppRoutes;
