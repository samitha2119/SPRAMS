import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [recent, setRecent] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Poll every 30s
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await notificationsAPI.getUnreadCount();
                setUnreadCount(data.data.unreadCount);
            } catch { /* silent */ }
        };
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load recent when opened
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const { data } = await notificationsAPI.getAll({ limit: 5 });
                setRecent(data.data.notifications);
            } catch { /* silent */ }
        })();
    }, [open]);

    const handleMarkRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setRecent((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Notifications"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-700 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-primary-600 font-medium">{unreadCount} unread</span>
                        )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {recent.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400 text-center">No notifications</p>
                        ) : (
                            recent.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.isRead && handleMarkRead(n._id)}
                                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-xs ${!n.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'} truncate flex-1`}>
                                            {n.title}
                                        </h4>
                                        {!n.isRead && <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        to="/notifications"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 text-center text-xs font-medium text-primary-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
                    >
                        View All Notifications →
                    </Link>
                </div>
            )}
        </div>
    );
}
