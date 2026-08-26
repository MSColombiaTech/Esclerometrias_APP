import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SclerometryTest, CurveModel, ElementType } from '../types';
import { 
  generateCurveDataPoints, 
  calculateFcFromRebound,
  mpaToPsi,
  psiToMpa,
  CURVE_MODEL_DESCRIPTIONS
} from '../utils/sclerometryNorms';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  Sliders, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Filter, 
  RotateCcw, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

export interface CustomDataPoint {
  id: string;
  label: string;
  rebound: number;
  fcValue: number;
  unit: 'MPa' | 'PSI';
  status: 'CUMPLE' | 'DUDOSO' | 'NO_CUMPLE' | 'NUCLEO';
  visible: boolean;
  notes?: string;
}

interface CurveViewerProps {
  tests: SclerometryTest[];
  selectedTestId?: string | null;
  onSelectTest?: (testId: string) => void;
}

export const CurveViewer: React.FC<CurveViewerProps> = ({
  tests,
  selectedTestId,
  onSelectTest
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Units
  const [unit, setUnit] = useState<'MPa' | 'PSI'>('MPa');

  // Curve Visibility Toggles (Agregar / Quitar Curvas)
  const [showSchmidtDirect, setShowSchmidtDirect] = useState(true);
  const [showProceqStandard, setShowProceqStandard] = useState(false);
  const [showProceqCube, setShowProceqCube] = useState(false);
  const [showNsr10Comparison, setShowNsr10Comparison] = useState(true);
  const [showAstmComparison, setShowAstmComparison] = useState(false);
  const [showCustomCurve, setShowCustomCurve] = useState(false);
  const [customCurveParams, setCustomCurveParams] = useState({ a: 0.04, b: 2.05 });

  // Reference Lines (Design Strengths)
  const [showRef21, setShowRef21] = useState(true);
  const [showRef28, setShowRef28] = useState(true);
  const [showRef35, setShowRef35] = useState(false);
  const [customRefMpa, setCustomRefMpa] = useState<number | ''>('');
  const [showCustomRef, setShowCustomRef] = useState(false);

  // Test Points Filtering & Visibility (Agregar / Quitar Ensayos Reales)
  const [showProjectTests, setShowProjectTests] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CUMPLE' | 'DUDOSO' | 'NO_CUMPLE'>('ALL');
  const [elementTypeFilter, setElementTypeFilter] = useState<string>('ALL');
  const [excludedTestIds, setExcludedTestIds] = useState<Set<string>>(new Set());

  // Custom User Data Points (Puntos manuales agregados)
  const [customPoints, setCustomPoints] = useState<CustomDataPoint[]>([
    {
      id: 'cp-01',
      label: 'Núcleo Diamantado Eje 2 (Calibración NTC 3658)',
      rebound: 34,
      fcValue: 27.5,
      unit: 'MPa',
      status: 'NUCLEO',
      visible: true,
      notes: 'Probeta testigo ensayada en prensa calibrada'
    }
  ]);

  // Form for adding new custom data point
  const [newPointLabel, setNewPointLabel] = useState('');
  const [newPointRebound, setNewPointRebound] = useState<number | ''>(32);
  const [newPointFc, setNewPointFc] = useState<number | ''>(24.5);
  const [newPointStatus, setNewPointStatus] = useState<'CUMPLE' | 'DUDOSO' | 'NO_CUMPLE' | 'NUCLEO'>('CUMPLE');
  const [showAddPointForm, setShowAddPointForm] = useState(false);
  const [showDataControls, setShowDataControls] = useState(true);
  const [activeControlTab, setActiveControlTab] = useState<'curves' | 'projectTests' | 'customPoints' | 'references'>('curves');

  // Handle adding a new data point
  const handleAddCustomPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPointRebound || newPointRebound <= 0) return;
    
    let valFc = Number(newPointFc);
    if (!valFc || isNaN(valFc)) {
      // Auto-calculate using Proceq curve
      valFc = calculateFcFromRebound(Number(newPointRebound), 'PROCEQ_N_STANDARD');
    }

    const newPoint: CustomDataPoint = {
      id: 'cp-' + Date.now(),
      label: newPointLabel.trim() || `Punto R=${newPointRebound}`,
      rebound: Number(newPointRebound),
      fcValue: unit === 'PSI' ? Math.round(valFc * 145.038) : Number(valFc.toFixed(2)),
      unit: unit,
      status: newPointStatus,
      visible: true
    };

    setCustomPoints([...customPoints, newPoint]);
    setNewPointLabel('');
    setNewPointRebound(32);
    setNewPointFc(24.5);
    setShowAddPointForm(false);
  };

  const handleToggleCustomPointVisibility = (id: string) => {
    setCustomPoints(customPoints.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  };

  const handleDeleteCustomPoint = (id: string) => {
    setCustomPoints(customPoints.filter(p => p.id !== id));
  };

  const handleToggleTestExclusion = (id: string) => {
    const next = new Set(excludedTestIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExcludedTestIds(next);
  };

  const handleSelectAllTests = () => {
    setExcludedTestIds(new Set());
  };

  const handleDeselectAllTests = () => {
    setExcludedTestIds(new Set(tests.map(t => t.id)));
  };

  // Generate Base Theoretical Curves
  const curvePoints = generateCurveDataPoints('PROCEQ_N_STANDARD').map(pt => {
    const fcSchmidtDirect = calculateFcFromRebound(pt.rebound, 'SCHMIDT_N_DIRECT', undefined, 0);
    const fcProceqCube = calculateFcFromRebound(pt.rebound, 'PROCEQ_N_CUBE');
    const fcNSR10 = calculateFcFromRebound(pt.rebound, 'NSR10_COLOMBIA');
    const fcASTM = calculateFcFromRebound(pt.rebound, 'ASTM_POLYNOMIAL');
    const fcCustom = customCurveParams.b < 5
      ? customCurveParams.a * Math.pow(pt.rebound, customCurveParams.b)
      : customCurveParams.a * pt.rebound + customCurveParams.b;

    return {
      rebound: pt.rebound,
      fcSchmidt: showSchmidtDirect ? (unit === 'MPa' ? fcSchmidtDirect : Math.round(fcSchmidtDirect * 145.038)) : undefined,
      fcProceq: showProceqStandard ? (unit === 'MPa' ? pt.fcMpa : pt.fcPsi) : undefined,
      fcProceqCube: showProceqCube ? (unit === 'MPa' ? fcProceqCube : Math.round(fcProceqCube * 145.038)) : undefined,
      fcNSR10: showNsr10Comparison ? (unit === 'MPa' ? fcNSR10 : Math.round(fcNSR10 * 145.038)) : undefined,
      fcASTM: showAstmComparison ? (unit === 'MPa' ? fcASTM : Math.round(fcASTM * 145.038)) : undefined,
      fcCustom: showCustomCurve ? (unit === 'MPa' ? Number(fcCustom.toFixed(2)) : Math.round(fcCustom * 145.038)) : undefined,
    };
  });

  // Filtered Project Test Points for Scatter
  const filteredProjectPoints = showProjectTests ? tests
    .filter(t => {
      if (excludedTestIds.has(t.id)) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (elementTypeFilter !== 'ALL' && t.elementType !== elementTypeFilter) return false;
      return true;
    })
    .map(t => ({
      rebound: t.meanCorrected,
      fcTest: unit === 'MPa' ? t.estimatedFcMpa : t.estimatedFcPsi,
      elementTag: t.elementTag,
      elementType: t.elementType,
      status: t.status,
      id: t.id,
      designFc: unit === 'MPa' ? t.fcDesignMpa : t.fcDesignPsi,
      angle: t.impactAngle,
      isCustom: false
    })) : [];

  // Active Custom User Points for Scatter
  const activeCustomScatterPoints = customPoints
    .filter(p => p.visible)
    .map(p => {
      // normalize unit to current view unit
      let finalFc = p.fcValue;
      if (p.unit === 'MPa' && unit === 'PSI') finalFc = Math.round(p.fcValue * 145.038);
      if (p.unit === 'PSI' && unit === 'MPa') finalFc = Number((p.fcValue / 145.038).toFixed(2));

      return {
        rebound: p.rebound,
        fcCustomPoint: finalFc,
        elementTag: p.label,
        elementType: p.status === 'NUCLEO' ? 'Núcleo NTC 3658' : 'Punto Personalizado',
        status: p.status,
        id: p.id,
        designFc: '-',
        angle: 0,
        isCustom: true
      };
    });

  // Unique element types in project for filtering
  const availableElementTypes = Array.from(new Set(tests.map(t => t.elementType)));

  // Custom chart tooltip
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Check for project test scatter payload
      const scatterPayload = payload.find((p: any) => p.dataKey === 'fcTest' || p.dataKey === 'fcCustomPoint');
      if (scatterPayload && scatterPayload.payload) {
        const d = scatterPayload.payload;
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs text-slate-800 dark:text-slate-100 font-sans space-y-1 z-50 max-w-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-brand-600 dark:text-brand-400 text-sm truncate">{d.elementTag}</p>
              {d.isCustom && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Manual / Testigo
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400">{d.elementType}</p>
            <p className="text-slate-700 dark:text-slate-300">Rebote Corregido (R): <span className="font-mono font-bold text-slate-900 dark:text-white">{d.rebound}</span></p>
            <p className="text-slate-700 dark:text-slate-300">f'c: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{d.fcTest ?? d.fcCustomPoint} {unit}</span></p>
            {!d.isCustom && (
              <>
                <p className="text-slate-700 dark:text-slate-300">f'c Diseño: <span className="font-mono text-slate-500 dark:text-slate-400">{d.designFc} {unit}</span></p>
                <p className="text-slate-700 dark:text-slate-300">Ángulo Impacto: <span className="font-mono">{d.angle}°</span></p>
              </>
            )}
            <div className="pt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                d.status === 'CUMPLE' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                d.status === 'DUDOSO' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                d.status === 'NUCLEO' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30' :
                'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}>
                {d.status === 'NUCLEO' ? 'NÚCLEO TESTIGO' : d.status}
              </span>
            </div>
          </div>
        );
      }

      // If hover on curve line
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs text-slate-800 dark:text-slate-100 space-y-1">
          <p className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">Número de Rebote R = {label}</p>
          {payload.filter((entry: any) => entry.value !== undefined && entry.dataKey !== 'rebound').map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-mono flex justify-between gap-4">
              <span>{entry.name}:</span>
              <strong>{entry.value} {unit}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl transition-colors">
      
      {/* Header & Primary Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Curvas de Calibración & Resistencia (NTC 3692 / NSR-10)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualización interactiva y gestión de series teóricas, puntos de obra y datos de calibración
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Unit Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 flex text-xs">
            <button
              onClick={() => setUnit('MPa')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                unit === 'MPa' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              MPa
            </button>
            <button
              onClick={() => setUnit('PSI')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                unit === 'PSI' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              PSI
            </button>
          </div>

          {/* Quick Toggle Panel Button */}
          <button
            onClick={() => setShowDataControls(!showDataControls)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              showDataControls
                ? 'bg-brand-500/20 text-brand-700 dark:text-brand-300 border-brand-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Gestionar Datos ({filteredProjectPoints.length + activeCustomScatterPoints.length} pts)</span>
            {showDataControls ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {/* Add Custom Point Quick Button */}
          <button
            onClick={() => {
              setShowDataControls(true);
              setActiveControlTab('customPoints');
              setShowAddPointForm(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Agregar Punto</span>
          </button>

        </div>
      </div>

      {/* Interactive Data Manager Bar (Agregar / Quitar Datos y Curvas) */}
      {showDataControls && (
        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
            <button
              onClick={() => setActiveControlTab('curves')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeControlTab === 'curves'
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Curvas Teóricas ({[showProceqStandard, showProceqCube, showNsr10Comparison, showAstmComparison, showCustomCurve].filter(Boolean).length})
            </button>

            <button
              onClick={() => setActiveControlTab('projectTests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeControlTab === 'projectTests'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Ensayos de Obra ({filteredProjectPoints.length}/{tests.length})
            </button>

            <button
              onClick={() => setActiveControlTab('customPoints')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeControlTab === 'customPoints'
                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Puntos Personalizados / Núcleos ({customPoints.filter(p => p.visible).length}/{customPoints.length})
            </button>

            <button
              onClick={() => setActiveControlTab('references')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeControlTab === 'references'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Líneas Guía f'c
            </button>
          </div>

          {/* TAB 1: CURVAS TEORICAS (Agregar / Quitar Curvas) */}
          {activeControlTab === 'curves' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Selecciona o deselecciona las curvas de calibración para agregarlas o quitarlas del gráfico:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                
                {/* Schmidt Direct Factory Plaque */}
                <button
                  onClick={() => setShowSchmidtDirect(!showSchmidtDirect)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showSchmidtDirect
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showSchmidtDirect ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">⭐ Schmidt Directa</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Placa Original Fábrica</p>
                  </div>
                  {showSchmidtDirect ? <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

                {/* Proceq Standard Cyl */}
                <button
                  onClick={() => setShowProceqStandard(!showProceqStandard)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showProceqStandard
                      ? 'bg-sky-500/10 border-sky-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showProceqStandard ? 'bg-sky-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-400">Proceq Cilindro Ø15x30</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">NTC 3692 / NSR-10</p>
                  </div>
                  {showProceqStandard ? <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

                {/* NSR-10 Colombia */}
                <button
                  onClick={() => setShowNsr10Comparison(!showNsr10Comparison)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showNsr10Comparison
                      ? 'bg-amber-500/10 border-amber-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showNsr10Comparison ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">🇨🇴 Curva NSR-10</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Agregados Colombianos</p>
                  </div>
                  {showNsr10Comparison ? <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

                {/* Proceq Cube 150mm */}
                <button
                  onClick={() => setShowProceqCube(!showProceqCube)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showProceqCube
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showProceqCube ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Proceq Cubo 150mm</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">EN 12504-2 / DIN</p>
                  </div>
                  {showProceqCube ? <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

                {/* ASTM C805 */}
                <button
                  onClick={() => setShowAstmComparison(!showAstmComparison)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showAstmComparison
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showAstmComparison ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Modelo ASTM C805</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">Polinomial ACI 228</p>
                  </div>
                  {showAstmComparison ? <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

                {/* Custom / Calibrated Curve */}
                <button
                  onClick={() => setShowCustomCurve(!showCustomCurve)}
                  className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    showCustomCurve
                      ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${showCustomCurve ? 'bg-fuchsia-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <p className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400">Curva Personalizada</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">f'c = a · R^b</p>
                  </div>
                  {showCustomCurve ? <Eye className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />}
                </button>

              </div>

              {/* Custom Curve Param Editor */}
              {showCustomCurve && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-fuchsia-500/30 flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-bold text-fuchsia-600 dark:text-fuchsia-300">Ajuste de Ecuación:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 dark:text-slate-400">Coeficiente a:</label>
                    <input
                      type="number"
                      step="0.001"
                      value={customCurveParams.a}
                      onChange={(e) => setCustomCurveParams({ ...customCurveParams, a: parseFloat(e.target.value) || 0.04 })}
                      className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 dark:text-slate-400">Exponente b:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={customCurveParams.b}
                      onChange={(e) => setCustomCurveParams({ ...customCurveParams, b: parseFloat(e.target.value) || 2.05 })}
                      className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Ecuación activa: f'c = {customCurveParams.a} · R^{customCurveParams.b} (MPa)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENSAYOS DE OBRA (Filtrar, Ocultar o Quitar Ensayos Reales) */}
          {activeControlTab === 'projectTests' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProjectTests(!showProjectTests)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                      showProjectTests
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {showProjectTests ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {showProjectTests ? 'Ensayos Visibles' : 'Ensayos Ocultos'}
                  </button>

                  <button
                    onClick={handleSelectAllTests}
                    className="px-2.5 py-1 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    Mostrar Todos
                  </button>
                  <button
                    onClick={handleDeselectAllTests}
                    className="px-2.5 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    Ocultar Todos
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="CUMPLE">Solo Cumple (≥95%)</option>
                    <option value="DUDOSO">Solo Dudoso (80-95%)</option>
                    <option value="NO_CUMPLE">Solo No Cumple (&lt;80%)</option>
                  </select>

                  {/* Element Filter */}
                  <select
                    value={elementTypeFilter}
                    onChange={(e) => setElementTypeFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ALL">Todos los Elementos</option>
                    {availableElementTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Test Items Toggle Chips */}
              <div className="max-h-36 overflow-y-auto p-2 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                {tests.map(t => {
                  const isExcluded = excludedTestIds.has(t.id);
                  const isSelected = selectedTestId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTestExclusion(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition ${
                        isExcluded
                          ? 'bg-slate-200 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-800 line-through opacity-60'
                          : isSelected
                          ? 'bg-brand-500/30 text-brand-700 dark:text-brand-200 border-brand-500 font-bold ring-1 ring-brand-500'
                          : t.status === 'CUMPLE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          : t.status === 'DUDOSO'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                      title={`${t.elementTag} (${t.elementType}) - R=${t.meanCorrected}, f'c=${t.estimatedFcMpa} MPa`}
                    >
                      <span className={`h-2 w-2 rounded-full ${
                        isExcluded ? 'bg-slate-400 dark:bg-slate-600' :
                        t.status === 'CUMPLE' ? 'bg-emerald-500' :
                        t.status === 'DUDOSO' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span>{t.elementTag}</span>
                      <span className="text-[10px] opacity-75">R={t.meanCorrected}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PUNTOS PERSONALIZADOS / NUCLEOS (Agregar y Quitar Datos) */}
          {activeControlTab === 'customPoints' && (
            <div className="space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Agrega datos manuales (ej: ensayos de núcleos diamantados NTC 3658 o simulaciones) para correlacionarlos en el gráfico:
                </p>

                <button
                  onClick={() => setShowAddPointForm(!showAddPointForm)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddPointForm ? 'Cerrar Formulario' : 'Nuevo Punto Manual'}</span>
                </button>
              </div>

              {/* Add Point Form */}
              {showAddPointForm && (
                <form onSubmit={handleAddCustomPoint} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-purple-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                      Agregar Nuevo Punto de Ensayo / Calibración
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    
                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold mb-1 block">Etiqueta / Referencia:</label>
                      <input
                        type="text"
                        placeholder="Ej: Núcleo Pilote 3 / Viga V-1"
                        value={newPointLabel}
                        onChange={(e) => setNewPointLabel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold mb-1 block">Rebote Corregido (R):</label>
                      <input
                        type="number"
                        min="15"
                        max="60"
                        step="0.1"
                        placeholder="18 - 56"
                        value={newPointRebound}
                        onChange={(e) => setNewPointRebound(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold mb-1 block">f'c ({unit}):</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Resistencia f'c"
                          value={newPointFc}
                          onChange={(e) => setNewPointFc(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newPointRebound) {
                              const calc = calculateFcFromRebound(Number(newPointRebound), 'PROCEQ_N_STANDARD');
                              setNewPointFc(unit === 'PSI' ? Math.round(calc * 145.038) : calc);
                            }
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-sky-600 dark:text-sky-400 rounded-lg border border-slate-300 dark:border-slate-700 whitespace-nowrap"
                          title="Calcular automáticamente según Curva Proceq"
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-700 dark:text-slate-300 font-semibold mb-1 block">Tipo de Dato:</label>
                      <select
                        value={newPointStatus}
                        onChange={(e) => setNewPointStatus(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="NUCLEO">Núcleo Diamantado (NTC 3658)</option>
                        <option value="CUMPLE">Ensayo Conforme</option>
                        <option value="DUDOSO">Ensayo Dudoso</option>
                        <option value="NO_CUMPLE">Ensayo No Conforme</option>
                      </select>
                    </div>

                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPointForm(false)}
                      className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar al Gráfico
                    </button>
                  </div>
                </form>
              )}

              {/* Custom Points List with Delete (Quitar) & Toggle Options */}
              {customPoints.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  No hay puntos personalizados creados. Haz clic en <strong>+ Nuevo Punto Manual</strong> para añadir datos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {customPoints.map((pt) => (
                    <div
                      key={pt.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                        pt.visible
                          ? 'bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-500/30 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            pt.status === 'NUCLEO' ? 'bg-purple-500 dark:bg-purple-400' :
                            pt.status === 'CUMPLE' ? 'bg-emerald-500 dark:bg-emerald-400' :
                            pt.status === 'DUDOSO' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-rose-500 dark:bg-rose-400'
                          }`} />
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={pt.label}>
                            {pt.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span>R = <strong className="text-slate-900 dark:text-white">{pt.rebound}</strong></span>
                          <span>•</span>
                          <span>f'c = <strong className="text-amber-600 dark:text-amber-400">{pt.fcValue} {pt.unit}</strong></span>
                        </div>
                      </div>

                      {/* Actions: Toggle Visibility & Delete (Quitar Dato) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleCustomPointVisibility(pt.id)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={pt.visible ? 'Ocultar del gráfico' : 'Mostrar en el gráfico'}
                        >
                          {pt.visible ? <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" /> : <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-600" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCustomPoint(pt.id)}
                          className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
                          title="Eliminar / Quitar dato del gráfico"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: LINEAS GUIA f'c (Agregar / Quitar Referencias) */}
          {activeControlTab === 'references' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Líneas de referencia horizontal para evaluar visualmente si los rebotes cumplen las resistencias de diseño NSR-10:
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowRef21(!showRef21)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    showRef21
                      ? 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  f'c = 21 MPa (3000 PSI)
                  {showRef21 ? <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 ml-1" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 ml-1" />}
                </button>

                <button
                  onClick={() => setShowRef28(!showRef28)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    showRef28
                      ? 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border-sky-400 dark:border-sky-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  f'c = 28 MPa (4000 PSI)
                  {showRef28 ? <Eye className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 ml-1" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 ml-1" />}
                </button>

                <button
                  onClick={() => setShowRef35(!showRef35)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    showRef35
                      ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  f'c = 35 MPa (5000 PSI)
                  {showRef35 ? <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-1" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 ml-1" />}
                </button>

                {/* Custom Ref Line */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <label className="text-slate-600 dark:text-slate-400">f'c Personalizado:</label>
                  <input
                    type="number"
                    placeholder="MPa"
                    value={customRefMpa}
                    onChange={(e) => {
                      setCustomRefMpa(e.target.value === '' ? '' : parseFloat(e.target.value));
                      setShowCustomRef(true);
                    }}
                    className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                  <span className="text-slate-500">MPa</span>
                  {customRefMpa && (
                    <button
                      onClick={() => setShowCustomRef(!showCustomRef)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title={showCustomRef ? 'Ocultar línea' : 'Mostrar línea'}
                    >
                      {showCustomRef ? <Eye className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Main Chart */}
      <div className="h-[380px] sm:h-[440px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curvePoints} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.7} />
            
            <XAxis 
              dataKey="rebound" 
              type="number"
              domain={[16, 58]}
              tickCount={11}
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
              label={{ 
                value: 'Número de Rebote Corregido (R corr)', 
                position: 'insideBottom', 
                offset: -14, 
                fill: isDark ? '#cbd5e1' : '#334155', 
                fontSize: 12,
                fontWeight: 600
              }}
            />
            
            <YAxis 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
              domain={[0, unit === 'MPa' ? 75 : 11000]}
              label={{ 
                value: `Resistencia a la Compresión f'c (${unit})`, 
                angle: -90, 
                position: 'insideLeft', 
                fill: isDark ? '#cbd5e1' : '#334155', 
                fontSize: 12, 
                offset: 5,
                fontWeight: 600
              }}
            />
            
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={38} wrapperStyle={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#334155' }} />
            
            {/* 0. Schmidt Direct Plaque Curve */}
            {showSchmidtDirect && (
              <Line 
                type="monotone" 
                dataKey="fcSchmidt" 
                name="⭐ Schmidt Original (Placa Fábrica α=0°)" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={false} 
              />
            )}

            {/* 1. Proceq Standard Cyl Curve */}
            {showProceqStandard && (
              <Line 
                type="monotone" 
                dataKey="fcProceq" 
                name="Proceq Tipo N (Cilindro Ø15x30)" 
                stroke="#0284c7" 
                strokeWidth={2.5} 
                strokeDasharray="4 2"
                dot={false} 
              />
            )}

            {/* 2. Proceq Cube Curve */}
            {showProceqCube && (
              <Line 
                type="monotone" 
                dataKey="fcProceqCube" 
                name="Proceq Tipo N (Cubo 150mm)" 
                stroke="#818cf8" 
                strokeWidth={2.5} 
                strokeDasharray="6 3" 
                dot={false} 
              />
            )}

            {/* 3. NSR-10 Colombian Aggregates Curve */}
            {showNsr10Comparison && (
              <Line 
                type="monotone" 
                dataKey="fcNSR10" 
                name="🇨🇴 NSR-10 (Agregados Colombianos)" 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                strokeDasharray="4 4" 
                dot={false} 
              />
            )}

            {/* 4. ASTM C805 Polynomial */}
            {showAstmComparison && (
              <Line 
                type="monotone" 
                dataKey="fcASTM" 
                name="Modelo Polinomial ASTM C805" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="2 2" 
                dot={false} 
              />
            )}

            {/* 5. Custom Curve */}
            {showCustomCurve && (
              <Line 
                type="monotone" 
                dataKey="fcCustom" 
                name={`Calibrada in-situ (a=${customCurveParams.a}, b=${customCurveParams.b})`}
                stroke="#d946ef" 
                strokeWidth={2.5} 
                strokeDasharray="3 3" 
                dot={false} 
              />
            )}

            {/* Project Test Points Overlay */}
            {showProjectTests && (
              <Scatter 
                data={filteredProjectPoints} 
                name="Ensayos de Obra" 
                dataKey="fcTest" 
                fill="#ec4899"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isSelected = selectedTestId === payload.id;
                  const fillColor = payload.status === 'CUMPLE' ? '#10b981' : payload.status === 'DUDOSO' ? '#f59e0b' : '#ef4444';
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 8 : 5.5}
                      fill={fillColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="cursor-pointer transition-all hover:scale-125"
                      onClick={() => onSelectTest && onSelectTest(payload.id)}
                    />
                  );
                }}
              />
            )}

            {/* Custom User / Core Points Overlay */}
            {activeCustomScatterPoints.length > 0 && (
              <Scatter 
                data={activeCustomScatterPoints} 
                name="Núcleos / Puntos Manuales" 
                dataKey="fcCustomPoint" 
                fill="#a855f7"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <g className="cursor-pointer">
                      <polygon
                        points={`${cx},${cy - 8} ${cx + 7},${cy + 5} ${cx - 7},${cy + 5}`}
                        fill={payload.status === 'NUCLEO' ? '#a855f7' : '#ec4899'}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }}
              />
            )}

            {/* Reference Threshold Lines */}
            {showRef21 && (
              <ReferenceLine 
                y={unit === 'MPa' ? 21 : 3000} 
                stroke={isDark ? "#fbbf24" : "#d97706"} 
                strokeDasharray="3 3" 
                opacity={0.85}
                label={{ value: `f'c = 21 MPa (3000 PSI)`, fill: isDark ? '#fbbf24' : '#b45309', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }} 
              />
            )}
            
            {showRef28 && (
              <ReferenceLine 
                y={unit === 'MPa' ? 28 : 4000} 
                stroke={isDark ? "#38bdf8" : "#0284c7"} 
                strokeDasharray="3 3" 
                opacity={0.85}
                label={{ value: `f'c = 28 MPa (4000 PSI)`, fill: isDark ? '#38bdf8' : '#0369a1', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }} 
              />
            )}

            {showRef35 && (
              <ReferenceLine 
                y={unit === 'MPa' ? 35 : 5000} 
                stroke={isDark ? "#34d399" : "#059669"} 
                strokeDasharray="3 3" 
                opacity={0.85}
                label={{ value: `f'c = 35 MPa (5000 PSI)`, fill: isDark ? '#34d399' : '#047857', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }} 
              />
            )}

            {showCustomRef && customRefMpa && (
              <ReferenceLine 
                y={unit === 'MPa' ? Number(customRefMpa) : Math.round(Number(customRefMpa) * 145.038)} 
                stroke={isDark ? "#e879f9" : "#a21caf"} 
                strokeDasharray="4 2" 
                label={{ 
                  value: `Ref: ${customRefMpa} MPa (${Math.round(Number(customRefMpa) * 145.038)} PSI)`, 
                  fill: isDark ? '#e879f9' : '#86198f', 
                  fontSize: 10, 
                  fontWeight: 600,
                  position: 'insideTopLeft' 
                }} 
              />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Formula Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Proceq Schmidt N - Cilindro Estándar
          </p>
          <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">f'c = 0.8925 · (0.01078·R² + 0.904·R - 12.91)</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Curva estándar NTC 3692 / ASTM C805 / NSR-10 para cilindros Ø15×30 cm.</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Curva NSR-10 / ASOCRETO Agregados
          </p>
          <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">f'c = 0.0098·R² + 0.795·R - 11.40</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Calibrada para gravas andesíticas y calizas trituradas colombianas.</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Puntos y Núcleos Activos
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Conforme (≥95%)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Dudoso
            </span>
            <span className="flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> No Conforme
            </span>
            <span className="flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-300">
              ▲ Núcleos
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">Usa la barra superior para agregar, ocultar o filtrar datos.</p>
        </div>
      </div>

    </div>
  );
};
