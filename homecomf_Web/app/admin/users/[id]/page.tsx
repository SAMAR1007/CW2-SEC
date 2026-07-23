'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { getUserById } from '@/lib/api/admin';
import { ArrowLeft, Edit3, User, Mail, Phone, Shield, Calendar, ExternalLink } from 'lucide-react'; // Recommended icons

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'; 

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setUserId(resolvedParams.id);
      fetchUser(resolvedParams.id);
    });
  }, [params]);

  const fetchUser = async (id: string) => {
    try {
      const response = await getUserById(id);
      setUser(response.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-orange-200" />
          <p className="text-zinc-400 font-medium">Fetching profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-100 shadow-xl animate-in fade-in zoom-in duration-300">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-bold">!</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Error Occurred</h3>
            <p className="text-zinc-500 mt-2">{error}</p>
            <Link href="/admin/users" className="mt-6 block">
              <Button className="w-full bg-[#FF5A1F] hover:bg-[#e44e1a]">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-4 sm:px-6 lg:px-8">
      {/* Container with entrance animation */}
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/admin/users" className="group flex items-center text-zinc-500 hover:text-zinc-800 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back to Users</span>
          </Link>
          <div className="flex gap-3">
             <Link href={`/admin/users/${userId}/edit`}>
              <Button variant="outline" className="border-zinc-200 hover:bg-zinc-50">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden rounded-3xl">
          {/* Subtle Primary Color Accent */}
          <div className="h-2 w-full bg-[#FF5A1F] opacity-90" />
          
          <CardHeader className="pb-8 pt-10 px-8 border-b border-zinc-50">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Profile Image Section */}
              <div className="relative">
                {user?.image ? (
                  <img
                    src={getImageUrl(user.image)}
                    alt="Profile"
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-orange-50 shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-zinc-100 flex items-center justify-center ring-4 ring-zinc-50">
                    <User className="h-10 w-10 text-zinc-400" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-[#FF5A1F] text-white p-1.5 rounded-lg shadow-lg">
                  <Shield className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-3xl font-bold text-zinc-900 tracking-tight">
                    {user?.name}
                  </CardTitle>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    user?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <CardDescription className="text-base text-zinc-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {user?.email}
                </CardDescription>
                <p className="text-[11px] font-mono text-zinc-400 bg-zinc-50 w-fit px-2 py-0.5 rounded mt-2">
                  ID: {userId}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Contact Information Group */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact Details</h4>
                <div className="space-y-4">
                  <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone Number" value={user?.phoneNumber || 'Not provided'} />
                  <DetailItem icon={<Mail className="h-4 w-4" />} label="Secondary Email" value={user?.email} />
                </div>
              </section>

              {/* Account Timeline Group */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Metadata</h4>
                <div className="space-y-4">
                  <DetailItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Member Since" 
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'} 
                  />
                  <DetailItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Last Updated" 
                    value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'} 
                  />
                </div>
              </section>

              {user?.image && (
                <div className="md:col-span-2 mt-4">
                  <a
                    href={getImageUrl(user.image)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5A1F] hover:text-[#e44e1a] bg-orange-50 px-4 py-2 rounded-lg transition-all"
                  >
                    <ExternalLink className="h-4 w-4" /> View Full Resolution Profile Picture
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for detail rows
function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 transition-all">
      <div className="mt-0.5 text-zinc-400">{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-zinc-400 leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-zinc-800">{value}</p>
      </div>
    </div>
  );
}