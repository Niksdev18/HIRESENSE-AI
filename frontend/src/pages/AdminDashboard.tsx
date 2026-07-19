import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Users, Briefcase, FileSpreadsheet, Loader2, Trash2, LayoutDashboard } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { toast } from 'react-hot-toast';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'Candidate' | 'HR' | 'Admin';
  isActive: boolean;
  createdAt: string;
}

interface AuditLogRecord {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface JobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'logs'>('users');

  const sidebarItems = [
    { name: 'Admin Portal', path: '/hr', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Jobs Board', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
  ];

  // 1. Fetch Users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users');
      return res.data.users as UserRecord[];
    },
    enabled: activeTab === 'users',
  });

  // 2. Fetch Audit Logs
  const { data: logs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const res = await api.get('/api/admin/audit-logs');
      return res.data.logs as AuditLogRecord[];
    },
    enabled: activeTab === 'logs',
  });

  // 3. Fetch Jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.jobs as JobRecord[];
    },
    enabled: activeTab === 'jobs',
  });

  // Deactivate User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/admin/users/${id}`);
    },
    onSuccess: () => {
      toast.success('User account deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to deactivate user.';
      toast.error(msg);
    },
  });

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate user account: ${name}? This preserves their resume content, audit entries, and matching logs but denies login access.`)) {
      deleteUserMutation.mutate(id);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETED')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action.includes('CREATED')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.includes('EDITED')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
  };

  const formatLogDetails = (detailStr: string) => {
    try {
      const parsed = JSON.parse(detailStr);
      return Object.entries(parsed).map(([key, val]) => `${key}: ${JSON.stringify(val)}`).join(', ');
    } catch {
      return detailStr;
    }
  };

  return (
    <DashboardLayout title="System Administration Panel" sidebarItems={sidebarItems}>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-900 gap-6 text-xs font-semibold mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'users' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            Users Management
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'jobs' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Briefcase className="w-4.5 h-4.5" />
            Jobs Management
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'logs' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            HR Audit Trail Logs
          </button>
        </div>

        {/* Tab Contents */}
        <div className="glass-panel p-6 rounded-2xl">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 text-sm mb-4">Account Supervision</h3>
              {isUsersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-left">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Registered Date</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((usr) => (
                        <tr key={usr.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-semibold text-slate-200">{usr.name}</td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-400">{usr.email}</td>
                          <td className="py-3.5 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              usr.role === 'Admin' ? 'bg-rose-950/20 border-rose-900/30 text-rose-400' :
                              usr.role === 'HR' ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' :
                              'bg-slate-900 border-slate-800 text-slate-400'
                            }`}>{usr.role}</span>
                          </td>
                          <td className="py-3.5 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              usr.isActive ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' :
                              'bg-rose-950/20 border-rose-900/30 text-rose-400'
                            }`}>{usr.isActive ? 'Active' : 'Deactivated'}</span>
                          </td>
                          <td className="py-3.5 text-slate-500">{new Date(usr.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 text-center">
                            {usr.isActive ? (
                              <button
                                onClick={() => handleDeleteUser(usr.id, usr.name)}
                                className="p-1.5 rounded bg-rose-950/20 border border-rose-900/20 hover:border-rose-900/50 text-rose-400 transition-all flex items-center justify-center mx-auto"
                                title="Deactivate User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No Actions</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 text-sm mb-4">Postings Supervision</h3>
              {isJobsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-left">
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Company</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Posted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs?.map((job) => (
                        <tr key={job.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-semibold text-slate-200">{job.title}</td>
                          <td className="py-3.5 text-slate-400">{job.company}</td>
                          <td className="py-3.5 text-slate-450">{job.location}</td>
                          <td className="py-3.5 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 text-sm mb-4">Recruitment Action Trail</h3>
              {isLogsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-left">
                        <th className="pb-3">HR Operator</th>
                        <th className="pb-3">Action Event</th>
                        <th className="pb-3">Details</th>
                        <th className="pb-3">Execution Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs?.map((log) => (
                        <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-semibold text-slate-200">
                            <div>{log.user.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.user.email}</div>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400 max-w-[320px] truncate" title={formatLogDetails(log.details)}>
                            {formatLogDetails(log.details)}
                          </td>
                          <td className="py-3.5 text-slate-500 font-mono text-[10px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};
export default AdminDashboard;
