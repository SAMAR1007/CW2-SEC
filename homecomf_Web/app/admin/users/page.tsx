'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/app/components/ui/pagination';
import { getAllUsers, deleteUser } from '@/lib/api/admin';
import { Plus, UserCircle, Search, MoreVertical, Trash2, Eye, Edit, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 5;

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (currentPage: number) => {
    setLoading(true);
    try {
      const response = await getAllUsers({ page: currentPage, limit });
      setUsers(response.users);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalUsers(response.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(id);
      await fetchUsers(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) =>
      [user?.name, user?.email, user?.phoneNumber, user?.role]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded-lg" />
          <div className="h-32 w-full max-w-4xl bg-zinc-100 rounded-2xl mt-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#FF5A1F] font-bold text-xs uppercase tracking-widest">
              <Users className="h-4 w-4" /> Management
            </div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Users</h1>
            <p className="text-zinc-500 font-medium">Overview of all active accounts in your system.</p>
          </div>
          
          <Link href="/admin/users/create">
            <Button className="bg-[#FF5A1F] hover:bg-[#e44e1a] text-white shadow-lg shadow-orange-200 px-6 h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="mr-2 h-5 w-5" /> Create New User
            </Button>
          </Link>
        </div>

        {/* Directory Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-zinc-50 px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-zinc-800">User Directory</CardTitle>
                <CardDescription className="text-zinc-400">
                  Showing {filteredUsers.length} of {totalUsers || users.length} users
                </CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#FF5A1F] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-100 rounded-xl text-sm transition-all outline-none w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {error && (
              <div className="m-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="hover:bg-transparent border-b border-zinc-50">
                    <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-wider pl-8">Profile</TableHead>
                    <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-wider">Contact Info</TableHead>
                    <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-wider">Access Role</TableHead>
                    <TableHead className="font-bold text-zinc-400 uppercase text-[11px] tracking-wider pr-8 text-right">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow 
                      key={user._id} 
                      className="group hover:bg-zinc-50/80 transition-all border-b border-zinc-50/50 animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="py-4 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-[#FF5A1F] font-bold border border-orange-200">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-zinc-700">{user.name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-600">{user.email}</span>
                          <span className="text-xs text-zinc-400">{user.phoneNumber || 'No phone'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 pr-8 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/users/${user._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-lg">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${user._id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDelete(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Mobile action indicator */}
                        <div className="group-hover:hidden text-zinc-300">
                          <MoreVertical className="h-4 w-4 ml-auto" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {users.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <div className="bg-zinc-50 p-6 rounded-full mb-4">
                  <UserCircle className="h-12 w-12 text-zinc-200" />
                </div>
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Start by creating a new account.</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-50">
                <p className="text-xs text-zinc-400">
                  Page {page} of {totalPages}
                </p>
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((prev) => Math.max(1, prev - 1));
                        }}
                      />
                    </PaginationItem>

                    {pageNumbers.map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}