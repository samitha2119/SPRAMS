import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, tokenStorage } from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if token is expired
    const isTokenExpired = (token) => {
        try {
            const { exp } = jwtDecode(token);
            return Date.now() >= exp * 1000;
        } catch {
            return true;
        }
    };

    // Initialize auth state from localStorage
    useEffect(() => {
        const initialize = async () => {
            const token = tokenStorage.getAccess();
            if (token && !isTokenExpired(token)) {
                try {
                    const { data } = await authAPI.getMe();
                    setUser(data.data.user);
                    setIsAuthenticated(true);
                } catch {
                    tokenStorage.clearTokens();
                }
            } else if (token && isTokenExpired(token)) {
                // Try to refresh
                const refreshToken = tokenStorage.getRefresh();
                if (refreshToken) {
                    try {
                        const { data } = await authAPI.refresh(refreshToken);
                        tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
                        const { data: meData } = await authAPI.getMe();
                        setUser(meData.data.user);
                        setIsAuthenticated(true);
                    } catch {
                        tokenStorage.clearTokens();
                    }
                } else {
                    tokenStorage.clearTokens();
                }
            }
            setLoading(false);
        };
        initialize();
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await authAPI.login({ email, password });
        const { user: loggedUser, accessToken, refreshToken } = data.data;
        tokenStorage.setTokens(accessToken, refreshToken);
        setUser(loggedUser);
        setIsAuthenticated(true);
        return loggedUser;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch { }
        tokenStorage.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin',
        isLecturer: user?.role === 'lecturer',
        isStudent: user?.role === 'student',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
