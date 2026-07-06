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