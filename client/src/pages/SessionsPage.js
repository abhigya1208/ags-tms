import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, EmptyState } from '../components/common';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logs/sessions')
      .then(res => setSessions(res.data.sessions))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (sec) => {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Sessions" subtitle="Teacher login and activity tracking" />
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : sessions.length === 0 ? (
          <EmptyState message="No sessions recorded" icon={ComputerDesktopIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Login Time</th>
                  <th className="table-th">Logout Time</th>
                  <th className="table-th">Duration</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s._id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="table-td font-semibold text-sage-800">{s.userName}</td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.userRole === 'admin' ? 'bg-sage-100 text-sage-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.userRole}
                      </span>
                    </td>
                    <td className="table-td text-xs text-gray-500">{new Date(s.loginAt).toLocaleString()}</td>
                    <td className="table-td text-xs text-gray-500">{s.logoutAt ? new Date(s.logoutAt).toLocaleString() : '—'}</td>
                    <td className="table-td text-sm">{formatDuration(s.duration)}</td>
                    <td className="table-td">
                      {s.isActive
                        ? <span className="badge-paid animate-pulse">● Active</span>
                        : s.autoLoggedOut
                        ? <span className="badge-archived">Auto logout</span>
                        : <span className="text-xs text-gray-400">Ended</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
