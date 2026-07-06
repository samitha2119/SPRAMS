import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, authAPI } from '../../services/api';
import { PageSpinner, Pagination, Modal, ConfirmDialog, Spinner, ErrorAlert } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import {
    UsersIcon, UserPlusIcon, PencilIcon, TrashIcon,
    ShieldCheckIcon, ShieldExclamationIcon, CheckCircleIcon,
    XCircleIcon, FunnelIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

/* ── Create New User Form ── */
function CreateUserForm({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { name: '', email: '', password: '', role: 'student' }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await authAPI.adminRegister(data);
            toast.success(`User "${data.name}" created successfully`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="e.g. John Silva"
                    {...register('name', {
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                        maxLength: { value: 100, message: 'Name cannot exceed 100 characters' }
                    })}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <label className="label">Email Address <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="e.g. john@uov.ac.lk"
                    {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' }
                    })}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                        placeholder="Min. 6 characters"
                        {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        })}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
                <label className="label">Role <span className="text-red-500">*</span></label>
                <select className="input-field" {...register('role', { required: true })}>
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">System Admin</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                    {'{'}Student: read access | Lecturer: advanced access | Admin: full access{'}'}
                </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <Spinner size="sm" /> : 'Create User'}
                </button>
            </div>
        </form>
    );
}

function UserForm({ onClose, onSuccess, initialData }) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            role: 'student', isActive: true
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await dashboardAPI.updateUser(initialData._id, data);
            toast.success('User updated successfully');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <p className="text-sm font-bold text-slate-800">{initialData.name}</p>
                <p className="text-xs text-slate-500">{initialData.email}</p>
            </div>

            <div>
                <label className="label">Access Role</label>
                <select className="input-field" {...register('role', { required: true })}>
                    <option value="student">Student (Read-only)</option>
                    <option value="lecturer">Lecturer (Advanced Access)</option>
                    <option value="admin">System Admin (Full Access)</option>
                </select>
            </div>

            <div className="flex items-center gap-2 py-2">
                <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    {...register('isActive')}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Account Active (User can log in)
                </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? <Spinner size="sm" /> : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ role: '', isActive: '' });
    const [editUser, setEditUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await dashboardAPI.getUsers({ page, ...filters });
            setUsers(data.data.users);
            setPagination(data.data.pagination);
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        document.title = 'User Management | SPRAMS';
        fetchUsers(1);
    }, [fetchUsers]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await dashboardAPI.deleteUser(deleteConfirm._id);
            toast.success('User deleted');
            setDeleteConfirm(null);
            fetchUsers(pagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon className="w-7 h-7 text-primary-600" />
                        User Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Control access and roles across the system</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Add New User
                </button>
            </div>
            {/* Filters */}
            <div className="card py-4 flex flex-col sm:flex-row gap-3 items-center">
                <FunnelIcon className="w-4 h-4 text-slate-400" />
                <select
                    value={filters.role}
                    onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
                    className="input-field py-1.5 text-sm w-full sm:w-40"
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="student">Student</option>
                </select>
                <select
                    value={filters.isActive}
                    onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value }))}
                    className="input-field py-1.5 text-sm w-full sm:w-40"
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <button onClick={() => setFilters({ role: '', isActive: '' })} className="btn-ghost text-sm ml-auto">
                    Clear Filters
                </button>
            </div>

            {error && <ErrorAlert message={error} />}

            {loading ? <PageSpinner /> : (
                <div className="card p-0 overflow-hidden border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                                                    <p className="text-xs text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${user.role === 'admin' ? 'badge-red' :
                                                user.role === 'lecturer' ? 'badge-blue' : 'badge-green'
                                                } capitalize text-[10px]`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                                    <CheckCircleIcon className="w-4 h-4" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                                    <XCircleIcon className="w-4 h-4" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="Edit Permissions"
                                                >
                                                    <ShieldCheckIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete User"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={fetchUsers}
                        />
                    </div>
                </div>
            )}
                {/* Modal for editing user */}
                        <Modal
                            isOpen={!!editUser}
                            onClose={() => setEditUser(null)}
                            title="Manage User Access"
                            size="md"
                        >
                            {editUser && (
                                <UserForm
                                    initialData={editUser}
                                    onClose={() => setEditUser(null)}
                                    onSuccess={() => fetchUsers(pagination.page)}
                                />
                            )}
                        </Modal>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New User"
                size="md"
            >
                <CreateUserForm
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => fetchUsers(1)}
                />
            </Modal>