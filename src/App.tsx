import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar.js';
import LoginCard from './components/LoginCard.js';
import StatsDashboard from './components/StatsDashboard.js';
import LostItemsView from './components/LostItemsView.js';
import UploadItemForm from './components/UploadItemForm.js';
import RequestItemForm from './components/RequestItemForm.js';
import RequestedItemsView from './components/RequestedItemsView.js';
import InboxView from './components/InboxView.js';
import ClaimModal from './components/ClaimModal.js';
import { Student, Item } from './types.js';
import { Sparkles, Activity, ShieldCheck, Check } from 'lucide-react';

export default function App() {
  // Session storage synchronization
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem('bnmit_session_student');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'items' | 'upload' | 'request' | 'requested_items' | 'inbox'>('login');
  const [items, setItems] = useState<Item[]>([]);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('Syncing DB...');
  const [claimTarget, setClaimTarget] = useState<Item | null>(null);
  const [sysAlert, setSysAlert] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    if (activeStudent) {
      localStorage.setItem('bnmit_session_student', JSON.stringify(activeStudent));
      // Auto migrate from login screen once authenticated
      if (currentView === 'login') {
        setCurrentView('dashboard');
      }
    } else {
      localStorage.removeItem('bnmit_session_student');
      setCurrentView('login');
    }
  }, [activeStudent]);

  // Fetch Items from Database
  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to pull server items catalogue.');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Fetch items error:', err);
      triggerAlert('Failed to connect to data cluster. Showing cached records.', 'error');
    }
  };

  // Check backend health/config status on mount
  useEffect(() => {
    const initCheck = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setDbStatusMsg(data.database);
        }
      } catch (err) {
        console.warn('Silent healthcheck failed.', err);
      }
    };
    initCheck();
    fetchItems();

    // Constant long polling (every 7 seconds) for immediate updates
    const pollInterval = setInterval(fetchItems, 7000);
    return () => clearInterval(pollInterval);
  }, []);

  const triggerAlert = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setSysAlert({ message, type });
    setTimeout(() => {
      setSysAlert(null);
    }, 4000);
  };

  const handleSignIn = (student: Student) => {
    setActiveStudent(student);
    triggerAlert(`Signed in successfully as ${student.name}!`, 'success');
  };

  const handleSignOut = () => {
    setActiveStudent(null);
    triggerAlert('Session disconnected safely. Local states flushed.', 'info');
  };

  const handleStartPortal = () => {
    if (activeStudent) {
      setCurrentView('dashboard');
    }
  };

  const handleUploadSuccess = () => {
    fetchItems(); // Instantly update
    setCurrentView('dashboard'); // Redirect to dashboard stats
    triggerAlert('New Lost/Found reported and registered in MongoDB!', 'success');
  };

  // Claim Request Handler
  const handleOpenClaim = (item: Item) => {
    setClaimTarget(item);
  };

  const handleClaimSuccess = () => {
    setClaimTarget(null);
    fetchItems(); // Trigger instant download updates
    triggerAlert('Item claim filed successfully! Both participants tracked.', 'success');
  };

  // Card items modification - Edit
  const handleEditItem = async (id: string, updatedFields: Partial<Item>) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Server rejected edit operation.');
      }

      await fetchItems(); // Instantly update lists
      triggerAlert('Item details modified and written permanently.', 'success');
    } catch (err: any) {
      triggerAlert(err.message || 'Failed to modify card.', 'error');
    }
  };

  // Card items deletion - Delete
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this report permanently from BNMIT?')) {
      return;
    }
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Server rejected delete action.');
      }

      await fetchItems(); // Instantly update lists
      triggerAlert('Report removed permanently from cluster database.', 'success');
    } catch (err: any) {
      triggerAlert(err.message || 'Failed to remove card.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col justify-between font-sans relative text-slate-100" id="app_root">
      
      {/* Floating Animated Space Atmosphere Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation bar Header space */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeStudent={activeStudent}
        onSignOut={handleSignOut}
      />

      {/* Global Toast Alert */}
      <AnimatePresence>
        {sysAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className={`fixed top-18 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-xs font-semibold ${
              sysAlert.type === 'success' ? 'bg-slate-950 border-emerald-500/30 text-emerald-300' :
              sysAlert.type === 'error' ? 'bg-slate-950 border-rose-500/30 text-rose-300' :
              'bg-slate-950 border-indigo-500/30 text-indigo-300'
            }`}
            id="sys_toast"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping shrink-0" />
            <span>{sysAlert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport Router Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {currentView === 'login' ? (
            <motion.div
              key="login_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <LoginCard
                activeStudent={activeStudent}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                onStartPortal={handleStartPortal}
              />
            </motion.div>
          ) : currentView === 'dashboard' ? (
            <motion.div
              key="dashboard_view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <StatsDashboard
                activeStudent={activeStudent!}
                items={items}
                onNavigateToItems={() => setCurrentView('items')}
                onNavigateToUpload={() => setCurrentView('upload')}
              />
            </motion.div>
          ) : currentView === 'items' ? (
            <motion.div
              key="items_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <LostItemsView
                activeStudent={activeStudent!}
                items={items}
                onClaimItem={handleOpenClaim}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
            </motion.div>
          ) : currentView === 'upload' ? (
            <motion.div
              key="upload_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <UploadItemForm
                activeStudent={activeStudent!}
                onUploadSuccess={handleUploadSuccess}
              />
            </motion.div>
          ) : currentView === 'request' ? (
            <motion.div
              key="request_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <RequestItemForm
                activeStudent={activeStudent!}
                onRequestSuccess={() => {
                  setCurrentView('requested_items');
                  triggerAlert('New item request submitted successfully!', 'success');
                }}
              />
            </motion.div>
          ) : currentView === 'requested_items' ? (
            <motion.div
              key="requested_items_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <RequestedItemsView
                activeStudent={activeStudent!}
                onShowAlert={triggerAlert}
              />
            </motion.div>
          ) : (
            <motion.div
              key="inbox_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <InboxView
                activeStudent={activeStudent!}
                onShowAlert={triggerAlert}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Claim confirmation logic modal popup */}
      <AnimatePresence>
        {claimTarget && (
          <ClaimModal
            item={claimTarget}
            activeStudent={activeStudent!}
            onClose={() => setClaimTarget(null)}
            onClaimSuccess={handleClaimSuccess}
          />
        )}
      </AnimatePresence>

      {/* Campus footer bar */}
      <footer className="border-t border-white/5 py-4 px-4 md:px-8 bg-black/40 text-[10px] text-slate-500 font-semibold z-10 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>© {new Date().getFullYear()} BNM Institute of Technology • Lost & Found Management System</div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${dbStatusMsg.toLowerCase().includes('mongo') || dbStatusMsg.toLowerCase().includes('connected') || dbStatusMsg.toLowerCase().includes('syncing') ? 'bg-emerald-500' : 'bg-amber-400'}`}></div> 
            Server Database: {dbStatusMsg}
          </span>
          <span>Security Isolated</span>
        </div>
      </footer>

    </div>
  );
}
