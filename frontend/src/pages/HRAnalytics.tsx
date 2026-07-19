import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, Sparkles, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

interface AnalyticsData {
  barData: { name: string; value: number }[];
  pieData: { name: string; value: number }[];
  averageAts: number;
  topSkills: { name: string; count: number }[];
}

const COLORS = ['#8b5cf6', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export const HRAnalytics: React.FC = () => {
  const sidebarItems = [
    { name: 'Dashboard', path: '/hr', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Jobs', path: '/jobs', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Candidates', path: '/hr/candidates', icon: <Users className="w-4 h-4" /> },
  ];

  // Fetch analytics aggregates
  const { data, isLoading } = useQuery({
    queryKey: ['hr-analytics'],
    queryFn: async () => {
      const res = await api.get('/api/analytics');
      return res.data as AnalyticsData;
    },
  });

  return (
    <DashboardLayout title="Hiring Analytics & Insights" sidebarItems={sidebarItems}>
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : !data ? (
        <div className="glass-panel p-16 text-center rounded-2xl">
          <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-400">Failed to load analytics</h4>
        </div>
      ) : (
        <div className="space-y-8 text-left">
          
          {/* Aggregates Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 bg-violet-600/10 rounded-bl-2xl border-l border-b border-white/5 text-violet-400">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Average ATS Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-violet-400">{data.averageAts}%</span>
                <span className="text-xs text-slate-400 font-medium">overall pool</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" style={{ width: `${data.averageAts}%` }} />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden md:col-span-2">
              <div className="absolute top-0 right-0 p-3 bg-emerald-600/10 rounded-bl-2xl border-l border-b border-white/5 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Top Requested Skills</span>
              <div className="flex flex-wrap gap-2">
                {data.topSkills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-850 bg-slate-900/30 text-xs font-semibold">
                    <span className="text-slate-300">{skill.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 font-bold">
                      {skill.count} postings
                    </span>
                  </div>
                ))}
                {data.topSkills.length === 0 && (
                  <span className="text-xs text-slate-600">No skills keywords recorded in postings.</span>
                )}
              </div>
            </div>
          </div>

          {/* Recharts Graphics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Bar Chart: Applications per Job */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Applications Per Job Posting
              </h3>
              <div className="w-full h-80">
                {data.barData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600">No jobs listings found.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart: Recruitment Funnel */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Hiring Funnel Status Breakdown
              </h3>
              <div className="w-full h-80 flex flex-col sm:flex-row items-center justify-center">
                {data.pieData.length === 0 ? (
                  <div className="text-xs text-slate-600">No applications received yet.</div>
                ) : (
                  <>
                    <div className="w-full sm:w-2/3 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data.pieData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:w-1/3 text-left">
                      {data.pieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-[11px] font-semibold text-slate-350">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </DashboardLayout>
  );
};
export default HRAnalytics;
