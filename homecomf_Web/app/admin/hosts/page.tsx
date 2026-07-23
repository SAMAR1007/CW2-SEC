'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { getAllHosts, approveHost, rejectHost } from '@/lib/api/admin';
import { Home, ArrowLeft, Check, X, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getDocumentUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const res = await getAllHosts();
      setHosts(res.hosts || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load host applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const filteredHosts = hosts.filter((host) => {
    if (statusFilter === 'all') return true;
    return host.verificationStatus === statusFilter;
  });

  const pendingCount = hosts.filter((host) => host.verificationStatus === 'pending').length;
  const approvedCount = hosts.filter((host) => host.verificationStatus === 'verified').length;
  const rejectedCount = hosts.filter((host) => host.verificationStatus === 'rejected').length;

  const handleApprove = async (hostProfileId: string) => {
    setApprovingId(hostProfileId);
    try {
      await approveHost(hostProfileId);
      await fetchHosts();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (hostProfileId: string) => {
    const reason = rejectReason[hostProfileId]?.trim() || 'No reason provided';
    setRejectingId(hostProfileId);
    try {
      await rejectHost(hostProfileId, reason);
      setRejectReason((prev) => ({ ...prev, [hostProfileId]: '' }));
      await fetchHosts();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setRejectingId(null);
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
              <Home className="h-4 w-4" /> Host verification
            </div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Host applications</h1>
            <p className="text-zinc-500 font-medium">Review pending, approved, and rejected host applications.</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="rounded-xl border-zinc-200">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-zinc-50 px-8 py-6">
            <CardTitle className="text-xl font-bold text-zinc-800">Applications</CardTitle>
            <CardDescription className="text-zinc-400">
              {filteredHosts.length} shown · {pendingCount} pending · {approvedCount} approved · {rejectedCount} rejected
            </CardDescription>
            <div className="pt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className={statusFilter === 'all' ? 'bg-[#FF5A1F] hover:bg-[#e44e1a] text-white rounded-full' : 'rounded-full border-zinc-200'}
                onClick={() => setStatusFilter('all')}
              >
                All ({hosts.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                className={statusFilter === 'pending' ? 'bg-orange-500 hover:bg-orange-600 text-white rounded-full' : 'rounded-full border-zinc-200'}
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({pendingCount})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'verified' ? 'default' : 'outline'}
                className={statusFilter === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-full' : 'rounded-full border-zinc-200'}
                onClick={() => setStatusFilter('verified')}
              >
                Approved ({approvedCount})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                className={statusFilter === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white rounded-full' : 'rounded-full border-zinc-200'}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected ({rejectedCount})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="m-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}
            {filteredHosts.length === 0 && !error && (
              <div className="p-12 text-center text-zinc-500">No applications for selected status.</div>
            )}
            <ul className="divide-y divide-zinc-100">
              {filteredHosts.map((h) => {
                const user = h.userId || {};
                const name = typeof user === 'object' ? user.name : '—';
                const email = typeof user === 'object' ? user.email : '—';
                const idDocumentUrl = getDocumentUrl(h.idDocument);
                const createdAt = h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—';
                const status = h.verificationStatus || 'pending';
                const statusLabel = status === 'verified' ? 'approved' : status;
                const statusClass = status === 'verified'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'rejected'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-orange-50 text-[#FF5A1F]';
                return (
                  <li key={h._id} className="px-8 py-6 hover:bg-zinc-50/50 transition-colors">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-zinc-900 text-lg">{name}</p>
                            <p className="text-sm text-zinc-500">{email}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">Applied: {createdAt}</p>

                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <p className="text-zinc-600"><span className="font-medium text-zinc-800">Legal name:</span> {h.legalName || '—'}</p>
                          <p className="text-zinc-600"><span className="font-medium text-zinc-800">Host phone:</span> {h.phoneNumber || '—'}</p>
                          <p className="text-zinc-600 sm:col-span-2"><span className="font-medium text-zinc-800">Address:</span> {h.address || '—'}</p>
                          <p className="text-zinc-600 sm:col-span-2"><span className="font-medium text-zinc-800">Government ID:</span> {h.governmentId || '—'}</p>
                        </div>

                        {(status === 'pending' || status === 'verified' || status === 'rejected') && (
                          <div className="mt-4 flex flex-col gap-2 sm:items-end shrink-0">
                            <div className="flex gap-2">
                              {status !== 'verified' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                  onClick={() => handleApprove(h._id)}
                                  disabled={!!approvingId}
                                >
                                  {approvingId === h._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" /> Approve
                                    </>
                                  )}
                                </Button>
                              )}
                              {status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-lg"
                                  onClick={() => handleReject(h._id)}
                                  disabled={!!rejectingId}
                                >
                                  {rejectingId === h._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="h-4 w-4 mr-1" /> Reject
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            {status !== 'rejected' && (
                              <div className="w-full mt-1">
                                <label className="text-xs text-zinc-500 block mb-1">Rejection reason (if rejecting)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Invalid ID"
                                  value={rejectReason[h._id] || ''}
                                  onChange={(e) =>
                                    setRejectReason((prev) => ({ ...prev, [h._id]: e.target.value }))
                                  }
                                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {status === 'rejected' && h.rejectionReason && (
                          <p className="mt-4 text-xs text-red-600"><span className="font-semibold">Reason:</span> {h.rejectionReason}</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Uploaded ID document</p>
                        {idDocumentUrl ? (
                          <a
                            href={idDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-zinc-200 bg-white"
                          >
                            <img
                              src={idDocumentUrl}
                              alt={`${name || 'Applicant'} ID document`}
                              className="w-full h-56 object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          </a>
                        ) : (
                          <div className="h-56 rounded-xl border border-dashed border-zinc-300 bg-white flex items-center justify-center text-sm text-zinc-500">
                            No ID document uploaded
                          </div>
                        )}
                        {idDocumentUrl && (
                          <a href={idDocumentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-[#FF5A1F] hover:underline">
                            Open full document
                          </a>
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
