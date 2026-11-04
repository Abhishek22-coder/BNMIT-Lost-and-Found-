import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Inbox, MessageSquare, User, Mail, Calendar, RefreshCw, Layers } from 'lucide-react';
import { Student, RequestMessage } from '../types.js';

interface InboxViewProps {
  activeStudent: Student;
  onShowAlert: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function InboxView({ activeStudent, onShowAlert }: InboxViewProps) {
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${activeStudent.usn}`);
      if (!res.ok) throw new Error('Failed to retrieve inbox messages.');
      const data = await res.json();
      setMessages(data);
    } catch (err: any) {
      onShowAlert('Failed to load inbox messages. Try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeStudent]);

  return (
    <div className="space-y-6 animate-fade-in" id="inbox_panel">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-400" />
            <span>My Response Inbox</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Private responses from other students regarding your requested missing items are delivered securely here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchMessages} 
            className="p-2 text-indigo-400 hover:text-indigo-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="text-xs bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-indigo-300 font-mono">
            Messages: {messages.length} Total
          </div>
        </div>
      </div>

      {/* Loading Block */}
      {loading ? (
        <div className="py-20 text-center text-slate-400" id="inbox_loading">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono">Syncing private response inbox...</p>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4" id="inbox_messages_container">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg._id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:border-white/20 transition-all"
              id={`inbox_msg_${msg._id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 select-none animate-pulse"></div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">
                    Topic: {msg.requestTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(msg.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="py-4">
                <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">{msg.messageText}</p>
              </div>

              {/* Sender info card */}
              <div className="bg-black/35 rounded-xl p-3 border border-white/5 flex flex-wrap gap-x-6 gap-y-2 items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-sans">
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-slate-300 font-semibold">From: {msg.sender.name}</span>
                </span>
                <span className="font-mono text-slate-500">USN: <span className="text-indigo-300 uppercase">{msg.sender.usn}</span></span>
                <span className="flex items-center gap-1.5 font-mono text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>{msg.sender.email}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl" id="inbox_empty">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-medium text-base">Your Inbox is Empty</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            When another student reports that they have found or spotted one of your requested items, their responses will viewably land here.
          </p>
        </div>
      )}
    </div>
  );
}
