import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Briefcase, MapPin, DollarSign, Plus, Trash2, Edit2, Search, Loader2, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Link } from 'react-router-dom';

// Zod schema for job form
const jobSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  company: z.string().min(2, 'Company must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requiredSkillsString: z.string().min(2, 'Skills must be separated by commas'),
  experience: z.string().min(1, 'Experience range is required'),
  salary: z.string().min(1, 'Salary details are required'),
  location: z.string().min(1, 'Location is required'),
});

type JobFormInputs = z.infer<typeof jobSchema>;

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  experience: string;
  salary: string;
  location: string;
  createdById: string;
  createdAt: string;
}

export const JobsList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<JobFormInputs>({
    resolver: zodResolver(jobSchema),
  });

  // Query jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.jobs as Job[];
    },
  });

  // Create/Edit Job Mutation
  const saveJobMutation = useMutation({
    mutationFn: async (data: JobFormInputs) => {
      const skillsArray = data.requiredSkillsString
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        title: data.title,
        company: data.company,
        description: data.description,
        requiredSkills: skillsArray,
        experience: data.experience,
        salary: data.salary,
        location: data.location,
      };

      if (editingJob) {
        return await api.put(`/api/jobs/${editingJob.id}`, payload);
      } else {
        return await api.post('/api/jobs', payload);
      }
    },
    onSuccess: () => {
      toast.success(editingJob ? 'Job updated successfully!' : 'Job posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      closeForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to save job post.';
      toast.error(msg);
    },
  });

  // Delete Job Mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/jobs/${id}`);
    },
    onSuccess: () => {
      toast.success('Job listing removed.');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete job post.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: JobFormInputs) => {
    saveJobMutation.mutate(data);
  };

  const startEdit = (job: Job) => {
    setEditingJob(job);
    setValue('title', job.title);
    setValue('company', job.company);
    setValue('description', job.description);
    setValue('requiredSkillsString', job.requiredSkills.join(', '));
    setValue('experience', job.experience);
    setValue('salary', job.salary);
    setValue('location', job.location);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingJob(null);
    reset();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      deleteJobMutation.mutate(id);
    }
  };

  // Filtered jobs based on search term
  const filteredJobs = jobs?.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isHR = user?.role === 'HR' || user?.role === 'Admin';

  const content = (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by job title, company, location, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs transition-all placeholder:text-slate-600 text-slate-200"
          />
        </div>
        {isHR && !isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        )}
      </div>

      {/* Main Grid: Form Drawer (HR) + Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form panel for creating/editing job */}
        {isHR && isFormOpen && (
          <div className="glass-panel p-6 rounded-2xl lg:col-span-1 border border-violet-500/20 shadow-xl shadow-violet-950/10">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-bold text-slate-200">{editingJob ? 'Edit Job Post' : 'Post New Job'}</h3>
              <button onClick={closeForm} className="p-1 rounded bg-slate-900 text-slate-500 hover:text-white border border-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Lead Frontend Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                />
                {errors.title && <p className="text-[10px] text-rose-400 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                <input
                  type="text"
                  {...register('company')}
                  placeholder="e.g. HireSense AI"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                />
                {errors.company && <p className="text-[10px] text-rose-400 mt-1">{errors.company.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    {...register('location')}
                    placeholder="e.g. Remote / NY"
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                  {errors.location && <p className="text-[10px] text-rose-400 mt-1">{errors.location.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Salary Details</label>
                  <input
                    type="text"
                    {...register('salary')}
                    placeholder="e.g. $80k - $100k"
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                  {errors.salary && <p className="text-[10px] text-rose-400 mt-1">{errors.salary.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Experience Required</label>
                <input
                  type="text"
                  {...register('experience')}
                  placeholder="e.g. 2+ years"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                />
                {errors.experience && <p className="text-[10px] text-rose-400 mt-1">{errors.experience.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  {...register('requiredSkillsString')}
                  placeholder="React, Node.js, TypeScript"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                />
                {errors.requiredSkillsString && <p className="text-[10px] text-rose-400 mt-1">{errors.requiredSkillsString.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  placeholder="Summarize key requirements and developer responsibilities..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700 resize-none"
                />
                {errors.description && <p className="text-[10px] text-rose-400 mt-1">{errors.description.message}</p>}
              </div>

              <button
                type="submit"
                disabled={saveJobMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                {saveJobMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {editingJob ? 'Update Job Posting' : 'Post Job'}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        <div className={`space-y-4 ${isHR && isFormOpen ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 rounded-2xl glass-panel animate-pulse h-32" />
              ))}
            </div>
          ) : !filteredJobs || filteredJobs.length === 0 ? (
            <div className="glass-panel p-16 text-center rounded-2xl">
              <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-slate-300">No Job Postings Found</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                No active jobs match your search queries. Try clearing parameters or typing alternate keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="glass-panel p-6 rounded-2xl border border-slate-900 hover:border-slate-800 transition-all text-left flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div>
                      <h3 className="font-bold text-slate-200 text-base">{job.title}</h3>
                      <p className="text-xs text-violet-400 font-semibold mt-0.5">{job.company}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.experience}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl line-clamp-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {job.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col justify-end items-center sm:items-end gap-2.5 self-end sm:self-start shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex gap-2">
                      {isHR && job.createdById === user?.id && (
                        <>
                          <button
                            onClick={() => startEdit(job)}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all shadow"
                            title="Edit Job"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 hover:border-rose-900/60 text-rose-400 hover:bg-rose-950/40 transition-all shadow"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {!isHR && (
                        <button
                          onClick={() => toast.success(`Applied to ${job.title} at ${job.company}!`)}
                          className="px-4.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg transition-all"
                        >
                          Quick Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If user is authenticated, wrap in DashboardLayout
  if (user) {
    const sidebarItems =
      user.role === 'HR'
        ? [
            { name: 'Dashboard', path: '/hr', icon: <Briefcase className="w-4 h-4" /> },
            { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
            { name: 'Candidates', path: '/hr/candidates', icon: <Briefcase className="w-4 h-4" /> },
          ]
        : [
            { name: 'Dashboard', path: '/candidate', icon: <Briefcase className="w-4 h-4" /> },
            { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
            { name: 'Applications', path: '/candidate/applications', icon: <Briefcase className="w-4 h-4" /> },
          ];

    return (
      <DashboardLayout title="Job Board Search" sidebarItems={sidebarItems}>
        {content}
      </DashboardLayout>
    );
  }

  // Guest view (with navigation header)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/25 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white">H</div>
            <span className="text-lg font-bold text-slate-200">HireSense AI</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors self-center">
              Log in
            </Link>
            <Link to="/register" className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 animate-fadeIn">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-6 text-left">
          Available Job Openings
        </h1>
        {content}
      </main>
    </div>
  );
};
export default JobsList;
