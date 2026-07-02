import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../../services/api';
import { PageSpinner, EmptyState, Pagination, AIBadge, FileTypeBadge } from '../../components/ui/Common';
import {
    MagnifyingGlassIcon, SparklesIcon, FolderOpenIcon, DocumentTextIcon,
    FunnelIcon, XMarkIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['IT', 'AMC', 'BIO'];

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState({ projects: [], research: [], suggestions: [] });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: searchParams.get('type') || 'all',
        department: searchParams.get('department') || '',
        year: searchParams.get('year') || '',
    });

    // Sync state with URL params
    useEffect(() => {
        setQuery(searchParams.get('q') || '');
        setFilters({
            type: searchParams.get('type') || 'all',
            department: searchParams.get('department') || '',
            year: searchParams.get('year') || '',
        });
    }, [searchParams]);

    const fetchResults = useCallback(async () => {
        const q = searchParams.get('q');
        if (!q && !searchParams.get('department') && !searchParams.get('year')) {
            setResults({ projects: [], research: [], suggestions: [] });
            return;
        }

        setLoading(true);
        try {
            const params = Object.fromEntries([...searchParams]);
            const { data } = await searchAPI.search(params);
            setResults(data.data.results);
            setPagination(data.data.pagination || { page: 1, totalPages: 1 });
        } catch (err) {
            toast.error('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        document.title = 'Search | SPRAMS';
        fetchResults();
    }, [fetchResults]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const newParams = { q: query };
        if (filters.type !== 'all') newParams.type = filters.type;
        if (filters.department) newParams.department = filters.department;
        if (filters.year) newParams.year = filters.year;

        // Remove empty values
        Object.keys(newParams).forEach(key => !newParams[key] && delete newParams[key]);

        setSearchParams(newParams);
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        const newParams = Object.fromEntries([...searchParams]);
        newParams.q = suggestion;
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setQuery('');
        setFilters({ type: 'all', department: '', year: '' });
        setSearchParams({});
    };

    const hasActiveFilters = query || filters.department || filters.year || filters.type !== 'all';

    return (
        <div className="space-y-6 fade-in">
            {/* Search Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search projects, research papers, or keywords..."
                            className="input-field pl-12 pr-24 py-3.5 text-lg shadow-sm focus:ring-primary-500/20"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-6"
                        >
                            Search
                        </button>
                    </div>

                    {/* AI Suggestions */}
                    {results.suggestions?.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 uppercase tracking-wider mr-1">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>AI Related:</span>
                            </div>
                            {results.suggestions.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm rounded-full border border-purple-100 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </form>

                {/* Filters Row */}
                <div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
                        <FunnelIcon className="w-4 h-4" />
                        <span>Filter by:</span>
                    </div>

                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="input-field py-1.5 px-3 text-sm w-auto"
                    >
                        <option value="all">Everything</option>
                        <option value="projects">Projects Only</option>
                        <option value="research">Research Only</option>
                    </select>

                    <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="input-field py-1.5 px-3 text-sm w-auto max-w-[200px]"
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <input
                        type="text"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        placeholder="Year"
                        className="input-field py-1.5 px-3 text-sm w-24"
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-auto"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {loading ? (
                <PageSpinner />
            ) : !searchParams.get('q') && !searchParams.get('department') && !searchParams.get('year') ? (
                <EmptyState
                    icon={MagnifyingGlassIcon}
                    title="Find Academic Wisdom"
                    description="Enter a search term or use the filters above to browse our archive."
                />
            ) : results.projects?.length === 0 && results.research?.length === 0 ? (
                <EmptyState
                    icon={XMarkIcon}
                    title="No results found"
                    description={`We couldn't find anything matching "${searchParams.get('q') || ''}"`}
                />
            ) : (
                <div className="space-y-8">
                    {/* Projects Results */}
                    {results.projects?.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <FolderOpenIcon className="w-5 h-5 text-slate-400" />
                                <h2 className="text-lg font-bold text-slate-800">Projects ({results.projectsTotal || results.projects.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.projects.map(p => (
                                    <SearchResultCard key={p._id} item={p} type="project" />
                                ))}
                            </div>
                        </section>
                    )}

                    {results.research?.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4 mt-8">
                                <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                                <h2 className="text-lg font-bold text-slate-800">Research Entries ({results.researchTotal || results.research.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.research.map(r => (
                                    <SearchResultCard key={r._id} item={r} type="research" />
                                ))}
                            </div>
                        </section>
                    )}

                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(p) => {
                            const newParams = Object.fromEntries([...searchParams]);
                            newParams.page = p;
                            setSearchParams(newParams);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function SearchResultCard({ item, type }) {
    const isProject = type === 'project';
    const linkPath = isProject ? `/projects/${item._id}` : `/research/${item._id}`;

    return (
        <div className="card hover:border-primary-200 hover:shadow-md transition-all group">
            <Link to={linkPath} className="block h-full flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <span className={`badge ${isProject ? 'badge-blue' : 'badge-purple'} text-[10px] uppercase tracking-wider font-bold`}>
                        {isProject ? item.academicYear : item.year}
                    </span>
                    {!isProject && item.aiSummary && <AIBadge label="AI Summary" />}
                </div>

                <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                    {item.title}
                </h3>

                <p className="text-xs text-slate-500 mb-4 line-clamp-3">
                    {isProject ? item.abstract : (item.aiSummary || item.description)}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isProject ? (
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                                {item.department}
                            </span>
                        ) : (
                            <div className="flex gap-1">
                                {item.files?.slice(0, 2).map(f => (
                                    <FileTypeBadge key={f._id} type={f.fileType} />
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-primary-600 font-semibold text-xs flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ChevronRightIcon className="w-3 h-3" />
                    </span>
                </div>
            </Link>
        </div>
    );
}
