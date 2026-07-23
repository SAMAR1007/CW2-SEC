'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AdminReport, getAdminReports, updateAdminReportStatus } from '@/lib/api/reports';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'stay' | 'experience' | 'host'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'web' | 'mobile' | 'unknown'>('all');

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      const typeMatch = typeFilter === 'all' || report.reportType === typeFilter;
      const platformValue = report.sourcePlatform || 'unknown';
      const platformMatch = platformFilter === 'all' || platformValue === platformFilter;
      return statusMatch && typeMatch && platformMatch;
    });
  }, [platformFilter, reports, statusFilter, typeFilter]);

  const openCount = useMemo(
    () => filteredReports.filter((report) => report.status === 'open').length,
    [filteredReports]
  );

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await getAdminReports({ limit: 200 });
      setReports(Array.isArray(response?.data) ? response.data : []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (reportId: string, status: 'open' | 'resolved') => {
    setUpdatingId(reportId);
    try {
      await updateAdminReportStatus(reportId, status);
      await fetchReports();
    } catch (err: any) {
      alert(err?.message || 'Failed to update report status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5A1F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#FF5A1F] font-bold text-xs uppercase tracking-widest">
              <Flag className="h-4 w-4" /> Reports
            </div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">User reports</h1>
            <p className="text-zinc-500 font-medium">
              {filteredReports.length} report(s), {openCount} open.
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="rounded-xl border-zinc-200">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-zinc-50 px-8 py-6">
            <CardTitle className="text-xl font-bold text-zinc-800">Submitted reports</CardTitle>
            <CardDescription className="text-zinc-400">
              Review issues and mark them resolved when handled.
            </CardDescription>
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'open' | 'resolved')}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | 'stay' | 'experience' | 'host')}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <option value="all">All report types</option>
                <option value="stay">Stay</option>
                <option value="experience">Experience</option>
                <option value="host">Host</option>
              </select>
              <select
                value={platformFilter}
                onChange={(event) =>
                  setPlatformFilter(event.target.value as 'all' | 'web' | 'mobile' | 'unknown')
                }
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <option value="all">All platforms</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="m-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}
            {filteredReports.length === 0 && !error && (
              <div className="p-12 text-center text-zinc-500">No reports found.</div>
            )}
            <ul className="divide-y divide-zinc-100">
              {filteredReports.map((report) => {
                const createdLabel = report.createdAt ? new Date(report.createdAt).toLocaleString() : '—';
                const statusClass = report.status === 'resolved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-orange-50 text-[#FF5A1F] border-orange-200';

                return (
                  <li key={report._id} className="px-8 py-6 hover:bg-zinc-50/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-700">
                            {report.reportType}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass}`}>
                            {report.status}
                          </span>
                          {report.sourcePlatform && (
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-600">
                              {report.sourcePlatform}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">{createdLabel}</span>
                      </div>

                      <div className="grid gap-2 text-sm text-zinc-700">
                        <p><span className="font-medium text-zinc-900">Host:</span> {report.hostName}</p>
                        <p><span className="font-medium text-zinc-900">Location:</span> {report.location}</p>
                        {report.itemTitle && (
                          <p><span className="font-medium text-zinc-900">Item:</span> {report.itemTitle}</p>
                        )}
                        <p><span className="font-medium text-zinc-900">Problem:</span> {report.problem}</p>
                        <p>
                          <span className="font-medium text-zinc-900">Reporter:</span>{' '}
                          {report.reporterId?.name || 'Unknown'}
                          {report.reporterId?.email ? ` (${report.reporterId.email})` : ''}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {report.status === 'open' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            disabled={updatingId === report._id}
                            onClick={() => handleStatusChange(report._id, 'resolved')}
                          >
                            {updatingId === report._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark resolved'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-zinc-200"
                            disabled={updatingId === report._id}
                            onClick={() => handleStatusChange(report._id, 'open')}
                          >
                            {updatingId === report._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reopen'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
