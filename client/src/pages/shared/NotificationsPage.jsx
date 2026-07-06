import React, { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    BellIcon, CheckIcon, TrashIcon,
    CheckCircleIcon, DocumentTextIcon,
    InboxIcon,
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
            {notifications.length === 0 && (
                <EmptyState
                    icon={InboxIcon}
                    title="No Notifications"
                    message={filter === 'unread' ? 'You have no unread notifications.' : 'Your notification inbox is empty.'}
                />
            )}
        </div>
    );
}