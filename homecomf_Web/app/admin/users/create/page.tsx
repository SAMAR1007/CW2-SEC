'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { createUser } from '@/lib/api/admin';
import { UserPlus, ArrowLeft, Mail, User, Phone, Lock, Shield, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'user',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Generate preview URL
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
      data.append('password', formData.password);
      data.append('role', formData.role);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      await createUser(data);
      setSuccess('User created successfully! Redirecting...');
      
      setFormData({ name: '', email: '', phoneNumber: '', password: '', role: 'user' });
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Top Navigation */}
        <Link href="/admin/users" className="inline-flex items-center text-zinc-500 hover:text-[#FF5A1F] transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Directory</span>
        </Link>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <div className="h-2 w-full bg-[#FF5A1F]" />
          
          <CardHeader className="pt-10 px-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
              <UserPlus className="h-7 w-7 text-[#FF5A1F]" />
            </div>
            <CardTitle className="text-3xl font-bold text-zinc-900 tracking-tight">Create New User</CardTitle>
            <CardDescription className="text-base">Register a new account with specific access roles</CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Status Messages */}
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-xl animate-in slide-in-from-top-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Upload Section */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50 hover:bg-zinc-50 hover:border-orange-200 transition-all group relative">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md" alt="Preview" />
                  ) : (
                    <Camera className="h-10 w-10 text-zinc-300 group-hover:text-[#FF5A1F] transition-colors" />
                  )}
                  <Label htmlFor="image" className="mt-3 cursor-pointer text-sm font-bold text-zinc-500 group-hover:text-[#FF5A1F]">
                    {imageFile ? 'Change Photo' : 'Upload Profile Picture'}
                  </Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus-visible:ring-[#FF5A1F]" placeholder="John Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus-visible:ring-[#FF5A1F]" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus-visible:ring-[#FF5A1F]" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required className="pl-10 h-11 rounded-xl focus-visible:ring-[#FF5A1F]" placeholder="••••••••" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Account Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 text-zinc-400" />
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className="pl-10 h-11 rounded-xl focus:ring-[#FF5A1F]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Standard User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting} 
                className="w-full h-12 bg-[#FF5A1F] hover:bg-[#e44e1a] text-white font-bold rounded-xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}