'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { handleLogout } from '@/lib/actions/auth-action';
import { getAdminReports } from '@/lib/api/reports';
import { Users, UserPlus, ShieldCheck, Activity, ArrowRight, LayoutDashboard, Home, Flag } from 'lucide-react';

export default function AdminDashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    const fetchReportsCount = async () => {
      try {
        const response = await getAdminReports({ limit: 200 });
        const reportList = Array.isArray(response?.data) ? response.data : [];
        setTotalReports(reportList.length);
      } catch {
        setTotalReports(0);
      }
    };

    fetchReportsCount();
  }, []);

  const onLogout = async () => {
    try {
      setIsLoggingOut(true);
      await handleLogout();
      window.location.href = '/auth/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      <div className="container mx-auto px-4 md:px-8 py-10 space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#FF5A1F] font-bold text-xs uppercase tracking-widest">
              <LayoutDashboard className="h-4 w-4" /> Administration
            </div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 font-medium">System overview and management tools.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-zinc-100">
              <div className="px-4 py-2 text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-400 leading-none">System Status</p>
                <p className="text-sm font-bold text-emerald-500">All Systems Operational</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="rounded-xl border-zinc-200 bg-white hover:bg-zinc-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value="2" icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Admin Users" value="1" icon={<ShieldCheck />} color="text-purple-600" bg="bg-purple-50" />
          <StatCard label="New This Week" value="+2" icon={<UserPlus />} color="text-[#FF5A1F]" bg="bg-orange-50" />
          <StatCard
            label="Total Reports"
            value={totalReports.toString()}
            icon={<Flag />}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>

        {/* Main Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* User Management Card */}
          <Card className="group relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(255,90,31,0.08)]">
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10">
              <Users size={120} className="text-[#FF5A1F]" />
            </div>
            
            <CardHeader className="pt-10 px-8">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 text-[#FF5A1F] border border-orange-100">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800">User Management</CardTitle>
              <CardDescription className="text-base text-zinc-500 max-w-70">
                Full control over user accounts, permissions, and profile verification.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-10 flex flex-wrap gap-3 mt-4">
              <Link href="/admin/users">
                <Button className="bg-[#FF5A1F] hover:bg-[#e44e1a] text-white shadow-lg shadow-orange-100 px-6 rounded-xl transition-all">
                  View Directory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin/users/create">
                <Button variant="outline" className="border-zinc-200 rounded-xl hover:bg-zinc-50">
                  Quick Add
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Host verification Card */}
          <Card className="group relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(255,90,31,0.08)]">
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10">
              <Home size={120} className="text-[#FF5A1F]" />
            </div>
            <CardHeader className="pt-10 px-8">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 text-[#FF5A1F] border border-orange-100">
                <Home className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800">Host applications</CardTitle>
              <CardDescription className="text-base text-zinc-500 max-w-70">
                Review and verify or reject pending host applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10 flex flex-wrap gap-3 mt-4">
              <Link href="/admin/hosts">
                <Button className="bg-[#FF5A1F] hover:bg-[#e44e1a] text-white shadow-lg shadow-orange-100 px-6 rounded-xl transition-all">
                  View pending <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(255,90,31,0.08)]">
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10">
              <Flag size={120} className="text-[#FF5A1F]" />
            </div>
            <CardHeader className="pt-10 px-8">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 text-[#FF5A1F] border border-orange-100">
                <Flag className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800">Reports</CardTitle>
              <CardDescription className="text-base text-zinc-500 max-w-70">
                Review stay and experience reports submitted by users.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10 flex flex-wrap gap-3 mt-4">
              <Link href="/admin/reports">
                <Button className="bg-[#FF5A1F] hover:bg-[#e44e1a] text-white shadow-lg shadow-orange-100 px-6 rounded-xl transition-all">
                  View reports <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Small Stat Card Component
function StatCard({ label, value, icon, color, bg }: { label: string, value: string, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-5 transition-all hover:translate-y-0.5 hover:shadow-md">
      <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-zinc-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}