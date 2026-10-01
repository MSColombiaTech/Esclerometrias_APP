import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, SclerometryTest } from '../types';
import { CURVE_MODEL_DESCRIPTIONS } from './sclerometryNorms';
import { calculateProjectAverageMetrics } from '../components/ProjectAverageTable';

export function generateSclerometryPDF(project: Project, tests: SclerometryTest[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const primaryColor: [number, number, number] = [14, 74, 110]; // slate-900 / dark sky
  const accentColor: [number, number, number] = [2, 132, 199];  // sky-600
  const lightBg: [number, number, number] = [248, 250, 252];    // slate-50
  const borderColor: [number, number, number] = [203, 213, 225]; // slate-300

  // Stats calculation
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtfulTests = tests.filter(t => t.status === 'DUDOSO').length;
  const failedTests = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const diagnosticTests = tests.filter(t => t.status === 'DIAGNOSTICO').length;
  const invalidTests = tests.filter(t => t.status === 'INVALIDO').length;
  const testsWithDesign = tests.filter(t => t.fcDesignMpa > 0);
  const compliancePct = testsWithDesign.length > 0 ? Math.round((passedTests / testsWithDesign.length) * 100) : 100;
  
  const reportCode = `INF-${project.code || 'OBRA'}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
  const dateStr = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // --- HEADER SECTION ---
  // Top Header colored bar
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INFORME TÉCNICO DE ENSAYOS DE ESCLEROMETRÍA', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text('Evaluación No Destructiva del Concreto Endurecido • NTC 3692 / ASTM C805 / NSR-10 C.5', margin + 6, y + 15);

  // Report code badge on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`CÓDIGO: ${reportCode}`, pageWidth - margin - 6, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 26;

  // --- PROJECT DETAILS & RESPONSIBLE PARTIES (2 BOXES) ---
  const boxWidth = (pageWidth - (margin * 2) - 4) / 2;
  const boxHeight = 44;

  // Box 1: Datos de la Obra
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFillColor(...accentColor);
  doc.rect(margin, y, 3, boxHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('1. INFORMACIÓN DE LA OBRA', margin + 6, y + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  
  let lineY = y + 14;
  const printRow = (label: string, value: string, xPos: number, yPos: number, maxWidth: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const split = doc.splitTextToSize(value || 'N/A', maxWidth);
    doc.text(split[0] || '', xPos + 22, yPos);
  };

  printRow('Obra:', project.name, margin + 6, lineY, boxWidth - 30);
  lineY += 6.5;
  printRow('Código:', project.code, margin + 6, lineY, boxWidth - 30);
  lineY += 6.5;
  printRow('Cliente:', project.client, margin + 6, lineY, boxWidth - 30);
  lineY += 6.5;
  printRow('Ubicación:', `${project.location || ''}, ${project.municipality} (${project.department})`, margin + 6, lineY, boxWidth - 30);

  // Box 2: Responsables y Equipo
  const box2X = margin + boxWidth + 4;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFillColor(16, 185, 129); // emerald accent
  doc.rect(box2X, y, 3, boxHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('2. RESPONSABLES Y EQUIPO', box2X + 6, y + 7);

  let line2Y = y + 14;
  printRow('Contratista:', project.contractor, box2X + 6, line2Y, boxWidth - 30);
  line2Y += 6.5;
  printRow('Interventoría:', project.supervision, box2X + 6, line2Y, boxWidth - 30);
  line2Y += 6.5;
  printRow('Especialista:', `${project.engineerInCharge} ${project.licenseNumber ? `(${project.licenseNumber})` : ''}`, box2X + 6, line2Y, boxWidth - 30);
  line2Y += 6.5;
  printRow('Equipo/Serial:', `${project.defaultHammerModel} (S/N: ${project.defaultHammerSerial || 'N/A'})`, box2X + 6, line2Y, boxWidth - 30);

  y += boxHeight + 4;

  // --- STATS KPI BANNER ---
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'FD');

  const statCols: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: 'TOTAL ENSAYOS', value: `${totalTests}`, color: [15, 23, 42] },
    { label: 'CONFORMES (>=95%)', value: `${passedTests}`, color: [5, 150, 105] },
    { label: 'ZONA DUDOSA (80-95%)', value: `${doubtfulTests}`, color: [217, 119, 6] },
    { label: 'NO CONFORME (<80%)', value: `${failedTests}`, color: [225, 29, 72] },
    { label: diagnosticTests > 0 ? 'DIAGNÓSTICO IN-SITU' : 'ÍNDICE CONFORMIDAD', value: diagnosticTests > 0 ? `${diagnosticTests}` : `${compliancePct}%`, color: diagnosticTests > 0 ? [2, 132, 199] : (compliancePct >= 90 ? [5, 150, 105] : [217, 119, 6]) }
  ];

  const colWidth = (pageWidth - (margin * 2)) / statCols.length;
  statCols.forEach((col, idx) => {
    const cx = margin + (idx * colWidth) + (colWidth / 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(col.label, cx, y + 5.5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(col.color[0], col.color[1], col.color[2]);
    doc.text(col.value, cx, y + 12, { align: 'center' });

    if (idx > 0) {
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin + (idx * colWidth), y + 2, margin + (idx * colWidth), y + 14);
    }
  });

  y += 20;

  // --- SUMMARY TABLE OF TESTS (autoTable) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('3. RESUMEN DE RESULTADOS DE ESCLEROMETRÍA (NTC 3692)', margin, y);
  y += 3;

  const tableHead = [
    ['#', 'Elemento / Tipo', 'Nivel / Eje', "f'c Dis.\n(PSI)", 'Ángulo', 'R Crudo', 'ΔR', 'R Corr.', "f'c Est.\n(PSI)", "f'c Est.\n(MPa)", '% Cumpl.', 'Estado NTC']
  ];

  const tableBody = tests.map((t, index) => {
    const angleText = t.impactAngle === 0 
      ? '0° (Horiz.)' 
      : t.impactAngle === 90 
      ? '+90° (Arriba)' 
      : t.impactAngle === -90 
      ? '-90° (Abajo)' 
      : t.impactAngle === 45
      ? '+45° (Arriba)'
      : t.impactAngle === -45
      ? '-45° (Abajo)'
      : `${t.impactAngle > 0 ? `+${t.impactAngle}` : t.impactAngle}°`;
    const fcDesignText = (t.fcDesignPsi && t.fcDesignPsi > 0) ? `${t.fcDesignPsi}` : (t.fcDesignMpa > 0 ? `${Math.round(t.fcDesignMpa * 145.038)}` : 'N/A');
    const complianceText = (t.fcDesignMpa > 0 || (t.fcDesignPsi && t.fcDesignPsi > 0)) ? `${t.complianceRatio}%` : 'N/A';
    const statusText = t.status === 'DIAGNOSTICO' ? 'DIAGNÓSTICO' : t.status;

    return [
      (index + 1).toString(),
      `${t.elementTag}\n(${t.elementType})`,
      t.levelAxis || 'N/A',
      fcDesignText,
      angleText,
      `${t.meanRaw}`,
      t.correctionAngle >= 0 ? `+${t.correctionAngle}` : `${t.correctionAngle}`,
      `${t.meanCorrected}`,
      `${t.estimatedFcPsi?.toLocaleString() || t.estimatedFcPsi}`,
      `${t.estimatedFcMpa}`,
      complianceText,
      statusText
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [14, 74, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 20 },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: [2, 132, 199] },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
      11: { cellWidth: 19, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowData = tests[data.row.index];
        if (!rowData) return;

        // Colorize status column
        if (data.column.index === 11) {
          if (rowData.status === 'CUMPLE') {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (rowData.status === 'DUDOSO') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fillColor = [254, 243, 199];
          } else if (rowData.status === 'NO_CUMPLE') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fillColor = [255, 241, 242];
          } else if (rowData.status === 'DIAGNOSTICO') {
            data.cell.styles.textColor = [2, 132, 199];
            data.cell.styles.fillColor = [240, 249, 255];
          } else {
            data.cell.styles.textColor = [100, 116, 139];
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      }
    }
  });

  // Get current Y position after autoTable
  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- CUADRO PROMEDIO DEL PROYECTO COMPLETO (EXACTO DEL FORMATO DE CONTROL) ---
  const projMetrics = calculateProjectAverageMetrics(tests);
  
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('3.1 CUADRO PROMEDIO DEL PROYECTO COMPLETO (RESISTENCIA GLOBAL)', margin, currentY);
  currentY += 2.5;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    tableWidth: 80,
    margin: { left: margin },
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255]
    },
    body: [
      [
        { content: 'Promedio', styles: { fontStyle: 'bold', halign: 'left', textColor: [0, 0, 0] } },
        { content: 'Σ', styles: { fontStyle: 'bold', halign: 'center', textColor: [0, 0, 0] } },
        { content: 'psi', styles: { fontStyle: 'bold', halign: 'center', textColor: [220, 38, 38] } }
      ],
      [
        { content: 'resistencia', styles: { fontStyle: 'normal', halign: 'left', textColor: [0, 0, 0] } },
        { content: projMetrics.validCount > 0 ? projMetrics.sumPsi.toFixed(2) : '0.00', styles: { fontStyle: 'bold', halign: 'center', textColor: [0, 0, 0] } },
        { content: projMetrics.validCount > 0 ? projMetrics.avgPsi.toFixed(2) : '0.00', styles: { fontStyle: 'bold', halign: 'center', textColor: [220, 38, 38] } }
      ],
      [
        { content: "% f'c espec.", styles: { fontStyle: 'normal', halign: 'left', textColor: [0, 0, 0] } },
        { content: projMetrics.hasDesign ? projMetrics.ratioFcEspec.toFixed(2) : 'N/A', styles: { fontStyle: 'bold', halign: 'center', textColor: [220, 38, 38] } },
        { content: projMetrics.complianceLabel, styles: { fontStyle: 'bold', halign: 'center', textColor: [220, 38, 38] } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- DETAILED READINGS (1 TO 10 IMPACTS) MATRIX TABLE ---
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('4. REGISTRO DETALLADO DE IMPACTOS INDIVIDUALES (1 A 10) Y ESTADÍSTICA DE CAMPO', margin, currentY);
  currentY += 3;

  const detailHead = [
    ['#', 'Elemento', 'Nivel/Eje', 'Áng.', 'I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6', 'I-7', 'I-8', 'I-9', 'I-10', 'Prom.', 'Rc', 'f\'c (PSI)', 'CV%', 'Val.']
  ];

  const detailBody = tests.map((t, index) => {
    const r = t.readings || [];
    const validCount = 10 - (t.excludedIndices?.length || 0);

    return [
      (index + 1).toString(),
      t.elementTag,
      t.levelAxis || 'N/A',
      `${t.impactAngle > 0 ? `+${t.impactAngle}` : t.impactAngle}°`,
      r[0] !== undefined ? `${r[0]}${t.excludedIndices?.includes(0) ? '*' : ''}` : '-',
      r[1] !== undefined ? `${r[1]}${t.excludedIndices?.includes(1) ? '*' : ''}` : '-',
      r[2] !== undefined ? `${r[2]}${t.excludedIndices?.includes(2) ? '*' : ''}` : '-',
      r[3] !== undefined ? `${r[3]}${t.excludedIndices?.includes(3) ? '*' : ''}` : '-',
      r[4] !== undefined ? `${r[4]}${t.excludedIndices?.includes(4) ? '*' : ''}` : '-',
      r[5] !== undefined ? `${r[5]}${t.excludedIndices?.includes(5) ? '*' : ''}` : '-',
      r[6] !== undefined ? `${r[6]}${t.excludedIndices?.includes(6) ? '*' : ''}` : '-',
      r[7] !== undefined ? `${r[7]}${t.excludedIndices?.includes(7) ? '*' : ''}` : '-',
      r[8] !== undefined ? `${r[8]}${t.excludedIndices?.includes(8) ? '*' : ''}` : '-',
      r[9] !== undefined ? `${r[9]}${t.excludedIndices?.includes(9) ? '*' : ''}` : '-',
      `${t.meanRaw}`,
      `${t.meanCorrected}`,
      `${t.estimatedFcPsi?.toLocaleString() || t.estimatedFcPsi}`,
      `${t.cov || 0}%`,
      `${validCount}/10`
    ];
  });

  autoTable(doc, {
    head: detailHead,
    body: detailBody,
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6.5
    },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 20, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 16, halign: 'left' },
      3: { cellWidth: 10 },
      4: { cellWidth: 7 },
      5: { cellWidth: 7 },
      6: { cellWidth: 7 },
      7: { cellWidth: 7 },
      8: { cellWidth: 7 },
      9: { cellWidth: 7 },
      10: { cellWidth: 7 },
      11: { cellWidth: 7 },
      12: { cellWidth: 7 },
      13: { cellWidth: 7 },
      14: { cellWidth: 10, fontStyle: 'bold' },
      15: { cellWidth: 10, fontStyle: 'bold', fillColor: [241, 245, 249] },
      16: { cellWidth: 16, fontStyle: 'bold', textColor: [2, 132, 199] },
      17: { cellWidth: 10 },
      18: { cellWidth: 10, fontStyle: 'bold', textColor: [5, 150, 105] }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Check if we need page break for conclusion & signatures
  if (finalY > pageHeight - 65) {
    doc.addPage();
    finalY = 16;
  }

  // --- METHODOLOGY & NORMATIVE DICTAMEN ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('5. CRITERIOS TÉCNICOS Y RECOMENDACIONES NORMATIVAS (NSR-10 / NTC 3692)', margin + 4, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  const notesText = [
    '• METODOLOGÍA: Se efectuaron 10 impactos por punto de ensayo según NTC 3692. Se aplicó descarte automático a lecturas con desviación > 6 unidades.',
    '• CONFORMIDAD: Elementos en estado CUMPLE registran resistencia estimada >= 95% del f\'c de diseño, indicando adecuada calidad superficial.',
    '• ZONA DUDOSA (NSR-10 C.5.6.5): Elementos entre 80% y 95% del f\'c requieren verificación mediante núcleos diamantados (NTC 3658 / ASTM C42).',
    '• NO CONFORMIDAD: Elementos con <80% del f\'c deben ser evaluados de inmediato por el Ingeniero Diseñador Estructural de la edificación.'
  ];

  notesText.forEach((note, nIdx) => {
    doc.text(note, margin + 4, finalY + 10 + (nIdx * 4));
  });

  finalY += 32;

  // --- SIGNATURES SECTION ---
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 20;
  }

  const sigWidth = (pageWidth - (margin * 2) - 20) / 2;
  
  // Signature 1: Especialista
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(margin + 10, finalY + 16, margin + 10 + sigWidth, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(project.engineerInCharge || 'Ingeniero Especialista', margin + 10 + (sigWidth / 2), finalY + 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ingeniero Especialista Responsable`, margin + 10 + (sigWidth / 2), finalY + 24, { align: 'center' });
  if (project.licenseNumber) {
    doc.text(`Matrícula COPNIA: ${project.licenseNumber}`, margin + 10 + (sigWidth / 2), finalY + 28, { align: 'center' });
  }

  // Signature 2: Interventoría / Supervisión
  const sig2X = margin + 10 + sigWidth + 20;
  doc.line(sig2X, finalY + 16, sig2X + sigWidth, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(project.supervision || 'Interventoría Técnica', sig2X + (sigWidth / 2), finalY + 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Supervisión Técnica / Interventoría de Obra', sig2X + (sigWidth / 2), finalY + 24, { align: 'center' });
  doc.text('Aprobación y Recibido', sig2X + (sigWidth / 2), finalY + 28, { align: 'center' });

  // --- FOOTER FOR ALL PAGES ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    
    // Bottom line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      `Esclerometría Pro Colombia • Software de Evaluación NTC 3692 / ASTM C805 / NSR-10 • Obra: ${project.name}`,
      margin,
      pageHeight - 6.5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  // Save the PDF
  const filename = `Informe_Esclerometria_${project.code || 'OBRA'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
