import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader, Modal, ConfirmDialog, Spinner, EmptyState } from '../components/common';
import { PlusIcon, PencilIcon, TrashIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TeacherForm = ({ teacher, onSave, onClose, allClasses }) => {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    password: '',
    phone: teacher?.phone || '',
    assignedClasses: teacher?.assignedClasses || [],
    isActive: teacher?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [newClass, setNewClass] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleClass = (cls) => {
    setForm(f => ({
      ...f,
      assignedClasses: f.assignedClasses.includes(cls)
        ? f.assignedClasses.filter(c => c !== cls)
        : [...f.assignedClasses, cls],
    }));
  };

  const addCustomClass = () => {
    if (newClass.trim() && !form.assignedClasses.includes(newClass.trim())) {
      setForm(f => ({ ...f, assignedClasses: [...f.assignedClasses, newClass.trim()] }));
      setNewClass('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="input" required placeholder="Teacher name" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input name="email" value={form.email} onChange={handleChange} className="input" required type="email" disabled={!!teacher} placeholder="teacher@ags.com" />
        </div>
        <div>
          <label className="label">Password {teacher ? '(leave blank to keep)' : '*'}</label>
          <input name="password" value={form.password} onChange={handleChange} className="input" type="password"
            required={!teacher} placeholder={teacher ? 'New password (optional)' : 'Min 6 characters'} minLength={form.password ? 6 : undefined} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="Phone number" />
        </div>
      </div>

      {/* Assigned Classes */}
      <div>
        <label className="label">Assigned Classes</label>
        <div className="flex flex-wrap gap-2 mb-3 min-h-8">
          {form.assignedClasses.map(cls => (
            <span key={cls} className="flex items-center gap-1 bg-sage-100 text-sage-700 text-xs font-semibold px-3 py-1 rounded-full">
              {cls}
              <button type="button" onClick={() => toggleClass(cls)} className="ml-1 text-sage-400 hover:text-sage-700">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          {form.assignedClasses.length === 0 && <span className="text-xs text-gray-400">No classes assigned</span>}
        </div>
        {allClasses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allClasses.filter(c => !form.assignedClasses.includes(c)).map(cls => (
              <button type="button" key={cls} onClick={() => toggleClass(cls)}
                className="text-xs bg-gray-100 hover:bg-sage-100 text-gray-600 hover:text-sage-700 px-3 py-1 rounded-full transition-colors">
                + {cls}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={newClass} onChange={e => setNewClass(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomClass())}
            className="input flex-1 text-sm" placeholder="Add custom class (e.g. 10, A, 8B)" />
          <button type="button" onClick={addCustomClass} className="btn-secondary px-3">Add</button>
        </div>
      </div>

      {teacher && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-sage-500" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Account Active</label>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving...' : (teacher ? 'Update Teacher' : 'Create Teacher')}
        </button>
      </div>
    </form>
  );
};

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | teacher
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [allClasses, setAllClasses] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, cr] = await Promise.all([api.get('/teachers'), api.get('/admin/classes')]);
      setTeachers(tr.data.teachers);
      setAllClasses(cr.data.classes);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      if (modal === 'add') {
        await api.post('/teachers', form);
        toast.success('Teacher created');
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/teachers/${modal._id}`, payload);
        toast.success('Teacher updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
      throw err;
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/teachers/${deleteTarget._id}`);
      toast.success('Teacher deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher account${teachers.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setModal('add')} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add Teacher
          </button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : teachers.length === 0 ? (
          <EmptyState message="No teachers yet" icon={AcademicCapIcon} action={
            <button onClick={() => setModal('add')} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Teacher</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Assigned Classes</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Last Login</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t._id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="table-td font-semibold text-sage-800">{t.name}</td>
                    <td className="table-td text-gray-500 text-xs">{t.email}</td>
                    <td className="table-td text-gray-500">{t.phone || '—'}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {t.assignedClasses?.length > 0
                          ? t.assignedClasses.map(c => <span key={c} className="bg-sage-100 text-sage-700 text-xs px-2 py-0.5 rounded-full">{c}</span>)
                          : <span className="text-gray-400 text-xs">None</span>}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.isActive ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-500'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td text-xs text-gray-400">
                      {t.lastLogin ? new Date(t.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => setModal(t)} className="p-1.5 text-sage-600 hover:bg-sage-100 rounded-lg transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Teacher' : 'Edit Teacher'} size="lg">
        {modal && (
          <TeacherForm
            teacher={modal === 'add' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
            allClasses={allClasses}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message={`Delete teacher account for ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
};

export default TeachersPage;
