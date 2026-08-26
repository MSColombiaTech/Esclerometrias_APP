import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, SclerometryTest } from '../types';

export function exportProjectToPDF(project: Project, tests: SclerometryTest[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [14, 135, 235]; // Brand blue
  const darkColor = [30, 41, 59];

  // Header Banner
  doc.setFillColor(14, 43, 74);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME TÉCNICO DE ESCLEROMETRÍA EN CONCRETO', 14, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CONTROL DE CALIDAD NO DESTRUCTIVO - NORMATIVA COLOMBIANA NTC 3692 / NSR-10 / ASTM C805', 14, 18);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - 14, 18, { align: 'right' });

  // Project Info Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 30, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA OBRA / PROYECTO', 18, 36);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Column 1
  doc.text(`Proyecto: ${project.name}`, 18, 42);
  doc.text(`Código: ${project.code}`, 18, 47);
  doc.text(`Cliente: ${project.client}`, 18, 52);
  doc.text(`Ubicación: ${project.location} (${project.municipality}, ${project.department})`, 18, 57);
  doc.text(`Contratista: ${project.contractor}`, 18, 62);

  // Column 2
  const col2X = pageWidth / 2 + 10;
  doc.text(`Interventoría: ${project.supervision}`, col2X, 42);
  doc.text(`Ing. Responsable: ${project.engineerInCharge}`, col2X, 47);
  doc.text(`Matrícula / TP: ${project.licenseNumber || 'N/A'}`, col2X, 52);
  doc.text(`Equipo: ${project.defaultHammerModel} (S/N: ${project.defaultHammerSerial})`, col2X, 57);
  doc.text(`Curva Base: NTC 3692 / Tipo N Estándar`, col2X, 62);

  // Summary Metrics Banner
  const total = tests.length;
  const complies = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtful = tests.filter(t => t.status === 'DUDOSO').length;
  const fails = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const invalid = tests.filter(t => t.status === 'INVALIDO').length;
  const complianceRate = total > 0 ? ((complies / total) * 100).toFixed(1) : '0';

  let currentY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RESUMEN DE EVALUACIÓN DE ELEMENTOS ESTRUCTURALES', 14, currentY);

  // Summary Stats Boxes
  const boxW = (pageWidth - 28 - 12) / 4;
  const metrics = [
    { label: 'Total Ensayos', val: `${total}`, color: [71, 85, 105] },
    { label: 'Conformes', val: `${complies} (${complianceRate}%)`, color: [22, 163, 74] },
    { label: 'Zona Dudosa', val: `${doubtful}`, color: [217, 119, 6] },
    { label: 'No Conformes', val: `${fails}`, color: [220, 38, 38] },
  ];

  metrics.forEach((m, i) => {
    const bx = 14 + i * (boxW + 4);
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.roundedRect(bx, currentY + 3, boxW, 14, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, bx + boxW / 2, currentY + 8, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(m.val, bx + boxW / 2, currentY + 14, { align: 'center' });
  });

  currentY += 22;

  // Table of Tests
  const tableData = tests.map((t, idx) => [
    idx + 1,
    t.elementTag,
    t.elementType,
    t.levelAxis,
    `${t.impactAngle}°`,
    t.meanRaw.toFixed(1),
    t.meanCorrected.toFixed(1),
    `${t.fcDesignMpa} MPa`,
    `${t.estimatedFcMpa} MPa\n(${t.estimatedFcPsi} psi)`,
    `${t.complianceRatio}%`,
    t.status
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#', 'Elemento', 'Tipo', 'Nivel / Eje', 'Ángulo', 'R Crudo', 'R Corr', 'f\'c Diseño', 'f\'c Estimado', '% Cumpl.', 'Estado'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 43, 74],
      textColor: [255, 255, 255],
      fontSize: 7,
      halign: 'center',
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 16 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 14 },
      10: { halign: 'center', fontStyle: 'bold', cellWidth: 16 }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 10) {
        const val = data.cell.raw;
        if (val === 'CUMPLE') {
          data.cell.styles.textColor = [22, 163, 74];
        } else if (val === 'DUDOSO') {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (val === 'NO_CUMPLE') {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer & Signatures
  // @ts-ignore
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
  if (finalY > 240) {
    doc.addPage();
    finalY = 25;
  }

  // Legal Norms Footnote
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Nota Técnica: La esclerometría es un ensayo no destructivo de dureza superficial según NTC 3692. ' +
    'De acuerdo con NSR-10 Capítulo C.5, los valores de rebote estiman la uniformidad y resistencia relativa. ' +
    'En elementos en zona dudosa o no conformes, se requiere confirmación mediante extracción de testigos diamantados (NTC 3658 / ASTM C42).',
    14, finalY, { maxWidth: pageWidth - 28 }
  );

  // Signatures Area
  const sigY = finalY + 18;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY + 15, 80, sigY + 15);
  doc.line(pageWidth - 80, sigY + 15, pageWidth - 20, sigY + 15);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INGENIERO RESPONSABLE / ESPECIALISTA', 50, sigY + 20, { align: 'center' });
  doc.text(`${project.engineerInCharge}`, 50, sigY + 24, { align: 'center' });
  doc.text(`T.P. No. ${project.licenseNumber || 'En trámite'}`, 50, sigY + 28, { align: 'center' });

  doc.text('SUPERVISIÓN TÉCNICA / INTERVENTORÍA', pageWidth - 50, sigY + 20, { align: 'center' });
  doc.text(`${project.supervision}`, pageWidth - 50, sigY + 24, { align: 'center' });
  doc.text('Firma y Sello de Aprobación', pageWidth - 50, sigY + 28, { align: 'center' });

  // Photo Appendix if there are photos
  const testsWithPhotos = tests.filter(t => t.photos && t.photos.length > 0);
  if (testsWithPhotos.length > 0) {
    doc.addPage();
    doc.setFillColor(14, 43, 74);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ANEXO FOTOGRÁFICO DE PRUEBAS EN CAMPO', 14, 11);

    let photoY = 24;
    let photoCount = 0;

    testsWithPhotos.forEach((t) => {
      t.photos.forEach((photo) => {
        if (photoCount > 0 && photoCount % 4 === 0) {
          doc.addPage();
          photoY = 20;
        }

        const col = photoCount % 2;
        const row = Math.floor((photoCount % 4) / 2);
        const imgX = 14 + col * (pageWidth / 2 - 10);
        const imgY = photoY + row * 65;

        try {
          doc.addImage(photo.dataUrl, 'JPEG', imgX, imgY, 82, 50);
          doc.setFillColor(241, 245, 249);
          doc.rect(imgX, imgY + 50, 82, 10, 'F');
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(`Elemento: ${t.elementTag} (${t.elementType})`, imgX + 2, imgY + 54);
          doc.setFont('helvetica', 'normal');
          doc.text(`R corr: ${t.meanCorrected} | f'c: ${t.estimatedFcMpa} MPa | ${new Date(photo.timestamp).toLocaleDateString('es-CO')}`, imgX + 2, imgY + 58);
        } catch (e) {
          console.error('Error adding photo to PDF', e);
        }

        photoCount++;
      });
    });
  }

  // Save PDF
  const cleanCode = project.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Informe_Esclerometria_NTC3692_${cleanCode}.pdf`);
}
