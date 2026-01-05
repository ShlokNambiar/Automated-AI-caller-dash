import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
    PhoneCall,
    Clock,
    Wallet,
    Activity,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    FileText,
    Upload,
    Play,
    LayoutDashboard,
    Search,
    MoreVertical,
    Settings
} from 'lucide-react';

const API_URL = "http://localhost:5000/api";

// --- MOCK DATA FOR DEMO ---
const DEMO_DATA = {
    metrics: {
        total_leads: 137,
        completed_calls: 124,
        pending_calls: 13,
        call_time: "193 min",
        credits: 248.50
    },
    recent_calls: [
        { id: 101, name: "Rahul Sharma", phone: "9820098200", status: "Completed", duration: "1 min", sentiment: "Interested", summary: "Asked about 2BHK price in Indradhanush. Wants site visit Saturday.", recording_url: "#", created_at: "Nov 11, 2025 • 3 days ago" },
        { id: 102, name: "Priya Patel", phone: "9892456331", status: "Completed", duration: "2 min", sentiment: "Highly Interested", summary: "Looking for ready-to-move. Loves Indraprasth amenities.", recording_url: "#", created_at: "Nov 11, 2025 • 4 days ago" },
        { id: 103, name: "Amit Verma", phone: "9137467723", status: "Completed", duration: "45s", sentiment: "Not Interested", summary: "Budget mismatch. Looking for <40L.", recording_url: "", created_at: "Oct 17, 2025" },
        { id: 104, name: "Sneha Gupta", phone: "9136850102", status: "Calling", duration: "0:32", sentiment: "Ongoing", summary: "Live call in progress...", recording_url: "", created_at: "Just now" },
        { id: 105, name: "Vikram Singh", phone: "9137467723", status: "Completed", duration: "1 min", sentiment: "Neutral", summary: "Requested brochure via WhatsApp.", recording_url: "#", created_at: "Oct 17, 2025" },
    ]
};

