import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { StatCard, Spinner, PageHeader } from '../components/common';
import {
  UsersIcon, UserGroupIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  AcademicCapIcon, ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { stats, recentLogs, teacherSessions, classStats } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Overview of AGS Tutorial Management System" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={UsersIcon} color="sage" />
        <StatCard title="Active Students" value={stats.activeStudents} icon={CheckCircleIcon} color="blue" />
        <StatCard title="Archived" value={stats.archivedStudents} icon={ArchiveBoxIcon} color="amber" />
        <StatCard title="Teachers" value={stats.totalTeachers} icon={AcademicCapIcon} color="peach" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Stats */}
        <div className="card">
          <h3 className="font-display text-base font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-sage-400" /> Class Summary
          </h3>
          {classStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No classes yet</p>
          ) : (
            <div className="space-y-2">
              {classStats.map(cs => (
                <div key={cs._id} className="flex items-center justify-between p-3 bg-sage-50 rounded-xl">
                  <span className="text-sm font-medium text-sage-800">Class {cs._id}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-sage-600 bg-sage-200 px-2 py-0.5 rounded-full">{cs.active} active</span>
                    <span className="text-xs text-gray-400">{cs.count} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="font-display text-base font-semibold text-sage-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-sage-400" /> Recent Activity
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            ) : recentLogs.map(log => (
              <div key={log._id} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-700 leading-relaxed">{log.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <Link to="/logs" className="text-xs text-sage-600 hover:text-sage-700 font-medium mt-3 inline-block">
            View all logs →
          </Link>
        </div>
      </div>

      {/* Teacher Sessions */}
      <div className="card">
        <h3 className="font-display text-base font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-sage-400" /> Recent Teacher Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th rounded-tl-lg">Teacher</th>
                <th className="table-th">Login</th>
                <th className="table-th">Logout</th>
                <th className="table-th rounded-tr-lg">Duration</th>
              </tr>
            </thead>
            <tbody>
              {teacherSessions.slice(0, 10).map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">{s.userName}</td>
                  <td className="table-td text-gray-500">{new Date(s.loginAt).toLocaleString()}</td>
                  <td className="table-td text-gray-500">{s.logoutAt ? new Date(s.logoutAt).toLocaleString() : <span className="badge-paid">Active</span>}</td>
                  <td className="table-td">{s.duration ? `${Math.floor(s.duration/60)}m ${s.duration%60}s` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/students?limit=200')
      .then(res => setStudents(res.data.students))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const getMonthFee = (student) => {
    return student.feeRecords?.find(fr => fr.month === currentMonth && fr.year === currentYear);
  };

  const filtered = students.filter(s => {
    if (filter === 'paid') return getMonthFee(s)?.status === 'Paid';
    if (filter === 'unpaid') {
      const fee = getMonthFee(s);
      return !fee || fee.status === 'Unpaid';
    }
    if (filter === 'archived') return s.isArchived;
    return !s.isArchived;
  });

  const classes = [...new Set(students.map(s => s.class))].sort();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle={`Managing: ${user.assignedClasses?.join(', ') || 'No classes assigned'}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students.filter(s => !s.isArchived).length} icon={UsersIcon} color="sage" />
        <StatCard title="Paid" value={students.filter(s => getMonthFee(s)?.status === 'Paid').length} icon={CheckCircleIcon} color="blue" sub={currentMonth} />
        <StatCard title="Unpaid" value={students.filter(s => { const f = getMonthFee(s); return !f || f.status === 'Unpaid'; }).length} icon={ExclamationTriangleIcon} color="peach" sub={currentMonth} />
        <StatCard title="Archived" value={students.filter(s => s.isArchived).length} icon={ArchiveBoxIcon} color="amber" />
      </div>

      {/* Filter bar */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {['all','paid','unpaid','archived'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === f ? 'bg-sage-500 text-white' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
              }`}>
              {f === 'all' ? 'Active' : f}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th rounded-tl-lg">Roll No.</th>
                <th className="table-th">Name</th>
                <th className="table-th">Class</th>
                <th className="table-th">Phone</th>
                <th className="table-th">{currentMonth} Fee</th>
                <th className="table-th rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const fee = getMonthFee(s);
                return (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-mono text-xs text-sage-600">{s.rollNumber}</td>
                    <td className="table-td">
                      <Link to={`/students/${s._id}`} className="font-medium text-sage-700 hover:text-sage-900 hover:underline">{s.name}</Link>
                    </td>
                    <td className="table-td text-gray-500">{s.class}</td>
                    <td className="table-td text-gray-500">{s.phone || '—'}</td>
                    <td className="table-td">
                      {fee?.status === 'Paid'
                        ? <span className="badge-paid">✓ Paid</span>
                        : <span className="badge-unpaid">✗ Unpaid</span>}
                    </td>
                    <td className="table-td">
                      {s.isArchived
                        ? <span className="badge-archived">⭐ Archived</span>
                        : <span className="badge-paid">Active</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No students found</p>}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <TeacherDashboard />;
};

export default DashboardPage;
