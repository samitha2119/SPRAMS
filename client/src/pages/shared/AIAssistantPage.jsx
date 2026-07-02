import React, { useState } from 'react';
import { dashboardAPI } from '../../services/api';
import { SparklesIcon, DocumentPlusIcon, PencilSquareIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Spinner, AIBadge } from '../../components/ui/Common';

export default function AIAssistantPage() {
    const [activeTab, setActiveTab] = useState('generate');
    const [loading, setLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [keywords, setKeywords] = useState('');
    const [dept, setDept] = useState('IT');
    const [abstract, setAbstract] = useState('');

    // Result states
    const [generatedAbstract, setGeneratedAbstract] = useState('');
    const [improvedAbstract, setImprovedAbstract] = useState('');
    const [suggestedTitles, setSuggestedTitles] = useState([]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!title || !keywords) return toast.error('Please provide a title and key points');

        setLoading(true);
        try {
            const { data } = await dashboardAPI.generateAbstract({ title, keywords, department: dept });
            setGeneratedAbstract(data.data.generated);
            toast.success('Abstract generated successfully!');
        } catch (err) {
            toast.error('Failed to generate abstract');
        } finally {
            setLoading(false);
        }
    };

    const handleImprove = async (e) => {
        e.preventDefault();
        if (!abstract || abstract.length < 50) return toast.error('Abstract must be at least 50 characters');

        setLoading(true);
        try {
            const { data } = await dashboardAPI.improveAbstract(abstract);
            setImprovedAbstract(data.data.improved);
            toast.success('Abstract improved successfully!');
        } catch (err) {
            toast.error('Failed to improve abstract');
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestTitles = async () => {
        if (!abstract) return toast.error('Please provide an abstract first');

        setLoading(true);
        try {
            const { data } = await dashboardAPI.suggestTitles({ abstract, currentTitle: title });
            setSuggestedTitles(data.data.suggestions);
            toast.success('Titles suggested!');
        } catch (err) {
            toast.error('Failed to suggest titles');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <SparklesIcon className="w-7 h-7 text-primary-600" />
                        Academic Assistant
                    </h1>
                    <p className="text-slate-500 mt-1">Leverage advanced processing to perfect your project documentation</p>
                </div>
                <AIBadge label="Academic Intelligence" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'generate' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Generate Abstract
                </button>
                <button
                    onClick={() => setActiveTab('improve')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'improve' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Refine Text
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Inputs Column */}
                <div className="lg:col-span-5 space-y-6">
                    {activeTab === 'generate' ? (
                        <div className="card space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                                <DocumentPlusIcon className="w-5 h-5 text-primary-500" />
                                <h3>Abstract Generator</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Proposed Project Title</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Smart Irrigation System using IoT"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">Key Points / Keywords</label>
                                    <textarea
                                        className="input-field h-32 resize-none"
                                        placeholder="List the main features, problems solved, and methodology used..."
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">Department</label>
                                    <select className="input-field" value={dept} onChange={(e) => setDept(e.target.value)}>
                                        <option>IT</option>
                                        <option>AMC</option>
                                        <option>BIO</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="btn-primary w-full py-3"
                                >
                                    {loading ? <Spinner size="sm" /> : 'Generate Academic Abstract'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                                <PencilSquareIcon className="w-5 h-5 text-accent-500" />
                                <h3>Tone Refiner</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Original Abstract / Text</label>
                                    <textarea
                                        className="input-field h-64 resize-none"
                                        placeholder="Paste your draft abstract here to improve its academic tone..."
                                        value={abstract}
                                        onChange={(e) => setAbstract(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Min 50 characters required for analysis.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleImprove}
                                        disabled={loading || abstract.length < 50}
                                        className="btn-primary flex-1 py-3"
                                    >
                                        {loading ? <Spinner size="sm" /> : 'Polish Tone'}
                                    </button>
                                    <button
                                        onClick={handleSuggestTitles}
                                        disabled={loading || !abstract}
                                        className="btn-secondary py-3 px-4"
                                        title="Suggest catchy titles based on this text"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Column */}
                <div className="lg:col-span-7 space-y-6">
                    {(generatedAbstract || improvedAbstract || suggestedTitles.length > 0) ? (
                        <>
                            {activeTab === 'generate' && generatedAbstract && (
                                <div className="card border-primary-100 bg-primary-50/30 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-primary-900 flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-primary-500" />
                                            Generated Abstract
                                        </h3>
                                        <button
                                            onClick={() => copyToClipboard(generatedAbstract)}
                                            className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                                        >
                                            <ClipboardDocumentCheckIcon className="w-4 h-4" /> Copy Text
                                        </button>
                                    </div>
                                    <div className="prose prose-sm text-slate-700 bg-white p-6 rounded-xl border border-primary-100 shadow-sm leading-relaxed italic">
                                        {generatedAbstract}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'improve' && improvedAbstract && (
                                <div className="card border-accent-100 bg-accent-50/30 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-accent-900 flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-accent-500" />
                                            Improved Academic Version
                                        </h3>
                                        <button
                                            onClick={() => copyToClipboard(improvedAbstract)}
                                            className="text-xs text-accent-600 hover:text-accent-800 font-medium flex items-center gap-1"
                                        >
                                            <ClipboardDocumentCheckIcon className="w-4 h-4" /> Copy Text
                                        </button>
                                    </div>
                                    <div className="prose prose-sm text-slate-700 bg-white p-6 rounded-xl border border-accent-100 shadow-sm leading-relaxed">
                                        {improvedAbstract}
                                    </div>
                                </div>
                            )}

                            {suggestedTitles.length > 0 && (
                                <div className="card animate-in fade-in slide-in-from-bottom-4">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <PencilSquareIcon className="w-5 h-5 text-indigo-500" />
                                        Suggested Project Titles
                                    </h3>
                                    <div className="space-y-2">
                                        {suggestedTitles.map((t, i) => (
                                            <div
                                                key={i}
                                                className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary-200 transition-all cursor-pointer"
                                                onClick={() => copyToClipboard(t)}
                                            >
                                                <span className="text-sm text-slate-600 group-hover:text-primary-700 transition-colors font-medium">{t}</span>
                                                <ClipboardDocumentCheckIcon className="w-4 h-4 text-slate-300 group-hover:text-primary-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <SparklesIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-400">Analysis output will appear here</h3>
                            <p className="text-sm text-slate-400 max-w-xs mt-2">Fill in the form and click the button to see the magic of academic intelligence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
