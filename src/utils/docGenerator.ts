import { Project, SclerometryTest } from '../types';
import { calculateProjectAverageMetrics } from '../components/ProjectAverageTable';

export function generateStandardWordDocument(project: Project, tests: SclerometryTest[]): string {
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'CUMPLE').length;
  const doubtfulTests = tests.filter(t => t.status === 'DUDOSO').length;
  const failedTests = tests.filter(t => t.status === 'NO_CUMPLE').length;
  const diagnosticTests = tests.filter(t => t.status === 'DIAGNOSTICO').length;
  const testsWithDesign = tests.filter(t => t.fcDesignMpa > 0 || (t.fcDesignPsi && t.fcDesignPsi > 0));
  const compliancePct = testsWithDesign.length > 0 ? Math.round((passedTests / testsWithDesign.length) * 100) : 100;

  const now = new Date();
  const reportCode = `INF-${project.code || 'OBRA'}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const dateStr = now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalPsiSum = tests.reduce((acc, t) => acc + (t.estimatedFcPsi || 0), 0);
  const avgPsi = tests.length > 0 ? (totalPsiSum / tests.length) : 0;
  const avgMpa = avgPsi * 0.00689476;
  const projMetrics = calculateProjectAverageMetrics(tests);

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>INFORME TÉCNICO DE ESCLEROMETRÍA - ${project.name}</title>
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
      margin: 1.8cm 1.5cm 1.8cm 1.5cm;
      mso-header-margin: 36pt;
      mso-footer-margin: 36pt;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.35;
      color: #0f172a;
      background-color: #ffffff;
    }
    .header-banner {
      background-color: #0e4a6e;
      color: #ffffff;
      padding: 14px 18px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      color: #ffffff;
    }
    .header-table td {
      border: none;
      padding: 0;
      vertical-align: middle;
    }
    .header-title {
      font-size: 13pt;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }
    .header-subtitle {
      font-size: 8.5pt;
      color: #bae6fd;
      margin: 0;
    }
    .header-code {
      font-size: 8.5pt;
      font-weight: bold;
      color: #ffffff;
      text-align: right;
    }
    .header-date {
      font-size: 8pt;
      color: #e0f2fe;
      text-align: right;
    }
    
    /* 2 Columns Box layout */
    .info-container-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 0;
      margin-bottom: 14px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0284c7;
      padding: 10px 12px;
      vertical-align: top;
      width: 50%;
    }
    .info-card.responsible {
      border-left-color: #10b981;
    }
    .card-title {
      font-size: 9pt;
      font-weight: bold;
      color: #0e4a6e;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      text-transform: uppercase;
    }
    .card-row {
      font-size: 8.5pt;
      margin-bottom: 4px;
    }
    .card-label {
      font-weight: bold;
      color: #64748b;
      width: 90px;
      display: inline-block;
    }
    .card-value {
      color: #0f172a;
      font-weight: 500;
    }

    /* KPI Stats Bar */
    .kpi-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      margin-bottom: 16px;
      text-align: center;
    }
    .kpi-table td {
      padding: 8px 6px;
      border-right: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    .kpi-table td:last-child {
      border-right: none;
    }
    .kpi-label {
      font-size: 7pt;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 12pt;
      font-weight: bold;
    }

    /* Section Headings */
    .section-header {
      font-size: 9.5pt;
      font-weight: bold;
      color: #0e4a6e;
      margin: 14px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 14px;
    }
    .data-table th {
      background-color: #0e4a6e;
      color: #ffffff;
      font-weight: bold;
      padding: 6px 4px;
      border: 1px solid #0369a1;
      text-align: center;
      vertical-align: middle;
    }
    .data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 4px;
      text-align: center;
      vertical-align: middle;
    }
    .data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    /* Status Badges */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-weight: bold;
      font-size: 7.5pt;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-cumple {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .badge-dudoso {
      background-color: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .badge-nocumple {
      background-color: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
    }
    .badge-diag {
      background-color: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }

    /* Normative Recommendations Box */
    .criteria-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 18px;
    }
    .criteria-title {
      font-size: 8.5pt;
      font-weight: bold;
      color: #0e4a6e;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .criteria-list {
      margin: 0;
      padding-left: 16px;
      font-size: 7.5pt;
      color: #334155;
      line-height: 1.4;
    }
    .criteria-list li {
      margin-bottom: 3px;
    }

    /* Signatures */
    .signatures-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 40px 0;
      margin-top: 24px;
      margin-bottom: 14px;
    }
    .signatures-table td {
      border: none;
      text-align: center;
      vertical-align: top;
      width: 50%;
    }
    .signature-line {
      border-top: 1px solid #475569;
      width: 80%;
      margin: 0 auto 6px auto;
    }
    .sig-name {
      font-size: 8.5pt;
      font-weight: bold;
      color: #0f172a;
    }
    .sig-role {
      font-size: 7.5pt;
      color: #64748b;
    }
    .sig-matricula {
      font-size: 7pt;
      color: #0284c7;
      font-weight: bold;
    }

    /* Footer */
    .doc-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      font-size: 7pt;
      color: #94a3b8;
      width: 100%;
    }
    .doc-footer table {
      width: 100%;
      border: none;
    }
    .doc-footer td {
      border: none;
      padding: 0;
    }
  </style>
</head>
<body>

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <table class="header-table">
      <tr>
        <td style="width: 70%;">
          <div class="header-title">INFORME TÉCNICO DE ENSAYOS DE ESCLEROMETRÍA</div>
          <div class="header-subtitle">Evaluación No Destructiva del Concreto Endurecido • NTC 3692 / ASTM C805 / NSR-10 C.5</div>
        </td>
        <td style="width: 30%;">
          <div class="header-code">CÓDIGO: ${reportCode}</div>
          <div class="header-date">Fecha: ${dateStr}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PROJECT AND RESPONSIBLE DATA -->
  <table class="info-container-table">
    <tr>
      <!-- BOX 1: INFORMACION DE LA OBRA -->
      <td class="info-card">
        <div class="card-title">1. INFORMACIÓN DE LA OBRA</div>
        <div class="card-row"><span class="card-label">Obra:</span> <span class="card-value">${project.name}</span></div>
        <div class="card-row"><span class="card-label">Código:</span> <span class="card-value">${project.code || 'N/A'}</span></div>
        <div class="card-row"><span class="card-label">Cliente:</span> <span class="card-value">${project.client || 'N/A'}</span></div>
        <div class="card-row"><span class="card-label">Ubicación:</span> <span class="card-value">${project.location || ''}, ${project.municipality} (${project.department})</span></div>
      </td>

      <!-- BOX 2: RESPONSABLES Y EQUIPO -->
      <td class="info-card responsible">
        <div class="card-title">2. RESPONSABLES Y EQUIPO</div>
        <div class="card-row"><span class="card-label">Contratista:</span> <span class="card-value">${project.contractor || 'N/A'}</span></div>
        <div class="card-row"><span class="card-label">Interventoría:</span> <span class="card-value">${project.supervision || 'N/A'}</span></div>
        <div class="card-row"><span class="card-label">Especialista:</span> <span class="card-value">${project.engineerInCharge} ${project.licenseNumber ? `(${project.licenseNumber})` : ''}</span></div>
        <div class="card-row"><span class="card-label">Equipo/Serial:</span> <span class="card-value">${project.defaultHammerModel} (S/N: ${project.defaultHammerSerial || 'N/A'})</span></div>
      </td>
    </tr>
  </table>

  <!-- KPI STATS SUMMARY BAR -->
  <table class="kpi-table">
    <tr>
      <td>
        <div class="kpi-label">TOTAL ENSAYOS</div>
        <div class="kpi-val" style="color: #0f172a;">${totalTests}</div>
      </td>
      <td>
        <div class="kpi-label">CONFORMES (&gt;=95%)</div>
        <div class="kpi-val" style="color: #059669;">${passedTests}</div>
      </td>
      <td>
        <div class="kpi-label">ZONA DUDOSA (80-95%)</div>
        <div class="kpi-val" style="color: #d97706;">${doubtfulTests}</div>
      </td>
      <td>
        <div class="kpi-label">NO CONFORME (&lt;80%)</div>
        <div class="kpi-val" style="color: #e11d48;">${failedTests}</div>
      </td>
      <td>
        <div class="kpi-label">${diagnosticTests > 0 ? 'DIAGNÓSTICO IN-SITU' : 'ÍNDICE CONFORMIDAD'}</div>
        <div class="kpi-val" style="color: ${diagnosticTests > 0 ? '#0284c7' : (compliancePct >= 90 ? '#059669' : '#d97706')};">
          ${diagnosticTests > 0 ? diagnosticTests : `${compliancePct}%`}
        </div>
      </td>
    </tr>
  </table>

  <!-- RESULTS SECTION & DATA TABLE -->
  <div class="section-header">3. RESUMEN EJECUTIVO DE RESULTADOS DE ESCLEROMETRÍA (NTC 3692)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th style="width: 140px;">Elemento / Tipo</th>
        <th style="width: 90px;">Nivel / Eje</th>
        <th style="width: 65px;">f'c Dis.<br>(PSI)</th>
        <th style="width: 75px;">Ángulo</th>
        <th style="width: 50px;">R Crudo</th>
        <th style="width: 40px;">ΔR</th>
        <th style="width: 50px;">R Corr.</th>
        <th style="width: 70px;">f'c Est.<br>(PSI)</th>
        <th style="width: 65px;">f'c Est.<br>(MPa)</th>
        <th style="width: 55px;">% Cumpl.</th>
        <th style="width: 85px;">Estado NTC</th>
      </tr>
    </thead>
    <tbody>
      ${tests.map((t, index) => {
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

        const fcDesignText = (t.fcDesignPsi && t.fcDesignPsi > 0) 
          ? `${t.fcDesignPsi}` 
          : (t.fcDesignMpa > 0 ? `${Math.round(t.fcDesignMpa * 145.038)}` : 'N/A');

        const hasDesign = (t.fcDesignMpa > 0 || (t.fcDesignPsi && t.fcDesignPsi > 0));
        const complianceText = hasDesign ? `${t.complianceRatio}%` : 'N/A';
        
        let badgeClass = 'badge-diag';
        let statusLabel = 'DIAGNÓSTICO';

        if (t.status === 'CUMPLE') {
          badgeClass = 'badge-cumple';
          statusLabel = 'CUMPLE';
        } else if (t.status === 'DUDOSO') {
          badgeClass = 'badge-dudoso';
          statusLabel = 'DUDOSO';
        } else if (t.status === 'NO_CUMPLE') {
          badgeClass = 'badge-nocumple';
          statusLabel = 'NO CUMPLE';
        } else if (t.status === 'INVALIDO') {
          badgeClass = 'badge-nocumple';
          statusLabel = 'INVÁLIDO';
        }

        return `
        <tr>
          <td><b>${index + 1}</b></td>
          <td style="text-align: left; padding-left: 6px;">
            <b>${t.elementTag}</b><br>
            <span style="font-size: 7pt; color: #64748b;">(${t.elementType})</span>
          </td>
          <td>${t.levelAxis || 'N/A'}</td>
          <td><b>${fcDesignText}</b></td>
          <td>${angleText}</td>
          <td>${t.meanRaw}</td>
          <td>${t.correctionAngle >= 0 ? `+${t.correctionAngle}` : t.correctionAngle}</td>
          <td style="font-weight: bold; background-color: #f1f5f9;">${t.meanCorrected}</td>
          <td style="font-weight: bold; color: #0284c7; font-size: 8.5pt;">${t.estimatedFcPsi.toLocaleString()}</td>
          <td><b>${t.estimatedFcMpa.toFixed(1)}</b></td>
          <td style="font-weight: bold;">${complianceText}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <!-- CUADRO PROMEDIO DEL PROYECTO COMPLETO (EXACTO DEL FORMATO DE CONTROL) -->
  <div style="margin: 14px 0 6px 0; font-weight: bold; font-size: 10pt; color: #0e4a6e;">
    3.1 CUADRO PROMEDIO DEL PROYECTO COMPLETO (RESISTENCIA GLOBAL)
  </div>
  <table style="border-collapse: collapse; border: 2px solid #000000; margin: 4px 0 16px 0; font-family: Arial, sans-serif; font-size: 10pt; width: 330px;">
    <tbody>
      <tr style="border-bottom: 1.5px solid #000000;">
        <td style="border: 1.5px solid #000000; padding: 5px 12px; font-weight: bold; color: #000000; background-color: #ffffff; width: 120px; text-align: left;">Promedio</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; font-weight: bold; text-align: center; color: #000000; background-color: #ffffff; width: 105px;">Σ</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; font-weight: bold; text-align: center; color: #dc2626; background-color: #ffffff; width: 105px;">psi</td>
      </tr>
      <tr style="border-bottom: 1.5px solid #000000;">
        <td style="border: 1.5px solid #000000; padding: 5px 12px; color: #000000; background-color: #ffffff; text-align: left;">resistencia</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; text-align: center; font-weight: bold; color: #000000; background-color: #ffffff;">${projMetrics.validCount > 0 ? projMetrics.sumPsi.toFixed(2) : '0.00'}</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; text-align: center; font-weight: bold; color: #dc2626; background-color: #ffffff;">${projMetrics.validCount > 0 ? projMetrics.avgPsi.toFixed(2) : '0.00'}</td>
      </tr>
      <tr>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; color: #000000; background-color: #ffffff; text-align: left;">% f'c espec.</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; text-align: center; font-weight: bold; color: #dc2626; background-color: #ffffff;">${projMetrics.hasDesign ? projMetrics.ratioFcEspec.toFixed(2) : 'N/A'}</td>
        <td style="border: 1.5px solid #000000; padding: 5px 12px; text-align: center; font-weight: bold; color: #dc2626; background-color: #ffffff;">${projMetrics.complianceLabel}</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 4: DETAILED READINGS TABLE (1 TO 10 IMPACTS) -->
  <div class="section-header">4. REGISTRO DETALLADO DE IMPACTOS INDIVIDUALES (1 A 10) Y ESTADÍSTICA DE CAMPO</div>
  <table class="data-table">
    <thead>
      <tr style="background-color: #1e293b;">
        <th style="width: 25px;">#</th>
        <th style="width: 120px;">Elemento</th>
        <th style="width: 45px;">Áng.</th>
        <th style="width: 25px;">I-1</th>
        <th style="width: 25px;">I-2</th>
        <th style="width: 25px;">I-3</th>
        <th style="width: 25px;">I-4</th>
        <th style="width: 25px;">I-5</th>
        <th style="width: 25px;">I-6</th>
        <th style="width: 25px;">I-7</th>
        <th style="width: 25px;">I-8</th>
        <th style="width: 25px;">I-9</th>
        <th style="width: 25px;">I-10</th>
        <th style="width: 45px;">R Prom.</th>
        <th style="width: 45px;">R Corr.</th>
        <th style="width: 65px;">f'c Est.<br>(PSI)</th>
        <th style="width: 45px;">CV%</th>
        <th style="width: 45px;">Válidas</th>
      </tr>
    </thead>
    <tbody>
      ${tests.map((t, index) => {
        const r = t.readings || [];
        const validCount = 10 - (t.excludedIndices?.length || 0);

        return `
        <tr>
          <td><b>${index + 1}</b></td>
          <td style="text-align: left; padding-left: 6px;"><b>${t.elementTag}</b></td>
          <td>${t.impactAngle > 0 ? `+${t.impactAngle}` : t.impactAngle}°</td>
          <td>${r[0] !== undefined ? `${r[0]}${t.excludedIndices?.includes(0) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[1] !== undefined ? `${r[1]}${t.excludedIndices?.includes(1) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[2] !== undefined ? `${r[2]}${t.excludedIndices?.includes(2) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[3] !== undefined ? `${r[3]}${t.excludedIndices?.includes(3) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[4] !== undefined ? `${r[4]}${t.excludedIndices?.includes(4) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[5] !== undefined ? `${r[5]}${t.excludedIndices?.includes(5) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[6] !== undefined ? `${r[6]}${t.excludedIndices?.includes(6) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[7] !== undefined ? `${r[7]}${t.excludedIndices?.includes(7) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[8] !== undefined ? `${r[8]}${t.excludedIndices?.includes(8) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td>${r[9] !== undefined ? `${r[9]}${t.excludedIndices?.includes(9) ? '<span style="color:#ef4444;font-weight:bold;">*</span>' : ''}` : '-'}</td>
          <td><b>${t.meanRaw}</b></td>
          <td style="font-weight: bold; background-color: #f1f5f9;">${t.meanCorrected}</td>
          <td style="font-weight: bold; color: #0284c7;">${t.estimatedFcPsi.toLocaleString()}</td>
          <td>${t.cov || 0}%</td>
          <td style="font-weight: bold; color: ${validCount === 10 ? '#059669' : '#d97706'};">${validCount}/10</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <div style="font-size: 7pt; color: #64748b; margin-top: -8px; margin-bottom: 12px; font-style: italic;">
    * Nota: Valores con asterisco (*) indican lecturas descartadas automáticamente al diferir en más de 6 unidades respecto al promedio inicial (NTC 3692 / ASTM C805).
  </div>

  <!-- SECTION 5: CRITERIOS TÉCNICOS Y RECOMENDACIONES -->
  <div class="criteria-box">
    <div class="criteria-title">5. CRITERIOS TÉCNICOS Y RECOMENDACIONES NORMATIVAS (NSR-10 / NTC 3692)</div>
    <ul class="criteria-list">
      <li><b>METODOLOGÍA:</b> Se efectuaron 10 impactos por punto de ensayo según norma NTC 3692 / ASTM C805. Se aplicó descarte automático de lecturas con desviación mayor a 6 unidades respecto al promedio.</li>
      <li><b>CONFORMIDAD:</b> Los elementos en estado <b>CUMPLE</b> registran una resistencia estimada &gt;= 95% del f'c de diseño especificado, indicando adecuada calidad superficial y compresión estimada.</li>
      <li><b>ZONA DUDOSA (NSR-10 C.5.6.5):</b> Los elementos con resistencia entre 80% y 95% del f'c requieren verificación complementaria mediante extracción de núcleos diamantados (NTC 3658 / ASTM C42).</li>
      <li><b>NO CONFORMIDAD:</b> Los elementos con resistencia estimada menor al 80% del f'c de diseño deben ser evaluados de inmediato por el Ingeniero Diseñador Estructural de la edificación.</li>
    </ul>
  </div>

  <!-- SECTION 5: SIGNATURES -->
  <table class="signatures-table">
    <tr>
      <td>
        <div class="signature-line"></div>
        <div class="sig-name">${project.engineerInCharge || 'Ingeniero Especialista'}</div>
        <div class="sig-role">Ingeniero Especialista Responsable</div>
        ${project.licenseNumber ? `<div class="sig-matricula">Matrícula COPNIA: ${project.licenseNumber}</div>` : ''}
      </td>
      <td>
        <div class="signature-line"></div>
        <div class="sig-name">${project.supervision || 'Interventoría Técnica'}</div>
        <div class="sig-role">Supervisión Técnica / Interventoría de Obra</div>
        <div class="sig-role" style="font-size: 7pt;">Aprobación y Recibido</div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="doc-footer">
    <table>
      <tr>
        <td style="text-align: left;">
          Esclerometría Pro Colombia • Software de Evaluación NTC 3692 / ASTM C805 / NSR-10 • Obra: ${project.name}
        </td>
        <td style="text-align: right;">
          Documento emitido: ${dateStr}
        </td>
      </tr>
    </table>
  </div>

</body>
</html>`;
}

export function downloadStandardWordDocument(project: Project, tests: SclerometryTest[]): void {
  const docHtml = generateStandardWordDocument(project, tests);
  const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const projectCode = project.code || 'OBRA';
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `Informe_Tecnico_Esclerometria_${projectCode}_${dateStr}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
