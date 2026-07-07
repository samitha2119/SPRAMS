import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { AcademicCapIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        document.title = 'Login | SPRAMS';
    }, []);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const user = await login(data.email, data.password);
            toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
            navigate('/dashboard');
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl mb-4 shadow-lg">
                            <AcademicCapIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">SPRAMS</h1>
                        <p className="text-sm text-slate-500">Student Project & Research Archive</p>
                        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100">
                            <SparklesIcon className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-xs font-medium text-purple-600">Academic System</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <div>
                            <label htmlFor="email" className="label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@university.edu"
                                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                                })}
                            />
                            {errors.email && <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    {...register('password', { required: 'Password is required' })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p id="password-error" className="mt-1 text-xs text-red-500" role="alert">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-2.5 text-base"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-500">Don't have an account yet?</p>
                        <Link
                            to="/register"
                            className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline transition-all"
                        >
                            Create a new student or lecturer account
                        </Link>
                    </div>

                    <p className="text-center text-[10px] text-slate-400 mt-8 uppercase tracking-widest font-bold">
                        Academic Archive — University of Vavuniya
                    </p>
                </div>
            </div>
        </div>
    );  
}
