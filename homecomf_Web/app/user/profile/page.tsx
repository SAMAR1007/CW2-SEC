'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { verify } from '@/lib/api/auth';
import { updateProfile } from '@/lib/api/admin';
import { User, Mail, Phone, Lock, Camera, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await verify();
        setUser(response.user);
        setFormData({
          name: response.user.name,
          email: response.user.email,
          phoneNumber: response.user.phoneNumber,
          password: '',
        });
      } catch (err: any) {
        setError(err.message);
        if (typeof window !== 'undefined') window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
      if (formData.password) data.append('password', formData.password);
      if (imageFile) data.append('image', imageFile);

      const result = await updateProfile(user._id, data);
      if (result?.user) {
        setUser(result.user);
        setFormData(prev => ({ ...prev, password: '' }));
      }
      if (result?.imageError) {
        setSuccess('Profile updated, but image upload failed: ' + result.imageError);
      } else {
        setSuccess('Profile updated successfully!');
      }
      setImageFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#FF5A1F] animate-spin" />
          <p className="text-zinc-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <p className="text-[#FF5A1F] font-bold text-xs uppercase tracking-widest">Personal Settings</p>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Profile</h1>
        </div>

        <Card className="max-w-5xl mx-auto border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white rounded-4xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[320px_1fr]">
              
              {/* Profile Sidebar */}
              <div className="bg-zinc-50/80 border-r border-zinc-100 p-8 flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-[2.5rem] bg-white shadow-xl overflow-hidden border-4 border-white mb-6 transition-transform group-hover:scale-[1.02]">
                    {previewUrl || user?.image ? (
                      <img
                        src={previewUrl || getImageUrl(user?.image)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-orange-50 flex items-center justify-center">
                        <User className="h-12 w-12 text-[#FF5A1F]" />
                      </div>
                    )}
                  </div>
                  <label htmlFor="image" className="absolute bottom-4 right-0 h-10 w-10 bg-[#FF5A1F] text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#e44e1a] transition-all hover:scale-110">
                    <Camera className="h-5 w-5" />
                    <input id="image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-bold text-zinc-900">{user?.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-white rounded-full border border-zinc-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">{user?.role} Account</span>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-6 border-t border-zinc-200">
                  <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-white/50 border border-transparent hover:border-orange-100 transition-all">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Primary Email</p>
                      <p className="text-xs font-semibold text-zinc-600 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-zinc-800">Account Information</h2>
                  <p className="text-zinc-500">Update your details and how others see you on the platform.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl animate-in fade-in">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl animate-in fade-in">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm font-semibold">{success}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input name="name" value={formData.name} onChange={handleInputChange} className="pl-10 h-12 rounded-xl focus:ring-[#FF5A1F]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="pl-10 h-12 rounded-xl focus:ring-[#FF5A1F]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-10 h-12 rounded-xl focus:ring-[#FF5A1F]" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Change Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" className="pl-10 h-12 rounded-xl focus:ring-[#FF5A1F] bg-zinc-50/30" />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={submitting} 
                      className="w-full sm:w-auto min-w-50 h-12 bg-[#FF5A1F] hover:bg-[#e44e1a] text-white font-bold rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </div>
                      ) : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}