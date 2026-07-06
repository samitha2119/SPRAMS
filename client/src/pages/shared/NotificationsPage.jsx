import React, { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    BellIcon, CheckIcon, TrashIcon,
    CheckCircleIcon, InboxIcon,
} from '@heroicons/react/24/outline';

const typeIcons = {
    NEW_SUBMISSION: '📄',
    EVALUATION_RECEIVED: '✅',
    STATUS_UPDATE: '🔄',
    NEW_FEEDBACK: '💬',
    FORM_UPLOADED: '📋',
    SYSTEM_ANNOUNCEMENT: '📢',
    RECORD_ADDED: '📝',
    USER_ACTION: '👤',
    APPROVAL_REQUEST: '🔔',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit: 20 };
            if (filter === 'unread') params.unreadOnly = 'true';
            const { data } = await notificationsAPI.getAll(params);
            setNotifications(data.data.notifications);
            setUnreadCount(data.data.unreadCount);
            setPagination(data.data.pagination);
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        document.title = 'Notifications | SPRAMS';
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationsAPI.delete(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            toast.success('Notification deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    if (loading && notifications.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BellIcon className="w-7 h-7 text-primary-600" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 mt-1">Stay updated with system events</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2 text-sm">
                        <CheckCircleIcon className="w-4 h-4" /> Mark All Read
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >All</button>
                <button
                    onClick={() => { setFilter('unread'); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >Unread ({unreadCount})</button>
            </div>

            {/* Notifications list */}
            {notifications.length === 0 ? (
                <EmptyState
                    icon={InboxIcon}
                    title="No Notifications"
                    message={filter === 'unread' ? 'You have no unread notifications.' : 'Your notification inbox is empty.'}
                />
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div
                            key={n._id}
                            className={`card flex items-start gap-3 transition-all ${!n.isRead ? 'bg-blue-50/50 border-blue-100' : 'hover:shadow-sm'}`}
                        >
                            {/* Icon */}
                            <div className="text-2xl flex-shrink-0 mt-0.5">
                                {typeIcons[n.type] || '📌'}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className={`text-sm ${!n.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} truncate`}>
                                        ={n.title}
                                    </h3>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                    {n.senderId && <span>· from {n.senderId.name}</span>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {!n.isRead && (
                                    <button
                                        onClick={() => handleMarkRead(n._id)}
                                        className="p-2 rounded-lg hover:bg-green-50 text-green-500"
                                        title="Mark as read"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(n._id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary text-xs disabled:opacity-50"
                            >Previous</button>
                            <span className="text-sm text-slate-500 flex items-center">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="btn-secondary text-xs disabled:opacity-50"
                            >Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}