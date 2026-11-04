import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, HelpCircle, MapPin, Search, Calendar, User, 
  Send, AlertCircle, X, CheckSquare, RefreshCw, Mail, FileImage
} from 'lucide-react';
import { Student, RequestedItem } from '../types.js';

interface RequestedItemsViewProps {
  activeStudent: Student;
  onShowAlert: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function RequestedItemsView({ activeStudent, onShowAlert }: RequestedItemsViewProps) {
  const [requests, setRequests] = useState<RequestedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Messaging Modal State
  const [selectedRequest, setSelectedRequest] = useState<RequestedItem | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const categories = ['All', 'Electronics', 'Books', 'Keys', 'College ID', 'Bags', 'Wallets', 'Personal Items', 'Others'];

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Could not pull item requests.');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      onShowAlert('Failed to load item requests. Showing cached entries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenMessageBox = (reqItem: RequestedItem) => {
    setSelectedRequest(reqItem);
    setMessageText('');
    setModalError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setModalError('Please enter a response message.');
      return;
    }
    if (!selectedRequest) return;

    setSendingMsg(true);
    setModalError(null);
    try {
      const res = await fetch('/api/messages/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest._id || 'local_id',
          requestTitle: selectedRequest.title,
          messageText: messageText.trim(),
          sender: {
            name: activeStudent.name,
            usn: activeStudent.usn,
            email: activeStudent.email
          },
          recipientUsn: selectedRequest.requester.usn
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      onShowAlert('Message sent successfully! The original requester has been notified.', 'success');
      setSelectedRequest(null);
    } catch (err: any) {
      setModalError(err.message || 'Server error when sending message.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Filter requests based on Search terms and Category selected
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || req.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="requested_items_panel">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight">
            BNMIT Missing Requests Feed
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Browse items currently requested by fellow BNM students. If you found any of these, let them know instantly!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchRequests} 
            className="p-2 text-indigo-400 hover:text-indigo-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-xs bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-indigo-300 font-mono">
            Active Requests: {requests.length} Files
          </div>
        </div>
      </div>

      {/* Modern Filter Rail */}
      <div className="bg-white/[0.03] p-4 md:p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl backdrop-blur-md" id="search_filter_rail">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Search input */}
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requested title, description or area..."
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            />
          </div>

          {/* 2. Category selection */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option disabled>Select Category</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat} className="bg-slate-950 text-slate-300">
                  {cat === 'All' ? '🏥 All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="py-20 text-center text-slate-400" id="requests_loading">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono">Syncing item request database...</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="requests_catalogue_grid">
          {filteredRequests.map((item, idx) => {
            const isRequester = (item.requester?.usn || '').toUpperCase() === (activeStudent?.usn || '').toUpperCase();
            
            return (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:scale-[1.01]"
                id={`card_req_${item._id}`}
              >
                {/* Image Reference */}
                <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden">
                  <span className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider border bg-indigo-950/90 text-indigo-300 border-indigo-500/20">
                    REQUESTED
                  </span>

                  {/* Flag when item is uploaded by active session */}
                  {isRequester && (
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] font-mono font-bold bg-amber-950/90 border border-amber-500/20 text-amber-300 rounded-md uppercase">
                      My Request
                    </span>
                  )}

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900/60 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <FileImage className="w-8 h-8 text-slate-600" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">No Image Attached</span>
                    </div>
                  )}
                </div>

                {/* Details block */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase font-mono tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 leading-none">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.location}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8 leading-normal">{item.description}</p>
                  </div>

                  {/* Requester detail section */}
                  <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2 text-[11.5px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-300 font-medium">{item.requester?.name || 'Unknown'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{item.requester?.branch || ''}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Mail className="w-3 h-3" />
                        <span>{item.requester?.email || 'N/A'}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                      <span>USN: {item.requester?.usn || 'N/A'}</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="border-t border-white/5 bg-slate-900/40" id={`btns_card_req_${item._id}`}>
                  <button
                    disabled={isRequester}
                    onClick={() => handleOpenMessageBox(item)}
                    className={`w-full py-2.5 text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isRequester
                        ? 'text-slate-500 bg-slate-950/20 cursor-not-allowed opacity-60'
                        : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                    }`}
                    title={isRequester ? "This is your own request" : "Reply to request"}
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>I Have This Item</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl" id="requests_empty">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-medium text-base">No Matching Requests Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Either there are no active missing request uploads currently or your search term did not return any records.
          </p>
        </div>
      )}

      {/* MESSAGING RESPONDER MODAL */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Send Response Message</h3>
                    <p className="text-[10px] text-indigo-400 font-mono mt-0.5">Replying to {selectedRequest.requester.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Subject item display */}
              <div className="mb-4 p-3 bg-black/25 rounded-xl border border-white/5 flex gap-3">
                {selectedRequest.image ? (
                  <img 
                    src={selectedRequest.image} 
                    alt={selectedRequest.title} 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg border border-white/5 shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-950 rounded-lg border border-white/5 flex items-center justify-center text-slate-500 shrink-0">
                    <FileImage className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-300 uppercase truncate">{selectedRequest.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Error Box */}
              {modalError && (
                <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1.5">Your Message</label>
                  <textarea
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="E.g. I found your calculator near classroom seminar hall 3, you can meet me in CS lab or call me."
                    rows={4}
                    className="w-full bg-[#030712]/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {sendingMsg ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
