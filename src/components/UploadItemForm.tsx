import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, CheckCircle2, AlertCircle, FileImage, Loader2, Sparkles, MapPin, Tag } from 'lucide-react';
import { Student } from '../types.js';

interface UploadItemFormProps {
  activeStudent: Student;
  onUploadSuccess: () => void;
}

export default function UploadItemForm({ activeStudent, onUploadSuccess }: UploadItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'lost' | 'found'>('lost');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  // Drag and Drop & State
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Electronics', 'Books', 'Keys', 'College ID', 'Bags', 'Wallets', 'Personal Items', 'Others'];

  // Convert File to Base64
  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Only image formats (PNG, JPG, JPEG) are permitted.');
      return;
    }

    // Limit image size to ~10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image files must be under 10MB to transfer successfully.');
      return;
    }

    // Animate Progress Bar
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = (e) => {
      setBase64Image(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) return setErrorMsg('Item title is required.');
    if (!description.trim()) return setErrorMsg('Item description is required.');
    if (!location.trim()) return setErrorMsg('Misplaced location details are required.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/items/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
          image: base64Image,
          status,
          uploadedBy: {
            name: activeStudent.name,
            usn: activeStudent.usn,
            email: activeStudent.email,
            branch: activeStudent.branch
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reports.');
      }

      setFormSuccess(true);
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Server error encountered during upload.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4" id="upload_form_container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-4">
          <UploadCloud className="w-6 h-6 text-indigo-400" />
          <div>
            <h3 className="text-lg font-display font-semibold text-white tracking-tight">Report Lost / Found Assets</h3>
            <p className="text-xs text-slate-400">Fill in coordinates and attach snaps; changes reflect in catalogues down real-time.</p>
          </div>
        </div>

        {formSuccess ? (
          <div className="py-12 text-center" id="upload_success">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-display font-medium text-emerald-400">Item Reported Successfully!</h3>
            <p className="text-slate-400 text-sm mt-1">Database registers synchronized. Fetching updated logs...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" id="asset_upload_form">
            {errorMsg && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type selector: Lost vs Found */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Report Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('lost')}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      status === 'lost'
                        ? 'bg-rose-950/40 text-rose-400 border-rose-500/40 shadow-inner'
                        : 'bg-slate-900/60 text-slate-500 border-white/5 hover:text-slate-400'
                    }`}
                  >
                    🔍 Lost Article
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('found')}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      status === 'found'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-inner'
                        : 'bg-slate-900/60 text-slate-500 border-white/5 hover:text-slate-400'
                    }`}
                  >
                    🤝 Found Article
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Category Group</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat} className="bg-slate-950 text-slate-300">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Report Title / Name of Asset</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Blue Nike Water Bottle / Apple iPad Air Pro"
                className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Campus Location */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Misplaced Area / Found Location inside BNMIT</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g. Computer Lab 3, 2nd Floor Auden block / Seminar Hall 2"
                  className="w-full bg-slate-900/80 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Detailed Characteristics / Identifying Features</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. It contains a BNMIT sticker on the rear cover, black leather protective sleeve, some keys inside the carry handle pocket..."
                className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* INTERACTIVE DRAG & DROP FILE UPLOADER */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 font-mono font-semibold">Snap/Image Upload Preview (Optional)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-500/10'
                    : base64Image
                    ? 'border-emerald-500/30 bg-slate-900/20'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                }`}
                id="drop_zone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {base64Image ? (
                  <div className="space-y-3 relative w-full flex flex-col items-center justify-center">
                    <img
                      src={base64Image}
                      alt="Uploader snapshot preview"
                      referrerPolicy="no-referrer"
                      className="max-h-28 object-contain rounded-lg border border-white/10 shadow"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Image attached successfully</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBase64Image(null);
                        setUploadProgress(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-1 px-3 py-1 text-[10px] text-rose-300 font-bold bg-rose-950/50 border border-rose-500/30 hover:bg-rose-900 rounded-lg transition-all"
                    >
                      ✕ Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">Drag and drop file here, or click to browse</p>
                    <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG under 10MB</p>
                  </div>
                )}
              </div>

              {/* Progress upload bar animation fallback */}
              {uploadProgress !== null && (
                <div className="mt-3.5" id="upload_progress_bar">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Converting details Base64 stream...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-full transition-all duration-250"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-5050/90 text-white hover:bg-indigo-500 transition-all duration-150 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn_submit_report"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synchronizing Server Registers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>File Lost/Found Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
