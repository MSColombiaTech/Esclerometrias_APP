import React, { useState } from 'react';
import { Project, SclerometryTest } from '../types';
import { CURVE_MODEL_DESCRIPTIONS } from '../utils/sclerometryNorms';
import { generateSclerometryPDF } from '../utils/pdfGenerator';
import { downloadStandardWordDocument } from '../utils/docGenerator';
import { ProjectAverageTable, calculateProjectAverageMetrics } from './ProjectAverageTable';
import { X, FileText, Download, Copy, Check, Printer, FileDown, FileCode } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tests: SclerometryTest[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  project,
  tests
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportFormat, setReportFormat] = useState<'text' | 'csv'>('text');

  if (!isOpen) return null;

  const testsCount = tests.length;
  const passedCount = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtfulCount = tests.filter(t => t.status === 'DUDOSO').length;
  const failedCount = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const diagnosticCount = tests.filter(t => t.status === 'DIAGNOSTICO').length;
  const invalidCount = tests.filter(t => t.status === 'INVALIDO').length;
  const testsWithDesign = tests.filter(t => t.fcDesignMpa > 0 || (t.fcDesignPsi && t.fcDesignPsi > 0));
  const compliancePct = testsWithDesign.length > 0 ? Math.round((passedCount / testsWithDesign.length) * 100) : (diagnosticCount > 0 ? 100 : 0);

  const totalPsiSum = tests.reduce((acc, t) => acc + (t.estimatedFcPsi || 0), 0);
  const avgPsi = tests.length > 0 ? (totalPsiSum / tests.length) : 0;
  const avgMpa = avgPsi * 0.00689476;

  const handleExportStandardWordDoc = () => {
    downloadStandardWordDocument(project, tests);
  };

  const generateTextReport = (): string => {
    const dateStr = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let sb = '';
    sb += '================================================================================\n';
    sb += '        INFORME TÉCNICO DE ENSAYOS DE ESCLEROMETRÍA EN CONCRETO ENDURECIDO       \n';
    sb += '           Normativa: NTC 3692 / ASTM C805 / NSR-10 Título C.5 (Colombia)        \n';
    sb += '================================================================================\n\n';
    sb += `FECHA DE EMISIÓN:      ${dateStr}\n`;
    sb += `CÓDIGO DE INFORME:     INF-${project.code}-${new Date().toISOString().slice(0, 10)}\n\n`;
    sb += '1. INFORMACIÓN GENERAL DE LA OBRA Y RESPONSABLES\n';
    sb += '--------------------------------------------------------------------------------\n';
    sb += `Proyecto / Estructura: ${project.name}\n`;
    sb += `Código de Proyecto:    ${project.code}\n`;
    sb += `Cliente / Propietario: ${project.client}\n`;
    sb += `Ubicación:             ${project.location}, ${project.municipality}, ${project.department}\n`;
    sb += `Contratista:           ${project.contractor}\n`;
    sb += `Interventoría:         ${project.supervision}\n`;
    sb += `Ingeniero Responsable: ${project.engineerInCharge} ${project.licenseNumber ? `(Mat. ${project.licenseNumber})` : ''}\n\n`;
    sb += '2. EQUIPO Y METODOLOGÍA DEL ENSAYO\n';
    sb += '--------------------------------------------------------------------------------\n';
    sb += `Equipo Empleado:       ${project.defaultHammerModel} (Serial: ${project.defaultHammerSerial})\n`;
    sb += `Energía de Impacto:    2.207 N·m (Martillo Schmidt Tipo N)\n`;
    sb += `Norma de Ensayo:       NTC 3692 (Método para determinar el número de rebote del concreto)\n`;
    sb += `Criterio Estadístico:  Mínimo 10 lecturas. Descarte automático de lecturas que difieran\n`;
    sb += `                       en más de 6 unidades respecto al promedio aritmético.\n`;
    sb += `                       Si se descartan >2 lecturas, el ensayo se anula según NTC 3692.\n`;
    sb += `Curva de Conversión:   ${CURVE_MODEL_DESCRIPTIONS[project.defaultCurve]?.name || 'Proceq Schmidt Tipo N'}\n\n`;
    sb += '3. RESUMEN ESTADÍSTICO DE RESULTADOS\n';
    sb += '--------------------------------------------------------------------------------\n';
    sb += `Total Elementos Ensayados: ${testsCount}\n`;
    if (testsWithDesign.length > 0) {
      sb += `• Conformes (CUMPLE >= 95%): ${passedCount} (${compliancePct}% de elementos con f'c)\n`;
      sb += `• En Zona Dudosa (80-95%):   ${doubtfulCount}\n`;
      sb += `• No Conformes (< 80%):       ${failedCount}\n`;
    }
    if (diagnosticCount > 0) {
      sb += `• Diagnóstico / In-Situ:     ${diagnosticCount} (Sin f'c de diseño especificado)\n`;
    }
    sb += `• Ensayos Anulados/Inválidos: ${invalidCount}\n\n`;

    const projMetrics = calculateProjectAverageMetrics(tests);
    sb += 'CUADRO PROMEDIO DEL PROYECTO COMPLETO (RESISTENCIA GLOBAL):\n';
    sb += '+--------------------+------------------+---------------+\n';
    sb += '| Promedio           |        Σ         |      psi      |\n';
    sb += '+--------------------+------------------+---------------+\n';
    sb += `| resistencia        | ${projMetrics.validCount > 0 ? projMetrics.sumPsi.toFixed(2).padStart(16, ' ') : '0.00'.padStart(16, ' ')} | ${(projMetrics.validCount > 0 ? projMetrics.avgPsi.toFixed(2) : '0.00').padStart(13, ' ')} |\n`;
    sb += '+--------------------+------------------+---------------+\n';
    sb += `| % f'c espec.       | ${(projMetrics.hasDesign ? projMetrics.ratioFcEspec.toFixed(2) : 'N/A').padStart(16, ' ')} | ${projMetrics.complianceLabel.padStart(13, ' ')} |\n`;
    sb += '+--------------------+------------------+---------------+\n\n';

    sb += '4. TABLA DETALLADA DE ELEMENTOS ENSAYADOS\n';
    sb += '--------------------------------------------------------------------------------\n';

    tests.forEach((t, i) => {
      sb += `[${i + 1}] Elemento: ${t.elementTag} (${t.elementType}) - ${t.levelAxis}\n`;
      if (t.fcDesignMpa > 0) {
        sb += `    f'c Diseño:       ${t.fcDesignPsi} PSI (${t.fcDesignMpa} MPa) | Edad: ${t.concreteAgeDays} días | Ángulo: ${t.impactAngle}°\n`;
      } else {
        sb += `    f'c Diseño:       Sin especificar (Evaluación Diagnóstica) | Edad: ${t.concreteAgeDays} días | Ángulo: ${t.impactAngle}°\n`;
      }
      sb += `    Lecturas (10):    ${t.readings.join(', ')}\n`;
      if (t.excludedIndices.length > 0) {
        sb += `    Descartes NTC:    ${t.excludedIndices.map(idx => `Impacto #${idx + 1} (${t.readings[idx]})`).join(', ')} (> 6 del promedio)\n`;
      } else {
        sb += `    Descartes NTC:    Ninguno (100% lecturas válidas dentro del rango)\n`;
      }
      sb += `    Estadística R:    R_crudo = ${t.meanRaw} | ΔR = ${t.correctionAngle} | R_corr = ${t.meanCorrected} | CV = ${t.cov}%\n`;
      sb += `    f'c Estimado:     ${t.estimatedFcPsi} PSI (${t.estimatedFcMpa} MPa / ${t.estimatedFcKgcm2} kg/cm²)\n`;
      if (t.fcDesignMpa > 0) {
        sb += `    Conformidad:      ${t.status} (${t.complianceRatio}% del f'c de diseño)\n`;
      } else {
        sb += `    Conformidad:      ${t.status} (In-Situ Puro)\n`;
      }
      sb += `    Dictamen:         ${t.statusNotes}\n\n`;
    });

    sb += '================================================================================\n';
    sb += '5. DICTAMEN NORMATIVO Y RECOMENDACIONES TÉCNICAS (NSR-10 / NTC 3692)\n';
    sb += '--------------------------------------------------------------------------------\n';
    sb += '1. CONFORMIDAD: Los elementos clasificados como CUMPLE demuestran homogeneidad y\n';
    sb += '   resistencia superficial coherente con el f\'c de diseño especificado.\n';
    sb += '2. ZONA DUDOSA: Para elementos en zona dudosa (80% <= f\'c < 95%), según NSR-10 C.5.6.5\n';
    sb += '   se recomienda corroborar mediante extracción de tres núcleos diamantados (NTC 3658 / ASTM C42)\n';
    sb += '   por cada zona en sospecha.\n';
    sb += '3. NO CONFORMIDAD: Los elementos clasificados como NO CUMPLE requieren evaluación\n';
    sb += '   estructural inmediata y revisión por parte del Ingeniero Diseñador Estructural.\n\n';
    sb += '__________________________________                __________________________________\n';
    sb += `   ${project.engineerInCharge}                       Interventoría / Supervisión Técnica\n`;
    sb += `   Ingeniero Especialista                          ${project.supervision}\n`;
    if (project.licenseNumber) sb += `   Matrícula: ${project.licenseNumber}\n`;
    sb += '================================================================================\n';

    return sb;
  };

  const generateCSV = (): string => {
    let csv = 'No,Elemento,Tipo,Nivel_Eje,fc_Diseno_MPa,fc_Diseno_PSI,Edad_Dias,Angulo,R_Crudo,Delta_R,R_Corregido,Desviacion_s,CV_Porc,fc_Estimado_MPa,fc_Estimado_PSI,fc_Estimado_Kgcm2,Cumplimiento_Porc,Estado,Descartes_Count,Operador\n';
    tests.forEach((t, i) => {
      csv += `${i + 1},"${t.elementTag}","${t.elementType}","${t.levelAxis}",${t.fcDesignMpa},${t.fcDesignPsi},${t.concreteAgeDays},${t.impactAngle},${t.meanRaw},${t.correctionAngle},${t.meanCorrected},${t.stdDev},${t.cov},${t.estimatedFcMpa},${t.estimatedFcPsi},${t.estimatedFcKgcm2},${t.complianceRatio},"${t.status}",${t.excludedIndices.length},"${t.operatorName}"\n`;
    });
    return csv;
  };

  const handleExportPDF = () => {
    try {
      setIsGeneratingPdf(true);
      generateSclerometryPDF(project, tests);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getCurrentContent = () => {
    if (reportFormat === 'csv') return generateCSV();
    return generateTextReport();
  };

  const handleCopy = () => {
    const content = getCurrentContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const isCsv = reportFormat === 'csv';
    const content = isCsv ? generateCSV() : generateTextReport();
    const mime = isCsv ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
    const ext = isCsv ? 'csv' : 'txt';
    const filename = `Informe_Esclerometria_${project.code || 'PROYECTO'}_${new Date().toISOString().slice(0, 10)}.${ext}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = getCurrentContent().replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
    printWindow.document.write(`
      <html>
        <head>
          <title>Informe Esclerometría - ${project.name}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 20px; line-height: 1.4; color: #000; }
          </style>
        </head>
        <body>
          <div>${content}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl text-slate-800 dark:text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Centro de Informes Técnicos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exportación oficial de ensayos de esclerometría en concreto endurecido (NTC 3692 / NSR-10)
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

        {/* Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Vista previa:</span>
            <button
              onClick={() => setReportFormat('text')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                reportFormat === 'text'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              Informe Técnico (TXT)
            </button>
            <button
              onClick={() => setReportFormat('csv')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                reportFormat === 'csv'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              Tabla Excel (CSV)
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Descargar Informe Técnico Oficial en PDF (NTC 3692)"
            >
              <FileDown className="h-4 w-4 text-emerald-400" />
              <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={handleExportStandardWordDoc}
              className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Descargar Informe Técnico en Formato Microsoft Word Editable (.doc)"
            >
              <FileCode className="h-4 w-4 text-sky-300" />
              <span>Descargar Word (.DOC)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar {reportFormat === 'csv' ? 'CSV' : 'TXT'}</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto grow bg-slate-100 dark:bg-slate-950 space-y-3">
          {/* Cuadro Promedio Visual */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Cuadro Promedio del Proyecto (Resistencia Global)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resumen analítico de resistencia requerida y promedio según NTC 3692 / NSR-10.
              </p>
            </div>
            <ProjectAverageTable tests={tests} showCaption={false} />
          </div>

          <pre className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-300 font-mono text-[11px] sm:text-xs whitespace-pre-wrap select-all leading-relaxed shadow-sm">
            {getCurrentContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <span className="text-slate-500 dark:text-slate-400">
            {testsCount} elementos incluidos • Resistencia promedio estimada: <b>{avgPsi.toFixed(2)} PSI</b> ({avgMpa.toFixed(1)} MPa)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportStandardWordDoc}
              className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5 text-sky-300" />
              <span>Word (.DOC)</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isGeneratingPdf ? 'Generando...' : 'PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

