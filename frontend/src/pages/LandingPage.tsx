import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Shield, Zap, Sparkles, ChevronDown, Check, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (email: string) => {
    setIsDemoLoading(true);
    try {
      await login(email, 'password123');
      toast.success(`Logged in as demo ${email.includes('hr') ? 'recruiter' : 'candidate'}!`);
      if (email.includes('hr')) {
        navigate('/hr');
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      toast.error('Failed to log in as demo user. Make sure server seed is running.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const faqs = [
    {
      q: "How does HireSense AI analyze resumes?",
      a: "HireSense AI utilizes advanced AI algorithms powered by Google Gemini to parse and extract skills, work history, and education from your resumes. It then matches these against job descriptions to calculate objective match scores."
    },
    {
      q: "Can I manage multiple roles as an HR administrator?",
      a: "Yes! The HR dashboard provides complete CRUD capabilities for job listings, allows you to track and filter applicants, and compare resumes side-by-side."
    },
    {
      q: "Is my personal resume data secure?",
      a: "Security is our highest priority. All authentication sessions are secured via secure HttpOnly cookies, and we enforce strict role-based access control. In later milestones, resume documents are stored securely in Cloudinary."
    },
    {
      q: "What is the ATS Matching Score?",
      a: "The Applicant Tracking System (ATS) matching score is an AI-powered score from 0 to 100 that grades how well a resume satisfies the technical and professional criteria outlined in a job description."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/25 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">H</div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">HireSense AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40 transition-all flex items-center gap-1.5"
            >
              Sign up
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Recruitment Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight mb-6">
          Screen Resumes Instantly with <span className="text-violet-500">Generative AI</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Unlock intelligence in your recruitment. Automate resume parses, score candidates, and generate personalized interview questions with Gemini-driven models.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-white shadow-xl shadow-violet-600/25 hover:shadow-violet-600/35 transition-all text-base"
          >
            Start Free Trial
          </Link>
        </div>

        {import.meta.env.VITE_ENABLE_DEMO !== 'false' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button
              onClick={() => handleDemoLogin('candidate@hiresense.ai')}
              disabled={isDemoLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isDemoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
              Try Candidate Demo
            </button>
            <button
              onClick={() => handleDemoLogin('hr@hiresense.ai')}
              disabled={isDemoLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isDemoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              Try Recruiter Demo
            </button>
          </div>
        )}

        {/* Embedded Interactive Glass Layout Screen */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-800/60 bg-slate-900/25 p-4 shadow-2xl backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 rounded-2xl" />
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-slate-500 ml-2 font-mono">dashboard.hiresense.ai</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ATS Score Match</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-violet-400">92%</span>
                <span className="text-xs text-emerald-400 font-medium">✓ Highly Compatible</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Top Matching Skills</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['React', 'TypeScript', 'Node.js', 'PostgreSQL'].map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">AI Recommendation</span>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Candidate shows strong engineering experience matching the stack. Recommended for immediate tech screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Supercharge Your Hiring Funnel
            </h2>
            <p className="text-slate-400 mt-4">
              Stop reading piles of PDF resumes. Let our AI highlight top candidates, generate structured reports, and streamline interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl glass-panel-hover text-left">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center text-violet-400 mb-6 shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Gemini Analysis</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Extract complete profiles, strengths, weaknesses, and ATS metrics using advanced LLMs within seconds.
              </p>
            </div>
            <div className="glass-panel p-8 rounded-2xl glass-panel-hover text-left">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Instant Screening</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Rank candidates automatically based on custom weightings for skills, experience, and educational background.
              </p>
            </div>
            <div className="glass-panel p-8 rounded-2xl glass-panel-hover text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-400 mb-6 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Secure & Private</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                All data is sealed using secure HttpOnly sessions. Your database, keys, and credentials remain private and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 mt-4">
              Choose the perfect plan to streamline your recruitment process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="glass-panel p-8 rounded-2xl text-left flex flex-col">
              <h3 className="text-lg font-bold text-slate-200">Basic</h3>
              <p className="text-sm text-slate-400 mt-1">For candidate profiles</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-slate-400 text-sm"> / forever</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Apply to unlimited jobs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Basic resume builder
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Application status tracking
                </li>
              </ul>
              <Link to="/register" className="mt-auto w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-center text-sm font-semibold text-slate-200 transition-all">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="glass-panel p-8 rounded-2xl text-left border-violet-500/30 bg-slate-900/40 relative flex flex-col scale-105 shadow-xl shadow-violet-950/20">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Popular
              </div>
              <h3 className="text-lg font-bold text-slate-200">Pro Recruiter</h3>
              <p className="text-sm text-slate-400 mt-1">For high-growth teams</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$49</span>
                <span className="text-slate-400 text-sm"> / month</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Unlimited Job Listings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  150 Resume AI Parses / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Advanced candidate side-by-side compare
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  AI Interview Generator
                </li>
              </ul>
              <Link to="/register" className="mt-auto w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-center text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all">
                Start 7-Day Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="glass-panel p-8 rounded-2xl text-left flex flex-col">
              <h3 className="text-lg font-bold text-slate-200">Enterprise</h3>
              <p className="text-sm text-slate-400 mt-1">For custom requirements</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">Custom</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Dedicated support SLAs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Custom AI screening weights
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  Unlimited parses & OCR uploads
                </li>
              </ul>
              <Link to="/register" className="mt-auto w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-center text-sm font-semibold text-slate-200 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Loved by Recruiters Everywhere
            </h2>
            <p className="text-slate-400 mt-4">
              Here is what recruitment agencies and HR experts say about HireSense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8 rounded-2xl text-left relative">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-300 italic mb-6 text-sm leading-relaxed">
                "HireSense AI completely transformed our initial parsing workflows. We went from spending hours reading through portfolios to matching top candidate profiles with 95% accuracy in minutes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-violet-400 border border-slate-700">S</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Sarah Jenkins</h4>
                  <span className="text-xs text-slate-500 font-medium">HR Director, TechCorp</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl text-left relative">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-300 italic mb-6 text-sm leading-relaxed">
                "The Gemini-driven ATS matcher is incredible. It provides objective score weightings for skills and experience, and the side-by-side compare feature saves us massive amounts of coordination time."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-violet-400 border border-slate-700">M</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Marcus Chen</h4>
                  <span className="text-xs text-slate-500 font-medium">Head of Recruiting, Apex Staffing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 mt-4">Everything you need to know about the HireSense AI platform.</p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-panel rounded-xl overflow-hidden transition-all duration-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-violet-400' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center font-bold text-white text-xs">H</div>
            <span className="text-sm font-semibold text-slate-300">HireSense AI</span>
          </div>
          <p>© 2026 HireSense AI. All rights reserved. Built with Vite, React, Express, Prisma, and Gemini.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
