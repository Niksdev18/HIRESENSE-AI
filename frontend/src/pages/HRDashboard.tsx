import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { LayoutDashboard, Briefcase, Users, CheckSquare, Calendar, Plus, ChevronRight, ArrowLeft, Loader2, ExternalLink, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  createdAt: string;
  requiredSkills: string[];
}

interface Application {
  id: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interview' | 'Selected';
  appliedAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    profile: {
      phone: string | null;
      location: string | null;
      skills: string[];
      experienceYears: number | null;
      resumeUrl: string | null;
    } | null;
  };
}

export const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const sidebarItems = [
    { name: 'Dashboard', path: '/hr', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Candidates', path: '/hr/candidates', icon: <Users className="w-4 h-4" /> },
    { name: 'Analytics', path: '/hr/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Fetch jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.jobs as Job[];
    },
  });

  // Fetch applicants for selected job
  const { data: applicants, isLoading: isApplicantsLoading } = useQuery({
    queryKey: ['job-applicants', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      const res = await api.get(`/api/applications/job/${selectedJobId}`);
      return res.data.applications as Application[];
    },
    enabled: !!selectedJobId,
  });

  // Mutation to update applicant status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: Application['status'] }) => {
      return await api.put(`/api/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Applicant status updated!');
      queryClient.invalidateQueries({ queryKey: ['job-applicants', selectedJobId] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    },
  });

  const getFullResumeUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  const handleStatusChange = (appId: string, status: Application['status']) => {
    updateStatusMutation.mutate({ appId, status });
  };

  const selectedJob = jobs?.find((j) => j.id === selectedJobId);

  return (
    <DashboardLayout title={selectedJobId ? `Applicants for ${selectedJob?.title}` : `Welcome back, ${user?.name || 'Recruiter'}`} sidebarItems={sidebarItems}>
      {/* Overview stats cards (Only show on main dashboard) */}
      {!selectedJobId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 bg-violet-600/10 rounded-bl-2xl border-l border-b border-white/5 text-violet-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Open Positions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-200">
                {isJobsLoading ? '...' : jobs?.length || 0}
              </span>
              <span className="text-xs text-violet-400 font-medium">Active listings</span>
            </div>
            <p className="text-slate-500 text-[10px] mt-4">Manage or add listings from below.</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 bg-indigo-600/10 rounded-bl-2xl border-l border-b border-white/5 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Total Pool</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-200">124</span>
              <span className="text-xs text-indigo-400 font-medium">+15 this week</span>
            </div>
            <p className="text-slate-500 text-[10px] mt-4">Profiles stored in database.</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 bg-emerald-600/10 rounded-bl-2xl border-l border-b border-white/5 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Applications</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-200">42</span>
              <span className="text-xs text-emerald-400 font-medium">Pending review</span>
            </div>
            <p className="text-slate-500 text-[10px] mt-4">Calculated across all postings.</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 bg-amber-600/10 rounded-bl-2xl border-l border-b border-white/5 text-amber-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Interviews</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-400">4</span>
              <span className="text-xs text-slate-400 font-medium">scheduled</span>
            </div>
            <p className="text-slate-500 text-[10px] mt-4">Upcoming syncs scheduled this week.</p>
          </div>
        </div>
      )}

      {/* Main Grid: Active Listings or Applicants list based on selection */}
      <div className="grid grid-cols-1 gap-8 text-left">
        {selectedJobId ? (
          /* Applicants Management Table View */
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-4">
              <button
                onClick={() => setSelectedJobId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Jobs
              </button>
              <div className="text-xs text-slate-500 font-medium">
                {selectedJob?.company} • {selectedJob?.location}
              </div>
            </div>

            {isApplicantsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : !applicants || applicants.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-400">No Applicants Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Applications will appear here as soon as candidates click quick-apply on this job post.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/30 text-[10px] text-slate-550 uppercase tracking-wider">
                      <th className="p-4 font-bold text-left">Candidate</th>
                      <th className="p-4 font-bold text-left">Experience</th>
                      <th className="p-4 font-bold text-left">Skills</th>
                      <th className="p-4 font-bold text-left">Resume</th>
                      <th className="p-4 font-bold text-left">Applied Date</th>
                      <th className="p-4 font-bold text-left">Status</th>
                      <th className="p-4 font-bold text-center">Change Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app) => (
                      <tr key={app.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 font-semibold text-slate-200">
                          <div>{app.candidate.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{app.candidate.email}</div>
                        </td>
                        <td className="p-4">
                          {app.candidate.profile?.experienceYears !== null ? `${app.candidate.profile?.experienceYears} yrs` : 'N/A'}
                        </td>
                        <td className="p-4 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {app.candidate.profile?.skills.slice(0, 3).map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400">
                                {s}
                              </span>
                            ))}
                            {app.candidate.profile?.skills && app.candidate.profile.skills.length > 3 && (
                              <span className="text-[9px] text-slate-500 self-center">+{app.candidate.profile.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {app.candidate.profile?.resumeUrl ? (
                            <a
                              href={getFullResumeUrl(app.candidate.profile.resumeUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              View PDF
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-650">No Document</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[10px]">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              app.status === 'Applied'
                                ? 'bg-slate-900 border-slate-800 text-slate-400'
                                : app.status === 'Shortlisted'
                                ? 'bg-violet-950/20 border-violet-900/30 text-violet-400'
                                : app.status === 'Interview'
                                ? 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                                : app.status === 'Selected'
                                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                                : 'bg-rose-950/20 border-rose-900/30 text-rose-400'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as Application['status'])}
                            className="bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-semibold outline-none transition-all cursor-pointer"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Main Jobs Listings Board */
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-200">Active Postings</h3>
                <p className="text-xs text-slate-500 mt-1">Select a job posting to manage submitted candidate applications</p>
              </div>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-550 rounded-xl text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Post Job
              </Link>
            </div>

            {isJobsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 animate-pulse h-20" />
                ))}
              </div>
            ) : !jobs || jobs.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-400">No Job Postings</h4>
                <p className="text-xs text-slate-500 mt-1">Create a job post to accept candidate applications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/30 flex items-center justify-between hover:border-slate-700/60 transition-all group cursor-pointer"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-violet-400 transition-colors">{job.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.company} • {job.location} • Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-550 group-hover:text-violet-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default HRDashboard;
