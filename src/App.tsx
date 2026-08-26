import React, { useState, useEffect, useMemo } from 'react';
import { Project, SclerometryTest, ImpactAngle, ElementType, TestStatus, UserProfile, CloudSyncStatus } from './types';
import { 
  getStoredProjects, 
  saveProjects, 
  getStoredTests, 
  saveTests, 
  getActiveProjectId, 
  setActiveProjectId,
  exportBackupJSON,
  importBackupJSON
} from './utils/storage';
import { CurveViewer } from './components/CurveViewer';
import { TestFormModal } from './components/TestFormModal';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ExportReportModal } from './components/ExportReportModal';
import { NormInfoModal } from './components/NormInfoModal';
import { AuthModal } from './components/AuthModal';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';
import { generateSclerometryPDF } from './utils/pdfGenerator';
import {
  getSupabase,
  getCurrentUser,
  mapSupabaseUserToProfile,
  syncProjectsToCloud,
  syncTestsToCloud,
  fetchProjectsFromCloud,
  fetchTestsFromCloud
} from './lib/supabase';
import { 
  Building2, 
  Layers, 
  Activity, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calculator, 
  BookOpen, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Copy, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  SlidersHorizontal,
  ArrowUpDown,
  FileDown,
  Info,
  Cloud,
  User,
  LogIn,
  RefreshCw
} from 'lucide-react';

