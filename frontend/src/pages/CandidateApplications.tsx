import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileText, MapPin, DollarSign, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

interface Application {
  id: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interview' | 'Selected';
  appliedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
  };
}

export const CandidateApplications: React.FC = () => {
  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate', icon: <FileText className="w-4 h-4" /> },
    { name: 'Profile', path: '/candidate/profile', icon: <FileText className="w-4 h-4" /> },
    { name: 'Resume', path: '/candidate/resume', icon: <FileText className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <FileText className="w-4 h-4" /> },
    { name: 'Applications', path: '/candidate/applications', icon: <FileText className="w-4 h-4" /> },
  ];

  // Query candidate applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: async () => {
      const res = await api.get('/api/applications/candidate');
      return res.data.applications as Application[];
    },
  });

  const getStepStatus = (currentStatus: string, stepName: string) => {
    const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(stepName);

    if (currentStatus === 'Rejected') {
      return 'rejected';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const renderStepper = (status: Application['status']) => {
    const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
    const isRejected = status === 'Rejected';

    return (
      <div className="w-full pt-4 pb-2">
        {isRejected ? (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            This application was rejected. Please review feedback in details or apply for alternate postings.
          </div>
        ) : (
          <div className="relative flex justify-between items-center w-full max-w-xl mx-auto">
            {/* Connecting lines */}
            <div className="absolute left-6 right-6 top-[15px] h-[3px] bg-slate-900 -z-10 rounded" />
            <div
              className="absolute left-6 top-[15px] h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500 -z-10 rounded transition-all duration-500"
              style={{
                width:
                  status === 'Applied'
                    ? '0%'
                    : status === 'Shortlisted'
                    ? '33%'
                    : status === 'Interview'
                    ? '66%'
                    : '100%',
              }}
            />

            {steps.map((step, idx) => {
              const stepState = getStepStatus(status, step);
              return (
                <div key={step} className="flex flex-col items-center relative">
                  {/* Step node icon indicator */}
                  <div
                    className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      stepState === 'completed'
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/15'
                        : stepState === 'active'
                        ? 'bg-slate-950 border-violet-500 text-violet-400 ring-4 ring-violet-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {stepState === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-2 font-semibold transition-colors ${
                      stepState === 'active' || stepState === 'completed'
                        ? 'text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Applications Tracking" sidebarItems={sidebarItems}>
      {isLoading ? (
        <div className="space-y-4 text-left">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 rounded-2xl glass-panel animate-pulse h-40" />
          ))}
        </div>
      ) : !applications || applications.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl max-w-4xl mx-auto">
          <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-300">No Applications Submitted</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            You haven't applied to any job openings yet. Head over to our Job Board to start matching.
          </p>
        </div>
      ) : (
        <div className="space-y-6 text-left max-w-4xl mx-auto">
          {applications.map((app) => (
            <div
              key={app.id}
              className="glass-panel p-6 rounded-2xl border border-slate-900/60 hover:border-slate-850 transition-all space-y-5"
            >
              {/* Header details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-base">{app.job.title}</h3>
                  <p className="text-xs text-violet-400 font-semibold mt-0.5">{app.job.company}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {app.job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {app.job.salary}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Status Stepper */}
              {renderStepper(app.status)}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
export default CandidateApplications;
