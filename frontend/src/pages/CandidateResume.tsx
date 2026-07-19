import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { FileText, Upload, Trash2, Eye, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

interface Profile {
  resumeUrl: string | null;
  resumeText: string | null;
  updatedAt: string;
}

export const CandidateResume: React.FC = () => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate', icon: <FileText className="w-4 h-4" /> },
    { name: 'Profile', path: '/candidate/profile', icon: <FileText className="w-4 h-4" /> },
    { name: 'Resume', path: '/candidate/resume', icon: <FileText className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <FileText className="w-4 h-4" /> },
    { name: 'Applications', path: '/candidate/applications', icon: <FileText className="w-4 h-4" /> },
  ];

  // Fetch candidate profile (to get resumeUrl)
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: async () => {
      const res = await api.get('/api/candidate/profile');
      return res.data.profile as Profile;
    },
  });

  // Upload Resume Mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append('resume', fileToUpload);

      return await api.post('/api/candidate/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Resume uploaded and parsed successfully!');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'File upload failed. Ensure signature is valid.';
      toast.error(msg);
    },
  });

  // Delete Resume Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete('/api/candidate/resume');
    },
    onSuccess: () => {
      toast.success('Resume removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete resume.';
      toast.error(msg);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!validMimes.includes(selectedFile.type)) {
      toast.error('Only PDF and DOCX files are allowed.');
      return;
    }
    
    // Check size limit (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to remove your resume? This will withdraw candidate eligibility from applying to jobs.')) {
      deleteMutation.mutate();
    }
  };

  const getFullResumeUrl = (url: string) => {
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  return (
    <DashboardLayout title="Resume Management" sidebarItems={sidebarItems}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Upload box */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-200">Upload or Replace Resume</h3>
          <p className="text-xs text-slate-400">
            Submit your resume in **PDF** or **DOCX** format (Max 5MB). The AI engine will parse your skills, experience, and schooling automatically.
          </p>

          {/* Upload Drop Zone */}
          {!uploadMutation.isPending && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
                isDragActive
                  ? 'border-violet-500 bg-violet-600/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/10'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {file ? file.name : 'Drag & drop your resume file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'or browse files from system'}
              </p>
            </div>
          )}

          {/* Pending Upload Parse Overlay */}
          {uploadMutation.isPending && (
            <div className="border border-violet-500/20 bg-slate-900/40 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-200 animate-pulse">Uploading and Parsing Resume</h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                  Converting vectors and scanning tokens. Scanned PDFs triggering OCR fallback can take up to 30 seconds...
                </p>
              </div>
            </div>
          )}

          {file && !uploadMutation.isPending && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setFile(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition-all"
              >
                Clear Selected
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold text-white shadow-lg transition-all"
              >
                Upload & Parse
              </button>
            </div>
          )}
        </div>

        {/* Current status preview info */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-200">Active Resume Status</h3>

            {isProfileLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            ) : profileData?.resumeUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">Resume Document</h4>
                    <span className="text-[10px] text-slate-500">
                      Uploaded {new Date(profileData.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={getFullResumeUrl(profileData.resumeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/30 hover:border-rose-900/60 text-rose-400 hover:bg-rose-950/40 transition-all shrink-0"
                    title="Delete Resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-center">
                <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">No Resume Uploaded</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  You must upload a resume to unlock job applications and AI score screening.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/40 pt-4 mt-8">
            <div className="flex gap-2 text-violet-400 text-xs font-bold mb-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              OCR Parsing Details
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              If your resume is scanned, our Tesseract engine will execute character recognition. Text rendering yields optimal keyword matching.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default CandidateResume;
