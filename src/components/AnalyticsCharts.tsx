import React from 'react';
import { SclerometryTest } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, ShieldCheck } from 'lucide-react';

interface AnalyticsChartsProps {
  tests: SclerometryTest[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ tests }) => {
  if (tests.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No hay ensayos registrados para generar estadísticas de control de calidad.
      </div>
    );
  }

  // 1. Data for Bar Chart (Design vs Estimated f'c)
  const comparisonData = tests.map(t => ({
    name: t.elementTag,
    designFc: t.fcDesignMpa,
    estimatedFc: t.estimatedFcMpa,
    rebound: t.meanCorrected,
    status: t.status
  }));

  // 2. Status Distribution (Pie)
  const statusCounts = {
    CUMPLE: tests.filter(t => t.status === 'CUMPLE').length,
    DUDOSO: tests.filter(t => t.status === 'DUDOSO').length,
    NO_CUMPLE: tests.filter(t => t.status === 'NO_CUMPLE').length,
    INVALIDO: tests.filter(t => t.status === 'INVALIDO').length,
  };

  const pieData = [
    { name: 'Conforme (≥95%)', value: statusCounts.CUMPLE, color: '#10b981' },
    { name: 'Zona Dudosa (80-95%)', value: statusCounts.DUDOSO, color: '#f59e0b' },
    { name: 'No Conforme (<80%)', value: statusCounts.NO_CUMPLE, color: '#ef4444' },
    { name: 'Inválido / Incompleto', value: statusCounts.INVALIDO, color: '#64748b' },
  ].filter(d => d.value > 0);

  // 3. Stats by Element Type
  const elementTypes = Array.from(new Set(tests.map(t => t.elementType)));
  const typeStats = elementTypes.map(type => {
    const matching = tests.filter(t => t.elementType === type);
    const avgRebound = matching.reduce((acc, t) => acc + t.meanCorrected, 0) / matching.length;
    const avgFc = matching.reduce((acc, t) => acc + t.estimatedFcMpa, 0) / matching.length;
    const avgCov = matching.reduce((acc, t) => acc + t.cov, 0) / matching.length;
    const complies = matching.filter(t => t.status === 'CUMPLE').length;

    return {
      type,
      count: matching.length,
      avgRebound: Number(avgRebound.toFixed(1)),
      avgFc: Number(avgFc.toFixed(1)),
      avgCov: Number(avgCov.toFixed(1)),
      complianceRate: Number(((complies / matching.length) * 100).toFixed(0))
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Comparison Bar Chart (Design vs Estimated) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-400" />
                Resistencia de Diseño vs. Estimada por Elemento (MPa)
              </h4>
              <p className="text-xs text-slate-400">
                Comparativa directa del f'c de diseño frente al resultado NTC 3692
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} 
                  formatter={(val: any, name: any) => [`${val} MPa`, name === 'designFc' ? 'f\'c Diseño' : 'f\'c Estimado']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                <Bar dataKey="designFc" name="f'c Diseño" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="estimatedFc" name="f'c Estimado (NTC 3692)" radius={[4, 4, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'CUMPLE' ? '#10b981' : entry.status === 'DUDOSO' ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              Estado de Conformidad Global
            </h4>
            <p className="text-xs text-slate-400">
              Distribución porcentual de los ensayos según NSR-10 C.5
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} 
                  formatter={(val: any) => [`${val} elementos`, 'Cantidad']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Legend */}
          <div className="space-y-1.5 pt-1">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-white">
                  {item.value} ({((item.value / tests.length) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Summary Table by Element Type */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-sky-400" />
          Comportamiento Estadístico por Tipología Estructural
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2.5 rounded-l-lg">Tipo de Elemento</th>
                <th className="px-4 py-2.5 text-center">Ensayos</th>
                <th className="px-4 py-2.5 text-center">Rebote Medio (R)</th>
                <th className="px-4 py-2.5 text-center">f'c Promedio</th>
                <th className="px-4 py-2.5 text-center">Coef. Variación (CV%)</th>
                <th className="px-4 py-2.5 text-center rounded-r-lg">% Conformidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {typeStats.map(stat => (
                <tr key={stat.type} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-white">{stat.type}</td>
                  <td className="px-4 py-3 text-center font-mono">{stat.count}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-amber-400">{stat.avgRebound}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-brand-400">{stat.avgFc} MPa</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-300">
                    <span className={`px-2 py-0.5 rounded ${stat.avgCov < 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {stat.avgCov}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    <span className={stat.complianceRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                      {stat.complianceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
