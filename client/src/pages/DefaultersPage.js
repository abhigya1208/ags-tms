import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, EmptyState } from '../components/common';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();

const DefaultersPage = () => {
  const [mode, setMode] = useState('specific'); // specific | till
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear);
  const [tillMonth, setTillMonth] = useState(MONTHS[new Date().getMonth()]);
  const [tillYear, setTillYear] = useState(currentYear);
  const [defaulters, setDefaulters] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode === 'specific') { params.set('month', month); params.set('year', year); }
      else { params.set('tillMonth', tillMonth); params.set('tillYear', tillYear); }
      const res = await api.get(`/students/defaulters?${params}`);
      setDefaulters(res.data.defaulters);
    } catch { toast.error('Failed to load defaulters'); }
    finally { setLoading(false); }
  };

  const exportDefaulters = async () => {
    try {
      const params = new URLSearchParams();
      if (mode === 'specific') { params.set('month', month); params.set('year', year); }
      const res = await api.get(`/export/defaulters?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'AGS_Defaulters.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Defaulters"
        subtitle="Students with pending fee payments"
        actions={defaulters?.length > 0 && (
          <button onClick={exportDefaulters} className="btn-secondary">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export Excel
          </button>
        )}
      />

      <div className="card space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          {['specific', 'till'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                mode === m ? 'bg-sage-500 text-white' : 'bg-sage-50 text-sage-700 hover:bg-sage-100'
              }`}>
              {m === 'specific' ? 'Specific Month' : 'Till Month'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {mode === 'specific' ? (
            <>
              <div>
                <label className="label">Month</label>
                <select value={month} onChange={e => setMonth(e.target.value)} className="input w-32">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input w-24">
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Till Month</label>
                <select value={tillMonth} onChange={e => setTillMonth(e.target.value)} className="input w-32">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Till Year</label>
                <select value={tillYear} onChange={e => setTillYear(parseInt(e.target.value))} className="input w-24">
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
          <button onClick={search} disabled={loading} className="btn-primary">
            <MagnifyingGlassIcon className="w-4 h-4" />
            {loading ? 'Searching...' : 'Search Defaulters'}
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {defaulters !== null && !loading && (
        <div className="card p-0 overflow-hidden">
          {defaulters.length === 0 ? (
            <EmptyState message="No defaulters found for selected period 🎉" icon={ExclamationTriangleIcon} />
          ) : (
            <>
              <div className="px-5 py-3 bg-peach-50 border-b border-peach-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-peach-700">{defaulters.length} defaulter{defaulters.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Roll No.</th>
                      <th className="table-th">Student Name</th>
                      <th className="table-th">Father Name</th>
                      <th className="table-th">Class</th>
                      <th className="table-th">Phone</th>
                      <th className="table-th">Pending Months</th>
                      <th className="table-th">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaulters.map(d => (
                      <tr key={d._id} className="hover:bg-peach-50/50 transition-colors">
                        <td className="table-td font-mono text-xs text-sage-600">{d.rollNumber}</td>
                        <td className="table-td font-semibold text-sage-800">{d.name}</td>
                        <td className="table-td text-gray-500">{d.fatherName}</td>
                        <td className="table-td"><span className="bg-sage-100 text-sage-700 text-xs px-2 py-0.5 rounded-full">{d.class}</span></td>
                        <td className="table-td text-gray-500">{d.phone || '—'}</td>
                        <td className="table-td text-xs text-gray-600">{d.pendingMonths.join(', ')}</td>
                        <td className="table-td">
                          <span className="bg-peach-100 text-peach-700 text-xs font-bold px-2 py-0.5 rounded-full">{d.pendingCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DefaultersPage;
