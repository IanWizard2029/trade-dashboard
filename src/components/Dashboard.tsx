'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Plus, TrendingUp, CalendarDays, Target, Lightbulb, Pencil, X,
  Package, Image as ImageIcon, Eye, Trash2, FolderOpen, CheckCircle2,
  FolderPlus, Paperclip
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// -------------------- Local storage helpers --------------------
function loadJSON(key: string, fallback: any) {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, value: any) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

// -------------------- Import helpers --------------------
export function parseTasksImport(input: any) {
  const text = String(input || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
    return parsed.map((t) => ({
      id: t.id ?? Date.now() + Math.random(),
      text: String(t.text ?? '').trim(),
      completed: !!t.completed,
    })).filter((t) => t.text.length > 0);
  }
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => ({ id: Date.now() + Math.random(), text: line, completed: false }));
}

// Tiny self-tests (dev console only)
(function runSelfTests() {
  try {
    const a = parseTasksImport('A\nB');
    console.assert(Array.isArray(a) && a.length === 2 && a[0].text === 'A' && a[1].text === 'B', 'NL import failed');
    const b = parseTasksImport('[{"text":"X","completed":true}]');
    console.assert(b.length === 1 && b[0].text === 'X' && b[0].completed === true, 'JSON import failed');
  } catch (e) { console.warn('Self-tests failed:', e); }
})();

// -------------------- Release helpers --------------------
function normalizeSku(s: any) {
  return {
    id: s.id ?? Date.now() + Math.random(),
    code: String(s.code || '').trim(),
    name: String(s.name || '').trim(),
    price: String(s.price || '').trim(),
  };
}
function normalizeRelease(r: any) {
  const legacySku = (r.sku ?? '').toString().trim();
  const legacyPrice = (r.price ?? '').toString().trim();
  const skus = Array.isArray(r.skus) ? r.skus.map(normalizeSku) : [];
  if (!skus.length && (legacySku || legacyPrice)) {
    skus.push(normalizeSku({ code: legacySku, name: r.title || 'Base SKU', price: legacyPrice }));
  }
  return {
    id: r.id ?? Date.now() + Math.random(),
    title: String(r.title || '').trim(),
    codeName: String(r.codeName || '').trim(),
    preorderDate: String(r.preorderDate || ''),
    earlyAccessDate: String(r.earlyAccessDate || ''),
    releaseDate: String(r.releaseDate || ''),
    keyArt: String(r.keyArt || ''),
    notes: String(r.notes || ''),
    skus,
  };
}
(function releaseTests(){
  const r = normalizeRelease({ title:'Set Alpha', sku:'WOC-001', price:49.99 });
  console.assert(r.skus.length===1 && r.skus[0].code==='WOC-001' && r.skus[0].price==='49.99', 'normalizeRelease migration failed');
  const r2 = normalizeRelease({ title:'Beta', skus:[{code:'WOC-002', name:'Booster', price:'3.99'}]});
  console.assert(r2.skus.length===1 && r2.skus[0].name==='Booster', 'normalizeRelease (array) failed');
})();

// -------------------- Projects helpers --------------------
function normalizeProject(p: any){
  return {
    id: p.id ?? Date.now() + Math.random(),
    title: String(p.title || '').trim(),
    notes: String(p.notes || ''),
    files: Array.isArray(p.files) ? p.files.map((f:any)=>({
      id: f.id ?? Date.now() + Math.random(),
      name: String(f.name||'file'),
      url: String(f.url||''),
      size: Number(f.size||0)
    })) : [],
    expanded: !!p.expanded,
  };
}
(function projectTests(){
  const p = normalizeProject({ title:'Sell-in Kit', files:[{name:'brief.pdf', url:'data:pdf', size:10}]});
  console.assert(p.title==='Sell-in Kit' && p.files.length===1 && !!p.files[0].id, 'normalizeProject failed');
})();

