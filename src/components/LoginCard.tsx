import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, User, GraduationCap, Mail, AlertCircle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { Student } from '../types.js';
import { validateUSNAndEmail } from '../validation.js';

interface LoginCardProps {
  activeStudent: Student | null;
  onSignIn: (student: Student) => void;
  onSignOut: () => void;
  onStartPortal: () => void;
}

export default function LoginCard({ activeStudent, onSignIn, onSignOut, onStartPortal }: LoginCardProps) {
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('AI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }
    if (!usn.trim()) {
      setErrorMsg('Please enter your official BNMIT USN (e.g. 1BG24CS045).');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your student email (e.g. 24cs045@bnmit.in).');
      return;
    }

    const validationRes = validateUSNAndEmail(usn, email);
    if (!validationRes.isValid) {
      setErrorMsg(validationRes.error || 'Invalid credentials.');
      return;
    }

    // Verify dept matches chosen branch selector
    const usnDept = usn.trim().substring(5, 7).toUpperCase();
    if (usnDept !== branch) {
      setErrorMsg(`Department mismatch. Your USN indicates department ${usnDept} but you selected ${branch}.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usn: usn.trim(),
          email: email.trim(),
          name: name.trim(),
          branch: branch,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authenication failed');
      }

      setSuccessAnimation(true);
      setTimeout(() => {
        onSignIn(data.student);
        setSuccessAnimation(false);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error during BNMIT login validation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAction = () => {
    setUsn('');
    setEmail('');
    setName('');
    setErrorMsg(null);
    onSignOut();
  };

  // Extract department list for options selector
  const departments = [
    { code: 'AI', name: 'Artificial Intelligence & Machine Learning' },
    { code: 'CS', name: 'Computer Science & Engineering' },
    { code: 'EC', name: 'Electronics & Communication Engineering' },
    { code: 'EE', name: 'Electrical & Electronics Engineering' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'IS', name: 'Information Science & Engineering' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto p-4" id="login_container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle top organic gold glow */}
        <div className="absolute -top-24 -left-20 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-20 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* BNMIT Campus Header */}
        <div className="text-center mb-8 relative z-10" id="login_header">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/10 mb-4">
            B
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            BNM Institute of Technology
          </span>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mt-4 leading-tight tracking-tight">
            Lost & Found <span className="gradient-text">Portal</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
            Securely verify with BNMIT academic credentials to access university-wide lost property reports.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {successAnimation ? (
            <motion.div
              key="success_screen"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-display font-medium text-emerald-400">Authenticated Successful!</h3>
              <p className="text-slate-400 text-sm mt-1">Deploying academic session context...</p>
            </motion.div>
          ) : activeStudent ? (
            // SIGNED IN DISPLAY
            <motion.div
              key="signed_in"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 relative z-10"
              id="login_auth_panel"
            >
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/20 shadow-inner">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-emerald-500/15 text-emerald-300 font-semibold px-2 py-0.5 rounded-full uppercase">Active Student</span>
                    </div>
                    <h4 className="text-white font-medium text-base truncate mt-0.5">{activeStudent?.name || ''}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{activeStudent?.email || ''}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5 text-xs font-mono">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-500 block">UNIVERSITY USN</span>
                    <span className="text-slate-200 font-medium uppercase">{activeStudent?.usn || ''}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-500 block">BRANCH</span>
                    <span className="text-slate-200 font-medium">{activeStudent?.branch || ''} ({activeStudent?.year || ''} Batch)</span>
                  </div>
                </div>
              </div>

              {/* Readonly mock form panels to satisfy the physical inputs existence rules even when signed in */}
              <div className="space-y-3 opacity-40 select-none pointer-events-none">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">USN INPUT (AUTO FILLED)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={activeStudent?.usn || ''} 
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-400" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 font-mono">BNMIT EMAIL (AUTO FILLED)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={activeStudent?.email || ''} 
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-400" 
                  />
                </div>
              </div>

              {/* Primary Interactive buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* 4. Sign Out button */}
                <button
                  type="button"
                  onClick={handleSignOutAction}
                  className="w-full py-3 px-4 rounded-xl text-sm font-medium border border-rose-500/20 hover:border-rose-500/50 bg-rose-950/10 hover:bg-rose-950/40 text-rose-300 transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  id="btn_sign_out"
                >
                  Sign Out Session
                </button>

                {/* 5. Start button - Active when signed in */}
                <button
                  type="button"
                  onClick={onStartPortal}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-5050/90 text-white hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-600/20 animate-pulse flex items-center justify-center gap-2 cursor-pointer"
                  id="btn_start"
                >
                  Start Portal
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            // SIGNED OUT FORM
            <motion.form
              key="sign_in_form"
              onSubmit={handleSignIn}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 relative z-10"
              id="login_auth_form"
            >
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
                  id="login_error"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {/* Name field inside credential block */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono tracking-wide">
                  FULL STUDENT NAME
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Ashish Kumar"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                    id="input_name"
                  />
                </div>
              </div>

              {/* Department Option Box */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono tracking-wide">
                  BRANCH / DEPARTMENT
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">
                    <Shield className="w-4 h-4" />
                  </span>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all duration-150 appearance-none cursor-pointer"
                    id="select_branch"
                  >
                    {departments.map((dept) => (
                      <option key={dept.code} value={dept.code} className="bg-slate-950 text-slate-200 text-xs">
                        {dept.code} — {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 1. USN Input */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400 font-mono tracking-wide">
                    UNIVERSITY USN
                  </label>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">1BG[YY][DEPT][3DIGITS]</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    placeholder="E.g. 1BG24AI002"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 font-mono uppercase"
                    id="input_usn"
                  />
                </div>
              </div>

              {/* 2. Email Input */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400 font-mono tracking-wide">
                    BNMIT STUDENT EMAIL
                  </label>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">@bnmit.in</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E.g. 24ai002@bnmit.in"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 font-mono"
                    id="input_email"
                  />
                </div>
              </div>

              {/* Interactive bottom buttons in non-logged state */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
                {/* 3. Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="btn_sign_in"
                >
                  {loading ? 'Verifying Verification...' : 'Student Sign In'}
                  <Sparkles className="w-4 h-4" />
                </button>

                {/* 4. Sign Out button (disabled state since not logged) */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl text-sm font-medium border border-white/5 bg-white/5 opacity-40 text-slate-400 transition-all duration-200 flex items-center justify-center gap-2 cursor-not-allowed"
                  id="btn_sign_out_inactive"
                >
                  Sign Out
                </button>
              </div>

              {/* 5. Start button (Locked State) */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-medium border border-dashed border-white/10 bg-slate-950/40 text-slate-500 flex items-center justify-center gap-2.5 cursor-not-allowed"
                  id="btn_start_disabled"
                >
                  <Lock className="w-4 h-4 text-slate-600" />
                  Portal Locked (Verify First)
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
