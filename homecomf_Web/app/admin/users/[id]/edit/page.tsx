'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { getUserById, updateUser } from '@/lib/api/admin';
import { ArrowLeft, User, Mail, Phone, Shield, Lock, Camera, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: PageProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'user',
    password: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setUserId(resolvedParams.id);
      fetchUser(resolvedParams.id);
    });
  }, [params]);

  const fetchUser = async (id: string) => {
    try {
      const response = await getUserById(id);
      setFormData({
        name: response.user.name,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        role: response.user.role,
        password: '',
      });
      if (response.user.image) {
        // Assuming your getImageUrl logic from previous pages
        setImagePreview(response.user.image); 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('role', formData.role);
      if (formData.password) data.append('password', formData.password);
      if (imageFile) data.append('image', imageFile);

      await updateUser(userId, data);
      setSuccess('User updated successfully!');
      setTimeout(() => router.push('/admin/users'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#FF5A1F] animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Breadcrumb / Back Navigation */}
        <Link href="/admin/users" className="inline-flex items-center text-zinc-500 hover:text-[#FF5A1F] transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Discard changes and go back</span>
        </Link>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <div className="h-2 w-full bg-[#FF5A1F] opacity-90" />
          
          <CardHeader className="pt-10 px-8 flex flex-col items-center text-center">
             <div className="relative group mb-4">
                <div className="h-24 w-24 rounded-3xl bg-zinc-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md transition-transform group-hover:scale-105">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-zinc-300" />
                  )}
                  <label htmlFor="image" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white h-6 w-6" />
                  </label>
                </div>
                <input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
             </div>

            <CardTitle className="text-3xl font-bold text-zinc-900 tracking-tight">Edit Profile</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Modifying record for <span className="font-mono text-[11px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{userId}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Status Feedback */}
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input name="name" value={formData.name} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus:ring-[#FF5A1F]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus:ring-[#FF5A1F]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus:ring-[#FF5A1F]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Account Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 text-zinc-400" />
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className="pl-10 h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Standard User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Update Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                      name="password" 
                      type="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder="Leave empty to keep current password" 
                      className="pl-10 h-11 rounded-xl bg-white border-zinc-200 focus:ring-[#FF5A1F]" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full h-12 bg-[#FF5A1F] hover:bg-[#e44e1a] text-white font-bold rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Record...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}