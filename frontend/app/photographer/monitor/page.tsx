"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Loader2, Clock, Activity, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Stage = {
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at: number | null;
  completed_at: number | null;
  message: string;
};

type PipelineJob = {
  filename: string;
  event_name: string;
  status: 'running' | 'completed' | 'failed';
  created_at: number;
  stages: Stage[];
};

const STATUS_COLORS = {
  queued: 'bg-gray-200 text-gray-500',
  running: 'bg-blue-100 text-blue-600 animate-pulse',
  completed: 'bg-emerald-100 text-emerald-600',
  failed: 'bg-red-100 text-red-600',
};

const STATUS_ICONS = {
  queued: <Clock className="w-4 h-4" />,
  running: <Loader2 className="w-4 h-4 animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
};

const CONNECTOR_COLORS = {
  queued: 'bg-gray-200',
  running: 'bg-blue-300 animate-pulse',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
};

function formatDuration(start: number | null, end: number | null): string {
  if (!start) return '—';
  const elapsed = ((end || Date.now() / 1000) - start);
  if (elapsed < 1) return '<1s';
  if (elapsed < 60) return `${Math.round(elapsed)}s`;
  return `${Math.floor(elapsed / 60)}m ${Math.round(elapsed % 60)}s`;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString();
}

export default function PipelineMonitorPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role !== 'photographer') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/monitor/jobs', { cache: 'no-store' });
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch (err) {
      console.error('Monitor fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

  const clearJobs = async () => {
    if (!confirm('Clear all pipeline history?')) return;
    await fetch('http://localhost:8000/api/monitor/jobs', { method: 'DELETE' });
    setJobs([]);
  };

  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter(j => j.status === filterStatus);

  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 font-medium">Loading Pipeline Monitor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-['Inter',sans-serif] text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/photographer')}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-3 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pipeline Monitor</h1>
                <p className="text-sm text-gray-400">Real-time photo processing pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${autoRefresh ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
              <button onClick={clearJobs} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400 transition-colors text-sm font-semibold flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Jobs</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">Running</p>
            <p className="text-2xl font-bold text-blue-400">{stats.running}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          {['all', 'running', 'completed', 'failed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {status} {status !== 'all' && `(${stats[status as keyof typeof stats] ?? 0})`}
            </button>
          ))}
        </div>

        {/* Pipeline Jobs Table */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No pipeline jobs</h3>
            <p className="text-gray-600 text-sm">Upload photos to see real-time processing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.filename}
                className={`bg-gray-900 rounded-xl border transition-all duration-200 ${
                  job.status === 'running' ? 'border-blue-800' : job.status === 'failed' ? 'border-red-900' : 'border-gray-800'
                }`}
              >
                {/* Job Header Row */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-800/50 rounded-xl transition-colors"
                  onClick={() => setExpandedJob(expandedJob === job.filename ? null : job.filename)}
                >
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    job.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {job.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     job.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                     <XCircle className="w-4 h-4" />}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{job.filename}</p>
                    <p className="text-xs text-gray-500">{job.event_name} &bull; {formatTime(job.created_at)}</p>
                  </div>

                  {/* Mini Pipeline Stages (Synapse-style) */}
                  <div className="hidden md:flex items-center gap-1">
                    {job.stages.map((stage, i) => (
                      <div key={stage.name} className="flex items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${STATUS_COLORS[stage.status]}`} title={`${stage.name}: ${stage.status}`}>
                          {STATUS_ICONS[stage.status]}
                        </div>
                        {i < job.stages.length - 1 && (
                          <div className={`w-6 h-0.5 ${CONNECTOR_COLORS[stage.status]}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-gray-500 w-16 text-right">
                    {formatDuration(job.created_at, job.status === 'running' ? null : (job.stages[job.stages.length - 1].completed_at || job.created_at))}
                  </span>
                </div>

                {/* Expanded Detail */}
                {expandedJob === job.filename && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-800">
                    <div className="flex items-start gap-4 mt-3">
                      {job.stages.map((stage, i) => (
                        <div key={stage.name} className="flex items-start flex-1">
                          <div className="flex flex-col items-center flex-1">
                            {/* Stage Card */}
                            <div className={`w-full rounded-lg p-3 border ${
                              stage.status === 'completed' ? 'bg-emerald-500/5 border-emerald-800' :
                              stage.status === 'running' ? 'bg-blue-500/5 border-blue-800' :
                              stage.status === 'failed' ? 'bg-red-500/5 border-red-800' :
                              'bg-gray-800/50 border-gray-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`${STATUS_COLORS[stage.status]} w-6 h-6 rounded-md flex items-center justify-center`}>
                                  {STATUS_ICONS[stage.status]}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider">{stage.name}</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {stage.status === 'queued' ? 'Waiting...' : stage.message || stage.status}
                              </p>
                              {stage.started_at && (
                                <p className="text-[10px] text-gray-600 mt-1">
                                  Duration: {formatDuration(stage.started_at, stage.completed_at)}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Connector Arrow */}
                          {i < job.stages.length - 1 && (
                            <div className="flex items-center h-full pt-6 px-1">
                              <div className={`w-4 h-0.5 ${CONNECTOR_COLORS[stage.status]}`} />
                              <div className={`w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-transparent ${
                                stage.status === 'completed' ? 'border-l-emerald-400' :
                                stage.status === 'running' ? 'border-l-blue-400' :
                                stage.status === 'failed' ? 'border-l-red-400' :
                                'border-l-gray-600'
                              }`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
