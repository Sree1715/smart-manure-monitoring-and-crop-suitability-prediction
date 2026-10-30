import React, { useState } from 'react'
import { FileText, Download, Filter, Calendar, Search } from 'lucide-react'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'

const REPORTS = [
  { id: 'RPT-1042', title: 'Weekly Manure Quality Summary', type: 'Liquid', date: '02 Sep 2026', status: 'Ready' },
  { id: 'RPT-1041', title: 'Solid Manure Decomposition Report', type: 'Solid', date: '28 Aug 2026', status: 'Ready' },
  { id: 'RPT-1040', title: 'Crop Suitability Prediction Log', type: 'AI', date: '25 Aug 2026', status: 'Ready' },
  { id: 'RPT-1039', title: 'Monthly Sensor Uptime Report', type: 'System', date: '20 Aug 2026', status: 'Processing' },
  { id: 'RPT-1038', title: 'Liquid Manure Nutrient Trend', type: 'Liquid', date: '15 Aug 2026', status: 'Ready' },
]

const typeColor = {
  Liquid: 'bg-primary-50 text-primary-700',
  Solid: 'bg-secondary-50 text-secondary-700',
  AI: 'bg-accent-50 text-accent-700',
  System: 'bg-slate-100 text-slate-600',
}

export default function Reports() {
  const [search, setSearch] = useState('')

  const filtered = REPORTS.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="container-page section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="badge bg-primary-50 text-primary-700 mb-3">
            <FileText className="w-3.5 h-3.5" /> Reports Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Download and review manure quality and prediction reports</p>
        </div>
        <Button icon={Download}>Generate New Report</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-72">
            <Input
              placeholder="Search reports..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-primary-200 hover:text-primary-600">
              <Calendar className="w-4 h-4" /> Date Range
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-primary-200 hover:text-primary-600">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-y border-slate-100">
                <th className="py-3 px-6 font-medium">Report ID</th>
                <th className="py-3 px-6 font-medium">Title</th>
                <th className="py-3 px-6 font-medium">Type</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 text-slate-400 font-mono text-xs">{r.id}</td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">{r.title}</td>
                  <td className="py-3.5 px-6">
                    <span className={`badge ${typeColor[r.type]}`}>{r.type}</span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{r.date}</td>
                  <td className="py-3.5 px-6">
                    {r.status === 'Ready' ? (
                      <span className="badge bg-secondary-50 text-secondary-700">Ready</span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700">Processing</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      disabled={r.status !== 'Ready'}
                      className="text-primary-600 hover:text-primary-700 disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    No reports match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
