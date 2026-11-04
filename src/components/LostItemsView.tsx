import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Tag, Calendar, User, Eye, CheckCircle2, Trash2, Edit3, X, AlertCircle, Sparkles, AlertTriangle, FileImage } from 'lucide-react';
import { Student, Item, ItemStatus } from '../types.js';

interface LostItemsViewProps {
  activeStudent: Student;
  items: Item[];
  onClaimItem: (item: Item) => void;
  onEditItem: (id: string, updatedFields: Partial<Item>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function LostItemsView({ activeStudent, items, onClaimItem, onEditItem, onDeleteItem }: LostItemsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Inline editing helper states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Group search categories
  const categories = ['All', 'Electronics', 'Books', 'Keys', 'College ID', 'Bags', 'Wallets', 'Personal Items', 'Others'];
  const statuses = ['All', 'lost', 'found', 'claimed'];

  // Perform reactive queries & filter checks
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStartEdit = (item: Item) => {
    if (!item._id) return;
    setEditingItemId(item._id);
    setEditTitle(item.title);
    setEditDesc(item.description);
    setEditCategory(item.category);
    setEditLocation(item.location);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editDesc.trim() || !editCategory || !editLocation.trim()) {
      return;
    }
    await onEditItem(id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      location: editLocation.trim()
    });
    setEditingItemId(null);
  };

  return (
    <div className="space-y-6" id="lost_items_view">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight animate-fade-in">
            Academic Lost & Found Database
          </h2>
          <p className="text-slate-400 text-xs">
            Search found articles or retrieve verified details of reported student property losses.
          </p>
        </div>
        <div className="text-xs bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-indigo-300 font-mono self-start md:self-center">
          Active Catalogue: {items.length} Files
        </div>
      </div>

      {/* Modern Filter Rail matching Professional Polish */}
      <div className="bg-white/[0.03] p-4 md:p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl backdrop-blur-md" id="search_filter_rail">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Search input */}
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, details or lab room..."
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            />
          </div>

          {/* 2. Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option disabled>Select Category</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat} className="bg-slate-950 text-slate-300">{cat === 'All' ? '🏥 All Categories' : cat}</option>
              ))}
            </select>
          </div>

          {/* 3. Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option disabled>Filter by Status</option>
              {statuses.map((stat, i) => (
                <option key={i} value={stat} className="bg-slate-950 text-slate-300">{stat === 'All' ? '🏷️ All States' : stat.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Item Cards */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="items_catalogue_grid">
          {filteredItems.map((item, idx) => {
            const isOwner = (item.uploadedBy?.usn || '').toUpperCase() === (activeStudent?.usn || '').toUpperCase();
            const isClaimed = item.status === 'claimed';
            const isEditing = editingItemId === item._id;

            return (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-white/[0.03] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:scale-[1.01] ${
                  isClaimed ? 'border-white/5 opacity-75' :
                  item.status === 'lost' ? 'border-white/10' : 'border-white/10'
                }`}
                id={`card_${item._id}`}
              >
                {/* Embedded status labels over images */}
                <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden">
                  <span className={`absolute top-3 right-3 z-10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider border ${
                    item.status === 'lost' ? 'bg-rose-950/90 text-rose-300 border-rose-500/20' : 
                    item.status === 'found' ? 'bg-amber-950/90 text-amber-300 border-amber-500/20' :
                    'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
                  }`}>
                    {item.status}
                  </span>

                  {/* Flag when item is uploaded by active session */}
                  {isOwner && (
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] font-mono font-bold bg-indigo-950/90 border border-indigo-500/20 text-indigo-300 rounded-md uppercase">
                      My Item
                    </span>
                  )}

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900/60 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <FileImage className="w-8 h-8 text-slate-600" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">No Image Attached</span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  // CARD IN EDIT MODE
                  <div className="p-4 space-y-3 bg-slate-900/90 z-20">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold"
                        placeholder="Edit Title"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 h-16"
                        placeholder="Edit Description"
                      />
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                      >
                        {categories.filter(c => c !== 'All').map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        placeholder="Edit Location"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => item._id && handleSaveEdit(item._id)}
                        className="px-2.5 py-1 text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 rounded cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // REGULAR CARD DETAILS VIEW
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase font-mono tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {item.location}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8 leading-normal">{item.description}</p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2 text-[11.5px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-slate-300 font-medium">{item.uploadedBy?.name || 'Unknown'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{item.uploadedBy?.branch || ''}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                        <span>USN: {item.uploadedBy?.usn || 'N/A'}</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim details overlay if already claimed */}
                {isClaimed && !isEditing && (
                  <div className="bg-emerald-950/20 border-t border-emerald-500/20 p-2.5 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    Claimed by: {item.claimedBy?.name} ({item.claimedBy?.usn})
                  </div>
                )}

                {/* Primary Card Buttons requirement: Claim, Edit, Delete */}
                {!isEditing && (
                  <div className="grid grid-cols-3 border-t border-white/5 bg-slate-900/40" id={`btns_card_${item._id}`}>
                    {/* BUTTON 1: CLAIM */}
                    <button
                      onClick={() => !isClaimed && !isOwner && onClaimItem(item)}
                      disabled={isClaimed || isOwner}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-r border-white/5 cursor-pointer hover:bg-indigo-600/10 transition-all ${
                        isClaimed ? 'text-slate-600 cursor-not-allowed opacity-50' :
                        isOwner ? 'text-slate-500 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300 font-semibold'
                      }`}
                      id={`btn_claim_${item._id}`}
                      title={isOwner ? "This is your reported item" : isClaimed ? "Item resolves claimed" : "Claim lost property"}
                    >
                      <span>Claim</span>
                    </button>

                    {/* BUTTON 2: EDIT (Only active for creator) */}
                    <button
                      onClick={() => isOwner && handleStartEdit(item)}
                      disabled={!isOwner || isClaimed}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-r border-white/5 cursor-pointer hover:bg-white/5 transition-all ${
                        isOwner && !isClaimed ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 cursor-not-allowed'
                      }`}
                      id={`btn_edit_${item._id}`}
                      title={!isOwner ? 'Requires author rights' : 'Edit details'}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {/* BUTTON 3: DELETE (Only active for creator) */}
                    <button
                      onClick={() => isOwner && item._id && onDeleteItem(item._id)}
                      disabled={!isOwner}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:bg-rose-950/20 transition-all ${
                        isOwner ? 'text-rose-400 hover:text-rose-300' : 'text-slate-600 cursor-not-allowed'
                      }`}
                      id={`btn_delete_${item._id}`}
                      title={!isOwner ? 'Requires author rights' : 'Delete permanently'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-3xl border border-white/5" id="view_empty">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-slate-300 font-semibold text-base">No Matching Items Found</h3>
          <p className="text-slate-400 text-xs mt-1">Try resetting your filter parameters or search words.</p>
        </div>
      )}
    </div>
  );
}
