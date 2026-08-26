import React, { useState } from 'react';
import { SclerometryTest, CurveModel } from '../types';
import { 
  generateCurveDataPoints, 
  calculateFcFromRebound 
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
import { Activity, Sliders, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

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
  const [activeModel, setActiveModel] = useState<CurveModel>('PROCEQ_N_STANDARD');
  const [showNsr10Comparison, setShowNsr10Comparison] = useState(true);
  const [showAstmComparison, setShowAstmComparison] = useState(false);
  const [unit, setUnit] = useState<'MPa' | 'PSI'>('MPa');

  // Curve Data
  const curvePoints = generateCurveDataPoints('PROCEQ_N_STANDARD').map(pt => {
    const fcNSR10 = calculateFcFromRebound(pt.rebound, 'NSR10_COLOMBIA');
    const fcASTM = calculateFcFromRebound(pt.rebound, 'ASTM_POLYNOMIAL');
    return {
      rebound: pt.rebound,
      fcProceq: unit === 'MPa' ? pt.fcMpa : pt.fcPsi,
      fcNSR10: unit === 'MPa' ? fcNSR10 : Math.round(fcNSR10 * 145.038),
      fcASTM: unit === 'MPa' ? fcASTM : Math.round(fcASTM * 145.038),
    };
  });

  // Project Test Points for Scatter
  const testPoints = tests.map((t) => ({
    rebound: t.meanCorrected,
    fcTest: unit === 'MPa' ? t.estimatedFcMpa : t.estimatedFcPsi,
    elementTag: t.elementTag,
    elementType: t.elementType,
    status: t.status,
    id: t.id,
    designFc: unit === 'MPa' ? t.fcDesignMpa : t.fcDesignPsi,
    angle: t.impactAngle
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // If hover on a scatter point
      const scatterPayload = payload.find((p: any) => p.dataKey === 'fcTest');
      if (scatterPayload && scatterPayload.payload) {
        const d = scatterPayload.payload;
        return (
          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs text-slate-100 font-sans space-y-1">
            <p className="font-bold text-brand-400 text-sm">{d.elementTag} ({d.elementType})</p>
            <p className="text-slate-300">Rebote Corregido: <span className="font-mono font-bold text-white">{d.rebound}</span></p>
            <p className="text-slate-300">f'c Estimado: <span className="font-mono font-bold text-amber-400">{d.fcTest} {unit}</span></p>
            <p className="text-slate-300">f'c Diseño: <span className="font-mono text-slate-400">{d.designFc} {unit}</span></p>
            <p className="text-slate-300">Ángulo: <span className="font-mono">{d.angle}°</span></p>
            <div className="pt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                d.status === 'CUMPLE' ? 'bg-emerald-500/20 text-emerald-300' :
                d.status === 'DUDOSO' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {d.status}
              </span>
            </div>
          </div>
        );
      }

      // If hover on curve line
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs text-slate-100">
          <p className="font-bold text-slate-300 mb-1">Rebote R = {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-mono">
              {entry.name}: {entry.value} {unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-400" />
            Curvas de Calibración & Resistencia (NTC 3692 / NSR-10)
          </h3>
          <p className="text-xs text-slate-400">
            Correlación entre el Número de Rebote Schmidt (R) y Resistencia a la Compresión f'c
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Unit Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => setUnit('MPa')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                unit === 'MPa' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              MPa
            </button>
            <button
              onClick={() => setUnit('PSI')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                unit === 'PSI' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PSI
            </button>
          </div>

          {/* Curve Toggles */}
          <button
            onClick={() => setShowNsr10Comparison(!showNsr10Comparison)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showNsr10Comparison 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🇨🇴 Curva NSR-10
          </button>

          <button
            onClick={() => setShowAstmComparison(!showAstmComparison)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              showAstmComparison 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Curva ASTM
          </button>

        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[360px] sm:h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curvePoints} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            
            <XAxis 
              dataKey="rebound" 
              type="number"
              domain={[18, 56]}
              tickCount={10}
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }}
              label={{ value: 'Número de Rebote Corregido (R corr)', position: 'insideBottom', offset: -12, fill: '#cbd5e1', fontSize: 12 }}
            />
            
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fontSize: 11 }}
              domain={[0, unit === 'MPa' ? 75 : 11000]}
              label={{ value: `Resistencia a la Compresión f'c (${unit})`, angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 12, offset: 5 }}
            />
            
            <Tooltip content={customTooltip} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
            
            {/* Proceq Standard Curve */}
            <Line 
              type="monotone" 
              dataKey="fcProceq" 
              name="Curva NTC 3692 / Tipo N (Universal)" 
              stroke="#0284c7" 
              strokeWidth={3} 
              dot={false} 
            />

            {/* NSR-10 Colombian Aggregates Curve */}
            {showNsr10Comparison && (
              <Line 
                type="monotone" 
                dataKey="fcNSR10" 
                name="Curva NSR-10 (Agregados Colombianos)" 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                strokeDasharray="4 4" 
                dot={false} 
              />
            )}

            {/* ASTM Polynomial */}
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

            {/* Test Points Overlay */}
            <Scatter 
              data={testPoints} 
              name="Ensayos en Obra (Puntos Reales)" 
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
                    r={isSelected ? 8 : 6}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-pointer transition-all hover:scale-125"
                    onClick={() => onSelectTest && onSelectTest(payload.id)}
                  />
                );
              }}
            />

            {/* Common Colombian thresholds lines */}
            <ReferenceLine 
              y={unit === 'MPa' ? 21 : 3000} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              label={{ value: `f'c = 21 MPa (3000 PSI)`, fill: '#94a3b8', fontSize: 10, position: 'right' }} 
            />
            <ReferenceLine 
              y={unit === 'MPa' ? 28 : 4000} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              label={{ value: `f'c = 28 MPa (4000 PSI)`, fill: '#94a3b8', fontSize: 10, position: 'right' }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Formula Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
          <p className="font-bold text-sky-400">Curva Universal NTC 3692 / Tipo N</p>
          <p className="font-mono text-slate-300">f'c = 0.0436 · R^2.052 (MPa)</p>
          <p className="text-[11px] text-slate-400">Curva estándar internacional Proceq para esclerómetros Schmidt de 2.207 Nm.</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
          <p className="font-bold text-amber-400">Curva NSR-10 Agregados Colombianos</p>
          <p className="font-mono text-slate-300">f'c = 0.0385 · R^2.085 (MPa)</p>
          <p className="text-[11px] text-slate-400">Calibrada para gravas andesíticas y calizas trituradas de canteras colombianas.</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
          <p className="font-bold text-emerald-400">Puntos de Ensayo en la Obra</p>
          <div className="flex items-center gap-3 pt-1">
            <span className="flex items-center gap-1 text-[11px] text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Conforme
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-300">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Dudoso
            </span>
            <span className="flex items-center gap-1 text-[11px] text-rose-300">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> No Conforme
            </span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Haz clic en cualquier punto para seleccionarlo.</p>
        </div>
      </div>

    </div>
  );
};
