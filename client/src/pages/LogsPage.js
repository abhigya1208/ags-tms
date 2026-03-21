import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, EmptyState, Pagination } from '../components/common';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const ACTION_LABELS = {
  CREATE_STUDENT: { label: 'Student Added', color: 'bg-sage-100 text-sage-700' },
  UPDATE_STUDENT: { label: 'Student Updated', color: 'bg-blue-100 text-blue-700' },
  DELETE_STUDENT: { label: 'Student Deleted', color: 'bg-red-100 text-red-600' },
  ARCHIVE_STUDENT: { label: 'Archived', color: 'bg-amber-100 text-amber-700' },
  UNARCHIVE_STUDENT: { label: 'Unarchived', color: 'bg-sage-100 text-sage-700' },
  UPDATE_FEE: { label: 'Fee Updated', color: 'bg-peach-100 text-peach-700' },
  CREATE_TEACHER: { label: 'Teacher Created', color: 'bg-purple-100 text-purple-700' },
  UPDATE_TEACHER: { label: 'Teacher Updated', color: 'bg-purple-100 text-purple-700' },
  UNDO_ACTION: { label: 'Undo', color: 'bg-gray-100 text-gray-600' },
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterAction) params.set('action', filterAction);
      const res = await api.get(`/logs?${params}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  }, [page, filterAction]);

  useEffect(() => { setPage(1); }, [filterAction]);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Audit Logs" subtitle={`${total} total records`} />

      <div className="card py-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterAction('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filterAction ? 'bg-sage-500 text-white' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'}`}>
            All
          </button>
          {Object.entries(ACTION_LABELS).map(([key, val]) => (
            <button key={key} onClick={() => setFilterAction(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterAction === key ? 'bg-sage-500 text-white' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'}`}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <EmptyState message="No logs found" icon={ClipboardDocumentListIcon} />
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => {
              const actionMeta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={log._id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${actionMeta.color}`}>{actionMeta.label}</span>
                        <span className="text-xs font-medium text-sage-600">{log.actorName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${log.actorRole === 'admin' ? 'bg-sage-100 text-sage-600' : 'bg-blue-50 text-blue-600'}`}>
                          {log.actorRole}
                        </span>
                        {log.isUndone && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">↩ Undone</span>}
                      </div>
                      <p className="text-sm text-gray-700">{log.description}</p>
                      {log.targetName && <p className="text-xs text-gray-400 mt-0.5">Target: {log.targetName}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default LogsPage;
