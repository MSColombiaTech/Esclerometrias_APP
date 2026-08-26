import React from 'react';
import { Project } from '../types';
import { 
  Building2, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Calculator, 
  BookOpen, 
  Database, 
  ChevronDown,
  HardHat,
  FolderPlus
} from 'lucide-react';
import { exportProjectToExcel } from '../utils/excelExport';
import { exportProjectToPDF } from '../utils/pdfExport';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onNewTest: () => void;
  onOpenCalculator: () => void;
  onOpenNorms: () => void;
  tests: any[];
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  onNewTest,
  onOpenCalculator,
  onOpenNorms,
  tests,
  onRefreshData
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importBackupJSON(content)) {
        alert('Copia de respaldo importada con éxito.');
        onRefreshData();
      } else {
        alert('Error: El archivo de respaldo no es válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (!activeProject) return;
    const projectTests = tests.filter(t => t.projectId === activeProject.id);
    if (projectTests.length === 0) {
      if (!confirm('Este proyecto no tiene ensayos registrados aún. ¿Deseas exportar la plantilla de Excel de todos modos?')) {
        return;
      }
    }
    exportProjectToExcel(activeProject, projectTests);
  };

  const handleExportPDF = () => {
    if (!activeProject) return;
    const projectTests = tests.filter(t => t.projectId === activeProject.id);
    if (projectTests.length === 0) {
      alert('Debes registrar al menos un ensayo en el proyecto para generar el informe PDF.');
      return;
    }
    exportProjectToPDF(activeProject, projectTests);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 flex items-center justify-center shadow-md shadow-brand-500/20 ring-1 ring-white/20">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  Esclerometría<span className="text-brand-400 font-black">PRO</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase tracking-wide">
                  🇨🇴 NTC 3692 / NSR-10
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Control de Calidad y Resistencia en Concreto
              </p>
            </div>
          </div>

          {/* Project Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Project Picker Dropdown */}
            {projects.length > 0 && (
              <div className="relative group">
                <div className="flex items-center bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 transition text-left cursor-pointer text-xs sm:text-sm">
                  <Building2 className="h-4 w-4 text-brand-400 mr-2 shrink-0" />
                  <div className="max-w-[130px] sm:max-w-[190px] truncate">
                    <p className="font-semibold text-slate-200 truncate leading-tight">
                      {activeProject ? activeProject.name : 'Seleccionar Proyecto'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {activeProject ? activeProject.code : 'Sin proyecto activo'}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1.5 shrink-0" />
                </div>

                <div className="absolute right-0 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/80 flex items-center justify-between">
                    <span>Proyectos en Obra</span>
                    <button 
                      onClick={onNewProject}
                      className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold normal-case text-xs"
                    >
                      <Plus className="h-3 w-3" /> Nuevo
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                    {projects.map((p) => {
                      const pTests = tests.filter(t => t.projectId === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => onSelectProject(p.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                            activeProject?.id === p.id 
                              ? 'bg-brand-600/30 text-brand-200 font-semibold border border-brand-500/40' 
                              : 'text-slate-300 hover:bg-slate-700/60'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.code} • {p.municipality}</p>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 shrink-0">
                            {pTests.length} ens.
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Calculator Button */}
            <button
              id="btn-quick-calc"
              onClick={onOpenCalculator}
              title="Calculadora Rápida de Campo NTC 3692"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Calculator className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Calc. Rápida</span>
            </button>

            {/* Normative Reference Button */}
            <button
              id="btn-normative-guide"
              onClick={onOpenNorms}
              title="Guía Normativa NTC 3692 / NSR-10"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <BookOpen className="h-4 w-4 text-sky-400" />
              <span className="hidden md:inline">Norma</span>
            </button>

            {/* Excel Export Button */}
            {activeProject && (
              <button
                id="btn-export-excel"
                onClick={handleExportExcel}
                title="Exportar a Microsoft Excel (.xlsx)"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}

            {/* PDF Report Button */}
            {activeProject && (
              <button
                id="btn-export-pdf"
                onClick={handleExportPDF}
                title="Generar Informe Técnico en PDF"
                className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}

            {/* New Test Action CTA */}
            {activeProject && (
              <button
                id="btn-new-test-top"
                onClick={onNewTest}
                className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-md shadow-brand-500/25 ring-1 ring-white/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Ensayo</span>
              </button>
            )}

            {/* Backup & Tools Menu */}
            <div className="relative group">
              <button
                title="Copias de Seguridad y Datos"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center transition"
              >
                <Database className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
                <button
                  onClick={exportBackupJSON}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2"
                >
                  <Database className="h-3.5 w-3.5 text-brand-400" />
                  Descargar Copia JSON
                </button>
                <label className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-lg flex items-center gap-2 cursor-pointer">
                  <FolderPlus className="h-3.5 w-3.5 text-emerald-400" />
                  Restaurar Copia JSON
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json" 
                    onChange={handleImport}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
