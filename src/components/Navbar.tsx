import React from 'react';
import { LogOut, Home, Search, Upload, User, Sparkles, HelpCircle, ClipboardList, Inbox } from 'lucide-react';
import { Student } from '../types.js';

interface NavbarProps {
  currentView: 'login' | 'dashboard' | 'items' | 'upload' | 'request' | 'requested_items' | 'inbox';
  setCurrentView: (view: 'login' | 'dashboard' | 'items' | 'upload' | 'request' | 'requested_items' | 'inbox') => void;
  activeStudent: Student | null;
  onSignOut: () => void;
}

export default function Navbar({ currentView, setCurrentView, activeStudent, onSignOut }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 px-4 md:px-8 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding Area */}
        <div 
          onClick={() => activeStudent && setCurrentView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          id="nav_brand"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
            B
          </div>
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl leading-none tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              BNMIT <span className="text-indigo-400">Portal</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">Lost & Found Service</p>
          </div>
        </div>

        {/* Navigation Tabs (Only visible when logged in) */}
        {activeStudent && (
          <div className="flex flex-wrap items-center bg-black/40 rounded-xl p-1 border border-white/5 gap-1" id="nav_links">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_dash"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('items')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'items'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_items"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lost Items</span>
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_upload"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Report Item</span>
            </button>
            <button
              onClick={() => setCurrentView('request')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'request'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_request"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Request Item</span>
            </button>
            <button
              onClick={() => setCurrentView('requested_items')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'requested_items'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_requested_feed"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Requested Items</span>
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                currentView === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              id="btn_nav_inbox"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox</span>
            </button>
          </div>
        )}

        {/* User Session State */}
        {activeStudent ? (
          <div className="flex items-center gap-4 animate-fade-in" id="nav_session">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none font-bold">Authenticated User</span>
              <span className="text-sm font-semibold text-indigo-400 font-mono mt-0.5">{activeStudent.usn}</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/20 bg-gradient-to-br from-indigo-5050/20 to-indigo-500/10 flex items-center justify-center text-indigo-300 font-mono text-xs font-bold shadow">
              {activeStudent.branch}
            </div>
            <button
              onClick={onSignOut}
              className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold transition-all cursor-pointer"
              id="btn_nav_signout"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-xs bg-slate-950 border border-white/5 font-mono px-3 py-1.5 rounded-full text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
            Guest Session Locked
          </div>
        )}
      </div>
    </nav>
  );
}
