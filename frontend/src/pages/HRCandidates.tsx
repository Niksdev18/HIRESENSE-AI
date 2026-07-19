import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Search, Users, ArrowLeft, CheckSquare, Square, X, Globe, Phone, MapPin, FileText, ChevronRight, Sparkles, LayoutDashboard, Briefcase, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

const LinkedinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-slate-455 hover:text-slate-200 transition-colors"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface ResumeAnalysis {
  id: string;
  atsScore: number;
  matchScore: number;
  recommendation: string;
  job: {
    title: string;
  };
}

interface CandidateProfile {
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  experienceYears: number | null;
  education: string | null; // JSON
  experience: string | null; // JSON
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  resumeAnalyses?: ResumeAnalysis[];
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  profile: CandidateProfile | null;
}

export const HRCandidates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareView, setIsCompareView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const sidebarItems = [
    { name: 'Dashboard', path: '/hr', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Candidates', path: '/hr/candidates', icon: <Users className="w-4 h-4" /> },
    { name: 'Analytics', path: '/hr/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Query candidate pool
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates-pool'],
    queryFn: async () => {
      const res = await api.get('/api/applications/pool');
      return res.data.candidates as Candidate[];
    },
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setIsCompareView(false);
  };

  const getFullResumeUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  const parseJsonField = (fieldVal: string | null | undefined) => {
    if (!fieldVal) return [];
    try {
      return JSON.parse(fieldVal);
    } catch {
      return [];
    }
  };

  const filteredCandidates = candidates?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profile?.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const comparedCandidates = candidates?.filter((c) => selectedIds.includes(c.id)) || [];

  // Compare View Panel
  if (isCompareView) {
    return (
      <DashboardLayout title="Candidate Side-by-Side Comparison" sidebarItems={sidebarItems}>
        <div className="space-y-6 text-left">
          <button
            onClick={() => setIsCompareView(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pool
          </button>

          <div className="glass-panel rounded-2xl border border-slate-900 overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900/40">
                  <th className="p-4 font-bold uppercase tracking-wider text-slate-400 text-left w-48">Parameter</th>
                  {comparedCandidates.map((c) => (
                    <th key={c.id} className="p-4 font-bold text-slate-200 text-left min-w-[220px] border-l border-slate-900">
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{c.email}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Location */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Location</td>
                  {comparedCandidates.map((c) => (
                    <td key={c.id} className="p-4 border-l border-slate-900 text-slate-300">
                      {c.profile?.location || 'Not Specified'}
                    </td>
                  ))}
                </tr>
                {/* Phone */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Phone</td>
                  {comparedCandidates.map((c) => (
                    <td key={c.id} className="p-4 border-l border-slate-900 text-slate-300 font-mono">
                      {c.profile?.phone || 'N/A'}
                    </td>
                  ))}
                </tr>
                {/* Exp Years */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Experience</td>
                  {comparedCandidates.map((c) => (
                    <td key={c.id} className="p-4 border-l border-slate-900 text-violet-400 font-bold">
                      {c.profile?.experienceYears !== null ? `${c.profile?.experienceYears} Years` : 'Not Spec.'}
                    </td>
                  ))}
                </tr>
                {/* Skills */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Key Skills</td>
                  {comparedCandidates.map((c) => (
                    <td key={c.id} className="p-4 border-l border-slate-900">
                      <div className="flex flex-wrap gap-1">
                        {c.profile?.skills.map((skill) => (
                          <span key={skill} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400">
                            {skill}
                          </span>
                        )) || <span className="text-slate-600">None</span>}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Education */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Education</td>
                  {comparedCandidates.map((c) => {
                    const edus = parseJsonField(c.profile?.education);
                    return (
                      <td key={c.id} className="p-4 border-l border-slate-900">
                        {edus.length > 0 ? (
                          <div className="space-y-1.5">
                            {edus.map((e: any, i: number) => (
                              <div key={i}>
                                <p className="font-semibold text-slate-200">{e.degree}</p>
                                <p className="text-[10px] text-slate-500">{e.school} • {e.year}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">Not spec.</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Experience Detail */}
                <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Latest Employment</td>
                  {comparedCandidates.map((c) => {
                    const exps = parseJsonField(c.profile?.experience);
                    return (
                      <td key={c.id} className="p-4 border-l border-slate-900">
                        {exps.length > 0 ? (
                          <div className="space-y-1.5">
                            {exps.slice(0, 1).map((e: any, i: number) => (
                              <div key={i}>
                                <p className="font-semibold text-slate-200">{e.title}</p>
                                <p className="text-[10px] text-slate-500">{e.company} • {e.duration}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">Not spec.</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Resume Download */}
                <tr className="hover:bg-slate-900/10">
                  <td className="p-4 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Resume Document</td>
                  {comparedCandidates.map((c) => (
                    <td key={c.id} className="p-4 border-l border-slate-900">
                      {c.profile?.resumeUrl ? (
                        <a
                          href={getFullResumeUrl(c.profile.resumeUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-violet-400 hover:underline font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-slate-600">No Resume</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Candidate Pool Directory" sidebarItems={sidebarItems}>
      <div className="space-y-6 text-left relative">
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-900">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search candidate name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs transition-all text-slate-200 placeholder:text-slate-600"
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-400 transition-all flex items-center justify-center gap-1.5"
              >
                Clear Selection ({selectedIds.length})
              </button>
            )}
            <button
              disabled={selectedIds.length < 2}
              onClick={() => setIsCompareView(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-505 disabled:opacity-40 disabled:hover:bg-violet-600 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              Compare Candidates
            </button>
          </div>
        </div>

        {/* Candidate pool list */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 rounded-2xl glass-panel animate-pulse h-28" />
            ))}
          </div>
        ) : !filteredCandidates || filteredCandidates.length === 0 ? (
          <div className="glass-panel p-16 text-center rounded-2xl">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Candidates Found</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              No matching candidate records found. Try modifying filters or typing alternate keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCandidates.map((candidate) => {
              const isChecked = selectedIds.includes(candidate.id);
              return (
                <div
                  key={candidate.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isChecked ? 'border-violet-500/40 bg-violet-950/5' : 'border-slate-900 hover:border-slate-800/80'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Compare Selection Checkbox */}
                    <button
                      onClick={() => toggleSelect(candidate.id)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-violet-400 border border-slate-800 mt-0.5 shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4.5 h-4.5 text-violet-400 fill-violet-500/10" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-650" />
                      )}
                    </button>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <h4
                          onClick={() => setSelectedCandidate(candidate)}
                          className="font-bold text-slate-200 text-sm hover:text-violet-400 hover:underline cursor-pointer transition-colors"
                        >
                          {candidate.name}
                        </h4>
                        <span className="text-[9px] text-slate-500 font-mono">{candidate.email}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                        <div>Exp: <span className="text-slate-300 font-bold">{candidate.profile?.experienceYears !== null ? `${candidate.profile?.experienceYears} yrs` : 'Not Specified'}</span></div>
                        <div>Loc: <span className="text-slate-300 font-semibold">{candidate.profile?.location || 'N/A'}</span></div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {candidate.profile?.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-850 text-[10px] text-slate-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all shadow shrink-0 self-center"
                    title="View Profile Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Candidate Detail Modal Overlay */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end p-0">
            <div className="w-full max-w-2xl h-full bg-slate-950 border-l border-slate-900 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative animate-slideLeft">
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedCandidate.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedCandidate.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-1 rounded bg-slate-900 text-slate-500 hover:text-white border border-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="space-y-6 text-xs text-slate-400">
                  {/* Bio */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biography</h4>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                      {selectedCandidate.profile?.bio || 'No biography written.'}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Technical Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.profile?.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                          {skill}
                        </span>
                      )) || <p className="text-slate-600">None spec.</p>}
                    </div>
                  </div>

                  {/* Info coordinates */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-900/20 p-4 rounded-xl border border-slate-900">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {selectedCandidate.profile?.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {selectedCandidate.profile?.location || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1.5 border-l border-slate-900 pl-4">
                      {selectedCandidate.profile?.linkedinUrl && (
                        <a href={selectedCandidate.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-violet-400 hover:underline">
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          LinkedIn Profile
                        </a>
                      )}
                      {selectedCandidate.profile?.githubUrl && (
                        <a href={selectedCandidate.profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-violet-400 hover:underline">
                          <Globe className="w-3.5 h-3.5" />
                          GitHub Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* AI Screen Evaluations */}
                  {selectedCandidate.profile?.resumeAnalyses && selectedCandidate.profile.resumeAnalyses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Screening Evaluations
                      </h4>
                      <div className="space-y-2.5">
                        {selectedCandidate.profile.resumeAnalyses.map((analysis) => (
                          <div key={analysis.id} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-200">{analysis.job.title}</span>
                              <div className="flex gap-2">
                                <span className="text-[9px] font-bold text-violet-450 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                                  ATS: {analysis.atsScore}%
                                </span>
                                <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Match: {analysis.matchScore}%
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/20 p-2 rounded border border-slate-900/60">
                              {analysis.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Education History</h4>
                    <div className="space-y-2.5">
                      {parseJsonField(selectedCandidate.profile?.education).map((e: any, i: number) => (
                        <div key={i} className="flex justify-between items-start border-l-2 border-violet-500 pl-3">
                          <div>
                            <p className="font-semibold text-slate-200">{e.degree}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{e.school}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{e.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employment History</h4>
                    <div className="space-y-3.5">
                      {parseJsonField(selectedCandidate.profile?.experience).map((e: any, i: number) => (
                        <div key={i} className="border-l-2 border-violet-500 pl-3 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-200">{e.title}</p>
                              <p className="text-[10px] text-slate-500">{e.company}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{e.duration}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resume PDF preview */}
                  {selectedCandidate.profile?.resumeUrl && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploaded Resume PDF</h4>
                      <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-900">
                        <iframe
                          src={getFullResumeUrl(selectedCandidate.profile.resumeUrl)}
                          className="w-full h-full"
                          title="Candidate Resume Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300"
                >
                  Close Panel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
export default HRCandidates;
