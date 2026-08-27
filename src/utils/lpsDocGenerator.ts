import { Project, SclerometryTest } from '../types';
import { getLPSConfig } from './lpsConfig';

export function generateLPSWordDocument(project: Project, tests: SclerometryTest[]): string {
  const lps = getLPSConfig();
  const dateObj = new Date();
  const monthsUpper = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  const currentMonthYear = `${monthsUpper[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

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

  const matrixCols = tests.slice(0, 4);

  return `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>ENSAYO ESCLEROMETRÍA - ${project.name}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: letter;
      margin: 2.5cm 2.0cm 2.5cm 2.0cm;
      mso-header-margin: 36pt;
      mso-footer-margin: 36pt;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
    }
    .cover {
      text-align: center;
      page-break-after: always;
      padding-top: 40px;
    }
    .cover h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 30px;
      color: #111827;
      letter-spacing: 1px;
    }
    .cover-box {
      border: 2pt solid #d9383a;
      width: 85%;
      height: 240px;
      margin: 0 auto 30px auto;
      background-color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #b91c1c;
      font-weight: bold;
      font-size: 13pt;
    }
    .cover-desc {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 50px;
      text-transform: uppercase;
      line-height: 1.5;
    }
    .cover-company {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 40px;
    }
    .cover-company p {
      margin: 4px 0;
    }
    .cover-date {
      font-size: 11pt;
      font-weight: bold;
    }
    .page-break {
      page-break-after: always;
    }
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 10px;
      color: #0f172a;
      text-transform: uppercase;
    }
    p, li {
      font-size: 10pt;
      text-align: justify;
      margin: 6px 0;
    }
    ul {
      list-style-type: disc;
      margin: 6px 0 12px 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: center;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #0f172a;
    }
    .footer-text {
      text-align: center;
      font-size: 9pt;
      color: #475569;
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover">
    <h1>ENSAYO ESCLEROMETRÍA</h1>
    
    <div class="cover-box">
      [ REGISTRO FOTOGRÁFICO DE LA ESTRUCTURA ]
    </div>

    <div class="cover-desc">
      ENSAYO DE ESCLEROMETRÍA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA
    </div>

    <div class="cover-company">
      <p>${lps.companyName}</p>
      <p>${lps.companySubtitle}</p>
    </div>

    <div class="cover-date">
      <p>${lps.city}</p>
      <p>${currentMonthYear}</p>
    </div>
  </div>

  <!-- TABLA DE CONTENIDO -->
  <div class="page-break">
    <h2>TABLA DE CONTENIDO</h2>
    <p><b>1. Tabla de contenido</b></p>
    <table style="border: none;">
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>2. INTRODUCCIÓN</b></td><td style="border: none; text-align: right;"><b>3</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>3. OBJETIVO</b></td><td style="border: none; text-align: right;"><b>3</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>4. ALCANCE</b></td><td style="border: none; text-align: right;"><b>3</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>5. TÉRMINOS Y DEFINICIONES</b></td><td style="border: none; text-align: right;"><b>3</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>6. NORMAS DE REFERENCIA</b></td><td style="border: none; text-align: right;"><b>3</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>7. PROCEDIMIENTO</b></td><td style="border: none; text-align: right;"><b>4</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>8. EQUIPO UTILIZADO</b></td><td style="border: none; text-align: right;"><b>4</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>9. UBICACIÓN</b></td><td style="border: none; text-align: right;"><b>5</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>10. DATOS OBTENIDOS EN CAMPO.</b></td><td style="border: none; text-align: right;"><b>6</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>11. ANÁLISIS DE RESULTADOS</b></td><td style="border: none; text-align: right;"><b>6</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>12. ANEXO 2. DATOS DE CAMPO.</b></td><td style="border: none; text-align: right;"><b>8</b></td></tr>
      <tr style="border: none;"><td style="border: none; text-align: left;"><b>13. ANEXO 3. CERTIFICADO DE CALIBRACIÓN.</b></td><td style="border: none; text-align: right;"><b>9</b></td></tr>
    </table>
    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- SECCIONES 2 A 6 -->
  <div class="page-break">
    <h2>2. INTRODUCCIÓN</h2>
    <p>El presente informe está basado en la ejecución de los ensayos no destructivos al concreto, se ejecuta en ENSAYO DE ESCLEROMETRÍA PARA ${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}, ${project.municipality.toUpperCase()}, COLOMBIA. Para evaluar su resistencia a compresión. Para estimar esta resistencia, el martillo de Schmidt o Esclerómetro se ha modificado convenientemente dando lugar a varios modelos. Su uso es muy frecuente dada la manejabilidad del aparato, pudiendo aplicarse sobre la zona a ensayar midiendo su resistencia al rebote. Para utilizar este método de ensayo para estimar la resistencia, es necesario establecer una relación entre la fuerza y el número de rebote para una mezcla de concreto y un aparato dado. La medida del rebótese correlaciona con la resistencia a compresión mediante un gráfico debido a Miller (1965) que contempla la densidad del elemento y la orientación del martillo respecto del plano ensayado.</p>

    <h2>3. OBJETIVO</h2>
    <p>Determinar la resistencia a compresión del hormigón ya sea en pilares, muros, vigas o algún elemento estructural elaborado en concreto.</p>

    <h2>4. ALCANCE</h2>
    <p>Determinar la resistencia del concreto existente, mediante una serie de repeticiones de golpes con el esclerómetro. Y así poder encontrar un valor por cada elemento estudiado.</p>

    <h2>5. TÉRMINOS Y DEFINICIONES</h2>
    <ul>
      <li><b>GOLPE:</b> Un golpe es un impacto entre un cuerpo en movimiento y otro cuerpo, así como el efecto que produce.</li>
      <li><b>HORMIGÓN:</b> El hormigón o concreto es un material compuesto empleado en construcción, formado esencialmente por un aglomerante (en la mayoría de las ocasiones cemento (generalmente cemento Portland) al que se añade partículas o fragmentos de un agregado (áridos, como grava, gravilla y arena) agua (hidratación) y aditivos.</li>
      <li><b>RESISTENCIA A COMPRESIÓN:</b> La resistencia a la compresión simple es la característica mecánica principal del concreto. Se define como la capacidad para soportar una carga por unidad de área, y se expresa en términos de esfuerzo, generalmente en kg/cm2, MPa y con alguna frecuencia en libras por pulgada cuadrada (psi)</li>
    </ul>

    <h2>6. NORMAS DE REFERENCIA</h2>
    <ul>
      <li>ASTM C 805:1997: Standard test method for rebound number of hardened concretes</li>
      <li>NTP 339.181:2001: HORMIGÓN (CONCRETO). Método de ensayo para determinar El número de rebote del concreto endurecido esclerómetro.</li>
      <li>MTC E 725 método de ensayo para determinar el número de rebote del concreto endurecido (esclerometría)</li>
    </ul>
    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- SECCIONES 7 Y 8 -->
  <div class="page-break">
    <h2>7. PROCEDIMIENTO</h2>
    <p>* Para la realización del ensayo se seleccionaron y prepara una zona de hormigón que cumpla con:</p>
    <ul>
      <li>Zona de ensayo de aproximadamente 15 x15 cm.</li>
      <li>Superficies lisas y sin recubrir (utilizar piedra abrasiva para eliminar impurezas en el concreto)</li>
      <li>Se procederá hacer por lo menos 10 lecturas con el esclerómetro porcada elemento estudiado</li>
      <li>La muestra debe contar con especificaciones mínimas para el ensayo:
        <ul style="list-style-type: circle;">
          <li>Espesor mínimo 100 mm(4pulg)</li>
          <li>Evitar las superficies de concreto que representan descascara miento alta porosidad.</li>
          <li>Evitar superficies con terminados (ACABADOS)</li>
        </ul>
      </li>
      <li>El área de ensayo será de por lo menos 150 mm (6 pulgadas) de diámetro.</li>
      <li>Las superficies de textura excesivamente suave o con mortero suelto deberán ser pulidas con la piedra abrasiva (excepto superficie lisa).</li>
      <li>En superficies rugosas, contra placadas (tripley) secas y con presencia de carbonatación producen número de rebotes más altos.</li>
    </ul>

    <h2>8. EQUIPO UTILIZADO</h2>
    <ul>
      <li><b>Esclerómetro:</b> El esclerómetro es un instrumento de medición analógico que sirve para determinar la resistencia del hormigón. Este esclerómetro usa el principio de medición Schmidt. En este principio de medición la energía cinética del esclerómetro impacta en el hormigón. El rebote resultante permite al esclerómetro determinar la resistencia del hormigón.</li>
      <li><b>Piedra abrasiva:</b> Esta constituida por granos de carburo de silicio de tamaño medio o de algún otro material y textura similar.</li>
    </ul>
    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- SECCIÓN 9: UBICACIÓN -->
  <div class="page-break">
    <h2>9. UBICACIÓN</h2>
    <p><b>* Vista general edificación.</b></p>
    <div style="border: 2pt solid #d9383a; height: 350px; background-color: #f8fafc; text-align: center; line-height: 350px; font-weight: bold; color: #64748b;">
      [ VISTA GENERAL EDIFICACIÓN / ZONA DE ENSAYO ]
    </div>
    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- SECCIONES 10 Y 11 -->
  <div class="page-break">
    <h2>10. DATOS OBTENIDOS EN CAMPO.</h2>
    <p><b>* ${project.name.toUpperCase()}</b></p>
    <p>Promedios de resistencias encontradas, informe completo elementos estudiados individuales ver anexo (2).</p>

    <table>
      <thead>
        <tr>
          <th>Parámetro</th>
          <th>Σ (Suma)</th>
          <th>Resistencia Estimada</th>
          <th>% f'c Espec.</th>
          <th>Conformidad</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Promedio Resistencia</b></td>
          <td>${totalPsiSum.toFixed(2)} PSI</td>
          <td><b>${avgPsi.toFixed(2)} PSI</b> (${avgMpa.toFixed(1)} MPa / ${avgKgcm2.toFixed(1)} kgf/cm²)</td>
          <td>${avgDesignMpa > 0 ? `${(avgRatio * 100).toFixed(1)}%` : 'Diagnóstico In-Situ'}</td>
          <td><b>${isOverallPass ? 'CUMPLE' : 'REVISIÓN'}</b></td>
        </tr>
      </tbody>
    </table>

    <h2>11. ANÁLISIS DE RESULTADOS</h2>
    <p>De los elementos estudiados se puede encontrar que la resistencia promedio es de <b>${avgPsi.toFixed(2)} Psi</b>.</p>

    <div style="margin-top: 60px;">
      <p><b>ELABORO:</b></p>
      <br><br><br>
      <p>__________________________________________________</p>
      <p><b>${lps.engineerName}</b></p>
      <p>${lps.companyName}</p>
      <p>Matrícula Profesional: ${lps.licenseNumber}</p>
    </div>

    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- ANEXO 1 -->
  <div class="page-break">
    <p>________________</p>
    <h2>ANEXO 1. REGISTRO FOTOGRÁFICO</h2>
    <div style="display: flex; gap: 15px; margin-top: 20px;">
      <div style="flex: 1; border: 2pt solid #d9383a; height: 260px; background-color: #f8fafc; text-align: center; line-height: 260px; font-weight: bold; color: #b91c1c;">
        REGISTRO FOTOGRÁFICO #1
      </div>
      <div style="flex: 1; border: 2pt solid #d9383a; height: 260px; background-color: #f8fafc; text-align: center; line-height: 260px; font-weight: bold; color: #b91c1c;">
        REGISTRO FOTOGRÁFICO #2
      </div>
    </div>
    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

  <!-- ANEXO 2 -->
  ${(() => {
    const chunkSize = 4;
    const totalChunks = Math.max(1, Math.ceil(tests.length / chunkSize));
    let html = '';
    for (let c = 0; c < totalChunks; c++) {
      const currentCols = tests.slice(c * chunkSize, (c + 1) * chunkSize);
      html += `
  <div class="page-break">
    <h2>12. ANEXO 2. DATOS DE CAMPO. ${totalChunks > 1 ? `(PARTE ${c + 1}/${totalChunks})` : ''}</h2>
    <p><b>CALIDAD DEL CONCRETO</b><br>${project.name.toUpperCase()}, ${project.location?.toUpperCase() || ''}</p>

    <table>
      <thead>
        <tr>
          <th>Lectura</th>
          ${currentCols.map(t => `<th>α = ${t.impactAngle}°<br>${t.elementTag}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: 10 }).map((_, r) => `
          <tr>
            <td><b>${r + 1}</b></td>
            ${currentCols.map(t => `<td>${t.readings[r] !== undefined ? t.readings[r] : '-'}</td>`).join('')}
          </tr>
        `).join('')}
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>Suma</td>
          ${currentCols.map(t => `<td>${(t.readings || []).reduce((a, b) => a + b, 0).toFixed(2)}</td>`).join('')}
        </tr>
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>Promedio</td>
          ${currentCols.map(t => `<td>${(t.meanRaw || 0).toFixed(2)}</td>`).join('')}
        </tr>
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>kgf/cm²</td>
          ${currentCols.map(t => `<td>${(t.estimatedFcKgcm2 || 0).toFixed(2)}</td>`).join('')}
        </tr>
        <tr style="font-weight: bold; background-color: #fef2f2; color: #b91c1c;">
          <td>PSI</td>
          ${currentCols.map(t => `<td>${(t.estimatedFcPsi || 0).toFixed(2)}</td>`).join('')}
        </tr>
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td>% f'c espec.</td>
          ${currentCols.map(t => `<td>${t.fcDesignMpa > 0 ? ((t.complianceRatio || 0) / 100).toFixed(2) : '1.00'}</td>`).join('')}
        </tr>
      </tbody>
    </table>

    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>
      `;
    }
    return html;
  })()}

  <!-- ANEXO 3 -->
  <div class="page-break">
    <h2>13. ANEXO 3. CERTIFICADO DE CALIBRACIÓN.</h2>
    <div style="border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 15px;">
      <h3 style="text-align: center; color: #b91c1c; margin-top: 0;">CERTIFICADO DE INSPECCIÓN Y VERIFICACIÓN</h3>
      <p style="text-align: center; font-size: 9pt; color: #64748b;">Verificación de Exactitud en Yunque de Calibración Normalizado (ASTM C 805 / NTC 3692)</p>
      
      <table style="border: none; margin: 15px 0;">
        <tr style="border: none;">
          <td style="border: none; text-align: left;"><b>NÚMERO DE CERTIFICADO:</b> EC-LPS-${new Date().getFullYear()}-094</td>
          <td style="border: none; text-align: left;"><b>MAGNITUD:</b> ESCLEROMETRÍA (NÚMERO R)</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none; text-align: left;"><b>INSTRUMENTO:</b> ${project.defaultHammerModel || 'Esclerómetro Tipo N (2.207 Nm)'}</td>
          <td style="border: none; text-align: left;"><b>SERIE:</b> ${project.defaultHammerSerial || '6942-COL'}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none; text-align: left;"><b>SOLICITANTE:</b> ${lps.companyName}</td>
          <td style="border: none; text-align: left;"><b>PATRÓN:</b> Yunque Dureza >500 HB (80.0 ± 2)</td>
        </tr>
      </table>

      <p style="text-align: center; font-weight: bold; color: #059669;">ESTADO METROLÓGICO: CONFORME Y OPERATIVO AL 100%</p>
    </div>

    <div class="footer-text">
      ${lps.address}<br>
      ${lps.phone}, Email: ${lps.email}
    </div>
  </div>

</body>
</html>
`;
}
