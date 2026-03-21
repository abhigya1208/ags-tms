import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import toast from 'react-hot-toast';
import { Modal, ConfirmDialog, Spinner, Badge } from '../components/common';
import {
  PencilIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon, ArrowUturnLeftIcon,
  PhoneIcon, IdentificationIcon, UserGroupIcon, CurrencyDollarIcon,
  ChevronLeftIcon, StarIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const FeeGrid = ({ student, onUpdate, isAdmin }) => {
  const [feeModal, setFeeModal] = useState(null); // { month, year, record }
  const [feeForm, setFeeForm] = useState({ status: 'Paid', slipNumber: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const getRecord = (month, year) =>
    student.feeRecords?.find(fr => fr.month === month && fr.year === year);

  const openFeeModal = (month, year) => {
    const rec = getRecord(month, year);
    setFeeForm({ status: rec?.status || 'Unpaid', slipNumber: rec?.slipNumber || '', amount: rec?.amount || '' });
    setFeeModal({ month, year, record: rec });
  };

  const saveFee = async () => {
    setSaving(true);
    try {
      await onUpdate(feeModal.month, feeModal.year, feeForm);
      setFeeModal(null);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-semibold text-sage-800 flex items-center gap-2">
          <CurrencyDollarIcon className="w-5 h-5 text-sage-400" /> Fee Records
        </h3>
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="input py-1 text-xs w-24">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {MONTHS.map(month => {
          const rec = getRecord(month, selectedYear);
          const isPaid = rec?.status === 'Paid';
          return (
            <button key={month} onClick={() => openFeeModal(month, selectedYear)}
              className={`p-3 rounded-xl border text-center transition-all hover:shadow-sm ${
                isPaid ? 'bg-sage-50 border-sage-200 hover:bg-sage-100' : 'bg-peach-50 border-peach-200 hover:bg-peach-100'
              }`}>
              <p className="text-xs font-semibold text-gray-600">{month}</p>
              <p className={`text-xs font-bold mt-0.5 ${isPaid ? 'text-sage-600' : 'text-peach-600'}`}>
                {isPaid ? '✓ Paid' : '✗ Unpaid'}
              </p>
              {rec?.slipNumber && <p className="text-[10px] text-gray-400 mt-0.5">#{rec.slipNumber}</p>}
            </button>
          );
        })}
      </div>

      <Modal open={!!feeModal} onClose={() => setFeeModal(null)} title={`Fee: ${feeModal?.month} ${feeModal?.year}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Status</label>
            <div className="flex gap-2">
              {['Paid', 'Unpaid'].map(s => (
                <button key={s} type="button"
                  onClick={() => setFeeForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    feeForm.status === s
                      ? s === 'Paid' ? 'bg-sage-500 text-white border-sage-500' : 'bg-peach-500 text-white border-peach-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Slip Number <span className="text-gray-400 text-[10px] normal-case font-normal">(auto-marks as Paid)</span></label>
            <input type="text" value={feeForm.slipNumber} onChange={e => setFeeForm(f => ({ ...f, slipNumber: e.target.value }))}
              className="input" placeholder="Enter slip/receipt number" />
          </div>
          {isAdmin && (
            <div>
              <label className="label">Amount (₨)</label>
              <input type="number" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                className="input" placeholder="Fee amount" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setFeeModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={saveFee} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const StudentDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState('');
  const [undoLogs, setUndoLogs] = useState([]);
  const [siblingSearch, setSiblingSearch] = useState('');
  const [siblingResults, setSiblingResults] = useState([]);

  const loadStudent = useCallback(async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data.student);
      setEditForm({
        name: res.data.student.name,
        fatherName: res.data.student.fatherName,
        phone: res.data.student.phone || '',
        remarks: res.data.student.remarks || '',
        siblings: res.data.student.siblings?.map(s => s._id) || [],
      });
    } catch { toast.error('Student not found'); navigate('/students'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  const loadUndoLogs = useCallback(async () => {
    try {
      const res = await api.get('/logs/undoable');
      setUndoLogs(res.data.logs.filter(l => l.targetId === id));
    } catch {}
  }, [id]);

  useEffect(() => { loadStudent(); loadUndoLogs(); }, [loadStudent, loadUndoLogs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/students/${id}`, editForm);
      toast.success('Student updated');
      setEditMode(false);
      loadStudent();
      loadUndoLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleFeeUpdate = async (month, year, feeData) => {
    try {
      await api.put(`/students/${id}/fee`, { month, year, ...feeData });
      toast.success(`Fee updated for ${month} ${year}`);
      loadStudent();
      loadUndoLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Fee update failed');
    }
  };

  const handleArchive = async () => {
    try {
      const archive = !student.isArchived;
      await api.put(`/students/${id}/archive`, {
        archive,
        month: archiveMonth || `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`,
      });
      toast.success(archive ? 'Student archived' : 'Student unarchived');
      setArchiveModal(false);
      loadStudent();
      loadUndoLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Archive failed');
    }
  };

  const handleUndo = async (logId) => {
    try {
      await api.post(`/students/undo/${logId}`);
      toast.success('Action undone!');
      loadStudent();
      loadUndoLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Undo failed');
    }
  };

  const searchSiblings = async (q) => {
    if (q.length < 2) { setSiblingResults([]); return; }
    try {
      const res = await api.get(`/students?search=${q}&limit=8`);
      setSiblingResults(res.data.students.filter(s => s._id !== id && !editForm.siblings.includes(s._id)));
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!student) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/students')} className="mt-1 p-2 rounded-xl hover:bg-sage-100 transition-colors text-sage-600">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-sage-900">{student.name}</h1>
            {student.isArchived && <span className="badge-archived flex items-center gap-1"><StarIcon className="w-3 h-3" />Archived from {student.archivedFrom}</span>}
          </div>
          <p className="text-sm text-gray-400 font-mono">{student.rollNumber}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setEditMode(!editMode)} className={editMode ? 'btn-secondary' : 'btn-primary'}>
            <PencilIcon className="w-4 h-4" />
            {editMode ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => setArchiveModal(true)}
            className={student.isArchived ? 'btn-secondary' : 'btn-peach'}>
            {student.isArchived ? <ArchiveBoxArrowDownIcon className="w-4 h-4" /> : <ArchiveBoxIcon className="w-4 h-4" />}
            {student.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>

      {/* Undo bar */}
      {undoLogs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
            <ArrowUturnLeftIcon className="w-4 h-4" /> Recent actions (undoable this session)
          </p>
          <div className="space-y-1.5">
            {undoLogs.slice(0, 5).map(log => (
              <div key={log._id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2">
                <p className="text-xs text-gray-600 flex-1 truncate">{log.description}</p>
                <button onClick={() => handleUndo(log._id)} className="text-xs text-peach-600 hover:text-peach-700 font-semibold flex-shrink-0">
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card">
        <h3 className="font-display text-base font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <IdentificationIcon className="w-5 h-5 text-sage-400" /> Student Information
        </h3>
        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Father's Name</label>
                <input value={editForm.fatherName} onChange={e => setEditForm(f => ({ ...f, fatherName: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="Phone number" />
              </div>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} className="input resize-none" rows={3} />
            </div>
            {/* Sibling editor */}
            <div>
              <label className="label">Siblings</label>
              <input type="text" value={siblingSearch}
                onChange={e => { setSiblingSearch(e.target.value); searchSiblings(e.target.value); }}
                className="input mb-2" placeholder="Search students to add as sibling..." />
              {siblingResults.length > 0 && (
                <div className="border border-sage-200 rounded-xl overflow-hidden mb-2">
                  {siblingResults.map(s => (
                    <button type="button" key={s._id}
                      onClick={() => { setEditForm(f => ({ ...f, siblings: [...f.siblings, s._id] })); setSiblingSearch(''); setSiblingResults([]); }}
                      className="w-full text-left px-4 py-2 hover:bg-sage-50 text-sm border-b border-gray-50 last:border-0">
                      {s.name} <span className="text-gray-400 text-xs">{s.rollNumber}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {student.siblings?.filter(s => editForm.siblings.includes(s._id)).map(sib => (
                  <span key={sib._id} className="flex items-center gap-1 bg-sage-100 text-sage-700 text-xs px-3 py-1 rounded-full">
                    {sib.name}
                    <button type="button" onClick={() => setEditForm(f => ({ ...f, siblings: f.siblings.filter(id => id !== sib._id) }))} className="ml-1 text-sage-400 hover:text-sage-700">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditMode(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Father's Name" value={student.fatherName} />
            <InfoRow label="Class" value={<span className="bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full text-xs font-medium">{student.class}</span>} />
            <InfoRow label="Phone" value={student.phone || '—'} />
            <InfoRow label="Roll Number" value={<span className="font-mono text-sage-600 font-medium">{student.rollNumber}</span>} />
            <InfoRow label="Enrolled" value={new Date(student.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoRow label="Remarks" value={student.remarks || <span className="text-gray-300">—</span>} />
            {student.siblings?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-sage-700 uppercase tracking-wide mb-2">Siblings</p>
                <div className="flex flex-wrap gap-2">
                  {student.siblings.map(sib => (
                    <Link key={sib._id} to={`/students/${sib._id}`} className="flex items-center gap-1.5 bg-sage-50 border border-sage-200 text-sage-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-sage-100 transition-colors">
                      <UserGroupIcon className="w-3 h-3" /> {sib.name} · {sib.rollNumber}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fee Grid */}
      <div className="card">
        <FeeGrid student={student} onUpdate={handleFeeUpdate} isAdmin={isAdmin} />
      </div>

      {/* Archive Confirm */}
      <Modal open={archiveModal} onClose={() => setArchiveModal(false)} title={student.isArchived ? 'Unarchive Student' : 'Archive Student'} size="sm">
        <div className="space-y-4">
          {!student.isArchived && (
            <div>
              <label className="label">Archive from (Month)</label>
              <input value={archiveMonth} onChange={e => setArchiveMonth(e.target.value)}
                className="input" placeholder={`e.g. ${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`} />
            </div>
          )}
          <p className="text-sm text-gray-500">
            {student.isArchived
              ? 'This will mark the student as active again.'
              : 'Archived students remain in the database and can be unarchived later.'}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setArchiveModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleArchive} className={`flex-1 justify-center ${student.isArchived ? 'btn-primary' : 'btn-peach'}`}>
              {student.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-sage-700 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-gray-700">{value}</p>
  </div>
);

export default StudentDetailPage;