const Sidebar = ({ active, setActive }) => {
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", id: "dashboard" },
        { icon: <PhoneCall size={20} />, label: "Campaigns", id: "logs" },
        { icon: <CheckCircle2 size={20} />, label: "Completed", id: "completed" },
        { icon: <Wallet size={20} />, label: "Billing", id: "billing" },
        { icon: <Settings size={20} />, label: "Settings", id: "settings" },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-full fixed left-0 top-0 z-50 shadow-2xl border-r border-slate-800">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Activity size={18} className="text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">Vocacity</h1>
            </div>

            <div className="flex-1 px-3 space-y-1 mt-6">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group
              ${active === item.id
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-900/20 translate-x-1'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        {item.icon}
                        <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 mt-auto border-t border-slate-800/50">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                        DU
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-200">Demo User</p>
                        <p className="text-xs text-slate-500">Admin Workspace</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, bgClass, iconColor }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] transition-all duration-300 flex items-center gap-5 border border-slate-100 h-32 group cursor-default hover:-translate-y-1">
            <div className={`p-4 rounded-xl ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
                {React.cloneElement(icon, { size: 28, className: iconColor })}
            </div>
            <div>
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{value}</h3>
                <p className="text-slate-400 text-sm font-medium mt-1 group-hover:text-slate-600 transition-colors">{title}</p>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Completed: 'text-emerald-600 bg-emerald-50 px-3 py-1',
        Calling: 'text-blue-600 bg-blue-50 animate-pulse px-3 py-1',
        Ready: 'text-amber-600 bg-amber-50 px-3 py-1',
        Pending: 'text-gray-500 bg-gray-100 px-3 py-1',
        Failed: 'text-red-600 bg-red-50 px-3 py-1'
    };

    // Normalization
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
        <span className={`rounded-full text-xs font-bold uppercase tracking-wider ${styles[normalizedStatus] || styles.Pending}`}>
            {status}
        </span>
    );
};

const CallDetailsModal = ({ call, onClose }) => {
    if (!call) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Call Details</h3>
                        <p className="text-slate-500 text-xs">ID: #{call.id || '---'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <MoreVertical size={20} className="rotate-90" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Caller Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                            {call.phone ? call.phone.slice(-2) : '--'}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900">{call.name || "Unknown Lead"}</h4>
                            <p className="text-emerald-600 font-medium text-sm">{call.phone}</p>
                        </div>
                        <div className="ml-auto">
                            <StatusBadge status={call.status} />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
                            <p className="font-bold text-slate-800">{call.duration || "0:00"}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Sentiment</p>
                            <p className="font-bold text-slate-800">{call.sentiment || "—"}</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Call Summary</p>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed max-h-32 overflow-y-auto">
                            {call.summary || "No summary available for this call."}
                        </div>
                    </div>

                    {/* Audio Player */}
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Call Recording</p>
                        {call.recording_url && call.recording_url !== '#' && call.recording_url !== '' ? (
                            <audio controls className="w-full h-10 rounded-lg" src={call.recording_url}>
                                Your browser does not support the audio element.
                            </audio>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100 border-dashed justify-center">
                                <AlertCircle size={16} />
                                No recording available via API
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Views ---

const CallLogsView = ({ data, handleShowDetails }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Active Campaigns</h3>
            <p className="text-slate-500 text-sm mt-1">Real-time monitoring of ongoing calls</p>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
                <tr>
                    <th className="px-6 py-4">Lead Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data?.recent_calls?.filter(c => c.status === 'Calling' || c.status === 'Pending').map((call, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-bold text-slate-900">{call.name}</td>
                        <td className="px-6 py-4 text-slate-600">{call.phone}</td>
                        <td className="px-6 py-4"><StatusBadge status={call.status} /></td>
                        <td className="px-6 py-4 text-slate-500">{call.duration}</td>
                        <td className="px-6 py-4">
                            <button
                                onClick={() => handleShowDetails(call)}
                                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                                <Play size={14} /> Listen
                            </button>
                        </td>
                    </tr>
                ))}
                {(!data?.recent_calls?.filter(c => c.status === 'Calling' || c.status === 'Pending').length) && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">No active network calls.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const CompletedView = ({ data, handleShowDetails }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Completed Calls</h3>
            <p className="text-slate-500 text-sm mt-1">History of all processed leads</p>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
                <tr>
                    <th className="px-6 py-4">Lead</th>
                    <th className="px-6 py-4">Sentiment</th>
                    <th className="px-6 py-4">Summary</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data?.recent_calls?.filter(c => c.status === 'Completed').map((call, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => handleShowDetails(call)}>
                        <td className="px-6 py-4">
                            <div><p className="font-bold text-slate-900">{call.name}</p><p className="text-xs text-slate-500">{call.phone}</p></div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs border ${call.sentiment === 'Interested' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                call.sentiment === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>{call.sentiment}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={call.summary}>{call.summary}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{call.created_at}</td>
                        <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-emerald-600"><MoreVertical size={16} /></button>
                        </td>
                    </tr>
                ))}
                {(!data?.recent_calls?.filter(c => c.status === 'Completed').length) && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">No history available.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const BillingView = ({ credits }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-10">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Wallet size={32} /></div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Wallet & Credits</h2>
                <p className="text-slate-500">Manage your balance and payments</p>
            </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex justify-between items-center">
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Available Balance</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-1">₹ {credits || '0.00'}</p>
            </div>
            <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-slate-900/10 transition-all">Add Funds</button>
        </div>

        <h3 className="font-bold text-slate-800 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><Clock size={14} /></div>
                        <div><p className="text-sm font-bold text-slate-700">Call Usage</p><p className="text-xs text-slate-400">Nov {14 - i}, 2024</p></div>
                    </div>
                    <span className="text-red-500 font-bold text-sm">- ₹ 5.00</span>
                </div>
            ))}
        </div>
    </div>
);

const SettingsView = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 mt-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input type="text" value="Demo User" disabled className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input type="email" value="admin@vocacity.ai" disabled className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Workspace Name</label>
                    <input type="text" value="Admin Workspace" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900" />
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">API Configuration</h2>
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm mb-6 flex items-start gap-3 border border-amber-100">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>These settings are managed via your environment variables (.env). To update them, please restart your backend server.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ultravox API Key</label>
                    <div className="flex gap-2">
                        <input type="password" value="************************" disabled className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 font-mono" />
                        <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-200 border border-slate-200">Reveal</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Exotel Account SID</label>
                    <input type="text" value="voca-exotel-prod-8821" disabled className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 font-mono" />
                </div>
            </div>
        </div>
    </div>
);

const DashboardView = ({ data, activeCalls, progress, handleFileUpload, handleFileDrop, handleRunCampaign, campaignState, uploadState, file, fileInputRef, handleShowDetails }) => (
    <div className="space-y-8 animate-in fade-in duration-500">

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
                title="Total Calls"
                value={data?.metrics?.total_leads || 0}
                icon={<PhoneCall />}
                bgClass="bg-emerald-50"
                iconColor="text-emerald-600"
            />
            <MetricCard
                title="Call Time"
                value={data?.metrics?.call_time || "0 min"}
                icon={<Clock />}
                bgClass="bg-blue-50"
                iconColor="text-blue-600"
            />
            <MetricCard
                title="Credits Available"
                value={`₹ ${data?.metrics?.credits || 0}`}
                icon={<Wallet />}
                bgClass="bg-amber-50"
                iconColor="text-amber-600"
            />
        </div>

        {/* Main Content Area */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Call Logs</h3>
                    <p className="text-slate-500 text-sm mt-1">Track and manage all your call activities</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search calls..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 text-slate-700 placeholder-slate-400"
                        />
                    </div>

                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-200"
                    >
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <Upload size={16} />
                        Import Leads
                    </div>

                    <button
                        onClick={handleRunCampaign}
                        disabled={campaignState === 'running' || activeCalls > 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {activeCalls > 0 ? <RefreshCw size={16} className="animate-spin text-emerald-600" /> : <Play size={16} className="text-emerald-600" />}
                        {activeCalls > 0 ? 'Running...' : 'Start Campaign'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {(activeCalls > 0 || progress > 0) && (
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Campaign Active
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-emerald-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-600 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Table */}
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4">Caller</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4">Sentiment</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data?.recent_calls?.map((call, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                        <PhoneCall size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{call.phone}</p>
                                        <p className="text-xs text-slate-500">{call.name || "Unknown Lead"}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={call.status} /></td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{call.duration || '0:00'}</td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                                    {call.sentiment || '—'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                                {call.created_at || "Just now"}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => handleShowDetails(call)}
                                    className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm"
                                >
                                    Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {(!data?.recent_calls || data.recent_calls.length === 0) && (
                        <tr><td colSpan="6" className="p-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <Upload size={24} className="mb-2 opacity-50" />
                                <p>No active data found</p>
                                <p className="text-xs">Import a CSV file to get started</p>
                            </div>
                        </td></tr>
                    )}
                </tbody>
            </table>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Showing {data?.recent_calls?.length || 0} of {data?.metrics?.total_leads || 0} calls</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-slate-600">Previous</button>
                    <button className="px-3 py-1 border border-emerald-200 rounded bg-emerald-50 text-emerald-700 font-bold">1</button>
                    <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">Next</button>
                </div>
            </div>
        </div>
    </div>
);

// --- Main Component ---

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [data, setData] = useState(DEMO_DATA);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploadState, setUploadState] = useState('idle');
    const [campaignState, setCampaignState] = useState('idle');
    const [selectedCall, setSelectedCall] = useState(null);
    const fileInputRef = useRef(null);

    const handleShowDetails = (call) => {
        setSelectedCall(call);
    }

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard`);
            const realData = res.data;

            // If we have very little real data (< 5 leads), MERGE it with Demo Data
            if (realData.metrics && realData.metrics.total_leads < 5) {
                const mergedData = {
                    metrics: {
                        total_leads: realData.metrics.total_leads + DEMO_DATA.metrics.total_leads,
                        completed_calls: realData.metrics.completed_calls + DEMO_DATA.metrics.completed_calls,
                        pending_calls: realData.metrics.pending_calls + DEMO_DATA.metrics.pending_calls,
                        call_time: `${1 + parseInt(DEMO_DATA.metrics.call_time)} min`,
                        credits: realData.metrics.credits
                    },
                    recent_calls: [
                        ...(realData.recent_calls || []),
                        ...DEMO_DATA.recent_calls
                    ]
                };
                setData(mergedData);
            } else if (realData.metrics) {
                setData(realData);
            } else {
                if (data.metrics.total_leads === 0) setData(DEMO_DATA);
            }
        } catch (err) {
            console.error("Backend offline, adhering to demo data");
            if (data.metrics.total_leads === 0) setData(DEMO_DATA);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // ... upload handlers ... (same as before)

    const handleFileDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        }
    };

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        if (!uploadedFile) return;

        if (uploadedFile.type !== "text/csv" && !uploadedFile.name.endsWith('.csv')) {
            setUploadState('error');
            setTimeout(() => setUploadState('idle'), 3000);
            return;
        }

        setFile(uploadedFile);
        setUploadState('uploading');

        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            await new Promise(r => setTimeout(r, 800));
            const res = await axios.post(`${API_URL}/upload`, formData);
            setUploadState('success');
            fetchData();
        } catch (err) {
            console.error(err);
            setUploadState('error');
        } finally {
            setTimeout(() => setUploadState('idle'), 4000);
        }
    };

    const activeCalls = data?.recent_calls?.filter(c => c.status === 'Calling' || c.status === 'calling').length || 0;
    const progress = data?.metrics?.total_leads > 0
        ? (data.metrics.completed_calls / data.metrics.total_leads) * 100
        : 0;

    const handleRunCampaign = async () => {
        setCampaignState('running');
        try {
            await axios.post(`${API_URL}/start_campaign`);
            const simulatedData = { ...data };
            simulatedData.recent_calls.unshift({
                id: 999,
                name: "New Lead",
                phone: "9876543210",
                status: "Calling",
                duration: "0:01",
                sentiment: "Connecting...",
                summary: "Dialing...",
                created_at: "Just now"
            });
            setData(simulatedData);

        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex">
            <Sidebar active={activeTab} setActive={setActiveTab} />

            <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                {activeTab === 'dashboard' && (
                    <DashboardView
                        data={data}
                        activeCalls={activeCalls}
                        progress={progress}
                        handleFileUpload={handleFileUpload}
                        handleFileDrop={handleFileDrop}
                        handleRunCampaign={handleRunCampaign}
                        campaignState={campaignState}
                        uploadState={uploadState}
                        file={file}
                        fileInputRef={fileInputRef}
                        handleShowDetails={handleShowDetails}
                    />
                )}
                {activeTab === 'logs' && <CallLogsView data={data} handleShowDetails={handleShowDetails} />}
                {activeTab === 'completed' && <CompletedView data={data} handleShowDetails={handleShowDetails} />}
                {activeTab === 'billing' && <BillingView credits={data?.metrics?.credits} />}
                {activeTab === 'settings' && <SettingsView />}

                <div className="text-center text-xs text-gray-400 mt-10 pb-4">
                    Voca AI Engine 1.0
                </div>

                {/* Details Modal */}
                {selectedCall && <CallDetailsModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
            </div>
        </div>
    );
}
