import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { User as UserIcon, Phone, MapPin, Link2, GitBranch, Globe, Plus, Trash2, Loader2, Award, Briefcase } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

const LinkedinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const profileSchema = z.object({
  phone: z.string().min(5, 'Phone number is too short').optional().or(z.literal('')),
  location: z.string().min(2, 'Location details are too short').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid Portfolio URL').optional().or(z.literal('')),
  skillsString: z.string().optional().or(z.literal('')),
  education: z.array(
    z.object({
      degree: z.string().min(2, 'Degree is required'),
      school: z.string().min(2, 'School/University is required'),
      year: z.string().min(4, 'Year is required'),
    })
  ),
  experience: z.array(
    z.object({
      title: z.string().min(2, 'Title is required'),
      company: z.string().min(2, 'Company name is required'),
      duration: z.string().min(2, 'Duration/Dates are required'),
      description: z.string().optional().or(z.literal('')),
    })
  ),
});

type ProfileInputs = z.infer<typeof profileSchema>;

interface ProfileData {
  phone: string | null;
  location: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  skills: string[];
  experienceYears: number | null;
  education: string | null; // stored as JSON string
  experience: string | null; // stored as JSON string
  resumeUrl: string | null;
  user: {
    name: string;
    email: string;
  };
}

export const CandidateProfile: React.FC = () => {
  const queryClient = useQueryClient();
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const sidebarItems = [
    { name: 'Dashboard', path: '/candidate', icon: <UserIcon className="w-4 h-4" /> },
    { name: 'Profile', path: '/candidate/profile', icon: <UserIcon className="w-4 h-4" /> },
    { name: 'Resume', path: '/candidate/resume', icon: <UserIcon className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <UserIcon className="w-4 h-4" /> },
    { name: 'Applications', path: '/candidate/applications', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      location: '',
      bio: '',
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: '',
      skillsString: '',
      education: [],
      experience: [],
    },
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education',
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: 'experience',
  });

  // Query Profile
  const { data, isLoading } = useQuery({
    queryKey: ['candidate-profile-data'],
    queryFn: async () => {
      const res = await api.get('/api/candidate/profile');
      return res.data.profile as ProfileData;
    },
  });

  // Populate form values
  useEffect(() => {
    if (data) {
      setValue('phone', data.phone || '');
      setValue('location', data.location || '');
      setValue('bio', data.bio || '');
      setValue('githubUrl', data.githubUrl || '');
      setValue('linkedinUrl', data.linkedinUrl || '');
      setValue('portfolioUrl', data.portfolioUrl || '');
      setValue('skillsString', data.skills.join(', '));

      try {
        if (data.education) {
          setValue('education', JSON.parse(data.education));
        }
        if (data.experience) {
          setValue('experience', JSON.parse(data.experience));
        }
      } catch (e) {
        console.error('Error parsing JSON profile details:', e);
      }
    }
  }, [data, setValue]);

  // Dynamic profile completion calculation
  const watchAll = watch();
  useEffect(() => {
    if (!data) return;

    let score = 20; // Default 10% Name + 10% Email

    if (watchAll.phone) score += 10;
    if (watchAll.location) score += 10;
    if (watchAll.bio) score += 10;
    if (watchAll.skillsString && watchAll.skillsString.trim().length > 0) score += 15;
    if (watchAll.education && watchAll.education.length > 0) score += 15;
    if (watchAll.experience && watchAll.experience.length > 0) score += 15;
    if (data.resumeUrl) score += 5;

    setCompletionPercentage(Math.min(score, 100));
  }, [watchAll, data]);

  // Mutation to update profile
  const updateMutation = useMutation({
    mutationFn: async (inputs: ProfileInputs) => {
      const skillsArray = inputs.skillsString
        ? inputs.skillsString.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
        : [];

      const payload = {
        phone: inputs.phone,
        location: inputs.location,
        bio: inputs.bio,
        githubUrl: inputs.githubUrl,
        linkedinUrl: inputs.linkedinUrl,
        portfolioUrl: inputs.portfolioUrl,
        skills: skillsArray,
        experienceYears: inputs.experience?.length || 0, // simple heuristic
        education: inputs.education,
        experience: inputs.experience,
      };

      return await api.put('/api/candidate/profile', payload);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidate-profile-data'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update profile details.';
      toast.error(msg);
    },
  });

  const onSubmit = (formData: ProfileInputs) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Profile" sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Profile" sidebarItems={sidebarItems}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        
        {/* Form area */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-violet-400" />
              Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={data?.user.name || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/20 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={data?.user.email || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/20 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-400 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location Details</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('location')}
                    placeholder="San Francisco, CA"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                </div>
                {errors.location && <p className="text-[10px] text-rose-400 mt-1">{errors.location.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Short Biography</label>
              <textarea
                rows={3}
                {...register('bio')}
                placeholder="Brief summary of your professional journey..."
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700 resize-none"
              />
              {errors.bio && <p className="text-[10px] text-rose-400 mt-1">{errors.bio.message}</p>}
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-violet-400" />
              Social Portfolio Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GitHub Link</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('githubUrl')}
                    placeholder="https://github.com/..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                </div>
                {errors.githubUrl && <p className="text-[10px] text-rose-400 mt-1">{errors.githubUrl.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">LinkedIn Link</label>
                <div className="relative">
                  <LinkedinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('linkedinUrl')}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                </div>
                {errors.linkedinUrl && <p className="text-[10px] text-rose-400 mt-1">{errors.linkedinUrl.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portfolio Link</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    {...register('portfolioUrl')}
                    placeholder="https://myportfolio.com"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
                  />
                </div>
                {errors.portfolioUrl && <p className="text-[10px] text-rose-400 mt-1">{errors.portfolioUrl.message}</p>}
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-violet-400" />
              Technical Skills
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skills (Comma separated list)</label>
              <input
                type="text"
                {...register('skillsString')}
                placeholder="React, TypeScript, Node.js, PostgreSQL, CSS"
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* Education Details */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-400" />
                Education History
              </h3>
              <button
                type="button"
                onClick={() => appendEdu({ degree: '', school: '', year: '' })}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] font-semibold text-slate-300 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add School
              </button>
            </div>

            {eduFields.map((field, idx) => (
              <div key={field.id} className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => removeEdu(idx)}
                  className="absolute top-4 right-4 p-1 rounded bg-rose-950/10 border border-rose-900/10 hover:border-rose-900/30 text-rose-400/70 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Degree / Major</label>
                    <input
                      type="text"
                      {...register(`education.${idx}.degree` as const)}
                      placeholder="e.g. B.S. Computer Science"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">School / University</label>
                    <input
                      type="text"
                      {...register(`education.${idx}.school` as const)}
                      placeholder="e.g. Stanford University"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Graduation Year</label>
                    <input
                      type="text"
                      {...register(`education.${idx}.year` as const)}
                      placeholder="e.g. 2022"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Work Experience */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-violet-400" />
                Work Experience
              </h3>
              <button
                type="button"
                onClick={() => appendExp({ title: '', company: '', duration: '', description: '' })}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] font-semibold text-slate-300 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Experience
              </button>
            </div>

            {expFields.map((field, idx) => (
              <div key={field.id} className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => removeExp(idx)}
                  className="absolute top-4 right-4 p-1 rounded bg-rose-950/10 border border-rose-900/10 hover:border-rose-900/30 text-rose-400/70 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
                    <input
                      type="text"
                      {...register(`experience.${idx}.title` as const)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
                    <input
                      type="text"
                      {...register(`experience.${idx}.company` as const)}
                      placeholder="e.g. Google Inc"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration / Dates</label>
                    <input
                      type="text"
                      {...register(`experience.${idx}.duration` as const)}
                      placeholder="e.g. June 2022 - Present"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Responsibilities / Projects</label>
                  <textarea
                    rows={2}
                    {...register(`experience.${idx}.description` as const)}
                    placeholder="Built responsive React pages, managed state via Redux..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 focus:border-violet-500 outline-none text-xs text-slate-200 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-1.5"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save Profile Updates'
              )}
            </button>
          </div>
        </form>

        {/* Profile completion gauge */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 lg:col-span-1">
          <h3 className="font-bold text-slate-200">Profile Completion</h3>
          
          <div className="flex flex-col items-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-slate-900 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-violet-500 fill-none transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-2xl font-extrabold text-slate-100">{completionPercentage}%</span>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold mt-0.5">strength</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-slate-900 pt-5">
            <h4 className="text-xs font-bold text-slate-400">Strength Checklist</h4>
            <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
              <li className="flex items-center gap-2 text-emerald-400">
                ✓ Account Created (+20%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.phone ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.phone ? '✓' : '○'} Phone Details (+10%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.location ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.location ? '✓' : '○'} Location Details (+10%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.bio ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.bio ? '✓' : '○'} Biography (+10%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.skillsString && watchAll.skillsString.trim().length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.skillsString && watchAll.skillsString.trim().length > 0 ? '✓' : '○'} Technical Skills (+15%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.education && watchAll.education.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.education && watchAll.education.length > 0 ? '✓' : '○'} Education Details (+15%)
              </li>
              <li className={`flex items-center gap-2 ${watchAll.experience && watchAll.experience.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                {watchAll.experience && watchAll.experience.length > 0 ? '✓' : '○'} Experience Details (+15%)
              </li>
              <li className={`flex items-center gap-2 ${data?.resumeUrl ? 'text-emerald-400' : 'text-slate-600'}`}>
                {data?.resumeUrl ? '✓' : '○'} Resume Uploaded (+5%)
              </li>
            </ul>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
export default CandidateProfile;
