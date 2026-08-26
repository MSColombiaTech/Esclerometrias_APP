import React, { useState } from 'react';
import { ImpactAngle, CurveModel } from '../types';
import { 
  evaluateSclerometryTest, 
  mpaToPsi, 
  mpaToKgcm2,
  COLOMBIAN_CONCRETE_PRESETS,
  CURVE_MODEL_DESCRIPTIONS,
  generateRealisticReadingsForTargetFc
} from '../utils/sclerometryNorms';
import { 
  X, 
  Calculator, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToProject?: (readings: number[], angle: ImpactAngle, fcDesign: number) => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSendToProject
}) => {
  const [impactAngle, setImpactAngle] = useState<ImpactAngle>(0);
  const [curveModel, setCurveModel] = useState<CurveModel>('SCHMIDT_N_DIRECT');
  const [readings, setReadings] = useState<number[]>(() => generateRealisticReadingsForTargetFc(30.00, 32.99, 0, 'SCHMIDT_N_DIRECT'));
  const [fcDesignMpa, setFcDesignMpa] = useState<number>(28);

  if (!isOpen) return null;

  const evaluation = evaluateSclerometryTest(readings, impactAngle, fcDesignMpa, curveModel);

  const handleReadingChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10);
    const updated = [...readings];
    updated[index] = isNaN(val) ? 0 : Math.min(70, Math.max(0, val));
    setReadings(updated);
  };

  const handleReset = () => {
    setReadings(generateRealisticReadingsForTargetFc(30.00, 32.99, impactAngle, curveModel));
  };

  const angleOptions: { angle: ImpactAngle; label: string; icon: string }[] = [
    { angle: 0, label: '0° Horizontal', icon: '➡️' },
    { angle: 90, label: '+90° Arriba', icon: '⬆️' },
    { angle: 45, label: '+45° Arriba', icon: '↗️' },
    { angle: -45, label: '-45° Abajo', icon: '↘️' },
    { angle: -90, label: '-90° Abajo', icon: '⬇️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-xl text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden my-auto transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-900 px-5 py-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Calculadora Rápida de Campo NTC 3692
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Verificación inmediata de resistencia y descarte estadístico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Angle Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
              <Compass className="h-3.5 w-3.5" /> Ángulo de Disparo (α)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {angleOptions.map((opt) => (
                <button
                  key={opt.angle}
                  type="button"
                  onClick={() => setImpactAngle(opt.angle)}
                  className={`p-2 rounded-lg text-center transition border ${
                    impactAngle === opt.angle
                      ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 font-bold ring-1 ring-amber-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-sm">{opt.icon}</div>
                  <p className="text-[11px] mt-0.5 font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Curve Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Curva de Calibración
              </label>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 truncate max-w-[200px]">
                {CURVE_MODEL_DESCRIPTIONS[curveModel]?.specimen}
              </span>
            </div>
            <select
              value={curveModel}
              onChange={(e) => setCurveModel(e.target.value as CurveModel)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="SCHMIDT_N_DIRECT">
                ⭐ Schmidt Original Tipo N - Placa Directa Fábrica (Ábaco kgf/cm² / PSI)
              </option>
              <option value="PROCEQ_N_STANDARD">
                Proceq Schmidt N - Cilindro Estándar Ø15x30 cm (NTC 3692 / NSR-10)
              </option>
              <option value="PROCEQ_N_CUBE">
                Proceq Schmidt N - Probeta Cúbica 150 mm (EN 12504-2 / DIN 1048)
              </option>
              <option value="NSR10_COLOMBIA">
                Curva Regional NSR-10 / ASOCRETO (Agregados Colombianos)
              </option>
              <option value="ASTM_POLYNOMIAL">
                Modelo Polinomial ASTM C805 / ACI 228.1R
              </option>
            </select>
          </div>

          {/* Design Strength Preset */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                f'c de Diseño de Referencia
              </label>
              {fcDesignMpa > 0 ? (
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {fcDesignMpa} MPa ({mpaToPsi(fcDesignMpa)} PSI)
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                  Sin f'c (Diagnóstico In-Situ)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setFcDesignMpa(0)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  fcDesignMpa === 0
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                🔍 Sin f'c
              </button>
              {COLOMBIAN_CONCRETE_PRESETS.map(p => (
                <button
                  key={p.mpa}
                  onClick={() => setFcDesignMpa(p.mpa)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                    fcDesignMpa === p.mpa
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {p.mpa} MPa
                </button>
              ))}
            </div>
          </div>

          {/* 10 Readings Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                10 Lecturas de Rebote (R)
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="h-3 w-3" /> Limpiar
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {readings.map((val, idx) => {
                const isExcluded = evaluation.excludedIndices.includes(idx);
                return (
                  <div key={idx} className="relative">
                    <input
                      type="number"
                      min={10}
                      max={70}
                      value={val || ''}
                      onChange={(e) => handleReadingChange(idx, e.target.value)}
                      className={`w-full text-center py-2 px-1 rounded-lg font-mono text-base font-bold transition border ${
                        isExcluded
                          ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 line-through'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Resultado NTC 3692
              </span>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                evaluation.status === 'CUMPLE'
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                  : evaluation.status === 'DUDOSO'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                  : evaluation.status === 'NO_CUMPLE'
                  ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40'
                  : evaluation.status === 'DIAGNOSTICO'
                  ? 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40'
                  : 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'
              }`}>
                {evaluation.status === 'CUMPLE' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {evaluation.status === 'DUDOSO' && <AlertTriangle className="h-3.5 w-3.5" />}
                {evaluation.status === 'NO_CUMPLE' && <XCircle className="h-3.5 w-3.5" />}
                {evaluation.status === 'DIAGNOSTICO' && <Info className="h-3.5 w-3.5" />}
                <span>
                  {evaluation.status === 'DIAGNOSTICO'
                    ? 'DIAGNÓSTICO IN-SITU'
                    : `${evaluation.status.replace('_', ' ')} (${evaluation.complianceRatio}%)`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">R Corregido</p>
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{evaluation.meanCorrected}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">ΔR: {evaluation.correctionAngle}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">f'c Estimado</p>
                <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{evaluation.estimatedFcMpa} MPa</p>
                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">{evaluation.estimatedFcPsi} PSI</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">kg/cm²</p>
                <p className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400">{evaluation.estimatedFcKgcm2}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">CV: {evaluation.cov}%</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {evaluation.statusNotes}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
            >
              Cerrar
            </button>

            {onSendToProject && (
              <button
                onClick={() => {
                  onSendToProject(readings, impactAngle, fcDesignMpa);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <span>Usar en Nuevo Ensayo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
