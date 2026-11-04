import React from 'react';
import { motion } from 'motion/react';
import { Package, SearchCheck, CheckCircle2, AlertTriangle, UserCheck, PlusSquare, ArrowRight, Table, Sparkles, Inbox, FileImage } from 'lucide-react';
import { Student, Item } from '../types.js';

interface StatsDashboardProps {
  activeStudent: Student;
  items: Item[];
  onNavigateToItems: () => void;
  onNavigateToUpload: () => void;
}

export default function StatsDashboard({ activeStudent, items, onNavigateToItems, onNavigateToUpload }: StatsDashboardProps) {
  // Compute reactive stats based on full items list
  const totalItems = items.length;
  const lostItems = items.filter(item => item.status === 'lost').length;
  const foundItems = items.filter(item => item.status === 'found').length;
  const claimedItems = items.filter(item => item.status === 'claimed').length;
  
  // Session specific stats: "Each student login must be stored separately... User Upload Count"
  const userUploads = items.filter(item => {
    const itemUsn = item.uploadedBy?.usn || '';
    const activeUsn = activeStudent?.usn || '';
    return itemUsn.toUpperCase() === activeUsn.toUpperCase();
  });
  const userUploadCount = userUploads.length;
  const userClaimedCount = items.filter(item => {
    const claimedUsn = item.claimedBy?.usn || '';
    const activeUsn = activeStudent?.usn || '';
    return claimedUsn.toUpperCase() === activeUsn.toUpperCase();
  }).length;

  const statCards = [
    {
      id: "stat_total",
      label: 'Total Items',
      value: totalItems,
      borderColor: 'border-l-indigo-500/50 border-l-4',
      textColor: 'text-indigo-4050/80 text-indigo-400'
    },
    {
      id: "stat_lost",
      label: 'Lost Now',
      value: lostItems,
      borderColor: 'border-l-orange-500/50 border-l-4',
      textColor: 'text-orange-400'
    },
    {
      id: "stat_found",
      label: 'Found Today',
      value: foundItems,
      borderColor: 'border-l-emerald-500/50 border-l-4',
      textColor: 'text-emerald-400'
    },
    {
      id: "stat_user_uploads",
      label: 'My Uploads',
      value: userUploadCount,
      borderColor: 'border-l-indigo-400/50 border-l-4',
      textColor: 'text-indigo-400'
    },
    {
      id: "stat_user_claims",
      label: 'My Claims',
      value: userClaimedCount,
      borderColor: 'border-l-purple-500/50 border-l-4',
      textColor: 'text-purple-400'
    }
  ];

  const recentUserItems = userUploads.slice(0, 3);

  return (
    <div className="space-y-8" id="dashboard_panel">
      {/* Professional Polish Hero Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-white/10 gap-4" id="dashboard_hero">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {activeStudent?.name || ''}</h1>
          <p className="text-slate-400 text-sm mt-1">Viewing activity for <span className="text-indigo-400 italic font-mono">{activeStudent?.email || ''}</span></p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <button 
            onClick={onNavigateToUpload}
            className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-5050/90 text-white hover:bg-indigo-550 hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer text-center"
          >
            Upload Found Item
          </button>
          <button 
            onClick={onNavigateToItems}
            className="flex-1 md:flex-none px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl font-bold text-sm transition-all cursor-pointer text-center"
          >
            Check All Lost
          </button>
        </div>
      </div>

      {/* Grid of Stat Cards matching Professional Polish design exactly */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="dashboard_stats_grid">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md ${card.borderColor}`}
            id={card.id}
          >
            <div className={`text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2 ${card.textColor}`}>
              {card.label}
            </div>
            <div className="text-3xl font-black text-white">
              {card.value < 10 ? `0${card.value}` : card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Large Action Buttons Requirement styled in Polish Glass */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard_shortcuts">
        {/* Shortcut 1: Check Lost Items */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNavigateToItems}
          className="bg-white/5 border border-white/10 hover:border-white/20 p-6 md:p-8 rounded-2xl text-left group relative overflow-hidden backdrop-blur-md transition-all cursor-pointer"
          id="btn_shortcut_check"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-600/20 transition-colors">
            <SearchCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight">1. Check Lost Items</h4>
          <p className="text-slate-400 text-xs leading-relaxed mt-2 max-w-sm">
            Search items lost in laboratories, college grounds, libraries, or lecture halls. Claim or request verification instantly.
          </p>
          <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mt-5">
            Open Claims Database
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </motion.button>

        {/* Shortcut 2: Upload Found Item */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNavigateToUpload}
          className="bg-white/5 border border-white/10 hover:border-white/20 p-6 md:p-8 rounded-2xl text-left group relative overflow-hidden backdrop-blur-md transition-all cursor-pointer"
          id="btn_shortcut_upload"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-600/20 transition-colors">
            <PlusSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight">2. Upload Found Item</h4>
          <p className="text-slate-400 text-xs leading-relaxed mt-2 max-w-sm">
            Report misplaced cell phones, notebooks, identity cards, or bags found around BNMIT classrooms. Help other students find their property.
          </p>
          <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mt-5">
            File New Found Report
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </motion.button>
      </div>

      {/* Session Storage Highlights - Shows ONLY current student's inventory context */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6" id="dashboard_academic_reports">
        <div className="glass-panel rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <Table className="w-5 h-5 text-indigo-400" />
              <h4 className="text-base font-semibold text-white">Your Personal Upload Inventory ({userUploadCount})</h4>
            </div>
            <span className="text-xs text-slate-500 font-mono uppercase">Student-Auth Session Storage</span>
          </div>

          {recentUserItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Asset Card</th>
                    <th className="py-2.5 px-3">Reported Title</th>
                    <th className="py-2.5 px-3">Campus Location</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3">Filing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentUserItems.map((item, id) => (
                    <tr key={id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt="item" 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg border border-white/10" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-950 rounded-lg border border-white/10 flex items-center justify-center text-slate-500">
                            <FileImage className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{item.title}</td>
                      <td className="py-3 px-3 text-slate-400">{item.location}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          item.status === 'lost' ? 'bg-rose-950 text-rose-300 border border-rose-500/20' : 
                          item.status === 'found' ? 'bg-amber-950 text-amber-300 border border-amber-500/20' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500" id="empty_dashboard_inv">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">No items uploaded under your BNMIT ID.</p>
              <p className="text-xs mt-1 text-slate-600">Any items you report on campus will securely appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
