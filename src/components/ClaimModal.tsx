import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, GraduationCap, Building2, Calendar, AlertTriangle, CheckCircle2, Loader2, X, ShieldAlert, FileImage } from 'lucide-react';
import { Student, Item } from '../types.js';

interface ClaimModalProps {
  item: Item | null;
  activeStudent: Student;
  onClose: () => void;
  onClaimSuccess: () => void;
}

export default function ClaimModal({ item, activeStudent, onClose, onClaimSuccess }: ClaimModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!item) return null;

  const handleConfirmClaim = async () => {
    if (!item._id) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/items/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item._id,
          claimedBy: {
            name: activeStudent.name,
            usn: activeStudent.usn,
            email: activeStudent.email,
            branch: activeStudent.branch
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to file claim history statement.');
      }

      setSuccess(true);
      setTimeout(() => {
        onClaimSuccess();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred during verification of claims.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" id="claim_modal_overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative border border-white/10"
        id="claim_modal_box"
      >
        {/* Close Button top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 border border-white/5 p-1.5 rounded-full hover:bg-slate-800 transition"
          id="btn_claim_modal_close"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="py-8 text-center" id="claim_success_panel">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-display font-semibold text-emerald-400">Claim Confirmed Successfully!</h3>
            <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
              The status has changed to <strong className="text-emerald-300 uppercase">Claimed</strong>. An email notification reference has been logged.
            </p>
          </div>
        ) : (
          <div className="space-y-6" id="claim_form_content">
            {/* Header branding */}
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Asset Protection Verification
              </div>
              <h3 className="text-lg font-display font-semibold text-white tracking-tight">Confirm Item Claim Request</h3>
              <p className="text-xs text-slate-400 mt-0.5">Please review the details of the student who originally reported this asset.</p>
            </div>

            {/* Target Item summary */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-md border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-950 rounded-md border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                  <FileImage className="w-5 h-5 text-slate-600" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-indigo-400">{item.category}</span>
                <h4 className="text-white text-xs font-semibold truncate leading-none mt-0.5">{item.title}</h4>
                <p className="text-[10.5px] font-mono text-slate-500 truncate mt-0.5">Reported from: {item.location}</p>
              </div>
            </div>

            {/* STRICT REQUIREMENT: "Uploaded By: Student Name, USN, BNMIT Email, Branch" */}
            <div className="space-y-3.5 bg-slate-900/40 p-5 rounded-2xl border border-blue-500/10" id="uploader_info_block">
              <span className="text-[10px] font-semibold text-slate-400 font-mono tracking-widest uppercase block border-b border-white/5 pb-2">
                📂 ORIGINAL REPORT FILED BY:
              </span>

              <div className="space-y-3.5 text-xs text-slate-200">
                {/* 1. Student Name */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Uploader Student Name</span>
                    <span className="font-semibold text-slate-200 text-sm">{item.uploadedBy?.name || 'Registered Student'}</span>
                  </div>
                </div>

                {/* 2. USN */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">University USN</span>
                    <span className="font-mono text-slate-200 uppercase font-semibold">{item.uploadedBy?.usn || 'N/A'}</span>
                  </div>
                </div>

                {/* 3. BNMIT Email */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">BNMIT Domain Email</span>
                    <span className="font-mono text-slate-200 truncate font-semibold block">{item.uploadedBy?.email || 'N/A'}</span>
                  </div>
                </div>

                {/* 4. Branch */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Academic Branch</span>
                    <span className="font-semibold text-slate-200">{item.uploadedBy?.branch || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Double Check Statement */}
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 font-sans tracking-wide leading-normal">
              ⚠️ <strong>Disclaimer:</strong> Claiming an item indicates you are either the authorized owner or have physical authority from the owner. False claiming of college property is subject to disciplinary check.
            </div>

            {/* Confirm Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 transition cursor-pointer"
                id="btn_claim_cancel"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn_claim_confirm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Claim...</span>
                  </>
                ) : (
                  <span>Confirm Claim</span>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