export function App() {
  const { isDark } = useTheme();
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [tests, setTests] = useState<SclerometryTest[]>([]);
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'tests' | 'curves' | 'report'>('tests');

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterElementType, setFilterElementType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'element' | 'fc' | 'rebound'>('date');

  // Modals state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<SclerometryTest | null>(null);
  const [selectedCurveTestId, setSelectedCurveTestId] = useState<string | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isNormInfoOpen, setIsNormInfoOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Supabase User & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize storage and Supabase session
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    const loadedTests = getStoredTests();
    const currentActiveId = getActiveProjectId() || loadedProjects[0]?.id || null;

    setProjects(loadedProjects);
    setTests(loadedTests);
    setActiveId(currentActiveId);

    // Check existing Supabase session
    getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        setSyncStatus('synced');
      }
    });

    // Listen to Supabase auth state changes (OAuth redirects, login, logout)
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = mapSupabaseUserToProfile(session.user);
          setCurrentUser(profile);
          setSyncStatus('synced');
        } else {
          setCurrentUser(null);
          setSyncStatus('idle');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sync projects and tests to storage + cloud (if logged in)
  const handleSaveProjects = async (newProjects: Project[]) => {
    setProjects(newProjects);
    saveProjects(newProjects);

    if (currentUser) {
      setSyncStatus('syncing');
      const res = await syncProjectsToCloud(newProjects, currentUser.id);
      if (res.success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    }
  };

  const handleSaveTests = async (newTests: SclerometryTest[]) => {
    setTests(newTests);
    saveTests(newTests);

    if (currentUser) {
      setSyncStatus('syncing');
      const res = await syncTestsToCloud(newTests, currentUser.id);
      if (res.success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    }
  };

  // Manual Push to Supabase Cloud
  const handleSyncToCloud = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setSyncStatus('syncing');
    try {
      const resPrj = await syncProjectsToCloud(projects, currentUser.id);
      const resTst = await syncTestsToCloud(tests, currentUser.id);
      if (resPrj.success && resTst.success) {
        setSyncStatus('synced');
        showToast('✓ ¡Todos los datos sincronizados en Supabase Cloud!');
      } else {
        setSyncStatus('error');
        showToast(`Error al sincronizar: ${resPrj.error || resTst.error || 'Verifica la conexión'}`);
      }
    } catch (e) {
      setSyncStatus('error');
      showToast('Error al conectar con Supabase Cloud.');
    }
  };

  // Manual Pull from Supabase Cloud
  const handlePullFromCloud = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setSyncStatus('syncing');
    try {
      const cloudPrjs = await fetchProjectsFromCloud(currentUser.id);
      const cloudTsts = await fetchTestsFromCloud(currentUser.id);

      if (cloudPrjs.error || cloudTsts.error) {
        setSyncStatus('error');
        showToast(`Error al descargar: ${cloudPrjs.error || cloudTsts.error}`);
        return;
      }

      if (cloudPrjs.projects.length > 0) {
        // Merge or replace
        const combinedProjects = [...cloudPrjs.projects];
        setProjects(combinedProjects);
        saveProjects(combinedProjects);
        setActiveId(combinedProjects[0]?.id || null);
        setActiveProjectId(combinedProjects[0]?.id || '');
      }

      if (cloudTsts.tests.length > 0) {
        const combinedTests = [...cloudTsts.tests];
        setTests(combinedTests);
        saveTests(combinedTests);
      }

      setSyncStatus('synced');
      showToast(`✓ Descargados ${cloudPrjs.projects.length} proyectos y ${cloudTsts.tests.length} ensayos desde Supabase.`);
    } catch (e) {
      setSyncStatus('error');
      showToast('Error al descargar datos de la nube.');
    }
  };

  // Active Project object
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Project Tests
  const activeProjectTests = useMemo(() => {
    if (!activeProject) return [];
    return tests.filter(t => t.projectId === activeProject.id);
  }, [tests, activeProject]);

  // Filtered & Sorted Tests
  const filteredTests = useMemo(() => {
    return activeProjectTests.filter(t => {
      const matchesSearch = 
        t.elementTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.levelAxis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.elementType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.operatorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesElement = filterElementType === 'ALL' || t.elementType === filterElementType;
      const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;

      return matchesSearch && matchesElement && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'date') return b.createdAt - a.createdAt;
      if (sortBy === 'element') return a.elementTag.localeCompare(b.elementTag);
      if (sortBy === 'fc') return b.estimatedFcMpa - a.estimatedFcMpa;
      if (sortBy === 'rebound') return b.meanCorrected - a.meanCorrected;
      return 0;
    });
  }, [activeProjectTests, searchTerm, filterElementType, filterStatus, sortBy]);

  // Project KPI statistics
  const stats = useMemo(() => {
    const total = activeProjectTests.length;
    if (total === 0) {
      return { total: 0, cumple: 0, dudoso: 0, noCumple: 0, diagnostico: 0, invalido: 0, compliancePct: 0, avgR: 0, avgFc: 0 };
    }
    const cumple = activeProjectTests.filter(t => t.status === 'CUMPLE').length;
    const dudoso = activeProjectTests.filter(t => t.status === 'DUDOSO').length;
    const noCumple = activeProjectTests.filter(t => t.status === 'NO_CUMPLE').length;
    const diagnostico = activeProjectTests.filter(t => t.status === 'DIAGNOSTICO').length;
    const invalido = activeProjectTests.filter(t => t.status === 'INVALIDO').length;
    const testsWithDesign = activeProjectTests.filter(t => t.fcDesignMpa > 0);
    const compliancePct = testsWithDesign.length > 0 ? Math.round((cumple / testsWithDesign.length) * 100) : 100;

    const validTests = activeProjectTests.filter(t => t.status !== 'INVALIDO' && t.meanCorrected > 0);
    const avgR = validTests.length > 0 
      ? Number((validTests.reduce((acc, t) => acc + t.meanCorrected, 0) / validTests.length).toFixed(1)) 
      : 0;
    const avgFc = validTests.length > 0 
      ? Number((validTests.reduce((acc, t) => acc + t.estimatedFcMpa, 0) / validTests.length).toFixed(1)) 
      : 0;

    return { total, cumple, dudoso, noCumple, diagnostico, invalido, compliancePct, avgR, avgFc };
  }, [activeProjectTests]);

  // Handlers for Project CRUD
  const handleSelectProject = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
  };

  const handleSaveProjectModal = (prj: Project) => {
    const exists = projects.some(p => p.id === prj.id);
    let updated: Project[];
    if (exists) {
      updated = projects.map(p => p.id === prj.id ? prj : p);
    } else {
      updated = [prj, ...projects];
    }
    handleSaveProjects(updated);
    setActiveId(prj.id);
    setActiveProjectId(prj.id);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert('Debe existir al menos un proyecto en el sistema.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este proyecto y todos sus ensayos asociados?')) {
      const updatedProjects = projects.filter(p => p.id !== id);
      const updatedTests = tests.filter(t => t.projectId !== id);
      handleSaveProjects(updatedProjects);
      handleSaveTests(updatedTests);
      const nextId = updatedProjects[0]?.id || null;
      setActiveId(nextId);
      if (nextId) setActiveProjectId(nextId);
    }
  };

  // Handlers for Test CRUD
  const handleSaveTestModal = (testRecord: SclerometryTest) => {
    const exists = tests.some(t => t.id === testRecord.id);
    let updated: SclerometryTest[];
    if (exists) {
      updated = tests.map(t => t.id === testRecord.id ? testRecord : t);
    } else {
      updated = [testRecord, ...tests];
    }
    handleSaveTests(updated);
  };

  const handleDeleteTest = (id: string) => {
    if (confirm('¿Deseas eliminar este registro de ensayo?')) {
      const updated = tests.filter(t => t.id !== id);
      handleSaveTests(updated);
    }
  };

  const handleDuplicateTest = (testToDup: SclerometryTest) => {
    const now = Date.now();
    const newTest: SclerometryTest = {
      ...testToDup,
      id: `test-${now}`,
      elementTag: `${testToDup.elementTag}-Copia`,
      createdAt: now,
      updatedAt: now
    };
    handleSaveTests([newTest, ...tests]);
  };

  // Handle Quick Calculator Send to Project
  const handleQuickCalcSend = (calcReadings: number[], calcAngle: ImpactAngle, calcFcDesign: number) => {
    setEditingTest(null);
    setIsTestModalOpen(true);
  };

  // Backup Import Handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importBackupJSON(content)) {
        setProjects(getStoredProjects());
        setTests(getStoredTests());
        setActiveId(getActiveProjectId());
        alert('Copia de respaldo importada con éxito.');
      } else {
        alert('El archivo no tiene un formato de respaldo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-brand-500 selection:text-white">
      
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-600 dark:from-brand-500 dark:to-sky-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-black text-xl tracking-tighter shrink-0 border border-brand-400/40">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                    Esclerometría Pro <span className="text-sky-600 dark:text-sky-400">Colombia</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-300 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/40">
                    NSR-10 / NTC 3692
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Control no destructivo, calibración de curvas y dictamen normativo en concreto
                </p>
              </div>
            </div>

            {/* Actions & Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Quick Field Calculator Button */}
              <button
                onClick={() => setIsQuickCalcOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Calculadora Rápida de Campo NTC 3692"
              >
                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Calc Rápida</span>
              </button>

              {/* Norm Guide Modal Button */}
              <button
                onClick={() => setIsNormInfoOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Guía de Normas NTC 3692 / NSR-10"
              >
                <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>Normativa</span>
              </button>

              {/* Official Technical Report PDF & TXT Buttons */}
              {activeProject && (
                <>
                  <button
                    onClick={() => {
                      if (activeProject) {
                        generateSclerometryPDF(activeProject, activeProjectTests);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Generar y descargar informe oficial en formato PDF (NSR-10 / NTC 3692)"
                  >
                    <FileDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span>Descargar PDF</span>
                  </button>

                  <button
                    onClick={() => setIsExportReportOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    title="Ver opciones de exportación (PDF, Excel CSV, Texto oficial)"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Informe / Excel</span>
                  </button>
                </>
              )}

              {/* Supabase Cloud & OAuth Sync Button */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                  currentUser
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Gestión de cuenta Supabase, OAuth2 y sincronización en la nube"
              >
                {currentUser ? (
                  <>
                    {currentUser.avatarUrl ? (
                      <img 
                        src={currentUser.avatarUrl} 
                        alt="User" 
                        className="h-4 w-4 rounded-full object-cover border border-emerald-400" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Cloud className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-pulse text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    )}
                    <span className="max-w-[120px] truncate">{currentUser.fullName?.split(' ')[0] || 'Mi Cuenta'}</span>
                    <span className={`h-2 w-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Guardar en Nube</span>
                  </>
                )}
              </button>

              {/* Backup Menu */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  onClick={exportBackupJSON}
                  className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Exportar copia de respaldo JSON"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <label className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer" title="Restaurar copia de respaldo JSON">
                  <Upload className="h-3.5 w-3.5" />
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Project Selector & Summary Banner */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Active Project Switcher & Metadata */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <select
                    value={activeProjectId || ''}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Actions */}
                <button
                  onClick={() => {
                    setEditingProject(activeProject);
                    setIsProjectModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition text-xs flex items-center gap-1 font-medium"
                  title="Editar datos del proyecto"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => {
                    setEditingProject(null);
                    setIsProjectModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-600/20 dark:hover:bg-sky-600/30 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 transition text-xs font-bold flex items-center gap-1"
                  title="Crear un nuevo proyecto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo Proyecto</span>
                </button>

                {projects.length > 1 && (
                  <button
                    onClick={() => activeProjectId && handleDeleteProject(activeProjectId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition text-xs"
                    title="Eliminar proyecto actual"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Project Meta tags */}
              {activeProject && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    {activeProject.location}, {activeProject.municipality} ({activeProject.department})
                  </span>
                  <span>•</span>
                  <span>Cliente: <strong className="text-slate-800 dark:text-slate-300">{activeProject.client}</strong></span>
                  <span>•</span>
                  <span>Ing. Responsable: <strong className="text-slate-800 dark:text-slate-300">{activeProject.engineerInCharge}</strong></span>
                </div>
              )}
            </div>

            {/* Quick KPI Stats Bar */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="px-2 py-1">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Total Ensayos</p>
                <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{stats.total}</p>
              </div>

              <div className="px-2 py-1 border-l border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Conformidad</p>
                <p className={`text-lg font-black font-mono ${
                  stats.compliancePct >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                  stats.compliancePct >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {stats.compliancePct}%
                </p>
              </div>

              <div className="px-2 py-1 border-l border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Promedio R</p>
                <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{stats.avgR}</p>
              </div>

              <div className="px-2 py-1 border-l border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">f'c Promedio</p>
                <p className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">{stats.avgFc} <span className="text-[10px] font-normal">MPa</span></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grow w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          
          <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'tests'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Ensayos de Obra ({activeProjectTests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('curves')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'curves'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Curvas de Calibración & Gráfico</span>
            </button>

          </div>

          {/* Primary Action Button */}
          {activeProject && (
            <button
              onClick={() => {
                setEditingTest(null);
                setIsTestModalOpen(true);
              }}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-brand-500/25 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>+ Registrar Ensayo (NTC 3692)</span>
            </button>
          )}

        </div>

        {/* TAB 1: ENSAYOS DE OBRA */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por elemento (C-101), eje, nivel, tipo o técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Element Type Filter */}
                <select
                  value={filterElementType}
                  onChange={(e) => setFilterElementType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm font-medium"
                >
                  <option value="ALL">Todos los Elementos</option>
                  <option value="Columna">Columnas</option>
                  <option value="Viga">Vigas</option>
                  <option value="Losa">Losas</option>
                  <option value="Muro Estructural">Muros</option>
                  <option value="Zapata">Zapatas</option>
                  <option value="Pavimento / Piso">Pavimentos</option>
                  <option value="Pilote">Pilotes</option>
                  <option value="Cimentación">Cimentaciones</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm font-medium"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="CUMPLE">Cumple (≥95%)</option>
                  <option value="DUDOSO">Zona Dudosa (80-95%)</option>
                  <option value="NO_CUMPLE">No Cumple (&lt;80%)</option>
                  <option value="DIAGNOSTICO">Diagnóstico In-Situ</option>
                  <option value="INVALIDO">Anulado / Inválido</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-sm font-medium"
                >
                  <option value="date">Más Recientes</option>
                  <option value="element">Código Elemento</option>
                  <option value="fc">Mayor Resistencia f'c</option>
                  <option value="rebound">Mayor Rebote R</option>
                </select>

              </div>

            </div>

            {/* Test Cards List */}
            {filteredTests.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron ensayos registrados</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {searchTerm || filterElementType !== 'ALL' || filterStatus !== 'ALL'
                    ? 'No hay ensayos que coincidan con los filtros aplicados. Intenta restablecer los filtros de búsqueda.'
                    : 'Comienza registrando el primer ensayo de esclerometría para esta obra.'}
                </p>
                {activeProject && (
                  <button
                    onClick={() => {
                      setEditingTest(null);
                      setIsTestModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Registrar Primer Ensayo</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => {
                  return (
                    <div 
                      key={test.id}
                      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 space-y-3 shadow-md hover:shadow-lg transition flex flex-col justify-between"
                    >
                      
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                                {test.elementTag}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {test.elementType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{test.levelAxis}</p>
                          </div>

                          {/* Status Badge */}
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 ${
                            test.status === 'CUMPLE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' :
                            test.status === 'DUDOSO' ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' :
                            test.status === 'NO_CUMPLE' ? 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' :
                            test.status === 'DIAGNOSTICO' ? 'bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30' :
                            'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {test.status === 'CUMPLE' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {test.status === 'DUDOSO' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                            {test.status === 'NO_CUMPLE' && <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
                            {test.status === 'DIAGNOSTICO' && <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
                            {test.status === 'INVALIDO' && <HelpCircle className="h-3.5 w-3.5" />}
                            <span>{test.status.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Impact & Angle Info */}
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Compass className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            Ángulo: <strong className="text-slate-800 dark:text-slate-200">{test.impactAngle}°</strong>
                          </span>
                          {test.fcDesignMpa > 0 && (
                            <>
                              <span>•</span>
                              <span>Edad: <strong className="text-slate-800 dark:text-slate-200">{test.concreteAgeDays}d</strong></span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            f'c Diseño: <strong className="text-slate-800 dark:text-slate-200">{test.fcDesignMpa > 0 ? `${test.fcDesignMpa} MPa` : 'Sin f\'c (Diagnóstico)'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Card KPI Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Rebote R_corr</p>
                          <p className="text-base font-black font-mono text-slate-900 dark:text-white">{test.meanCorrected}</p>
                          <p className="text-[9px] text-slate-500 font-mono">ΔR: {test.correctionAngle}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">f'c Estimado</p>
                          <p className="text-base font-black font-mono text-amber-600 dark:text-amber-400">{test.estimatedFcMpa} <span className="text-[10px] font-normal">MPa</span></p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{test.estimatedFcPsi} PSI</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                            {test.fcDesignMpa > 0 ? "% Diseño" : "Modo"}
                          </p>
                          {test.fcDesignMpa > 0 ? (
                            <p className={`text-base font-black font-mono ${
                              test.complianceRatio >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                              test.complianceRatio >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {test.complianceRatio}%
                            </p>
                          ) : (
                            <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1">
                              In-Situ
                            </p>
                          )}
                          <p className="text-[9px] text-slate-500 font-mono">CV: {test.cov}%</p>
                        </div>
                      </div>

                      {/* Readings & Discards preview */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <span>10 Impactos:</span>
                          {test.excludedIndices.length > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                              {test.excludedIndices.length} descarte(s) NTC
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">100% válidas</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                          {test.readings.map((r, idx) => {
                            const isExcluded = test.excludedIndices.includes(idx);
                            return (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  isExcluded 
                                    ? 'bg-rose-100 text-rose-800 line-through border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800' 
                                    : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent'
                                }`}
                              >
                                {r}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Photos & Notes info */}
                      {test.photos && test.photos.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
                          <Camera className="h-3.5 w-3.5" />
                          <span>{test.photos.length} fotografía(s) de campo adjunta(s)</span>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                          {new Date(test.createdAt).toLocaleDateString('es-CO')} • {test.operatorName}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedCurveTestId(test.id);
                              setActiveTab('curves');
                            }}
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition"
                            title="Ver en Gráfico de Curvas"
                          >
                            <Activity className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (activeProject) {
                                generateSclerometryPDF(activeProject, [test]);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition"
                            title="Generar Certificado PDF de este ensayo"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateTest(test)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                            title="Duplicar ensayo"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTest(test);
                              setIsTestModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                            title="Editar ensayo"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition"
                            title="Eliminar ensayo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: CURVAS DE CALIBRACIÓN & GRÁFICO INTERACTIVO */}
        {activeTab === 'curves' && (
          <div className="space-y-4">
            <CurveViewer 
              tests={activeProjectTests} 
              selectedTestId={selectedCurveTestId}
              onSelectTest={(testId) => setSelectedCurveTestId(testId)}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <p>
            Esclerometría Pro Colombia • Cumplimiento Normativo NTC 3692 / ASTM C805 / NSR-10 (Título C)
          </p>
          <p className="font-mono text-slate-500">
            Versión 2.0 • Antigravity Engineering
          </p>
        </div>
      </footer>

      {/* Modals */}
      {isTestModalOpen && (
        <TestFormModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setEditingTest(null);
          }}
          onSave={handleSaveTestModal}
          projectId={activeProjectId || 'default'}
          initialData={editingTest}
          defaultHammerModel={activeProject?.defaultHammerModel}
          defaultHammerSerial={activeProject?.defaultHammerSerial}
        />
      )}

      {isProjectModalOpen && (
        <ProjectFormModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProjectModal}
          initialData={editingProject}
        />
      )}

      {isQuickCalcOpen && (
        <QuickCalculatorModal
          isOpen={isQuickCalcOpen}
          onClose={() => setIsQuickCalcOpen(false)}
          onSendToProject={handleQuickCalcSend}
        />
      )}

      {isExportReportOpen && activeProject && (
        <ExportReportModal
          isOpen={isExportReportOpen}
          onClose={() => setIsExportReportOpen(false)}
          project={activeProject}
          tests={activeProjectTests}
        />
      )}

      {isNormInfoOpen && (
        <NormInfoModal
          isOpen={isNormInfoOpen}
          onClose={() => setIsNormInfoOpen(false)}
        />
      )}

      {/* Supabase Authentication & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        syncStatus={syncStatus}
        onSyncToCloud={handleSyncToCloud}
        onPullFromCloud={handlePullFromCloud}
        onUserChange={(user) => {
          setCurrentUser(user);
          if (user) {
            setSyncStatus('synced');
            showToast(`¡Bienvenido ${user.fullName || user.email}!`);
          } else {
            setSyncStatus('idle');
          }
        }}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-emerald-600 dark:text-white rounded-2xl shadow-2xl border border-slate-700 dark:border-emerald-400 flex items-center gap-2.5 text-xs font-bold animate-bounce-short">
          <Sparkles className="h-4 w-4 text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default App;

