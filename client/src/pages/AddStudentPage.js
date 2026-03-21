import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import toast from 'react-hot-toast';
import { PageHeader, Spinner } from '../components/common';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AddStudentPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', fatherName: '', class: '', phone: '', remarks: '' });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [siblingSearch, setSiblingSearch] = useState('');
  const [siblingResults, setSiblingResults] = useState([]);
  const [selectedSiblings, setSelectedSiblings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchingClass, setSearchingClass] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/classes').then(res => setClasses(res.data.classes)).catch(() => {});
    } else {
      setClasses(user.assignedClasses || []);
    }
  }, [isAdmin, user]);

  const searchSiblings = async (q) => {
    if (q.length < 2) { setSiblingResults([]); return; }
    try {
      const res = await api.get(`/students?search=${q}&archived=false&limit=10`);
      setSiblingResults(res.data.students.filter(s => !selectedSiblings.find(sib => sib._id === s._id)));
    } catch {}
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.fatherName || !form.class) {
      return toast.error('Name, father name, and class are required');
    }
    setLoading(true);
    try {
      const res = await api.post('/students', {
        ...form,
        siblings: selectedSiblings.map(s => s._id),
      });
      toast.success(`Student added! Roll No: ${res.data.student.rollNumber}`);
      navigate(`/students/${res.data.student._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="Add New Student" subtitle="Fill in the details to enroll a new student" />

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Student Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Full name" required />
          </div>
          <div>
            <label className="label">Father's Name *</label>
            <input name="fatherName" value={form.fatherName} onChange={handleChange} className="input" placeholder="Father's full name" required />
          </div>
          <div>
            <label className="label">Class *</label>
            {classes.length > 0 ? (
              <select name="class" value={form.class} onChange={handleChange} className="input" required>
                <option value="">Select class</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input name="class" value={form.class} onChange={handleChange} className="input" placeholder="Enter class (e.g. 10, A, 8B)" required />
            )}
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="03XXXXXXXXX" />
          </div>
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className="input resize-none" rows={3} placeholder="Optional notes about the student" />
        </div>

        {/* Sibling Linking */}
        <div>
          <label className="label">Link Siblings</label>
          <input
            type="text"
            value={siblingSearch}
            onChange={e => { setSiblingSearch(e.target.value); searchSiblings(e.target.value); }}
            className="input mb-2"
            placeholder="Search existing students to link as siblings..."
          />
          {siblingResults.length > 0 && (
            <div className="border border-sage-200 rounded-xl overflow-hidden mb-2">
              {siblingResults.map(s => (
                <button type="button" key={s._id}
                  onClick={() => {
                    setSelectedSiblings(prev => [...prev, s]);
                    setSiblingSearch('');
                    setSiblingResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-sage-50 text-sm transition-colors border-b border-gray-50 last:border-0">
                  <span className="font-medium text-sage-800">{s.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">{s.rollNumber} · Class {s.class}</span>
                </button>
              ))}
            </div>
          )}
          {selectedSiblings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSiblings.map(s => (
                <span key={s._id} className="flex items-center gap-1.5 bg-sage-100 text-sage-700 text-xs font-medium px-3 py-1 rounded-full">
                  {s.name}
                  <button type="button" onClick={() => setSelectedSiblings(prev => prev.filter(p => p._id !== s._id))}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/students')} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><UserPlusIcon className="w-4 h-4" /> Add Student</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudentPage;