// -------------------- Supabase (single-row JSON) --------------------
async function fetchAppState(){
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', 1)
    .single();
  if (error) console.warn('fetchAppState error', error);
  return (data?.data ?? {}) as any;
}
async function saveAppState(state: any){
  const { error } = await supabase
    .from('app_state')
    .upsert({ id: 1, data: state });
  if (error) console.error('saveAppState error', error);
}
function useDebouncedSave<T>(value: T, delay: number, fn: (v: T)=>void){
  useEffect(()=>{ const id = setTimeout(()=>fn(value), delay); return ()=>clearTimeout(id) }, [value, delay, fn]);
}

// -------------------- Component --------------------
export default function Dashboard() {
  // State
  const [tasks, setTasks] = useState(() => loadJSON('tradeMarketingTasks', [
    { id: 1, text: "Prepare Magic: The Gathering product display", completed: false },
    { id: 2, text: "Coordinate with retail partners for new release", completed: false },
    { id: 3, text: "Review trade marketing budget for Q4", completed: true },
  ]));
  const [ideas, setIdeas] = useState(() => loadJSON('tradeMarketingIdeas', []));
  const [releases, setReleases] = useState(() => loadJSON('tradeMarketingReleases', [
    normalizeRelease({
      title: 'Project SPARK — Starter Set',
      codeName: 'SPARK',
      sku: 'WOC-DND-1001',
      preorderDate: '',
      earlyAccessDate: '',
      releaseDate: '',
      price: '49.99',
      keyArt: '',
      notes: 'Starter set for new players; prioritize mass retail endcaps.'
    })
  ]));
  const [archive, setArchive] = useState(() => loadJSON('tradeMarketingTaskArchive', []));
  const [showArchive, setShowArchive] = useState(false);
  const [projects, setProjects] = useState(() => loadJSON('tradeMarketingProjects', []));

  const [newTask, setNewTask] = useState("");
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaNotes, setNewIdeaNotes] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const placeholderNews = [
    { title: "Wizards Announces New D&D Expansion", link: "#", pubDate: new Date().toISOString(), source: "placeholder" },
    { title: "Top 10 D&D Campaign Settings Ranked", link: "#", pubDate: new Date().toISOString(), source: "placeholder" },
    { title: "D&D Movie Sequel Rumors Surface", link: "#", pubDate: new Date().toISOString(), source: "placeholder" }
  ];
  const [news, setNews] = useState(placeholderNews);
  const [newsIdx, setNewsIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const [editingId, setEditingId] = useState<number|null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [releaseModalId, setReleaseModalId] = useState<number|null>(null);
  const [editRelease, setEditRelease] = useState(normalizeRelease({}));
  const [isEditingRelease, setIsEditingRelease] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [draftRelease, setDraftRelease] = useState(normalizeRelease({}));
  const [draftSku, setDraftSku] = useState(normalizeSku({}));

  // Persist to localStorage (keeps offline behavior)
  useEffect(() => saveJSON('tradeMarketingTasks', tasks), [tasks]);
  useEffect(() => saveJSON('tradeMarketingIdeas', ideas), [ideas]);
  useEffect(() => saveJSON('tradeMarketingReleases', releases), [releases]);
  useEffect(() => saveJSON('tradeMarketingTaskArchive', archive), [archive]);
  useEffect(() => saveJSON('tradeMarketingProjects', projects), [projects]);

  // Auto-rotate news
  useEffect(() => {
    if (paused || news.length === 0) return;
    const id = setInterval(() => setNewsIdx((i) => (i + 1) % news.length), 6000);
    return () => clearInterval(id);
  }, [paused, news]);

  // --------- NEW: Hydrate from Supabase on mount (single row id=1)
  useEffect(()=>{
    (async ()=>{
      try {
        const s = await fetchAppState();
        if (s.tasks) setTasks(s.tasks);
        if (s.ideas) setIdeas(s.ideas);
        if (s.releases) setReleases(s.releases);
        if (s.archive) setArchive(s.archive);
        if (s.projects) setProjects(s.projects);
      } catch (e) {
        console.warn('Using local cache only', e);
      }
    })();
  },[]);

  // Handlers — Tasks
  const addTask = () => {
    const value = newTask.trim();
    if (!value) return;
    setTasks((prev: any[]) => [...prev, { id: Date.now(), text: value, completed: false }]);
    setNewTask("");
  };
  const toggleTask = (id: number) =>
    setTasks((prev: any[]) => prev.map((task: any) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  const removeTask = (id: number) =>
    setTasks((prev: any[]) => prev.filter((t: any) => t.id !== id));
  const completeTask = (id: number) => {
    setTasks((prev: any[]) => {
      const t = prev.find((x:any)=>x.id===id);
      const rest = prev.filter((x:any)=>x.id!==id);
      if (t) setArchive((a:any)=>[{...t, completed:true, archivedAt:new Date().toISOString()}, ...a]);
      return rest;
    });
  };
  const convertTaskToProject = (id: number) => {
    setTasks((prev: any[]) => {
      const t = prev.find((x:any)=>x.id===id);
      const rest = prev.filter((x:any)=>x.id!==id);
      if (t) setProjects((p:any)=> [normalizeProject({ title:t.text }), ...p]);
      return rest;
    });
  };
  const importTasks = () => {
    try {
      const parsed = parseTasksImport(importText);
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      setTasks((prev:any[]) => [...prev, ...parsed]);
      setImportOpen(false);
      setImportText("");
    } catch (e) {
      alert('Could not import tasks. Paste a JSON array or newline-separated list.');
      console.warn(e);
    }
  };
  const exportTasks = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradeMarketingTasks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handlers — Ideas
  const addIdea = () => {
    const title = newIdeaTitle.trim();
    const notes = newIdeaNotes.trim();
    if (!title) return;
    setIdeas((prev:any[]) => [...prev, { id: Date.now(), title, notes }]);
    setNewIdeaTitle("");
    setNewIdeaNotes("");
  };
  const removeIdea = (id: number) =>
    setIdeas((prev:any[]) => prev.filter((i:any) => i.id !== id));
  const openEdit = (idea: any) => { setEditingId(idea.id); setEditTitle(idea.title); setEditNotes(idea.notes || ""); };
  const saveEdit = () => {
    if (editingId==null) return;
    setIdeas((prev:any[])=>prev.map((i:any)=>i.id===editingId?{...i,title:editTitle.trim()||i.title,notes:editNotes}:i));
    setEditingId(null);
  };

  // Handlers — Releases
  const openRelease = (id: number) => {
    const r = releases.find((x:any) => x.id === id);
    if (!r) return;
    setReleaseModalId(id);
    setEditRelease({ ...r });
    setIsEditingRelease(false);
  };
  const closeRelease = () => { setReleaseModalId(null); setIsEditingRelease(false); };
  const saveRelease = () => {
    setReleases((prev:any[]) => prev.map((r:any) => (r.id === editRelease.id ? normalizeRelease(editRelease) : r)));
    setIsEditingRelease(false);
  };
  const deleteRelease = (id: number) =>
    setReleases((prev:any[]) => prev.filter((r:any) => r.id !== id));
  const onDraftChange = (field: string, value: any) =>
    setDraftRelease((d:any) => ({ ...d, [field]: value }));
  const addDraftSku = () => {
    if (!draftSku.code && !draftSku.name) return;
    setDraftRelease((d:any)=> ({...d, skus:[...d.skus, normalizeSku(draftSku)]}));
    setDraftSku(normalizeSku({}));
  };
  const addRelease = () => {
    const n = normalizeRelease(draftRelease);
    if (!n.title) return alert('Please add a title');
    setReleases((prev:any[]) => [n, ...prev]);
    setDraftRelease(normalizeRelease({}));
    setDraftSku(normalizeSku({}));
    setAddOpen(false);
  };

  // File readers
  const readImageAsDataUrl = (file: File|undefined|null, cb:(url:string)=>void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result));
    reader.readAsDataURL(file);
  };
  const readFilesAsDataUrls = (fileList: FileList|null|undefined, cb:(files:any[])=>void) => {
    if (!fileList || fileList.length===0) return;
    const arr = Array.from(fileList);
    let done = 0; const out:any[] = [];
    arr.forEach((file)=>{
      const reader = new FileReader();
      reader.onload = () => { out.push({ id: Date.now()+Math.random(), name: file.name, url: String(reader.result), size: file.size }); done++; if(done===arr.length) cb(out); };
      reader.readAsDataURL(file);
    });
  };

  const current = news[newsIdx];

  // --------- NEW: Debounced save to Supabase whenever state changes
  useDebouncedSave({ tasks, ideas, releases, archive, projects }, 600, saveAppState);

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks */}
        <Card className="col-span-2 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">Tasks</h2>
              <div className="flex gap-2">
                <Button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" onClick={() => setImportOpen(true)}>Import</Button>
                <Button className="bg-zinc-100 text-zinc-900 hover:bg-white" onClick={exportTasks}>Export</Button>
              </div>
            </div>
            <div className="flex gap-2 mb-5">
              <Input
                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                placeholder="Add a new task…"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <Button
                onClick={addTask}
                disabled={!newTask.trim()}
                className="bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-1"/> Add
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-900">
                  {/* NOTE: our Checkbox shim uses onChange (not onCheckedChange) */}
                  <Checkbox className="border-zinc-600" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  <span className={task.completed ? "line-through text-zinc-500" : "text-zinc-100"}>{task.text}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => completeTask(task.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1"/> Done
                    </Button>
                    <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => convertTaskToProject(task.id)}>
                      <FolderPlus className="w-4 h-4 mr-1"/> Project
                    </Button>
                    <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => removeTask(task.id)}>
                      <X className="w-4 h-4"/>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {importOpen && (
              <div className="mt-5 p-4 border border-zinc-800 rounded-xl bg-zinc-900/60">
                <p className="text-sm mb-2 text-zinc-400">Paste tasks as JSON or a newline-separated list.</p>
                <textarea className="w-full h-32 p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100" value={importText} onChange={(e) => setImportText(e.target.value)} />
                <div className="flex justify-end gap-2 mt-3">
                  <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-200" onClick={importTasks}>Import</Button>
                </div>
              </div>
            )}

            {/* Archive toggle */}
            <div className="mt-6">
              <Button className="text-zinc-400 hover:text-zinc-100" onClick={()=>setShowArchive(v=>!v)}>
                <FolderOpen className="w-4 h-4 mr-2"/>{showArchive? 'Hide':'Show'} Archived ({archive.length})
              </Button>
              {showArchive && (
                <div className="mt-3 space-y-2">
                  {archive.length===0 && <div className="text-sm text-zinc-500">No archived tasks yet.</div>}
                  {archive.map((a:any)=> (
                    <div key={a.id} className="flex items-center gap-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-zinc-400"/>
                      <div className="text-sm text-zinc-400 line-through">{a.text}</div>
                      <div className="ml-auto text-xs text-zinc-500">{new Date(a.archivedAt||Date.now()).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Ideas */}
          <Card className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-zinc-100"/>
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-50">Ideas</h3>
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500" placeholder="Idea title…" value={newIdeaTitle} onChange={(e) => setNewIdeaTitle(e.target.value)} />
                <textarea placeholder="Supporting notes…" className="p-3 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" value={newIdeaNotes} onChange={(e) => setNewIdeaNotes(e.target.value)} />
                <Button onClick={addIdea} disabled={!newIdeaTitle.trim()} className="w-fit bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-4 h-4 mr-1"/> Add Idea</Button>
              </div>
              <div className="space-y-3">
                {ideas.length === 0 && (<div className="text-sm text-zinc-500">No ideas yet. Add your first concept above.</div>)}
                {ideas.map((idea: any) => (
                  <motion.div key={idea.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-zinc-50">{idea.title}</div>
                        <div className="text-sm text-zinc-400 whitespace-pre-line line-clamp-3">{idea.notes}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => openEdit(idea)}><Pencil className="w-4 h-4"/></Button>
                        <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => removeIdea(idea.id)}><X className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Releases */}
          <Card className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5"/>
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-50">Key Releases</h3>
                </div>
                <Button className="bg-white text-zinc-900 hover:bg-zinc-200" onClick={() => setAddOpen((v)=>!v)}>{addOpen ? 'Close' : 'Add Release'}</Button>
              </div>

              {addOpen && (
                <div className="mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-900/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input className="bg-zinc-900 border-zinc-800" placeholder="Title" value={draftRelease.title} onChange={(e)=>onDraftChange('title', e.target.value)} />
                    <Input className="bg-zinc-900 border-zinc-800" placeholder="Code name" value={draftRelease.codeName} onChange={(e)=>onDraftChange('codeName', e.target.value)} />
                    <Input type="date" className="bg-zinc-900 border-zinc-800" placeholder="Preorder Date" value={draftRelease.preorderDate} onChange={(e)=>onDraftChange('preorderDate', e.target.value)} />
                    <Input type="date" className="bg-zinc-900 border-zinc-800" placeholder="Early Access Date" value={draftRelease.earlyAccessDate} onChange={(e)=>onDraftChange('earlyAccessDate', e.target.value)} />
                    <Input type="date" className="bg-zinc-900 border-zinc-800" placeholder="Release Date" value={draftRelease.releaseDate} onChange={(e)=>onDraftChange('releaseDate', e.target.value)} />
                    <Input className="bg-zinc-900 border-zinc-800" placeholder="Key art URL (optional)" value={draftRelease.keyArt} onChange={(e)=>onDraftChange('keyArt', e.target.value)} />
                  </div>
                  <div className="mt-3 p-3 border border-zinc-800 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Add first SKU (optional)</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input className="bg-zinc-900 border-zinc-800" placeholder="SKU code" value={draftSku.code} onChange={(e)=>setDraftSku((s:any)=>({...s,code:e.target.value}))} />
                      <Input className="bg-zinc-900 border-zinc-800" placeholder="Name / description" value={draftSku.name} onChange={(e)=>setDraftSku((s:any)=>({...s,name:e.target.value}))} />
                      <Input className="bg-zinc-900 border-zinc-800" placeholder="Price" value={draftSku.price} onChange={(e)=>setDraftSku((s:any)=>({...s,price:e.target.value}))} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={addDraftSku}><Plus className="w-4 h-4 mr-1"/> Add SKU</Button>
                      <label className="ml-auto text-xs text-zinc-400 flex items-center gap-2 cursor-pointer">
                        <ImageIcon className="w-4 h-4"/>
                        <span>Upload key art</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e)=> readImageAsDataUrl(e.target.files?.[0], (url)=> onDraftChange('keyArt', url))} />
                      </label>
                      <Button className="bg-white text-zinc-900 hover:bg-zinc-200 ml-auto" onClick={addRelease}>Save Release</Button>
                    </div>
                    {draftRelease.skus.length>0 && (
                      <div className="mt-2 text-xs text-zinc-400">Queued SKUs: {draftRelease.skus.map((s:any)=>s.code||s.name).filter(Boolean).join(', ')}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-zinc-400">
                    <tr className="text-left">
                      <th className="py-2 pr-3 font-medium">Art</th>
                      <th className="py-2 pr-3 font-medium">Code Name</th>
                      <th className="py-2 pr-3 font-medium">Pre-Order</th>
                      <th className="py-2 pr-3 font-medium">Early Access</th>
                      <th className="py-2 pr-3 font-medium">Release</th>
                      <th className="py-2 pl-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-zinc-500">No releases yet. Click "Add Release" to start.</td></tr>
                    )}
                    {releases.map((r: any) => (
                      <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                        <td className="py-2 pr-3">
                          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                            {r.keyArt ? (<img src={r.keyArt} alt="art" className="w-full h-full object-cover"/>) : (<ImageIcon className="w-4 h-4 text-zinc-600"/>) }
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-zinc-100">{r.codeName || r.title || '—'}</td>
                        <td className="py-2 pr-3 text-zinc-300">{r.preorderDate || '—'}</td>
                        <td className="py-2 pr-3 text-zinc-300">{r.earlyAccessDate || '—'}</td>
                        <td className="py-2 pr-3 text-zinc-300">{r.releaseDate || '—'}</td>
                        <td className="py-2 pl-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button className="text-zinc-300 hover:text-zinc-100" onClick={()=>openRelease(r.id)}><Eye className="w-4 h-4 mr-1"/>Open</Button>
                            <Button className="text-zinc-300 hover:text-red-300" onClick={()=>deleteRelease(r.id)}><Trash2 className="w-4 h-4 mr-1"/>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* News */}
          <Card className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-zinc-800"/>
                  <h3 className="text-base font-semibold tracking-tight text-zinc-50">D&D News</h3>
                  <span className="text-xs text-zinc-500">auto‑rotates</span>
                </div>
                <div className="flex gap-2">
                  <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => setNewsIdx((i)=> (i-1+news.length)%news.length)}>Prev</Button>
                  <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => setPaused((p)=>!p)}>{paused ? 'Play' : 'Pause'}</Button>
                  <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => setNewsIdx((i)=> (i+1)%news.length)}>Next</Button>
                </div>
              </div>
              {current ? (
                <motion.a key={current.link+newsIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} href={current.link} target="_blank" rel="noreferrer" className="block p-6 hover:bg-zinc-900">
                  <div className="text-xs text-zinc-500 mb-1">{new Date(current.pubDate).toLocaleString()}</div>
                  <div className="text-sm font-medium leading-snug text-zinc-100">{current.title}</div>
                  <div className="text-xs text-zinc-500 mt-1">Source: {current.source}</div>
                </motion.a>
              ) : (
                <div className="p-6 text-sm text-zinc-500">No news available.</div>
              )}
            </CardContent>
          </Card>

          {/* KPIs (placeholder) */}
          <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5"/>
                <h3 className="text-base font-semibold tracking-tight text-zinc-50">Campaign Performance</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-400">+12% engagement in the latest Magic: The Gathering promo campaign.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5"/>
                <h3 className="text-base font-semibold tracking-tight text-zinc-50">Upcoming Launch</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-400">New D&D campaign setting drops in 2 weeks. Coordinate with stores for pre‑release.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5"/>
                <h3 className="text-base font-semibold tracking-tight text-zinc-50">Quarterly Goals</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-400">Reach 50% more hobby stores with targeted in‑store promotions.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Idea Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-zinc-50">Edit Idea</h4>
              <Button className="text-zinc-400 hover:text-zinc-100" onClick={() => setEditingId(null)}><X className="w-4 h-4"/></Button>
            </div>
            <div className="space-y-3">
              <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Idea title" />
              <textarea className="w-full h-40 p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Supporting notes" />
            </div>
            <div className="flex justify-between mt-5">
              <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => { if(editingId!=null){ removeIdea(editingId); setEditingId(null);} }}>Delete</Button>
              <div className="flex gap-2">
                <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button className="bg-white text-zinc-900 hover:bg-zinc-200" onClick={saveEdit}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Modal */}
      {releaseModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeRelease} />
          <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                {editRelease.keyArt ? (
                  <img src={editRelease.keyArt} alt="key art" className="w-full h-full object-cover"/>
                ) : (
                  <div className="text-zinc-600 text-xs flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 mb-1"/>
                    No key art
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  {isEditingRelease ? (
                    <Input className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md" placeholder="Release title" value={editRelease.title} onChange={(e)=>setEditRelease((r:any)=>({...r,title:e.target.value}))} />
                  ) : (
                    <h4 className="text-lg font-semibold text-zinc-50 truncate">{editRelease.title || 'Untitled Release'}</h4>
                  )}
                  <div className="flex gap-2">
                    {!isEditingRelease && (<Button className="bg-zinc-800 hover:bg-zinc-700" onClick={()=>setIsEditingRelease(true)}>Edit</Button>)}
                    {isEditingRelease && (<Button className="bg-white text-zinc-900 hover:bg-zinc-200" onClick={saveRelease}>Save</Button>)}
                    <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={closeRelease}>Close</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <LabeledField label="Code Name" editing={isEditingRelease} value={editRelease.codeName} onChange={(v)=>setEditRelease((r:any)=>({...r,codeName:v}))} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <LabeledField label="Pre-Order" editing={isEditingRelease} value={editRelease.preorderDate} onChange={(v)=>setEditRelease((r:any)=>({...r,preorderDate:v}))} type="date" />
                  <LabeledField label="Early Access" editing={isEditingRelease} value={editRelease.earlyAccessDate} onChange={(v)=>setEditRelease((r:any)=>({...r,earlyAccessDate:v}))} type="date" />
                  <LabeledField label="Release" editing={isEditingRelease} value={editRelease.releaseDate} onChange={(v)=>setEditRelease((r:any)=>({...r,releaseDate:v}))} type="date" />
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium text-zinc-200 mb-2">SKUs</div>
                  {!isEditingRelease ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-zinc-500">
                          <tr className="text-left">
                            <th className="py-2 pr-3 font-medium">Code</th>
                            <th className="py-2 pr-3 font-medium">Name</th>
                            <th className="py-2 pr-3 font-medium">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editRelease.skus.length===0 && (
                            <tr><td colSpan={3} className="py-4 text-zinc-500">No SKUs yet.</td></tr>
                          )}
                          {editRelease.skus.map((s:any)=>(
                            <tr key={s.id} className="border-t border-zinc-800">
                              <td className="py-2 pr-3 text-zinc-300">{s.code||'—'}</td>
                              <td className="py-2 pr-3 text-zinc-300">{s.name||'—'}</td>
                              <td className="py-2 pr-3 text-zinc-300">{s.price?`$${s.price}`:'—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editRelease.skus.map((s:any,idx:number)=>(
                        <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                          <Input className="col-span-3 bg-zinc-900 border-zinc-800" placeholder="SKU code" value={s.code} onChange={(e)=>setEditRelease((r:any)=>{ const skus=[...r.skus]; skus[idx]={...skus[idx], code:e.target.value}; return {...r, skus}; })} />
                          <Input className="col-span-6 bg-zinc-900 border-zinc-800" placeholder="Name / description" value={s.name} onChange={(e)=>setEditRelease((r:any)=>{ const skus=[...r.skus]; skus[idx]={...skus[idx], name:e.target.value}; return {...r, skus}; })} />
                          <Input className="col-span-2 bg-zinc-900 border-zinc-800" placeholder="Price" value={s.price} onChange={(e)=>setEditRelease((r:any)=>{ const skus=[...r.skus]; skus[idx]={...skus[idx], price:e.target.value}; return {...r, skus}; })} />
                          <Button className="col-span-1 text-zinc-400 hover:text-red-300" onClick={()=>setEditRelease((r:any)=>({...r, skus:r.skus.filter((x:any)=>x.id!==s.id)}))}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <Input className="col-span-3 bg-zinc-900 border-zinc-800" placeholder="SKU code" value={draftSku.code} onChange={(e)=>setDraftSku((x:any)=>({...x,code:e.target.value}))} />
                        <Input className="col-span-6 bg-zinc-900 border-zinc-800" placeholder="Name / description" value={draftSku.name} onChange={(e)=>setDraftSku((x:any)=>({...x,name:e.target.value}))} />
                        <Input className="col-span-2 bg-zinc-900 border-zinc-800" placeholder="Price" value={draftSku.price} onChange={(e)=>setDraftSku((x:any)=>({...x,price:e.target.value}))} />
                        <Button className="col-span-1 bg-zinc-800 hover:bg-zinc-700" onClick={()=>{ if(!draftSku.code && !draftSku.name) return; setEditRelease((r:any)=>({...r, skus:[...r.skus, normalizeSku(draftSku)]})); setDraftSku(normalizeSku({})); }}><Plus className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium text-zinc-200 mb-2">Notes</div>
                  {isEditingRelease ? (
                    <textarea className="w-full h-28 p-3 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-100" value={editRelease.notes} onChange={(e)=>setEditRelease((r:any)=>({...r,notes:e.target.value}))} placeholder="Notes about this release" />
                  ) : (
                    <div className="text-sm text-zinc-300 whitespace-pre-line">{editRelease.notes || '—'}</div>
                  )}
                </div>

                {isEditingRelease && (
                  <div className="flex items-center gap-3 mt-4">
                    <label className="text-xs text-zinc-400 flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="w-4 h-4"/>
                      <span>Upload key art</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e)=> readImageAsDataUrl(e.target.files?.[0], (url)=> setEditRelease((r:any)=>({...r,keyArt:url})))} />
                    </label>
                    <Input className="bg-zinc-900 border-zinc-800" placeholder="Or paste key art URL" value={editRelease.keyArt} onChange={(e)=>setEditRelease((r:any)=>({...r,keyArt:e.target.value}))} />
                    <Button className="ml-auto bg-red-600/80 hover:bg-red-600" onClick={()=>{ deleteRelease(editRelease.id); closeRelease(); }}>Delete Release</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Projects</h3>
        {projects.length===0 ? (
          <div className="text-sm text-zinc-500">No projects yet. Convert any task using the <span className="underline">Project</span> action.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p:any)=> (
              <Card key={p.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <FolderOpen className="w-5 h-5 text-zinc-300"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-zinc-50 truncate">{p.title || 'Untitled Project'}</div>
                        <Button className="text-zinc-400 hover:text-zinc-100" onClick={()=> setProjects((prev:any)=> prev.map((x:any)=> x.id===p.id ? {...x, expanded: !x.expanded} : x))}>
                          {p.expanded? 'Collapse' : 'Expand'}
                        </Button>
                      </div>
                      {p.expanded && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Project Title</div>
                            <Input className="bg-zinc-900 border-zinc-800 text-zinc-100" value={p.title} onChange={(e)=> setProjects((prev:any)=> prev.map((x:any)=> x.id===p.id ? {...x, title: e.target.value} : x))} placeholder="Project title" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Notes</div>
                            <textarea className="w-full h-28 p-3 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-100" value={p.notes} onChange={(e)=> setProjects((prev:any)=> prev.map((x:any)=> x.id===p.id ? {...x, notes: e.target.value} : x))} placeholder="Notes for this project" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Files</div>
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-zinc-400 flex items-center gap-2 cursor-pointer">
                                <Paperclip className="w-4 h-4"/>
                                <span>Attach files</span>
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  onChange={(e)=> readFilesAsDataUrls(e.target.files, (files)=> setProjects((prev:any)=> prev.map((x:any)=> x.id===p.id ? {...x, files:[...x.files, ...files]} : x)))}
                                />
                              </label>
                              {p.files.length>0 && <div className="text-xs text-zinc-500">{p.files.length} file(s) attached</div>}
                            </div>
                            {p.files.length>0 && (
                              <ul className="mt-2 space-y-1">
                                {p.files.map((f:any)=> (
                                  <li key={f.id} className="flex items-center justify-between text-sm text-zinc-300 bg-zinc-900/60 border border-zinc-800 rounded-lg px-2 py-1">
                                    <a href={f.url} target="_blank" rel="noreferrer" className="truncate">{f.name}</a>
                                    <Button className="text-zinc-400 hover:text-red-300" onClick={()=> setProjects((prev:any)=> prev.map((x:any)=> x.id===p.id ? {...x, files: x.files.filter((y:any)=> y.id!==f.id)} : x))}>
                                      <X className="w-4 h-4"/>
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button className="text-zinc-400 hover:text-red-300" onClick={()=> setProjects((prev:any)=> prev.filter((x:any)=> x.id!==p.id))}>Delete Project</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------- Small labeled field --------------------
function LabeledField({ label, value, onChange, editing, type='text' }:{
  label: string; value: string; onChange: (v:string)=>void; editing: boolean; type?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
      {editing ? (
        <Input type={type} className="bg-zinc-900 border-zinc-800 text-zinc-100" value={value} onChange={(e)=>onChange((e.target as HTMLInputElement).value)} />
      ) : (
        <div className="text-zinc-200 truncate">{value || '—'}</div>
      )}
    </div>
  );
}
