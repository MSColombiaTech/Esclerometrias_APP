import * as XLSX from 'xlsx';
import { Project, SclerometryTest } from '../types';

export function exportProjectToExcel(project: Project, tests: SclerometryTest[]) {
  const wb = XLSX.utils.book_new();

  // 1. Hoja de Resumen de Proyecto
  const summaryData = [
    ['INFORME TÉCNICO DE ENSAYOS DE ESCLEROMETRÍA (NTC 3692 / NSR-10)'],
    ['Generado por Esclerometría Pro Colombia', '', '', '', 'Fecha:', new Date().toLocaleDateString('es-CO')],
    [],
    ['DATOS GENERALES DEL PROYECTO'],
    ['Código de Obra:', project.code, 'Fecha de Creación:', new Date(project.createdAt).toLocaleDateString('es-CO')],
    ['Nombre del Proyecto:', project.name],
    ['Cliente / Propietario:', project.client],
    ['Ubicación:', project.location],
    ['Municipio / Depto:', `${project.municipality}, ${project.department}`],
    ['Empresa Contratista:', project.contractor],
    ['Interventoría / Supervisión:', project.supervision],
    ['Ingeniero Responsable:', project.engineerInCharge, 'Matrícula Prof:', project.licenseNumber || 'N/A'],
    ['Equipo Esclerómetro:', project.defaultHammerModel, 'Serial:', project.defaultHammerSerial],
    [],
    ['RESUMEN ESTADÍSTICO DE CONTROL DE CALIDAD'],
    ['Total de Elementos Ensayados:', tests.length],
    ['Elementos Conformes (CUMPLE):', tests.filter(t => t.status === 'CUMPLE').length],
    ['Elementos en Zona Dudosa (80-95%):', tests.filter(t => t.status === 'DUDOSO').length],
    ['Elementos No Conformes (<80%):', tests.filter(t => t.status === 'NO_CUMPLE').length],
    ['Ensayos Inválidos por Dispersión:', tests.filter(t => t.status === 'INVALIDO').length],
    ['Tasa de Cumplimiento Global (%):', tests.length > 0 ? ((tests.filter(t => t.status === 'CUMPLE').length / tests.length) * 100).toFixed(1) + '%' : '0%'],
    [],
    ['NORMATIVA APLICABLE:'],
    ['- NTC 3692: Método de ensayo para determinación del número de rebote del concreto endurecido (ASTM C805).'],
    ['- NSR-10: Reglamento Colombiano de Construcción Sismo Resistente - Título C (Concreto Estructural).'],
    ['- NTC 3658 / ASTM C42: Criterio para extracción y ensayo de núcleos diamantados en zonas dudosas.']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Proyecto');

  // 2. Hoja de Detalle de Ensayos
  const testsHeader = [
    'Item',
    'Código Elemento',
    'Tipo de Elemento',
    'Nivel / Eje / Ubicación',
    'f\'c Diseño (MPa)',
    'f\'c Diseño (PSI)',
    'Edad (días)',
    'Ángulo (α)',
    'Condición Superficie',
    'R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'R-6', 'R-7', 'R-8', 'R-9', 'R-10', 'R-11', 'R-12',
    'Lecturas Descartadas (>6)',
    'Rebote Promedio (R crudo)',
    'Corrección Ángulo (ΔR)',
    'Rebote Corregido (R corr)',
    'Desv. Estándar (s)',
    'Coef. Variación (CV %)',
    'f\'c Estimado (MPa)',
    'f\'c Estimado (kg/cm²)',
    'f\'c Estimado (PSI)',
    '% Cumplimiento',
    'Estado / Veredicto',
    'Observaciones Técnicas',
    'Operador / Técnico',
    'Fecha de Ensayo'
  ];

  const testsRows = tests.map((t, idx) => {
    const r12 = [...t.readings];
    while (r12.length < 12) r12.push(0);

    const discardedStr = t.excludedIndices.length > 0 
      ? t.excludedIndices.map(i => `Imp-${i+1} (${t.readings[i]})`).join(', ') 
      : 'Ninguno';

    return [
      idx + 1,
      t.elementTag,
      t.elementType,
      t.levelAxis,
      t.fcDesignMpa,
      t.fcDesignPsi,
      t.concreteAgeDays,
      `${t.impactAngle}°`,
      t.surfaceCondition,
      r12[0] || '', r12[1] || '', r12[2] || '', r12[3] || '', r12[4] || '', 
      r12[5] || '', r12[6] || '', r12[7] || '', r12[8] || '', r12[9] || '', 
      r12[10] || '', r12[11] || '',
      discardedStr,
      t.meanRaw,
      t.correctionAngle,
      t.meanCorrected,
      t.stdDev,
      `${t.cov}%`,
      t.estimatedFcMpa,
      t.estimatedFcKgcm2,
      t.estimatedFcPsi,
      `${t.complianceRatio}%`,
      t.status,
      t.statusNotes + (t.notes ? ` | Nota: ${t.notes}` : ''),
      t.operatorName,
      new Date(t.createdAt).toLocaleDateString('es-CO') + ' ' + new Date(t.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    ];
  });

  const wsTests = XLSX.utils.aoa_to_sheet([testsHeader, ...testsRows]);
  
  // Set column widths
  const colWidths = [
    { wch: 6 }, // Item
    { wch: 16 }, // Elemento
    { wch: 18 }, // Tipo
    { wch: 22 }, // Nivel Eje
    { wch: 14 }, // fc mpa
    { wch: 14 }, // fc psi
    { wch: 10 }, // edad
    { wch: 10 }, // angulo
    { wch: 22 }, // condicion
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 6 },
    { wch: 24 }, // descartes
    { wch: 14 }, // R crudo
    { wch: 12 }, // Delta R
    { wch: 14 }, // R corr
    { wch: 10 }, // s
    { wch: 12 }, // CV%
    { wch: 14 }, // fc Mpa
    { wch: 16 }, // fc kgcm2
    { wch: 14 }, // fc psi
    { wch: 14 }, // % cumplimiento
    { wch: 14 }, // Estado
    { wch: 35 }, // Observaciones
    { wch: 18 }, // Operador
    { wch: 18 }  // Fecha
  ];
  wsTests['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsTests, 'Registro de Ensayos');

  // 3. Hoja de Curva de Calibración
  const curveHeader = ['Número de Rebote R (Corregido)', 'f\'c NTC 3692 / Proceq Tipo N (MPa)', 'f\'c (kg/cm²)', 'f\'c (PSI)', 'f\'c NSR-10 Agregados Col (MPa)'];
  const curveRows = [];
  for (let r = 18; r <= 55; r++) {
    const fcProceq = Number((0.0436 * Math.pow(r, 2.052)).toFixed(2));
    const fcNSR10 = Number((0.0385 * Math.pow(r, 2.085)).toFixed(2));
    curveRows.push([
      r,
      fcProceq,
      Number((fcProceq * 10.197).toFixed(1)),
      Math.round(fcProceq * 145.038),
      fcNSR10
    ]);
  }
  const wsCurve = XLSX.utils.aoa_to_sheet([curveHeader, ...curveRows]);
  XLSX.utils.book_append_sheet(wb, wsCurve, 'Curva Calibración NTC 3692');

  // Generate and download
  const cleanCode = project.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Esclerometria_NTC3692_${cleanCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
