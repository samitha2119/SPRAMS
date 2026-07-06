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

