import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="top-right" />
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-slate-50">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-500 font-medium animate-pulse text-sm uppercase tracking-widest">Loading SPRAMS...</p>
                        </div>
                    </div>
                }>
                    <AppRoutes />
                </Suspense>
            </Router>
        </AuthProvider>
    );
};

export default App;
