import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  LayoutDashboard, FileText, Briefcase, CheckSquare, Users, 
  TrendingUp, HelpCircle, Sparkles, Loader2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

interface Application {
  id: string;
  status: string;
}

interface ResumeAnalysis {
  atsScore: number;
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectsScore: number;
  certificationsScore: number;
  missingSkills: string[];
  matchedSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

interface ProfileData {
  id: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  education: string | null;
  experience: string | null;
  resumeUrl: string | null;
}

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [targetJobId, setTargetJobId] = useState('');

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Profile', path: '/candidate/profile', icon: <Users className="w-4 h-4" /> },
    { name: 'Resume', path: '/candidate/resume', icon: <FileText className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Applications', path: '/candidate/applications', icon: <CheckSquare className="w-4 h-4" /> },
  ];

  // Fetch candidate profile (to calculate completion and check resume)
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['candidate-profile-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/candidate/profile');
      return res.data.profile as ProfileData;
    },
  });

  // Fetch applications count
  const { data: applications } = useQuery({
    queryKey: ['candidate-applications-count'],
    queryFn: async () => {
      const res = await api.get('/api/applications/candidate');
      return res.data.applications as Application[];
    },
  });

  // Fetch available jobs
  const { data: jobs } = useQuery({
    queryKey: ['jobs-list-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.jobs as Job[];
    },
  });

  // Mutation to run AI analysis
  const runAnalysisMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post('/api/ai/analyze-resume', { jobId });
      return res.data.analysis as ResumeAnalysis;
    },
    onSuccess: () => {
      toast.success('AI Screen completed successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to complete AI screen.';
      toast.error(msg);
    },
  });

  const handleRunAnalysis = () => {
    if (!targetJobId) {
      toast.error('Please select a target job opening.');
      return;
    }
    runAnalysisMutation.mutate(targetJobId);
  };

  // Calculate profile completion strength (identical to Profile page logic)
  const getProfileCompletion = () => {
    if (!profile) return 20;
    let score = 20; // 10% name + 10% email
    if (profile.phone) score += 10;
    if (profile.location) score += 10;
    if (profile.bio) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.education && JSON.parse(profile.education || '[]').length > 0) score += 15;
    if (profile.experience && JSON.parse(profile.experience || '[]').length > 0) score += 15;
    if (profile.resumeUrl) score += 5;
    return Math.min(score, 100);
  };

  const completionPercent = getProfileCompletion();

  return (
    <DashboardLayout title={`Welcome back, ${user?.name || 'Candidate'}`} sidebarItems={sidebarItems}>
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-left">
        {/* ATS Score card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 bg-violet-600/10 rounded-bl-2xl border-l border-b border-white/5 text-violet-400 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">ATS Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-violet-400">
              {runAnalysisMutation.data?.atsScore ? `${runAnalysisMutation.data.atsScore}%` : 'N/A'}
            </span>
            {runAnalysisMutation.data && (
              <span className="text-xs text-emerald-400 font-medium">Evaluated</span>
            )}
          </div>
          <p className="text-slate-500 text-[10px] mt-8">Select a job below to run AI scoring.</p>
        </div>

        {/* Jobs Applied */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 bg-indigo-600/10 rounded-bl-2xl border-l border-b border-white/5 text-indigo-400 group-hover:scale-110 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Applications</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-200">
              {applications?.length || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">postings</span>
          </div>
          <p className="text-slate-500 text-[10px] mt-8">Manage submissions under Applications.</p>
        </div>

        {/* Profile Status */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 bg-emerald-600/10 rounded-bl-2xl border-l border-b border-white/5 text-emerald-400 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Profile strength</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-200">{completionPercent}%</span>
            <span className="text-xs text-emerald-400 font-medium">Complete</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-slate-500 text-[10px] mt-2.5">Edit coordinates in Profile section.</p>
        </div>

        {/* AI Tools Cards */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 bg-amber-600/10 rounded-bl-2xl border-l border-b border-white/5 text-amber-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">AI Copilot</span>
          <div className="flex gap-2 mt-2">
            <Link
              to="/candidate/cover-letter"
              className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 border border-amber-500/20 bg-amber-500/5 px-2 py-1 rounded"
            >
              Cover Letter
            </Link>
            <Link
              to="/candidate/interview-prep"
              className="text-[10px] font-bold text-violet-400 hover:underline flex items-center gap-0.5 border border-violet-500/20 bg-violet-500/5 px-2 py-1 rounded"
            >
              Prep Questions
            </Link>
          </div>
          <p className="text-slate-500 text-[10px] mt-5">Generate copyable resources.</p>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Left column: AI resume screen utility */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-200">AI Screen Assessment</h3>
            </div>
            {runAnalysisMutation.data && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Match Score: {runAnalysisMutation.data.matchScore}%
              </span>
            )}
          </div>

          {/* If profile or resume doesn't exist */}
          {!isProfileLoading && !profile?.resumeUrl ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-slate-655 mx-auto" />
              <div>
                <h4 className="text-xs font-bold text-slate-350">Resume Required</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
                  You must upload a digital or scanned resume document in the Resume section before triggering AI screening.
                </p>
              </div>
              <button
                onClick={() => navigate('/candidate/resume')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-550 text-xs font-semibold text-white shadow-lg"
              >
                Go to Resume Management
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Screening Trigger Form */}
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 flex flex-col sm:flex-row gap-4 items-end justify-between">
                <div className="w-full">
                  <label className="block text-[9px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Target Job Listing</label>
                  <select
                    value={targetJobId}
                    onChange={(e) => setTargetJobId(e.target.value)}
                    disabled={runAnalysisMutation.isPending}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer disabled:opacity-40"
                  >
                    <option value="">-- Choose target job role --</option>
                    {jobs?.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} at {j.company}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleRunAnalysis}
                  disabled={runAnalysisMutation.isPending}
                  className="px-5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-550 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shrink-0 flex items-center gap-1 transition-all"
                >
                  {runAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Screen
                    </>
                  )}
                </button>
              </div>

              {/* Explainable AI report block */}
              {runAnalysisMutation.isPending && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <p className="text-xs text-slate-550 animate-pulse font-medium">Running screening heuristics. Checking cache coordinates...</p>
                </div>
              )}

              {runAnalysisMutation.data && !runAnalysisMutation.isPending && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Scores breakdown gauges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Skills</span>
                      <span className="text-base font-extrabold text-violet-400">{runAnalysisMutation.data.skillsScore}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Experience</span>
                      <span className="text-base font-extrabold text-indigo-400">{runAnalysisMutation.data.experienceScore}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Education</span>
                      <span className="text-base font-extrabold text-emerald-400">{runAnalysisMutation.data.educationScore}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Projects</span>
                      <span className="text-base font-extrabold text-amber-400">{runAnalysisMutation.data.projectsScore}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Certifs.</span>
                      <span className="text-base font-extrabold text-pink-400">{runAnalysisMutation.data.certificationsScore}%</span>
                    </div>
                  </div>

                  {/* Plain Language Recommendation */}
                  <div className="p-4 rounded-xl border border-violet-500/10 bg-violet-600/5 text-xs text-slate-300 leading-relaxed font-medium">
                    <span className="font-bold text-violet-400 block mb-1">Recommendation Verdict</span>
                    {runAnalysisMutation.data.recommendation}
                  </div>

                  {/* Matched / Missing skills checklists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Matched Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {runAnalysisMutation.data.matchedSkills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-[10px] text-emerald-400 font-semibold">
                            ✓ {s}
                          </span>
                        ))}
                        {runAnalysisMutation.data.matchedSkills.length === 0 && (
                          <span className="text-[10px] text-slate-600">None detected.</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {runAnalysisMutation.data.missingSkills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-400 font-semibold">
                            ✗ {s}
                          </span>
                        ))}
                        {runAnalysisMutation.data.missingSkills.length === 0 && (
                          <span className="text-[10px] text-emerald-400">All matching criteria met!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Strengths</h4>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 font-medium">
                        {runAnalysisMutation.data.strengths.map((str, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Areas for Improvement</h4>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 font-medium">
                        {runAnalysisMutation.data.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* General Placeholder report */}
              {!runAnalysisMutation.data && !runAnalysisMutation.isPending && (
                <div className="p-16 text-center border border-dashed border-slate-900 rounded-xl bg-slate-950/10">
                  <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-slate-400">Select target position to run analysis</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Our semantic compiler checks skills, experience weighting, and keywords to rank your compatibility before recruiters screen.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: General Pro Tips */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-violet-400">
              <HelpCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-200">ATS Preparation Advice</h3>
            </div>
            <ul className="space-y-4 text-xs text-slate-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Format experience descriptions around metrics (e.g. "reduced render loops by 40%").</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Declare missing skill keywords inside your project descriptions to verify hands-on execution.</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Verify that your degree details matches the educational standard expected for target postings.</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 border-t border-slate-900 pt-4 text-center">
            <span className="text-[9px] text-slate-500">Need help? Read our AI Copilot guidelines.</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default CandidateDashboard;
