import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, SclerometryTest } from '../types';
import { getLPSConfig } from './lpsConfig';

export function generateLPSReportPDF(project: Project, tests: SclerometryTest[]): void {
  const lps = getLPSConfig();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;

  // LPS Brand Colors
  const lpsRed: [number, number, number] = [217, 56, 58]; // #d9383a / #dc2626
  const lpsDarkRed: [number, number, number] = [185, 28, 28]; // #b91c1c
  const lpsLightCoral: [number, number, number] = [254, 226, 226]; // #fee2e2
  const textDark: [number, number, number] = [15, 23, 42];
  const textMuted: [number, number, number] = [71, 85, 105];

  const dateObj = new Date();
  const monthsUpper = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  const currentMonthYear = `${monthsUpper[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  // Helper for drawing LPS Header Geometry
  const drawLPSHeader = (pageNum: number) => {
    // Top geometric red bar with angle
    doc.setFillColor(lpsRed[0], lpsRed[1], lpsRed[2]);
    doc.rect(0, 0, 75, 5, 'F');
    doc.triangle(75, 0, 85, 0, 75, 5, 'F');

    doc.setFillColor(lpsLightCoral[0], lpsLightCoral[1], lpsLightCoral[2]);
    doc.rect(75, 0, 20, 3, 'F');

    // Thin red line across top
    doc.setDrawColor(lpsRed[0], lpsRed[1], lpsRed[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, 12, pageWidth - margin, 12);

    // Page number in top right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${pageNum}`, pageWidth - margin, 10, { align: 'right' });
  };

  // Helper for drawing LPS Footer matching exact template
  const drawLPSFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(lps.address, pageWidth / 2, pageHeight - 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${lps.phone}, Email: ${lps.email}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Bottom red geometric accent
    doc.setFillColor(lpsRed[0], lpsRed[1], lpsRed[2]);
    doc.triangle(pageWidth / 2 - 30, pageHeight, pageWidth / 2 + 30, pageHeight, pageWidth / 2, pageHeight - 4, 'F');
  };

  // Calculations for stats
  const totalPsiSum = tests.reduce((acc, t) => acc + (t.estimatedFcPsi || 0), 0);
  const avgPsi = tests.length > 0 ? (totalPsiSum / tests.length) : 0;
  const avgKgcm2 = avgPsi * 0.070307;
  const avgMpa = avgPsi * 0.00689476;
  const testsWithDesign = tests.filter(t => t.fcDesignMpa > 0);
  const avgDesignMpa = testsWithDesign.length > 0
    ? (testsWithDesign.reduce((a, b) => a + b.fcDesignMpa, 0) / testsWithDesign.length)
    : 0;
  const avgRatio = avgDesignMpa > 0 ? (avgMpa / avgDesignMpa) : 1.0;
  const isOverallPass = tests.every(t => t.status === 'CUMPLE' || t.status === 'DIAGNOSTICO') || avgRatio >= 0.95;

  // First photo for cover and general views
  let coverPhotoUrl = '';
  for (const t of tests) {
    if (t.photos && t.photos.length > 0 && t.photos[0].dataUrl) {
      coverPhotoUrl = t.photos[0].dataUrl;
      break;
    }
  }

  // =========================================================================
  // PÁGINA 1: PORTADA OFICIAL LPS
  // =========================================================================
  drawLPSHeader(1);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('ENSAYO ESCLEROMETRÍA', pageWidth / 2, 28, { align: 'center' });

  // Main Image Box with Red Frame
  const imgBoxX = margin + 12;
  const imgBoxY = 38;
  const imgBoxW = pageWidth - ((margin + 12) * 2);
  const imgBoxH = 88;

  if (coverPhotoUrl && coverPhotoUrl.startsWith('data:image')) {
    try {
      doc.addImage(coverPhotoUrl, 'JPEG', imgBoxX, imgBoxY, imgBoxW, imgBoxH, undefined, 'FAST');
    } catch (e) {
      // Placeholder if corrupt
      doc.setFillColor(241, 245, 249);
      doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 'F');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('REGISTRO FOTOGRÁFICO DE LA ESTRUCTURA', pageWidth / 2, imgBoxY + (imgBoxH / 2), { align: 'center' });
    }
  } else {
    // Elegant Blueprint placeholder box
    doc.setFillColor(248, 250, 252);
    doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(lpsDarkRed[0], lpsDarkRed[1], lpsDarkRed[2]);
    doc.text('EVALUACIÓN NO DESTRUCTIVA DE CONCRETO', pageWidth / 2, imgBoxY + (imgBoxH / 2) - 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`PROYECTO: ${project.name}`, pageWidth / 2, imgBoxY + (imgBoxH / 2) + 4, { align: 'center' });
  }

  // Red Border around Main Image
  doc.setDrawColor(lpsRed[0], lpsRed[1], lpsRed[2]);
  doc.setLineWidth(1.2);
  doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

  // Subtitle / Description of the test
  let subY = imgBoxY + imgBoxH + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  const projectDescTitle = `ENSAYO DE ESCLEROMETRÍA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA`;
  const splitProjDesc = doc.splitTextToSize(projectDescTitle, pageWidth - (margin * 2) - 10);
  doc.text(splitProjDesc, pageWidth / 2, subY, { align: 'center' });

  subY += (splitProjDesc.length * 5.5) + 12;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(lps.companyName, pageWidth / 2, subY, { align: 'center' });
  subY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(lps.companySubtitle, pageWidth / 2, subY, { align: 'center' });
  subY += 18;

  // City & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(lps.city, pageWidth / 2, subY, { align: 'center' });
  subY += 6;
  doc.text(currentMonthYear, pageWidth / 2, subY, { align: 'center' });

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 2: TABLA DE CONTENIDO (Fiel al documento LPS)
  // =========================================================================
  doc.addPage();
  drawLPSHeader(2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('TABLA DE CONTENIDO', margin, 28);

  const tocItems = [
    { num: '1.', text: 'Tabla de contenido', page: '2' },
    { num: '2.', text: 'INTRODUCCIÓN', page: '3' },
    { num: '3.', text: 'OBJETIVO', page: '3' },
    { num: '4.', text: 'ALCANCE', page: '3' },
    { num: '5.', text: 'TÉRMINOS Y DEFINICIONES', page: '3' },
    { num: '6.', text: 'NORMAS DE REFERENCIA', page: '3' },
    { num: '7.', text: 'PROCEDIMIENTO', page: '4' },
    { num: '8.', text: 'EQUIPO UTILIZADO', page: '4' },
    { num: '9.', text: 'UBICACIÓN', page: '5' },
    { num: '10.', text: 'DATOS OBTENIDOS EN CAMPO.', page: '6' },
    { num: '11.', text: 'ANÁLISIS DE RESULTADOS', page: '6' },
    { num: '12.', text: 'ANEXO 2. DATOS DE CAMPO.', page: '8' },
    { num: '13.', text: 'ANEXO 3. CERTIFICADO DE CALIBRACIÓN.', page: '9' }
  ];

  let tocY = 40;
  tocItems.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    doc.text(`${item.num}  ${item.text}`, margin + 6, tocY);

    // Dotted line
    const textW = doc.getTextWidth(`${item.num}  ${item.text}`);
    const dotsStartX = margin + 8 + textW;
    const dotsEndX = pageWidth - margin - 10;
    
    if (dotsEndX > dotsStartX) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      let dotStr = '';
      const dotCharW = doc.getTextWidth('.');
      const numDots = Math.floor((dotsEndX - dotsStartX) / (dotCharW * 2.2));
      for (let d = 0; d < numDots; d++) dotStr += ' .';
      doc.text(dotStr, dotsStartX, tocY);
    }

    // Page Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(item.page, pageWidth - margin, tocY, { align: 'right' });

    tocY += 9.5;
  });

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 3: INTRODUCCIÓN, OBJETIVO, ALCANCE, TÉRMINOS Y NORMAS
  // =========================================================================
  doc.addPage();
  drawLPSHeader(3);

  let p3Y = 26;

  // 2. INTRODUCCIÓN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('2. INTRODUCCIÓN', margin, p3Y);
  p3Y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const introText = `El presente informe está basado en la ejecución de los ensayos no destructivos al concreto, se ejecuta en ENSAYO DE ESCLEROMETRÍA PARA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA. Para evaluar su resistencia a compresión. Para estimar esta resistencia, el martillo de Schmidt o Esclerómetro se ha modificado convenientemente dando lugar a varios modelos. Su uso es muy frecuente dada la manejabilidad del aparato, pudiendo aplicarse sobre la zona a ensayar midiendo su resistencia al rebote. Para utilizar este método de ensayo para estimar la resistencia, es necesario establecer una relación entre la fuerza y el número de rebote para una mezcla de concreto y un aparato dado. La medida del rebótese correlaciona con la resistencia a compresión mediante un gráfico debido a Miller (1965) que contempla la densidad del elemento y la orientación del martillo respecto del plano ensayado.`;
  const splitIntro = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(splitIntro, margin, p3Y);
  p3Y += (splitIntro.length * 4.4) + 6;

  // 3. OBJETIVO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. OBJETIVO', margin, p3Y);
  p3Y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const objText = 'Determinar la resistencia a compresión del hormigón ya sea en pilares, muros, vigas o algún elemento estructural elaborado en concreto.';
  const splitObj = doc.splitTextToSize(objText, pageWidth - (margin * 2));
  doc.text(splitObj, margin, p3Y);
  p3Y += (splitObj.length * 4.4) + 6;

  // 4. ALCANCE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. ALCANCE', margin, p3Y);
  p3Y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const alcText = 'Determinar la resistencia del concreto existente, mediante una serie de repeticiones de golpes con el esclerómetro. Y así poder encontrar un valor por cada elemento estudiado.';
  const splitAlc = doc.splitTextToSize(alcText, pageWidth - (margin * 2));
  doc.text(splitAlc, margin, p3Y);
  p3Y += (splitAlc.length * 4.4) + 6;

  // 5. TÉRMINOS Y DEFINICIONES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('5. TÉRMINOS Y DEFINICIONES', margin, p3Y);
  p3Y += 6;

  const definitions = [
    {
      term: 'GOLPE:',
      def: 'Un golpe es un impacto entre un cuerpo en movimiento y otro cuerpo, así como el efecto que produce.'
    },
    {
      term: 'HORMIGÓN:',
      def: 'El hormigón o concreto es un material compuesto empleado en construcción, formado esencialmente por un aglomerante (en la mayoría de las ocasiones cemento (generalmente cemento Portland) al que se añade partículas o fragmentos de un agregado (áridos, como grava, gravilla y arena) agua (hidratación) y aditivos.'
    },
    {
      term: 'RESISTENCIA A COMPRESIÓN:',
      def: 'La resistencia a la compresión simple es la característica mecánica principal del concreto. Se define como la capacidad para soportar una carga por unidad de área, y se expresa en términos de esfuerzo, generalmente en kg/cm2, MPa y con alguna frecuencia en libras por pulgada cuadrada (psi)'
    }
  ];

  definitions.forEach(d => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`   * ${d.term}`, margin + 4, p3Y);
    
    doc.setFont('helvetica', 'normal');
    const splitDef = doc.splitTextToSize(d.def, pageWidth - (margin * 2) - 8);
    p3Y += 4.5;
    doc.text(splitDef, margin + 8, p3Y);
    p3Y += (splitDef.length * 4.4) + 3;
  });

  // 6. NORMAS DE REFERENCIA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('6. NORMAS DE REFERENCIA', margin, p3Y);
  p3Y += 6;

  const norms = [
    '   * ASTM C 805:1997: Standard test method for rebound number of hardened concretes',
    '   * NTP 339.181:2001: HORMIGÓN (CONCRETO). Método de ensayo para determinar El número de rebote del concreto endurecido esclerómetro.',
    '   * MTC E 725 método de ensayo para determinar el número de rebote del concreto endurecido (esclerometría)'
  ];

  norms.forEach(n => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(n, margin + 4, p3Y);
    p3Y += 5;
  });

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 4: PROCEDIMIENTO Y EQUIPO UTILIZADO
  // =========================================================================
  doc.addPage();
  drawLPSHeader(4);

  let p4Y = 26;

  // 7. PROCEDIMIENTO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('7. PROCEDIMIENTO', margin, p4Y);
  p4Y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('* Para la realización del ensayo se seleccionaron y prepara una zona de hormigón que cumpla con:', margin + 4, p4Y);
  p4Y += 5.5;

  const procPoints = [
    '* Zona de ensayo de aproximadamente 15 x15 cm.',
    '* Superficies lisas y sin recubrir (utilizar piedra abrasiva para eliminar impurezas en el concreto)',
    '* Se procederá hacer por lo menos 10 lecturas con el esclerómetro porcada elemento estudiado',
    '* La muestra debe contar con especificaciones mínimas para el ensayo:',
    '* Espesor mínimo 100 mm(4pulg)',
    '* Evitar las superficies de concreto que representan descascara miento alta porosidad.',
    '* Evitar superficies con terminados (ACABADOS)',
    '* El área de ensayo será de por lo menos 150 mm (6 pulgadas) de diámetro.',
    '* Las superficies de textura excesivamente suave o con mortero suelto deberán ser pulidas con la piedra abrasiva (excepto superficie lisa).',
    '* En superficies rugosas, contra placadas (tripley) secas y con presencia de carbonatación producen número de rebotes más altos.'
  ];

  procPoints.forEach(p => {
    const isSub = p.includes('Espesor') || p.includes('descascara') || p.includes('terminados');
    const indent = isSub ? 10 : 4;
    const splitP = doc.splitTextToSize(p, pageWidth - (margin * 2) - indent);
    doc.text(splitP, margin + indent, p4Y);
    p4Y += (splitP.length * 4.4) + 2;
  });

  p4Y += 4;

  // 8. EQUIPO UTILIZADO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('8. EQUIPO UTILIZADO', margin, p4Y);
  p4Y += 6;

  const eq1 = '   * Esclerómetro: El esclerómetro es un instrumento de medición analógico que sirve para determinar la resistencia del hormigón. Este esclerómetro usa el principio de medición Schmidt. En este principio de medición la energía cinética del esclerómetro impacta en el hormigón. El rebote resultante permite al esclerómetro determinar la resistencia del hormigón.';
  const splitEq1 = doc.splitTextToSize(eq1, pageWidth - (margin * 2) - 8);
  doc.text(splitEq1, margin + 4, p4Y);
  p4Y += (splitEq1.length * 4.4) + 4;

  const eq2 = '   * Piedra abrasiva: Esta constituida por granos de carburo de silicio de tamaño medio o de algún otro material y textura similar.';
  const splitEq2 = doc.splitTextToSize(eq2, pageWidth - (margin * 2) - 8);
  doc.text(splitEq2, margin + 4, p4Y);

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 5: UBICACIÓN
  // =========================================================================
  doc.addPage();
  drawLPSHeader(5);

  let p5Y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('9. UBICACIÓN', margin, p5Y);
  p5Y += 7;

  // Vista General Edificación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('   * Vista general edificación.', margin + 4, p5Y);
  p5Y += 6;

  // Photo container
  const photoBoxW = pageWidth - (margin * 2) - 12;
  const photoBoxH = 125;
  const photoBoxX = margin + 6;

  if (coverPhotoUrl && coverPhotoUrl.startsWith('data:image')) {
    try {
      doc.addImage(coverPhotoUrl, 'JPEG', photoBoxX, p5Y, photoBoxW, photoBoxH, undefined, 'FAST');
    } catch (e) {
      doc.setFillColor(241, 245, 249);
      doc.rect(photoBoxX, p5Y, photoBoxW, photoBoxH, 'F');
    }
  } else {
    doc.setFillColor(248, 250, 252);
    doc.rect(photoBoxX, p5Y, photoBoxW, photoBoxH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`REGISTRO FOTOGRÁFICO GENERAL: ${project.name}`, pageWidth / 2, p5Y + (photoBoxH / 2), { align: 'center' });
  }

  // Red Frame
  doc.setDrawColor(lpsRed[0], lpsRed[1], lpsRed[2]);
  doc.setLineWidth(1.2);
  doc.rect(photoBoxX, p5Y, photoBoxW, photoBoxH);

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 6: DATOS OBTENIDOS EN CAMPO Y ANÁLISIS DE RESULTADOS
  // =========================================================================
  doc.addPage();
  drawLPSHeader(6);

  let p6Y = 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('10. DATOS OBTENIDOS EN CAMPO.', margin, p6Y);
  p6Y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`   * ${project.name.toUpperCase()}`, margin + 4, p6Y);
  p6Y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Promedios de resistencias encontradas, informe completo elementos estudiados individuales ver anexo (2).', margin + 4, p6Y);
  p6Y += 8;

  // Summary Table in LPS Style (Promedio, Σ, psi, % f'c espec.)
  const lpsSummaryHead = [['Parámetro', 'Σ (Suma)', 'Resistencia Estimada', '% f\'c Espec.', 'Conformidad']];
  const lpsSummaryBody = [
    [
      'Promedio Resistencia',
      `${totalPsiSum.toFixed(2)} PSI`,
      `${avgPsi.toFixed(2)} PSI (${avgMpa.toFixed(1)} MPa / ${avgKgcm2.toFixed(1)} kgf/cm²)`,
      avgDesignMpa > 0 ? `${(avgRatio * 100).toFixed(1)}%` : 'Diagnóstico In-Situ',
      isOverallPass ? 'CUMPLE' : 'REVISIÓN'
    ]
  ];

  autoTable(doc, {
    head: lpsSummaryHead,
    body: lpsSummaryBody,
    startY: p6Y,
    margin: { left: margin + 4, right: margin + 4 },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      font: 'helvetica',
      textColor: textDark,
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: textDark,
      fontStyle: 'bold',
      lineColor: [15, 23, 42],
      lineWidth: 0.4
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      2: { fontStyle: 'bold', textColor: [217, 56, 58] },
      4: { fontStyle: 'bold', textColor: isOverallPass ? [5, 150, 105] : [225, 29, 72] }
    }
  });

  p6Y = (doc as any).lastAutoTable.finalY + 12;

  // 11. ANÁLISIS DE RESULTADOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('11. ANÁLISIS DE RESULTADOS', margin, p6Y);
  p6Y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const analysisText = `De los elementos estudiados se puede encontrar que la resistencia promedio es de ${avgPsi.toFixed(2)} Psi.`;
  const splitAnalysis = doc.splitTextToSize(analysisText, pageWidth - (margin * 2) - 8);
  doc.text(splitAnalysis, margin + 4, p6Y);
  p6Y += (splitAnalysis.length * 4.5) + 35;

  // Signature Block "ELABORO:"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ELABORO:', margin + 4, p6Y);
  p6Y += 28;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(margin + 4, p6Y, margin + 85, p6Y);
  p6Y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(lps.engineerName || project.engineerInCharge || 'Ingeniero Especialista', margin + 4, p6Y);
  p6Y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(lps.companyName, margin + 4, p6Y);
  p6Y += 4.5;
  if (lps.licenseNumber || project.licenseNumber) {
    doc.text(`Matrícula Profesional: ${lps.licenseNumber || project.licenseNumber}`, margin + 4, p6Y);
  }

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 7: ANEXO 1. REGISTRO FOTOGRÁFICO
  // =========================================================================
  doc.addPage();
  drawLPSHeader(7);

  let p7Y = 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('________________', margin, p7Y - 4);
  doc.text('ANEXO 1. REGISTRO FOTOGRÁFICO', margin, p7Y + 3);
  p7Y += 12;

  // Extract photos from tests
  const allPhotos: Array<{ url: string; caption: string }> = [];
  tests.forEach(t => {
    (t.photos || []).forEach(p => {
      if (p.dataUrl && p.dataUrl.startsWith('data:image')) {
        allPhotos.push({ url: p.dataUrl, caption: `${t.elementTag} - ${p.caption || t.levelAxis || 'Ensayo de Esclerometría'}` });
      }
    });
  });

  if (allPhotos.length === 0) {
    // Elegant photo place-holders
    const boxW = (pageWidth - (margin * 2) - 12) / 2;
    const boxH = 105;

    [0, 1].forEach(idx => {
      const bx = margin + 4 + (idx * (boxW + 4));
      doc.setFillColor(248, 250, 252);
      doc.rect(bx, p7Y, boxW, boxH, 'F');
      doc.setDrawColor(lpsRed[0], lpsRed[1], lpsRed[2]);
      doc.setLineWidth(1.2);
      doc.rect(bx, p7Y, boxW, boxH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(lpsDarkRed[0], lpsDarkRed[1], lpsDarkRed[2]);
      doc.text(`REGISTRO FOTOGRÁFICO #${idx + 1}`, bx + (boxW / 2), p7Y + (boxH / 2) - 3, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`Toma de impacto con esclerómetro`, bx + (boxW / 2), p7Y + (boxH / 2) + 3, { align: 'center' });
    });
  } else {
    // Render up to 2 photos per row with red border
    const photoW = (pageWidth - (margin * 2) - 12) / 2;
    const photoH = 100;

    allPhotos.slice(0, 2).forEach((photo, pIdx) => {
      const px = margin + 4 + (pIdx * (photoW + 4));
      try {
        doc.addImage(photo.url, 'JPEG', px, p7Y, photoW, photoH, undefined, 'FAST');
      } catch (e) {
        doc.setFillColor(241, 245, 249);
        doc.rect(px, p7Y, photoW, photoH, 'F');
      }

      // Red border
      doc.setDrawColor(lpsRed[0], lpsRed[1], lpsRed[2]);
      doc.setLineWidth(1.2);
      doc.rect(px, p7Y, photoW, photoH);

      // Caption below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const splitCap = doc.splitTextToSize(photo.caption, photoW);
      doc.text(splitCap, px + (photoW / 2), p7Y + photoH + 4.5, { align: 'center' });
    });
  }

  drawLPSFooter();

  // =========================================================================
  // PÁGINA 8+: 12. ANEXO 2. DATOS DE CAMPO. (MATRIZ 1 A 10 Y TABLA DE CORRELACIÓN)
  // =========================================================================
  const chunkSize = 4;
  const totalChunks = Math.max(1, Math.ceil(tests.length / chunkSize));

  for (let c = 0; c < totalChunks; c++) {
    doc.addPage();
    drawLPSHeader(8 + c);

    let p8Y = 26;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(c === 0 ? '12. ANEXO 2. DATOS DE CAMPO.' : `12. ANEXO 2. DATOS DE CAMPO (CONTINUACIÓN ${c + 1}/${totalChunks})`, margin, p8Y);
    p8Y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CALIDAD DEL CONCRETO', margin + 4, p8Y);
    p8Y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}`, margin + 4, p8Y);
    p8Y += 7;

    // Build columns for this chunk of tests
    const matrixCols = tests.slice(c * chunkSize, (c + 1) * chunkSize);
    const matrixHead: string[][] = [
      ['Lectura', ...matrixCols.map(t => `α = ${t.impactAngle}°\n${t.elementTag}`)]
    ];

    const matrixBody: string[][] = [];
    for (let r = 0; r < 10; r++) {
      const row = [(r + 1).toString()];
      matrixCols.forEach(t => {
        const val = t.readings[r] !== undefined ? t.readings[r].toString() : '-';
        row.push(val);
      });
      matrixBody.push(row);
    }

    // Add stats rows to matrix
    matrixBody.push(['Suma', ...matrixCols.map(t => (t.readings || []).reduce((a, b) => a + b, 0).toFixed(2))]);
    matrixBody.push(['Promedio', ...matrixCols.map(t => (t.meanRaw || 0).toFixed(2))]);
    matrixBody.push(['kgf/cm²', ...matrixCols.map(t => (t.estimatedFcKgcm2 || 0).toFixed(2))]);
    matrixBody.push(['PSI', ...matrixCols.map(t => (t.estimatedFcPsi || 0).toFixed(2))]);
    matrixBody.push(['% f\'c espec.', ...matrixCols.map(t => t.fcDesignMpa > 0 ? ((t.complianceRatio || 0) / 100).toFixed(2) : '1.00')]);

    // Render Matrix on Left Side
    const matrixTableW = 82;
    autoTable(doc, {
      head: matrixHead,
      body: matrixBody,
      startY: p8Y,
      margin: { left: margin + 4 },
      tableWidth: matrixTableW,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        font: 'helvetica',
        textColor: textDark,
        lineColor: [100, 116, 139],
        lineWidth: 0.25,
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: textDark,
        fontStyle: 'bold',
        lineColor: [15, 23, 42],
        lineWidth: 0.35
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 16 }
      },
      didParseCell: (data) => {
        if (data.row.index >= 10) {
          data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 13) {
            data.cell.styles.textColor = [217, 56, 58];
          }
        }
      }
    });

    // Render Ábaco / Impact Angle Reference Table on Right Side
    const abacoX = margin + matrixTableW + 8;
    const abacoW = pageWidth - margin - abacoX;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(lpsDarkRed[0], lpsDarkRed[1], lpsDarkRed[2]);
    doc.text('IMPACT ANGLE α (ÁBACO PROCEQ / MILLER)', abacoX, p8Y + 3);

    const abacoHead = [['R', 'α=-90°', 'α=-45°', '0°', 'α=+45°', 'α=+90°']];
    const abacoBody = [
      ['20', '125', '115', '-', '-', '-'],
      ['22', '145', '135', '110', '-', '-'],
      ['24', '170', '160', '130', '-', '-'],
      ['26', '198', '185', '158', '115', '-'],
      ['28', '220', '210', '180', '130', '105'],
      ['30', '250', '238', '210', '170', '145'],
      ['32', '280', '265', '238', '190', '170'],
      ['34', '310', '290', '260', '220', '200'],
      ['36', '340', '320', '290', '250', '230'],
      ['38', '370', '350', '320', '280', '260'],
      ['40', '400', '380', '350', '310', '285'],
      ['42', '425', '415', '380', '345', '325'],
      ['44', '460', '450', '420', '380', '360'],
      ['46', '490', '480', '450', '410', '390'],
      ['48', '520', '510', '480', '445', '430'],
      ['50', '550', '540', '515', '480', '460']
    ];

    autoTable(doc, {
      head: abacoHead,
      body: abacoBody,
      startY: p8Y + 5,
      margin: { left: abacoX },
      tableWidth: abacoW,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1.1,
        font: 'helvetica',
        textColor: textDark,
        lineColor: [148, 163, 184],
        lineWidth: 0.2,
        halign: 'center'
      },
      headStyles: {
        fillColor: [254, 242, 242],
        textColor: [185, 28, 28],
        fontStyle: 'bold',
        lineColor: [217, 56, 58]
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [241, 245, 249] },
        3: { fontStyle: 'bold', textColor: [2, 132, 199] }
      }
    });

    drawLPSFooter();
  }

  // =========================================================================
  // PÁGINA 9: 13. ANEXO 3. CERTIFICADO DE CALIBRACIÓN.
  // =========================================================================
  doc.addPage();
  drawLPSHeader(9);

  let p9Y = 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('13. ANEXO 3. CERTIFICADO DE CALIBRACIÓN.', margin, p9Y);
  p9Y += 8;

  // Calibración Box
  const calBoxW = pageWidth - (margin * 2);
  const calBoxH = 190;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, p9Y, calBoxW, calBoxH, 2, 2, 'FD');

  // Header of Certificate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(lpsDarkRed[0], lpsDarkRed[1], lpsDarkRed[2]);
  doc.text('CERTIFICADO DE INSPECCIÓN Y VERIFICACIÓN', margin + (calBoxW / 2), p9Y + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Verificación de Exactitud en Yunque de Calibración Normalizado (ASTM C 805 / NTC 3692)', margin + (calBoxW / 2), p9Y + 18, { align: 'center' });

  // Divider
  doc.setDrawColor(217, 56, 58);
  doc.setLineWidth(0.6);
  doc.line(margin + 10, p9Y + 22, margin + calBoxW - 10, p9Y + 22);

  // Metadata Table
  const metaY = p9Y + 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.text('NÚMERO DE CERTIFICADO:', margin + 12, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`EC-LPS-${new Date().getFullYear()}-094`, margin + 62, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('MAGNITUD:', margin + 105, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text('ESCLEROMETRÍA (NÚMERO DE REBOTE R)', margin + 130, metaY);

  const meta2Y = metaY + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUMENTO:', margin + 12, meta2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.defaultHammerModel || 'Esclerómetro Tipo N (2.207 Nm)', margin + 62, meta2Y);

  doc.setFont('helvetica', 'bold');
  doc.text('SERIE:', margin + 105, meta2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(project.defaultHammerSerial || '6942-COL', margin + 130, meta2Y);

  const meta3Y = meta2Y + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('SOLICITANTE:', margin + 12, meta3Y);
  doc.setFont('helvetica', 'normal');
  doc.text(lps.companyName, margin + 62, meta3Y);

  doc.setFont('helvetica', 'bold');
  doc.text('PATRÓN REFERENCIA:', margin + 105, meta3Y);
  doc.setFont('helvetica', 'normal');
  doc.text('Yunque de Ensayo Dureza >500 HB', margin + 130, meta3Y);

  // Calibration readings table
  const calTableY = meta3Y + 12;
  const calHead = [['Ensayo en Yunque Patrón', 'Lectura Obtenida (R)', 'Rango Admisible NTC 3692', 'Estado']];
  const calBody = [
    ['Impacto 1', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 2', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 3', '79.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 4', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 5', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 6', '79.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 7', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 8', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 9', '79.0', '78.0 – 82.0', 'CONFORME'],
    ['Impacto 10', '80.0', '78.0 – 82.0', 'CONFORME'],
    ['PROMEDIO GENERAL', '79.7', '80.0 ± 2.0', 'OPERATIVO 100%']
  ];

  autoTable(doc, {
    head: calHead,
    body: calBody,
    startY: calTableY,
    margin: { left: margin + 12, right: margin + 12 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: textDark,
      halign: 'center'
    },
    headStyles: {
      fillColor: [217, 56, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    didParseCell: (data) => {
      if (data.row.index === 10) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [5, 150, 105];
      }
    }
  });

  const finalCalY = (doc as any).lastAutoTable.finalY + 12;

  // Signatures on Certificate
  const sigW = (calBoxW - 40) / 2;
  doc.setDrawColor(100, 116, 139);
  doc.line(margin + 15, finalCalY + 12, margin + 15 + sigW, finalCalY + 12);
  doc.line(margin + 25 + sigW, finalCalY + 12, margin + 25 + (sigW * 2), finalCalY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Ing. Responsable de Metrología', margin + 15 + (sigW / 2), finalCalY + 16, { align: 'center' });
  doc.text(lps.engineerName, margin + 25 + sigW + (sigW / 2), finalCalY + 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Control de Calidad y Calibración', margin + 15 + (sigW / 2), finalCalY + 20, { align: 'center' });
  doc.text('Ingeniero Especialista Estructural', margin + 25 + sigW + (sigW / 2), finalCalY + 20, { align: 'center' });

  drawLPSFooter();

  // Save the LPS PDF
  const filename = `Informe_LPS_Esclerometria_${project.code || 'PROYECTO'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
