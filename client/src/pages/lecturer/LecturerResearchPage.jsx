import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { lecturerResearchAPI } from '../../services/api';
import { PageSpinner, EmptyState } from '../../components/ui/Common';
import toast from 'react-hot-toast';
import { DocumentTextIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export default function LecturerResearchPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const loadEntries = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await lecturerResearchAPI.getAll({ page, limit: 10 });
            setEntries(data.data.entries);
            setPagination(data.data.pagination);
        } catch (err) {
            toast.error('Failed to load research entries');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        document.title = 'My Research | SPRAMS';
        loadEntries();
    }, [loadEntries]);

    if (loading && entries.length === 0) return <PageSpinner />;

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpenIcon className="w-7 h-7 text-primary-600" />
                        My Research Publications
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your own research entries and publications.</p>
                </div>
            </div>

            {entries.length === 0 && !loading && (
                <EmptyState
                    icon={DocumentTextIcon}
                    title="No Research Entries"
                    message="You haven't added any research publications yet."
                />
            )}
        </div>
    );
}