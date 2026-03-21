import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/common';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handlePwChange = async e => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="My Profile" />

      {/* Info Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center">
            <UserCircleIcon className="w-8 h-8 text-sage-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-sage-900">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="label">Role</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${user?.role === 'admin' ? 'bg-sage-100 text-sage-700' : 'bg-blue-100 text-blue-700'}`}>
              <ShieldCheckIcon className="w-3 h-3" />{user?.role}
            </span>
          </div>
          {user?.role === 'teacher' && (
            <div>
              <p className="label">Assigned Classes</p>
              <div className="flex flex-wrap gap-1">
                {user.assignedClasses?.length > 0
                  ? user.assignedClasses.map(c => <span key={c} className="bg-sage-50 text-sage-700 text-xs px-2 py-0.5 rounded-full border border-sage-200">{c}</span>)
                  : <span className="text-gray-400 text-xs">None assigned</span>}
              </div>
            </div>
          )}
          <div>
            <p className="label">Last Login</p>
            <p className="text-gray-600">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="font-display text-base font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-sage-400" /> Change Password
        </h3>
        <form onSubmit={handlePwChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type={showPw ? 'text' : 'password'} value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input" required placeholder="Your current password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type={showPw ? 'text' : 'password'} value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              className="input" required minLength={6} placeholder="Minimum 6 characters" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="input" required placeholder="Repeat new password" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="accent-sage-500" />
            Show passwords
          </label>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
