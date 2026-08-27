import React, { useState } from 'react';
import { Project, SclerometryTest } from '../types';
import { CURVE_MODEL_DESCRIPTIONS } from '../utils/sclerometryNorms';
import { generateSclerometryPDF } from '../utils/pdfGenerator';
import { generateLPSReportPDF } from '../utils/lpsPdfGenerator';
import { generateLPSWordDocument } from '../utils/lpsDocGenerator';
import { getLPSConfig } from '../utils/lpsConfig';
import { X, FileText, Download, Copy, Check, Printer, FileDown, Award, FileCode } from 'lucide-react';

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
  const [isGeneratingLpsPdf, setIsGeneratingLpsPdf] = useState(false);
  const [reportFormat, setReportFormat] = useState<'lps' | 'text' | 'csv'>('lps');

  const lpsConfig = getLPSConfig();

  if (!isOpen) return null;

  const testsCount = tests.length;
  const passedCount = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtfulCount = tests.filter(t => t.status === 'DUDOSO').length;
  const failedCount = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const diagnosticCount = tests.filter(t => t.status === 'DIAGNOSTICO').length;
  const invalidCount = tests.filter(t => t.status === 'INVALIDO').length;
  const testsWithDesign = tests.filter(t => t.fcDesignMpa > 0);
  const compliancePct = testsWithDesign.length > 0 ? Math.round((passedCount / testsWithDesign.length) * 100) : (diagnosticCount > 0 ? 100 : 0);

  const totalPsiSum = tests.reduce((acc, t) => acc + (t.estimatedFcPsi || 0), 0);
  const avgPsi = tests.length > 0 ? (totalPsiSum / tests.length) : 0;

  const handleExportLpsPDF = () => {
    try {
      setIsGeneratingLpsPdf(true);
      generateLPSReportPDF(project, tests);
    } catch (err) {
      console.error('Error generating LPS PDF:', err);
    } finally {
      setIsGeneratingLpsPdf(false);
    }
  };

  const handleExportLpsWordDoc = () => {
    const docHtml = generateLPSWordDocument(project, tests);
    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_LPS_Esclerometria_${project.code || 'PROYECTO'}_${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateLPSTextReport = (): string => {
    const dateObj = new Date();
    const monthsUpper = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const currentMonthYear = `${monthsUpper[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    let txt = `ENSAYO ESCLEROMETRÍA\n\n\n\n\n\n\n`;
    txt += `ENSAYO DE ESCLEROMETRÍA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA\n\n\n\n`;
    txt += `${lpsConfig.companyName}\n`;
    txt += `${lpsConfig.companySubtitle}\n\n\n\n`;
    txt += `${lpsConfig.city}\n`;
    txt += `        ${currentMonthYear}        \n\n\n\n`;
    txt += `TABLA DE CONTENIDO \n\n\n`;
    txt += `1. Tabla de contenido\n\n\n`;
    txt += `2.        INTRODUCCIÓN        3\n`;
    txt += `3.        OBJETIVO        3\n`;
    txt += `4.        ALCANCE        3\n`;
    txt += `5.        TÉRMINOS Y DEFINICIONES        3\n`;
    txt += `6.        NORMAS DE REFERENCIA        3\n`;
    txt += `7.        PROCEDIMIENTO        4\n`;
    txt += `8.        EQUIPO UTILIZADO        4\n`;
    txt += `9.        UBICACIÓN        5\n`;
    txt += `10.        DATOS OBTENIDOS EN CAMPO.        6\n`;
    txt += `11.        ANÁLISIS DE RESULTADOS        6\n`;
    txt += `12.        ANEXO 2. DATOS DE CAMPO.        8\n`;
    txt += `13.        ANEXO 3. CERTIFICADO DE CALIBRACIÓN.        9\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n`;
    txt += `2. INTRODUCCIÓN\n`;
    txt += `El presente informe está basado en la ejecución de los ensayos no destructivos al concreto, se ejecuta en ENSAYO DE ESCLEROMETRÍA PARA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA. Para evaluar su resistencia a compresión. Para estimar esta resistencia, el martillo de Schmidt o Esclerómetro se ha modificado convenientemente dando lugar a varios modelos. Su uso es muy frecuente dada la manejabilidad del aparato, pudiendo aplicarse sobre la zona a ensayar midiendo su resistencia al rebote. Para utilizar este método de ensayo para estimar la resistencia, es necesario establecer una relación entre la fuerza y el número de rebote para una mezcla de concreto y un aparato dado. La medida del rebótese correlaciona con la resistencia a compresión mediante un gráfico debido a Miller (1965) que contempla la densidad del elemento y la orientación del martillo respecto del plano ensayado.\n\n`;
    txt += `3. OBJETIVO\n`;
    txt += `Determinar la resistencia a compresión del hormigón ya sea en pilares, muros, vigas o algún elemento estructural elaborado en concreto.\n\n`;
    txt += `4. ALCANCE\n`;
    txt += `Determinar la resistencia del concreto existente, mediante una serie de repeticiones de golpes con el esclerómetro. Y así poder encontrar un valor por cada elemento estudiado.\n\n`;
    txt += `5. TÉRMINOS Y DEFINICIONES\n\n`;
    txt += `   * GOLPE: Un golpe es un impacto entre un cuerpo en movimiento y otro cuerpo, así como el efecto que produce.\n`;
    txt += `   * HORMIGÓN: El hormigón o concreto es un material compuesto empleado en construcción, formado esencialmente por un aglomerante (en la mayoría de las ocasiones cemento (generalmente cemento Portland) al que se añade partículas o fragmentos de un agregado (áridos, como grava, gravilla y arena) agua (hidratación) y aditivos.\n`;
    txt += `   * RESISTENCIA A COMPRESIÓN: La resistencia a la compresión simple es la característica mecánica principal del concreto. Se define como la capacidad para soportar una carga por unidad de área, y se expresa en términos de esfuerzo, generalmente en kg/cm2, MPa y con alguna frecuencia en libras por pulgada cuadrada (psi)\n\n`;
    txt += `6. NORMAS DE REFERENCIA\n\n`;
    txt += `   * ASTM C 805:1997: Standard test method for rebound number of hardened concretes\n`;
    txt += `   * NTP 339.181:2001: HORMIGÓN (CONCRETO). Método de ensayo para                determinar El número de rebote del concreto endurecido esclerómetro.\n`;
    txt += `   * MTC E 725 método de ensayo para determinar el número de rebote del concreto endurecido (esclerometría)\n\n`;
    txt += `7. PROCEDIMIENTO\n\n`;
    txt += `* Para la realización del ensayo se seleccionaron y prepara una zona de hormigón que cumpla con:\n`;
    txt += `* Zona de ensayo de aproximadamente 15 x15 cm.\n`;
    txt += `* Superficies lisas y sin recubrir (utilizar piedra abrasiva para eliminar impurezas en el concreto)\n`;
    txt += `* Se procederá hacer por lo menos 10 lecturas con el esclerómetro porcada elemento estudiado\n`;
    txt += `* La muestra debe contar con especificaciones mínimas para el ensayo:\n`;
    txt += `* Espesor mínimo 100 mm(4pulg)\n`;
    txt += `* Evitar las superficies de concreto que representan descascara miento alta porosidad.\n`;
    txt += `* Evitar superficies con terminados (ACABADOS)\n`;
    txt += `* El área de ensayo será de por lo menos 150 mm (6 pulgadas) de diámetro.\n`;
    txt += `* Las superficies de textura excesivamente suave o con mortero suelto deberán ser pulidas con la piedra abrasiva (excepto superficie lisa).\n`;
    txt += `* En superficies rugosas, contra placadas (tripley) secas y con presencia de carbonatación producen número de rebotes más altos.\n\n`;
    txt += `8. EQUIPO UTILIZADO\n`;
    txt += `   * Esclerómetro: El esclerómetro es un instrumento de medición analógico que sirve para determinar la resistencia del hormigón. Este esclerómetro usa el principio de medición Schmidt. En este principio de medición la energía cinética del esclerómetro impacta en el hormigón. El rebote resultante permite al esclerómetro determinar la resistencia del hormigón.\n`;
    txt += `   * Piedra abrasiva: Esta constituida por granos de carburo de silicio de tamaño medio o de algún otro material y textura similar.\n\n`;
    txt += `9. UBICACIÓN  \n\n`;
    txt += `   * Vista general edificación.  \n\n\n\n`;
    txt += `   10. DATOS OBTENIDOS EN CAMPO. \n`;
    txt += `   * ${project.name.toUpperCase()}  \n`;
    txt += `Promedios de resistencias encontradas, informe completo elementos estudiados individuales ver anexo (2).\n\n\n\n`;
    txt += `   11. ANÁLISIS DE RESULTADOS \n`;
    txt += `De los elementos estudiados se puede encontrar que la resistencia promedio es de ${avgPsi.toFixed(2)} Psi. \n\n\n\n`;
    txt += `ELABORO: \n\n\n\n\n\n\n\n\n\n\n\n`;
    txt += `--------------------------------------------------\n\n\n`;
    txt += `________________\n`;
    txt += `ANEXO 1. REGISTRO FOTOGRÁFICO \n\n\n\n\n\n`;
    txt += `   12. ANEXO 2. DATOS DE CAMPO.\n\n\n\n`;
    txt += `   13. ANEXO 3. CERTIFICADO DE CALIBRACIÓN.   \n\n\n\n\n\n`;
    txt += `${lpsConfig.address}\n`;
    txt += ` ${lpsConfig.phone}, Email: ${lpsConfig.email}\n`;

    return txt;
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
    if (reportFormat === 'lps') return generateLPSTextReport();
    if (reportFormat === 'text') return generateTextReport();
    return generateCSV();
  };

  const handleCopy = () => {
    const content = getCurrentContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (reportFormat === 'lps') {
      const content = generateLPSTextReport();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formato_LPS_Editable_${project.code || 'PROYECTO'}_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const isCsv = reportFormat === 'csv';
    const content = isCsv ? generateCSV() : generateTextReport();
    const mime = isCsv ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
    const ext = isCsv ? 'csv' : 'txt';
    const filename = `Informe_Esclerometria_${project.code}_${new Date().toISOString().slice(0, 10)}.${ext}`;

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
        <div className="bg-gradient-to-r from-red-50 via-white to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Informe y Dossier LPS Ingeniería S.A.S.
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formato editable y exportación oficial de ensayo de esclerometría en concreto endurecido
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
              onClick={() => setReportFormat('lps')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                reportFormat === 'lps'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Dossier LPS (Editable)</span>
            </button>
            <button
              onClick={() => setReportFormat('text')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                reportFormat === 'text'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              Informe Estándar (TXT)
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
            {/* LPS Engineering Dossier PDF Button */}
            <button
              onClick={handleExportLpsPDF}
              disabled={isGeneratingLpsPdf}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-red-600/30 transition cursor-pointer"
              title="Descargar Dossier Completo en Formato Oficial LPS INGENIERÍA S.A.S. (Portada, Tabla Contenido, Metodología, Ubicación, Matrices y Certificado)"
            >
              <Award className="h-4 w-4 text-amber-300" />
              <span>{isGeneratingLpsPdf ? 'Generando LPS...' : 'Descargar LPS (PDF)'}</span>
            </button>

            {/* LPS Engineering Word DOC Button */}
            <button
              onClick={handleExportLpsWordDoc}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition cursor-pointer"
              title="Descargar Documento Editable LPS para Microsoft Word (.doc) con tablas, encabezados y estilos"
            >
              <FileCode className="h-4 w-4 text-white" />
              <span>Descargar LPS (.DOC Word)</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Descargar Informe Técnico Estándar Compacto en PDF"
            >
              <FileDown className="h-4 w-4 text-emerald-400" />
              <span>{isGeneratingPdf ? 'Generando...' : 'PDF Estándar'}</span>
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
              <span>Descargar Texto</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto grow bg-slate-100 dark:bg-slate-950">
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
              onClick={handleExportLpsWordDoc}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Word LPS (.DOC)</span>
            </button>
            <button
              onClick={handleExportLpsPDF}
              disabled={isGeneratingLpsPdf}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>{isGeneratingLpsPdf ? 'Generando...' : 'PDF Oficial LPS'}</span>
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

