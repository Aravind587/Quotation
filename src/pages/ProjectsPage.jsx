import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Folder, Trash2, Edit3, Check, X, Copy,
  ArrowRight, Calendar, LayoutGrid, AlertTriangle,
  IndianRupee, Settings,
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import settings     from '../data/settings.json';
import tiersData    from '../data/qualityTiers.json';

const SYM = settings.currencySymbol;

function projectTotal(project) {
  let total = 0;
  (project.rooms || []).forEach(room => {
    (room.items || []).filter(i => i.enabled).forEach(item => {
      const qty = item.product?.unitType === 'per_sqft'
        ? (item.dimensions.length || 0) * (item.dimensions.width || 0)
        : item.product?.unitType === 'per_rft'
          ? (item.dimensions.length || 0)
          : (item.quantity || 1);
      total += qty * (item.tier?.ratePerUnit || 0);
    });
  });
  return total;
}

function ProjectCard({ project, onOpen, onRename, onDelete, onDuplicate }) {
  const [renaming, setRenaming] = useState(false);
  const [val,      setVal]      = useState(project.name);

  const enabledItems = (project.rooms || []).flatMap(r => r.items.filter(i => i.enabled));
  const roomsUsed    = (project.rooms || []).filter(r => r.items.some(i => i.enabled));
  const total        = projectTotal(project);
  const dateStr      = new Date(project.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

  const TIER_STYLE = {
    Economy:  'bg-stone-100  text-stone-600',
    Standard: 'bg-blue-100   text-blue-700',
    Premium:  'bg-purple-100 text-purple-700',
    Luxury:   'bg-amber-100  text-amber-700',
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-brand-300 transition-all duration-200">
      {/* top accent */}
      <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600"/>

      <div className="p-5">
        {/* title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {renaming ? (
            <div className="flex items-center gap-2 flex-1">
              <input autoFocus className="input-field text-sm flex-1"
                value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && val.trim()) { onRename(val.trim()); setRenaming(false); }
                  if (e.key === 'Escape') { setRenaming(false); setVal(project.name); }
                }}/>
              <button onClick={() => { if(val.trim()) { onRename(val.trim()); setRenaming(false); }}}
                className="p-1.5 rounded-lg bg-brand-500 text-white"><Check size={12}/></button>
              <button onClick={() => { setRenaming(false); setVal(project.name); }}
                className="p-1.5 rounded-lg bg-stone-100 text-stone-500"><X size={12}/></button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-stone-800 text-lg leading-tight truncate">{project.name}</h3>
              {project.customer?.name && (
                <p className="text-xs text-stone-400 mt-0.5">{project.customer.name}</p>
              )}
            </div>
          )}
          {!renaming && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setRenaming(true)} title="Rename"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"><Edit3 size={13}/></button>
              <button onClick={onDuplicate} title="Duplicate"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"><Copy size={13}/></button>
              <button onClick={onDelete} title="Delete"
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={13}/></button>
            </div>
          )}
        </div>

        {/* tier badge */}
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${TIER_STYLE[project.globalTier] || TIER_STYLE.Standard}`}>
          {project.globalTier || 'Standard'}
        </span>

        {/* stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Rooms',  val: roomsUsed.length  },
            { label: 'Items',  val: enabledItems.length },
            { label: 'Total',  val: total > 0 ? `${SYM}${Math.round(total).toLocaleString('en-IN')}` : '—' },
          ].map(({ label, val: v }) => (
            <div key={label} className="bg-stone-50 rounded-xl p-2 text-center">
              <p className="font-bold text-stone-800 text-sm leading-tight">{v}</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* date */}
        <p className="text-xs text-stone-400 flex items-center gap-1 mb-4">
          <Calendar size={10}/> {dateStr}
        </p>

        {/* open */}
        <button onClick={onOpen}
          className="w-full btn-primary justify-center py-2.5 text-sm">
          Open Builder <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate         = useNavigate();
  const projects         = useCartStore(s => s.projects);
  const addProject       = useCartStore(s => s.addProject);
  const removeProject    = useCartStore(s => s.removeProject);
  const renameProject    = useCartStore(s => s.renameProject);
  const duplicateProject = useCartStore(s => s.duplicateProject);
  const setActiveProject = useCartStore(s => s.setActiveProject);

  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState('');
  const [deleteId,  setDeleteId]  = useState(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    addProject(newName.trim());
    setNewName('');
    setCreating(false);
    navigate('/builder');
  };

  const handleOpen = (id) => {
    setActiveProject(id);
    navigate('/builder');
  };

  return (
    <div className="min-h-screen bg-[#f9f6f0]">
      {/* ── Top nav (matches Interix style) ── */}
      <header className="bg-white border-b border-stone-200 h-12 flex items-center px-6 gap-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">IQ</span>
          </div>
          <div className="leading-none">
            <p className="font-display font-bold text-stone-800 text-sm">{settings.companyName}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          <span className="px-3 py-1.5 text-sm font-semibold text-brand-600 bg-brand-50 rounded-lg">Projects</span>
          <button onClick={() => navigate('/settings')}
            className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 rounded-lg flex items-center gap-1">
            <Settings size={11}/> Settings
          </button>
        </nav>
        <button onClick={() => { setCreating(true); setTimeout(() => document.getElementById('npi')?.focus(), 50); }}
          className="btn-primary text-sm py-2">
          <Plus size={14}/> New Project
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-800 mb-1">Projects</h1>
            <p className="text-stone-500 text-sm">Create a project for each client or property.</p>
          </div>
        </div>

        {/* new project input */}
        {creating && (
          <div className="bg-white border-2 border-brand-300 rounded-2xl p-5 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-stone-700 mb-3">Project name</p>
            <div className="flex gap-3">
              <input id="npi" className="input-field flex-1"
                placeholder="e.g. Whitefield Villa, Mr Sharma Apartment…"
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') handleCreate(); if(e.key==='Escape'){setCreating(false);setNewName('');} }}/>
              <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary disabled:opacity-50"><Check size={14}/> Create</button>
              <button onClick={() => {setCreating(false);setNewName('');}} className="btn-ghost text-stone-500"><X size={14}/></button>
            </div>
          </div>
        )}

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p}
              onOpen={()   => handleOpen(p.id)}
              onRename={n  => renameProject(p.id, n)}
              onDelete={()  => setDeleteId(p.id)}
              onDuplicate={() => { duplicateProject(p.id); }}
            />
          ))}
          <button onClick={() => setCreating(true)}
            className="border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-2
                       text-stone-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all min-h-[200px]">
            <Plus size={28}/>
            <span className="text-sm font-semibold">New Project</span>
          </button>
        </div>
      </main>

      {/* delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500"/>
              </div>
              <div>
                <p className="font-bold text-stone-800">Delete project?</p>
                <p className="text-xs text-stone-400">"{projects.find(p=>p.id===deleteId)?.name}" will be removed permanently.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-ghost justify-center border border-stone-200">Cancel</button>
              <button onClick={() => { removeProject(deleteId); setDeleteId(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">
                <Trash2 size={13}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
