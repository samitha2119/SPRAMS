import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { AcademicCapIcon, UserIcon, IdentificationIcon, BookOpenIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const FACULTIES = [
    'Faculty of Applied Science',
    'Faculty of Business Studies',
    'Faculty of Technological Studies',
];

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register: apiRegister } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            role: 'student'
        }
    });

    const password = watch('password');

    useEffect(() => {
        document.title = 'Register | SPRAMS';
    }, []);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Remove confirmPassword before sending
            const { confirmPassword, ...registerData } = data;
            const res = await apiRegister(registerData);
            if (res.data?.pendingApproval) {
                toast.success('Registration submitted! An administrator will review your account approval.', {
                    duration: 6000
                });
            } else {
                toast.success('Registration successful! Please login.');
            }
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4 shadow-lg">
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">SPRAMS</h1>
                    <p className="text-slate-500">Student Performance & Research Achievement Management System</p>
                </div>

                <div className="card shadow-2xl p-0 overflow-hidden border-none">
                    <div className="flex flex-col md:flex-row min-h-[600px]">
                        {/* Sidebar Info */}
                        <div className="w-full md:w-1/3 bg-primary-600 p-8 text-white flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold mb-4">Create Account</h2>
                                <p className="text-primary-100 text-sm leading-relaxed mb-6">
                                    Join the University of Vavuniya project archive. Archive your research, showcase your achievements, and collaborate with peers.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <BookOpenIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium">Research Archiving</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <SparklesIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium">AI Documentation Help</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-xs text-primary-200">Already have an account?</p>
                                <Link to="/login" className="text-sm font-bold hover:underline">Log in here</Link>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="flex-1 p-8 bg-white">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Full Name</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <UserIcon className="w-4 h-4" />
                                            </span>
                                            <input
                                                type="text"
                                                className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                                                placeholder="John Doe"
                                                {...register('name', { required: 'Full Name is required' })}
                                            />
                                        </div>
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="label">Registration No / Staff ID</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <IdentificationIcon className="w-4 h-4" />
                                            </span>
                                            <input
                                                type="text"
                                                className={`input-field pl-10 ${errors.regNo ? 'border-red-500' : ''}`}
                                                placeholder="2019/ICT/01"
                                                {...register('regNo', { required: 'Registration/Staff No is required' })}
                                            />
                                        </div>
                                        {errors.regNo && <p className="text-xs text-red-500 mt-1">{errors.regNo.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Email Address</label>
                                    <input
                                        type="email"
                                        className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                                        placeholder="user@univ.vau.ac.lk"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                                        })}
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Faculty</label>
                                        <select
                                            className="input-field"
                                            {...register('faculty', { required: 'Faculty is required' })}
                                        >
                                            <option value="">Select Faculty</option>
                                            {FACULTIES.map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="label">Role</label>
                                        <select
                                            className="input-field font-medium"
                                            {...register('role', { required: 'Role is required' })}
                                        >
                                            <option value="student">Student</option>
                                            <option value="lecturer">Lecturer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                                placeholder="••••••••"
                                                {...register('password', {
                                                    required: 'Password is required',
                                                    minLength: { value: 6, message: 'Minimum 6 characters' }
                                                })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                                    </div>

                                    <div>
                                        <label className="label">Confirm Password</label>
                                        <input
                                            type="password"
                                            className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            placeholder="••••••••"
                                            {...register('confirmPassword', {
                                                required: 'Please confirm password',
                                                validate: value => value === password || 'Passwords do not match'
                                            })}
                                        />
                                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-3 mt-4"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating Account...
                                        </span>
                                    ) : 'Create Admin/Member Account'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-8">
                    Note: Registration is subject to verification by the University administrative staff.
                </p>
            </div>
        </div>
    );
}
