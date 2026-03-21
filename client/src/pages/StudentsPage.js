import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import toast from 'react-hot-toast';
import {
  PageHeader, SearchBar, Spinner, EmptyState, Pagination, ConfirmDialog
} from '../components/common';
import {
  PlusIcon, ArrowDownTrayIcon, FunnelIcon, UsersIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/outline';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StudentsPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterArchived, setFilterArchived] = useState('false');
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const loadClasses = useCallback(async () => {
    try {
      const res = await api.get('/admin/classes');
      if (isAdmin) setClasses(res.data.classes);
      else setClasses(user.assignedClasses || []);
    } catch {}
  }, [isAdmin, user]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (search) params.set('search', search);
      if (filterClass) params.set('class', filterClass);
      if (filterArchived !== '') params.set('archived', filterArchived);
      const res = await api.get(`/students?${params}`);
      setStudents(res.data.students);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterArchived, page]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { setPage(1); }, [search, filterClass, filterArchived]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget._id}`);
      toast.success('Student deleted');
      setDeleteTarget(null);
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = filterClass ? `?class=${filterClass}` : '';
      const res = await api.get(`/export/students${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'AGS_Students.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const getMonthFee = (student) => {
    return student.feeRecords?.find(fr => fr.month === currentMonth && fr.year === currentYear);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Students"
        subtitle={`${total} student${total !== 1 ? 's' : ''} found`}
        actions={
          <>
            {isAdmin && (
              <button onClick={handleExport} className="btn-secondary">
                <ArrowDownTrayIcon className="w-4 h-4" /> Export
              </button>
            )}
            <Link to="/students/add" className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Add Student
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, roll no., phone..."
            className="flex-1"
          />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="input sm:w-40">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterArchived} onChange={e => setFilterArchived(e.target.value)} className="input sm:w-40">
            <option value="false">Active</option>
            <option value="true">Archived</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : students.length === 0 ? (
          <EmptyState
            message="No students found"
            icon={UsersIcon}
            action={
              <Link to="/students/add" className="btn-primary">
                <PlusIcon className="w-4 h-4" /> Add First Student
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Roll No.</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Father</th>
                  <th className="table-th">Class</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">{currentMonth} Fee</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const fee = getMonthFee(s);
                  return (
                    <tr key={s._id} className="hover:bg-sage-50/50 transition-colors">
                      <td className="table-td font-mono text-xs text-sage-700 font-medium">{s.rollNumber}</td>
                      <td className="table-td">
                        <div>
                          <Link to={`/students/${s._id}`} className="font-semibold text-sage-800 hover:text-sage-600 hover:underline">{s.name}</Link>
                          {s.siblings?.length > 0 && (
                            <p className="text-xs text-gray-400">↳ {s.siblings.map(sib => sib.name).join(', ')}</p>
                          )}
                        </div>
                      </td>
                      <td className="table-td text-gray-500">{s.fatherName}</td>
                      <td className="table-td">
                        <span className="bg-sage-100 text-sage-700 text-xs font-medium px-2 py-0.5 rounded-full">{s.class}</span>
                      </td>
                      <td className="table-td text-gray-500">{s.phone || '—'}</td>
                      <td className="table-td">
                        {fee?.status === 'Paid'
                          ? <span className="badge-paid">✓ Paid</span>
                          : <span className="badge-unpaid">✗ Unpaid</span>}
                      </td>
                      <td className="table-td">
                        {s.isArchived
                          ? <span className="badge-archived">⭐ {s.archivedFrom}</span>
                          : <span className="text-xs text-sage-600 font-medium">Active</span>}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <Link to={`/students/${s._id}`} className="px-3 py-1 text-xs font-medium text-sage-700 bg-sage-50 hover:bg-sage-100 rounded-lg transition-colors">
                            View
                          </Link>
                          {isAdmin && (
                            <button onClick={() => setDeleteTarget(s)} className="px-3 py-1 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default StudentsPage;
