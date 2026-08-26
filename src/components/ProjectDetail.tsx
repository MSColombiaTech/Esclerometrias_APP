import React, { useState } from 'react';
import { Project, SclerometryTest, TestStatus, ElementType } from '../types';
import { 
  Building2, 
  MapPin, 
  HardHat, 
  FileText, 
  FileSpreadsheet, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Activity,
  BarChart3,
  Image as ImageIcon,
  Compass,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { CurveViewer } from './CurveViewer';
import { AnalyticsCharts } from './AnalyticsCharts';
import { PhotoGallery } from './PhotoGallery';
import { exportProjectToExcel } from '../utils/excelExport';
import { exportProjectToPDF } from '../utils/pdfExport';

interface ProjectDetailProps {
  project: Project;
  tests: SclerometryTest[];
  onEditProject: () => void;
  onDeleteProject: () => void;
  onNewTest: () => void;
  onEditTest: (test: SclerometryTest) => void;
  onDeleteTest: (testId: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  tests,
  onEditProject,
  onDeleteProject,
  onNewTest,
  onEditTest,
  onDeleteTest
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'curves' | 'analytics' | 'photos' | 'export'>('tests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedTestIdForCurve, setSelectedTestIdForCurve] = useState<string | null>(null);

  // Filter tests
  const filteredTests = tests.filter(t => {
    const matchesSearch = 
      t.elementTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.levelAxis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'ALL' || t.elementType === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Calculations
  const totalTests = tests.length;
  const compliantTests = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtfulTests = tests.filter(t => t.status === 'DUDOSO').length;
  const nonCompliantTests = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const complianceRate = totalTests > 0 ? ((compliantTests / totalTests) * 100).toFixed(1) : '0';
  const avgFc = totalTests > 0 ? (tests.reduce((acc, t) => acc + t.estimatedFcMpa, 0) / totalTests).toFixed(1) : '0';
  const totalPhotos = tests.reduce((acc, t) => acc + (t.photos?.length || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Project Banner & Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Project Title & Metadata */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {project.code}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-rose-400" />
                {project.municipality}, {project.department}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                🇨🇴 NTC 3692 / NSR-10
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-slate-300">
              <p><span className="text-slate-500">Cliente:</span> <strong className="text-slate-200">{project.client}</strong></p>
              <p><span className="text-slate-500">Contratista:</span> <strong className="text-slate-200">{project.contractor}</strong></p>
              <p><span className="text-slate-500">Interventoría:</span> <strong className="text-slate-200">{project.supervision}</strong></p>
              <p><span className="text-slate-500">Ing. Responsable:</span> <strong className="text-slate-200">{project.engineerInCharge} ({project.licenseNumber || 'TP N/A'})</strong></p>
              <p><span className="text-slate-500">Equipo:</span> <strong className="text-slate-200 font-mono">{project.defaultHammerModel}</strong></p>
              <p><span className="text-slate-500">Ubicación:</span> <strong className="text-slate-200">{project.location}</strong></p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-start lg:justify-center">
            <button
              onClick={onNewTest}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-brand-500/25 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Ensayo (+10 R)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportProjectToExcel(project, tests)}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                title="Exportar a Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => exportProjectToPDF(project, tests)}
                className="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                title="Generar PDF"
              >
                <FileText className="h-4 w-4" />
                <span>PDF</span>
              </button>

              <button
                onClick={onEditProject}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Editar Proyecto"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              <button
                onClick={onDeleteProject}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                title="Eliminar Proyecto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          
          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Total Ensayos</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">
              {totalTests} <span className="text-xs text-slate-400 font-normal">elementos</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Muestreo NTC 3692</p>
          </div>

          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Tasa de Conformidad</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              {complianceRate}%
            </p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${complianceRate}%` }} 
              />
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">f'c Medio Estimado</p>
            <p className="text-xl sm:text-2xl font-extrabold text-brand-400 font-mono mt-1">
              {avgFc} <span className="text-xs font-normal text-slate-400">MPa</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              ~ {Math.round(parseFloat(avgFc) * 145.038)} PSI
            </p>
          </div>

          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-700/60">
            <p className="text-xs text-slate-400 font-medium">Alertas Estructurales</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                {doubtfulTests + nonCompliantTests}
              </span>
              <span className="text-[11px] text-slate-400">
                ({doubtfulTests} dudosas, {nonCompliantTests} críticas)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Requieren núcleos NTC 3658</p>
          </div>

        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'tests'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Ensayos de Campo ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('curves')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'curves'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Activity className="h-4 w-4 text-sky-400" />
          <span>Curva de Calibración NTC 3692</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <span>Estadísticas & Calidad NSR-10</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'photos'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <ImageIcon className="h-4 w-4 text-amber-400" />
          <span>Fotos de Pruebas ({totalPhotos})</span>
        </button>
      </div>

      {/* Tab 1: TESTS LIST */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          
          {/* Search and Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código, eje, nivel..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">Todos los elementos</option>
                <option value="Columna">Columnas</option>
                <option value="Viga">Vigas</option>
                <option value="Losa">Losas</option>
                <option value="Muro Estructural">Muros</option>
                <option value="Zapata">Zapatas</option>
                <option value="Pavimento / Piso">Pavimentos</option>
                <option value="Pilote">Pilotes</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="CUMPLE">Conforme (CUMPLE)</option>
                <option value="DUDOSO">Zona Dudosa</option>
                <option value="NO_CUMPLE">No Conforme</option>
                <option value="INVALIDO">Inválido</option>
              </select>

              {/* View toggle */}
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    viewMode === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tarjetas
                </button>
              </div>

            </div>

          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Elemento</th>
                      <th className="px-4 py-3">Ubicación / Eje</th>
                      <th className="px-3 py-3 text-center">Ángulo (α)</th>
                      <th className="px-4 py-3">Malla 10 Impactos</th>
                      <th className="px-3 py-3 text-center">R corr</th>
                      <th className="px-3 py-3 text-center">f'c Estimado</th>
                      <th className="px-3 py-3 text-center">f'c Diseño</th>
                      <th className="px-3 py-3 text-center">% Cumpl.</th>
                      <th className="px-3 py-3 text-center">Estado</th>
                      <th className="px-3 py-3 text-center">Fotos</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-slate-800/50 transition">
                        
                        {/* Tag & Type */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-white text-sm">{test.elementTag}</p>
                          <p className="text-[11px] text-slate-400">{test.elementType} • {test.concreteAgeDays}d</p>
                        </td>

                        {/* Level Axis */}
                        <td className="px-4 py-3">
                          <p className="text-slate-200">{test.levelAxis}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{test.surfaceCondition}</p>
                        </td>

                        {/* Angle */}
                        <td className="px-3 py-3 text-center font-mono font-bold text-amber-400">
                          {test.impactAngle}°
                        </td>

                        {/* 10 Readings Badges */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {test.readings.map((r, rIdx) => {
                              const isExcluded = test.excludedIndices.includes(rIdx);
                              return (
                                <span
                                  key={rIdx}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isExcluded
                                      ? 'bg-rose-950/80 text-rose-400 line-through border border-rose-800'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                  title={isExcluded ? `Impacto #${rIdx+1} descartado por norma NTC 3692` : `Impacto #${rIdx+1}`}
                                >
                                  {r}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* R corr */}
                        <td className="px-3 py-3 text-center font-mono font-bold text-white text-sm">
                          {test.meanCorrected}
                          <p className="text-[9px] text-slate-500">s: {test.stdDev}</p>
                        </td>

                        {/* f'c Estimated */}
                        <td className="px-3 py-3 text-center font-mono">
                          <p className="font-bold text-brand-400 text-sm">{test.estimatedFcMpa} MPa</p>
                          <p className="text-[10px] text-slate-400">{test.estimatedFcPsi} PSI</p>
                        </td>

                        {/* f'c Design */}
                        <td className="px-3 py-3 text-center font-mono text-slate-300">
                          {test.fcDesignMpa} MPa
                        </td>

                        {/* Compliance Ratio */}
                        <td className="px-3 py-3 text-center font-mono font-bold">
                          <span className={
                            test.complianceRatio >= 95 ? 'text-emerald-400' :
                            test.complianceRatio >= 80 ? 'text-amber-400' : 'text-rose-400'
                          }>
                            {test.complianceRatio}%
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            test.status === 'CUMPLE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : test.status === 'DUDOSO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : test.status === 'NO_CUMPLE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-700/50 text-slate-300'
                          }`}>
                            {test.status === 'CUMPLE' && <CheckCircle2 className="h-3 w-3" />}
                            {test.status === 'DUDOSO' && <AlertTriangle className="h-3 w-3" />}
                            {test.status === 'NO_CUMPLE' && <XCircle className="h-3 w-3" />}
                            {test.status}
                          </span>
                        </td>

                        {/* Photos count */}
                        <td className="px-3 py-3 text-center">
                          {test.photos && test.photos.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-semibold">
                              <Camera className="h-3.5 w-3.5" />
                              {test.photos.length}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditTest(test)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Editar ensayo"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTest(test.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Eliminar ensayo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTests.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No se encontraron ensayos con los filtros actuales.
                </div>
              )}
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test) => (
                <div 
                  key={test.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 space-y-3 transition shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-base">{test.elementTag}</span>
                      <span className="ml-2 text-xs text-slate-400 font-medium">({test.elementType})</span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      test.status === 'CUMPLE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : test.status === 'DUDOSO'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : test.status === 'NO_CUMPLE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {test.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{test.levelAxis}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] text-slate-400">R Corregido</p>
                      <p className="text-base font-mono font-bold text-white">{test.meanCorrected}</p>
                      <p className="text-[9px] text-amber-400">α = {test.impactAngle}°</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">f'c Estimado</p>
                      <p className="text-base font-mono font-bold text-brand-400">{test.estimatedFcMpa} MPa</p>
                      <p className="text-[9px] text-slate-400 font-mono">{test.estimatedFcPsi} PSI</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">Cumplimiento</p>
                      <p className={`text-base font-mono font-bold ${
                        test.complianceRatio >= 95 ? 'text-emerald-400' :
                        test.complianceRatio >= 80 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {test.complianceRatio}%
                      </p>
                      <p className="text-[9px] text-slate-400">de {test.fcDesignMpa} MPa</p>
                    </div>
                  </div>

                  {/* Impact readings badges */}
                  <div className="flex flex-wrap gap-1">
                    {test.readings.map((r, rIdx) => {
                      const isExcluded = test.excludedIndices.includes(rIdx);
                      return (
                        <span
                          key={rIdx}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            isExcluded ? 'bg-rose-950 text-rose-400 line-through' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>

                  {/* Footer actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      {new Date(test.createdAt).toLocaleDateString('es-CO')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditTest(test)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteTest(test.id)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 2: CURVES */}
      {activeTab === 'curves' && (
        <CurveViewer 
          tests={tests} 
          selectedTestId={selectedTestIdForCurve}
          onSelectTest={(id) => {
            setSelectedTestIdForCurve(id);
            const found = tests.find(t => t.id === id);
            if (found) {
              alert(`Elemento seleccionado: ${found.elementTag} (${found.elementType})\nRebote: ${found.meanCorrected} | f'c: ${found.estimatedFcMpa} MPa | Estado: ${found.status}`);
            }
          }}
        />
      )}

      {/* Tab 3: ANALYTICS */}
      {activeTab === 'analytics' && (
        <AnalyticsCharts tests={tests} />
      )}

      {/* Tab 4: PHOTOS */}
      {activeTab === 'photos' && (
        <PhotoGallery tests={tests} />
      )}

    </div>
  );
};
