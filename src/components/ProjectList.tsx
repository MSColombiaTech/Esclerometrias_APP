import React, { useState } from 'react';
import { Project, SclerometryTest } from '../types';
import { 
  Building2, 
  MapPin, 
  HardHat, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  ChevronRight, 
  Calendar, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { exportProjectToExcel } from '../utils/excelExport';
import { exportProjectToPDF } from '../utils/pdfExport';

interface ProjectListProps {
  projects: Project[];
  tests: SclerometryTest[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  tests,
  onSelectProject,
  onNewProject
}) => {
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase()) ||
    p.municipality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              🇨🇴 Normativa Colombiana NTC 3692 / NSR-10
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Proyectos de Esclerometría en Concreto
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Control de calidad no destructivo, calibración de curvas de rebote Schmidt, registro fotográfico y reportes de obra.
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-brand-500/25 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Crear Nuevo Proyecto</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código de obra, cliente o ciudad..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {filtered.length} proyectos registrados
        </span>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((project) => {
          const projectTests = tests.filter(t => t.projectId === project.id);
          const compliesCount = projectTests.filter(t => t.status === 'CUMPLE').length;
          const complianceRate = projectTests.length > 0 
            ? ((compliesCount / projectTests.length) * 100).toFixed(0) 
            : '0';

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 sm:p-6 transition shadow-lg flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Top Row: Code & Location */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {project.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3 text-rose-400" />
                    {project.municipality}, {project.department}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition">
                  {project.name}
                </h3>

                {/* Info Metadata */}
                <div className="space-y-1 text-xs text-slate-300">
                  <p><span className="text-slate-500">Cliente:</span> {project.client}</p>
                  <p><span className="text-slate-500">Contratista:</span> {project.contractor}</p>
                  <p><span className="text-slate-500">Ing. Responsable:</span> {project.engineerInCharge}</p>
                  <p><span className="text-slate-500">Esclerómetro:</span> <span className="font-mono text-slate-300">{project.defaultHammerModel}</span></p>
                </div>
              </div>

              {/* Stats & Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500">Ensayos</p>
                    <p className="font-bold text-white font-mono">{projectTests.length} elementos</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">% Conforme</p>
                    <p className="font-bold text-emerald-400 font-mono">{complianceRate}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportProjectToExcel(project, projectTests);
                    }}
                    title="Exportar a Excel"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white transition"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportProjectToPDF(project, projectTests);
                    }}
                    title="Exportar a PDF"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white transition"
                  >
                    <FileText className="h-4 w-4" />
                  </button>

                  <div className="p-2 rounded-lg bg-brand-600/20 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
