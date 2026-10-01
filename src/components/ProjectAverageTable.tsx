import React from 'react';
import { SclerometryTest } from '../types';

interface ProjectAverageTableProps {
  tests: SclerometryTest[];
  className?: string;
  showCaption?: boolean;
}

export interface ProjectAverageMetrics {
  validCount: number;
  totalCount: number;
  sumPsi: number;
  avgPsi: number;
  avgMpa: number;
  sumDesignPsi: number;
  avgDesignPsi: number;
  ratioFcEspec: number;
  complies: boolean;
  complianceLabel: 'SÍ' | 'NO' | 'N/A';
  hasDesign: boolean;
}

/**
 * Calcula las métricas globales del cuadro promedio del proyecto completo
 */
export function calculateProjectAverageMetrics(tests: SclerometryTest[]): ProjectAverageMetrics {
  const validTests = tests.filter(t => t.status !== 'INVALIDO' && t.meanCorrected > 0);
  const validCount = validTests.length;
  const totalCount = tests.length;

  if (validCount === 0) {
    return {
      validCount: 0,
      totalCount,
      sumPsi: 0,
      avgPsi: 0,
      avgMpa: 0,
      sumDesignPsi: 0,
      avgDesignPsi: 0,
      ratioFcEspec: 0,
      complies: false,
      complianceLabel: 'N/A',
      hasDesign: false,
    };
  }

  // Suma precisa de resistencias estimadas en PSI (conservando 2 decimales según cálculo analítico)
  const sumPsiExact = validTests.reduce((acc, t) => {
    const psiVal = t.estimatedFcMpa > 0 ? (t.estimatedFcMpa * 145.0377377) : (t.estimatedFcPsi || 0);
    return acc + psiVal;
  }, 0);

  const sumPsi = Number(sumPsiExact.toFixed(2));
  const avgPsi = Number((sumPsi / validCount).toFixed(2));
  const avgMpa = Number((avgPsi * 0.00689476).toFixed(2));

  // Cálculo de f'c especificado / de diseño
  const testsWithDesign = validTests.filter(t => (t.fcDesignPsi && t.fcDesignPsi > 0) || (t.fcDesignMpa && t.fcDesignMpa > 0));
  const hasDesign = testsWithDesign.length > 0;

  let sumDesignPsi = 0;
  let avgDesignPsi = 0;
  let ratioFcEspec = 0;

  if (hasDesign) {
    sumDesignPsi = testsWithDesign.reduce((acc, t) => {
      const dPsi = (t.fcDesignPsi && t.fcDesignPsi > 0) ? t.fcDesignPsi : (t.fcDesignMpa * 145.0377377);
      return acc + dPsi;
    }, 0);
    avgDesignPsi = sumDesignPsi / testsWithDesign.length;
    ratioFcEspec = avgDesignPsi > 0 ? Number((avgPsi / avgDesignPsi).toFixed(2)) : 0;
  }

  // Evaluación de conformidad global:
  // Requiere que la relación global sea >= 1.00 y que ningún elemento individual haya fallado (NO_CUMPLE / DUDOSO / INVALIDO)
  const hasFailures = validTests.some(t => t.status === 'NO_CUMPLE' || t.status === 'DUDOSO');
  const complies = hasDesign && ratioFcEspec >= 1.0 && !hasFailures;
  const complianceLabel: 'SÍ' | 'NO' | 'N/A' = !hasDesign ? 'N/A' : (complies ? 'SÍ' : 'NO');

  return {
    validCount,
    totalCount,
    sumPsi,
    avgPsi,
    avgMpa,
    sumDesignPsi,
    avgDesignPsi,
    ratioFcEspec,
    complies,
    complianceLabel,
    hasDesign,
  };
}

export const ProjectAverageTable: React.FC<ProjectAverageTableProps> = ({
  tests,
  className = '',
  showCaption = true,
}) => {
  const metrics = calculateProjectAverageMetrics(tests);

  return (
    <div className={`inline-block ${className}`}>
      {showCaption && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cuadro Promedio del Proyecto
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {metrics.validCount} elemento{metrics.validCount === 1 ? '' : 's'} evaluado{metrics.validCount === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Tabla integrada armoniosamente con el sistema de diseño de la aplicación */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="border-collapse text-xs sm:text-sm font-sans min-w-[270px] sm:min-w-[300px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <th className="font-semibold text-slate-600 dark:text-slate-300 px-3.5 py-2 text-left text-xs uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 select-none">
                Promedio
              </th>
              <th className="font-semibold text-slate-600 dark:text-slate-300 px-3.5 py-2 text-center text-xs uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 select-none w-24">
                Σ
              </th>
              <th className="font-bold text-sky-600 dark:text-sky-400 px-3.5 py-2 text-center text-xs uppercase tracking-wider select-none w-24">
                psi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {/* Fila 1: Resistencia (Suma y Promedio) */}
            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="text-slate-600 dark:text-slate-400 font-medium px-3.5 py-2.5 text-left border-r border-slate-200 dark:border-slate-800 capitalize">
                resistencia
              </td>
              <td className="text-slate-800 dark:text-slate-200 font-bold font-mono px-3.5 py-2.5 text-center border-r border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                {metrics.validCount > 0 ? metrics.sumPsi.toFixed(2) : '0.00'}
              </td>
              <td className="font-bold font-mono text-sky-600 dark:text-sky-400 px-3.5 py-2.5 text-center text-xs sm:text-sm">
                {metrics.validCount > 0 ? metrics.avgPsi.toFixed(2) : '0.00'}
              </td>
            </tr>

            {/* Fila 2: % f'c especificado y Cumplimiento Global */}
            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="text-slate-600 dark:text-slate-400 font-medium px-3.5 py-2.5 text-left border-r border-slate-200 dark:border-slate-800">
                % f'c espec.
              </td>
              <td className="font-bold font-mono text-slate-800 dark:text-slate-200 px-3.5 py-2.5 text-center border-r border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                {metrics.hasDesign ? metrics.ratioFcEspec.toFixed(2) : 'N/A'}
              </td>
              <td className="px-3.5 py-2.5 text-center">
                {metrics.complianceLabel === 'SÍ' ? (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs tracking-wide">
                    SÍ
                  </span>
                ) : metrics.complianceLabel === 'NO' ? (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs tracking-wide">
                    NO
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-medium text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    N/A
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
