import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileText, Copy, Check, Sparkles, Loader2, AlertCircle, LayoutDashboard, Briefcase, Users } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

export const AICoverLetter: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Profile', path: '/candidate/profile', icon: <Users className="w-4 h-4" /> },
    { name: 'Resume', path: '/candidate/resume', icon: <FileText className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Applications', path: '/candidate/applications', icon: <FileText className="w-4 h-4" /> },
  ];

  // Fetch jobs for dropdown selection
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['candidate-jobs-for-cl'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.jobs as Job[];
    },
  });

  // Cover Letter generation mutation
  const generateCLMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post('/api/ai/generate-cover-letter', { jobId });
      return res.data.coverLetter as string;
    },
    onSuccess: (data) => {
      setCoverLetter(data);
      toast.success('Cover letter generated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to generate cover letter. Make sure you have uploaded your resume.';
      toast.error(msg);
    },
  });

  const handleGenerate = () => {
    if (!selectedJobId) {
      toast.error('Please select a target job position first.');
      return;
    }
    generateCLMutation.mutate(selectedJobId);
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <DashboardLayout title="AI Cover Letter Generator" sidebarItems={sidebarItems}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
        {/* Controls Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-slate-200">Generate Letter</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select a job listing below. Our AI engine will analyze your active resume strengths and write a targeted cover letter matching the position requirements.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Job Listing</label>
              {isJobsLoading ? (
                <div className="h-9 bg-slate-900 animate-pulse rounded-lg border border-slate-800" />
              ) : (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-250 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Job Opening --</option>
                  {jobs?.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company} ({job.location})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateCLMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-550 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shadow-violet-600/15 flex items-center justify-center gap-1.5 transition-all"
            >
              {generateCLMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Write Cover Letter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="font-bold text-slate-200 text-sm">Target Cover Letter</h3>
              {coverLetter && (
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-semibold text-slate-350 flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Letter'}
                </button>
              )}
            </div>

            {generateCLMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-xs text-slate-500 animate-pulse font-medium">Drafting cover letter based on your resume...</p>
              </div>
            ) : coverLetter ? (
              <div className="mt-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl max-h-[450px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
                {coverLetter}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-10 h-10 text-slate-700 mb-3" />
                <h4 className="text-xs font-bold text-slate-400">No Cover Letter Generated Yet</h4>
                <p className="text-[10px] text-slate-500 max-w-sm mt-1">
                  Choose a target position on the left panel and click write. Your generated letter will render here.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6 flex items-center gap-2 text-[10px] text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-650 shrink-0" />
            Cover letters are generated on-the-fly and are ephemeral (not persisted in the database). Please copy or save your draft before navigating away.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default AICoverLetter;
